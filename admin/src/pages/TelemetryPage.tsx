// admin/src/pages/TelemetryPage.tsx
// ──────────────────────────────────
// Most recent sensor readings across all devices (GET /admin/readings).
// Defaults to the latest 100; the backend caps the limit.
// Client-side search by device name.

import { useMemo, useState } from 'react';
import { api } from '../api/client';
import { useFetch } from '../hooks/useFetch';
import DataTable, { Column } from '../components/DataTable';
import { Toolbar, SearchInput } from '../components/Filters';
import { fmtDateTime, fmtNum } from '../lib/format';

interface ReadingRow {
  device_id: string;
  device_name: string | null;
  time: string;
  temperature_c: number | null;
  humidity_pct: number | null;
  co2_ppm: number | null;
  ph_level: number | null;
  fill_level_pct: number | null;
  weight_kg: number | null;
}

const columns: Column<ReadingRow>[] = [
  { header: 'Time', render: (r) => fmtDateTime(r.time) },
  { header: 'Device', render: (r) => <span className="font-bold">{r.device_name || '—'}</span> },
  { header: 'Temp °C', render: (r) => fmtNum(r.temperature_c) },
  { header: 'Humidity %', render: (r) => fmtNum(r.humidity_pct) },
  { header: 'CO₂ ppm', render: (r) => fmtNum(r.co2_ppm, 0) },
  { header: 'pH', render: (r) => fmtNum(r.ph_level) },
  { header: 'Fill %', render: (r) => fmtNum(r.fill_level_pct) },
  { header: 'Weight kg', render: (r) => fmtNum(r.weight_kg, 2) },
];

export default function TelemetryPage() {
  const { data, loading, error } = useFetch<ReadingRow[]>(() => api.listReadings());

  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    if (!data) return null;
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((r) => (r.device_name || '').toLowerCase().includes(q));
  }, [data, query]);

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-compost-900 mb-1">Telemetry</h1>
      <p className="text-text-secondary mb-8">Latest 100 sensor readings across all devices.</p>

      <Toolbar>
        <SearchInput value={query} onChange={setQuery} placeholder="Search by device name…" />
      </Toolbar>

      <DataTable columns={columns} rows={rows} loading={loading} error={error} empty="No matching readings." />
    </div>
  );
}
