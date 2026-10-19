import "dotenv/config";
import { Sequelize } from "sequelize";

const connectionString = process.env.DATABASE_URL ?? "postgres://escape_room:escape_room@localhost:5434/escape_room";

export const sequelize = new Sequelize(connectionString, {
  dialect: "postgres",
  logging: false,
});

export const withTransaction = (work) => sequelize.transaction(work);
