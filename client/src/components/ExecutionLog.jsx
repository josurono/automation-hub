function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function ExecutionLog({ executions }) {
  if (!executions || !executions.length) {
    return <div className="empty-state">Sin ejecuciones registradas.</div>
  }

  return (
    <>
      <div className="table-head" style={{ gridTemplateColumns: '1fr 2fr 1fr 2fr' }}>
        <div>Estado</div><div>Fecha</div><div>Duración</div><div>Error</div>
      </div>
      {executions.map((e, i) => (
        <div key={i} className="table-row" style={{ gridTemplateColumns: '1fr 2fr 1fr 2fr', cursor: 'default' }}>
          <div><span className={`badge badge-${e.estado}`}>{e.estado}</span></div>
          <div className="cell-secondary">{fmtDateTime(e.timestamp)}</div>
          <div className="cell-secondary">{e.duracion_ms ? e.duracion_ms + 'ms' : '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--danger)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {e.mensaje_error || ''}
          </div>
        </div>
      ))}
    </>
  )
}
