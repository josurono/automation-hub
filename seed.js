require('dotenv').config()

const BASE = 'https://automation-hub-production-7a87.up.railway.app'

// ── helpers ──────────────────────────────────────────────────────────────────

async function api(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(data)}`)
  return data
}

function daysAgo(n, h = 12, m = 0) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ── login ────────────────────────────────────────────────────────────────────

async function login() {
  console.log('🔑 Autenticando...')
  const { token } = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD
    })
  })
  console.log('   ✓ Token obtenido')
  return token
}

// ── crear workflow ────────────────────────────────────────────────────────────

async function crearWorkflow(token, payload) {
  return api('/api/workflows', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: JSON.stringify(payload)
  })
}

// ── insertar ejecución vía webhook (ruta pública) ────────────────────────────

async function insertarEjecucion(workflowId, estado, duracion_ms, mensaje_error, timestamp) {
  const payload = {
    workflow_id: workflowId,
    estado,
    duracion_ms,
    timestamp,
    ...(mensaje_error ? { mensaje_error } : {})
  }
  // Sobreescribimos el timestamp enviándolo en el body y lo registramos directamente
  // El webhook lo acepta sin auth
  return fetch(BASE + '/api/webhooks/execution', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(r => r.json())
}

// ── seed data ─────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 FlowVault — Seed de datos demo')
  console.log('   Base:', BASE)
  console.log()

  const token = await login()

  // ─── 1. Procesamiento de Facturas — Tecnopolis ───────────────────────────
  console.log('📄 Creando "Procesamiento de Facturas — Tecnopolis"...')
  const factura = await crearWorkflow(token, {
    nombre: 'Procesamiento de Facturas — Tecnopolis',
    descripcion: 'Recibe facturas por Telegram, extrae datos con WiseOCR + OpenAI y los registra en Google Sheets via Make.',
    herramientas: ['Telegram', 'WiseOCR', 'OpenAI', 'JSON Parser', 'Router', 'Google Sheets', 'Make']
  })
  console.log('   ✓ ID:', factura.id)

  const facturasExitosas = [
    [29, 9,  0,  4210],
    [27, 14, 30, 3890],
    [25, 10, 15, 5120],
    [24, 16, 45, 4780],
    [22, 11, 0,  3650],
    [21, 15, 20, 6340],
    [19, 9,  30, 4890],
    [17, 13, 0,  5230],
    [15, 10, 45, 3980],
    [13, 14, 15, 6100],
    [11, 11, 0,  4450],
    [9,  16, 30, 5670],
    [7,  9,  0,  3820],
    [4,  14, 45, 4990],
    [1,  11, 15, 5340],
  ]
  const facturasFallidas = [
    [23, 3,  20,  'Error al procesar imagen: timeout WiseOCR API (30s)'],
    [8,  22, 45,  'OpenAI rate limit exceeded — reintentar en 60s'],
  ]

  for (const [d, h, m, dur] of facturasExitosas) {
    await insertarEjecucion(factura.id, 'exito', dur, null, daysAgo(d, h, m))
  }
  for (const [d, h, m, err] of facturasFallidas) {
    await insertarEjecucion(factura.id, 'fallo', rand(800, 2000), err, daysAgo(d, h, m))
  }
  console.log(`   ✓ 15 exitosas + 2 fallidas insertadas`)

  // ─── 2. SKU Normalizer ──────────────────────────────────────────────────
  console.log('\n🔧 Creando "SKU Normalizer"...')
  const sku = await crearWorkflow(token, {
    nombre: 'SKU Normalizer',
    descripcion: 'Normaliza catálogos de productos con Pandas y OpenAI, exporta SKUs estandarizados a Google Sheets.',
    herramientas: ['Python', 'Pandas', 'OpenAI', 'Google Sheets']
  })
  console.log('   ✓ ID:', sku.id)

  const skuExitosas = [
    [28, 8,  0,  2340],
    [24, 8,  30, 3120],
    [20, 9,  0,  2780],
    [17, 8,  15, 3450],
    [14, 8,  0,  2910],
    [10, 9,  30, 3670],
    [6,  8,  0,  2540],
    [2,  8,  30, 3230],
  ]
  for (const [d, h, m, dur] of skuExitosas) {
    await insertarEjecucion(sku.id, 'exito', dur, null, daysAgo(d, h, m))
  }
  console.log(`   ✓ 8 exitosas insertadas`)

  // ─── 3. Lead Capture CLC ────────────────────────────────────────────────
  console.log('\n🎯 Creando "Lead Capture CLC"...')
  const lead = await crearWorkflow(token, {
    nombre: 'Lead Capture CLC',
    descripcion: 'Captura leads desde formularios web via webhook, los registra en el CRM y envía email de bienvenida.',
    herramientas: ['Webhook', 'n8n', 'CRM', 'Email']
  })
  console.log('   ✓ ID:', lead.id)

  const leadExitosas = [
    [30, 10, 0,  620],
    [29, 14, 30, 480],
    [28, 11, 15, 710],
    [27, 16, 0,  540],
    [26, 9,  45, 680],
    [25, 13, 30, 590],
    [24, 10, 0,  730],
    [22, 15, 15, 510],
    [21, 11, 30, 660],
    [19, 14, 0,  490],
    [17, 10, 45, 720],
    [15, 16, 0,  550],
    [13, 9,  15, 640],
    [10, 13, 30, 480],
    [8,  10, 0,  710],
    [6,  15, 45, 530],
    [5,  11, 15, 690],
    [4,  14, 0,  470],
    [2,  10, 30, 680],
    [1,  9,  0,  520],
  ]
  const leadFallidas = [
    [16, 3, 12, 'CRM webhook timeout — connection refused after 10s'],
  ]

  for (const [d, h, m, dur] of leadExitosas) {
    await insertarEjecucion(lead.id, 'exito', dur, null, daysAgo(d, h, m))
  }
  for (const [d, h, m, err] of leadFallidas) {
    await insertarEjecucion(lead.id, 'fallo', rand(9000, 12000), err, daysAgo(d, h, m))
  }
  console.log(`   ✓ 20 exitosas + 1 fallida insertadas`)

  // ─── 4. Invoice Monitor ─────────────────────────────────────────────────
  console.log('\n📊 Creando "Invoice Monitor"...')
  const invoice = await crearWorkflow(token, {
    nombre: 'Invoice Monitor',
    descripcion: 'Monitorea el estado de facturas pendientes en Google Sheets y envía alertas por Telegram.',
    herramientas: ['Make', 'Telegram', 'Google Sheets']
  })
  console.log('   ✓ ID:', invoice.id)

  const invoiceExitosas = [
    [20, 8, 0,  1240],
    [15, 8, 0,  1380],
    [10, 8, 0,  1190],
    [5,  8, 0,  1450],
    [0,  8, 0,  1310],
  ]
  for (const [d, h, m, dur] of invoiceExitosas) {
    await insertarEjecucion(invoice.id, 'exito', dur, null, daysAgo(d, h, m))
  }
  console.log(`   ✓ 5 exitosas insertadas`)

  // ─── resumen ──────────────────────────────────────────────────────────────
  console.log('\n✅ Seed completado')
  console.log('   Workflows creados : 4')
  console.log('   Ejecuciones totales: 51 (48 exitosas + 3 fallidas)')
  console.log('\n🔗', BASE)
}

seed().catch(err => {
  console.error('\n❌ Error:', err.message)
  process.exit(1)
})
