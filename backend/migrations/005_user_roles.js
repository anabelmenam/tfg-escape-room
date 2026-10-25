export async function up(queryInterface, Sequelize, { transaction }) {
  const users = await queryInterface.describeTable("users", { transaction });
  if (!users.role) {
    await queryInterface.addColumn("users", "role", { type: Sequelize.TEXT, allowNull: false, defaultValue: "player" }, { transaction });
    await queryInterface.addConstraint("users", { fields: ["role"], type: "check", name: "users_role_check", where: { role: ["player", "admin"] }, transaction });
  }
}

export async function down(queryInterface, Sequelize, { transaction }) {
  await queryInterface.removeConstraint("users", "users_role_check", { transaction });
  await queryInterface.removeColumn("users", "role", { transaction });
}
