import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, CheckCircle2, CreditCard } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAvailableSlots, useBookAppointment } from '../../hooks/useAppointments'
import { Layout } from '../../components/common/Layout'
import { Card, CardBody } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { TIME_SLOTS, CONSULTATION_FEE } from '../../utils/constants'
import { formatTime, formatDate, formatCurrency } from '../../utils/helpers'
import { openRazorpayCheckout } from '../../utils/razorpay'
import { api } from '../../lib/api'
import toast from 'react-hot-toast'

const steps = ['Select Date', 'Choose Slot', 'Confirm']

export const BookAppointment = () => {
  const { patient } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')

  const { data: slotsData } = useAvailableSlots(selectedDate)
  const bookedSlots = slotsData?.booked || []
  const isLeaveDay = slotsData?.is_leave || false
  const leaveRange = slotsData?.leave_range || null
  const bookMutation = useBookAppointment()

  const today = new Date().toISOString().split('T')[0]

  const [paying, setPaying] = useState(false)

  const handleBook = async () => {
    setPaying(true)
    try {
      // 1. Create pending appointment
      const result = await bookMutation.mutateAsync({
        date: selectedDate,
        time_slot: selectedSlot,
        payment_method: 'online',
        amount: CONSULTATION_FEE,
      })
      const appointmentId = result.appointment.id

      // 2. Create Razorpay order
      const order = await api.post('/payments/create-order', {
        appointment_id: appointmentId,
        amount: CONSULTATION_FEE,
      })

      // 3. Open Razorpay checkout
      openRazorpayCheckout({
        orderId: order.order_id,
        amount: order.amount,
        currency: order.currency,
        patientName: patient?.name,
        phone: patient?.phone || '',
        email: '',
        onSuccess: async (response) => {
          try {
            // 4. Verify payment + confirm appointment + generate OP
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              appointment_id: appointmentId,
            })
            toast.success('Payment successful! OP number generated.')
            navigate(`/patient/op-slip/${appointmentId}`)
          } catch {
            toast.error('Payment verification failed. Contact support.')
          } finally {
            setPaying(false)
          }
        },
        onFailure: (msg) => {
          toast.error(msg || 'Payment cancelled')
          setPaying(false)
        },
      })
    } catch (err) {
      toast.error(err?.message || 'Failed to initiate booking')
      setPaying(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>

        {/* Stepper */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i < step ? 'bg-green-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${i === step ? 'font-medium text-gray-900' : 'text-gray-400'}`}>{s}</span>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 min-w-4 ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <Card>
          <CardBody className="p-6 space-y-4">

            {/* Step 0 — Date */}
            {step === 0 && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" /> Select Date
                </h2>
                <input
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
                />
                <Button className="w-full mt-4" disabled={!selectedDate} onClick={() => setStep(1)}>
                  Continue
                </Button>
              </div>
            )}

            {/* Step 1 — Slot */}
            {step === 1 && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" /> Available Slots for {formatDate(selectedDate)}
                </h2>
                {isLeaveDay && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium">
                    Doctor is unavailable on this date. Please select another date.
                  </div>
                )}
                {leaveRange && (
                  <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-xl text-sm">
                    Doctor unavailable from <strong>{leaveRange}</strong> — those slots are blocked.
                  </div>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {TIME_SLOTS.map((slot) => {
                    const isBooked = bookedSlots.includes(slot)
                    const isSelected = selectedSlot === slot
                    return (
                      <button
                        key={slot}
                        disabled={isBooked}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          isBooked
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                            : isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                        }`}
                      >
                        {formatTime(slot)}
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-3 mt-4">
                  <Button variant="secondary" onClick={() => setStep(0)} className="flex-1">Back</Button>
                  <Button disabled={!selectedSlot || isLeaveDay} onClick={() => setStep(2)} className="flex-1">Continue</Button>
                </div>
              </div>
            )}

            {/* Step 2 — Confirm */}
            {step === 2 && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" /> Review & Confirm
                </h2>
                <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Patient</span>
                    <span className="font-medium text-gray-900">{patient?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium text-gray-900">{formatDate(selectedDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Time</span>
                    <span className="font-medium text-gray-900">{formatTime(selectedSlot)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-3">
                    <span className="font-semibold text-gray-900">Consultation Fee</span>
                    <span className="font-bold text-blue-600">{formatCurrency(CONSULTATION_FEE)}</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 flex-shrink-0" />
                  Online payment — OP number generated instantly on confirmation.
                </div>
                <div className="flex gap-3 mt-4">
                  <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button onClick={handleBook} loading={paying || bookMutation.isPending} className="flex-1">
                    Confirm & Pay
                  </Button>
                </div>
              </div>
            )}

          </CardBody>
        </Card>
      </div>
    </Layout>
  )
}
