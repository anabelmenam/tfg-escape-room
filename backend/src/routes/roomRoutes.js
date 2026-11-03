import { Router } from "express";
import { Op } from "sequelize";
import { z } from "zod";
import { requireUser } from "../auth.js";
import { sendGameDeletedEmail } from "../email.js";
import { GameRoom, PlayerCheckpoint, RoomPlayer, User } from "../models/index.js";
import { createSavedRoomSchema, saveSlotSchema } from "../schemas.js";
import { playTimerSnapshot } from "../services/gameSessionService.js";
import { createRoom, getPlayerFromToken, getSnapshot, joinRoom } from "../services/roomService.js";

export const createRoomRouter = () => {
  const router = Router();
  router.get("/save-slots", requireUser, async (request, response) => {
    const players = await RoomPlayer.findAll({
      where: { userId: request.user.id },
      include: [{ model: GameRoom, as: "room", required: true }, { model: PlayerCheckpoint, as: "checkpoint", required: false }],
      order: [["slotNumber", "ASC"]],
    });
    const now = Date.now();
    return response.json({ slots: players.map((player) => ({
      slotNumber: player.slotNumber, roomId: player.roomId, playerId: player.id,
      playerToken: player.reconnectToken, character: player.character,
      isCreator: player.room.creatorPlayerId === player.id, joinCode: player.room.joinCode,
      name: player.room.name, status: player.room.status,
      playTimeSeconds: playTimerSnapshot(player.room, now).elapsedSeconds,
      updatedAt: player.room.lastActivityAt,
      checkpoint: player.checkpoint ? {
        position: player.checkpoint.position, rotationY: player.checkpoint.rotationY,
        roomKey: player.checkpoint.roomKey, diaryEntries: player.checkpoint.diaryEntries,
        hintHistory: player.checkpoint.hintHistory,
      } : null,
    })) });
  });
  router.post("/rooms", requireUser, async (request, response) => response.status(201).json(await createRoom(request.user, createSavedRoomSchema.parse(request.body))));
  router.post("/rooms/:joinCode/join", requireUser, async (request, response) => {
    const { joinCode } = z.object({ joinCode: z.string().length(6) }).parse(request.params);
    return response.json(await joinRoom(joinCode, request.user, saveSlotSchema.parse(request.body)));
  });
  router.delete("/rooms/:roomId", requireUser, async (request, response) => {
    const { roomId } = z.object({ roomId: z.string().uuid() }).parse(request.params);
    const membership = await RoomPlayer.findOne({ where: { roomId, userId: request.user.id }, include: [{ model: GameRoom, as: "room", required: true }] });
    if (!membership) return response.status(404).json({ error: "ROOM_NOT_FOUND" });
    const otherPlayers = await RoomPlayer.findAll({ where: { roomId, userId: { [Op.ne]: request.user.id } }, include: [{ model: User, as: "user", attributes: ["email", "displayName"], required: true }] });
    const gameName = membership.room.name;
    await GameRoom.destroy({ where: { id: roomId } });
    void Promise.allSettled(otherPlayers.filter(({ user }) => user.email).map(({ user }) => sendGameDeletedEmail({ email: user.email, displayName: user.displayName, gameName, deletedBy: request.user.displayName }))).then((results) =>
      results.forEach((result) => { if (result.status === "rejected") console.error("No se pudo avisar de la partida eliminada:", result.reason?.message ?? result.reason); }));
    return response.status(204).end();
  });
  router.get("/rooms/:roomId/state", async (request, response) => {
    const { roomId } = z.object({ roomId: z.string().uuid() }).parse(request.params);
    const token = z.string().uuid().parse(request.headers["x-player-token"]);
    const player = await getPlayerFromToken(roomId, token);
    if (!player) return response.status(401).json({ error: "Sesión de jugador no válida." });
    return response.json({ ...(await getSnapshot(roomId)), player });
  });
  return router;
};
