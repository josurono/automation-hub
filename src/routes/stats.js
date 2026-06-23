const express = require('express')
const router = express.Router()
const { db } = require('../database')

router.get('/', (req, res) => {
  const workflows = db.prepare('SELECT * FROM workflows').all()
  const activos = workflows.filter(w => w.estado === 'activo').length
  const ejecuciones = db.prepare('SELECT * FROM ejecuciones').all()
  const exitosas = ejecuciones.filter(e => e.estado === 'exito').length
  const tasa = ejecuciones.length > 0 ? Math.round((exitosas / ejecuciones.length) * 100) : 0

  res.json({
    total_workflows: workflows.length,
    activos,
    total_ejecuciones: ejecuciones.length,
    tasa_exito: tasa
  })
})

router.get('/ejecuciones', (req, res) => {
  const rows = db.prepare(`
    SELECT e.*, w.nombre AS workflow_nombre
    FROM ejecuciones e
    JOIN workflows w ON e.workflow_id = w.id
    ORDER BY e.timestamp DESC
    LIMIT 200
  `).all()
  res.json(rows)
})

router.get('/documentacion', (req, res) => {
  const rows = db.prepare(`
    SELECT d.*, w.nombre AS workflow_nombre
    FROM documentacion d
    JOIN workflows w ON d.workflow_id = w.id
    ORDER BY d.timestamp DESC
  `).all()
  res.json(rows)
})

router.get('/analytics', (req, res) => {
  const ejecuciones = db.prepare('SELECT * FROM ejecuciones ORDER BY timestamp DESC LIMIT 1000').all()

  const dias = []
  for (let i = 29; i >= 0; i--) {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() - i)
    const dia = fecha.toISOString().split('T')[0]
    dias.push({
      fecha: dia,
      exito: ejecuciones.filter(e => e.estado === 'exito' && e.timestamp.startsWith(dia)).length,
      fallo: ejecuciones.filter(e => e.estado === 'fallo' && e.timestamp.startsWith(dia)).length
    })
  }

  const byWorkflow = db.prepare(`
    SELECT w.nombre, COUNT(e.id) as total,
           SUM(CASE WHEN e.estado = 'exito' THEN 1 ELSE 0 END) as exitosas
    FROM ejecuciones e
    JOIN workflows w ON e.workflow_id = w.id
    GROUP BY w.id
    ORDER BY total DESC
    LIMIT 10
  `).all()

  res.json({ dias, byWorkflow })
})

module.exports = router
