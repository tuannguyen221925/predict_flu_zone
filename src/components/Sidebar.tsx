import React from 'react';
import { Menu, X, MapPin, Activity } from 'lucide-react';
import { useStore, getAvailableZones } from '../stores/useStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { selectedZone, setSelectedZone } = useStore();
  const zones = getAvailableZones();

  const zones_by_region = {
    'Miền Bắc': zones.slice(0, 3),
    'Miền Trung': zones.slice(3, 7),
    'Miền Nam': zones.slice(7),
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 overflow-y-auto transition-transform duration-300 z-50 md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Dengue</h1>
              <p className="text-xs text-text-secondary">Prediction Hub</p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Zone Selection */}
          <div className="space-y-6">
            {Object.entries(zones_by_region).map(([region, region_zones]) => (
              <div key={region}>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  {region}
                </h3>
                <div className="space-y-2">
                  {region_zones.map((zone) => (
                    <button
                      key={zone}
                      onClick={() => {
                        setSelectedZone(zone);
                        onClose();
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                        selectedZone === zone
                          ? 'bg-primary text-white shadow-md'
                          : 'text-text-primary hover:bg-gray-50 border border-transparent hover:border-gray-200'
                      }`}
                    >
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{zone}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-text-secondary">
              💡 Chọn một tỉnh/thành để xem dự báo chi tiết
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
