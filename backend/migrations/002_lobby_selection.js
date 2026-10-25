export async function up(queryInterface, Sequelize, { transaction }) {
  await queryInterface.changeColumn(
    "room_players",
    "character",
    { type: Sequelize.TEXT, allowNull: true },
    { transaction },
  );
  await queryInterface.sequelize.query(
    'ALTER TABLE "room_players" DROP CONSTRAINT IF EXISTS "room_players_room_id_character_key"',
    { transaction },
  );
  const indexes = await queryInterface.showIndex("room_players", { transaction });
  if (!indexes.some((index) => index.name === "room_players_unique_character_when_selected")) {
    await queryInterface.addIndex("room_players", ["room_id", "character"], {
      name: "room_players_unique_character_when_selected",
      unique: true,
      where: { character: { [Sequelize.Op.ne]: null } },
      transaction,
    });
  }
}

export async function down(queryInterface, Sequelize, { transaction }) {
  await queryInterface.removeIndex("room_players", "room_players_unique_character_when_selected", { transaction });
  await queryInterface.changeColumn(
    "room_players",
    "character",
    { type: Sequelize.TEXT, allowNull: false },
    { transaction },
  );
  await queryInterface.addConstraint("room_players", {
    fields: ["room_id", "character"],
    type: "unique",
    name: "room_players_room_id_character_key",
    transaction,
  });
}
