import { useState } from 'react'
import api from '../api/client'

const IconBolt = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const IconSearch = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

export default function AIPanel({ workflowId }) {
  const [result, setResult] = useState(null)
  const [title, setTitle] = useState('')
  const [className, setClassName] = useState('')
  const [loadingReadme, setLoadingReadme] = useState(false)
  const [loadingRisk, setLoadingRisk] = useState(false)

  async function generarReadme() {
    setLoadingReadme(true)
    try {
      const res = await api.post(`/api/workflows/${workflowId}/generar-readme`)
      setTitle('README.md generado')
      setClassName('')
      setResult(res.data.readme)
    } catch {
      alert('Error generando README')
    } finally {
      setLoadingReadme(false)
    }
  }

  async function analizarRiesgos() {
    setLoadingRisk(true)
    try {
      const res = await api.post(`/api/workflows/${workflowId}/analizar`)
      const a = res.data.analisis
      const texto = `NIVEL DE RIESGO: ${a.nivel_riesgo.toUpperCase()}\n\nRESUMEN:\n${a.resumen}\n\nPUNTOS DE FALLO:\n${a.puntos_fallo.map(p => '• ' + p).join('\n')}\n\nRECOMENDACIONES:\n${a.recomendaciones.map(r => '• ' + r).join('\n')}`
      setTitle('Análisis de Riesgos')
      setClassName('risk-' + a.nivel_riesgo)
      setResult(texto)
    } catch {
      alert('Error analizando workflow')
    } finally {
      setLoadingRisk(false)
    }
  }

  function copiar() {
    navigator.clipboard.writeText(result || '')
  }

  return (
    <>
      <div className="ai-btns">
        <button className="btn-accent-outline" onClick={generarReadme} disabled={loadingReadme}>
          <IconBolt /> {loadingReadme ? 'Generando...' : 'Generar README'}
        </button>
        <button className="btn-outline" onClick={analizarRiesgos} disabled={loadingRisk}>
          <IconSearch /> {loadingRisk ? 'Analizando...' : 'Analizar Riesgos'}
        </button>
      </div>
      {result && (
        <div className="ia-result">
          <div className="ia-result-header">
            <span className="panel-title">{title}</span>
            <button className="doc-btn" onClick={copiar}>Copiar</button>
          </div>
          <div className="ia-result-body">
            <pre className={className}>{result}</pre>
          </div>
        </div>
      )}
    </>
  )
}
