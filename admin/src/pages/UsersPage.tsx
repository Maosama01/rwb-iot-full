// admin/src/pages/UsersPage.tsx
// ──────────────────────────────
// Lists every user (GET /admin/users) with their linked-device count.
// Client-side search (name/email/phone) + status + role filters.

import { useMemo, useState } from 'react';
import { api } from '../api/client';
import { useFetch } from '../hooks/useFetch';
import DataTable, { Column } from '../components/DataTable';
import Badge from '../components/Badge';
import { Toolbar, SearchInput, FilterSelect } from '../components/Filters';
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

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [role, setRole] = useState('all');

  const rows = useMemo(() => {
    if (!data) return null;
    const q = query.trim().toLowerCase();
    return data.filter((u) => {
      const matchesQuery =
        !q ||
        u.display_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q);
      const matchesStatus =
        status === 'all' || (status === 'active' ? u.is_active : !u.is_active);
      const matchesRole = role === 'all' || (role === 'admin' ? u.is_admin : !u.is_admin);
      return matchesQuery && matchesStatus && matchesRole;
    });
  }, [data, query, status, role]);

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-compost-900 mb-1">Users</h1>
      <p className="text-text-secondary mb-8">All registered accounts.</p>

      <Toolbar>
        <SearchInput value={query} onChange={setQuery} placeholder="Search name, email, phone…" />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Disabled', value: 'disabled' },
          ]}
        />
        <FilterSelect
          label="Role"
          value={role}
          onChange={setRole}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Admin', value: 'admin' },
            { label: 'User', value: 'user' },
          ]}
        />
      </Toolbar>

      <DataTable columns={columns} rows={rows} loading={loading} error={error} empty="No matching users." />
    </div>
  );
}
