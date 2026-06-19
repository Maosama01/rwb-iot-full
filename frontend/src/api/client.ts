const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getTokens() {
    const raw = localStorage.getItem('rawbin_tokens');
    return raw ? JSON.parse(raw) : null;
  }

  setTokens(tokens) {
    localStorage.setItem('rawbin_tokens', JSON.stringify(tokens));
  }

  clearTokens() {
    localStorage.removeItem('rawbin_tokens');
  }

  async request(path, options = {}) {
    const tokens = this.getTokens();
    const headers = {
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

    // If 401, try refreshing the token
    if (response.status === 401 && tokens?.refresh_token) {
      const refreshed = await this.refreshToken(tokens.refresh_token);
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
            errMsg = err.detail.map(e => e.msg).join(', ');
          } else if (err.detail) {
            errMsg = err.detail;
          }
          throw new ApiError(retryResponse.status, errMsg);
        }
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
        errMsg = err.detail.map(e => e.msg).join(', ');
      } else if (err.detail) {
        errMsg = err.detail;
      }
      throw new ApiError(response.status, errMsg);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  async refreshToken(refreshToken) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) return null;
      const tokens = await response.json();
      this.setTokens(tokens);
      return tokens;
    } catch {
      return null;
    }
  }

  // Auth
  async register(data) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email, password) {
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

  async requestOtp(phone) {
    return this.request('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOtp(phone, code) {
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

  // Devices
  async listDevices() {
    return this.request('/devices/');
  }

  async createDemoDevice() {
    return this.request('/devices/demo', { method: 'POST' });
  }

  async getDeviceConfig(deviceId) {
    return this.request(`/devices/${deviceId}/config`);
  }

  async updateDeviceConfig(deviceId, config) {
    return this.request(`/devices/${deviceId}/config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async shareDevice(deviceId, email) {
    return this.request(`/devices/${deviceId}/share`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async listMembers(deviceId) {
    return this.request(`/devices/${deviceId}/members`);
  }

  async removeMember(deviceId, userId) {
    return this.request(`/devices/${deviceId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // Telemetry
  async getTelemetryHistory(deviceId, interval = 'hour', from = null, to = null) {
    const params = new URLSearchParams({ interval });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return this.request(`/telemetry/${deviceId}/history?${params}`);
  }

  // Alerts
  async listAlerts(deviceId, { limit = 20, offset = 0, severity, metric } = {}) {
    const params = new URLSearchParams({ limit, offset });
    if (severity) params.set('severity', severity);
    if (metric) params.set('metric', metric);
    return this.request(`/devices/${deviceId}/alerts?${params}`);
  }

  // Cycles
  async listCycles(deviceId, status = null) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/devices/${deviceId}/cycles${params}`);
  }

  async createCycle(deviceId, data) {
    return this.request(`/devices/${deviceId}/cycles`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCycle(cycleId, data) {
    return this.request(`/cycles/${cycleId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Waste Logs
  async listWasteLogs(deviceId, { limit = 50, offset = 0, cycle_id } = {}) {
    const params = new URLSearchParams({ limit, offset });
    if (cycle_id) params.set('cycle_id', cycle_id);
    return this.request(`/devices/${deviceId}/waste-logs?${params}`);
  }

  async createWasteLog(deviceId, data) {
    return this.request(`/devices/${deviceId}/waste-logs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const api = new ApiClient();
export { ApiError };
