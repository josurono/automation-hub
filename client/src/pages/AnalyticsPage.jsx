import { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import api from '../api/client'

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

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [aRes, sRes] = await Promise.all([
          api.get('/api/stats/analytics'),
          api.get('/api/stats'),
        ])
        setAnalytics(aRes.data)
        setStats(sRes.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="content">
      <div className="topbar" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="topbar-left"><h1>Analytics</h1><p>Métricas y tendencias</p></div>
      </div>
      <div style={{ padding: 24 }}><div className="empty-state">Cargando...</div></div>
    </div>
  )

  const byWorkflow = analytics?.byWorkflow || []
  const dias = (analytics?.dias || []).map(d => {
    const f = new Date(d.fecha + 'T12:00:00')
    return {
      name: f.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      exitosas: d.exito,
      fallidas: d.fallo,
    }
  })

  const barData = byWorkflow.map(w => ({
    name: w.nombre.length > 14 ? w.nombre.slice(0, 14) + '…' : w.nombre,
    exitosas: w.exitosas,
    fallidas: w.total - w.exitosas,
  }))

  const masActivo = byWorkflow.reduce((a, b) => (b.total > (a?.total || 0) ? b : a), null)
  const masFallas = byWorkflow.reduce((a, b) => ((b.total - b.exitosas) > ((a?.total || 0) - (a?.exitosas || 0)) ? b : a), null)

  return (
    <div className="content">
      <div className="topbar" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="topbar-left">
          <h1>Analytics</h1>
          <p>Métricas y tendencias</p>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-label">Total Ejecuciones</div>
            <div className="stat-value" style={{ color: '#60a5fa' }}>{stats?.total_ejecuciones ?? '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Tasa de Éxito Global</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats ? stats.tasa_exito + '%' : '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Más Activo</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 6, color: 'var(--text-1)', lineHeight: 1.3 }}>{masActivo?.nombre || '—'}</div>
            <div className="stat-sub">{masActivo ? masActivo.total + ' ejecuciones' : ''}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Más Fallas</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 6, color: 'var(--danger)', lineHeight: 1.3 }}>{masFallas?.nombre || '—'}</div>
            <div className="stat-sub">{masFallas ? (masFallas.total - masFallas.exitosas) + ' fallidas' : ''}</div>
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="chart-wrap" style={{ marginBottom: 0 }}>
            <div className="chart-title">Tendencia — Últimos 30 días</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dias} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#71717a' }} />
                <Line type="monotone" dataKey="exitosas" name="Exitosas" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="fallidas" name="Fallidas" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-wrap" style={{ marginBottom: 0 }}>
            <div className="chart-title">Por Workflow (top 8)</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData.slice(0, 8)} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#71717a' }} />
                <Bar dataKey="exitosas" name="Exitosas" fill="rgba(34,197,94,.4)" stroke="#22c55e" strokeWidth={1} radius={[3,3,0,0]} />
                <Bar dataKey="fallidas" name="Fallidas" fill="rgba(239,68,68,.35)" stroke="#ef4444" strokeWidth={1} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Rendimiento por Workflow</span>
          </div>
          <div className="table-head" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
            <div>Workflow</div><div>Ejecuciones</div><div>Exitosas</div><div>Tasa</div>
          </div>
          {byWorkflow.length === 0
            ? <div className="empty-state">Sin datos de ejecuciones.</div>
            : byWorkflow.map(w => {
              const tasa = w.total > 0 ? Math.round((w.exitosas / w.total) * 100) : 0
              const color = tasa >= 80 ? 'var(--success)' : tasa >= 50 ? 'var(--warning)' : 'var(--danger)'
              return (
                <div key={w.nombre} className="table-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr', cursor: 'default' }}>
                  <div className="cell-primary">{w.nombre}</div>
                  <div className="cell-secondary">{w.total}</div>
                  <div className="cell-secondary">{w.exitosas}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color }}>{tasa}%</div>
                </div>
              )
            })
          }
        </div>
      </div>
    </div>
  )
}
