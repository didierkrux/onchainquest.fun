require('dotenv').config({ path: '.env.local' })
require('dotenv').config()

module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: './db_migrations'
  }
}
