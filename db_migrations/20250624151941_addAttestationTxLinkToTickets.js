const { TABLES } = require('../db')

exports.up = async function (knex) {
  await knex.schema.table(TABLES.tickets, (table) => {
    table.string('attestation_tx_link').nullable()
  })
}

exports.down = async function (knex) {
  await knex.schema.table(TABLES.tickets, (table) => {
    table.dropColumn('attestation_tx_link')
  })
} 
