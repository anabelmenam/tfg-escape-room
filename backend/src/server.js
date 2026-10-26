import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { Op } from "sequelize";
import { z } from "zod";
import { sequelize, withTransaction } from "./db.js";
import { User, GameRoom, RoomPlayer, GameState, GameEvent, PlayerCheckpoint, PasswordResetToken, UserSession } from "./models/index.js";
import { createInitialState } from "./state.js";
import { clearSession, createSession, hashPassword, publicUser, requireUser, verifyPassword } from "./auth.js";
import { sendAccountDeletedEmail, sendGameDeletedEmail, sendPasswordResetEmail, sendWelcomeEmail } from "./email.js";

const port = Number(process.env.PORT ?? 3010);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
const app = express();
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", (request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store, max-age=0");
  response.setHeader("Pragma", "no-cache");
  response.setHeader("Vary", "Cookie, Origin");
  next();
});
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: frontendOrigin, methods: ["GET", "POST"] },
});

const actionSchema = z.object({
  actionId: z.string().uuid(),
  type: z.enum(["object.interact", "puzzle.solved", "item.pickup"]),
  targetId: z.string().trim().min(1).max(100),
  payload: z.record(z.unknown()).default({}),
});
const movementSchema = z.object({
  position: z.object({ x: z.number().min(-500).max(500), y: z.number().min(-20).max(200), z: z.number().min(-500).max(500) }),
  rotationY: z.number().min(-Math.PI * 4).max(Math.PI * 4),
  roomKey: z.string().max(40).nullable().optional(),
});
const checkpointMetaSchema = z.object({
  diaryEntries: z.array(z.string().max(100)).max(50),
  hintHistory: z.array(z.object({ id: z.string().max(140), text: z.string().max(1000) })).max(100),
});
const characterSelectionSchema = z.object({ character: z.enum(["mum", "dad"]).nullable() });
const credentialsSchema = z.object({ email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()), password: z.string().min(8).max(128) });
const registerSchema = credentialsSchema.extend({ displayName: z.string().trim().min(1).max(40) });
const passwordResetRequestSchema = z.object({ email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()) });
const passwordResetSchema = z.object({ token: z.string().min(32).max(256), password: z.string().min(8).max(128) });
const saveSlotSchema = z.object({ slotNumber: z.number().int().min(1).max(3) });
const createSavedRoomSchema = saveSlotSchema.extend({ name: z.string().trim().min(1).max(50).default("Partida") });

const socketRoom = (roomId) => `game:${roomId}`;
const normaliseCode = (code) => code.trim().toUpperCase();
const makeJoinCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const lastCheckpointWrite = new Map();
const playerSockets = new Map();
const pendingDisconnects = new Map();
const passwordResetTokenHash = (token) => createHash("sha256").update(token).digest("hex");
const passwordResetLifetime = 1000 * 60 * 20;

const requireAdmin = (request, response, next) => {
  if (request.user?.role !== "admin") return response.status(403).json({ error: "ADMIN_REQUIRED" });
  return next();
};

const playTimerSnapshot = (room, now = Date.now()) => {
  const startedAt = room.playStartedAt ? new Date(room.playStartedAt).getTime() : null;
  const activeSeconds = startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
  return {
    elapsedSeconds: Math.max(0, Number(room.playTimeSeconds ?? 0) + activeSeconds),
    running: startedAt !== null && room.status === "playing",
    serverNow: now,
  };
};

const syncRoomPlayTimer = async (roomId, transaction = null) => {
  const room = await GameRoom.findByPk(roomId, {
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });
  if (!room) return { elapsedSeconds: 0, running: false, serverNow: Date.now() };
  const connectedPlayers = await RoomPlayer.count({ where: { roomId, connected: true }, transaction });
  const now = Date.now();
  const shouldRun = room.status === "playing" && connectedPlayers === 2;
  if (shouldRun && !room.playStartedAt) {
    await room.update({ playStartedAt: new Date(now) }, { transaction });
  } else if (!shouldRun && room.playStartedAt) {
    const accumulated = Number(room.playTimeSeconds ?? 0) + Math.max(0, Math.floor((now - new Date(room.playStartedAt).getTime()) / 1000));
    await room.update({ playTimeSeconds: accumulated, playStartedAt: null }, { transaction });
  }
  return playTimerSnapshot(room, now);
};

const updateCheckpoint = async (playerId, roomId, patch) => {
  const [updated] = await PlayerCheckpoint.update({ ...patch, updatedAt: new Date() }, { where: { playerId } });
  if (updated) return;
  try {
    await PlayerCheckpoint.create({ playerId, roomId, ...patch, updatedAt: new Date() });
  } catch (error) {
    const [retried] = await PlayerCheckpoint.update({ ...patch, updatedAt: new Date() }, { where: { playerId } });
    if (!retried) throw error;
  }
};

const saveCheckpoint = async (roomId, playerId, movement, force = false) => {
  const now = Date.now();
  if (!force && now - (lastCheckpointWrite.get(playerId) ?? 0) < 5000) return;
  lastCheckpointWrite.set(playerId, now);
  await updateCheckpoint(playerId, roomId, { position: movement.position, rotationY: movement.rotationY, roomKey: movement.roomKey ?? null });
  await GameRoom.update({ lastActivityAt: new Date() }, { where: { id: roomId } });
};

const ensureFreeSlot = async (userId, slotNumber, transaction) => {
  const occupied = await RoomPlayer.findOne({ where: { userId, slotNumber }, transaction, lock: transaction.LOCK.UPDATE });
  if (occupied) { const error = new Error("SAVE_SLOT_OCCUPIED"); error.status = 409; throw error; }
};

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
    character: player.character,
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
      character: player.character,
      connected: player.connected,
      displayName: player.user.displayName,
    })),
  };
};

