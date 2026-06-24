import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import ExecutionLog from '../components/ExecutionLog'
import AIPanel from '../components/AIPanel'

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function WorkflowDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workflow, setWorkflow] = useState(null)
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [wRes, eRes] = await Promise.all([
          api.get(`/api/workflows/${id}`),
          api.get(`/api/workflows/${id}/ejecuciones`),
        ])
        setWorkflow(wRes.data)
        setExecutions(eRes.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <div className="content" style={{ padding: 24 }}><div className="empty-state">Cargando...</div></div>
  if (!workflow) return <div className="content" style={{ padding: 24 }}><div className="empty-state">Workflow no encontrado.</div></div>

  const herramientas = (() => { try { return JSON.parse(workflow.herramientas || '[]') } catch { return [] } })()
  const total = executions.length
  const exito = executions.filter(e => e.estado === 'exito').length
  const fallo = executions.filter(e => e.estado === 'fallo').length
  const tasa = total > 0 ? Math.round((exito / total) * 100) : 0

  return (
    <div className="content">
      <div className="topbar" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="topbar-left">
          <h1>{workflow.nombre}</h1>
          <p>Detalle del workflow</p>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate('/workflows')}>Workflows</button>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{workflow.nombre}</span>
        </div>

        <div className="detail-header">
          <div>
            <div className="detail-title">{workflow.nombre}</div>
            <div className="detail-desc">{workflow.descripcion || 'Sin descripción'}</div>
            <div className="detail-chips">
              {herramientas.map(h => <span key={h} className="chip">{h}</span>)}
            </div>
          </div>
          <span className={`badge badge-${workflow.estado}`}>{workflow.estado}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          <div className="stat-card"><div className="stat-label">Ejecuciones</div><div className="stat-value">{total}</div></div>
          <div className="stat-card"><div className="stat-label">Exitosas</div><div className="stat-value" style={{ color: 'var(--success)' }}>{exito}</div></div>
          <div className="stat-card"><div className="stat-label">Fallidas</div><div className="stat-value" style={{ color: 'var(--danger)' }}>{fallo}</div></div>
          <div className="stat-card"><div className="stat-label">Tasa de Éxito</div><div className="stat-value" style={{ color: 'var(--warning)' }}>{tasa}%</div></div>
        </div>

        <AIPanel workflowId={id} />

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Historial de Ejecuciones</span>
          </div>
          <ExecutionLog executions={executions} />
        </div>
      </div>
    </div>
  )
}
