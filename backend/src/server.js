import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { z } from "zod";
import { withTransaction } from "./db.js";
import { User, GameRoom, RoomPlayer, GameState, GameEvent } from "./models/index.js";
import { createInitialState } from "./state.js";

const port = Number(process.env.PORT ?? 3010);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
const app = express();
app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: "1mb" }));
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: frontendOrigin, methods: ["GET", "POST"] },
});

const createRoomSchema = z.object({ displayName: z.string().trim().min(1).max(40) });
const actionSchema = z.object({
  actionId: z.string().uuid(),
  type: z.enum(["object.interact", "puzzle.solved", "item.pickup"]),
  targetId: z.string().trim().min(1).max(100),
  payload: z.record(z.unknown()).default({}),
});
const movementSchema = z.object({
  position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  rotationY: z.number(),
});
const timelineSelectionSchema = z.object({ timeline: z.enum(["past", "present"]).nullable() });

const socketRoom = (roomId) => `game:${roomId}`;
const normaliseCode = (code) => code.trim().toUpperCase();
const makeJoinCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const getPlayerFromToken = async (roomId, token) => {
  const player = await RoomPlayer.findOne({
    where: { roomId, reconnectToken: token },
    include: [{ model: User, as: "user", attributes: ["displayName"], required: true }],
  });
  if (!player) return null;
  return {
    id: player.id,
    roomId: player.roomId,
    userId: player.userId,
    timeline: player.timeline,
    displayName: player.user.displayName,
  };
};

const getSnapshot = async (roomId, transaction) => {
  const snapshot = await GameState.findByPk(roomId, { attributes: ["revision", "state"], transaction, raw: true });
  if (!snapshot) throw new Error("La sala no existe.");
  return snapshot;
};

const getLobbyState = async (roomId, transaction) => {
  const players = await RoomPlayer.findAll({
    where: { roomId },
    include: [{ model: User, as: "user", attributes: ["displayName"], required: true }],
    order: [["joinedAt", "ASC"]],
    transaction,
  });
  return {
    players: players.map((player) => ({
      id: player.id,
      timeline: player.timeline,
      connected: player.connected,
      displayName: player.user.displayName,
    })),
  };
};

const setObjectState = (state, timeline, objectId, patch) => {
  const objects = state.timelines[timeline].objects;
  objects[objectId] = { ...objects[objectId], ...patch };
};

const kitchenNapkinIds = ["kitchen-napkin-red", "kitchen-napkin-green", "kitchen-napkin-blue", "kitchen-napkin-ochre"];
const kitchenIngredientIds = ["kitchen-tomatoes", "kitchen-carrots", "kitchen-cheese"];
const memoryPhotoIds = [
  "children-memory-photo-home",
  "children-memory-photo-school",
  "children-memory-photo-park",
  "children-memory-photo-station",
];
const finalLocks = {
  "final-bolt-bedroom": { keyId: "final-key-bedroom", timeline: "present" },
  "final-bolt-living-room": { keyId: "final-key-living-room", timeline: "present" },
  "final-bolt-children": { keyId: "final-key-children", timeline: "past" },
  "final-bolt-bathroom": { keyId: "final-key-bathroom", timeline: "past" },
};

