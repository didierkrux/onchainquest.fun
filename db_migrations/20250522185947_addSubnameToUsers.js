const { TABLES } = require('../db')

exports.up = async function (knex) {
  await knex.schema.table(TABLES.users, (table) => {
    table.string('subname').nullable().defaultTo(null)
  })
}

exports.down = async function (knex) {
  await knex.schema.table(TABLES.users, (table) => {
    table.dropColumn('subname')
  })
}
