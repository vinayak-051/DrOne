import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export const useMedicalRecords = (patientId) => {
  return useQuery({
    queryKey: ['medical-records', patientId],
    queryFn: () => api.get(`/medical/records/${patientId}`),
    enabled: !!patientId,
  })
}

export const useReports = (patientId) => {
  return useQuery({
    queryKey: ['reports', patientId],
    queryFn: () => api.get(`/medical/reports/${patientId}`),
    enabled: !!patientId,
  })
}

export const useAddMedicalRecord = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.post('/medical/records', body),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: ['medical-records', patientId] })
    },
  })
}

export const useUploadReport = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ patientId, file, category = 'other' }) => {
      const form = new FormData()
      form.append('patient_id', patientId)
      form.append('category', category)
      form.append('file', file)
      return api.postForm('/medical/reports/upload', form)
    },
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: ['reports', patientId] })
    },
  })
}