const reduceAction = (state, player, action) => {
  const timeline = player.timeline;
  switch (action.type) {
    case "object.interact":
      if (action.targetId === "hallway-final-threshold") {
        const allUnlocked = Object.keys(finalLocks).every((lockId) => state.timelines.past.objects[lockId]?.unlocked);
        if (!allUnlocked) throw new Error("Primero hay que abrir los cuatro cerrojos.");
        state.ending ??= { phase: "threshold", holding: { past: false, present: false }, choice: null, sacrificeTimeline: null };
        if (state.ending.phase !== "threshold") return;
        state.ending.holding ??= { past: false, present: false };
        state.ending.holding[timeline] = action.payload?.operation === "hold-start";
        if (state.ending.holding.past && state.ending.holding.present) {
          state.ending.phase = "opening";
          state.ending.crossed = { past: false, present: false };
          for (const era of ["past", "present"]) {
            setObjectState(state, era, "hallway-street-door", { locked: false, open: true });
          }
        }
        return;
      }
      if (action.targetId === "hallway-final-crossed") {
        if (state.ending?.phase !== "opening") return;
        state.ending.crossed ??= { past: false, present: false };
        state.ending.crossed[timeline] = true;
        if (state.ending.crossed.past && state.ending.crossed.present) state.ending.phase = "choice";
        return;
      }
      if (action.targetId === "hallway-final-choice") {
        if (state.ending?.phase !== "choice") throw new Error("La puerta todavía no está preparada.");
        const choice = action.payload?.choice;
        if (!["together", "sacrifice"].includes(choice)) throw new Error("Ese desenlace no es válido.");
        state.ending.phase = "complete";
        state.ending.choice = choice;
        state.ending.sacrificeTimeline = choice === "sacrifice" ? timeline : null;
        return;
      }
      if (finalLocks[action.targetId]) {
        const lock = finalLocks[action.targetId];
        const keyIndex = state.inventories[timeline].indexOf(lock.keyId);
        if (timeline !== lock.timeline || keyIndex === -1) throw new Error("Necesitas la llave final con el mismo símbolo.");
        state.inventories[timeline].splice(keyIndex, 1);
        for (const era of ["past", "present"]) setObjectState(state, era, action.targetId, { unlocked: true });
        const allUnlocked = Object.keys(finalLocks).every((lockId) => state.timelines.past.objects[lockId]?.unlocked);
        if (allUnlocked) {
          state.ending ??= { phase: "locked", holding: { past: false, present: false }, choice: null, sacrificeTimeline: null };
          state.ending.phase = "threshold";
          state.ending.holding = { past: false, present: false };
        }
        return;
      }
      if (action.targetId === "bathroom-mosaic" && action.payload?.operation === "insert-tile") {
        const tileIndex = state.inventories.present.indexOf("bathroom-mosaic-tile");
        if (timeline !== "present" || tileIndex === -1) throw new Error("Necesitas el azulejo que está dentro del horno.");
        state.inventories.present.splice(tileIndex, 1);
        state.timelines.present.puzzles["bathroom-mosaic"] = {
          ...state.timelines.present.puzzles["bathroom-mosaic"],
          tileInserted: true,
        };
        return;
      }
      if (action.targetId === "kitchen-recipe") {
        if (timeline !== "present") throw new Error("La receta se prepara en el Mundo B.");
        const slotIndex = Number(action.payload.slotIndex);
        if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= kitchenIngredientIds.length) {
          throw new Error("Esa posición de la tabla no es válida.");
        }
        const currentPuzzle = state.timelines.present.puzzles[action.targetId] ?? {};
        if (currentPuzzle.solved) return;
        const placements = Array.isArray(currentPuzzle.placements)
          ? [...currentPuzzle.placements]
          : new Array(kitchenIngredientIds.length).fill(null);
        if (action.payload.operation === "place") {
          const ingredientId = action.payload.ingredientId;
          const ingredientIndex = state.inventories.present.indexOf(ingredientId);
          if (!kitchenIngredientIds.includes(ingredientId) || ingredientIndex === -1 || placements[slotIndex]) {
            throw new Error("No puedes colocar ese ingrediente en esta posición.");
          }
          state.inventories.present.splice(ingredientIndex, 1);
          placements[slotIndex] = ingredientId;
        } else if (action.payload.operation === "remove") {
          const ingredientId = placements[slotIndex];
          if (!ingredientId) return;
          placements[slotIndex] = null;
          if (!state.inventories.present.includes(ingredientId)) state.inventories.present.push(ingredientId);
        } else {
          throw new Error("La acción del ingrediente no es válida.");
        }
        const solved = placements.every((ingredientId, index) => ingredientId === kitchenIngredientIds[index]);
        state.timelines.present.puzzles[action.targetId] = {
          ...currentPuzzle,
          placements,
          solved,
        };
        if (solved) {
          const recipeNoteIndex = state.inventories.past.indexOf("kitchen-recipe-note");
          if (recipeNoteIndex !== -1) state.inventories.past.splice(recipeNoteIndex, 1);
        }
        return;
      }
      if (action.targetId === "kitchen-family-table") {
        if (timeline !== "present" || !state.timelines.present.puzzles["kitchen-recipe"]?.solved) {
          throw new Error("Primero hay que completar la receta.");
        }
        const seatIndex = Number(action.payload.seatIndex);
        if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= kitchenNapkinIds.length) {
          throw new Error("Ese puesto de la mesa no es válido.");
        }
        const currentPuzzle = state.timelines.present.puzzles[action.targetId] ?? {};
        if (currentPuzzle.solved) return;
        const placements = Array.isArray(currentPuzzle.placements)
          ? [...currentPuzzle.placements]
          : new Array(kitchenNapkinIds.length).fill(null);
        if (action.payload.operation === "place") {
          const napkinId = action.payload.napkinId;
          const napkinIndex = state.inventories.present.indexOf(napkinId);
          if (!kitchenNapkinIds.includes(napkinId) || napkinIndex === -1 || placements[seatIndex]) {
            throw new Error("No puedes colocar esa servilleta en este puesto.");
          }
          state.inventories.present.splice(napkinIndex, 1);
          placements[seatIndex] = napkinId;
        } else if (action.payload.operation === "remove") {
          const napkinId = placements[seatIndex];
          if (!napkinId) return;
          placements[seatIndex] = null;
          if (!state.inventories.present.includes(napkinId)) state.inventories.present.push(napkinId);
        } else {
          throw new Error("La acción de la servilleta no es válida.");
        }
        state.timelines.present.puzzles[action.targetId] = {
          ...currentPuzzle,
          placements,
          solved: placements.every((napkinId, index) => napkinId === kitchenNapkinIds[index]),
        };
        return;
      }
      if (["living-room-painting-piece-0", "living-room-painting-piece-4"].includes(action.targetId)) {
        const painting = state.timelines.past.objects["living-room-painting-slot"];
        if (timeline !== "past" || !painting?.placed) throw new Error("Primero hay que colocar el cuadro en el Mundo A.");
        const index = Number(action.targetId.slice(-1));
        const restoredPieces = [...new Set([...(painting.restoredPieces ?? []), index])];
        setObjectState(state, "past", "living-room-painting-slot", { restoredPieces });
        if ([0, 4].every((piece) => restoredPieces.includes(piece))) {
          state.timelines.past.puzzles["living-room-painting"] = { solved: true };
        }
        return;
      }
      if (action.targetId === "living-room-sofa-cushion") {
        if (timeline !== "present") throw new Error("El cojín solo se puede registrar en el Mundo B.");
        const cushion = state.timelines.present.objects[action.targetId] ?? {};
        if (!cushion.cut) {
          const scissorsIndex = state.inventories.present.indexOf("living-room-scissors");
          if (scissorsIndex === -1) throw new Error("Necesitas las tijeras del cuadro.");
          state.inventories.present.splice(scissorsIndex, 1);
          setObjectState(state, "present", action.targetId, { cut: true });
          return;
        }
        if (!cushion.searched) {
          setObjectState(state, "present", action.targetId, { searched: true });
          if (!state.inventories.present.includes("living-room-match")) state.inventories.present.push("living-room-match");
        }
        return;
      }
      if (action.targetId === "living-room-fireplace") {
        if (timeline !== "present") throw new Error("La chimenea solo se puede encender en el Mundo B.");
        const matchIndex = state.inventories.present.indexOf("living-room-match");
        if (matchIndex === -1) throw new Error("Necesitas la cerilla escondida en el cojín.");
        state.inventories.present.splice(matchIndex, 1);
        setObjectState(state, "present", action.targetId, { open: true });
        return;
      }
      if (action.targetId === "hallway-living-room-door") {
        if (timeline !== "present" || !state.timelines.present.puzzles["hallway-maze"]?.solved) throw new Error("Resuelve el laberinto para obtener la llave del salón.");
        for (const era of ["past", "present"]) setObjectState(state, era, action.targetId, { locked: false });
        return;
      }
      if (action.targetId === "hallway-children-room-door") {
        const keyIndex = state.inventories.past.indexOf("study-key");
        if (timeline !== "past" || keyIndex === -1) throw new Error("Necesitas la llave que está dentro del cofre del salón.");
        state.inventories.past.splice(keyIndex, 1);
        for (const era of ["past", "present"]) setObjectState(state, era, action.targetId, { locked: false });
        return;
      }
      if (["hallway-kitchen-door", "living-room-kitchen-door"].includes(action.targetId)) {
        const crowbarIndex = state.inventories.past.indexOf("crowbar");
        if (timeline !== "past" || crowbarIndex === -1) throw new Error("Necesitas la palanca oculta en el armario infantil.");
        state.inventories.past.splice(crowbarIndex, 1);
        for (const era of ["past", "present"]) {
          setObjectState(state, era, "hallway-kitchen-door", { locked: false });
          setObjectState(state, era, "living-room-kitchen-door", { locked: false });
        }
        return;
      }
      if (action.targetId === "hallway-maze-mirror") {
        if (timeline !== "present") throw new Error("El espejo solo se manipula en el Mundo B.");
        const mirror = state.timelines.present.objects[action.targetId] ?? {};
        if (!mirror.released) {
          if (!state.timelines.present.puzzles["bathroom-sequence"]?.solved) {
            throw new Error("Primero hay que resolver la secuencia del baño en el Mundo B.");
          }
          const screwdriverIndex = state.inventories.present.indexOf("screwdriver");
          if (screwdriverIndex === -1) throw new Error("Necesitas el destornillador del baño.");
          state.inventories.present.splice(screwdriverIndex, 1);
          setObjectState(state, "present", action.targetId, { released: true, open: true });
        } else {
          setObjectState(state, "present", action.targetId, { released: true, open: !mirror.open });
        }
        return;
      }
      if (action.targetId === "bedroom-symbol-safe") {
        if (timeline !== "past" || !state.timelines.present.puzzles["bedroom-light-reveal-puzzle"]?.solved) throw new Error("Primero hay que revelar los símbolos en el Mundo B.");
        setObjectState(state, "past", action.targetId, { open: true, locked: false });
        return;
      }
      if (action.targetId === "bedroom-exit-door") {
        if (timeline !== "past") throw new Error("La puerta solo puede desbloquearse desde el Mundo A.");
        setObjectState(state, "past", "bedroom-exit-door", { open: true, locked: false });
        setObjectState(state, "present", "bedroom-exit-door", { locked: false });
        return;
      }
      if (action.targetId === "living-room-painting-slot") {
        if (timeline !== "past" || !state.timelines.present.puzzles["living-room-rainbow-books"]?.solved) throw new Error("Primero hay que ordenar los libros del arcoíris.");
        setObjectState(state, "past", action.targetId, { placed: true });
        setObjectState(state, "present", action.targetId, { placed: true });
        return;
      }
      if (action.targetId === "living-room-chest") {
        if (timeline !== "past" || !state.inventories.past.includes("living-room-vitrine-letter")) {
          throw new Error("Primero hay que encontrar la carta de la vitrina.");
        }
        for (const era of ["past", "present"]) setObjectState(state, era, action.targetId, { locked: false });
        return;
      }
      setObjectState(state, timeline, action.targetId, { open: true });
      return;
    case "puzzle.solved":
      if (action.targetId === "hallway-clock" && timeline !== "past") throw new Error("El reloj se ajusta en el Mundo A.");
      if (action.targetId === "hallway-maze" && (timeline !== "present" || !state.timelines.past.puzzles["hallway-clock"]?.solved || !state.timelines.present.objects["hallway-maze-mirror"]?.open)) throw new Error("Primero hay que abrir el espejo y resolver el reloj en el Mundo A.");
      if (action.targetId === "bathroom-hot-water" && timeline !== "past") throw new Error("El agua caliente debe activarse en el Mundo A.");
      if (action.targetId === "bathroom-sequence" && (timeline !== "present" || !state.timelines.past.puzzles["bathroom-hot-water"]?.solved)) throw new Error("Primero hay que revelar la secuencia en el baño del Mundo A.");
      if (action.targetId === "bedroom-radio" && (timeline !== "past" || !state.inventories.present.includes("bedroom-radio-note"))) throw new Error("Primero hay que recoger la nota de la radio en el Mundo B.");
      if (action.targetId === "bedroom-electrical-panel" && (timeline !== "present" || !state.inventories.past.includes("bedroom-electrical-plan"))) throw new Error("Primero hay que recoger el plano eléctrico en el Mundo A.");
      if (action.targetId === "living-room-rainbow-books" && timeline !== "present") throw new Error("Los libros se ordenan en el Mundo B.");
      if (action.targetId === "living-room-embers" && (timeline !== "past" || !state.timelines.present.objects["living-room-fireplace"]?.open)) throw new Error("Primero hay que encender la chimenea en el Mundo B.");
      if (action.targetId === "bedroom-sewing-box" && (timeline !== "past" || !state.timelines.present.puzzles["bedroom-family-photo"]?.solved)) throw new Error("Primero hay que ordenar la foto familiar en el Mundo B.");
      if (action.targetId === "children-blocks" && timeline !== "past") throw new Error("Los bloques se reconstruyen en el Mundo A.");
      if (action.targetId === "children-music-key") {
        const keyIndex = state.inventories.past.indexOf("music-box-key");
        if (timeline !== "past" || !state.timelines.past.puzzles["children-globe"]?.solved || keyIndex === -1) throw new Error("Necesitas la llave escondida detrás del corcho.");
        state.inventories.past.splice(keyIndex, 1);
      }
      if (action.targetId === "children-music" && (timeline !== "present" || !state.timelines.past.puzzles["children-music-key"]?.solved)) throw new Error("Primero hay que activar la caja musical del Mundo A con su llave.");
      if (action.targetId === "children-globe-pin") {
        const pinIndex = state.inventories.past.indexOf("globe-pushpin");
        if (timeline !== "past" || !state.timelines.past.puzzles["children-blocks"]?.solved || pinIndex === -1) throw new Error("Necesitas la chincheta obtenida al completar los bloques.");
        state.inventories.past.splice(pinIndex, 1);
      }
      if (action.targetId === "children-globe") {
        if (timeline !== "past" || !state.timelines.past.puzzles["children-globe-pin"]?.solved) {
          throw new Error("Primero hay que colocar la chincheta que falta en el corcho.");
        }
        if (!memoryPhotoIds.every((photoId) => state.inventories.past.includes(photoId))) {
          throw new Error("Primero hay que encontrar las cuatro fotos escondidas.");
        }
        memoryPhotoIds.forEach((photoId) => {
          state.inventories.past.splice(state.inventories.past.indexOf(photoId), 1);
        });
        const clueIndex = state.inventories.present.indexOf("children-photo-order-note");
        if (clueIndex !== -1) state.inventories.present.splice(clueIndex, 1);
      }
      if (action.targetId === "children-wardrobe-chains") {
        const cuttersIndex = state.inventories.past.indexOf("bolt-cutters");
        if (timeline !== "past" || !state.timelines.present.puzzles["children-music"]?.solved || cuttersIndex === -1) {
          throw new Error("Necesitas el cortacadenas escondido en la caja musical.");
        }
        state.inventories.past.splice(cuttersIndex, 1);
      }
      if (action.targetId === "kitchen-recipe") {
        const placements = state.timelines.present.puzzles[action.targetId]?.placements;
        if (timeline !== "present" || !kitchenIngredientIds.every((ingredientId, index) => placements?.[index] === ingredientId)) {
          throw new Error("Coloca correctamente los ingredientes de la receta.");
        }
        const recipeNoteIndex = state.inventories.past.indexOf("kitchen-recipe-note");
        if (recipeNoteIndex !== -1) state.inventories.past.splice(recipeNoteIndex, 1);
      }
      if (action.targetId === "kitchen-family-table") {
        const placements = state.timelines.present.puzzles[action.targetId]?.placements;
        if (timeline !== "present" || !state.timelines.present.puzzles["kitchen-recipe"]?.solved || !kitchenNapkinIds.every((napkinId, index) => placements?.[index] === napkinId)) {
          throw new Error("Coloca cada servilleta en el puesto familiar correcto.");
        }
      }
      if (action.targetId === "kitchen-stove" && (timeline !== "present" || !state.timelines.present.puzzles["kitchen-family-table"]?.solved)) throw new Error("Primero hay que reconstruir la mesa familiar.");
      if (action.targetId === "kitchen-oven" && (timeline !== "past" || !state.timelines.present.puzzles["kitchen-stove"]?.solved)) throw new Error("Primero hay que ajustar los fogones.");
      if (action.targetId === "bathroom-mosaic" && (timeline !== "present" || !state.timelines.present.puzzles["bathroom-mosaic"]?.tileInserted)) throw new Error("Primero hay que colocar el azulejo que falta.");
      state.timelines[timeline].puzzles[action.targetId] = { ...state.timelines[timeline].puzzles[action.targetId], solved: true, ...action.payload };
      return;
    case "item.pickup": {
      if (action.targetId === "final-key-bedroom" && (timeline !== "present" || !state.timelines.past.puzzles["bedroom-radio"]?.solved)) throw new Error("Primero hay que completar la radio.");
      if (action.targetId === "final-key-living-room" && (timeline !== "present" || state.timelines.past.objects["living-room-chest"]?.locked !== false)) throw new Error("Primero hay que abrir el cofre del salón.");
      if (action.targetId === "final-key-children" && (timeline !== "past" || !state.timelines.past.puzzles["children-wardrobe-chains"]?.solved)) throw new Error("Primero hay que cortar las cadenas del armario.");
      if (action.targetId === "final-key-bathroom" && (timeline !== "past" || !state.timelines.present.puzzles["bathroom-mosaic"]?.solved)) throw new Error("Primero hay que completar el mosaico.");
      if (action.targetId === "flashlight" && timeline !== "present") throw new Error("La linterna solo existe en el Mundo B.");
      if (action.targetId === "crowbar" && (timeline !== "past" || !state.timelines.past.puzzles["children-wardrobe-chains"]?.solved)) {
        throw new Error("Primero hay que cortar las cadenas del armario.");
      }
      if (action.targetId === "bolt-cutters" && (timeline !== "past" || !state.timelines.present.puzzles["children-music"]?.solved)) {
        throw new Error("Primero hay que completar el puzle de música.");
      }
      if (action.targetId === "music-box-key" && (timeline !== "past" || !state.timelines.past.puzzles["children-globe"]?.solved)) {
        throw new Error("Primero hay que completar el corcho de fotos.");
      }
      if (action.targetId === "globe-pushpin" && (timeline !== "past" || !state.timelines.past.puzzles["children-blocks"]?.solved)) {
        throw new Error("Primero hay que completar los bloques del Mundo A.");
      }
      if (memoryPhotoIds.includes(action.targetId) && timeline !== "past") {
        throw new Error("Las fotos escondidas solo existen en el Mundo A.");
      }
      if (action.targetId === "children-photo-order-note" && timeline !== "present") throw new Error("La nota de las fotos está en el Mundo B.");
      if (action.targetId === "kitchen-recipe-note" && timeline !== "past") throw new Error("La receta está en el Mundo A.");
      if (["kitchen-tomatoes", "kitchen-carrots", "kitchen-cheese"].includes(action.targetId) && timeline !== "present") throw new Error("Los ingredientes se recogen en el Mundo B.");
      if (kitchenNapkinIds.includes(action.targetId) && timeline !== "present") throw new Error("Las servilletas se recogen en el Mundo B.");
      if (action.targetId === "kitchen-napkin-ochre" && !state.timelines.present.puzzles["kitchen-recipe"]?.solved) throw new Error("Primero hay que completar la receta.");
      if (action.targetId === "bathroom-mosaic-tile" && (timeline !== "present" || !state.timelines.past.puzzles["kitchen-oven"]?.solved)) throw new Error("Primero hay que resolver el horno.");
      if (action.targetId === "screwdriver" && (timeline !== "present" || !state.timelines.present.puzzles["bathroom-sequence"]?.solved)) {
        throw new Error("Primero hay que resolver la secuencia del baño.");
      }
      const inventory = state.inventories[timeline];
      if (!inventory.includes(action.targetId)) inventory.push(action.targetId);
      return;
    }
  }
};

