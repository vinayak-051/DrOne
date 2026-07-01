import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Plus, FileText } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAppointments, useCancelAppointment } from '../../hooks/useAppointments'
import { Layout } from '../../components/common/Layout'
import { Card } from '../../components/common/Card'
import { Badge, statusBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { formatDate, formatTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

export const AppointmentsPage = () => {
  const { patient } = useAuth()
  const { data: appointments, isLoading } = useAppointments(patient?.id)
  const cancelMutation = useCancelAppointment()
  const [filter, setFilter] = useState('all')

  const filtered = appointments?.filter((a) => filter === 'all' || a.status === filter) || []

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return
    try {
      await cancelMutation.mutateAsync(id)
      toast.success('Appointment cancelled')
    } catch { toast.error('Failed to cancel') }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <Link to="/patient/book"><Button size="sm"><Plus className="w-4 h-4" /> Book New</Button></Link>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                filter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
              }`}
            >{s}</button>
          ))}
        </div>

        <Card>
          <div className="divide-y divide-gray-50">
            {isLoading ? (
              <div className="p-8"><LoadingSpinner /></div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No appointments found</p>
              </div>
            ) : filtered.map((appt) => {
              const { variant, label } = statusBadge(appt.status)
              const op = (Array.isArray(appt.op_records) ? appt.op_records[0] : appt.op_records || null)
              const canCancel = ['pending', 'confirmed'].includes(appt.status)
              return (
                <div key={appt.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900">{formatDate(appt.date)}</p>
                          <Badge variant={variant}>{label}</Badge>
                          </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3.5 h-3.5" /> {formatTime(appt.time_slot)}
                        </p>
                        {op && (
                          <p className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded mt-2 inline-block">
                            {op.op_number}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                      {op && (
                        <Link to={`/patient/op-slip/${appt.id}`}>
                          <Button size="sm" variant="secondary"><FileText className="w-3.5 h-3.5" /> Slip</Button>
                        </Link>
                      )}
                      {canCancel && (
                        <Button size="sm" variant="danger" onClick={() => handleCancel(appt.id)} loading={cancelMutation.isPending}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>


    </Layout>
  )
}
