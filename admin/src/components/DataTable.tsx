// admin/src/components/DataTable.tsx
// ───────────────────────────────────
// One generic, themed table reused by every admin page. A page supplies:
//   - columns: each with a header and a render(row) cell function
//   - the fetch state (rows, loading, error)
// and this component handles loading / error / empty / table rendering.
//
// Generic over the row type <T>, so pages keep full type safety on row fields.

import { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | null;
  loading: boolean;
  error: string | null;
  empty?: string;
}

export default function DataTable<T>({
  columns,
  rows,
  loading,
  error,
  empty = 'No records found.',
}: DataTableProps<T>) {
  if (loading) {
    return <p className="text-text-secondary">Loading…</p>;
  }
  if (error) {
    return <p className="text-terracotta-500 font-medium">{error}</p>;
  }
  if (!rows || rows.length === 0) {
    return <p className="text-text-secondary">{empty}</p>;
  }

  return (
    <div className="organic-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-5 py-4 text-xs font-bold uppercase tracking-wide text-text-secondary ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr
                key={r}
                className="border-b border-border/60 last:border-0 hover:bg-cream-50/60 transition-colors"
              >
                {columns.map((col, c) => (
                  <td
                    key={c}
                    className={`px-5 py-4 text-compost-900 text-sm ${col.className || ''}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
