import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const DeviceContext = createContext(null);

export function DeviceProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
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

  const selectDevice = (device) => {
    setSelectedDevice(device);
  };

  return (
    <DeviceContext.Provider value={{ devices, selectedDevice, selectDevice, loading, refetchDevices: fetchDevices }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevices() {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error('useDevices must be inside DeviceProvider');
  return ctx;
}
