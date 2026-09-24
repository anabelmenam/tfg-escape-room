export async function up(queryInterface, Sequelize, { transaction }) {
  const options = { transaction };
  const tables = new Set(await queryInterface.showAllTables(options));
  const uuid = () => ({ type: Sequelize.UUID, allowNull: false, primaryKey: true });
  const date = () => ({ type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") });
  const reference = (model, onDelete = "CASCADE", allowNull = false) => ({
    type: Sequelize.UUID,
    allowNull,
    references: { model, key: "id" },
    onDelete,
  });
  const create = async (name, attributes, constraints = []) => {
    if (tables.has(name)) return;
    await queryInterface.createTable(name, attributes, options);
    for (const constraint of constraints) {
      await queryInterface.addConstraint(name, { ...constraint, transaction });
    }
  };

  await create(
    "users",
    {
      id: uuid(),
      display_name: { type: Sequelize.TEXT, allowNull: false },
      created_at: date(),
    },
    [
      {
        fields: ["display_name"],
        type: "check",
        name: "users_display_name_check",
        where: Sequelize.literal("char_length(display_name) BETWEEN 1 AND 40"),
      },
    ],
  );

  await create(
    "game_rooms",
    {
      id: uuid(),
      join_code: { type: Sequelize.CHAR(6), allowNull: false, unique: true },
      status: { type: Sequelize.TEXT, allowNull: false, defaultValue: "waiting" },
      created_at: date(),
      finished_at: { type: Sequelize.DATE, allowNull: true },
    },
    [
      {
        fields: ["status"],
        type: "check",
        name: "game_rooms_status_check",
        where: { status: ["waiting", "playing", "finished"] },
      },
    ],
  );

  await create(
    "room_players",
    {
      id: uuid(),
      room_id: reference("game_rooms"),
      user_id: reference("users"),
      timeline: { type: Sequelize.TEXT, allowNull: true },
      reconnect_token: { type: Sequelize.UUID, allowNull: false, unique: true },
      connected: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      joined_at: date(),
    },
    [
      {
        fields: ["timeline"],
        type: "check",
        name: "room_players_timeline_check",
        where: { timeline: ["past", "present"] },
      },
      { fields: ["room_id", "user_id"], type: "unique", name: "room_players_room_id_user_id_key" },
    ],
  );

  await create(
    "game_states",
    {
      room_id: { ...reference("game_rooms"), primaryKey: true },
      revision: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      state: { type: Sequelize.JSONB, allowNull: false },
      updated_at: date(),
    },
    [
      {
        fields: ["revision"],
        type: "check",
        name: "game_states_revision_check",
        where: { revision: { [Sequelize.Op.gte]: 0 } },
      },
    ],
  );

  await create(
    "game_events",
    {
      id: uuid(),
      room_id: reference("game_rooms"),
      actor_player_id: reference("room_players", "SET NULL", true),
      action_id: { type: Sequelize.UUID, allowNull: false },
      revision: { type: Sequelize.INTEGER, allowNull: false },
      event_type: { type: Sequelize.TEXT, allowNull: false },
      payload: { type: Sequelize.JSONB, allowNull: false },
      created_at: date(),
    },
    [
      { fields: ["room_id", "action_id"], type: "unique", name: "game_events_room_id_action_id_key" },
      { fields: ["room_id", "revision"], type: "unique", name: "game_events_room_id_revision_key" },
    ],
  );
  const indexes = await queryInterface.showIndex("game_events", options);
  if (!indexes.some((index) => index.name === "game_events_room_revision_idx")) {
    await queryInterface.addIndex("game_events", ["room_id", { name: "revision", order: "DESC" }], {
      name: "game_events_room_revision_idx",
      transaction,
    });
  }
}

export async function down(queryInterface, Sequelize, { transaction }) {
  for (const table of ["game_events", "game_states", "room_players", "game_rooms", "users"]) {
    await queryInterface.dropTable(table, { transaction });
  }
}
