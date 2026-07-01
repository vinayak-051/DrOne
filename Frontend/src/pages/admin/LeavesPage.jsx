import { useState } from 'react'
import { CalendarOff, Plus, Trash2 } from 'lucide-react'
import { useLeaves, useAddLeave, useDeleteLeave } from '../../hooks/useLeaves'
import { Layout } from '../../components/common/Layout'
import { Card, CardBody, CardHeader } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { formatDate, formatTime } from '../../utils/helpers'
import { TIME_SLOTS } from '../../utils/constants'
import toast from 'react-hot-toast'

export const LeavesPage = () => {
  const { data: leaves = [], isLoading } = useLeaves()
  const addLeave = useAddLeave()
  const deleteLeave = useDeleteLeave()
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const today = new Date().toISOString().split('T')[0]

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!date) return
    if ((startTime && !endTime) || (!startTime && endTime)) {
      toast.error('Please set both from and to times, or leave both empty for full day')
      return
    }
    if (startTime && endTime && startTime >= endTime) {
      toast.error('"From" time must be before "To" time')
      return
    }
    try {
      await addLeave.mutateAsync({
        date,
        reason,
        start_time: startTime || null,
        end_time: endTime || null,
      })
      toast.success('Leave added')
      setDate(''); setReason(''); setStartTime(''); setEndTime('')
    } catch (err) {
      toast.error(err.message || 'Failed to add leave')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteLeave.mutateAsync(id)
      toast.success('Leave removed')
    } catch {
      toast.error('Failed to remove leave')
    }
  }

  const upcoming = leaves.filter((l) => l.date >= today)
  const past = leaves.filter((l) => l.date < today)

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Doctor Leaves / Holidays</h1>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" /> Block a Date
            </h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Date</label>
                  <input
                    type="date" min={today} value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <Input label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Public holiday" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Block specific time slots <span className="text-gray-400 font-normal">(leave empty to block full day)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">From</label>
                    <select value={startTime} onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">-- Start time --</option>
                      {TIME_SLOTS.map((s) => <option key={s} value={s}>{formatTime(s)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">To</label>
                    <select value={endTime} onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">-- End time --</option>
                      {TIME_SLOTS.filter((s) => !startTime || s > startTime).map((s) => (
                        <option key={s} value={s}>{formatTime(s)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <Button type="submit" loading={addLeave.isPending} className="w-full">
                <CalendarOff className="w-4 h-4" /> Block
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Upcoming Blocked Dates ({upcoming.length})</h2>
          </CardHeader>
          <CardBody className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
            ) : upcoming.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No upcoming leaves</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {upcoming.map((l) => (
                  <div key={l.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{formatDate(l.date)}</p>
                      <p className="text-xs text-blue-600 font-medium">
                        {l.start_time && l.end_time ? `${formatTime(l.start_time)} – ${formatTime(l.end_time)}` : 'Full day'}
                      </p>
                      {l.reason && <p className="text-xs text-gray-400">{l.reason}</p>}
                    </div>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(l.id)} loading={deleteLeave.isPending}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {past.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-500 text-sm">Past Blocked Dates</h2>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-gray-50">
                {past.map((l) => (
                  <div key={l.id} className="flex items-center justify-between px-5 py-3 opacity-50">
                    <div>
                      <p className="font-medium text-gray-700 text-sm">{formatDate(l.date)}</p>
                      {l.reason && <p className="text-xs text-gray-400">{l.reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </Layout>
  )
}
