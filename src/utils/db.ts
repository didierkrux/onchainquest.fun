import knex from 'knex'
import { databaseConfig } from '../config/database'

const db = knex(databaseConfig)

export default db
