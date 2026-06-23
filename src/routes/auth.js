const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.' },
})

router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' })
  }

  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    console.warn(`[AUTH] Login fallido — usuario: "${username}" IP: ${req.ip} — ${new Date().toISOString()}`)
    return res.status(401).json({ error: 'Credenciales incorrectas' })
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '24h' })
  res.json({ token, username })
})

module.exports = router
