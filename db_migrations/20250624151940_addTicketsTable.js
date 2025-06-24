const { TABLES, addIdAndTimestamps, onUpdateTrigger } = require('../db')

exports.up = async function (knex) {
  // tickets: id, event_id, user_id (nullable), code, is_used, used_at
  await knex.schema.createTable(TABLES.tickets, function (table) {
    addIdAndTimestamps(table)
    table
      .integer('event_id')
      .notNullable()
      .references('id')
      .inTable(TABLES.events)
      .onUpdate('CASCADE')
      .onDelete('CASCADE')
      .index()
    table
      .integer('user_id')
      .nullable()
      .references('id')
      .inTable(TABLES.users)
      .onUpdate('CASCADE')
      .onDelete('SET NULL')
      .index()
    table.string('code', 6).notNullable().unique().index()
    table.boolean('is_used').notNullable().defaultTo(false).index()
    table.timestamp('used_at').nullable()
  })
  await knex.raw(onUpdateTrigger(TABLES.tickets))
}

exports.down = async function (knex) {
  await knex.schema.dropTable(TABLES.tickets)
}
