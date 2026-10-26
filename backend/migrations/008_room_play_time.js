export async function up(queryInterface, Sequelize, { transaction }) {
  const rooms = await queryInterface.describeTable("game_rooms", { transaction });
  if (!rooms.play_time_seconds) {
    await queryInterface.addColumn("game_rooms", "play_time_seconds", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    }, { transaction });
  }
  if (!rooms.play_started_at) {
    await queryInterface.addColumn("game_rooms", "play_started_at", {
      type: Sequelize.DATE,
      allowNull: true,
    }, { transaction });
  }
}

export async function down(queryInterface, Sequelize, { transaction }) {
  const rooms = await queryInterface.describeTable("game_rooms", { transaction });
  if (rooms.play_started_at) await queryInterface.removeColumn("game_rooms", "play_started_at", { transaction });
  if (rooms.play_time_seconds) await queryInterface.removeColumn("game_rooms", "play_time_seconds", { transaction });
}
