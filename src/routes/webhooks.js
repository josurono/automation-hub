const express = require('express')
const router = express.Router()
const { db } = require('../database')
const { randomUUID } = require('crypto')

router.post('/execution', async (req, res) => {
  const { workflow_id, estado, duracion_ms, mensaje_error } = req.body

  if (!workflow_id) {
    return res.status(400).json({ error: 'workflow_id es obligatorio' })
  }

  try {
    const workflow = await db.get('SELECT * FROM workflows WHERE id = ?', [workflow_id])
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow no encontrado' })
    }

    const id = randomUUID()
    const timestamp = req.body.timestamp || new Date().toISOString()

    await db.run(
      `INSERT INTO ejecuciones (id, workflow_id, timestamp, estado, duracion_ms, mensaje_error, payload_raw)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, workflow_id, timestamp, estado || 'desconocido', duracion_ms || null, mensaje_error || null, JSON.stringify(req.body)]
    )

    res.json({ recibido: true, ejecucion_id: id, mensaje: `Ejecución registrada: ${estado}` })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString() })
})

module.exports = router
