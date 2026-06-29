// admin/src/lib/format.ts
// ─────────────────────────
// Pure, shared formatting helpers. Keeping these in one place means timestamps,
// IDs, and numbers render identically across every admin table.

/** Full local date + time, or an em dash for null/undefined. */
export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

/** Date only (no time). */
export function fmtDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

/** A nullable number, rounded to `digits` decimals, or em dash. */
export function fmtNum(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined) return '—';
  return value.toFixed(digits);
}

/** Weight with a kg suffix, or em dash. */
export function fmtKg(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(2)} kg`;
}

/** First 8 chars of a UUID — enough to eyeball-match rows without the clutter. */
export function shortId(id: string | null | undefined): string {
  return id ? id.slice(0, 8) : '—';
}
