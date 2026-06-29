// admin/src/pages/WastePage.tsx
// ──────────────────────────────
// Recent waste logs across all devices (GET /admin/waste).

import { api } from '../api/client';
import { useFetch } from '../hooks/useFetch';
import DataTable, { Column } from '../components/DataTable';
import Badge from '../components/Badge';
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

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-compost-900 mb-1">Waste Logs</h1>
      <p className="text-text-secondary mb-8">Material added to bins across all devices.</p>
      <DataTable columns={columns} rows={data} loading={loading} error={error} empty="No waste logs." />
    </div>
  );
}
