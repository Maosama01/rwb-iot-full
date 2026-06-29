// admin/src/pages/UsersPage.tsx
// ──────────────────────────────
// Lists every user (GET /admin/users) with their linked-device count.

import { api } from '../api/client';
import { useFetch } from '../hooks/useFetch';
import DataTable, { Column } from '../components/DataTable';
import Badge from '../components/Badge';
import { fmtDate } from '../lib/format';

interface UserRow {
  id: string;
  email: string;
  phone: string | null;
  display_name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  device_count: number;
}

const columns: Column<UserRow>[] = [
  { header: 'Name', render: (u) => <span className="font-bold">{u.display_name}</span> },
  { header: 'Email', render: (u) => u.email },
  { header: 'Phone', render: (u) => u.phone || '—' },
  {
    header: 'Status',
    render: (u) =>
      u.is_active ? <Badge variant="green">Active</Badge> : <Badge variant="red">Disabled</Badge>,
  },
  { header: 'Role', render: (u) => (u.is_admin ? <Badge variant="amber">Admin</Badge> : <Badge>User</Badge>) },
  { header: 'Devices', render: (u) => u.device_count },
  { header: 'Joined', render: (u) => fmtDate(u.created_at) },
];

export default function UsersPage() {
  const { data, loading, error } = useFetch<UserRow[]>(() => api.listUsers());

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-compost-900 mb-1">Users</h1>
      <p className="text-text-secondary mb-8">All registered accounts.</p>
      <DataTable columns={columns} rows={data} loading={loading} error={error} />
    </div>
  );
}