const applyAction = async (roomId, player, action) =>
  withTransaction(async (transaction) => {
    const row = await GameState.findByPk(roomId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row) throw new Error("La sala no existe.");
    const previousAction = await GameEvent.findOne({ where: { roomId, actionId: action.actionId }, transaction });
    if (previousAction) return { revision: row.revision, state: row.state };

    const nextState = structuredClone(row.state);
    reduceAction(nextState, player, action);
    const nextRevision = row.revision + 1;
    await row.update({ revision: nextRevision, state: nextState, updatedAt: new Date() }, { transaction });
    await GameEvent.create(
      {
        id: randomUUID(),
        roomId,
        actorPlayerId: player.id,
        actionId: action.actionId,
        revision: nextRevision,
        eventType: action.type,
        payload: action,
      },
      { transaction },
    );
    return { revision: nextRevision, state: nextState };
  });

const createRoom = async (displayName) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await withTransaction(async (transaction) => {
        const roomId = randomUUID();
        const playerId = randomUUID();
        const userId = randomUUID();
        const playerToken = randomUUID();
        const joinCode = makeJoinCode();
        await User.create({ id: userId, displayName }, { transaction });
        const room = await GameRoom.create({ id: roomId, joinCode, status: "waiting" }, { transaction });
        await RoomPlayer.create(
          { id: playerId, roomId, userId, timeline: null, reconnectToken: playerToken },
          { transaction },
        );
        await room.update({ creatorPlayerId: playerId }, { transaction });
        await GameState.create({ roomId, state: createInitialState() }, { transaction });
        return { roomId, joinCode, playerId, playerToken, timeline: null, isCreator: true };
      });
    } catch (error) {
      if (attempt === 4) throw error;
    }
  }
  throw new Error("No se pudo crear la sala.");
};

