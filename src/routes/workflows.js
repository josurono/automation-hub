const express = require('express')
const router = express.Router()
const { db } = require('../database')
const { randomUUID } = require('crypto')

// GET /api/workflows - Listar todos
router.get('/', (req, res) => {
  const workflows = db.prepare('SELECT * FROM workflows ORDER BY fecha_modificacion DESC').all()
  res.json(workflows)
})

// GET /api/workflows/:id - Obtener uno
router.get('/:id', (req, res) => {
  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id)
  if (!workflow) return res.status(404).json({ error: 'Workflow no encontrado' })
  res.json(workflow)
})

// POST /api/workflows - Crear nuevo
router.post('/', (req, res) => {
  const { nombre, descripcion, herramientas } = req.body
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' })

  const ahora = new Date().toISOString()
  const id = randomUUID()

  db.prepare(`
    INSERT INTO workflows (id, nombre, descripcion, estado, herramientas, fecha_creacion, fecha_modificacion)
    VALUES (?, ?, ?, 'activo', ?, ?, ?)
  `).run(id, nombre, descripcion || '', JSON.stringify(herramientas || []), ahora, ahora)

  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(id)
  res.status(201).json(workflow)
})

// PATCH /api/workflows/:id - Editar
router.patch('/:id', (req, res) => {
  const { nombre, descripcion, herramientas, estado } = req.body
  const ahora = new Date().toISOString()

  db.prepare(`
    UPDATE workflows 
    SET nombre = COALESCE(?, nombre),
        descripcion = COALESCE(?, descripcion),
        herramientas = COALESCE(?, herramientas),
        estado = COALESCE(?, estado),
        fecha_modificacion = ?
    WHERE id = ?
  `).run(nombre, descripcion, herramientas ? JSON.stringify(herramientas) : null, estado, ahora, req.params.id)

  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id)
  res.json(workflow)
})

// DELETE /api/workflows/:id - Archivar
router.delete('/:id', (req, res) => {
  db.prepare(`
    UPDATE workflows SET estado = 'archivado', fecha_modificacion = ? WHERE id = ?
  `).run(new Date().toISOString(), req.params.id)

  res.json({ mensaje: 'Workflow archivado correctamente' })
})
// GET /api/workflows/:id/ejecuciones - Ver historial
router.get('/:id/ejecuciones', (req, res) => {
  const ejecuciones = db.prepare(`
    SELECT * FROM ejecuciones 
    WHERE workflow_id = ? 
    ORDER BY timestamp DESC 
    LIMIT 50
  `).all(req.params.id)
  
  res.json(ejecuciones)
})
// POST /api/workflows/:id/generar-readme
router.post('/:id/generar-readme', async (req, res) => {
  try {
    const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id)
    if (!workflow) return res.status(404).json({ error: 'Workflow no encontrado' })

    const ejecuciones = db.prepare('SELECT * FROM ejecuciones WHERE workflow_id = ?').all(req.params.id)

    const { generarReadme } = require('../ai')
    const readme = await generarReadme(workflow, ejecuciones)

    db.prepare(`
      INSERT INTO documentacion (id, workflow_id, tipo, contenido, timestamp)
      VALUES (?, ?, 'readme', ?, ?)
    `).run(require('crypto').randomUUID(), req.params.id, readme, new Date().toISOString())

    res.json({ readme })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error generando README' })
  }
})

// POST /api/workflows/:id/analizar
router.post('/:id/analizar', async (req, res) => {
  try {
    const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id)
    if (!workflow) return res.status(404).json({ error: 'Workflow no encontrado' })

    const ejecuciones = db.prepare('SELECT * FROM ejecuciones WHERE workflow_id = ?').all(req.params.id)

    const { analizarRiesgos } = require('../ai')
    const analisis = await analizarRiesgos(workflow, ejecuciones)

    res.json({ analisis })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error analizando workflow' })
  }
})
module.exports = router