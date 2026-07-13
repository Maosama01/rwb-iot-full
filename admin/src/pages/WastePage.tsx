// admin/src/pages/WastePage.tsx
// ──────────────────────────────
// Recent waste logs across all devices (GET /admin/waste).
// Client-side search (device/cycle) + waste-type filter.

import { useMemo, useState } from 'react';
import { api } from '../api/client';
import { useFetch } from '../hooks/useFetch';
import DataTable, { Column } from '../components/DataTable';
import Badge from '../components/Badge';
import { Toolbar, SearchInput, FilterSelect } from '../components/Filters';
import { fmtDateTime, fmtKg, shortId } from '../lib/format';

interface WasteRow {
  id: string;
  device_id: string;
  compost_cycle_id: string | null;
  user_id: string | null;
  waste_type: string;
  weight_kg: number | null;
  logged_at: string;
}

function typeVariant(t: string): 'green' | 'amber' | 'neutral' {
  if (t === 'greens') return 'green';
  if (t === 'browns') return 'amber';
  return 'neutral'; // food / other
}

const columns: Column<WasteRow>[] = [
  { header: 'Logged', render: (w) => fmtDateTime(w.logged_at) },
  { header: 'Device', render: (w) => <span className="font-mono text-xs">{shortId(w.device_id)}</span> },
  { header: 'Type', render: (w) => <Badge variant={typeVariant(w.waste_type)}>{w.waste_type}</Badge> },
  { header: 'Weight', render: (w) => fmtKg(w.weight_kg) },
  { header: 'Cycle', render: (w) => <span className="font-mono text-xs">{shortId(w.compost_cycle_id)}</span> },
];

export default function WastePage() {
  const { data, loading, error } = useFetch<WasteRow[]>(() => api.listWaste());

  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');

  const rows = useMemo(() => {
    if (!data) return null;
    const q = query.trim().toLowerCase();
    return data.filter((w) => {
      const matchesQuery =
        !q ||
        w.device_id.toLowerCase().includes(q) ||
        (w.compost_cycle_id || '').toLowerCase().includes(q);
      const matchesType = type === 'all' || w.waste_type === type;
      return matchesQuery && matchesType;
    });
  }, [data, query, type]);

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-compost-900 mb-1">Waste Logs</h1>
      <p className="text-text-secondary mb-8">Material added to bins across all devices.</p>

      <Toolbar>
        <SearchInput value={query} onChange={setQuery} placeholder="Search device or cycle…" />
        <FilterSelect
          label="Type"
          value={type}
          onChange={setType}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Greens', value: 'greens' },
            { label: 'Browns', value: 'browns' },
            { label: 'Food', value: 'food' },
            { label: 'Other', value: 'other' },
          ]}
        />
      </Toolbar>

      <DataTable columns={columns} rows={rows} loading={loading} error={error} empty="No matching waste logs." />
    </div>
  );
}
