import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

const options = (tableName) => ({ tableName, timestamps: false, underscored: true });
const id = () => ({ type: DataTypes.UUID, primaryKey: true, allowNull: false });
const date = () => ({ type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW });

export const User = sequelize.define(
  "User",
  {
    id: id(),
    displayName: { type: DataTypes.TEXT, allowNull: false, validate: { len: [1, 40] } },
    email: { type: DataTypes.TEXT, allowNull: true },
    passwordHash: { type: DataTypes.TEXT, allowNull: true },
    role: { type: DataTypes.TEXT, allowNull: false, defaultValue: "player", validate: { isIn: [["player", "admin"]] } },
    createdAt: date(),
  },
  options("users"),
);

export const GameRoom = sequelize.define(
  "GameRoom",
  {
    id: id(),
    joinCode: { type: DataTypes.CHAR(6), allowNull: false, unique: true },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "waiting",
      validate: { isIn: [["waiting", "playing", "finished"]] },
    },
    creatorPlayerId: { type: DataTypes.UUID, allowNull: true },
    name: { type: DataTypes.TEXT, allowNull: false, defaultValue: "Partida" },
    createdAt: date(),
    finishedAt: { type: DataTypes.DATE, allowNull: true },
    lastActivityAt: date(),
  },
  options("game_rooms"),
);

export const RoomPlayer = sequelize.define(
  "RoomPlayer",
  {
    id: id(),
    roomId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    timeline: { type: DataTypes.TEXT, allowNull: true, validate: { isIn: [["past", "present"]] } },
    reconnectToken: { type: DataTypes.UUID, allowNull: false, unique: true },
    connected: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    slotNumber: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 3 } },
    joinedAt: date(),
  },
  options("room_players"),
);

export const GameState = sequelize.define(
  "GameState",
  {
    roomId: id(),
    revision: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
    state: { type: DataTypes.JSONB, allowNull: false },
    updatedAt: date(),
  },
  options("game_states"),
);

export const GameEvent = sequelize.define(
  "GameEvent",
  {
    id: id(),
    roomId: { type: DataTypes.UUID, allowNull: false },
    actorPlayerId: { type: DataTypes.UUID, allowNull: true },
    actionId: { type: DataTypes.UUID, allowNull: false },
    revision: { type: DataTypes.INTEGER, allowNull: false },
    eventType: { type: DataTypes.TEXT, allowNull: false },
    payload: { type: DataTypes.JSONB, allowNull: false },
    createdAt: date(),
  },
  options("game_events"),
);

export const UserSession = sequelize.define(
  "UserSession",
  {
    id: id(),
    userId: { type: DataTypes.UUID, allowNull: false },
    tokenHash: { type: DataTypes.TEXT, allowNull: false, unique: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    createdAt: date(),
  },
  options("user_sessions"),
);

export const PlayerCheckpoint = sequelize.define(
  "PlayerCheckpoint",
  {
    playerId: id(),
    roomId: { type: DataTypes.UUID, allowNull: false },
    position: { type: DataTypes.JSONB, allowNull: true },
    rotationY: { type: DataTypes.FLOAT, allowNull: true },
    roomKey: { type: DataTypes.TEXT, allowNull: true },
    diaryEntries: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    hintHistory: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    updatedAt: date(),
  },
  options("player_checkpoints"),
);

RoomPlayer.belongsTo(User, { as: "user", foreignKey: "userId", onDelete: "CASCADE" });
RoomPlayer.belongsTo(GameRoom, { as: "room", foreignKey: "roomId", onDelete: "CASCADE" });
GameRoom.hasMany(RoomPlayer, { as: "players", foreignKey: "roomId", onDelete: "CASCADE" });
GameState.belongsTo(GameRoom, { as: "room", foreignKey: "roomId", onDelete: "CASCADE" });
GameEvent.belongsTo(GameRoom, { as: "room", foreignKey: "roomId", onDelete: "CASCADE" });
GameEvent.belongsTo(RoomPlayer, { as: "actor", foreignKey: "actorPlayerId", onDelete: "SET NULL" });
UserSession.belongsTo(User, { as: "user", foreignKey: "userId", onDelete: "CASCADE" });
PlayerCheckpoint.belongsTo(RoomPlayer, { as: "player", foreignKey: "playerId", onDelete: "CASCADE" });
PlayerCheckpoint.belongsTo(GameRoom, { as: "room", foreignKey: "roomId", onDelete: "CASCADE" });
RoomPlayer.hasOne(PlayerCheckpoint, { as: "checkpoint", foreignKey: "playerId", onDelete: "CASCADE" });
