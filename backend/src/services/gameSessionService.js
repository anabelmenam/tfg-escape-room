import { randomUUID } from "node:crypto";
import { GameEvent, GameRoom, GameState, PlayerCheckpoint, RoomPlayer } from "../models/index.js";
import { withTransaction } from "../db.js";
import { reduceAction } from "../gameLogic.js";

const lastCheckpointWrite = new Map();

export const playTimerSnapshot = (room, now = Date.now()) => {
  const startedAt = room.playStartedAt ? new Date(room.playStartedAt).getTime() : null;
  const activeSeconds = startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
  return {
    elapsedSeconds: Math.max(0, Number(room.playTimeSeconds ?? 0) + activeSeconds),
    running: startedAt !== null && room.status === "playing",
    serverNow: now,
  };
};

export const syncRoomPlayTimer = async (roomId, transaction = null) => {
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
    const accumulated =
      Number(room.playTimeSeconds ?? 0) +
      Math.max(0, Math.floor((now - new Date(room.playStartedAt).getTime()) / 1000));
    await room.update({ playTimeSeconds: accumulated, playStartedAt: null }, { transaction });
  }
  return playTimerSnapshot(room, now);
};

export const updateCheckpoint = async (playerId, roomId, patch) => {
  const [updated] = await PlayerCheckpoint.update({ ...patch, updatedAt: new Date() }, { where: { playerId } });
  if (updated) return;
  try {
    await PlayerCheckpoint.create({ playerId, roomId, ...patch, updatedAt: new Date() });
  } catch (error) {
    const [retried] = await PlayerCheckpoint.update({ ...patch, updatedAt: new Date() }, { where: { playerId } });
    if (!retried) throw error;
  }
};

export const saveCheckpoint = async (roomId, playerId, movement, force = false) => {
  const now = Date.now();
  if (!force && now - (lastCheckpointWrite.get(playerId) ?? 0) < 5000) return;
  lastCheckpointWrite.set(playerId, now);
  await updateCheckpoint(playerId, roomId, {
    position: movement.position,
    rotationY: movement.rotationY,
    roomKey: movement.roomKey ?? null,
  });
  await GameRoom.update({ lastActivityAt: new Date() }, { where: { id: roomId } });
};

export const clearCheckpointThrottle = (playerId) => lastCheckpointWrite.delete(playerId);

export const applyAction = async (roomId, player, action) =>
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
        id: randomUUID(), roomId, actorPlayerId: player.id, actionId: action.actionId,
        revision: nextRevision, eventType: action.type, payload: action,
      },
      { transaction },
    );
    await GameRoom.update(
      {
        lastActivityAt: new Date(),
        ...(nextState.ending?.phase === "complete" ? { status: "finished", finishedAt: new Date() } : {}),
      },
      { where: { id: roomId }, transaction },
    );
    if (nextState.ending?.phase === "complete") await syncRoomPlayTimer(roomId, transaction);
    return { revision: nextRevision, state: nextState };
  });
