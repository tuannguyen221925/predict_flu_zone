import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';

export const useDashboardStats = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.getDashboardStats(),
    enabled: enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
    onSuccess: (data) => {
      console.log('[v0] Dashboard stats fetched:', data.total_predictions, 'total predictions');
    },
    onError: (error: Error) => {
      console.error('[v0] Dashboard stats error:', error.message);
    },
  });
};
