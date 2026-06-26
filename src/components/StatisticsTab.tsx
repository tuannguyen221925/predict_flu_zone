import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { useHistory } from '../queries/useHistory';
import { format, parseISO } from 'date-fns';
import { viVN } from 'date-fns/locale';

export const StatisticsTab: React.FC = () => {
  const { selectedZone } = useStore();
  const { data: historyData, isLoading, error } = useHistory(selectedZone, true);

  const processedData = historyData?.history
    ? [...historyData.history]
        .sort((a, b) => {
          const aDate = new Date(a.timestamp);
          const bDate = new Date(b.timestamp);
          return aDate.getTime() - bDate.getTime();
        })
        .map((item) => ({
          ...item,
          formattedDate: format(
            typeof item.timestamp === 'string' ? parseISO(item.timestamp) : new Date(item.timestamp),
            'dd/MM',
            { locale: viVN }
          ),
          cases: item.predicted_cases,
        }))
    : [];

  const stats = {
    totalPredictions: processedData.length,
    avgCases: processedData.length > 0
      ? Math.round(processedData.reduce((sum, item) => sum + item.cases, 0) / processedData.length)
      : 0,
    maxCases: processedData.length > 0
      ? Math.max(...processedData.map((item) => item.cases))
      : 0,
    minCases: processedData.length > 0
      ? Math.min(...processedData.map((item) => item.cases))
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Thống kê & Lịch sử</h2>
        <p className="text-text-secondary">
          Xem lịch sử dự báo và xu hướng cho khu vực <strong>{selectedZone}</strong>
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card text-center py-12">
          <div className="animate-spin inline-block mb-4">⏳</div>
          <p className="text-text-secondary">Đang tải dữ liệu...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex gap-4">
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-danger mb-1">Lỗi tải dữ liệu</h3>
              <p className="text-sm text-red-700">
                {error instanceof Error ? error.message : 'Không thể tải lịch sử dự báo'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-text-secondary text-sm mb-1">Tổng dự báo</p>
              <p className="text-3xl font-bold text-primary">{stats.totalPredictions}</p>
            </div>
            <div className="card">
              <p className="text-text-secondary text-sm mb-1">Trung bình ca</p>
              <p className="text-3xl font-bold text-secondary">{stats.avgCases}</p>
            </div>
            <div className="card">
              <p className="text-text-secondary text-sm mb-1">Ca cao nhất</p>
              <p className="text-3xl font-bold text-warning">{stats.maxCases}</p>
            </div>
            <div className="card">
              <p className="text-text-secondary text-sm mb-1">Ca thấp nhất</p>
              <p className="text-3xl font-bold text-success">{stats.minCases}</p>
            </div>
          </div>

          {/* Charts */}
          {processedData.length > 0 ? (
            <>
              {/* Line Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Xu hướng số ca dự báo
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={processedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedDate" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [value, 'Số ca']}
                      labelFormatter={(label) => `Ngày: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cases"
                      stroke="#1e40af"
                      dot={{ fill: '#1e40af', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Số ca dự báo"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  So sánh số ca theo ngày
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={processedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedDate" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [value, 'Số ca']}
                      labelFormatter={(label) => `Ngày: ${label}`}
                    />
                    <Legend />
                    <Bar
                      dataKey="cases"
                      fill="#0891b2"
                      name="Số ca dự báo"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* History Table */}
              <div className="card">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Lịch sử 20 dự báo gần nhất</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-text-primary">Thời gian</th>
                        <th className="text-left py-3 px-4 font-semibold text-text-primary">Số ca</th>
                        <th className="text-left py-3 px-4 font-semibold text-text-primary">Nhiệt độ</th>
                        <th className="text-left py-3 px-4 font-semibold text-text-primary">Độ ẩm</th>
                        <th className="text-left py-3 px-4 font-semibold text-text-primary">Mưa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedData.slice(-20).reverse().map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="py-3 px-4">
                            {format(
                              typeof item.timestamp === 'string' ? parseISO(item.timestamp) : new Date(item.timestamp),
                              'HH:mm dd/MM/yyyy',
                              { locale: viVN }
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-bold ${
                              item.cases < 50 ? 'text-success' :
                              item.cases < 100 ? 'text-warning' :
                              'text-danger'
                            }`}>
                              {item.cases}
                            </span>
                          </td>
                          <td className="py-3 px-4">{item.weather_input?.avg_temp_med?.toFixed(1)}°C</td>
                          <td className="py-3 px-4">{item.weather_input?.avg_humid?.toFixed(0)}%</td>
                          <td className="py-3 px-4">{item.weather_input?.sum_precip_tot?.toFixed(1)}mm</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card text-center py-12 bg-blue-50 border-blue-200">
              <AlertCircle className="w-12 h-12 text-blue-300 mx-auto mb-4" />
              <p className="text-text-secondary mb-2">Chưa có dữ liệu lịch sử</p>
              <p className="text-sm text-text-secondary">
                Hãy thực hiện một dự báo ở các tab khác để bắt đầu
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
