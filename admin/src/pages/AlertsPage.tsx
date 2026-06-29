// admin/src/pages/AlertsPage.tsx
// ───────────────────────────────
// Recent alert events across all devices (GET /admin/alerts).

import { api } from '../api/client';
import { useFetch } from '../hooks/useFetch';
import DataTable, { Column } from '../components/DataTable';
import Badge from '../components/Badge';
import { fmtDateTime, fmtNum, shortId } from '../lib/format';

interface AlertRow {
  id: string;
  device_id: string;
  metric: string;
  severity: string;
  value: number;
  threshold: number;
  message: string;
  reading_time: string;
  acknowledged: boolean;
  created_at: string;
}

const columns: Column<AlertRow>[] = [
  { header: 'Time', render: (a) => fmtDateTime(a.created_at) },
  { header: 'Device', render: (a) => <span className="font-mono text-xs">{shortId(a.device_id)}</span> },
  { header: 'Metric', render: (a) => a.metric },
  {
    header: 'Severity',
    render: (a) =>
      a.severity === 'CRITICAL' ? (
        <Badge variant="red">{a.severity}</Badge>
      ) : (
        <Badge variant="amber">{a.severity}</Badge>
      ),
  },
  { header: 'Value', render: (a) => `${fmtNum(a.value)} / ${fmtNum(a.threshold)}` },
  {
    header: 'Ack',
    render: (a) =>
      a.acknowledged ? <Badge variant="green">Yes</Badge> : <Badge variant="neutral">No</Badge>,
  },
];

export default function AlertsPage() {
  const { data, loading, error } = useFetch<AlertRow[]>(() => api.listAlerts());

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-compost-900 mb-1">Alerts</h1>
      <p className="text-text-secondary mb-8">Most recent threshold breaches across all devices.</p>
      <DataTable columns={columns} rows={data} loading={loading} error={error} empty="No alerts." />
    </div>
  );
}
