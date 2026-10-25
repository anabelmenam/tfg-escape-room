const OLD_COLUMN = "time" + "line";
const OLD_MUM = "pa" + "st";
const OLD_DAD = "pre" + "sent";

const migrateState = (state) => {
  if (!state || typeof state !== "object") return state;
  const oldCharacters = state[OLD_COLUMN + "s"];
  if (!state.characters && oldCharacters) {
    state.characters = { mum: oldCharacters[OLD_MUM] ?? { objects: {}, puzzles: {} }, dad: oldCharacters[OLD_DAD] ?? { objects: {}, puzzles: {} } };
    delete state[OLD_COLUMN + "s"];
  }
  if (state.inventories && (state.inventories[OLD_MUM] || state.inventories[OLD_DAD])) {
    state.inventories = { mum: state.inventories[OLD_MUM] ?? [], dad: state.inventories[OLD_DAD] ?? [] };
  }
  if (state.ending) {
    for (const field of ["holding", "crossed"]) {
      const value = state.ending[field];
      if (value && (OLD_MUM in value || OLD_DAD in value)) state.ending[field] = { mum: Boolean(value[OLD_MUM]), dad: Boolean(value[OLD_DAD]) };
    }
    const oldSacrificeField = "sacrifice" + OLD_COLUMN[0].toUpperCase() + OLD_COLUMN.slice(1);
    if (oldSacrificeField in state.ending) {
      state.ending.sacrificeCharacter = state.ending[oldSacrificeField] === OLD_MUM ? "mum" : state.ending[oldSacrificeField] === OLD_DAD ? "dad" : null;
      delete state.ending[oldSacrificeField];
    }
  }
  return state;
};

export async function up(queryInterface, Sequelize, { transaction }) {
  const table = await queryInterface.describeTable("room_players", { transaction });
  if (table[OLD_COLUMN] && !table.character) await queryInterface.renameColumn("room_players", OLD_COLUMN, "character", { transaction });
  await queryInterface.sequelize.query(`UPDATE room_players SET character = CASE WHEN character = :oldMum THEN 'mum' WHEN character = :oldDad THEN 'dad' ELSE character END`, { replacements: { oldMum: OLD_MUM, oldDad: OLD_DAD }, transaction });
  await queryInterface.sequelize.query(`ALTER TABLE room_players DROP CONSTRAINT IF EXISTS room_players_${OLD_COLUMN}_check`, { transaction });
  await queryInterface.sequelize.query(`DROP INDEX IF EXISTS room_players_unique_${OLD_COLUMN}_when_selected`, { transaction });
  const indexes = await queryInterface.showIndex("room_players", { transaction });
  if (!indexes.some(({ name }) => name === "room_players_unique_character_when_selected")) {
    await queryInterface.addIndex("room_players", ["room_id", "character"], { name: "room_players_unique_character_when_selected", unique: true, where: { character: { [Sequelize.Op.ne]: null } }, transaction });
  }
  await queryInterface.sequelize.query("ALTER TABLE room_players DROP CONSTRAINT IF EXISTS room_players_character_check", { transaction });
  await queryInterface.addConstraint("room_players", { fields: ["character"], type: "check", name: "room_players_character_check", where: { character: ["mum", "dad"] }, transaction });

  const [rows] = await queryInterface.sequelize.query("SELECT room_id, state FROM game_states", { transaction });
  for (const row of rows) {
    await queryInterface.sequelize.query("UPDATE game_states SET state = CAST(:state AS JSONB) WHERE room_id = :roomId", {
      replacements: { state: JSON.stringify(migrateState(row.state)), roomId: row.room_id },
      transaction,
    });
  }
}

export async function down() {
  throw new Error("La migración de personajes no se revierte para evitar perder el progreso convertido.");
}
