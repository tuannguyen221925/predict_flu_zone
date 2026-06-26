import { create } from 'zustand';

export interface DengueStore {
  selectedZone: string;
  setSelectedZone: (zone: string) => void;
}

const AVAILABLE_ZONES = [
  'Hanoi',
  'Haiphong',
  'ThaiBinh',
  'DaNang',
  'Hue',
  'NhaTrang',
  'BinhDinh',
  'HCM',
  'CanTho',
  'BinhDuong',
  'DongNai',
  'VungTau',
  'TienGiang',
];

export const useStore = create<DengueStore>((set) => ({
  selectedZone: 'Hanoi',
  setSelectedZone: (zone: string) => {
    if (AVAILABLE_ZONES.includes(zone)) {
      set({ selectedZone: zone });
      console.log('[v0] Zone changed to:', zone);
    }
  },
}));

export const getAvailableZones = () => AVAILABLE_ZONES;
