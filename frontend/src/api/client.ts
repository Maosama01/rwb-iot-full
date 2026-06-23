const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api/v1`;

interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: ((tokens: Tokens | null) => void)[] = [];

  constructor() {
    this.baseUrl = API_BASE;
  }

  getTokens(): Tokens | null {
    const raw = localStorage.getItem('rawbin_tokens');
    return raw ? JSON.parse(raw) : null;
  }

  setTokens(tokens: Tokens) {
    localStorage.setItem('rawbin_tokens', JSON.stringify(tokens));
  }

  clearTokens() {
    localStorage.removeItem('rawbin_tokens');
  }

  async request(path: string, options: RequestOptions = {}): Promise<any> {
    const tokens = this.getTokens();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (tokens?.access_token) {
      headers['Authorization'] = `Bearer ${tokens.access_token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    // If 401, try refreshing the token using a mutex to prevent race conditions
    if (response.status === 401 && tokens?.refresh_token) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        this.refreshToken(tokens.refresh_token).then((refreshed) => {
          this.isRefreshing = false;
          this.refreshSubscribers.forEach((cb) => cb(refreshed));
          this.refreshSubscribers = [];
        });
      }

      const refreshed = await new Promise<Tokens | null>((resolve) => {
        this.refreshSubscribers.push(resolve);
      });

      if (refreshed) {
        headers['Authorization'] = `Bearer ${refreshed.access_token}`;
        const retryResponse = await fetch(`${this.baseUrl}${path}`, {
          ...options,
          headers,
        });
        if (!retryResponse.ok) {
          const err = await retryResponse.json().catch(() => ({}));
          let errMsg = 'Request failed';
          if (Array.isArray(err.detail)) {
            errMsg = err.detail.map((e: any) => e.msg).join(', ');
          } else if (err.detail) {
            errMsg = err.detail;
          }
          throw new ApiError(retryResponse.status, errMsg);
        }
        if (retryResponse.status === 204) return null;
        return retryResponse.json();
      } else {
        this.clearTokens();
        window.location.href = '/login';
        throw new ApiError(401, 'Session expired');
      }
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      let errMsg = 'Request failed';
      if (Array.isArray(err.detail)) {
        errMsg = err.detail.map((e: any) => e.msg).join(', ');
      } else if (err.detail) {
        errMsg = err.detail;
      }
      throw new ApiError(response.status, errMsg);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  async refreshToken(refreshToken: string): Promise<Tokens | null> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) return null;
      const tokens: Tokens = await response.json();
      this.setTokens(tokens);
      return tokens;
    } catch {
      return null;
    }
  }

  // Auth
  async register(data: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    const tokens = this.getTokens();
    if (tokens?.refresh_token) {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: tokens.refresh_token }),
      }).catch(() => {});
    }
    this.clearTokens();
  }

  async requestOtp(phone: string) {
    return this.request('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOtp(phone: string, code: string) {
    const tokens = await this.request('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
    this.setTokens(tokens);
    return tokens;
  }

  // Users
  async getMe() {
    return this.request('/users/me');
  }

  async updatePushToken(token: string) {
    return this.request('/users/me/push-token', {
      method: 'PUT',
      body: JSON.stringify({ token }),
    });
  }

  // Devices
  async listDevices() {
    return this.request('/devices/');
  }

  async createDemoDevice() {
    return this.request('/devices/demo', { method: 'POST' });
  }

  async getDeviceConfig(deviceId: string) {
    return this.request(`/devices/${deviceId}/config`);
  }

  async updateDeviceConfig(deviceId: string, config: any) {
    return this.request(`/devices/${deviceId}/config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async shareDevice(deviceId: string, email: string) {
    return this.request(`/devices/${deviceId}/share`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async listMembers(deviceId: string) {
    return this.request(`/devices/${deviceId}/members`);
  }

  async removeMember(deviceId: string, userId: string) {
    return this.request(`/devices/${deviceId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // --- AI ---
  async aiAsk(deviceId: string, question: string) {
    return this.request(`/ai/ask`, {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId, question }),
    });
  }

  // Telemetry
  async getTelemetryHistory(deviceId: string, interval = 'hour', from: string | null = null, to: string | null = null) {
    const params = new URLSearchParams({ interval });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return this.request(`/telemetry/${deviceId}/history?${params}`);
  }

  async getLatestTelemetry(deviceId: string) {
    return this.request(`/telemetry/${deviceId}/latest`);
  }

  async exportTelemetry(deviceId: string, interval = 'hour', from: string | null = null, to: string | null = null) {
    const params = new URLSearchParams({ interval });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    
    // We cannot use this.request() because it assumes JSON response
    const headers: Record<string, string> = {};
    const tokens = this.getTokens();
    if (tokens?.access_token) {
      headers['Authorization'] = `Bearer ${tokens.access_token}`;
    }

    const response = await fetch(`${this.baseUrl}/telemetry/${deviceId}/export?${params}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Export failed with status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry_${deviceId}_${interval}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Alerts
  async listAlerts(deviceId: string, { limit = 20, offset = 0, severity, metric }: { limit?: number; offset?: number; severity?: string; metric?: string } = {}) {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (severity) params.set('severity', severity);
    if (metric) params.set('metric', metric);
    return this.request(`/devices/${deviceId}/alerts?${params}`);
  }

  async acknowledgeAlert(deviceId: string, alertId: string) {
    return this.request(`/devices/${deviceId}/alerts/${alertId}/acknowledge`, {
      method: 'POST',
    });
  }

  // Cycles
  async listCycles(deviceId: string, status: string | null = null) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/devices/${deviceId}/cycles${params}`);
  }

  async createCycle(deviceId: string, data: any) {
    return this.request(`/devices/${deviceId}/cycles`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCycle(cycleId: string, data: any) {
    return this.request(`/cycles/${cycleId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getCycleInsights(cycleId: string) {
    return this.request(`/cycles/${cycleId}/insights`);
  }

  // Analytics
  async getAnalyticsCompare(from: string | null = null, to: string | null = null) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString() ? `?${params}` : '';
    return this.request(`/analytics/compare${qs}`);
  }

  async getPredictiveInsights(deviceId: string) {
    return this.request(`/analytics/predictive/${deviceId}`);
  }

  // Waste Logs
  async listWasteLogs(deviceId: string, { limit = 50, offset = 0, cycle_id }: { limit?: number; offset?: number; cycle_id?: string } = {}) {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (cycle_id) params.set('cycle_id', cycle_id);
    return this.request(`/devices/${deviceId}/waste-logs?${params}`);
  }

  async createWasteLog(deviceId: string, data: any) {
    return this.request(`/devices/${deviceId}/waste-logs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Community
  async getCommunityImpact() {
    return this.request(`/analytics/community-impact`);
  }

  // Plants & Garden
  async listPlants() {
    return this.request(`/plants`);
  }

  async createPlant(data: { name: string; plant_type: string }) {
    return this.request(`/plants`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async applyCompost(plantId: string, data: { compost_cycle_id?: string; amount_kg?: number; notes?: string }) {
    return this.request(`/plants/${plantId}/applications`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const api = new ApiClient();
export { ApiError };
