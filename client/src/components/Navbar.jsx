import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const icons = {
  dashboard: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  workflows: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  monitoring: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  documentation: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  analytics: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  logout: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/workflows', label: 'Workflows', icon: 'workflows' },
  { to: '/monitoring', label: 'Monitoring', icon: 'monitoring' },
  { to: '/documentation', label: 'Documentation', icon: 'documentation' },
  { to: '/analytics', label: 'Analytics', icon: 'analytics' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside style={{
      width: 220, minWidth: 220, background: 'var(--surface)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      position: 'fixed', height: '100vh', top: 0, left: 0, zIndex: 20,
    }}>
      <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>FV</div>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>FlowVault</span>
      </div>

      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', padding: '0 8px', marginBottom: 4 }}>Principal</div>
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} style={{ textDecoration: 'none', display: 'block', marginBottom: 1 }}>
              {({ isActive }) => (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6,
                  color: isActive ? 'var(--accent)' : 'var(--text-2)',
                  background: isActive ? 'var(--accent-dim)' : 'transparent',
                  fontSize: 13,
                }}>
                  {icons[icon]} {label}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6 }}>
          <div style={{ width: 24, height: 24, background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'var(--accent)', flexShrink: 0 }}>
            {user ? user[0].toUpperCase() : 'A'}
          </div>
          <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{user || 'admin'}</span>
          <button onClick={handleLogout} title="Cerrar sesión"
            style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
            {icons.logout}
          </button>
        </div>
      </div>
    </aside>
  )
}
