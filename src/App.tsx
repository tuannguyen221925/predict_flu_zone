import React, { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
  const [activeTab, setActiveTab] = useState<'realtime' | 'manual' | 'statistics'>('realtime');

  const tabs = [
    { id: 'realtime' as const, label: 'Dự báo Real-time', icon: '⚡' },
    { id: 'manual' as const, label: 'Dự báo Thủ công', icon: '📝' },
    { id: 'statistics' as const, label: 'Thống kê', icon: '📊' },
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
          {activeTab === 'realtime' && <RealtimeTab />}
          {activeTab === 'manual' && <ManualInputTab />}
          {activeTab === 'statistics' && <StatisticsTab />}
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
