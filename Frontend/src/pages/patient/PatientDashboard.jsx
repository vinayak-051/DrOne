import { useState, Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, FileText, Clock, Plus, ArrowRight, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAppointments } from '../../hooks/useAppointments'
import { Layout } from '../../components/common/Layout'
import { Card } from '../../components/common/Card'
import { StatCard } from '../../components/common/Card'
import { Badge, statusBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { formatDate, formatTime } from '../../utils/helpers'

const Robot3D = lazy(() => import('../../components/Robot3D').then(m => ({ default: m.Robot3D })))

export const PatientDashboard = () => {
  const { patient } = useAuth()
  const { data: appointments, isLoading } = useAppointments(patient?.id)
  const [showRobot, setShowRobot] = useState(false)

  const upcoming = appointments?.filter((a) => a.status !== 'cancelled' && a.status !== 'completed') || []
  const past = appointments?.filter((a) => a.status === 'completed') || []

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {patient?.name?.split(' ')[0] || 'Patient'} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage your health appointments and records</p>
          </div>
          <Link to="/patient/book">
            <Button>
              <Plus className="w-4 h-4" />
              Book Appointment
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={Calendar} label="Upcoming Appointments" value={upcoming.length} color="blue" to="/patient/appointments" />
          <StatCard icon={Clock} label="Past Appointments" value={past.length} color="green" to="/patient/appointments" />
          <StatCard icon={FileText} label="Medical Records" value="—" color="purple" trend="View history" to="/patient/history" />
        </div>

        <Card>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Upcoming Appointments</h2>
            <Link to="/patient/appointments" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {isLoading ? (
              <div className="p-6"><LoadingSpinner /></div>
            ) : upcoming.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming appointments</p>
                <Link to="/patient/book">
                  <Button variant="secondary" size="sm" className="mt-3">Book Now</Button>
                </Link>
              </div>
            ) : (
              upcoming.slice(0, 5).map((appt) => {
                const { variant, label } = statusBadge(appt.status)
                const op = (Array.isArray(appt.op_records) ? appt.op_records[0] : appt.op_records || null)
                return (
                  <div key={appt.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{formatDate(appt.date)}</p>
                        <p className="text-sm text-gray-500">{formatTime(appt.time_slot)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {op && (
                        <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {op.op_number}
                        </span>
                      )}
                      <Badge variant={variant}>{label}</Badge>
                      {op && (
                        <Link to={`/patient/op-slip/${appt.id}`}>
                          <Button size="sm" variant="secondary">View Slip</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>

      {/* Floating robot button — fixed bottom-right */}
      <button
        onClick={() => setShowRobot(true)}
        title="AI Assistant"
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          width: '68px',
          height: '68px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e0f4ff, #b3e5fc)',
          border: '2px solid #4fc3f7',
          cursor: 'pointer',
          padding: '6px',
          zIndex: 40,
          boxShadow: '0 4px 20px rgba(79,195,247,0.5)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(79,195,247,0.75)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(79,195,247,0.5)' }}
      >
        <img src="/icons/image.png" alt="AI Assistant" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </button>

      {/* Robot Modal */}
      {showRobot && (
        <div
          onClick={() => setShowRobot(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
            padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              width: 370, height: 450,
              borderRadius: '24px',
              overflow: 'hidden',
              background: '#00d4d4',
              boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
            }}
          >
            {/* Close */}
            <button
              onClick={() => setShowRobot(false)}
              style={{
                position: 'absolute', top: 12, right: 12, zIndex: 10,
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.3)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={16} color="#fff" />
            </button>

            {/* 3D Robot */}
            <div style={{ position: 'absolute', top: '10%', left: 0, right: 0 }}>
              <Suspense fallback={
                <div style={{ width: '100%', height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
                  🤖
                </div>
              }>
                <Robot3D height={385} />
              </Suspense>
            </div>

            {/* Label */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 20, textAlign: 'center' }}>
              <p style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '1px',
                color: '#ffffff',
                textShadow: '0 0 10px rgba(255,255,255,0.9), 0 0 20px rgba(255,255,255,0.5)',
              }}>
                AI Health
              </p>
              <p style={{
                margin: '6px 0 0',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: '#00ffff',
                textShadow:
                  '0 0 6px #00ffff, 0 0 12px #00ffff, 0 0 24px #00e5ff, 0 0 40px #00bcd4',
                animation: 'neonPulse 1.8s ease-in-out infinite alternate',
              }}>
                Coming Soon
              </p>
            </div>
            <style>{`
              @keyframes neonPulse {
                from { text-shadow: 0 0 4px #00ffff, 0 0 10px #00ffff, 0 0 20px #00e5ff; opacity: 0.85; }
                to   { text-shadow: 0 0 8px #00ffff, 0 0 20px #00ffff, 0 0 40px #00e5ff, 0 0 60px #00bcd4; opacity: 1; }
              }
            `}</style>
          </div>
        </div>
      )}
    </Layout>
  )
}