const setObjectState = (state, character, objectId, patch) => {
  const objects = state.characters[character].objects;
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
const familyStoryNoteIds = new Set(Array.from({ length: 10 }, (_, index) => `family-note-${String(index + 1).padStart(2, "0")}`));
const finalLocks = {
  "final-bolt-bedroom": { keyId: "final-key-bedroom", character: "mum" },
  "final-bolt-living-room": { keyId: "final-key-living-room", character: "dad" },
  "final-bolt-children": { keyId: "final-key-children", character: "mum" },
  "final-bolt-bathroom": { keyId: "final-key-bathroom", character: "dad" },
};

const reduceAction = (state, player, action) => {
  const legacyBathroomKey = state.inventories.mum.indexOf("final-key-bathroom");
  if (legacyBathroomKey !== -1) {
    state.inventories.mum.splice(legacyBathroomKey, 1);
    if (!state.inventories.dad.includes("final-key-bathroom")) state.inventories.dad.push("final-key-bathroom");
  }
  const character = player.character;
  switch (action.type) {
    case "object.interact":
      if (action.payload?.operation === "set-open") {
        setObjectState(state, character, action.targetId, { open: Boolean(action.payload.open) });
        return;
      }
      if (action.payload?.operation === "set-active") {
        setObjectState(state, character, action.targetId, { active: Boolean(action.payload.active) });
        return;
      }
      if (action.targetId === "hallway-final-threshold") {
        const allUnlocked = Object.keys(finalLocks).every((lockId) => state.characters.mum.objects[lockId]?.unlocked);
        if (!allUnlocked) throw new Error("Primero hay que abrir los cuatro cerrojos.");
        state.ending ??= { phase: "threshold", holding: { mum: false, dad: false }, choice: null, sacrificeCharacter: null };
        if (state.ending.phase !== "threshold") return;
        state.ending.holding ??= { mum: false, dad: false };
        state.ending.holding[character] = action.payload?.operation === "hold-start";
        if (state.ending.holding.mum && state.ending.holding.dad) {
          state.ending.phase = "opening";
          state.ending.crossed = { mum: false, dad: false };
          for (const era of ["mum", "dad"]) {
            setObjectState(state, era, "hallway-street-door", { locked: false, open: true });
          }
        }
        return;
      }
      if (action.targetId === "hallway-final-crossed") {
        if (state.ending?.phase !== "opening") return;
        state.ending.crossed ??= { mum: false, dad: false };
        state.ending.crossed[character] = true;
        if (state.ending.crossed.mum && state.ending.crossed.dad) state.ending.phase = "choice";
        return;
      }
      if (action.targetId === "hallway-final-choice") {
        if (state.ending?.phase !== "choice") throw new Error("La puerta todavía no está preparada.");
        const choice = action.payload?.choice;
        if (!["together", "sacrifice"].includes(choice)) throw new Error("Ese desenlace no es válido.");
        state.ending.phase = "complete";
        state.ending.choice = choice;
        state.ending.sacrificeCharacter = choice === "sacrifice" ? character : null;
        return;
      }
      if (finalLocks[action.targetId]) {
        const lock = finalLocks[action.targetId];
        const keyIndex = state.inventories[character].indexOf(lock.keyId);
        if (character !== lock.character || keyIndex === -1) throw new Error("Necesitas la llave final con el mismo símbolo.");
        state.inventories[character].splice(keyIndex, 1);
        for (const era of ["mum", "dad"]) setObjectState(state, era, action.targetId, { unlocked: true });
        const allUnlocked = Object.keys(finalLocks).every((lockId) => state.characters.mum.objects[lockId]?.unlocked);
        if (allUnlocked) {
          state.ending ??= { phase: "locked", holding: { mum: false, dad: false }, choice: null, sacrificeCharacter: null };
          state.ending.phase = "threshold";
          state.ending.holding = { mum: false, dad: false };
        }
        return;
      }
      if (action.targetId === "bathroom-mosaic" && action.payload?.operation === "insert-tile") {
        const tileIndex = state.inventories.dad.indexOf("bathroom-mosaic-tile");
        if (character !== "dad" || tileIndex === -1) throw new Error("Necesitas el azulejo que está dentro del horno.");
        state.inventories.dad.splice(tileIndex, 1);
        state.characters.dad.puzzles["bathroom-mosaic"] = {
          ...state.characters.dad.puzzles["bathroom-mosaic"],
          tileInserted: true,
        };
        return;
      }
      if (action.targetId === "kitchen-recipe") {
        if (character !== "dad") throw new Error("La receta se prepara en el Papá.");
        const slotIndex = Number(action.payload.slotIndex);
        if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= kitchenIngredientIds.length) {
          throw new Error("Esa posición de la tabla no es válida.");
        }
        const currentPuzzle = state.characters.dad.puzzles[action.targetId] ?? {};
        if (currentPuzzle.solved) return;
        const placements = Array.isArray(currentPuzzle.placements)
          ? [...currentPuzzle.placements]
          : new Array(kitchenIngredientIds.length).fill(null);
        if (action.payload.operation === "place") {
          const ingredientId = action.payload.ingredientId;
          const ingredientIndex = state.inventories.dad.indexOf(ingredientId);
          if (!kitchenIngredientIds.includes(ingredientId) || ingredientIndex === -1 || placements[slotIndex]) {
            throw new Error("No puedes colocar ese ingrediente en esta posición.");
          }
          state.inventories.dad.splice(ingredientIndex, 1);
          placements[slotIndex] = ingredientId;
        } else if (action.payload.operation === "remove") {
          const ingredientId = placements[slotIndex];
          if (!ingredientId) return;
          placements[slotIndex] = null;
          if (!state.inventories.dad.includes(ingredientId)) state.inventories.dad.push(ingredientId);
        } else {
          throw new Error("La acción del ingrediente no es válida.");
        }
        const solved = placements.every((ingredientId, index) => ingredientId === kitchenIngredientIds[index]);
        state.characters.dad.puzzles[action.targetId] = {
          ...currentPuzzle,
          placements,
          solved,
        };
        if (solved) {
          const recipeNoteIndex = state.inventories.mum.indexOf("kitchen-recipe-note");
          if (recipeNoteIndex !== -1) state.inventories.mum.splice(recipeNoteIndex, 1);
        }
        return;
      }
      if (action.targetId === "kitchen-family-table") {
        if (character !== "dad") throw new Error("La mesa se prepara en el Papá.");
        const seatIndex = Number(action.payload.seatIndex);
        if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= kitchenNapkinIds.length) {
          throw new Error("Ese puesto de la mesa no es válido.");
        }
        const currentPuzzle = state.characters.dad.puzzles[action.targetId] ?? {};
        if (currentPuzzle.solved) return;
        const placements = Array.isArray(currentPuzzle.placements)
          ? [...currentPuzzle.placements]
          : new Array(kitchenNapkinIds.length).fill(null);
        if (action.payload.operation === "place") {
          const napkinId = action.payload.napkinId;
          const napkinIndex = state.inventories.dad.indexOf(napkinId);
          if (!kitchenNapkinIds.includes(napkinId) || napkinIndex === -1 || placements[seatIndex]) {
            throw new Error("No puedes colocar esa servilleta en este puesto.");
          }
          state.inventories.dad.splice(napkinIndex, 1);
          placements[seatIndex] = napkinId;
        } else if (action.payload.operation === "remove") {
          const napkinId = placements[seatIndex];
          if (!napkinId) return;
          placements[seatIndex] = null;
          if (!state.inventories.dad.includes(napkinId)) state.inventories.dad.push(napkinId);
        } else {
          throw new Error("La acción de la servilleta no es válida.");
        }
        state.characters.dad.puzzles[action.targetId] = {
          ...currentPuzzle,
          placements,
          solved: placements.every((napkinId, index) => napkinId === kitchenNapkinIds[index]),
        };
        return;
      }
      if (["living-room-painting-piece-0", "living-room-painting-piece-4"].includes(action.targetId)) {
        const painting = state.characters.mum.objects["living-room-painting-slot"];
        if (character !== "mum" || !painting?.placed) throw new Error("Primero hay que colocar el cuadro en el Mamá.");
        const index = Number(action.targetId.slice(-1));
        const inventoryId = index === 0 ? "painting-piece-1" : "painting-piece-2";
        const inventoryIndex = state.inventories.mum.indexOf(inventoryId);
        if (inventoryIndex !== -1) state.inventories.mum.splice(inventoryIndex, 1);
        const restoredPieces = [...new Set([...(painting.restoredPieces ?? []), index])];
        setObjectState(state, "mum", "living-room-painting-slot", { restoredPieces });
        if ([0, 4].every((piece) => restoredPieces.includes(piece))) {
          state.characters.mum.puzzles["living-room-painting"] = { solved: true };
        }
        return;
      }
      if (action.targetId === "living-room-sofa-cushion") {
        if (character !== "dad") throw new Error("El cojín solo se puede registrar en el Papá.");
        const cushion = state.characters.dad.objects[action.targetId] ?? {};
        if (!cushion.cut) {
          const scissorsIndex = state.inventories.dad.indexOf("living-room-scissors");
          if (scissorsIndex === -1) throw new Error("Necesitas las tijeras del cuadro.");
          state.inventories.dad.splice(scissorsIndex, 1);
          setObjectState(state, "dad", action.targetId, { cut: true });
          return;
        }
        if (!cushion.searched) {
          setObjectState(state, "dad", action.targetId, { searched: true });
          if (!state.inventories.dad.includes("living-room-match")) state.inventories.dad.push("living-room-match");
        }
        return;
      }
      if (action.targetId === "living-room-fireplace") {
        if (character !== "dad") throw new Error("La chimenea solo se puede encender en el Papá.");
        const matchIndex = state.inventories.dad.indexOf("living-room-match");
        if (matchIndex === -1) throw new Error("Necesitas la cerilla escondida en el cojín.");
        state.inventories.dad.splice(matchIndex, 1);
        setObjectState(state, "dad", action.targetId, { open: true });
        return;
      }
      if (action.targetId === "hallway-living-room-door") {
        const keyIndex = state.inventories.dad.indexOf("living-room-key");
        if (character !== "dad" || keyIndex === -1) throw new Error("Necesitas la llave obtenida al resolver el laberinto.");
        state.inventories.dad.splice(keyIndex, 1);
        for (const era of ["mum", "dad"]) setObjectState(state, era, action.targetId, { locked: false });
        return;
      }
      if (action.targetId === "hallway-children-room-door") {
        const keyIndex = state.inventories.dad.indexOf("study-key");
        if (character !== "dad" || keyIndex === -1) throw new Error("Necesitas la llave que está dentro del cofre del salón.");
        state.inventories.dad.splice(keyIndex, 1);
        for (const era of ["mum", "dad"]) setObjectState(state, era, action.targetId, { locked: false });
        return;
      }
      if (["hallway-kitchen-door", "living-room-kitchen-door"].includes(action.targetId)) {
        const crowbarIndex = state.inventories.mum.indexOf("crowbar");
        if (character !== "mum" || crowbarIndex === -1) throw new Error("Necesitas la palanca oculta en el armario infantil.");
        state.inventories.mum.splice(crowbarIndex, 1);
        for (const era of ["mum", "dad"]) {
          setObjectState(state, era, "hallway-kitchen-door", { locked: false });
          setObjectState(state, era, "living-room-kitchen-door", { locked: false });
        }
        return;
      }
      if (action.targetId === "hallway-maze-mirror") {
        if (character !== "dad") throw new Error("El espejo solo se manipula en el Papá.");
        const mirror = state.characters.dad.objects[action.targetId] ?? {};
        if (!mirror.released) {
          if (!state.characters.dad.puzzles["bathroom-sequence"]?.solved) {
            throw new Error("Primero hay que resolver la secuencia del baño en el Papá.");
          }
          const screwdriverIndex = state.inventories.dad.indexOf("screwdriver");
          if (screwdriverIndex === -1) throw new Error("Necesitas el destornillador del baño.");
          state.inventories.dad.splice(screwdriverIndex, 1);
          setObjectState(state, "dad", action.targetId, { released: true, open: true });
        } else {
          setObjectState(state, "dad", action.targetId, { released: true, open: !mirror.open });
        }
        return;
      }
      if (action.targetId === "bedroom-symbol-safe") {
        if (character !== "mum" || !state.characters.dad.puzzles["bedroom-light-reveal-puzzle"]?.solved) throw new Error("Primero hay que revelar los símbolos en el Papá.");
        setObjectState(state, "mum", action.targetId, { open: true, locked: false });
        return;
      }
      if (action.targetId === "bedroom-electrical-panel" && action.payload?.operation === "insert-fuse") {
        const fuseIndex = state.inventories.dad.indexOf("fuse");
        if (character !== "dad" || fuseIndex === -1) throw new Error("Necesitas el fusible del escritorio.");
        state.inventories.dad.splice(fuseIndex, 1);
        setObjectState(state, "dad", action.targetId, { hasFuse: true });
        return;
      }
      if (action.targetId === "bedroom-radio" && action.payload?.operation === "insert-dial") {
        const dialIndex = state.inventories.mum.indexOf("radio-dial");
        if (character !== "mum" || dialIndex === -1) throw new Error("Necesitas seleccionar la rueda de la radio.");
        state.inventories.mum.splice(dialIndex, 1);
        setObjectState(state, "mum", action.targetId, { hasDial: true });
        return;
      }
      if (action.targetId === "bedroom-exit-door") {
        if (character !== "mum") throw new Error("La puerta solo puede desbloquearse desde el Mamá.");
        const keyIndex = state.inventories.mum.indexOf("bedroom-key");
        if (keyIndex !== -1) state.inventories.mum.splice(keyIndex, 1);
        setObjectState(state, "mum", "bedroom-exit-door", { open: true, locked: false });
        setObjectState(state, "dad", "bedroom-exit-door", { locked: false });
        return;
      }
      if (action.targetId === "living-room-painting-slot") {
        if (character !== "mum" || !state.characters.dad.puzzles["living-room-rainbow-books"]?.solved) throw new Error("Primero hay que ordenar los libros del arcoíris.");
        const paintingIndex = state.inventories.mum.indexOf("living-room-fallen-painting");
        if (paintingIndex === -1) throw new Error("Necesitas recoger el cuadro caído.");
        state.inventories.mum.splice(paintingIndex, 1);
        setObjectState(state, "mum", action.targetId, { placed: true });
        setObjectState(state, "dad", action.targetId, { placed: true });
        return;
      }
      if (action.targetId === "living-room-chest") {
        if (character !== "dad" || !state.inventories.mum.includes("living-room-vitrine-letter")) {
          throw new Error("Primero hay que encontrar la carta de la vitrina.");
        }
        const letterIndex = state.inventories.mum.indexOf("living-room-vitrine-letter");
        if (letterIndex !== -1) state.inventories.mum.splice(letterIndex, 1);
        setObjectState(state, "dad", action.targetId, { locked: false });
        return;
      }
      setObjectState(state, character, action.targetId, { open: true });
      return;
    case "puzzle.solved":
      if (action.targetId === "hallway-clock") {
        if (character !== "mum") throw new Error("El reloj se ajusta en el Mamá.");
        const clockHandIndex = state.inventories.mum.indexOf("clock-hand");
        if (clockHandIndex !== -1) state.inventories.mum.splice(clockHandIndex, 1);
      }
      if (action.targetId === "hallway-maze" && (character !== "dad" || !state.characters.mum.puzzles["hallway-clock"]?.solved || !state.characters.dad.objects["hallway-maze-mirror"]?.open)) throw new Error("Primero hay que abrir el espejo y resolver el reloj en el Mamá.");
      if (action.targetId === "bathroom-hot-water" && character !== "mum") throw new Error("El agua caliente debe activarse en el Mamá.");
      if (action.targetId === "bathroom-sequence" && (character !== "dad" || !state.characters.mum.puzzles["bathroom-hot-water"]?.solved)) throw new Error("Primero hay que revelar la secuencia en el baño del Mamá.");
      if (action.targetId === "bedroom-radio" && (character !== "mum" || !state.inventories.dad.includes("bedroom-radio-note"))) throw new Error("Primero hay que recoger la nota de la radio en el Papá.");
      if (action.targetId === "bedroom-radio") {
        state.inventories.dad.splice(state.inventories.dad.indexOf("bedroom-radio-note"), 1);
        const dialIndex = state.inventories.mum.indexOf("radio-dial");
        if (dialIndex !== -1) state.inventories.mum.splice(dialIndex, 1);
      }
      if (action.targetId === "bedroom-electrical-panel" && (character !== "dad" || !state.inventories.mum.includes("bedroom-electrical-plan"))) throw new Error("Primero hay que recoger el plano eléctrico en el Mamá.");
      if (action.targetId === "bedroom-electrical-panel") state.inventories.mum.splice(state.inventories.mum.indexOf("bedroom-electrical-plan"), 1);
      if (action.targetId === "living-room-rainbow-books" && character !== "dad") throw new Error("Los libros se ordenan en el Papá.");
      if (action.targetId === "living-room-embers" && (character !== "mum" || !state.characters.dad.objects["living-room-fireplace"]?.open)) throw new Error("Primero hay que encender la chimenea en el Papá.");
      if (action.targetId === "bedroom-sewing-box" && (character !== "mum" || !state.characters.dad.puzzles["bedroom-family-photo"]?.solved)) throw new Error("Primero hay que ordenar la foto familiar en el Papá.");
      if (action.targetId === "children-blocks" && character !== "mum") throw new Error("Los bloques se reconstruyen en el Mamá.");
      if (action.targetId === "children-music-key") {
        const keyIndex = state.inventories.mum.indexOf("music-box-key");
        if (character !== "mum" || !state.characters.mum.puzzles["children-globe"]?.solved || keyIndex === -1) throw new Error("Necesitas la llave escondida detrás del corcho.");
        state.inventories.mum.splice(keyIndex, 1);
      }
      if (action.targetId === "children-music" && (character !== "dad" || !state.characters.mum.puzzles["children-music-key"]?.solved)) throw new Error("Primero hay que activar la caja musical del Mamá con su llave.");
      if (action.targetId === "children-globe-pin") {
        const pinIndex = state.inventories.mum.indexOf("globe-pushpin");
        if (character !== "mum" || !state.characters.mum.puzzles["children-blocks"]?.solved || pinIndex === -1) throw new Error("Necesitas la chincheta obtenida al completar los bloques.");
        state.inventories.mum.splice(pinIndex, 1);
      }
      if (action.targetId === "children-globe") {
        if (character !== "mum" || !state.characters.mum.puzzles["children-globe-pin"]?.solved) {
          throw new Error("Primero hay que colocar la chincheta que falta en el corcho.");
        }
        if (!memoryPhotoIds.every((photoId) => state.inventories.mum.includes(photoId))) {
          throw new Error("Primero hay que encontrar las cuatro fotos escondidas.");
        }
        memoryPhotoIds.forEach((photoId) => {
          state.inventories.mum.splice(state.inventories.mum.indexOf(photoId), 1);
        });
        const clueIndex = state.inventories.dad.indexOf("children-photo-order-note");
        if (clueIndex !== -1) state.inventories.dad.splice(clueIndex, 1);
      }
      if (action.targetId === "children-wardrobe-chains") {
        const cuttersIndex = state.inventories.mum.indexOf("bolt-cutters");
        if (character !== "mum" || !state.characters.dad.puzzles["children-music"]?.solved || cuttersIndex === -1) {
          throw new Error("Necesitas el cortacadenas escondido en la caja musical.");
        }
        state.inventories.mum.splice(cuttersIndex, 1);
      }
      if (action.targetId === "kitchen-recipe") {
        const placements = state.characters.dad.puzzles[action.targetId]?.placements;
        if (character !== "dad" || !kitchenIngredientIds.every((ingredientId, index) => placements?.[index] === ingredientId)) {
          throw new Error("Coloca correctamente los ingredientes de la receta.");
        }
        const recipeNoteIndex = state.inventories.mum.indexOf("kitchen-recipe-note");
        if (recipeNoteIndex !== -1) state.inventories.mum.splice(recipeNoteIndex, 1);
      }
      if (action.targetId === "kitchen-family-table") {
        const placements = state.characters.dad.puzzles[action.targetId]?.placements;
        if (character !== "dad" || !state.characters.dad.puzzles["kitchen-recipe"]?.solved || !kitchenNapkinIds.every((napkinId, index) => placements?.[index] === napkinId)) {
          throw new Error("Coloca cada servilleta en el puesto familiar correcto.");
        }
      }
      if (action.targetId === "kitchen-stove" && (character !== "dad" || !state.characters.dad.puzzles["kitchen-family-table"]?.solved)) throw new Error("Primero hay que reconstruir la mesa familiar.");
      if (action.targetId === "kitchen-oven" && (character !== "mum" || !state.characters.dad.puzzles["kitchen-stove"]?.solved)) throw new Error("Primero hay que ajustar los fogones.");
      if (action.targetId === "bathroom-mosaic" && (character !== "dad" || !state.characters.dad.puzzles["bathroom-mosaic"]?.tileInserted)) throw new Error("Primero hay que colocar el azulejo que falta.");
      state.characters[character].puzzles[action.targetId] = { ...state.characters[character].puzzles[action.targetId], solved: true, ...action.payload };
      return;
    case "item.pickup": {
      if (familyStoryNoteIds.has(action.targetId)) {
        state.journalEntries ??= [];
        if (!state.journalEntries.includes(action.targetId)) state.journalEntries.push(action.targetId);
        return;
      }
      if (action.targetId === "final-key-bedroom" && (character !== "mum" || !state.characters.mum.puzzles["bedroom-radio"]?.solved)) throw new Error("Primero hay que completar la radio.");
      if (action.targetId === "final-key-living-room" && (character !== "dad" || state.characters.dad.objects["living-room-chest"]?.locked !== false)) throw new Error("Primero hay que abrir el cofre del salón.");
      if (action.targetId === "final-key-children" && (character !== "mum" || !state.characters.mum.puzzles["children-wardrobe-chains"]?.solved)) throw new Error("Primero hay que cortar las cadenas del armario.");
      if (action.targetId === "final-key-bathroom" && (character !== "dad" || !state.characters.dad.puzzles["bathroom-mosaic"]?.solved)) throw new Error("Primero hay que completar el mosaico.");
      if (action.targetId === "flashlight" && character !== "dad") throw new Error("La linterna solo existe en el Papá.");
      if (action.targetId === "crowbar" && (character !== "mum" || !state.characters.mum.puzzles["children-wardrobe-chains"]?.solved)) {
        throw new Error("Primero hay que cortar las cadenas del armario.");
      }
      if (action.targetId === "bolt-cutters" && (character !== "mum" || !state.characters.dad.puzzles["children-music"]?.solved)) {
        throw new Error("Primero hay que completar el puzle de música.");
      }
      if (action.targetId === "music-box-key" && (character !== "mum" || !state.characters.mum.puzzles["children-globe"]?.solved)) {
        throw new Error("Primero hay que completar el corcho de fotos.");
      }
      if (action.targetId === "globe-pushpin" && (character !== "mum" || !state.characters.mum.puzzles["children-blocks"]?.solved)) {
        throw new Error("Primero hay que completar los bloques del Mamá.");
      }
      if (memoryPhotoIds.includes(action.targetId) && character !== "mum") {
        throw new Error("Las fotos escondidas solo existen en el Mamá.");
      }
      if (action.targetId === "children-photo-order-note" && character !== "dad") throw new Error("La nota de las fotos está en el Papá.");
      if (action.targetId === "hallway-maze-note") throw new Error("El plano del laberinto es una pista fija de la pared.");
      if (action.targetId === "kitchen-recipe-note" && character !== "mum") throw new Error("La receta está en el Mamá.");
      if (["kitchen-tomatoes", "kitchen-carrots", "kitchen-cheese"].includes(action.targetId) && character !== "dad") throw new Error("Los ingredientes se recogen en el Papá.");
      if (kitchenNapkinIds.includes(action.targetId) && character !== "dad") throw new Error("Las servilletas se recogen en el Papá.");
      if (action.targetId === "kitchen-napkin-ochre" && !state.characters.dad.puzzles["kitchen-recipe"]?.solved) throw new Error("Primero hay que completar la receta.");
      if (action.targetId === "bathroom-mosaic-tile" && (character !== "dad" || !state.characters.mum.puzzles["kitchen-oven"]?.solved)) throw new Error("Primero hay que resolver el horno.");
      if (action.targetId === "screwdriver" && (character !== "dad" || !state.characters.dad.puzzles["bathroom-sequence"]?.solved)) {
        throw new Error("Primero hay que resolver la secuencia del baño.");
      }
      const inventory = state.inventories[character];
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
    await GameRoom.update({
      lastActivityAt: new Date(),
      ...(nextState.ending?.phase === "complete" ? { status: "finished", finishedAt: new Date() } : {}),
    }, { where: { id: roomId }, transaction });
    if (nextState.ending?.phase === "complete") await syncRoomPlayTimer(roomId, transaction);
    return { revision: nextRevision, state: nextState };
  });

