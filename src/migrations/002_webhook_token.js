const crypto = require('crypto')

// 002 — Token secreto por workflow para autenticar el webhook público.
//
// Agrega workflows.webhook_token y genera un token aleatorio seguro para cada
// workflow existente, de modo que ninguno quede sin token. Corre dentro de la
// transacción que abre el runner: si algo falla, se revierte por completo.
// Idéntico en PostgreSQL y SQLite (TEXT nullable + UPDATE por fila).
function generarToken() {
  return crypto.randomBytes(32).toString('hex')
}

module.exports = {
  id: '002_webhook_token',

  async up(tx) {
    // 1. Columna nullable (requisito de SQLite para ADD COLUMN sin default).
    await tx.run('ALTER TABLE workflows ADD COLUMN webhook_token TEXT')

    // 2. Backfill: un token único por cada workflow que aún no lo tenga.
    const filas = await tx.all('SELECT id FROM workflows WHERE webhook_token IS NULL')
    for (const fila of filas) {
      await tx.run('UPDATE workflows SET webhook_token = ? WHERE id = ?', [generarToken(), fila.id])
    }
  },
}
