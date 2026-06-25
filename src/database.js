require('dotenv').config()
const path = require('path')

let _db
let _dialect

function toPostgres(sql) {
  let i = 0
  return sql.replace(/\?/g, () => `$${++i}`)
}

function getDialect() {
  return _dialect
}

async function initializeDatabase() {
  if (process.env.DATABASE_URL) {
    _dialect = 'postgres'
    const { Pool } = require('pg')
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    _db = {
      all: async (sql, params = []) => {
        const { rows } = await pool.query(toPostgres(sql), params)
        return rows
      },
      get: async (sql, params = []) => {
        const { rows } = await pool.query(toPostgres(sql), params)
        return rows[0] ?? null
      },
      run: async (sql, params = []) => {
        await pool.query(toPostgres(sql), params)
      },
      // Runs fn inside a single dedicated connection wrapped in BEGIN/COMMIT.
      // Any throw rolls the whole thing back — DDL included (Postgres has
      // transactional DDL). tx exposes the same all/get/run bound to that client.
      transaction: async (fn) => {
        const client = await pool.connect()
        try {
          await client.query('BEGIN')
          const tx = {
            all: async (sql, params = []) => (await client.query(toPostgres(sql), params)).rows,
            get: async (sql, params = []) => {
              const { rows } = await client.query(toPostgres(sql), params)
              return rows[0] ?? null
            },
            run: async (sql, params = []) => { await client.query(toPostgres(sql), params) }
          }
          const result = await fn(tx)
          await client.query('COMMIT')
          return result
        } catch (err) {
          try { await client.query('ROLLBACK') } catch { /* connection may be dead */ }
          throw err
        } finally {
          client.release()
        }
      }
    }

    await _db.run(`
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        estado TEXT DEFAULT 'activo',
        herramientas TEXT,
        fecha_creacion TEXT NOT NULL,
        fecha_modificacion TEXT NOT NULL
      )
    `)
    await _db.run(`
      CREATE TABLE IF NOT EXISTS ejecuciones (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        estado TEXT,
        duracion_ms INTEGER,
        mensaje_error TEXT,
        payload_raw TEXT,
        FOREIGN KEY (workflow_id) REFERENCES workflows(id)
      )
    `)
    await _db.run(`
      CREATE TABLE IF NOT EXISTS documentacion (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        tipo TEXT,
        contenido TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (workflow_id) REFERENCES workflows(id)
      )
    `)
  } else {
    _dialect = 'sqlite'
    const Database = require('better-sqlite3')
    const sqlite = new Database(path.join(__dirname, '../automation-hub.db'))

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        estado TEXT DEFAULT 'activo',
        herramientas TEXT,
        fecha_creacion TEXT NOT NULL,
        fecha_modificacion TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS ejecuciones (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        estado TEXT,
        duracion_ms INTEGER,
        mensaje_error TEXT,
        payload_raw TEXT,
        FOREIGN KEY (workflow_id) REFERENCES workflows(id)
      );
      CREATE TABLE IF NOT EXISTS documentacion (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        tipo TEXT,
        contenido TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (workflow_id) REFERENCES workflows(id)
      );
    `)

    _db = {
      all: (sql, params = []) => Promise.resolve(sqlite.prepare(sql).all(...params)),
      get:  (sql, params = []) => Promise.resolve(sqlite.prepare(sql).get(...params) ?? null),
      run:  (sql, params = []) => Promise.resolve(sqlite.prepare(sql).run(...params)),
      // better-sqlite3 is synchronous and single-connection, so manual
      // BEGIN/COMMIT via exec gives us all-or-nothing semantics. SQLite has
      // transactional DDL too, so CREATE/ALTER inside here roll back on throw.
      transaction: async (fn) => {
        sqlite.exec('BEGIN')
        try {
          const tx = {
            all: (sql, params = []) => Promise.resolve(sqlite.prepare(sql).all(...params)),
            get: (sql, params = []) => Promise.resolve(sqlite.prepare(sql).get(...params) ?? null),
            run: (sql, params = []) => Promise.resolve(sqlite.prepare(sql).run(...params))
          }
          const result = await fn(tx)
          sqlite.exec('COMMIT')
          return result
        } catch (err) {
          try { sqlite.exec('ROLLBACK') } catch { /* nothing to roll back */ }
          throw err
        }
      }
    }
  }

  // Apply pending schema migrations after base tables exist, before serving.
  // Lazy require avoids a circular dependency with the runner.
  const { runMigrations } = require('./migrations/runner')
  await runMigrations()

  console.log('Base de datos inicializada correctamente')
}

// Proxy delays _db lookup until call time — safe because routes are only
// called after initializeDatabase() resolves (server.js awaits it).
const db = new Proxy({}, {
  get(_, method) {
    return (...args) => _db[method](...args)
  }
})

module.exports = { db, initializeDatabase, getDialect }
