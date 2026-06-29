// admin/src/pages/OverviewPage.tsx
// ─────────────────────────────────
// Landing page after login. Fetches GET /admin/overview and renders the summary
// tiles. Doubles as the end-to-end smoke test for the whole stack: a successful
// render proves login → token → gated endpoint → UI all work.

import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Overview {
  total_users: number;
  active_users: number;
  admin_users: number;
  total_devices: number;
  paired_devices: number;
  total_readings: number;
  readings_last_24h: number;
  latest_reading_at: string | null;
  active_cycles: number;
  total_alerts: number;
  unacknowledged_alerts: number;
}

function Tile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="organic-card p-6">
      <p className="text-text-secondary text-sm font-bold uppercase tracking-wide">
        {label}
      </p>
      <p className="text-4xl font-serif font-bold text-compost-900 mt-2">{value}</p>
      {hint && <p className="text-text-secondary text-sm mt-1">{hint}</p>}
    </div>
  );
}

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getOverview()
      .then(setData)
      .catch((e) => setError(e?.message || 'Failed to load overview'));
  }, []);

  if (error) {
    return <p className="text-terracotta-500 font-medium">{error}</p>;
  }
  if (!data) {
    return <p className="text-text-secondary">Loading overview…</p>;
  }

  const lastSeen = data.latest_reading_at
    ? new Date(data.latest_reading_at).toLocaleString()
    : '—';

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-compost-900 mb-1">Overview</h1>
      <p className="text-text-secondary mb-8">System-wide snapshot across all tenants.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Tile label="Users" value={data.total_users} hint={`${data.active_users} active · ${data.admin_users} admin`} />
        <Tile label="Devices" value={data.total_devices} hint={`${data.paired_devices} paired`} />
        <Tile label="Active cycles" value={data.active_cycles} />
        <Tile label="Readings" value={data.total_readings} hint={`${data.readings_last_24h} in last 24h`} />
        <Tile label="Alerts" value={data.total_alerts} hint={`${data.unacknowledged_alerts} unacknowledged`} />
        <Tile label="Latest reading" value={lastSeen} />
      </div>
    </div>
  );
}
