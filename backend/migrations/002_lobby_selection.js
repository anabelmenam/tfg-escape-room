export async function up(queryInterface, Sequelize, { transaction }) {
  await queryInterface.changeColumn(
    "room_players",
    "timeline",
    { type: Sequelize.TEXT, allowNull: true },
    { transaction },
  );
  await queryInterface.sequelize.query(
    'ALTER TABLE "room_players" DROP CONSTRAINT IF EXISTS "room_players_room_id_timeline_key"',
    { transaction },
  );
  const indexes = await queryInterface.showIndex("room_players", { transaction });
  if (!indexes.some((index) => index.name === "room_players_unique_timeline_when_selected")) {
    await queryInterface.addIndex("room_players", ["room_id", "timeline"], {
      name: "room_players_unique_timeline_when_selected",
      unique: true,
      where: { timeline: { [Sequelize.Op.ne]: null } },
      transaction,
    });
  }
}

export async function down(queryInterface, Sequelize, { transaction }) {
  await queryInterface.removeIndex("room_players", "room_players_unique_timeline_when_selected", { transaction });
  await queryInterface.changeColumn(
    "room_players",
    "timeline",
    { type: Sequelize.TEXT, allowNull: false },
    { transaction },
  );
  await queryInterface.addConstraint("room_players", {
    fields: ["room_id", "timeline"],
    type: "unique",
    name: "room_players_room_id_timeline_key",
    transaction,
  });
}
