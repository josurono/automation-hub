const express = require('express')
const cors = require('cors')
const path = require('path')
const { initializeDatabase } = require('./src/database')

const app = express()
const PORT = process.env.PORT || 3000

// Inicializar base de datos
initializeDatabase()

// Middlewares
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// Rutas
app.use('/api/workflows', require('./src/routes/workflows'))
app.use('/api/webhooks', require('./src/routes/webhooks'))

// Ruta principal
app.get('/api', (req, res) => {
  res.json({
    aplicacion: 'Automation Operations Hub',
    version: '0.1.0',
    estado: 'online'
  })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})