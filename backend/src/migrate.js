import { readdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { Sequelize } from "sequelize";
import { sequelize } from "./db.js";

const migrationsDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../migrations");
const migrationFiles = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".js")).sort();
const undo = process.argv.includes("--undo");
const Migration = sequelize.define(
  "Migration",
  {
    name: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
  },
  { tableName: "SequelizeMeta", timestamps: false },
);

try {
  await sequelize.transaction(async (transaction) => {
    await sequelize.query("SELECT pg_advisory_xact_lock(8342026)", { transaction });
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.createTable(
      "SequelizeMeta",
      {
        name: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      },
      { transaction },
    );
    const applied = await Migration.findAll({ order: [["name", "ASC"]], transaction, raw: true });
    const names = new Set(applied.map(({ name }) => name));
    const pending = undo
      ? applied.slice(-1).map(({ name }) => name)
      : migrationFiles.filter((file) => !names.has(file));
    for (const name of pending) {
      if (!migrationFiles.includes(name)) throw new Error(`No se encuentra la migración ${name}.`);
      const migration = await import(pathToFileURL(resolve(migrationsDirectory, name)));
      await migration[undo ? "down" : "up"](queryInterface, Sequelize, { transaction });
      if (undo) await Migration.destroy({ where: { name }, transaction });
      else await Migration.create({ name }, { transaction });
    }
  });
  console.log(undo ? "Última migración revertida." : "Migraciones aplicadas correctamente.");
} finally {
  await sequelize.close();
}
