import { useState } from 'react'
import api from '../api/client'

export default function WorkflowModal({ onClose, onCreated }) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [herramientasRaw, setHerramientasRaw] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!nombre.trim()) return
    const herramientas = herramientasRaw
      ? herramientasRaw.split(',').map(h => h.trim()).filter(Boolean)
      : []
    setLoading(true)
    try {
      await api.post('/api/workflows', { nombre: nombre.trim(), descripcion: descripcion.trim(), herramientas })
      onCreated && onCreated()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Nuevo Workflow</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="mfield">
            <label>Nombre *</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Procesamiento de Facturas" autoFocus />
          </div>
          <div className="mfield">
            <label>Descripción</label>
            <textarea rows="3" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="¿Qué hace este workflow?" />
          </div>
          <div className="mfield">
            <label>Herramientas (separadas por coma)</label>
            <input type="text" value={herramientasRaw} onChange={e => setHerramientasRaw(e.target.value)} placeholder="Ej: Make, OpenAI, Google Sheets" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-modal-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creando...' : 'Crear Workflow'}
          </button>
        </div>
      </div>
    </div>
  )
}
