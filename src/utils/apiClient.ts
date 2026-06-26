const API_BASE_URL = 'http://localhost:8000';

export interface PredictionResponse {
  status: string;
  message: string;
  zone?: string;
  weather_data?: Record<string, any>;
  lags_used?: Record<string, number>;
  prediction?: {
    zone: string;
    predicted_cases: number;
  };
  data?: {
    zone: string;
    predicted_cases: number;
  };
}

export interface HistoryResponse {
  zone: string;
  total_records: number;
  history: Array<{
    _id: string;
    zone_name: string;
    timestamp: string | Date;
    weather_input: Record<string, number>;
    trends_input: Record<string, number>;
    historical_lag: Record<string, number>;
    predicted_cases: number;
    model_used: string;
  }>;
}

export interface DashboardStatsResponse {
  total_predictions: number;
  total_zones: number;
  zones: string[];
  latest_predictions: Array<{
    _id: string;
    zone_name: string;
    timestamp: string;
    predicted_cases: number;
  }>;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export const apiClient = {
  async predictRealtime(zoneName: string): Promise<PredictionResponse> {
    console.log('[v0] Calling /predict-realtime for zone:', zoneName);
    const response = await fetch(`${API_BASE_URL}/predict-realtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone_name: zoneName }),
    });
    return handleResponse(response);
  },

  async predictZone(data: {
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
  }): Promise<PredictionResponse> {
    console.log('[v0] Calling /predict-zone with data:', data);
    const response = await fetch(`${API_BASE_URL}/predict-zone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getHistory(zoneName: string): Promise<HistoryResponse> {
    console.log('[v0] Fetching history for zone:', zoneName);
    const response = await fetch(`${API_BASE_URL}/get-history/${zoneName}`);
    return handleResponse(response);
  },

  async getDashboardStats(): Promise<DashboardStatsResponse> {
    console.log('[v0] Fetching dashboard stats');
    const response = await fetch(`${API_BASE_URL}/dashboard-stats`);
    return handleResponse(response);
  },
};
