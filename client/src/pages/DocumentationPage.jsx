import { useEffect, useState } from 'react'
import api from '../api/client'

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function DocItem({ doc }) {
  const [expanded, setExpanded] = useState(false)
  const isReadme = doc.tipo === 'readme' || !doc.tipo
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div
        onClick={() => setExpanded(x => !x)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', cursor: 'pointer', transition: 'background .1s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.025)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: isReadme ? 'var(--accent-dim)' : 'rgba(245,158,11,.1)', color: isReadme ? 'var(--accent)' : 'var(--warning)', border: `1px solid ${isReadme ? 'var(--accent)' : 'var(--warning)'}` }}>
            {isReadme ? 'README' : 'Análisis'}
          </span>
          <span className="cell-primary">{doc.workflow_nombre}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmtDateTime(doc.timestamp)}</span>
          <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 18px 16px' }}>
          <pre style={{ fontFamily: "'SF Mono', Consolas, monospace", fontSize: 12, color: 'var(--text-2)', whiteSpace: 'pre-wrap', lineHeight: 1.7, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: 14, margin: 0 }}>
            {doc.contenido}
          </pre>
          <button className="doc-btn" style={{ marginTop: 8 }} onClick={() => navigator.clipboard.writeText(doc.contenido)}>
            Copiar
          </button>
        </div>
      )}
    </div>
  )
}

export default function DocumentationPage() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await api.get('/api/stats/documentacion')
        setDocs(res.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const grouped = docs.reduce((acc, doc) => {
    const key = doc.workflow_nombre
    if (!acc[key]) acc[key] = []
    acc[key].push(doc)
    return acc
  }, {})

  return (
    <div className="content">
      <div className="topbar" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="topbar-left">
          <h1>Documentation</h1>
          <p>READMEs y análisis de riesgo generados</p>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {loading
          ? <div className="empty-state">Cargando...</div>
          : docs.length === 0
            ? (
              <div className="panel">
                <div className="empty-state">No hay documentación generada aún.<br />Abre un workflow y usa "Generar README" o "Analizar Riesgos".</div>
              </div>
            )
            : Object.entries(grouped).map(([wfName, items]) => (
              <div key={wfName} className="panel" style={{ marginBottom: 16 }}>
                <div className="panel-header">
                  <span className="panel-title">{wfName}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{items.length} documento{items.length !== 1 ? 's' : ''}</span>
                </div>
                {items.map((doc, i) => <DocItem key={i} doc={doc} />)}
              </div>
            ))
        }
      </div>
    </div>
  )
}
