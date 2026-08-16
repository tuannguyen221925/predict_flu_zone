import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient, PredictionResponse } from '../utils/apiClient';

export const usePredictRealtime = () => {
  return useMutation({
    mutationFn: (zoneName: string) => apiClient.predictRealtime(zoneName),
    onSuccess: (data) => {
      console.log('[v0] Realtime prediction successful:', data);
    },
    onError: (error: Error) => {
      console.error('[v0] Realtime prediction error:', error.message);
    },
  });
};

export interface ManualPredictionData {
  zone_name: string;
  avg_temp_max: number;
  avg_temp_med: number;
  sum_precip_tot: number;
  avg_humid: number;
  dengue_trends: number;
  symptoms_trends: number;
  lag1: number;
  lag2: number;
  lag3: number;
  ma4: number;
}

export const usePredictZone = () => {
  return useMutation({
    mutationFn: (data: ManualPredictionData) => apiClient.predictZone(data),
    onSuccess: (data) => {
      console.log('[v0] Zone prediction successful:', data);
    },
    onError: (error: Error) => {
      console.error('[v0] Zone prediction error:', error.message);
    },
  });
};
