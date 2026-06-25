const jwt = require('jsonwebtoken')

function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' })
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET)
    // Exponemos los campos que la Fase 3 usará para scopear queries por
    // organización. organization_id es la clave del aislamiento multi-tenant.
    req.user = {
      user_id: payload.user_id,
      organization_id: payload.organization_id,
      email: payload.email,
      rol: payload.rol,
    }
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

module.exports = { requireAuth }
