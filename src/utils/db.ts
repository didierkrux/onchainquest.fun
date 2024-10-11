import knex from 'knex'
import knexConfig from '../../knexfile'

const db = knex(knexConfig)

export default db
