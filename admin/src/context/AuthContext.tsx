// admin/src/context/AuthContext.tsx
// ───────────────────────────────────
// Holds the authenticated operator and exposes login/logout to the app.
//
// The admin-specific logic lives in login(): after obtaining tokens we call
// /admin/me. A 403 there means the credentials are valid but the account is
// NOT an operator — we tear the session down and surface a clear error, so a
// regular user can never enter the admin UI even with a correct password.

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { api, ApiError } from '../api/client';

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On first load, if we already hold tokens, try to restore the session.
  const fetchUser = useCallback(async () => {
    const tokens = api.getTokens();
    if (!tokens?.access_token) {
      setLoading(false);
      return;
    }
    try {
      const me = await api.getMe();
      setUser(me);
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

  const login = async (email: string, password: string) => {
    const tokens = await api.login(email, password);
    api.setTokens(tokens);
    try {
      const me = await api.getMe(); // 200 only if is_admin
      setUser(me);
    } catch (e) {
      api.clearTokens();
      setUser(null);
      if (e instanceof ApiError && e.status === 403) {
        throw new ApiError(403, 'This account is not an administrator.');
      }
      throw e;
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
