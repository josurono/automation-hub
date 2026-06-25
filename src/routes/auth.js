const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const rateLimit = require('express-rate-limit')
const { db } = require('../database')

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.' },
})

// Hash dummy con formato bcrypt válido. Cuando el email no existe, igual
// corremos un bcrypt.compare contra esto para que el tiempo de respuesta sea
// similar al de un email que sí existe — evita enumerar usuarios por timing.
const DUMMY_HASH = bcrypt.hashSync('flowvault-dummy-password', 10)

const CREDENCIALES_INVALIDAS = 'Credenciales inválidas'

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' })
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email])

    // Mensaje genérico en ambos casos (no existe / password incorrecto): no
    // revelamos si el email está registrado. Si no existe el usuario, igual
    // corremos un compare contra el hash dummy para igualar el tiempo.
    let passwordOk = false
    if (user) {
      passwordOk = await bcrypt.compare(password, user.password_hash)
    } else {
      await bcrypt.compare(password, DUMMY_HASH)
    }

    if (!user || !passwordOk) {
      console.warn(`[AUTH] Login fallido — email: "${email}" IP: ${req.ip} — ${new Date().toISOString()}`)
      return res.status(401).json({ error: CREDENCIALES_INVALIDAS })
    }

    const token = jwt.sign(
      {
        user_id: user.id,
        organization_id: user.organization_id,
        email: user.email,
        rol: user.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({ token, email: user.email })
  } catch (err) {
    console.error('[AUTH] Error en login:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
