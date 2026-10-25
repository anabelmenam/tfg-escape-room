export async function up(queryInterface, Sequelize, { transaction }) {
  const options = { transaction };
  const tables = new Set(await queryInterface.showAllTables(options));
  const users = await queryInterface.describeTable("users", options);
  if (!users.email) await queryInterface.addColumn("users", "email", { type: Sequelize.TEXT, allowNull: true }, options);
  if (!users.password_hash) await queryInterface.addColumn("users", "password_hash", { type: Sequelize.TEXT, allowNull: true }, options);
  const userIndexes = await queryInterface.showIndex("users", options);
  if (!userIndexes.some(({ name }) => name === "users_email_unique")) {
    await queryInterface.addIndex("users", [Sequelize.fn("lower", Sequelize.col("email"))], { name: "users_email_unique", unique: true, where: { email: { [Sequelize.Op.ne]: null } }, transaction });
  }

  const rooms = await queryInterface.describeTable("game_rooms", options);
  if (!rooms.name) await queryInterface.addColumn("game_rooms", "name", { type: Sequelize.TEXT, allowNull: false, defaultValue: "Partida" }, options);
  if (!rooms.last_activity_at) await queryInterface.addColumn("game_rooms", "last_activity_at", { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") }, options);

  const players = await queryInterface.describeTable("room_players", options);
  if (!players.slot_number) await queryInterface.addColumn("room_players", "slot_number", { type: Sequelize.INTEGER, allowNull: true }, options);
  const playerIndexes = await queryInterface.showIndex("room_players", options);
  if (!playerIndexes.some(({ name }) => name === "room_players_user_slot_unique")) {
    await queryInterface.addIndex("room_players", ["user_id", "slot_number"], { name: "room_players_user_slot_unique", unique: true, where: { slot_number: { [Sequelize.Op.ne]: null } }, transaction });
  }

  if (!tables.has("user_sessions")) await queryInterface.createTable("user_sessions", {
    id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
    user_id: { type: Sequelize.UUID, allowNull: false, references: { model: "users", key: "id" }, onDelete: "CASCADE" },
    token_hash: { type: Sequelize.TEXT, allowNull: false, unique: true },
    expires_at: { type: Sequelize.DATE, allowNull: false },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  }, options);

  if (!tables.has("player_checkpoints")) await queryInterface.createTable("player_checkpoints", {
    player_id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, references: { model: "room_players", key: "id" }, onDelete: "CASCADE" },
    room_id: { type: Sequelize.UUID, allowNull: false, references: { model: "game_rooms", key: "id" }, onDelete: "CASCADE" },
    position: { type: Sequelize.JSONB, allowNull: true },
    rotation_y: { type: Sequelize.FLOAT, allowNull: true },
    room_key: { type: Sequelize.TEXT, allowNull: true },
    diary_entries: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
    hint_history: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  }, options);
}

export async function down(queryInterface, Sequelize, { transaction }) {
  await queryInterface.dropTable("player_checkpoints", { transaction });
  await queryInterface.dropTable("user_sessions", { transaction });
  await queryInterface.removeIndex("room_players", "room_players_user_slot_unique", { transaction });
  await queryInterface.removeColumn("room_players", "slot_number", { transaction });
  await queryInterface.removeColumn("game_rooms", "last_activity_at", { transaction });
  await queryInterface.removeColumn("game_rooms", "name", { transaction });
  await queryInterface.removeIndex("users", "users_email_unique", { transaction });
  await queryInterface.removeColumn("users", "password_hash", { transaction });
  await queryInterface.removeColumn("users", "email", { transaction });
}