const createRoom = async (user, { slotNumber, name }) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await withTransaction(async (transaction) => {
        const roomId = randomUUID();
        const playerId = randomUUID();
        const playerToken = randomUUID();
        const joinCode = makeJoinCode();
        await ensureFreeSlot(user.id, slotNumber, transaction);
        const room = await GameRoom.create({ id: roomId, joinCode, name, status: "waiting" }, { transaction });
        await RoomPlayer.create(
          { id: playerId, roomId, userId: user.id, character: null, reconnectToken: playerToken, slotNumber },
          { transaction },
        );
        await room.update({ creatorPlayerId: playerId }, { transaction });
        await GameState.create({ roomId, state: createInitialState() }, { transaction });
        return { roomId, joinCode, playerId, playerToken, character: null, status: "waiting", isCreator: true, showIntroduction: true };
      });
    } catch (error) {
      const joinCodeCollision = error?.name === "SequelizeUniqueConstraintError" && error?.fields?.join_code;
      if (!joinCodeCollision || attempt === 4) throw error;
    }
  }
  throw new Error("No se pudo crear la sala.");
};

const joinRoom = async (joinCode, user, { slotNumber }) =>
  withTransaction(async (transaction) => {
    const currentRoom = await GameRoom.findOne({
      where: { joinCode: normaliseCode(joinCode) },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!currentRoom) { const error = new Error("ROOM_NOT_FOUND"); error.status = 404; throw error; }
    if (currentRoom.status !== "waiting") { const error = new Error("ROOM_NOT_JOINABLE"); error.status = 409; throw error; }
    const playerId = randomUUID();
    const playerToken = randomUUID();
    await ensureFreeSlot(user.id, slotNumber, transaction);
    const existingPlayer = await RoomPlayer.findOne({ where: { roomId: currentRoom.id, userId: user.id }, transaction });
    if (existingPlayer) { const error = new Error("ALREADY_IN_ROOM"); error.status = 409; throw error; }
    const playerCount = await RoomPlayer.count({ where: { roomId: currentRoom.id }, transaction });
    if (playerCount >= 2) { const error = new Error("ROOM_FULL"); error.status = 409; throw error; }
    await RoomPlayer.create(
      {
        id: playerId,
        roomId: currentRoom.id,
        userId: user.id,
        character: null,
        reconnectToken: playerToken,
        slotNumber,
      },
      { transaction },
    );
    return {
      roomId: currentRoom.id,
      joinCode: currentRoom.joinCode,
      playerId,
      playerToken,
      character: null,
      status: "waiting",
      isCreator: false,
      showIntroduction: true,
    };
  });

const selectCharacter = async (roomId, playerId, requestedCharacter) =>
  withTransaction(async (transaction) => {
    const players = await RoomPlayer.findAll({ where: { roomId }, transaction, lock: transaction.LOCK.UPDATE });
    const occupied = new Set(
      players
        .filter((entry) => entry.id !== playerId)
        .map((entry) => entry.character)
        .filter(Boolean),
    );
    if (requestedCharacter && occupied.has(requestedCharacter))
      throw new Error("Ese mundo ya lo ha elegido el otro jugador.");
    await RoomPlayer.update({ character: requestedCharacter }, { where: { id: playerId }, transaction });
    return getLobbyState(roomId, transaction);
  });

const startGame = async (roomId, playerId) =>
  withTransaction(async (transaction) => {
    const room = await GameRoom.findByPk(roomId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!room) throw new Error("La sala no existe.");
    if (room.creatorPlayerId !== playerId) throw new Error("Solo quien creó la sala puede iniciar la partida.");
    const lobby = await getLobbyState(roomId, transaction);
    const selected = lobby.players.filter((entry) => entry.character);
    if (selected.length !== 2 || new Set(selected.map((entry) => entry.character)).size !== 2) {
      throw new Error("Los dos jugadores deben elegir un mundo distinto.");
    }
    if (lobby.players.some((entry) => !entry.connected)) {
      throw new Error("Los dos jugadores deben estar conectados para empezar.");
    }
    await room.update({ status: "playing" }, { transaction });
    await syncRoomPlayTimer(roomId, transaction);
    return lobby;
  });

app.get("/health", (request, response) => response.json({ ok: true }));

app.post("/api/auth/register", async (request, response) => {
  const input = registerSchema.parse(request.body);
  const existing = await User.findOne({ where: sequelize.where(sequelize.fn("lower", sequelize.col("email")), input.email) });
  if (existing) return response.status(409).json({ error: "EMAIL_IN_USE" });
  const user = await User.create({ id: randomUUID(), displayName: input.displayName, email: input.email, passwordHash: await hashPassword(input.password) });
  await createSession(user.id, response);
  void sendWelcomeEmail({ email: user.email, displayName: user.displayName })
    .catch((error) => console.error("No se pudo enviar el correo de bienvenida:", error.message));
  return response.status(201).json({ user: publicUser(user) });
});

app.post("/api/auth/login", async (request, response) => {
  const input = credentialsSchema.parse(request.body);
  const user = await User.findOne({ where: sequelize.where(sequelize.fn("lower", sequelize.col("email")), input.email) });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) return response.status(401).json({ error: "INVALID_CREDENTIALS" });
  await createSession(user.id, response);
  return response.json({ user: publicUser(user) });
});

