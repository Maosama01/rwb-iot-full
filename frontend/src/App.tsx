import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DeviceProvider } from './context/DeviceContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AlertsPage from './pages/AlertsPage';
import CompostPage from './pages/CompostPage';
import DeviceSettingsPage from './pages/DeviceSettingsPage';
import DeviceSetupPage from './pages/DeviceSetupPage';
import WasteLogPage from './pages/WasteLogPage';
import AnalyticsPage from './pages/AnalyticsPage';
import GardenPage from './pages/GardenPage';
import LandingPage from './pages/LandingPage';
import LibraryPage from './pages/LibraryPage';
import AIChatWidget from './components/AIChatWidget';

import React, { Component, ErrorInfo } from 'react';

class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red' }}>
          <h2>Something went wrong.</h2>
          <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.toString()}
          </pre>
          <pre style={{ fontSize: '10px', whiteSpace: 'pre-wrap', marginTop: 10 }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background font-sans text-text-primary relative transition-colors duration-500">
      <Sidebar />
      <main className="flex-1 min-w-0 md:ml-64 p-4 md:p-10 pb-28 md:pb-10 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
      <div className="md:hidden">
        <AIChatWidget inline={false} />
      </div>
    </div>
  );
}

import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <DeviceProvider>
                      <AppLayout>
                        <Routes>
                          <Route path="/" element={<DashboardPage />} />
                          <Route path="/alerts" element={<AlertsPage />} />
                          <Route path="compost" element={<CompostPage />} />
                          <Route path="garden" element={<GardenPage />} />
                          <Route path="/waste" element={<WasteLogPage />} />
                          <Route path="/device-settings" element={<DeviceSettingsPage />} />
                          <Route path="/analytics" element={<AnalyticsPage />} />
                          <Route path="/setup" element={<DeviceSetupPage />} />
                          <Route path="/library" element={<LibraryPage />} />
                        </Routes>
                      </AppLayout>
                    </DeviceProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </ToastProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
