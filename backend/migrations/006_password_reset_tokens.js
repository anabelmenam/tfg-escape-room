export async function up(queryInterface, Sequelize, { transaction }) {
  const tables = new Set(await queryInterface.showAllTables({ transaction }));
  if (tables.has("password_reset_tokens")) return;
  await queryInterface.createTable("password_reset_tokens", {
    id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
    user_id: { type: Sequelize.UUID, allowNull: false, references: { model: "users", key: "id" }, onDelete: "CASCADE" },
    token_hash: { type: Sequelize.TEXT, allowNull: false, unique: true },
    expires_at: { type: Sequelize.DATE, allowNull: false },
    used_at: { type: Sequelize.DATE, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  }, { transaction });
  await queryInterface.addIndex("password_reset_tokens", ["user_id"], { name: "password_reset_tokens_user_id", transaction });
}

export async function down(queryInterface, Sequelize, { transaction }) {
  await queryInterface.dropTable("password_reset_tokens", { transaction });
}
