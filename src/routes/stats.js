const express = require('express')
const router = express.Router()
const { db } = require('../database')

router.get('/', async (req, res) => {
  try {
    const workflows = await db.all('SELECT * FROM workflows')
    const activos = workflows.filter(w => w.estado === 'activo').length
    const ejecuciones = await db.all('SELECT * FROM ejecuciones')
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
    const rows = await db.all(`
      SELECT e.*, w.nombre AS workflow_nombre
      FROM ejecuciones e
      JOIN workflows w ON e.workflow_id = w.id
      ORDER BY e.timestamp DESC
      LIMIT 200
    `)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/documentacion', async (req, res) => {
  try {
    const rows = await db.all(`
      SELECT d.*, w.nombre AS workflow_nombre
      FROM documentacion d
      JOIN workflows w ON d.workflow_id = w.id
      ORDER BY d.timestamp DESC
    `)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/analytics', async (req, res) => {
  try {
    const ejecuciones = await db.all('SELECT * FROM ejecuciones ORDER BY timestamp DESC LIMIT 1000')

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

    const byWorkflow = await db.all(`
      SELECT w.nombre, COUNT(e.id) AS total,
             SUM(CASE WHEN e.estado = 'exitoso' THEN 1 ELSE 0 END) AS exitosas
      FROM ejecuciones e
      JOIN workflows w ON e.workflow_id = w.id
      GROUP BY w.id, w.nombre
      ORDER BY total DESC
      LIMIT 10
    `)

    res.json({ dias, byWorkflow })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
