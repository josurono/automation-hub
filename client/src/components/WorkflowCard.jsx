import { useNavigate } from 'react-router-dom'

function esc(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function renderChips(herramientasJSON, max = 2) {
  try {
    const hs = JSON.parse(herramientasJSON || '[]')
    const visible = hs.slice(0, max)
    const extra = hs.length - max
    return (
      <>
        {visible.map(h => <span key={h} className="chip">{h}</span>)}
        {extra > 0 && <span className="chip">+{extra}</span>}
      </>
    )
  } catch {
    return null
  }
}

export default function WorkflowCard({ workflow, cols, showArchive, onArchive }) {
  const navigate = useNavigate()
  const gridCols = cols || '2fr 2fr 1fr 1fr'

  return (
    <div
      className="table-row"
      style={{ gridTemplateColumns: showArchive ? '2fr 2fr 1fr 1fr 80px' : gridCols, cursor: 'pointer' }}
      onClick={() => navigate(`/workflows/${workflow.id}`)}
    >
      <div>
        <div className="cell-primary">{workflow.nombre}</div>
        <div className="cell-sub">{workflow.descripcion || 'Sin descripción'}</div>
      </div>
      <div>{renderChips(workflow.herramientas)}</div>
      <div><span className={`badge badge-${workflow.estado}`}>{workflow.estado}</span></div>
      <div className="cell-secondary">{fmtDate(workflow.fecha_modificacion)}</div>
      {showArchive && (
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={e => { e.stopPropagation(); onArchive && onArchive(workflow.id) }}
            style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', padding: '2px 6px', borderRadius: 4, transition: 'color .12s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            Archivar
          </button>
        </div>
      )}
    </div>
  )
}
