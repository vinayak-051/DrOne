import { useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Layout } from '../../components/common/Layout'
import { Button } from '../../components/common/Button'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { formatDate, formatTime } from '../../utils/helpers'
import { ArrowLeft, Download } from 'lucide-react'

export const OPSlipPage = () => {
  const { appointmentId } = useParams()
  const [downloading, setDownloading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['op-slip', appointmentId],
    queryFn: () => api.get(`/appointments/${appointmentId}`),
  })

  if (isLoading) return <Layout><LoadingSpinner size="lg" className="mt-20" /></Layout>
  if (!data) return <Layout><div className="text-center mt-20 text-gray-500">Appointment not found</div></Layout>

  const op = Array.isArray(data.op_records) ? data.op_records[0] : data.op_records || null
  const patient = data.patients
  const qrData = JSON.stringify({ op: op?.op_number, patient: patient?.name, date: data.date })

  const handleDownload = async () => {
    if (!op?.op_number) return
    setDownloading(true)
    try {
      const token = await api._getToken()
      const res = await fetch(`${import.meta.env.VITE_API_URL}/appointments/${appointmentId}/op-slip.pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText)
        throw new Error(`${res.status}: ${errText}`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${op.op_number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(`Download failed: ${err.message}`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link to="/patient/appointments">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /> Back</Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 flex-1">OP Slip</h1>
          {op && (
            <Button size="sm" onClick={handleDownload} loading={downloading}>
              <Download className="w-4 h-4" /> Download PDF
            </Button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6 text-center">
            <h2 className="text-2xl font-bold">DrOne Hospital</h2>
            <p className="text-blue-200 text-sm mt-1">Outpatient Department</p>
          </div>

          <div className="p-6 space-y-6">
            {op ? (
              <>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-3">
                    <span className="text-blue-600 font-bold text-lg">#{op.token_number || '—'}</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 font-mono">{op.op_number}</p>
                  <p className="text-sm text-gray-400 mt-1">OP Number</p>
                </div>

                <div className="flex justify-center">
                  <QRCodeSVG value={qrData} size={140} level="M" />
                </div>

                <div className="space-y-3 border-t pt-4">
                  {[
                    ['Patient Name', patient?.name],
                    ['Age / Gender', `${patient?.age} yrs / ${patient?.gender}`],
                    ['Phone', patient?.phone],
                    ['Date', formatDate(data.date)],
                    ['Time Slot', formatTime(data.time_slot)],
                    ['Status', data.status],
                    ['Payment', data.payments?.[0]?.status === 'paid' ? 'PAID' : 'PENDING'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-900 capitalize">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 text-center">
                  Please arrive 10 minutes before your appointment time.<br />
                  Bring this slip and a valid ID proof.
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⏳</span>
                </div>
                <p className="font-semibold text-gray-900">Pending Confirmation</p>
                <p className="text-sm text-gray-500 mt-2">
                  Your appointment is pending confirmation. OP number will be generated once confirmed.
                </p>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                  Date: <strong>{formatDate(data.date)}</strong> · Time: <strong>{formatTime(data.time_slot)}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
