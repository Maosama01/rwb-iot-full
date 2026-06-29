// admin/src/App.tsx
// ──────────────────
// App wiring hub: AuthProvider (operator state for the whole tree), the router,
// and the route table.
//
//   /login              → public sign-in
//   / (and children)    → ProtectedRoute → Layout (sidebar + <Outlet/>)
//        index          → OverviewPage
//
// The other sidebar links (Users, Devices, …) get real routes in Phase 4. Until
// then, a catch-all redirects unknown paths back to Overview so nothing 404s.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import UsersPage from './pages/UsersPage';
import DevicesPage from './pages/DevicesPage';
import TelemetryPage from './pages/TelemetryPage';
import AlertsPage from './pages/AlertsPage';
import CyclesPage from './pages/CyclesPage';
import WastePage from './pages/WastePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="devices" element={<DevicesPage />} />
            <Route path="telemetry" element={<TelemetryPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="cycles" element={<CyclesPage />} />
            <Route path="waste" element={<WastePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
