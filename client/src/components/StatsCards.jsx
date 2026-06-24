export default function StatsCards({ stats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
      <StatCard label="Total Workflows" value={stats?.total_workflows ?? '—'} sub="registrados" />
      <StatCard label="Activos" value={stats?.activos ?? '—'} sub="en operación" valueColor="var(--success)" />
      <StatCard label="Ejecuciones" value={stats?.total_ejecuciones ?? '—'} sub="registradas" valueColor="var(--warning)" />
      <StatCard label="Tasa de Éxito" value={stats ? stats.tasa_exito + '%' : '—'} sub="promedio global" valueColor="#60a5fa" />
    </div>
  )
}

function StatCard({ label, value, sub, valueColor }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={valueColor ? { color: valueColor } : {}}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  )
}
