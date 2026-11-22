import { createApp } from './app.js'
import { env } from './config/env.js'
import { pool } from './config/db.js'

async function main() {
  // Fail fast if DB is unreachable
  await pool.query('select 1')

  const app = createApp()
  const server = app.listen(env.PORT, () => {
    console.log(`CampusGigs API listening on http://localhost:${env.PORT}`)
  })

  const shutdown = () => {
    server.close(async () => {
      await pool.end()
      process.exit(0)
    })
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
