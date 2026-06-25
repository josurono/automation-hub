const express = require('express')
const router = express.Router()
const { randomUUID, randomBytes } = require('crypto')
const store = require('../data/store')

router.get('/', async (req, res) => {
  try {
    const workflows = await store.workflows.list(req.user.organization_id)
    res.json(workflows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const workflow = await store.workflows.get(req.user.organization_id, req.params.id)
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

    // organization_id se toma SIEMPRE del JWT, nunca del body.
    // El webhook_token se genera en el backend; nunca viene del request.
    await store.workflows.create(req.user.organization_id, {
      id,
      nombre,
      descripcion: descripcion || '',
      herramientas: JSON.stringify(herramientas || []),
      fecha: ahora,
      webhookToken: randomBytes(32).toString('hex'),
    })

    const workflow = await store.workflows.get(req.user.organization_id, id)
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
    const orgId = req.user.organization_id

    // Si no existe en MI organización → 404 (no revelamos si existe en otra).
    const existing = await store.workflows.get(orgId, req.params.id)
    if (!existing) return res.status(404).json({ error: 'Workflow no encontrado' })

    const ahora = new Date().toISOString()
    await store.workflows.update(orgId, req.params.id, {
      nombre,
      descripcion,
      herramientas: herramientas ? JSON.stringify(herramientas) : null,
      estado,
      fecha: ahora,
    })

    const workflow = await store.workflows.get(orgId, req.params.id)
    res.json(workflow)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const orgId = req.user.organization_id

    const existing = await store.workflows.get(orgId, req.params.id)
    if (!existing) return res.status(404).json({ error: 'Workflow no encontrado' })

    await store.workflows.archive(orgId, req.params.id, new Date().toISOString())
    res.json({ mensaje: 'Workflow archivado correctamente' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/:id/webhook-token', async (req, res) => {
  try {
    const row = await store.workflows.webhookToken(req.user.organization_id, req.params.id)
    if (!row) return res.status(404).json({ error: 'Workflow no encontrado' })
    res.json({ webhook_token: row.webhook_token })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/:id/ejecuciones', async (req, res) => {
  try {
    const orgId = req.user.organization_id

    // El workflow debe pertenecer a mi org; si no, 404 (no exponemos sus ejecuciones).
    const workflow = await store.workflows.get(orgId, req.params.id)
    if (!workflow) return res.status(404).json({ error: 'Workflow no encontrado' })

    const ejecuciones = await store.ejecuciones.listByWorkflow(orgId, req.params.id)
    res.json(ejecuciones)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.post('/:id/generar-readme', async (req, res) => {
  try {
    const orgId = req.user.organization_id

    const workflow = await store.workflows.get(orgId, req.params.id)
    if (!workflow) return res.status(404).json({ error: 'Workflow no encontrado' })

    const ejecuciones = await store.ejecuciones.allByWorkflow(orgId, req.params.id)

    const { generarReadme } = require('../ai')
    const readme = await generarReadme(workflow, ejecuciones)

    // documentacion estampada con la org del usuario (del JWT, no del body).
    await store.documentacion.insert(orgId, {
      id: randomUUID(),
      workflow_id: req.params.id,
      tipo: 'readme',
      contenido: readme,
      timestamp: new Date().toISOString(),
    })

    res.json({ readme })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error generando README' })
  }
})

router.post('/:id/analizar', async (req, res) => {
  try {
    const orgId = req.user.organization_id

    const workflow = await store.workflows.get(orgId, req.params.id)
    if (!workflow) return res.status(404).json({ error: 'Workflow no encontrado' })

    const ejecuciones = await store.ejecuciones.allByWorkflow(orgId, req.params.id)

    const { analizarRiesgos } = require('../ai')
    const analisis = await analizarRiesgos(workflow, ejecuciones)

    res.json({ analisis })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error analizando workflow' })
  }
})

module.exports = router
