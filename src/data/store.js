const { db } = require('../database')

// Capa de acceso a datos con scope multi-tenant obligatorio.
//
// TODAS las funciones que tocan workflows / ejecuciones / documentacion exigen
// organization_id como primer argumento. requireOrg() lanza si falta, así que
// es difícil escribir una query sin scope por olvido. La única excepción
// intencional es workflows.organizationIdOf() — documentada abajo, para el
// webhook público que no tiene contexto de organización.
function requireOrg(orgId) {
  if (!orgId) {
    throw new Error('organization_id es obligatorio para acceder a los datos (scope multi-tenant)')
  }
  return orgId
}

const workflows = {
  // El listado NO expone webhook_token (es un secreto): se enumeran las
  // columnas explícitamente, omitiéndolo. El token solo se sirve en get() (detalle).
  list(orgId) {
    requireOrg(orgId)
    return db.all(
      `SELECT id, nombre, descripcion, estado, herramientas, fecha_creacion, fecha_modificacion, organization_id
       FROM workflows WHERE organization_id = ? ORDER BY fecha_modificacion DESC`,
      [orgId]
    )
  },

  // Detalle: incluye webhook_token (SELECT *), que la UI usa en WorkflowDetailPage.
  get(orgId, id) {
    requireOrg(orgId)
    return db.get(
      'SELECT * FROM workflows WHERE id = ? AND organization_id = ?',
      [id, orgId]
    )
  },

  create(orgId, { id, nombre, descripcion, herramientas, fecha, webhookToken }) {
    requireOrg(orgId)
    return db.run(
      `INSERT INTO workflows (id, nombre, descripcion, estado, herramientas, fecha_creacion, fecha_modificacion, organization_id, webhook_token)
       VALUES (?, ?, ?, 'activo', ?, ?, ?, ?, ?)`,
      [id, nombre, descripcion, herramientas, fecha, fecha, orgId, webhookToken]
    )
  },

  update(orgId, id, { nombre, descripcion, herramientas, estado, fecha }) {
    requireOrg(orgId)
    return db.run(
      `UPDATE workflows
       SET nombre = COALESCE(?, nombre),
           descripcion = COALESCE(?, descripcion),
           herramientas = COALESCE(?, herramientas),
           estado = COALESCE(?, estado),
           fecha_modificacion = ?
       WHERE id = ? AND organization_id = ?`,
      [nombre, descripcion, herramientas, estado, fecha, id, orgId]
    )
  },

  archive(orgId, id, fecha) {
    requireOrg(orgId)
    return db.run(
      `UPDATE workflows SET estado = 'archivado', fecha_modificacion = ? WHERE id = ? AND organization_id = ?`,
      [fecha, id, orgId]
    )
  },

  // ÚNICA lectura intencionalmente SIN scope de org. El webhook público
  // (/api/webhooks/execution) no tiene JWT ni organización en el request, así
  // que debe derivar la organización del propio workflow y validar su token.
  // Devuelve { organization_id, webhook_token } o null si el workflow no existe.
  findForWebhook(workflowId) {
    return db.get('SELECT organization_id, webhook_token FROM workflows WHERE id = ?', [workflowId])
  },
}

const ejecuciones = {
  // Listado para la vista de detalle (mismo LIMIT 50 que antes).
  listByWorkflow(orgId, workflowId) {
    requireOrg(orgId)
    return db.all(
      `SELECT * FROM ejecuciones
       WHERE workflow_id = ? AND organization_id = ?
       ORDER BY timestamp DESC LIMIT 50`,
      [workflowId, orgId]
    )
  },

  // Sin LIMIT — para los endpoints de IA que computan métricas sobre todo el
  // historial (preserva el comportamiento previo de generar-readme/analizar).
  allByWorkflow(orgId, workflowId) {
    requireOrg(orgId)
    return db.all(
      'SELECT * FROM ejecuciones WHERE workflow_id = ? AND organization_id = ?',
      [workflowId, orgId]
    )
  },

  insert(orgId, { id, workflow_id, timestamp, estado, duracion_ms, mensaje_error, payload_raw }) {
    requireOrg(orgId)
    return db.run(
      `INSERT INTO ejecuciones (id, workflow_id, timestamp, estado, duracion_ms, mensaje_error, payload_raw, organization_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, workflow_id, timestamp, estado, duracion_ms, mensaje_error, payload_raw, orgId]
    )
  },
}

const documentacion = {
  insert(orgId, { id, workflow_id, tipo, contenido, timestamp }) {
    requireOrg(orgId)
    return db.run(
      `INSERT INTO documentacion (id, workflow_id, tipo, contenido, timestamp, organization_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, workflow_id, tipo, contenido, timestamp, orgId]
    )
  },
}

// Consultas de stats/analytics, todas scopeadas por organización.
const stats = {
  workflows(orgId) {
    requireOrg(orgId)
    return db.all('SELECT * FROM workflows WHERE organization_id = ?', [orgId])
  },

  ejecuciones(orgId) {
    requireOrg(orgId)
    return db.all('SELECT * FROM ejecuciones WHERE organization_id = ?', [orgId])
  },

  ejecucionesConWorkflow(orgId) {
    requireOrg(orgId)
    return db.all(
      `SELECT e.*, w.nombre AS workflow_nombre
       FROM ejecuciones e
       JOIN workflows w ON e.workflow_id = w.id
       WHERE e.organization_id = ?
       ORDER BY e.timestamp DESC
       LIMIT 200`,
      [orgId]
    )
  },

  documentacionConWorkflow(orgId) {
    requireOrg(orgId)
    return db.all(
      `SELECT d.*, w.nombre AS workflow_nombre
       FROM documentacion d
       JOIN workflows w ON d.workflow_id = w.id
       WHERE d.organization_id = ?
       ORDER BY d.timestamp DESC`,
      [orgId]
    )
  },

  ejecucionesParaAnalytics(orgId) {
    requireOrg(orgId)
    return db.all(
      'SELECT * FROM ejecuciones WHERE organization_id = ? ORDER BY timestamp DESC LIMIT 1000',
      [orgId]
    )
  },

  byWorkflow(orgId) {
    requireOrg(orgId)
    return db.all(
      `SELECT w.nombre, COUNT(e.id) AS total,
              SUM(CASE WHEN e.estado = 'exitoso' THEN 1 ELSE 0 END) AS exitosas
       FROM ejecuciones e
       JOIN workflows w ON e.workflow_id = w.id
       WHERE e.organization_id = ?
       GROUP BY w.id, w.nombre
       ORDER BY total DESC
       LIMIT 10`,
      [orgId]
    )
  },
}

module.exports = { workflows, ejecuciones, documentacion, stats }
