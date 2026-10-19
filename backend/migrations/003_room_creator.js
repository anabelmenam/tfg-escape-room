export async function up(queryInterface, Sequelize, { transaction }) {
  const columns = await queryInterface.describeTable("game_rooms", { transaction });
  if (!columns.creator_player_id) {
    await queryInterface.addColumn(
      "game_rooms",
      "creator_player_id",
      { type: Sequelize.UUID, allowNull: true },
      { transaction },
    );
  }

  await queryInterface.sequelize.query(
    `UPDATE game_rooms AS room
     SET creator_player_id = first_player.id
     FROM (
       SELECT DISTINCT ON (room_id) room_id, id
       FROM room_players
       ORDER BY room_id, joined_at ASC, id ASC
     ) AS first_player
     WHERE room.id = first_player.room_id
       AND room.creator_player_id IS NULL`,
    { transaction },
  );
}

export async function down(queryInterface, Sequelize, { transaction }) {
  const columns = await queryInterface.describeTable("game_rooms", { transaction });
  if (columns.creator_player_id) {
    await queryInterface.removeColumn("game_rooms", "creator_player_id", { transaction });
  }
}
