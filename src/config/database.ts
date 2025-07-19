import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })
dotenv.config()

export const databaseConfig = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: './db_migrations'
  }
} 
