require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
const { initializeDatabase } = require('./src/database')
const { requireAuth } = require('./src/middleware/auth')

const app = express()
const PORT = process.env.PORT || 3000

app.set('trust proxy', 1)
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client', 'dist')))
}

// Public
app.use('/api/auth', require('./src/routes/auth'))
app.use('/api/webhooks', require('./src/routes/webhooks'))

// Protected
app.use('/api/workflows', requireAuth, require('./src/routes/workflows'))
app.use('/api/stats', requireAuth, require('./src/routes/stats'))

app.get('/api', requireAuth, (req, res) => {
  res.json({ aplicacion: 'FlowVault', version: '0.2.0', estado: 'online' })
})

if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'))
  })
}

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`FlowVault running on http://localhost:${PORT}`)
  })
}).catch(err => {
  console.error('Error inicializando la base de datos:', err)
  process.exit(1)
})
