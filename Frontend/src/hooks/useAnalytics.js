import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics/'),
  })
}
