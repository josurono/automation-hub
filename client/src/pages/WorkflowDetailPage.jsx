import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import api from '../api/client'
import ExecutionLog from '../components/ExecutionLog'
import AIPanel from '../components/AIPanel'

function fmtDateShort(iso) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
}

function buildChartData(executions) {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days.map(date => ({
    name: fmtDateShort(date),
    exitosas: executions.filter(e => e.estado === 'exito' && e.timestamp.startsWith(date)).length,
    fallidas: executions.filter(e => e.estado === 'fallo' && e.timestamp.startsWith(date)).length,
  }))
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--text-2)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  )
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
  const chartData = buildChartData(executions)

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

        <div className="chart-wrap">
          <div className="chart-title">Ejecuciones — Últimos 7 días</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#71717a' }} />
              <Line type="monotone" dataKey="exitosas" name="Exitosas" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="fallidas" name="Fallidas" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
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
