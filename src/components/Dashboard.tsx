import React, { useState } from 'react';
import { Menu, BarChart3 } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { RealtimeTab } from './RealtimeTab';
import { ManualInputTab } from './ManualInputTab';
import { StatisticsTab } from './StatisticsTab';

type TabType = 'realtime' | 'manual' | 'statistics';

export const Dashboard: React.FC = () => {
  console.log('[v0] Dashboard component rendering');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('realtime');

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: 'realtime', label: 'Dự báo Real-time', icon: '⚡' },
    { id: 'manual', label: 'Dự báo Thủ công', icon: '📝' },
    { id: 'statistics', label: 'Thống kê', icon: '📊' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ display: 'none', padding: '8px', cursor: 'pointer', border: 'none', backgroundColor: 'transparent' }}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Title */}
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
            Hệ thống Dự báo Sốt xuất huyết
          </h1>

          <div></div>
        </header>

        {/* Tabs */}
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', overflowX: 'auto', paddingLeft: '24px', paddingRight: '24px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '16px 24px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                borderBottom: activeTab === tab.id ? '2px solid #1e40af' : 'none',
                color: activeTab === tab.id ? '#1e40af' : '#64748b',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
            >
              <span style={{ marginRight: '8px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            {activeTab === 'realtime' && <RealtimeTab />}
            {activeTab === 'manual' && <ManualInputTab />}
            {activeTab === 'statistics' && <StatisticsTab />}
          </div>
        </div>
      </main>
    </div>
  );
};
