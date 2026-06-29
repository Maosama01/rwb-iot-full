// admin/src/pages/CyclesPage.tsx
// ───────────────────────────────
// Compost cycles across all devices (GET /admin/cycles).

import { api } from '../api/client';
import { useFetch } from '../hooks/useFetch';
import DataTable, { Column } from '../components/DataTable';
import Badge from '../components/Badge';
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

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-compost-900 mb-1">Cycles</h1>
      <p className="text-text-secondary mb-8">Composting batches across all devices.</p>
      <DataTable columns={columns} rows={data} loading={loading} error={error} empty="No cycles." />
    </div>
  );
}
