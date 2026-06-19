import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

interface Device {
  device_id: string;
  hardware_uid: string;
  display_name: string;
  is_paired: boolean;
  firmware_version: string | null;
  created_at: string;
}

interface DeviceContextType {
  devices: Device[];
  selectedDevice: Device | null;
  selectDevice: (device: Device) => void;
  loading: boolean;
  refetchDevices: () => Promise<void>;
}

const DeviceContext = createContext<DeviceContextType | null>(null);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDevices = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await api.listDevices();
      setDevices(data);
      if (data.length > 0 && !selectedDevice) {
        setSelectedDevice(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, selectedDevice]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const selectDevice = (device: Device) => {
    setSelectedDevice(device);
  };

  return (
    <DeviceContext.Provider value={{ devices, selectedDevice, selectDevice, loading, refetchDevices: fetchDevices }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevices(): DeviceContextType {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error('useDevices must be inside DeviceProvider');
  return ctx;
}
