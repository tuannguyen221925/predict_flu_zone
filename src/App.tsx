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
          const response = await fetch(`http://localhost:8000/get-history/${selectedZone}`);
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

  const handlePrediction = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/predict-realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone_name: selectedZone }),
      });
      
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Lỗi kết nối API. Vui lòng kiểm tra backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
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
          }}
        >
          {loading ? 'Đang dự báo...' : 'Dự báo ngay'}
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '14px', color: '#166534', marginBottom: '8px' }}>Dự báo ca bệnh</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534' }}>
              {result.predicted_cases?.toFixed(0) || 'N/A'}
            </div>
          </div>

          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '14px', color: '#b45309', marginBottom: '8px' }}>Nhiệt độ trung bình</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#b45309' }}>
              {result.avg_temp_med?.toFixed(1) || 'N/A'}°C
            </div>
          </div>

          <div style={{ background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '14px', color: '#1e40af', marginBottom: '8px' }}>Độ ẩm</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e40af' }}>
              {result.avg_humid?.toFixed(0) || 'N/A'}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        ...formData,
        avg_temp_max: parseFloat(formData.avg_temp_max),
        avg_temp_med: parseFloat(formData.avg_temp_med),
        sum_precip_tot: parseFloat(formData.sum_precip_tot),
        avg_humid: parseFloat(formData.avg_humid),
        dengue_trends: parseFloat(formData.dengue_trends),
        symptoms_trends: parseFloat(formData.symptoms_trends),
        lag1: parseFloat(formData.lag1),
        lag2: parseFloat(formData.lag2),
        lag3: parseFloat(formData.lag3),
        ma4: parseFloat(formData.ma4),
      };

      const response = await fetch('http://localhost:8000/predict-zone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Lỗi gửi dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {Object.keys(formData).map(key => (
            <div key={key}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                {key.replace(/_/g, ' ')}
              </label>
              <input
                type="number"
                name={key}
                value={formData[key as keyof typeof formData]}
                onChange={handleChange}
                step="any"
                disabled={key === 'zone_name'}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#9ca3af' : '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Đang gửi...' : 'Gửi dự báo'}
        </button>
      </form>

      {error && <div style={{ color: 'red', marginTop: '20px' }}>{error}</div>}
      {result && (
        <div style={{ marginTop: '20px', padding: '16px', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '8px' }}>
          <div>Kết quả: <strong>{result.predicted_cases?.toFixed(2)} ca bệnh dự báo</strong></div>
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
        const response = await fetch(`http://localhost:8000/get-history/${selectedZone}`);
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
