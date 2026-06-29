// admin/src/pages/DevicesPage.tsx
// ────────────────────────────────
// Lists every device (GET /admin/devices) with member count and last-seen time.

import { api } from '../api/client';
import { useFetch } from '../hooks/useFetch';
import DataTable, { Column } from '../components/DataTable';
import Badge from '../components/Badge';
import { fmtDateTime } from '../lib/format';

interface DeviceRow {
  id: string;
  hardware_uid: string;
  display_name: string;
  is_paired: boolean;
  firmware_version: string | null;
  created_at: string;
  member_count: number;
  last_reading_at: string | null;
}

const columns: Column<DeviceRow>[] = [
  { header: 'Name', render: (d) => <span className="font-bold">{d.display_name}</span> },
  { header: 'Hardware UID', render: (d) => <span className="font-mono text-xs">{d.hardware_uid}</span> },
  {
    header: 'Paired',
    render: (d) => (d.is_paired ? <Badge variant="green">Paired</Badge> : <Badge variant="amber">Unpaired</Badge>),
  },
  { header: 'Firmware', render: (d) => d.firmware_version || '—' },
  { header: 'Members', render: (d) => d.member_count },
  { header: 'Last seen', render: (d) => fmtDateTime(d.last_reading_at) },
];

export default function DevicesPage() {
  const { data, loading, error } = useFetch<DeviceRow[]>(() => api.listDevices());

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-compost-900 mb-1">Devices</h1>
      <p className="text-text-secondary mb-8">All composters across all tenants.</p>
      <DataTable columns={columns} rows={data} loading={loading} error={error} />
    </div>
  );
}
