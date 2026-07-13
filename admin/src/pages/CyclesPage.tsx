// admin/src/pages/CyclesPage.tsx
// ───────────────────────────────
// Compost cycles across all devices (GET /admin/cycles).
// Client-side search (label/device) + status filter.

import { useMemo, useState } from 'react';
import { api } from '../api/client';
import { useFetch } from '../hooks/useFetch';
import DataTable, { Column } from '../components/DataTable';
import Badge from '../components/Badge';
import { Toolbar, SearchInput, FilterSelect } from '../components/Filters';
import { fmtDateTime, shortId } from '../lib/format';

interface CycleRow {
  id: string;
  device_id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  label: string | null;
  created_at: string;
}

function statusVariant(status: string): 'green' | 'amber' | 'neutral' {
  if (status === 'active') return 'green';
  if (status === 'curing') return 'amber';
  return 'neutral'; // completed
}

const columns: Column<CycleRow>[] = [
  { header: 'Device', render: (c) => <span className="font-mono text-xs">{shortId(c.device_id)}</span> },
  { header: 'Label', render: (c) => c.label || '—' },
  { header: 'Status', render: (c) => <Badge variant={statusVariant(c.status)}>{c.status}</Badge> },
  { header: 'Started', render: (c) => fmtDateTime(c.started_at) },
  { header: 'Ended', render: (c) => fmtDateTime(c.ended_at) },
];

export default function CyclesPage() {
  const { data, loading, error } = useFetch<CycleRow[]>(() => api.listCycles());

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  const rows = useMemo(() => {
    if (!data) return null;
    const q = query.trim().toLowerCase();
    return data.filter((c) => {
      const matchesQuery =
        !q ||
        (c.label || '').toLowerCase().includes(q) ||
        c.device_id.toLowerCase().includes(q);
      const matchesStatus = status === 'all' || c.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [data, query, status]);

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-compost-900 mb-1">Cycles</h1>
      <p className="text-text-secondary mb-8">Composting batches across all devices.</p>

      <Toolbar>
        <SearchInput value={query} onChange={setQuery} placeholder="Search label or device…" />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Curing', value: 'curing' },
            { label: 'Completed', value: 'completed' },
          ]}
        />
      </Toolbar>

      <DataTable columns={columns} rows={rows} loading={loading} error={error} empty="No matching cycles." />
    </div>
  );
}
