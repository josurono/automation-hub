const express = require('express')
const router = express.Router()
const { db } = require('../database')
const { randomUUID } = require('crypto')

// POST /api/webhooks/execution - Recibir evento de Make o n8n
router.post('/execution', (req, res) => {
  const { workflow_id, estado, duracion_ms, mensaje_error } = req.body

  if (!workflow_id) {
    return res.status(400).json({ error: 'workflow_id es obligatorio' })
  }

  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(workflow_id)
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow no encontrado' })
  }

  const id = randomUUID()
  const timestamp = new Date().toISOString()

  db.prepare(`
    INSERT INTO ejecuciones (id, workflow_id, timestamp, estado, duracion_ms, mensaje_error, payload_raw)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    workflow_id,
    timestamp,
    estado || 'desconocido',
    duracion_ms || null,
    mensaje_error || null,
    JSON.stringify(req.body)
  )

  res.json({
    recibido: true,
    ejecucion_id: id,
    mensaje: `Ejecución registrada: ${estado}`
  })
})

// GET /api/webhooks/health - Verificar que el endpoint está activo
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString()
  })
})

module.exports = router