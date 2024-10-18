const { TABLES } = require('../db')

exports.up = async function (knex) {
  await knex.schema.table(TABLES.users, (table) => {
    table.string('basename').nullable()
    table.string('basename_avatar').nullable()
  })
}

exports.down = async function (knex) {
  await knex.schema.table(TABLES.users, (table) => {
    table.dropColumn('basename')
    table.dropColumn('basename_avatar')
  })
}
