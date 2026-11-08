import { randomUUID } from "node:crypto";
import { withTransaction } from "../db.js";
import { GameRoom, GameState, RoomPlayer, User } from "../models/index.js";
import { createInitialState } from "../state.js";
import { makeJoinCode, normaliseCode } from "../serverUtils.js";
import { syncRoomPlayTimer } from "./gameSessionService.js";

export const ensureFreeSlot = async (userId, slotNumber, transaction) => {
  const occupied = await RoomPlayer.findOne({
    where: { userId, slotNumber },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (occupied) {
    const error = new Error("SAVE_SLOT_OCCUPIED");
    error.status = 409;
    throw error;
  }
};

export const getPlayerFromToken = async (roomId, token) => {
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

export const getSnapshot = async (roomId, transaction) => {
  const snapshot = await GameState.findByPk(roomId, { attributes: ["revision", "state"], transaction, raw: true });
  if (!snapshot) throw new Error("La sala no existe.");
  return snapshot;
};

export const getLobbyState = async (roomId, transaction) => {
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

export const createRoom = async (user, { slotNumber, name }) => {
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
        return {
          roomId,
          joinCode,
          playerId,
          playerToken,
          character: null,
          status: "waiting",
          isCreator: true,
          showIntroduction: true,
        };
      });
    } catch (error) {
      const collision = error?.name === "SequelizeUniqueConstraintError" && error?.fields?.join_code;
      if (!collision || attempt === 4) throw error;
    }
  }
  throw new Error("No se pudo crear la sala.");
};

export const joinRoom = async (joinCode, user, { slotNumber }) =>
  withTransaction(async (transaction) => {
    const room = await GameRoom.findOne({
      where: { joinCode: normaliseCode(joinCode) },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!room) {
      const error = new Error("ROOM_NOT_FOUND");
      error.status = 404;
      throw error;
    }
    if (room.status !== "waiting") {
      const error = new Error("ROOM_NOT_JOINABLE");
      error.status = 409;
      throw error;
    }
    await ensureFreeSlot(user.id, slotNumber, transaction);
    if (await RoomPlayer.findOne({ where: { roomId: room.id, userId: user.id }, transaction })) {
      const error = new Error("ALREADY_IN_ROOM");
      error.status = 409;
      throw error;
    }
    if ((await RoomPlayer.count({ where: { roomId: room.id }, transaction })) >= 2) {
      const error = new Error("ROOM_FULL");
      error.status = 409;
      throw error;
    }
    const playerId = randomUUID();
    const playerToken = randomUUID();
    await RoomPlayer.create(
      { id: playerId, roomId: room.id, userId: user.id, character: null, reconnectToken: playerToken, slotNumber },
      { transaction },
    );
    return {
      roomId: room.id,
      joinCode: room.joinCode,
      playerId,
      playerToken,
      character: null,
      status: "waiting",
      isCreator: false,
      showIntroduction: true,
    };
  });

export const selectCharacter = async (roomId, playerId, requestedCharacter) =>
  withTransaction(async (transaction) => {
    const players = await RoomPlayer.findAll({ where: { roomId }, transaction, lock: transaction.LOCK.UPDATE });
    const occupied = new Set(
      players
        .filter(({ id }) => id !== playerId)
        .map(({ character }) => character)
        .filter(Boolean),
    );
    if (requestedCharacter && occupied.has(requestedCharacter))
      throw new Error("Ese mundo ya lo ha elegido el otro jugador.");
    await RoomPlayer.update({ character: requestedCharacter }, { where: { id: playerId }, transaction });
    return getLobbyState(roomId, transaction);
  });

export const startGame = async (roomId, playerId) =>
  withTransaction(async (transaction) => {
    const room = await GameRoom.findByPk(roomId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!room) throw new Error("La sala no existe.");
    if (room.creatorPlayerId !== playerId) throw new Error("Solo quien creó la sala puede iniciar la partida.");
    const lobby = await getLobbyState(roomId, transaction);
    const selected = lobby.players.filter(({ character }) => character);
    if (selected.length !== 2 || new Set(selected.map(({ character }) => character)).size !== 2)
      throw new Error("Los dos jugadores deben elegir un mundo distinto.");
    if (lobby.players.some(({ connected }) => !connected))
      throw new Error("Los dos jugadores deben estar conectados para empezar.");
    await room.update({ status: "playing" }, { transaction });
    await syncRoomPlayTimer(roomId, transaction);
    return lobby;
  });
