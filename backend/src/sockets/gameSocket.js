import { z } from "zod";
import { GameRoom, PlayerCheckpoint, RoomPlayer } from "../models/index.js";
import { actionSchema, checkpointMetaSchema, characterSelectionSchema, movementSchema } from "../schemas.js";
import { socketRoom } from "../serverUtils.js";
import {
  applyAction,
  clearCheckpointThrottle,
  saveCheckpoint,
  syncRoomPlayTimer,
  updateCheckpoint,
} from "../services/gameSessionService.js";
import { getLobbyState, getPlayerFromToken, getSnapshot, selectCharacter, startGame } from "../services/roomService.js";

export const registerGameSocket = (io) => {
  const playerSockets = new Map();
  const pendingDisconnects = new Map();
  io.use(async (socket, next) => {
    try {
      const input = z
        .object({ roomId: z.string().uuid(), playerToken: z.string().uuid() })
        .parse(socket.handshake.auth);
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
    const pending = pendingDisconnects.get(player.id);
    if (pending) {
      clearTimeout(pending);
      pendingDisconnects.delete(player.id);
    }
    const sockets = playerSockets.get(player.id) ?? new Set();
    sockets.add(socket.id);
    playerSockets.set(player.id, sockets);
    await RoomPlayer.update({ connected: true }, { where: { id: player.id } });
    await socket.join(socketRoom(roomId));
    io.to(socketRoom(roomId)).emit("game:timer", await syncRoomPlayTimer(roomId));
    socket.on("lobby:select-character", async (raw, acknowledge) => {
      try {
        const { character } = characterSelectionSchema.parse(raw);
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

    socket.on("game:action", async (raw, acknowledge) => {
      try {
        if ((await RoomPlayer.count({ where: { roomId, connected: true } })) !== 2)
          throw new Error("Tu compañero debe estar conectado para jugar.");
        const action = actionSchema.parse(raw);
        const snapshot = await applyAction(roomId, player, action);
        io.to(socketRoom(roomId)).emit("game:state-updated", { ...snapshot, action, actorPlayerId: player.id });
        if (snapshot.state.ending?.phase === "complete")
          io.to(socketRoom(roomId)).emit("game:timer", await syncRoomPlayTimer(roomId));
        acknowledge?.({ ok: true, ...snapshot });
      } catch (error) {
        acknowledge?.({ ok: false, error: error instanceof Error ? error.message : "Acción no válida." });
      }
    });

    let latestMovement = null;
    socket.on("player:movement", (raw) => {
      const movement = movementSchema.safeParse(raw);
      if (!movement.success) return;
      latestMovement = movement.data;
      void saveCheckpoint(roomId, player.id, movement.data).catch((error) =>
        console.error("No se pudo guardar el punto de continuación:", error),
      );
      socket
        .to(socketRoom(roomId))
        .emit("player:moved", { playerId: player.id, character: player.character, ...movement.data });
    });

    socket.on("player:checkpoint-meta", async (raw) => {
      const meta = checkpointMetaSchema.safeParse(raw);
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
      if (latestMovement)
        void saveCheckpoint(roomId, player.id, latestMovement, true).catch((error) =>
          console.error("No se pudo guardar la salida del jugador:", error),
        );
      clearCheckpointThrottle(player.id);
      const active = playerSockets.get(player.id);
      active?.delete(socket.id);
      if (active?.size) return;
      playerSockets.delete(player.id);
      const timeout = setTimeout(async () => {
        pendingDisconnects.delete(player.id);
        if (playerSockets.get(player.id)?.size) return;
        await RoomPlayer.update({ connected: false }, { where: { id: player.id } });
        if (playerSockets.get(player.id)?.size) {
          await RoomPlayer.update({ connected: true }, { where: { id: player.id } });
          return;
        }
        io.to(socketRoom(roomId)).emit("game:timer", await syncRoomPlayTimer(roomId));
        io.to(socketRoom(roomId)).emit("room:presence", {
          playerId: player.id,
          character: player.character,
          connected: false,
        });
        io.to(socketRoom(roomId)).emit("lobby:state", await getLobbyState(roomId));
      }, 750);
      pendingDisconnects.set(player.id, timeout);
    });
    const snapshot = await getSnapshot(roomId);
    const checkpoint = await PlayerCheckpoint.findByPk(player.id, { raw: true });
    socket.emit("game:state", { ...snapshot, player, checkpoint });
    socket.emit("game:timer", await syncRoomPlayTimer(roomId));
    socket
      .to(socketRoom(roomId))
      .emit("room:presence", { playerId: player.id, character: player.character, connected: true });
    io.to(socketRoom(roomId)).emit("lobby:state", await getLobbyState(roomId));
  });
};
