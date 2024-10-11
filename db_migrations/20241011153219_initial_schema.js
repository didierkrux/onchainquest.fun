const { TABLES, addIdAndTimestamps, onUpdateTrigger, ON_UPDATE_TIMESTAMP_FUNCTION, DROP_ON_UPDATE_TIMESTAMP_FUNCTION } = require('../db')

exports.up = async function (knex) {
  await knex.raw(ON_UPDATE_TIMESTAMP_FUNCTION)
  // events: id, name, (slug), config (dark/white, theme-color), lang_short, label, label_tr), data_en (agenda, sponsors, venue, booths, prizes), data_tr, is_archived
  await knex.schema.createTable(TABLES.events, function (table) {
    addIdAndTimestamps(table)
    table.string('name').notNullable()
    table.jsonb('config').nullable().defaultTo({}).index(null, 'GIN')
    table.jsonb('data_en').nullable().defaultTo({}).index(null, 'GIN')
    table.jsonb('data_tr').nullable().defaultTo({}).index(null, 'GIN')
    table.boolean('is_archived').notNullable().defaultTo(false)
  })
  await knex.raw(onUpdateTrigger(TABLES.events))

  // users: id, event_id, address, username, avatar, role, score, tasks (object)
  await knex.schema.createTable(TABLES.users, function (table) {
    addIdAndTimestamps(table)
    table.integer('event_id')
      .notNullable()
      .references('id')
      .inTable(TABLES.events)
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
      .index()
    table.string('address').notNullable().index()
    table.string('username').nullable().index()
    table.string('avatar').nullable()
    table.string('role').nullable().index()
    table.integer('score').notNullable().defaultTo(0)
    table.jsonb('tasks').nullable().defaultTo({}).index(null, 'GIN')
  })
  await knex.raw(onUpdateTrigger(TABLES.users))
}

exports.down = async function (knex) {
  await knex.schema.dropTable(TABLES.users)
  await knex.schema.dropTable(TABLES.events)
  await knex.raw(DROP_ON_UPDATE_TIMESTAMP_FUNCTION)
}
