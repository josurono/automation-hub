const { db } = require('../database')

// Ordered list of migrations. Each entry is a module that exports
// { id, up(tx) }. Add new migrations here in the order they must run.
const migrations = [
  require('./001_multi_tenant'),
  require('./002_webhook_token'),
]

// schema_migrations is the bookkeeping table. Identical DDL works in both
// PostgreSQL and SQLite (TEXT + plain CREATE TABLE IF NOT EXISTS).
async function ensureMigrationsTable() {
  await db.run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `)
}

async function getAppliedIds() {
  const rows = await db.all('SELECT id FROM schema_migrations')
  return new Set(rows.map(r => r.id))
}

// Idempotent: only runs migrations not already recorded. Each migration and
// its bookkeeping INSERT share one transaction, so a migration is recorded if
// and only if it fully succeeded. Running this repeatedly is a no-op.
async function runMigrations() {
  await ensureMigrationsTable()
  const applied = await getAppliedIds()
  const pending = migrations.filter(m => !applied.has(m.id))

  if (pending.length === 0) {
    console.log('Migraciones: sin pendientes')
    return
  }

  for (const migration of pending) {
    console.log(`Migraciones: aplicando ${migration.id}...`)
    await db.transaction(async (tx) => {
      await migration.up(tx)
      await tx.run(
        'INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)',
        [migration.id, new Date().toISOString()]
      )
    })
    console.log(`Migraciones: ${migration.id} aplicada`)
  }
}

module.exports = { runMigrations }
