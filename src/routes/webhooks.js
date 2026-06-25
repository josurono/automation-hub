const express = require('express')
const router = express.Router()
const { randomUUID, timingSafeEqual } = require('crypto')
const store = require('../data/store')

// Comparación en tiempo constante. Devuelve false (sin lanzar) si algún valor
// falta o las longitudes difieren, evitando filtrar el token por timing.
function tokensIguales(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

router.post('/execution', async (req, res) => {
  const { workflow_id, estado, duracion_ms, mensaje_error } = req.body

  if (!workflow_id) {
    return res.status(400).json({ error: 'workflow_id es obligatorio' })
  }

  try {
    // Endpoint público (sin JWT): la organización y el token se DERIVAN del
    // workflow, nunca de campos del payload de Make.
    const wf = await store.workflows.findForWebhook(workflow_id)
    if (!wf) {
      return res.status(404).json({ error: 'Workflow no encontrado' })
    }

    // El token llega en el header X-Webhook-Token (Express lo da en minúsculas).
    const tokenHeader = req.headers['x-webhook-token']
    if (!tokensIguales(tokenHeader, wf.webhook_token)) {
      return res.status(401).json({ error: 'No autorizado' })
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
