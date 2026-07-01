import { useState } from 'react'
import { Play, CheckCircle2, Clock, Users, X, Phone, Hash } from 'lucide-react'
import { useQueue, useUpdateQueueStatus } from '../../hooks/useQueue'
import { Layout } from '../../components/common/Layout'
import { Card, CardBody } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { formatTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

export const QueueSystem = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [selected, setSelected] = useState(null) // 'waiting' | 'in_progress' | 'completed'
  const { data: queue, isLoading } = useQueue(date)
  const updateMutation = useUpdateQueueStatus()

  const waiting    = queue?.filter((q) => q.queue_status === 'waiting' || !q.queue_status) || []
  const inProgress = queue?.filter((q) => q.queue_status === 'in_progress') || []
  const completed  = queue?.filter((q) => q.queue_status === 'completed') || []

  const handleStatus = async (opId, status) => {
    try {
      await updateMutation.mutateAsync({ opId, status })
      toast.success(status === 'in_progress' ? 'Patient called' : 'Marked as completed')
    } catch {
      toast.error('Failed to update status')
    }
  }

  const toggle = (key) => setSelected((prev) => (prev === key ? null : key))

  const panels = {
    waiting:     { items: waiting,    color: 'yellow', label: 'Waiting' },
    in_progress: { items: inProgress, color: 'blue',   label: 'In Progress' },
    completed:   { items: completed,  color: 'green',  label: 'Completed' },
  }

  const activeItems = selected ? panels[selected].items : []

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Queue System</h1>
          <input
            type="date" value={date}
            onChange={(e) => { setDate(e.target.value); setSelected(null) }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Stat boxes — clickable */}
        <div className="grid grid-cols-3 gap-4">
          {/* Waiting */}
          <button onClick={() => toggle('waiting')}
            className={`rounded-xl p-5 text-center border-2 transition-all ${
              selected === 'waiting'
                ? 'border-yellow-400 bg-yellow-50 shadow-md'
                : 'border-yellow-200 bg-yellow-50 hover:border-yellow-400'
            }`}>
            <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
            <p className="text-3xl font-bold text-yellow-700">{waiting.length}</p>
            <p className="text-sm text-yellow-600 font-medium">Waiting</p>
          </button>

          {/* In Progress */}
          <button onClick={() => toggle('in_progress')}
            className={`rounded-xl p-5 text-center border-2 transition-all ${
              selected === 'in_progress'
                ? 'border-blue-400 bg-blue-50 shadow-md'
                : 'border-blue-200 bg-blue-50 hover:border-blue-400'
            }`}>
            <Play className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <p className="text-3xl font-bold text-blue-700">{inProgress.length}</p>
            <p className="text-sm text-blue-600 font-medium">Diagnosing</p>
          </button>

          {/* Completed */}
          <button onClick={() => toggle('completed')}
            className={`rounded-xl p-5 text-center border-2 transition-all ${
              selected === 'completed'
                ? 'border-green-400 bg-green-50 shadow-md'
                : 'border-green-200 bg-green-50 hover:border-green-400'
            }`}>
            <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-3xl font-bold text-green-700">{completed.length}</p>
            <p className="text-sm text-green-600 font-medium">Completed</p>
          </button>
        </div>

        {/* Patient detail panel */}
        {selected && (
          <Card>
            <CardBody className="p-0">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">
                  {panels[selected].label} Patients ({activeItems.length})
                </h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isLoading ? (
                <div className="p-8"><LoadingSpinner /></div>
              ) : activeItems.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No patients in this category</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {activeItems.map((item) => {
                    const patient = item.appointments?.patients
                    const status = item.queue_status || 'waiting'
                    return (
                      <div key={item.id} className="px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-blue-600 text-lg">#{item.token_number}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{patient?.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Hash className="w-3 h-3" />{item.op_number}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTime(item.appointments?.time_slot)}
                              </span>
                              {patient?.phone && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />{patient.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {status === 'waiting' && (
                            <Button size="sm" onClick={() => handleStatus(item.id, 'in_progress')} loading={updateMutation.isPending}>
                              <Play className="w-3.5 h-3.5" /> Call
                            </Button>
                          )}
                          {status === 'in_progress' && (
                            <Button size="sm" variant="success" onClick={() => handleStatus(item.id, 'completed')} loading={updateMutation.isPending}>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Done
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Empty state when nothing selected and no data */}
        {!selected && !isLoading && queue?.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No patients in queue for this date</p>
          </div>
        )}

        {/* Hint when not selected */}
        {!selected && queue?.length > 0 && (
          <p className="text-center text-sm text-gray-400">Tap a number above to see patient details</p>
        )}
      </div>
    </Layout>
  )
}
