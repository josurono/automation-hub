import { useEffect, useState } from 'react'
import api from '../api/client'
import WorkflowCard from '../components/WorkflowCard'
import WorkflowModal from '../components/WorkflowModal'

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([])
  const [showModal, setShowModal] = useState(false)

  async function load() {
    const res = await api.get('/api/workflows')
    setWorkflows(res.data)
  }

  useEffect(() => { load() }, [])

  async function archivar(id) {
    if (!confirm('¿Archivar este workflow?')) return
    await api.delete(`/api/workflows/${id}`)
    load()
  }

  return (
    <div className="content">
      <div className="topbar" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="topbar-left">
          <h1>Workflows</h1>
          <p>Gestión de automatizaciones</p>
        </div>
        <button className="topbar-btn" onClick={() => setShowModal(true)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo Workflow
        </button>
      </div>

      <div style={{ padding: 24 }}>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Todos los Workflows</span>
          </div>
          <div className="table-head" style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 80px' }}>
            <div>Nombre</div><div>Herramientas</div><div>Estado</div><div>Modificado</div><div></div>
          </div>
          {workflows.length === 0
            ? <div className="empty-state">No hay workflows. Crea el primero.</div>
            : workflows.map(w => (
              <WorkflowCard key={w.id} workflow={w} showArchive onArchive={archivar} />
            ))
          }
        </div>
      </div>

      {showModal && <WorkflowModal onClose={() => setShowModal(false)} onCreated={load} />}
    </div>
  )
}
