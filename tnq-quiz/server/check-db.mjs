import pg from 'pg'

if (!process.env.DATABASE_URL) {
  console.error('Set DATABASE_URL in .env.server before running this check.')
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
})

try {
  const { rows: [status] } = await pool.query(`
    select to_regclass('tnq.users') is not null
       and to_regclass('tnq.quizzes') is not null
       and to_regclass('tnq.attempts') is not null as schema_ready
  `)
  console.log(status.schema_ready ? 'Database connected. Quiz schema is ready.' : 'Database connected. Quiz schema has not been applied.')
} catch (error) {
  console.error('Database connection check failed.', error.code ?? 'UNKNOWN')
  process.exitCode = 1
} finally {
  await pool.end()
}
