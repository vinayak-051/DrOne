import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export const usePatient = (userId) => {
  return useQuery({
    queryKey: ['patient', userId],
    queryFn: () => api.get('/patients/me'),
    enabled: !!userId,
  })
}

export const useAllPatients = () => {
  return useQuery({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients/'),
  })
}

export const useSearchPatients = (query) => {
  return useQuery({
    queryKey: ['patients-search', query],
    queryFn: () => api.get(`/patients/search?q=${encodeURIComponent(query)}`),
    enabled: !!query && query.length >= 2,
  })
}

export const useUpdatePatient = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }) => api.patch('/patients/me', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient'] })
    },
  })
}
