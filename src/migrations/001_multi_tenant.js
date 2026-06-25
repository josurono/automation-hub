const { randomUUID } = require('crypto')
const bcrypt = require('bcrypt')

// 001 — Convierte el esquema de single-tenant a multi-tenant.
//
// Crea organizations + users, agrega organization_id a las tablas existentes,
// crea la organización y el usuario admin iniciales, y reasigna todos los
// registros existentes a esa organización. Todo corre dentro de UNA
// transacción (el runner la abre): si algo falla, se revierte por completo
// y schema_migrations no registra la 001.
//
// NO toca el login ni las rutas de auth — eso es Fase 2. El password_hash que
// se guarda aquí todavía no se usa para autenticar.
module.exports = {
  id: '001_multi_tenant',

  async up(tx) {
    // --- Validación previa: sin password no hay migración (y nada de DDL) ---
    const password = process.env.INITIAL_ADMIN_PASSWORD
    if (!password) {
      throw new Error(
        'INITIAL_ADMIN_PASSWORD no está definida en el entorno. ' +
        'Defínela antes de aplicar la migración 001 (nunca se guarda en texto plano).'
      )
    }
    // Email del primer usuario: INITIAL_ADMIN_EMAIL > ADMIN_USERNAME > default.
    const email = process.env.INITIAL_ADMIN_EMAIL
      || process.env.ADMIN_USERNAME
      || 'admin@flowvault.local'

    const now = new Date().toISOString()

    // --- 1. organizations ---
    await tx.run(`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `)

    // --- 2. users ---
    await tx.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        organization_id TEXT NOT NULL REFERENCES organizations(id),
        rol TEXT NOT NULL DEFAULT 'admin',
        created_at TEXT NOT NULL
      )
    `)

    // --- 3. organization_id en las tablas existentes ---
    // Nullable + default NULL: requisito de SQLite para ADD COLUMN con
    // REFERENCES. Se rellena en el paso 6; nadie queda en NULL al terminar.
    await tx.run('ALTER TABLE workflows ADD COLUMN organization_id TEXT REFERENCES organizations(id)')
    await tx.run('ALTER TABLE ejecuciones ADD COLUMN organization_id TEXT REFERENCES organizations(id)')
    await tx.run('ALTER TABLE documentacion ADD COLUMN organization_id TEXT REFERENCES organizations(id)')

    // --- 4. organización inicial ---
    const orgId = randomUUID()
    await tx.run(
      'INSERT INTO organizations (id, nombre, created_at) VALUES (?, ?, ?)',
      [orgId, 'Mi Organización', now]
    )

    // --- 5. primer usuario (password hasheado con bcrypt, nunca en claro) ---
    const passwordHash = await bcrypt.hash(password, 10)
    await tx.run(
      'INSERT INTO users (id, email, password_hash, organization_id, rol, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [randomUUID(), email, passwordHash, orgId, 'admin', now]
    )

    // --- 6. backfill: todo lo existente pertenece a la org inicial ---
    // Hay una sola organización, así que asignación directa == herencia.
    // WHERE ... IS NULL garantiza que ningún registro quede sin organización.
    await tx.run('UPDATE workflows SET organization_id = ? WHERE organization_id IS NULL', [orgId])
    await tx.run('UPDATE ejecuciones SET organization_id = ? WHERE organization_id IS NULL', [orgId])
    await tx.run('UPDATE documentacion SET organization_id = ? WHERE organization_id IS NULL', [orgId])
  },
}
