import { Link } from 'react-router-dom'
import { Calendar, FileText, Clock, Plus, ArrowRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAppointments } from '../../hooks/useAppointments'
import { Layout } from '../../components/common/Layout'
import { Card } from '../../components/common/Card'
import { StatCard } from '../../components/common/Card'
import { Badge, statusBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { formatDate, formatTime } from '../../utils/helpers'

export const PatientDashboard = () => {
  const { patient } = useAuth()
  const { data: appointments, isLoading } = useAppointments(patient?.id)

  const upcoming = appointments?.filter((a) => a.status !== 'cancelled' && a.status !== 'completed') || []
  const past = appointments?.filter((a) => a.status === 'completed') || []

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {patient?.name?.split(' ')[0] || 'Patient'} 👋
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
    </Layout>
  )
}