app.post("/api/auth/forgot-password", async (request, response) => {
  const { email } = passwordResetRequestSchema.parse(request.body);
  const user = await User.findOne({ where: sequelize.where(sequelize.fn("lower", sequelize.col("email")), email) });
  if (user) {
    const previous = await PasswordResetToken.findOne({ where: { userId: user.id }, order: [["createdAt", "DESC"]] });
    const recentlyRequested = previous && Date.now() - previous.createdAt.getTime() < 60_000;
    if (!recentlyRequested) {
      const token = randomBytes(32).toString("base64url");
      const record = await PasswordResetToken.create({
        id: randomUUID(),
        userId: user.id,
        tokenHash: passwordResetTokenHash(token),
        expiresAt: new Date(Date.now() + passwordResetLifetime),
      });
      const resetUrl = new URL(frontendOrigin);
      resetUrl.searchParams.set("resetToken", token);
      try {
        await sendPasswordResetEmail({ email: user.email, displayName: user.displayName, resetUrl: resetUrl.toString() });
      } catch (error) {
        await record.destroy();
        console.error("No se pudo enviar el correo de recuperación:", error.message);
      }
    }
  }
  return response.json({ accepted: true });
});

app.post("/api/auth/reset-password", async (request, response) => {
  const input = passwordResetSchema.parse(request.body);
  const changed = await withTransaction(async (transaction) => {
    const record = await PasswordResetToken.findOne({
      where: { tokenHash: passwordResetTokenHash(input.token), usedAt: null },
      include: [{ model: User, as: "user", required: true }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!record || record.expiresAt <= new Date()) return false;
    await record.user.update({ passwordHash: await hashPassword(input.password) }, { transaction });
    await PasswordResetToken.update({ usedAt: new Date() }, { where: { userId: record.userId, usedAt: null }, transaction });
    await UserSession.destroy({ where: { userId: record.userId }, transaction });
    return true;
  });
  if (!changed) return response.status(400).json({ error: "INVALID_RESET_TOKEN" });
  return response.json({ changed: true });
});

app.post("/api/auth/logout", async (request, response) => { await clearSession(request, response); return response.status(204).end(); });
app.get("/api/auth/me", requireUser, (request, response) => response.json({ user: publicUser(request.user) }));

app.get("/api/admin/users", requireUser, requireAdmin, async (request, response) => {
  const users = await User.findAll({ attributes: ["id", "displayName", "email", "role", "createdAt"], order: [["createdAt", "DESC"]] });
  return response.json({ users });
});

app.delete("/api/admin/users/:userId", requireUser, requireAdmin, async (request, response) => {
  const { userId } = z.object({ userId: z.string().uuid() }).parse(request.params);
  if (userId === request.user.id) return response.status(400).json({ error: "CANNOT_DELETE_SELF" });
  const deletedUser = await withTransaction(async (transaction) => {
    const user = await User.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!user) return null;
    const deletedAccount = { email: user.email, displayName: user.displayName };
    const memberships = await RoomPlayer.findAll({ where: { userId }, attributes: ["roomId"], transaction });
    const roomIds = [...new Set(memberships.map(({ roomId }) => roomId))];
    await user.destroy({ transaction });
    if (roomIds.length) {
      const remaining = await RoomPlayer.findAll({ where: { roomId: { [Op.in]: roomIds } }, attributes: ["roomId"], transaction, raw: true });
      const occupied = new Set(remaining.map(({ roomId }) => roomId));
      const emptyRooms = roomIds.filter((roomId) => !occupied.has(roomId));
      if (emptyRooms.length) await GameRoom.destroy({ where: { id: { [Op.in]: emptyRooms } }, transaction });
    }
    return deletedAccount;
  });
  if (!deletedUser) return response.status(404).json({ error: "USER_NOT_FOUND" });
  if (deletedUser.email) {
    try {
      await sendAccountDeletedEmail(deletedUser);
    } catch (error) {
      console.error("No se pudo enviar el correo de cuenta eliminada:", error.message);
    }
  }
  return response.status(204).end();
});

app.get("/api/save-slots", requireUser, async (request, response) => {
  const players = await RoomPlayer.findAll({
    where: { userId: request.user.id },
    include: [{ model: GameRoom, as: "room", required: true }, { model: PlayerCheckpoint, as: "checkpoint", required: false }],
    order: [["slotNumber", "ASC"]],
  });
  const now = Date.now();
  return response.json({ slots: players.map((player) => ({
    slotNumber: player.slotNumber,
    roomId: player.roomId,
    playerId: player.id,
    playerToken: player.reconnectToken,
    character: player.character,
    isCreator: player.room.creatorPlayerId === player.id,
    joinCode: player.room.joinCode,
    name: player.room.name,
    status: player.room.status,
    playTimeSeconds: playTimerSnapshot(player.room, now).elapsedSeconds,
    updatedAt: player.room.lastActivityAt,
    checkpoint: player.checkpoint ? { position: player.checkpoint.position, rotationY: player.checkpoint.rotationY, roomKey: player.checkpoint.roomKey, diaryEntries: player.checkpoint.diaryEntries, hintHistory: player.checkpoint.hintHistory } : null,
  })) });
});

app.post("/api/rooms", requireUser, async (request, reply) => {
  const input = createSavedRoomSchema.parse(request.body);
  return reply.status(201).json(await createRoom(request.user, input));
});

app.post("/api/rooms/:joinCode/join", requireUser, async (request, reply) => {
  const input = saveSlotSchema.parse(request.body);
  const params = z.object({ joinCode: z.string().length(6) }).parse(request.params);
  return reply.json(await joinRoom(params.joinCode, request.user, input));
});

app.delete("/api/rooms/:roomId", requireUser, async (request, response) => {
  const { roomId } = z.object({ roomId: z.string().uuid() }).parse(request.params);
  const membership = await RoomPlayer.findOne({ where: { roomId, userId: request.user.id }, include: [{ model: GameRoom, as: "room", required: true }] });
  if (!membership) return response.status(404).json({ error: "ROOM_NOT_FOUND" });
  const otherPlayers = await RoomPlayer.findAll({
    where: { roomId, userId: { [Op.ne]: request.user.id } },
    include: [{ model: User, as: "user", attributes: ["email", "displayName"], required: true }],
  });
  const gameName = membership.room.name;
  await GameRoom.destroy({ where: { id: roomId } });
  void Promise.allSettled(otherPlayers
    .filter(({ user }) => user.email)
    .map(({ user }) => sendGameDeletedEmail({
      email: user.email,
      displayName: user.displayName,
      gameName,
      deletedBy: request.user.displayName,
    })))
    .then((results) => results.forEach((result) => {
      if (result.status === "rejected") console.error("No se pudo avisar de la partida eliminada:", result.reason?.message ?? result.reason);
    }));
  return response.status(204).end();
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
  const pendingDisconnect = pendingDisconnects.get(player.id);
  if (pendingDisconnect) {
    clearTimeout(pendingDisconnect);
    pendingDisconnects.delete(player.id);
  }
  const sockets = playerSockets.get(player.id) ?? new Set();
  sockets.add(socket.id);
  playerSockets.set(player.id, sockets);
  await RoomPlayer.update({ connected: true }, { where: { id: player.id } });
  await socket.join(socketRoom(roomId));
  const connectedTimer = await syncRoomPlayTimer(roomId);
  io.to(socketRoom(roomId)).emit("game:timer", connectedTimer);

  socket.on("lobby:select-character", async (rawSelection, acknowledge) => {
    try {
      const { character } = characterSelectionSchema.parse(rawSelection);
      const lobby = await selectCharacter(roomId, player.id, character);
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
      const connectedPlayers = await RoomPlayer.count({ where: { roomId, connected: true } });
      if (connectedPlayers !== 2) throw new Error("Tu compañero debe estar conectado para jugar.");
      const action = actionSchema.parse(rawAction);
      const snapshot = await applyAction(roomId, player, action);
      io.to(socketRoom(roomId)).emit("game:state-updated", { ...snapshot, action, actorPlayerId: player.id });
      if (snapshot.state.ending?.phase === "complete") io.to(socketRoom(roomId)).emit("game:timer", await syncRoomPlayTimer(roomId));
      acknowledge?.({ ok: true, ...snapshot });
    } catch (error) {
      acknowledge?.({ ok: false, error: error instanceof Error ? error.message : "Acción no válida." });
    }
  });

  let latestMovement = null;
  socket.on("player:movement", (rawMovement) => {
    const movement = movementSchema.safeParse(rawMovement);
    if (!movement.success) return;
    latestMovement = movement.data;
    void saveCheckpoint(roomId, player.id, movement.data).catch((error) => console.error("No se pudo guardar el punto de continuación:", error));
    socket
      .to(socketRoom(roomId))
      .emit("player:moved", { playerId: player.id, character: player.character, ...movement.data });
  });

  socket.on("player:checkpoint-meta", async (rawMeta) => {
    const meta = checkpointMetaSchema.safeParse(rawMeta);
    if (!meta.success) return;
    try {
      await updateCheckpoint(player.id, roomId, {
        diaryEntries: meta.data.diaryEntries,
        hintHistory: meta.data.hintHistory,
      });
      await GameRoom.update({ lastActivityAt: new Date() }, { where: { id: roomId } });
    } catch (error) {
      console.error("No se pudieron guardar el diario y las pistas:", error);
    }
  });

  socket.on("disconnect", () => {
    if (latestMovement) void saveCheckpoint(roomId, player.id, latestMovement, true).catch((error) => console.error("No se pudo guardar la salida del jugador:", error));
    lastCheckpointWrite.delete(player.id);
    const activeSockets = playerSockets.get(player.id);
    activeSockets?.delete(socket.id);
    if (activeSockets?.size) return;
    playerSockets.delete(player.id);
    const timeout = setTimeout(async () => {
      pendingDisconnects.delete(player.id);
      if (playerSockets.get(player.id)?.size) return;
      await RoomPlayer.update({ connected: false }, { where: { id: player.id } });
      if (playerSockets.get(player.id)?.size) {
        await RoomPlayer.update({ connected: true }, { where: { id: player.id } });
        return;
      }
      const timer = await syncRoomPlayTimer(roomId);
      io.to(socketRoom(roomId)).emit("game:timer", timer);
      io.to(socketRoom(roomId)).emit("room:presence", { playerId: player.id, character: player.character, connected: false });
      const lobby = await getLobbyState(roomId);
      io.to(socketRoom(roomId)).emit("lobby:state", lobby);
    }, 750);
    pendingDisconnects.set(player.id, timeout);
  });
  const snapshot = await getSnapshot(roomId);
  const checkpoint = await PlayerCheckpoint.findByPk(player.id, { raw: true });
  const lobby = await getLobbyState(roomId);
  socket.emit("game:state", { ...snapshot, player, checkpoint });
  socket.emit("game:timer", await syncRoomPlayTimer(roomId));
  socket
    .to(socketRoom(roomId))
    .emit("room:presence", { playerId: player.id, character: player.character, connected: true });
  io.to(socketRoom(roomId)).emit("lobby:state", lobby);
});

const startServer = async ({ listenPort = port, resetPresence = true } = {}) => {
  if (resetPresence) {
    await RoomPlayer.update({ connected: false }, { where: { connected: true } });
    const activeTimers = await GameRoom.findAll({ where: { playStartedAt: { [Op.ne]: null } }, attributes: ["id"] });
    for (const room of activeTimers) await syncRoomPlayTimer(room.id);
  }
  await new Promise((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(listenPort, "0.0.0.0", resolve);
  });
  console.info(`Servidor Express escuchando en el puerto ${httpServer.address().port}`);
  return httpServer;
};

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) await startServer();

export { app, httpServer, startServer };
