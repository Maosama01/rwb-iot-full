// admin/src/pages/AlertsPage.tsx
// ───────────────────────────────
// Recent alert events across all devices (GET /admin/alerts).
// Client-side search (metric/message/device) + severity + ack filters.

import { useMemo, useState } from 'react';
import { api } from '../api/client';
import { useFetch } from '../hooks/useFetch';
import DataTable, { Column } from '../components/DataTable';
import Badge from '../components/Badge';
import { Toolbar, SearchInput, FilterSelect } from '../components/Filters';
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

  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('all');
  const [ack, setAck] = useState('all');

  const rows = useMemo(() => {
    if (!data) return null;
    const q = query.trim().toLowerCase();
    return data.filter((a) => {
      const matchesQuery =
        !q ||
        a.metric.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q) ||
        a.device_id.toLowerCase().includes(q);
      const matchesSeverity = severity === 'all' || a.severity === severity;
      const matchesAck =
        ack === 'all' || (ack === 'acked' ? a.acknowledged : !a.acknowledged);
      return matchesQuery && matchesSeverity && matchesAck;
    });
  }, [data, query, severity, ack]);

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-compost-900 mb-1">Alerts</h1>
      <p className="text-text-secondary mb-8">Most recent threshold breaches across all devices.</p>

      <Toolbar>
        <SearchInput value={query} onChange={setQuery} placeholder="Search metric, message, device…" />
        <FilterSelect
          label="Severity"
          value={severity}
          onChange={setSeverity}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Critical', value: 'CRITICAL' },
            { label: 'Warning', value: 'WARNING' },
          ]}
        />
        <FilterSelect
          label="Acknowledged"
          value={ack}
          onChange={setAck}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Acknowledged', value: 'acked' },
            { label: 'Unacknowledged', value: 'unacked' },
          ]}
        />
      </Toolbar>

      <DataTable columns={columns} rows={rows} loading={loading} error={error} empty="No matching alerts." />
    </div>
  );
}
