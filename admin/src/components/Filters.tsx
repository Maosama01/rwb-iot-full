// admin/src/components/Filters.tsx
// ─────────────────────────────────
// Shared, themed, controlled filter widgets composed by every page:
//   - Toolbar       : a responsive row that holds the search box + selects
//   - SearchInput   : text box with a search icon
//   - FilterSelect  : a labeled dropdown
//
// These are purely presentational (controlled by the parent's state). The
// actual row filtering is done client-side with useMemo in each page, since the
// full dataset is already loaded into an array.

import { ReactNode } from 'react';
import { Search } from 'lucide-react';

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-3 mb-6">{children}</div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative flex-1 min-w-[220px]">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-compost-500 pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-11"
      />
    </div>
  );
}

export interface SelectOption {
  label: string;
  value: string;
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wide text-text-secondary px-1">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-3 bg-white border border-border rounded-full text-compost-900 font-medium outline-none transition-all duration-300 focus:border-leaf-400 focus:ring-4 focus:ring-leaf-100 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
