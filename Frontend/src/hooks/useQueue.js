import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

export const useQueue = (date) => {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['queue', date],
    queryFn: () => {
      const target = date || new Date().toISOString().split('T')[0]
      return api.get(`/queue/?date=${target}`)
    },
  })

  useEffect(() => {
    const channel = supabase
      .channel('queue-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'op_records' }, () => {
        queryClient.invalidateQueries({ queryKey: ['queue'] })
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [queryClient])

  return query
}

export const useUpdateQueueStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ opId, status }) => api.patch('/queue/status', { op_id: opId, status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['queue'] }),
  })
}
