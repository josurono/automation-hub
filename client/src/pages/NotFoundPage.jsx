import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--text-3)' }}>404</div>
      <div style={{ fontSize: 14, color: 'var(--text-2)' }}>Página no encontrada</div>
      <button className="btn-primary" style={{ width: 'auto', padding: '8px 20px' }} onClick={() => navigate('/dashboard')}>
        Ir al Dashboard
      </button>
    </div>
  )
}
