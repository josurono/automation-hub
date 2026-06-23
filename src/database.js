require('dotenv').config()
const path = require('path')

let _db

function toPostgres(sql) {
  let i = 0
  return sql.replace(/\?/g, () => `$${++i}`)
}

async function initializeDatabase() {
  if (process.env.DATABASE_URL) {
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
      run:  (sql, params = []) => Promise.resolve(sqlite.prepare(sql).run(...params))
    }
  }

  console.log('Base de datos inicializada correctamente')
}

// Proxy delays _db lookup until call time — safe because routes are only
// called after initializeDatabase() resolves (server.js awaits it).
const db = new Proxy({}, {
  get(_, method) {
    return (...args) => _db[method](...args)
  }
})

module.exports = { db, initializeDatabase }
