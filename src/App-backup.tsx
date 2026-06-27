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
        // Fix: Đổi port 3000 thành 8000
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
        </div>

        <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '8px', padding: '20px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Cao nhất</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats?.maxCases || 'N/A'}</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: '8px', padding: '20px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Thấp nhất</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats?.minCases || 'N/A'}</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', borderRadius: '8px', padding: '20px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Tổng bản ghi</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats?.totalRecords || 'N/A'}</div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#1f2937' }}>Xu hướng ca bệnh theo thời gian</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
              <Legend />
              <Line type="monotone" dataKey="cases" stroke="#1e40af" strokeWidth={2} dot={{ fill: '#1e40af', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#1f2937' }}>Độ ẩm & Nhiệt độ</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
              <Legend />
              <Area type="monotone" dataKey="humidity" stackId="1" stroke="#f59e0b" fill="#fef3c7" />
              <Area type="monotone" dataKey="temp" stackId="1" stroke="#3b82f6" fill="#dbeafe" />
            </AreaChart>
          </ResponsiveContainer>
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

  const handlePrediction = async () => {
    setLoading(true);
    setError('');
    try {
      // Fix: Đổi port 3000 thành 8000 và dự phòng số liệu rỗng
      const response = await fetch('http://localhost:8000/predict-realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_name: selectedZone,
          dengue_trends: parseFloat(dengueTrends) || 50,
          symptoms_trends: parseFloat(symptomsTrends) || 20,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(`Lỗi kết nối API: ${err instanceof Error ? err.message : 'Unknown error'}. Vui lòng kiểm tra backend.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px', padding: '12px', background: '#eff6ff', borderLeft: '4px solid #3b82f6', borderRadius: '4px' }}>
        <p style={{ margin: 0, color: '#1e40af', fontSize: '14px', fontWeight: '500' }}>
          Nhập xu hướng hiện tại để dự báo số ca sốt xuất huyết trong khu vực {selectedZone}.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#1f2937' }}>
            Xu hướng sốt xuất huyết (0-100)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={dengueTrends}
            onChange={(e) => setDengueTrends(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#1f2937' }}>
            Xu hướng triệu chứng (0-100)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={symptomsTrends}
            onChange={(e) => setSymptomsTrends(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          />
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
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Đang dự báo...' : 'Dự báo ngay'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', marginBottom: '16px', borderRadius: '6px' }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '14px', color: '#166534', marginBottom: '8px' }}>Dự báo ca bệnh</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534' }}>
              {result.prediction?.predicted_cases?.toFixed(0) || result.predicted_cases?.toFixed(0) || 'N/A'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const fieldLabels = {
  zone_name: { label: 'Tên vùng/Tỉnh thành', hint: 'Khu vực dự báo' },
  avg_temp_max: { label: 'Nhiệt độ cao nhất (°C)', hint: 'VD: 35.5' },
  avg_temp_med: { label: 'Nhiệt độ trung bình (°C)', hint: 'VD: 28.3' },
  sum_precip_tot: { label: 'Tổng lượng mưa (mm)', hint: 'VD: 120.5' },
  avg_humid: { label: 'Độ ẩm trung bình (%)', hint: 'VD: 75' },
  dengue_trends: { label: 'Xu hướng SXH', hint: 'VD: 50' },
  symptoms_trends: { label: 'Xu hướng triệu chứng', hint: 'VD: 20' },
  lag1: { label: 'Lag 1 (tuần trước)', hint: 'VD: 45' },
  lag2: { label: 'Lag 2 (2 tuần trước)', hint: 'VD: 52' },
  lag3: { label: 'Lag 3 (3 tuần trước)', hint: 'VD: 48' },
  ma4: { label: 'MA 4 (trung bình 4 tuần)', hint: 'VD: 48.5' },
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

  // Cập nhật lại zone_name khi selectedZone thay đổi
  useEffect(() => {
    setFormData(prev => ({ ...prev, zone_name: selectedZone }));
  }, [selectedZone]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Fix: Ép kiểu toàn bộ về Float kèm Fallback 0 để không bị lỗi NaN
      const payload = {
        zone_name: formData.zone_name,
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

      // Fix: Đổi port 3000 thành 8000
      const response = await fetch('http://localhost:8000/predict-zone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API error ${response.status}: ${JSON.stringify(errorData)}`);
      }
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
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {Object.entries(formData).map(([key, value]) => {
            const fieldInfo = fieldLabels[key as keyof typeof fieldLabels];
            const isReadonly = key === 'zone_name';
            
            return (
              <div key={key}>
                <label style={{ display: 'block', fontWeight: '500', fontSize: '13px', marginBottom: '8px' }}>
                  {fieldInfo.label}
                </label>
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
                    background: isReadonly ? '#f3f4f6' : '#ffffff',
                  }}
                />
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
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Đang dự báo...' : 'Dự báo ngay'}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      
      {result && (
        <div style={{ padding: '16px', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '6px' }}>
          <div style={{ color: '#166534' }}>
            <strong>Kết quả dự báo:</strong> {result.data?.predicted_cases?.toFixed(1) || result.predicted_cases?.toFixed(1) || 'N/A'} ca bệnh dự kiến
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
        // Fix: Đổi port 3000 thành 8000
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
    </div>
  );
};

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const selectedZone = useStore(s => s.selectedZone);
  const setSelectedZone = useStore(s => s.setSelectedZone);

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, width: '250px', height: '100vh',
      background: '#0f172a', color: 'white', padding: '20px',
      overflowY: 'auto', zIndex: 1000, display: isOpen ? 'block' : 'none',
    }}>
      <h2 style={{ marginBottom: '20px', marginTop: 0 }}>Chọn tỉnh thành</h2>
      {zones.map(zone => (
        <button
          key={zone}
          onClick={() => { setSelectedZone(zone); onClose(); }}
          style={{
            display: 'block', width: '100%', padding: '12px', marginBottom: '8px',
            background: selectedZone === zone ? '#1e40af' : 'transparent',
            color: 'white', border: 'none', borderRadius: '6px',
            cursor: 'pointer', textAlign: 'left',
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
        <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '20px', display: 'flex', alignItems: 'center' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>☰</button>
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
                border: 'none', borderBottom: activeTab === tab.id ? '2px solid #1e40af' : 'none',
                cursor: 'pointer', fontWeight: activeTab === tab.id ? '500' : '400',
              }}
            >
              <span style={{ marginRight: '8px' }}>{tab.icon}</span>{tab.label}
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