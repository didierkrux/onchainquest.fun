const { TABLES } = require('../db')

exports.up = async function (knex) {
  // Add unique constraint on event_id + address combination
  await knex.schema.table(TABLES.users, (table) => {
    table.unique(['event_id', 'address'], 'users_event_id_address_unique')
  })
}

exports.down = async function (knex) {
  await knex.schema.table(TABLES.users, (table) => {
    table.dropUnique(['event_id', 'address'], 'users_event_id_address_unique')
  })
} 
