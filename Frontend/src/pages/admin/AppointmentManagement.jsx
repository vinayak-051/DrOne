import { useState } from 'react'
import { Calendar, Check, X, ChevronDown } from 'lucide-react'
import { useAppointments, useConfirmAppointment, useCancelAppointment } from '../../hooks/useAppointments'
import { Layout } from '../../components/common/Layout'
import { Card } from '../../components/common/Card'
import { Badge, statusBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { formatDate, formatTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

export const AppointmentManagement = () => {
  const { data: appointments, isLoading } = useAppointments()
  const confirmMutation = useConfirmAppointment()
  const cancelMutation = useCancelAppointment()
  const [filter, setFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  const filtered = appointments?.filter((a) => {
    const statusOk = filter === 'all' || a.status === filter
    const dateOk = !dateFilter || a.date === dateFilter
    return statusOk && dateOk
  }) || []

  const handleConfirm = async (id) => {
    try {
      await confirmMutation.mutateAsync({ appointmentId: id })
      toast.success('Appointment confirmed & OP number generated!')
    } catch {
      toast.error('Failed to confirm appointment')
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return
    try {
      await cancelMutation.mutateAsync(id)
      toast.success('Appointment cancelled')
    } catch {
      toast.error('Failed to cancel')
    }
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Appointment Management</h1>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                  filter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="text-sm text-gray-400 hover:text-gray-600">
              Clear date
            </button>
          )}
        </div>

        <Card>
          <div className="divide-y divide-gray-50">
            {isLoading ? (
              <div className="p-8"><LoadingSpinner /></div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No appointments found</p>
              </div>
            ) : (
              filtered.map((appt) => {
                const { variant, label } = statusBadge(appt.status)
                const op = (Array.isArray(appt.op_records) ? appt.op_records[0] : appt.op_records || null)
                const isPending = appt.status === 'pending'
                return (
                  <div key={appt.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{appt.patients?.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(appt.date)} · {formatTime(appt.time_slot)} · {appt.patients?.phone}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge variant={variant}>{label}</Badge>
                            <Badge variant={appt.payments?.[0]?.status === 'paid' ? 'success' : 'warning'}>
                              {appt.payments?.[0]?.status === 'paid' ? 'Paid' : 'Payment Pending'}
                            </Badge>
                            <Badge variant="default">{appt.payment_method?.replace(/_/g, ' ')}</Badge>
                            {op && (
                              <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                {op.op_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isPending && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleConfirm(appt.id)}
                            loading={confirmMutation.isPending}
                          >
                            <Check className="w-3.5 h-3.5" /> Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleCancel(appt.id)}
                          >
                            <X className="w-3.5 h-3.5" /> Cancel
                          </Button>
                        </div>
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
