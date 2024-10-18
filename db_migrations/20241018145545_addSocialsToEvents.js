const { TABLES } = require('../db')

exports.up = async function (knex) {
  await knex.schema.table(TABLES.events, (table) => {
    table.jsonb('socials').nullable().defaultTo({}).index(null, 'GIN')
  })
}

exports.down = async function (knex) {
  await knex.schema.table(TABLES.events, (table) => {
    table.dropColumn('socials')
  })
}
