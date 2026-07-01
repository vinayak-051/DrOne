import { Calendar, Users, Stethoscope, CheckCircle2, Clock } from 'lucide-react'
import { Layout } from '../../components/common/Layout'
import { StatCard } from '../../components/common/Card'
import { Card } from '../../components/common/Card'
import { Badge, statusBadge } from '../../components/common/Badge'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { useAppointments } from '../../hooks/useAppointments'
import { formatDate, formatTime } from '../../utils/helpers'

export const AdminDashboard = () => {
  const { data: appointments, isLoading } = useAppointments()

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const currentTime = now.toTimeString().slice(0, 5) // "HH:MM"

  const todayAppts = appointments?.filter((a) => a.date === today) || []
  const pendingCount = appointments?.filter((a) => a.status === 'pending').length || 0

  // Confirmed today with time slot still in future (yet to be diagnosed)
  const leftToDiagnose = todayAppts.filter(
    (a) => a.status === 'confirmed' && a.time_slot > currentTime
  ).length

  // Distinct patients who have at least one confirmed appointment (diagnosed)
  const diagnosedPatientIds = new Set(
    (appointments || [])
      .filter((a) => a.status === 'confirmed')
      .map((a) => a.patient_id)
  )
  const diagnosedCount = diagnosedPatientIds.size

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of today&apos;s hospital activity</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Calendar} label="Today's Appointments" value={todayAppts.length} color="blue" to="/admin/appointments" />
          <StatCard icon={Clock} label="Pending Confirmation" value={pendingCount} color="orange" to="/admin/appointments" />
          <StatCard icon={CheckCircle2} label="Left to Diagnose" value={leftToDiagnose} color="green" to="/admin/queue" />
          <StatCard icon={Stethoscope} label="Patients Diagnosed" value={diagnosedCount} color="purple" to="/admin/patients" />
        </div>

        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Today&apos;s Appointments</h2>
            <p className="text-sm text-gray-400">{formatDate(today)}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {isLoading ? (
              <div className="p-8"><LoadingSpinner /></div>
            ) : todayAppts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No appointments today</p>
              </div>
            ) : (
              todayAppts.map((appt) => {
                const { variant, label } = statusBadge(appt.status)
                const op = (Array.isArray(appt.op_records) ? appt.op_records[0] : appt.op_records || null)
                return (
                  <div key={appt.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="text-center w-12">
                        {op?.token_number ? (
                          <span className="font-bold text-blue-600 text-lg">#{op.token_number}</span>
                        ) : (
                          <span className="text-gray-300 text-sm">—</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{appt.patients?.name}</p>
                        <p className="text-sm text-gray-500">{formatTime(appt.time_slot)} · {appt.patients?.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {op && <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded">{op.op_number}</span>}
                      <Badge variant={variant}>{label}</Badge>
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
