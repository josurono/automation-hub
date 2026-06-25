const express = require('express')
const router = express.Router()
const store = require('../data/store')

router.get('/', async (req, res) => {
  try {
    const orgId = req.user.organization_id
    const workflows = await store.stats.workflows(orgId)
    const activos = workflows.filter(w => w.estado === 'activo').length
    const ejecuciones = await store.stats.ejecuciones(orgId)
    const exitosas = ejecuciones.filter(e => e.estado === 'exitoso').length
    const tasa = ejecuciones.length > 0 ? Math.round((exitosas / ejecuciones.length) * 100) : 0

    res.json({
      total_workflows: workflows.length,
      activos,
      total_ejecuciones: ejecuciones.length,
      tasa_exito: tasa
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/ejecuciones', async (req, res) => {
  try {
    const rows = await store.stats.ejecucionesConWorkflow(req.user.organization_id)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/documentacion', async (req, res) => {
  try {
    const rows = await store.stats.documentacionConWorkflow(req.user.organization_id)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/analytics', async (req, res) => {
  try {
    const orgId = req.user.organization_id
    const ejecuciones = await store.stats.ejecucionesParaAnalytics(orgId)

    const dias = []
    for (let i = 29; i >= 0; i--) {
      const fecha = new Date()
      fecha.setDate(fecha.getDate() - i)
      const dia = fecha.toISOString().split('T')[0]
      dias.push({
        fecha: dia,
        exito: ejecuciones.filter(e => e.estado === 'exitoso' && e.timestamp.startsWith(dia)).length,
        fallo: ejecuciones.filter(e => e.estado === 'fallido' && e.timestamp.startsWith(dia)).length
      })
    }

    const byWorkflow = await store.stats.byWorkflow(orgId)

    res.json({ dias, byWorkflow })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
