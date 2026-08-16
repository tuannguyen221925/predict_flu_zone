import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';

export const useHistory = (zoneName: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['history', zoneName],
    queryFn: () => apiClient.getHistory(zoneName),
    enabled: enabled && !!zoneName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    onSuccess: (data) => {
      console.log('[v0] History fetched successfully:', data.total_records, 'records');
    },
    onError: (error: Error) => {
      console.error('[v0] History fetch error:', error.message);
    },
  });
};
