import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import StatsCards from '../components/StatsCards'
import WorkflowCard from '../components/WorkflowCard'
import WorkflowModal from '../components/WorkflowModal'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [workflows, setWorkflows] = useState([])
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  async function loadData() {
    const [sRes, wRes] = await Promise.all([
      api.get('/api/stats'),
      api.get('/api/workflows'),
    ])
    setStats(sRes.data)
    setWorkflows(wRes.data)
  }

  useEffect(() => { loadData() }, [])

  return (
    <div className="content">
      <div className="topbar" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="topbar-left">
          <h1>Dashboard</h1>
          <p>Resumen general del sistema</p>
        </div>
        <button className="topbar-btn" onClick={() => setShowModal(true)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo Workflow
        </button>
      </div>

      <div style={{ padding: 24 }}>
        <StatsCards stats={stats} />

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Workflows recientes</span>
            <button className="panel-action" onClick={() => navigate('/workflows')}>Ver todos →</button>
          </div>
          <div className="table-head" style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr' }}>
            <div>Nombre</div><div>Herramientas</div><div>Estado</div><div>Modificado</div>
          </div>
          {workflows.length === 0
            ? <div className="empty-state">No hay workflows registrados.</div>
            : workflows.slice(0, 6).map(w => <WorkflowCard key={w.id} workflow={w} cols="2fr 2fr 1fr 1fr" />)
          }
        </div>
      </div>

      {showModal && <WorkflowModal onClose={() => setShowModal(false)} onCreated={loadData} />}
    </div>
  )
}
