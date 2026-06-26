import React from 'react';
import { Cloud, Droplets, Wind, AlertCircle } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { usePredictRealtime } from '../queries/usePredictions';
import { format } from 'date-fns';
import { viVN } from 'date-fns/locale';

export const RealtimeTab: React.FC = () => {
  const { selectedZone } = useStore();
  const { mutate: predictRealtime, isPending, data, error, isSuccess } = usePredictRealtime();

  const handlePredictNow = () => {
    predictRealtime(selectedZone);
  };

  const getRiskLevel = (cases: number) => {
    if (cases < 50) return { level: 'Thấp', color: 'success', bg: 'bg-green-50' };
    if (cases < 100) return { level: 'Trung bình', color: 'warning', bg: 'bg-yellow-50' };
    return { level: 'Cao', color: 'danger', bg: 'bg-red-50' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Dự báo Real-time</h2>
        <p className="text-text-secondary">
          Nhấn nút bên dưới để thực hiện dự báo tự động cho khu vực <strong>{selectedZone}</strong>
        </p>
      </div>

      {/* Prediction Button */}
      <div className="card flex flex-col items-center justify-center py-12">
        <button
          onClick={handlePredictNow}
          disabled={isPending}
          className={`px-8 py-4 rounded-lg font-semibold text-white text-lg transition-all duration-200 ${
            isPending
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary hover:bg-blue-700 shadow-lg hover:shadow-xl active:scale-95'
          }`}
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin">⏳</div>
              Đang dự báo...
            </span>
          ) : (
            'Dự báo ngay'
          )}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-danger flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-danger mb-1">Lỗi dự báo</h3>
              <p className="text-sm text-red-700">
                {error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {isSuccess && data && (
        <div className="space-y-4">
          {/* Main Prediction Card */}
          {data.prediction && (
            <div className={`card-lg ${getRiskLevel(data.prediction.predicted_cases).bg}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-text-secondary text-sm mb-1">Số ca dự báo</p>
                  <h3 className="text-5xl font-bold text-primary">
                    {data.prediction.predicted_cases}
                  </h3>
                </div>
                <div className={`px-4 py-2 rounded-lg font-semibold badge-${getRiskLevel(data.prediction.predicted_cases).color}`}>
                  {getRiskLevel(data.prediction.predicted_cases).level}
                </div>
              </div>
              <p className="text-text-secondary">
                Khu vực: <strong>{data.zone}</strong>
              </p>
            </div>
          )}

          {/* Weather Data */}
          {data.weather_data && (
            <div className="grid grid-cols-3 gap-4">
              <div className="card">
                <div className="flex items-center gap-3 mb-2">
                  <Cloud className="w-5 h-5 text-secondary" />
                  <span className="text-text-secondary text-sm">Nhiệt độ</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {Math.round(data.weather_data.temperature)}°C
                </p>
              </div>
              <div className="card">
                <div className="flex items-center gap-3 mb-2">
                  <Droplets className="w-5 h-5 text-secondary" />
                  <span className="text-text-secondary text-sm">Độ ẩm</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {data.weather_data.humidity}%
                </p>
              </div>
              <div className="card">
                <div className="flex items-center gap-3 mb-2">
                  <Wind className="w-5 h-5 text-secondary" />
                  <span className="text-text-secondary text-sm">Gió</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {Math.round(data.weather_data.wind_speed)} m/s
                </p>
              </div>
            </div>
          )}

          {/* Lags Info */}
          {data.lags_used && (
            <div className="card bg-blue-50">
              <h4 className="font-semibold text-text-primary mb-3">Dữ liệu lịch sử sử dụng</h4>
              <div className="grid grid-cols-4 gap-3">
                {['lag1', 'lag2', 'lag3', 'ma4'].map((key) => (
                  <div key={key}>
                    <p className="text-xs text-text-secondary uppercase mb-1">{key}</p>
                    <p className="text-lg font-bold text-primary">
                      {Math.round(data.lags_used![key as keyof typeof data.lags_used])}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs text-text-secondary text-center">
            Dự báo lúc: {format(new Date(), 'HH:mm:ss dd/MM/yyyy', { locale: viVN })}
          </div>
        </div>
      )}

      {/* Initial State */}
      {!data && !error && (
        <div className="card text-center py-12 bg-blue-50 border-blue-200">
          <Cloud className="w-16 h-16 text-blue-300 mx-auto mb-4" />
          <p className="text-text-secondary mb-2">Chưa có dự báo</p>
          <p className="text-sm text-text-secondary">
            Nhấn "Dự báo ngay" để tạo một dự báo mới
          </p>
        </div>
      )}
    </div>
  );
};
