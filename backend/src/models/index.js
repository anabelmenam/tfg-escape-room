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
    createdAt: date(),
    finishedAt: { type: DataTypes.DATE, allowNull: true },
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

RoomPlayer.belongsTo(User, { as: "user", foreignKey: "userId", onDelete: "CASCADE" });
RoomPlayer.belongsTo(GameRoom, { as: "room", foreignKey: "roomId", onDelete: "CASCADE" });
GameState.belongsTo(GameRoom, { as: "room", foreignKey: "roomId", onDelete: "CASCADE" });
GameEvent.belongsTo(GameRoom, { as: "room", foreignKey: "roomId", onDelete: "CASCADE" });
GameEvent.belongsTo(RoomPlayer, { as: "actor", foreignKey: "actorPlayerId", onDelete: "SET NULL" });
