import { Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import { PageLoader } from './components/common/LoadingSpinner'

class ErrorBoundary extends Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error, info) { console.error('ErrorBoundary caught:', error, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
            <p className="text-4xl mb-4">⚠️</p>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 text-sm mb-6">An unexpected error occurred. Please refresh the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

import { PatientDashboard } from './pages/patient/PatientDashboard'
import { BookAppointment } from './pages/patient/BookAppointment'
import { AppointmentsPage } from './pages/patient/AppointmentsPage'
import { OPSlipPage } from './pages/patient/OPSlipPage'
import { MedicalHistory } from './pages/patient/MedicalHistory'
import { ProfilePage } from './pages/patient/ProfilePage'
import { KnowYourDoctor } from './pages/patient/KnowYourDoctor'

import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AppointmentManagement } from './pages/admin/AppointmentManagement'
import { QueueSystem } from './pages/admin/QueueSystem'
import { PatientSearch } from './pages/admin/PatientSearch'
import { MedicalRecordsEditor } from './pages/admin/MedicalRecordsEditor'
import { AnalyticsDashboard } from './pages/admin/AnalyticsDashboard'
import { PatientsPage } from './pages/admin/PatientsPage'
import { LeavesPage } from './pages/admin/LeavesPage'
import { AdminProfile } from './pages/admin/AdminProfile'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
    },
  },
})

const ProtectedRoute = ({ children, role }) => {
  const { user, profile, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (role && profile?.role !== role) {
    return <Navigate to={profile?.role === 'admin' ? '/admin/dashboard' : '/patient/dashboard'} replace />
  }
  return children
}

const AppRoutes = () => {
  const { user, profile, loading } = useAuth()
  if (loading) return <PageLoader />

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={profile?.role === 'admin' ? '/admin/dashboard' : '/patient/dashboard'} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/patient/dashboard" replace /> : <RegisterPage />} />

      <Route path="/patient/dashboard" element={<ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient/book" element={<ProtectedRoute role="patient"><BookAppointment /></ProtectedRoute>} />
      <Route path="/patient/appointments" element={<ProtectedRoute role="patient"><AppointmentsPage /></ProtectedRoute>} />
      <Route path="/patient/op-slip/:appointmentId" element={<ProtectedRoute role="patient"><OPSlipPage /></ProtectedRoute>} />
      <Route path="/patient/history" element={<ProtectedRoute role="patient"><MedicalHistory /></ProtectedRoute>} />
      <Route path="/patient/doctor" element={<ProtectedRoute role="patient"><KnowYourDoctor /></ProtectedRoute>} />
      <Route path="/patient/profile" element={<ProtectedRoute role="patient"><ProfilePage /></ProtectedRoute>} />

      <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/appointments" element={<ProtectedRoute role="admin"><AppointmentManagement /></ProtectedRoute>} />
      <Route path="/admin/queue" element={<ProtectedRoute role="admin"><QueueSystem /></ProtectedRoute>} />
      <Route path="/admin/patients" element={<ProtectedRoute role="admin"><PatientsPage /></ProtectedRoute>} />
      <Route path="/admin/search" element={<ProtectedRoute role="admin"><PatientSearch /></ProtectedRoute>} />
      <Route path="/admin/records" element={<ProtectedRoute role="admin"><MedicalRecordsEditor /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute role="admin"><AnalyticsDashboard /></ProtectedRoute>} />
      <Route path="/admin/leaves" element={<ProtectedRoute role="admin"><LeavesPage /></ProtectedRoute>} />
      <Route path="/admin/profile" element={<ProtectedRoute role="admin"><AdminProfile /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to={user ? (profile?.role === 'admin' ? '/admin/dashboard' : '/patient/dashboard') : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '12px', fontSize: '14px' },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
