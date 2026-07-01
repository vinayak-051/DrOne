import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export const useLeaves = () => useQuery({
  queryKey: ['leaves'],
  queryFn: () => api.get('/leaves/'),
})

export const useAddLeave = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.post('/leaves/', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaves'] }),
  })
}

export const useDeleteLeave = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/leaves/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaves'] }),
  })
}
