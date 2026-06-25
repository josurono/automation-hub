import { useEffect, useState } from 'react'
import api from '../api/client'

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const FILTERS = ['todos', 'exito', 'fallo']

export default function MonitoringPage() {
  const [executions, setExecutions] = useState([])
  const [filter, setFilter] = useState('todos')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await api.get('/api/stats/ejecuciones')
      setExecutions(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const visible = (filter === 'todos' ? executions : executions.filter(e => e.estado === filter)).slice(0, 50)

  return (
    <div className="content">
      <div className="topbar" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="topbar-left">
          <h1>Monitoring</h1>
          <p>Historial global de ejecuciones</p>
        </div>
        <button className="topbar-btn" onClick={load} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--card)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          ↻ Actualizar
        </button>
      </div>

      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? 'var(--accent-dim)' : 'transparent',
              border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
              color: filter === f ? 'var(--accent)' : 'var(--text-2)',
              borderRadius: 6, padding: '5px 12px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
              textTransform: 'capitalize',
            }}>
              {f === 'todos' ? 'Todos' : f === 'exito' ? 'Exitosas' : 'Fallidas'}
            </button>
          ))}
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Todas las Ejecuciones</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{visible.length} resultados</span>
          </div>
          <div className="table-head" style={{ gridTemplateColumns: '1fr 2fr 2fr 1fr 2fr' }}>
            <div>Estado</div><div>Workflow</div><div>Fecha</div><div>Duración</div><div>Error</div>
          </div>
          {loading
            ? <div className="empty-state">Cargando...</div>
            : visible.length === 0
              ? <div className="empty-state">No hay ejecuciones registradas.</div>
              : visible.map((e, i) => (
                <div key={i} className="table-row" style={{ gridTemplateColumns: '1fr 2fr 2fr 1fr 2fr', cursor: 'default' }}>
                  <div><span className={`badge badge-${e.estado}`}>{e.estado}</span></div>
                  <div className="cell-primary">{e.workflow_nombre}</div>
                  <div className="cell-secondary">{fmtDateTime(e.timestamp)}</div>
                  <div className="cell-secondary">{e.duracion_ms ? e.duracion_ms + 'ms' : '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--danger)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.mensaje_error || ''}
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  )
}
