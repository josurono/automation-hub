const OpenAI = require('openai')
require('dotenv').config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function generarReadme(workflow, ejecuciones) {
  const herramientas = JSON.parse(workflow.herramientas || '[]')
  const totalEjecuciones = ejecuciones.length
  const exitosas = ejecuciones.filter(e => e.estado === 'exito').length
  const tasaExito = totalEjecuciones > 0 ? Math.round((exitosas / totalEjecuciones) * 100) : 0

  const prompt = `
Eres un experto en documentación técnica de automatizaciones.
Genera un README.md profesional para el siguiente workflow.

DATOS DEL WORKFLOW:
- Nombre: ${workflow.nombre}
- Descripción: ${workflow.descripcion || 'Sin descripción'}
- Herramientas: ${herramientas.join(', ')}
- Total de ejecuciones registradas: ${totalEjecuciones}
- Tasa de éxito: ${tasaExito}%

INSTRUCCIONES:
1. Usa formato Markdown estándar compatible con GitHub
2. Incluye estas secciones: Descripción, Arquitectura, Herramientas, Configuración, Monitoreo
3. Genera un diagrama Mermaid simple del flujo usando las herramientas en orden
4. Sé conciso y técnico
5. No inventes información que no está en los datos

Responde ÚNICAMENTE con el contenido del README, sin explicaciones adicionales.
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 2000
  })

  return response.choices[0].message.content
}

async function analizarRiesgos(workflow, ejecuciones) {
  const herramientas = JSON.parse(workflow.herramientas || '[]')
  const errores = ejecuciones
    .filter(e => e.mensaje_error)
    .map(e => e.mensaje_error)
    .slice(0, 5)

  const prompt = `
Eres un arquitecto de automatizaciones experto en Make, n8n y sistemas de integración.
Analiza este workflow e identifica riesgos estructurales.

DATOS:
- Nombre: ${workflow.nombre}
- Descripción: ${workflow.descripcion || 'Sin descripción'}
- Herramientas: ${herramientas.join(', ')}
- Errores recientes: ${errores.length > 0 ? errores.join('; ') : 'Ninguno'}

Responde ÚNICAMENTE con un JSON con esta estructura exacta, sin texto adicional:
{
  "nivel_riesgo": "bajo|medio|alto|critico",
  "resumen": "descripción en 2 oraciones",
  "puntos_fallo": ["riesgo 1", "riesgo 2"],
  "recomendaciones": ["recomendación 1", "recomendación 2"]
}
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 1000
  })

  const texto = response.choices[0].message.content
  return JSON.parse(texto)
}

module.exports = { generarReadme, analizarRiesgos }