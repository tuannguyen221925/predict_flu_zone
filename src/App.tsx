import React, { useState, useMemo, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useStore } from './stores/useStore';
import { format, parseISO } from 'date-fns';
import { viVN } from 'date-fns/locale';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

const zones = [
  'Hanoi', 'Haiphong', 'ThaiBinh',
  'DaNang', 'Hue', 'NhaTrang', 'BinhDinh',
  'HCM', 'CanTho', 'BinhDuong', 'DongNai', 'VungTau', 'TienGiang'
];

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

// Mock data generator for demo
const generateMockHistoryData = () => {
  const data = [];
  for (let i = 0; i < 20; i++) {
    data.push({
      week: `W${20 - i}`,
      cases: Math.floor(Math.random() * 150) + 30,
      temp: Math.floor(Math.random() * 10) + 25,
      humidity: Math.floor(Math.random() * 30) + 60,
      trend: Math.random() > 0.5 ? 'up' : 'down',
    });
  }
  return data.reverse();
};

const DashboardStats = () => {
  const selectedZone = useStore(s => s.selectedZone);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Try to fetch real data, fallback to mock data
        try {
          // FIX 1: Đổi port 3000 thành 8000
          const response = await fetch(`http://127.0.0.1:8000/get-history/${selectedZone}`);
          if (response.ok) {
            const data = await response.json();
            setHistory(Array.isArray(data) ? data : data.predictions || generateMockHistoryData());
          } else {
            setHistory(generateMockHistoryData());
          }
        } catch {
          setHistory(generateMockHistoryData());
        }

        // Calculate stats
        if (history.length > 0) {
          const avgCases = history.reduce((a, b) => a + (b.predicted_cases || b.cases || 0), 0) / history.length;
          const maxCases = Math.max(...history.map(h => h.predicted_cases || h.cases || 0));
          const minCases = Math.min(...history.map(h => h.predicted_cases || h.cases || 0));
          setStats({
            avgCases: avgCases.toFixed(1),
            maxCases: maxCases.toFixed(0),
            minCases: minCases.toFixed(0),
            totalRecords: history.length,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedZone, history.length]);

  const chartData = useMemo(() => {
    return history.slice(-20).map((item, idx) => ({
      name: `T${idx + 1}`,
      cases: item.predicted_cases || item.cases || 0,
      temp: item.avg_temp_med || item.temp || 0,
      humidity: item.avg_humid || item.humidity || 0,
    }));
  }, [history]);

  const riskDistribution = useMemo(() => {
    if (history.length === 0) return [];
    const low = history.filter(h => (h.predicted_cases || h.cases || 0) < 50).length;
    const medium = history.filter(h => {
      const cases = h.predicted_cases || h.cases || 0;
      return cases >= 50 && cases <= 100;
    }).length;
    const high = history.filter(h => (h.predicted_cases || h.cases || 0) > 100).length;
    
    return [
      { name: 'Thấp (<50)', value: low, color: '#10b981' },
      { name: 'Trung bình (50-100)', value: medium, color: '#f59e0b' },
      { name: 'Cao (>100)', value: high, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [history]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Đang tải dữ liệu...</div>;

  return (
    <div style={{ padding: '20px' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '30px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '8px', padding: '20px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Trung bình ca bệnh</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats?.avgCases || 'N/A'}</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>Tuần này</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '8px', padding: '20px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Cao nhất</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats?.maxCases || 'N/A'}</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>Đỉnh ghi nhận</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: '8px', padding: '20px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Thấp nhất</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats?.minCases || 'N/A'}</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>Thấp nhất ghi nhận</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', borderRadius: '8px', padding: '20px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Tổng bản ghi</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats?.totalRecords || 'N/A'}</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>Dữ liệu sẵn có</div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {/* Line Chart */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#1f2937' }}>Xu hướng ca bệnh theo thời gian</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              />
              <Legend />
              <Line type="monotone" dataKey="cases" stroke="#1e40af" strokeWidth={2} dot={{ fill: '#1e40af', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Area Chart */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#1f2937' }}>Độ ẩm & Nhiệt độ</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              />
              <Legend />
              <Area type="monotone" dataKey="humidity" stackId="1" stroke="#f59e0b" fill="#fef3c7" />
              <Area type="monotone" dataKey="temp" stackId="1" stroke="#3b82f6" fill="#dbeafe" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Bar Chart */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#1f2937' }}>So sánh theo kỳ</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.slice(-10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              />
              <Bar dataKey="cases" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#1f2937' }}>Phân bố mức độ rủi ro</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {riskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div style={{ marginTop: '30px', background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#1f2937' }}>Dữ liệu chi tiết</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: '#374151', fontWeight: '600' }}>STT</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#374151', fontWeight: '600' }}>Ca bệnh</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#374151', fontWeight: '600' }}>Nhiệt độ</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#374151', fontWeight: '600' }}>Độ ẩm</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#374151', fontWeight: '600' }}>Mức độ</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(-15).map((item, idx) => {
                const cases = item.predicted_cases || item.cases || 0;
                const riskLevel = cases < 50 ? 'Thấp' : cases <= 100 ? 'Trung bình' : 'Cao';
                const riskColor = cases < 50 ? '#10b981' : cases <= 100 ? '#f59e0b' : '#ef4444';
                
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', hover: { background: '#f9fafb' } }}>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{15 - idx}</td>
                    <td style={{ padding: '12px', color: '#1f2937', fontWeight: '500' }}>{cases.toFixed(0)}</td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{(item.avg_temp_med || item.temp || 0).toFixed(1)}°C</td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{(item.avg_humid || item.humidity || 0).toFixed(0)}%</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: 'white',
                        background: riskColor,
                      }}>
                        {riskLevel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const RealtimeTab = () => {
  const selectedZone = useStore(s => s.selectedZone);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [dengueTrends, setDengueTrends] = useState('50');
  const [symptomsTrends, setSymptomsTrends] = useState('20');
  const [weather, setWeather] = useState<any>(null);
  const [weatherError, setWeatherError] = useState('');

  const ZONE_COORDINATES: { [key: string]: { lat: number; lon: number } } = {
    'Hanoi': { lat: 21.0285, lon: 105.8542 },
    'Haiphong': { lat: 20.8449, lon: 106.6881 },
    'ThaiBinh': { lat: 20.4474, lon: 106.3387 },
    'DaNang': { lat: 16.0544, lon: 108.2022 },
    'Hue': { lat: 16.4637, lon: 107.5909 },
    'NhaTrang': { lat: 12.2388, lon: 109.1967 },
    'BinhDinh': { lat: 13.7627, lon: 109.2223 },
    'HCM': { lat: 10.8231, lon: 106.6297 },
    'CanTho': { lat: 10.0452, lon: 105.7469 },
    'BinhDuong': { lat: 11.0283, lon: 106.6713 },
    'DongNai': { lat: 10.9468, lon: 106.8521 },
    'VungTau': { lat: 10.3460, lon: 107.0843 },
    'TienGiang': { lat: 10.3592, lon: 106.3570 }
  };

  // Fetch real-time weather when zone changes
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const coords = ZONE_COORDINATES[selectedZone];
        if (!coords) return;
        
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=862e70d3da664d7d00121f16524c1e66&units=metric`
        );
        if (response.ok) {
          const data = await response.json();
          setWeather({
            temp: data.main.temp,
            humidity: data.main.humidity,
            description: data.weather[0].main,
          });
        }
      } catch (err) {
        setWeatherError('Không thể lấy dữ liệu thời tiết');
      }
    };

    fetchWeather();
  }, [selectedZone]);

  const handlePrediction = async () => {
    setLoading(true);
    setError('');
    try {
      // FIX 2: Đổi port 3000 thành 8000
      const response = await fetch('http://127.0.0.1:8000/predict-realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_name: selectedZone,
          // FIX 3: Thêm điều kiện dự phòng || 50 và || 20
          dengue_trends: parseFloat(dengueTrends) || 50,
          symptoms_trends: parseFloat(symptomsTrends) || 20,
        }),
      });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(`Lỗi kết nối API: ${err instanceof Error ? err.message : 'Unknown error'}. Vui lòng kiểm tra backend.`);
    } finally {
      setLoading(false);
    }
  };

  // Generate 4-week forecast mock data
  const generateWeeklyForecast = () => {
    if (!result) return [];
    const baseCases = result.predicted_cases || 50;
    const forecast = [];
    for (let i = 1; i <= 4; i++) {
      // Simulate variations based on trend
      const variation = (dengueTrends / 50) * (Math.random() * 20 - 10);
      forecast.push({
        week: i,
        cases: Math.max(5, baseCases + variation * i),
        icon: baseCases + variation * i > 100 ? '⚠️' : '📈',
      });
    }
    return forecast;
  };

  const weeklyForecast = generateWeeklyForecast();

  return (
    <div style={{ padding: '20px', position: 'relative' }}>
      {/* Real-time Weather Widget - Top Right Corner */}
      {weather && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '8px',
          padding: '16px',
          minWidth: '180px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>Thời tiết hiện tại</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ fontSize: '28px' }}>🌡️</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{weather.temp.toFixed(1)}°C</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '24px' }}>💧</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{weather.humidity}%</div>
          </div>
          <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.9 }}>
            {weather.description}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '24px', padding: '12px', background: '#eff6ff', borderLeft: '4px solid #3b82f6', borderRadius: '4px' }}>
        <p style={{ margin: 0, color: '#1e40af', fontSize: '14px', fontWeight: '500' }}>
          📊 Nhập xu hướng hiện tại để dự báo số ca sốt xuất huyết cho 4 tuần tới trong khu vực {selectedZone}.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#1f2937' }}>
            📈 Xu hướng sốt xuất huyết (0-100)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={dengueTrends}
            onChange={(e) => setDengueTrends(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
            placeholder="VD: 50"
          />
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
            Chỉ số xu hướng ca bệnh (0-100)
          </p>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#1f2937' }}>
            🔍 Xu hướng triệu chứng (0-100)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={symptomsTrends}
            onChange={(e) => setSymptomsTrends(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
            placeholder="VD: 20"
          />
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
            Chỉ số xu hướng triệu chứng (0-100)
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={handlePrediction}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#9ca3af' : '#1e40af',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 200ms',
          }}
        >
          {loading ? '⏳ Đang dự báo...' : '🚀 Dự báo ngay'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', marginBottom: '16px', fontSize: '14px' }}>
          ❌ {error}
        </div>
      )}

      {result && (
<<<<<<< HEAD
        <div>
          {/* Current Week Prediction */}
          <div style={{ marginBottom: '30px', background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1f2937' }}>📋 Dự báo tuần này</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '8px', padding: '20px', color: 'white' }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>🦟 Ca bệnh dự báo</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
                  {result.predicted_cases?.toFixed(0) || 'N/A'}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Số ca sốt xuất huyết</div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderRadius: '8px', padding: '20px', color: 'white' }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>🌡️ Nhiệt độ</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
                  {result.avg_temp_med?.toFixed(1) || 'N/A'}°C
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Trung bình</div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', borderRadius: '8px', padding: '20px', color: 'white' }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>💧 Độ ẩm</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
                  {result.avg_humid?.toFixed(0) || 'N/A'}%
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Không khí</div>
              </div>
            </div>
          </div>

          {/* 4-Week Forecast */}
          <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1f2937' }}>📅 Dự báo 4 tuần tới</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              {weeklyForecast.map((week) => (
                <div key={week.week} style={{
                  background: week.cases > 100 ? '#fee2e2' : '#f0fdf4',
                  border: `2px solid ${week.cases > 100 ? '#fecaca' : '#dcfce7'}`,
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{week.icon}</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '4px' }}>
                    Tuần {week.week}
                  </div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: week.cases > 100 ? '#dc2626' : '#16a34a',
                  }}>
                    {week.cases.toFixed(0)} ca
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    {week.cases > 100 ? 'Cao' : week.cases > 70 ? 'Trung bình' : 'Thấp'}
                  </div>
                </div>
              ))}
=======
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '14px', color: '#166534', marginBottom: '8px' }}>Dự báo ca bệnh</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534' }}>
              {result.predicted_cases?.toFixed(0) || result.data?.predicted_cases?.toFixed(0) || 'N/A'}
            </div>
          </div>

          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '14px', color: '#b45309', marginBottom: '8px' }}>Nhiệt độ trung bình</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#b45309' }}>
              {result.weather_data?.temperature?.toFixed(1) || result.avg_temp_med?.toFixed(1) || 'N/A'}°C
            </div>
          </div>

          <div style={{ background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '14px', color: '#1e40af', marginBottom: '8px' }}>Độ ẩm</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e40af' }}>
              {result.weather_data?.humidity?.toFixed(0) || result.avg_humid?.toFixed(0) || 'N/A'}%
>>>>>>> dev
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const fieldLabels = {
  zone_name: { label: 'Tên vùng/Tỉnh thành', hint: 'Khu vực dự báo (tự động chọn)' },
  avg_temp_max: { label: 'Nhiệt độ cao nhất (°C)', hint: 'VD: 35.5 - Nhiệt độ cao nhất trong kỳ' },
  avg_temp_med: { label: 'Nhiệt độ trung bình (°C)', hint: 'VD: 28.3 - Nhiệt độ trung bình toàn kỳ' },
  sum_precip_tot: { label: 'Tổng lượng mưa (mm)', hint: 'VD: 120.5 - Tổng lượng mưa trong kỳ' },
  avg_humid: { label: 'Độ ẩm trung bình (%)', hint: 'VD: 75 - Độ ẩm không khí (0-100)' },
  dengue_trends: { label: 'Xu hướng sốt xuất huyết', hint: 'VD: 50 - Chỉ số tăng giảm ca bệnh (0-100)' },
  symptoms_trends: { label: 'Xu hướng triệu chứng', hint: 'VD: 20 - Chỉ số xu hướng triệu chứng (0-100)' },
  lag1: { label: 'Lag 1 (tuần trước)', hint: 'VD: 45 - Số ca bệnh tuần trước' },
  lag2: { label: 'Lag 2 (2 tuần trước)', hint: 'VD: 52 - Số ca bệnh cách 2 tuần' },
  lag3: { label: 'Lag 3 (3 tuần trước)', hint: 'VD: 48 - Số ca bệnh cách 3 tuần' },
  ma4: { label: 'MA 4 (trung bình 4 tuần)', hint: 'VD: 48.5 - Trung bình động 4 tuần' },
};

const ManualInputTab = () => {
  const selectedZone = useStore(s => s.selectedZone);
  const [formData, setFormData] = useState({
    zone_name: selectedZone,
    avg_temp_max: '',
    avg_temp_med: '',
    sum_precip_tot: '',
    avg_humid: '',
    dengue_trends: '',
    symptoms_trends: '',
    lag1: '',
    lag2: '',
    lag3: '',
    ma4: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [tooltip, setTooltip] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // FIX 4: Thêm fallback || 0 để tránh truyền NaN gây lỗi Server
      const payload = {
        ...formData,
        avg_temp_max: parseFloat(formData.avg_temp_max) || 0,
        avg_temp_med: parseFloat(formData.avg_temp_med) || 0,
        sum_precip_tot: parseFloat(formData.sum_precip_tot) || 0,
        avg_humid: parseFloat(formData.avg_humid) || 0,
        dengue_trends: parseFloat(formData.dengue_trends) || 50,
        symptoms_trends: parseFloat(formData.symptoms_trends) || 20,
        lag1: parseFloat(formData.lag1) || 0,
        lag2: parseFloat(formData.lag2) || 0,
        lag3: parseFloat(formData.lag3) || 0,
        ma4: parseFloat(formData.ma4) || 0,
      };

      // FIX 5: Đổi port 3000 thành 8000
      const response = await fetch('http://127.0.0.1:8000/predict-zone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      setResult(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Lỗi gửi dữ liệu: ${errorMsg}. Kiểm tra backend có đang chạy không.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px', padding: '12px', background: '#eff6ff', borderLeft: '4px solid #3b82f6', borderRadius: '4px' }}>
        <p style={{ margin: 0, color: '#1e40af', fontSize: '14px', fontWeight: '500' }}>
          Gợi ý: Nhập các giá trị dữ liệu thực tế để dự báo số ca sốt xuất huyết. Nếu không biết giá trị chính xác, bạn có thể dùng giá trị trung bình lịch sử.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {Object.entries(formData).map(([key, value]) => {
            const fieldInfo = fieldLabels[key as keyof typeof fieldLabels];
            const isReadonly = key === 'zone_name';
            
            return (
              <div key={key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontWeight: '500', fontSize: '13px', color: '#1f2937' }}>
                    {fieldInfo.label}
                  </label>
                  <div 
                    style={{
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#dbeafe',
                      color: '#1e40af',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={() => setTooltip(key)}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    ?
                    {tooltip === key && (
                      <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '8px',
                        padding: '8px 12px',
                        background: '#374151',
                        color: 'white',
                        fontSize: '12px',
                        borderRadius: '6px',
                        whiteSpace: 'nowrap',
                        zIndex: 1000,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}>
                        {fieldInfo.hint}
                      </div>
                    )}
                  </div>
                </div>
                <input
                  type={isReadonly ? 'text' : 'number'}
                  name={key}
                  value={value}
                  onChange={handleChange}
                  step="any"
                  disabled={isReadonly}
                  placeholder={fieldInfo.hint.split('-')[0].trim()}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: isReadonly ? '#f3f4f6' : '#ffffff',
                    color: isReadonly ? '#9ca3af' : '#1f2937',
                    cursor: isReadonly ? 'not-allowed' : 'auto',
                    transition: 'border-color 200ms',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                  {fieldInfo.hint}
                </p>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: loading ? '#9ca3af' : '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 200ms',
            }}
          >
            {loading ? 'Đang dự báo...' : 'Dự báo ngay'}
          </button>
          <button
            type="reset"
            onClick={() => {
              setFormData(prev => ({ ...prev, zone_name: selectedZone }));
              setResult(null);
              setError('');
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 200ms',
            }}
          >
            Xóa dữ liệu
          </button>
        </div>
      </form>

      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      
      {result && (
        <div style={{ padding: '16px', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '6px' }}>
          <div style={{ color: '#166534', fontSize: '14px' }}>
            <strong>Kết quả dự báo:</strong> {result.data?.predicted_cases?.toFixed(1) || result.predicted_cases?.toFixed(1) || 'N/A'} ca bệnh dự kiến
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#4b5563' }}>
            Dự báo cho khu vực {selectedZone} dựa trên dữ liệu bạn cung cấp
          </div>
        </div>
      )}
    </div>
  );
};

const StatisticsTab = () => {
  const selectedZone = useStore(s => s.selectedZone);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        // FIX 6: Đổi port 3000 thành 8000
        const response = await fetch(`http://127.0.0.1:8000/get-history/${selectedZone}`);
        if (!response.ok) throw new Error('API error');
        const data = await response.json();
        setHistory(Array.isArray(data) ? data : data.predictions || []);
      } catch (err) {
        setError('Không thể tải lịch sử');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedZone]);

  const chartData = useMemo(() => {
    return history.slice(0, 20).map((item, idx) => ({
      name: `T${idx + 1}`,
      cases: item.predicted_cases || 0,
      temp: item.avg_temp_med || 0,
    }));
  }, [history]);

  if (loading) return <div style={{ padding: '20px' }}>Đang tải...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h3>Biểu đồ ca bệnh dự báo</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="cases" stroke="#1e40af" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Bảng dữ liệu lịch sử</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>STT</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Ca dự báo</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Nhiệt độ</th>
            </tr>
          </thead>
          <tbody>
            {history.slice(0, 10).map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px' }}>{idx + 1}</td>
                <td style={{ padding: '8px' }}>{item.predicted_cases?.toFixed(0) || 'N/A'}</td>
                <td style={{ padding: '8px' }}>{item.avg_temp_med?.toFixed(1) || 'N/A'}°C</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const selectedZone = useStore(s => s.selectedZone);
  const setSelectedZone = useStore(s => s.setSelectedZone);

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: '250px',
      height: '100vh',
      background: '#0f172a',
      color: 'white',
      padding: '20px',
      overflowY: 'auto',
      zIndex: 1000,
      display: isOpen ? 'block' : 'none',
    }}>
      <h2 style={{ marginBottom: '20px', marginTop: 0 }}>Chọn tỉnh thành</h2>
      {zones.map(zone => (
        <button
          key={zone}
          onClick={() => {
            setSelectedZone(zone);
            onClose();
          }}
          style={{
            display: 'block',
            width: '100%',
            padding: '12px',
            marginBottom: '8px',
            background: selectedZone === zone ? '#1e40af' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background 200ms',
          }}
        >
          {zone}
        </button>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const selectedZone = useStore(s => s.selectedZone);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'statistics' | 'realtime' | 'manual'>('statistics');

  const tabs = [
    { id: 'statistics' as const, label: 'Thống kê & Phân tích', icon: '📊' },
    { id: 'realtime' as const, label: 'Dự báo Real-time', icon: '⚡' },
    { id: 'manual' as const, label: 'Dự báo Thủ công', icon: '📝' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
          >
            ☰
          </button>
          <h1 style={{ flex: 1, margin: '0 20px', fontSize: '24px', fontWeight: 'bold' }}>Hệ thống Dự báo Sốt xuất huyết</h1>
          <div style={{ fontSize: '14px', color: '#64748b' }}>{selectedZone}</div>
        </header>

        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: 'white', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '16px 20px',
                background: activeTab === tab.id ? '#f0f9ff' : 'transparent',
                color: activeTab === tab.id ? '#1e40af' : '#64748b',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #1e40af' : 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: activeTab === tab.id ? '500' : '400',
              }}
            >
              <span style={{ marginRight: '8px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'statistics' && <DashboardStats />}
          {activeTab === 'realtime' && <RealtimeTab />}
          {activeTab === 'manual' && <ManualInputTab />}
        </div>
      </main>
    </div>
  );
};

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <Dashboard />
  </QueryClientProvider>
);