import { createContext, useContext, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const stored = localStorage.getItem('flowvault_token')
  const [token, setToken] = useState(stored || null)
  const [user, setUser] = useState(localStorage.getItem('flowvault_user') || null)

  async function login(email, password) {
    const res = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('flowvault_token', res.data.token)
    localStorage.setItem('flowvault_user', res.data.email)
    setToken(res.data.token)
    setUser(res.data.email)
  }

  function logout() {
    localStorage.removeItem('flowvault_token')
    localStorage.removeItem('flowvault_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
