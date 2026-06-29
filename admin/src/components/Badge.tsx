// admin/src/components/Badge.tsx
// ───────────────────────────────
// A small colored pill for statuses (active/disabled, admin, paired, alert
// severity, cycle status). One component keeps these labels consistent across
// every table.

import { ReactNode } from 'react';

type Variant = 'green' | 'red' | 'amber' | 'neutral';

const styles: Record<Variant, string> = {
  green: 'bg-leaf-100 text-leaf-900',
  red: 'bg-terracotta-500/10 text-terracotta-500',
  amber: 'bg-amber-100 text-amber-700',
  neutral: 'bg-cream-100 text-compost-700',
};

export default function Badge({
  variant = 'neutral',
  children,
}: {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
