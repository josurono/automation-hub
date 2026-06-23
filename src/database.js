const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(__dirname, '../automation-hub.db'))

function initializeDatabase() {
  db.exec(`
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

  console.log('Base de datos inicializada correctamente')
}

module.exports = { db, initializeDatabase }