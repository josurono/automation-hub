require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
const { initializeDatabase } = require('./src/database')
const { requireAuth } = require('./src/middleware/auth')

const app = express()
const PORT = process.env.PORT || 3000

initializeDatabase()

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// Public
app.use('/api/auth', require('./src/routes/auth'))
app.use('/api/webhooks', require('./src/routes/webhooks'))

// Protected
app.use('/api/workflows', requireAuth, require('./src/routes/workflows'))
app.use('/api/stats', requireAuth, require('./src/routes/stats'))

app.get('/api', requireAuth, (req, res) => {
  res.json({ aplicacion: 'FlowVault', version: '0.2.0', estado: 'online' })
})

app.listen(PORT, () => {
  console.log(`FlowVault running on http://localhost:${PORT}`)
})
