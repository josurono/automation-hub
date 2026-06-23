const express = require('express')
const router = express.Router()
const { db } = require('../database')
const { randomUUID } = require('crypto')

router.get('/', async (req, res) => {
  try {
    const workflows = await db.all('SELECT * FROM workflows ORDER BY fecha_modificacion DESC')
    res.json(workflows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const workflow = await db.get('SELECT * FROM workflows WHERE id = ?', [req.params.id])
    if (!workflow) return res.status(404).json({ error: 'Workflow no encontrado' })
    res.json(workflow)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.post('/', async (req, res) => {
  const { nombre, descripcion, herramientas } = req.body
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' })
  if (typeof nombre !== 'string' || nombre.trim().length === 0) return res.status(400).json({ error: 'El nombre no puede estar vacío' })
  if (nombre.length > 100) return res.status(400).json({ error: 'El nombre no puede superar los 100 caracteres' })
  if (descripcion && descripcion.length > 500) return res.status(400).json({ error: 'La descripción no puede superar los 500 caracteres' })
  if (herramientas && (!Array.isArray(herramientas) || herramientas.length > 50)) return res.status(400).json({ error: 'Herramientas debe ser un array de máximo 50 elementos' })

  try {
    const ahora = new Date().toISOString()
    const id = randomUUID()

    await db.run(
      `INSERT INTO workflows (id, nombre, descripcion, estado, herramientas, fecha_creacion, fecha_modificacion)
       VALUES (?, ?, ?, 'activo', ?, ?, ?)`,
      [id, nombre, descripcion || '', JSON.stringify(herramientas || []), ahora, ahora]
    )

    const workflow = await db.get('SELECT * FROM workflows WHERE id = ?', [id])
    res.status(201).json(workflow)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.patch('/:id', async (req, res) => {
  const { nombre, descripcion, herramientas, estado } = req.body
  if (nombre !== undefined && (typeof nombre !== 'string' || nombre.trim().length === 0)) return res.status(400).json({ error: 'El nombre no puede estar vacío' })
  if (nombre && nombre.length > 100) return res.status(400).json({ error: 'El nombre no puede superar los 100 caracteres' })
  if (descripcion && descripcion.length > 500) return res.status(400).json({ error: 'La descripción no puede superar los 500 caracteres' })
  if (herramientas && (!Array.isArray(herramientas) || herramientas.length > 50)) return res.status(400).json({ error: 'Herramientas debe ser un array de máximo 50 elementos' })
  const ESTADOS_VALIDOS = ['activo', 'pausado', 'archivado']
  if (estado && !ESTADOS_VALIDOS.includes(estado)) return res.status(400).json({ error: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}` })

  try {
    const ahora = new Date().toISOString()

    await db.run(
      `UPDATE workflows
       SET nombre = COALESCE(?, nombre),
           descripcion = COALESCE(?, descripcion),
           herramientas = COALESCE(?, herramientas),
           estado = COALESCE(?, estado),
           fecha_modificacion = ?
       WHERE id = ?`,
      [nombre, descripcion, herramientas ? JSON.stringify(herramientas) : null, estado, ahora, req.params.id]
    )

    const workflow = await db.get('SELECT * FROM workflows WHERE id = ?', [req.params.id])
    res.json(workflow)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await db.run(
      `UPDATE workflows SET estado = 'archivado', fecha_modificacion = ? WHERE id = ?`,
      [new Date().toISOString(), req.params.id]
    )
    res.json({ mensaje: 'Workflow archivado correctamente' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/:id/ejecuciones', async (req, res) => {
  try {
    const ejecuciones = await db.all(
      `SELECT * FROM ejecuciones WHERE workflow_id = ? ORDER BY timestamp DESC LIMIT 50`,
      [req.params.id]
    )
    res.json(ejecuciones)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.post('/:id/generar-readme', async (req, res) => {
  try {
    const workflow = await db.get('SELECT * FROM workflows WHERE id = ?', [req.params.id])
    if (!workflow) return res.status(404).json({ error: 'Workflow no encontrado' })

    const ejecuciones = await db.all('SELECT * FROM ejecuciones WHERE workflow_id = ?', [req.params.id])

    const { generarReadme } = require('../ai')
    const readme = await generarReadme(workflow, ejecuciones)

    await db.run(
      `INSERT INTO documentacion (id, workflow_id, tipo, contenido, timestamp) VALUES (?, ?, 'readme', ?, ?)`,
      [require('crypto').randomUUID(), req.params.id, readme, new Date().toISOString()]
    )

    res.json({ readme })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error generando README' })
  }
})

router.post('/:id/analizar', async (req, res) => {
  try {
    const workflow = await db.get('SELECT * FROM workflows WHERE id = ?', [req.params.id])
    if (!workflow) return res.status(404).json({ error: 'Workflow no encontrado' })

    const ejecuciones = await db.all('SELECT * FROM ejecuciones WHERE workflow_id = ?', [req.params.id])

    const { analizarRiesgos } = require('../ai')
    const analisis = await analizarRiesgos(workflow, ejecuciones)

    res.json({ analisis })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error analizando workflow' })
  }
})

module.exports = router
