import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export const useAppointments = () => useQuery({
  queryKey: ['appointments'],
  queryFn: () => api.get('/appointments/'),
})

export const useAvailableSlots = (date) => useQuery({
  queryKey: ['slots', date],
  queryFn: () => api.get(`/appointments/slots?date=${date}`),
  enabled: !!date,
})

export const useBookAppointment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.post('/appointments/book', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}

export const useConfirmAppointment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ appointmentId }) => api.post('/appointments/confirm', { appointment_id: appointmentId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['queue'] })
    },
  })
}

export const useRescheduleAppointment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ appointmentId, date, time_slot }) =>
      api.patch(`/appointments/${appointmentId}/reschedule`, { date, time_slot }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}

export const useCancelAppointment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (appointmentId) => api.patch(`/appointments/${appointmentId}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}
