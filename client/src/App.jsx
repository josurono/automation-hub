import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import WorkflowsPage from './pages/WorkflowsPage'
import WorkflowDetailPage from './pages/WorkflowDetailPage'
import MonitoringPage from './pages/MonitoringPage'
import DocumentationPage from './pages/DocumentationPage'
import AnalyticsPage from './pages/AnalyticsPage'
import NotFoundPage from './pages/NotFoundPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AppShell({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
          <Route path="/dashboard" element={
            <ProtectedRoute><AppShell><DashboardPage /></AppShell></ProtectedRoute>
          } />
          <Route path="/workflows" element={
            <ProtectedRoute><AppShell><WorkflowsPage /></AppShell></ProtectedRoute>
          } />
          <Route path="/workflows/:id" element={
            <ProtectedRoute><AppShell><WorkflowDetailPage /></AppShell></ProtectedRoute>
          } />
          <Route path="/monitoring" element={
            <ProtectedRoute><AppShell><MonitoringPage /></AppShell></ProtectedRoute>
          } />
          <Route path="/documentation" element={
            <ProtectedRoute><AppShell><DocumentationPage /></AppShell></ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute><AppShell><AnalyticsPage /></AppShell></ProtectedRoute>
          } />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
