// admin/src/api/client.ts
// ─────────────────────────
// The admin app's single gateway to the backend. Mirrors the user dashboard's
// client (Bearer token in localStorage, transparent refresh-on-401) with two
// differences:
//   1. A SEPARATE storage key (rawbin_admin_tokens) so an admin session and a
//      normal dashboard session can coexist without clobbering each other.
//   2. getMe() hits /admin/me (the operator check) and the data methods map
//      1:1 onto the gated /api/v1/admin/* endpoints.

const API_BASE =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:8000/api/v1`;

const TOKEN_KEY = 'rawbin_admin_tokens';

interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

class AdminApiClient {
  private baseUrl = API_BASE;

  // ── Token storage ──────────────────────────────────────────────────────────
  getTokens(): Tokens | null {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  }
  setTokens(tokens: Tokens) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  }
  clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
  }

  // ── Core request with one transparent refresh attempt on 401 ───────────────
  private async request(path: string, options: RequestOptions = {}): Promise<any> {
    const tokens = this.getTokens();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    if (tokens?.access_token) {
      headers['Authorization'] = `Bearer ${tokens.access_token}`;
    }

    let response = await fetch(`${this.baseUrl}${path}`, { ...options, headers });

    if (response.status === 401 && tokens?.refresh_token) {
      const refreshed = await this.refreshToken(tokens.refresh_token);
      if (refreshed) {
        headers['Authorization'] = `Bearer ${refreshed.access_token}`;
        response = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
      } else {
        this.clearTokens();
        throw new ApiError(401, 'Session expired');
      }
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      let msg = 'Request failed';
      if (Array.isArray(err.detail)) msg = err.detail.map((e: any) => e.msg).join(', ');
      else if (err.detail) msg = err.detail;
      throw new ApiError(response.status, msg);
    }
    if (response.status === 204) return null;
    return response.json();
  }

  private async refreshToken(refreshToken: string): Promise<Tokens | null> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) return null;
      const tokens: Tokens = await res.json();
      this.setTokens(tokens);
      return tokens;
    } catch {
      return null;
    }
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  async login(email: string, password: string): Promise<Tokens> {
    // Note: same /auth/login as the user app — admin-ness is enforced by the
    // backend on /admin/* routes, not by a separate login endpoint.
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

  // Confirms the logged-in account is an operator. 403 here => not an admin.
  async getMe() {
    return this.request('/admin/me');
  }

  // ── Admin data ─────────────────────────────────────────────────────────────
  async getOverview() {
    return this.request('/admin/overview');
  }
  async listUsers() {
    return this.request('/admin/users');
  }
  async listDevices() {
    return this.request('/admin/devices');
  }
  async listReadings(deviceId?: string, limit = 100) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (deviceId) params.set('device_id', deviceId);
    return this.request(`/admin/readings?${params}`);
  }
  async listAlerts(limit = 100) {
    return this.request(`/admin/alerts?limit=${limit}`);
  }
  async listCycles(limit = 200) {
    return this.request(`/admin/cycles?limit=${limit}`);
  }
  async listWaste(limit = 200) {
    return this.request(`/admin/waste?limit=${limit}`);
  }
}

export const api = new AdminApiClient();
