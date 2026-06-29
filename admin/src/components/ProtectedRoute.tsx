// admin/src/components/ProtectedRoute.tsx
// ────────────────────────────────────────
// Gate for authenticated-only pages. Renders children only when an operator is
// logged in; otherwise redirects to /login. While the session is being restored
// (loading), it shows a minimal placeholder so we don't flash the login page on
// a hard refresh.

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-text-secondary">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
