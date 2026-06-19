import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const tokens = api.getTokens();
    if (!tokens?.access_token) {
      setLoading(false);
      return;
    }
    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch {
      api.clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const tokens = await api.login(email, password);
    api.setTokens(tokens);
    await fetchUser();
  };

  const register = async (data) => {
    const result = await api.register(data);
    api.setTokens(result.tokens);
    setUser(result.user);
  };

  const requestOtp = async (phone) => {
    return api.requestOtp(phone);
  };

  const verifyOtp = async (phone, code) => {
    await api.verifyOtp(phone, code);
    await fetchUser();
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, requestOtp, verifyOtp, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