const joinRoom = async (joinCode, displayName) =>
  withTransaction(async (transaction) => {
    const currentRoom = await GameRoom.findOne({
      where: { joinCode: normaliseCode(joinCode) },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!currentRoom) throw new Error("No existe una sala con ese código.");
    if (currentRoom.status !== "waiting") throw new Error("La sala ya está completa o terminó.");
    const playerId = randomUUID();
    const userId = randomUUID();
    const playerToken = randomUUID();
    await User.create({ id: userId, displayName }, { transaction });
    await RoomPlayer.create(
      {
        id: playerId,
        roomId: currentRoom.id,
        userId,
        timeline: null,
        reconnectToken: playerToken,
      },
      { transaction },
    );
    return {
      roomId: currentRoom.id,
      joinCode: currentRoom.joinCode,
      playerId,
      playerToken,
      timeline: null,
      isCreator: false,
    };
  });

const selectTimeline = async (roomId, playerId, requestedTimeline) =>
  withTransaction(async (transaction) => {
    const players = await RoomPlayer.findAll({ where: { roomId }, transaction, lock: transaction.LOCK.UPDATE });
    const occupied = new Set(
      players
        .filter((entry) => entry.id !== playerId)
        .map((entry) => entry.timeline)
        .filter(Boolean),
    );
    if (requestedTimeline && occupied.has(requestedTimeline))
      throw new Error("Ese mundo ya lo ha elegido el otro jugador.");
    await RoomPlayer.update({ timeline: requestedTimeline }, { where: { id: playerId }, transaction });
    return getLobbyState(roomId, transaction);
  });

const startGame = async (roomId, playerId) =>
  withTransaction(async (transaction) => {
    const room = await GameRoom.findByPk(roomId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!room) throw new Error("La sala no existe.");
    if (room.creatorPlayerId !== playerId) throw new Error("Solo quien creó la sala puede iniciar la partida.");
    const lobby = await getLobbyState(roomId, transaction);
    const selected = lobby.players.filter((entry) => entry.timeline);
    if (selected.length !== 2 || new Set(selected.map((entry) => entry.timeline)).size !== 2) {
      throw new Error("Los dos jugadores deben elegir un mundo distinto.");
    }
    await room.update({ status: "playing" }, { transaction });
    return lobby;
  });

app.get("/health", (request, response) => response.json({ ok: true }));

app.post("/api/rooms", async (request, reply) => {
  const input = createRoomSchema.parse(request.body);
  return reply.status(201).json(await createRoom(input.displayName));
});

app.post("/api/rooms/:joinCode/join", async (request, reply) => {
  const input = createRoomSchema.parse(request.body);
  const params = z.object({ joinCode: z.string().length(6) }).parse(request.params);
  return reply.json(await joinRoom(params.joinCode, input.displayName));
});

app.get("/api/rooms/:roomId/state", async (request, reply) => {
  const params = z.object({ roomId: z.string().uuid() }).parse(request.params);
  const token = z.string().uuid().parse(request.headers["x-player-token"]);
  const player = await getPlayerFromToken(params.roomId, token);
  if (!player) return reply.status(401).json({ error: "Sesión de jugador no válida." });
  return reply.json({ ...(await getSnapshot(params.roomId)), player });
});

app.use((request, response) => {
  response.status(404).json({ error: "Ruta no encontrada." });
});

app.use((error, request, response, next) => {
  if (response.headersSent) return next(error);
  if (error instanceof z.ZodError) {
    return response.status(400).json({ error: "Datos de petición no válidos.", details: error.issues });
  }
  const status = error.status ?? error.statusCode;
  const statusCode = Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
  console.error(error);
  return response.status(statusCode).json({ error: error.message ?? "Error interno del servidor." });
});

io.use(async (socket, next) => {
  try {
    const input = z.object({ roomId: z.string().uuid(), playerToken: z.string().uuid() }).parse(socket.handshake.auth);
    const player = await getPlayerFromToken(input.roomId, input.playerToken);
    if (!player) throw new Error("Sesión de jugador no válida.");
    socket.data.auth = { roomId: input.roomId, player };
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error("No autorizado."));
  }
});

