const express = require('express')
const router = express.Router()
const { randomUUID } = require('crypto')
const store = require('../data/store')

router.post('/execution', async (req, res) => {
  const { workflow_id, estado, duracion_ms, mensaje_error } = req.body

  if (!workflow_id) {
    return res.status(400).json({ error: 'workflow_id es obligatorio' })
  }

  try {
    // Endpoint público (sin JWT): la organización se DERIVA del workflow,
    // nunca de un campo del payload de Make.
    const wf = await store.workflows.organizationIdOf(workflow_id)
    if (!wf) {
      return res.status(404).json({ error: 'Workflow no encontrado' })
    }

    const id = randomUUID()
    const timestamp = req.body.timestamp || new Date().toISOString()

    await store.ejecuciones.insert(wf.organization_id, {
      id,
      workflow_id,
      timestamp,
      estado: estado || 'desconocido',
      duracion_ms: duracion_ms || null,
      mensaje_error: mensaje_error || null,
      payload_raw: JSON.stringify(req.body),
    })

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