io.on("connection", async (socket) => {
  const { roomId, player } = socket.data.auth;
  await RoomPlayer.update({ connected: true }, { where: { id: player.id } });
  await socket.join(socketRoom(roomId));

  socket.on("lobby:select-timeline", async (rawSelection, acknowledge) => {
    try {
      const { timeline } = timelineSelectionSchema.parse(rawSelection);
      const lobby = await selectTimeline(roomId, player.id, timeline);
      io.to(socketRoom(roomId)).emit("lobby:state", lobby);
      acknowledge?.({ ok: true, ...lobby });
    } catch (error) {
      acknowledge?.({ ok: false, error: error instanceof Error ? error.message : "No se pudo elegir el mundo." });
    }
  });

  socket.on("lobby:start", async (acknowledge) => {
    try {
      const lobby = await startGame(roomId, player.id);
      io.to(socketRoom(roomId)).emit("game:started", lobby);
      acknowledge?.({ ok: true, ...lobby });
    } catch (error) {
      acknowledge?.({ ok: false, error: error instanceof Error ? error.message : "No se puede iniciar la partida." });
    }
  });

  socket.on("game:action", async (rawAction, acknowledge) => {
    try {
      const action = actionSchema.parse(rawAction);
      const snapshot = await applyAction(roomId, player, action);
      io.to(socketRoom(roomId)).emit("game:state-updated", { ...snapshot, action, actorPlayerId: player.id });
      acknowledge?.({ ok: true, ...snapshot });
    } catch (error) {
      acknowledge?.({ ok: false, error: error instanceof Error ? error.message : "Acción no válida." });
    }
  });

  socket.on("player:movement", (rawMovement) => {
    const movement = movementSchema.safeParse(rawMovement);
    if (!movement.success) return;
    socket
      .to(socketRoom(roomId))
      .emit("player:moved", { playerId: player.id, timeline: player.timeline, ...movement.data });
  });

  socket.on("disconnect", () => {
    void RoomPlayer.update({ connected: false }, { where: { id: player.id } });
    socket
      .to(socketRoom(roomId))
      .emit("room:presence", { playerId: player.id, timeline: player.timeline, connected: false });
    void getLobbyState(roomId).then((lobby) => io.to(socketRoom(roomId)).emit("lobby:state", lobby));
  });
  const snapshot = await getSnapshot(roomId);
  const lobby = await getLobbyState(roomId);
  socket.emit("game:state", { ...snapshot, player });
  socket
    .to(socketRoom(roomId))
    .emit("room:presence", { playerId: player.id, timeline: player.timeline, connected: true });
  io.to(socketRoom(roomId)).emit("lobby:state", lobby);
});

await new Promise((resolve, reject) => {
  httpServer.once("error", reject);
  httpServer.listen(port, "0.0.0.0", resolve);
});
console.info(`Servidor Express escuchando en el puerto ${httpServer.address().port}`);
