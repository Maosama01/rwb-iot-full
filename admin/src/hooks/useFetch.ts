// admin/src/hooks/useFetch.ts
// ────────────────────────────
// Minimal data-fetching hook. Runs `fn` once on mount and exposes the three
// states every page needs: loading / error / data. Centralizing this keeps each
// page focused on "what to fetch and how to render it", not boilerplate.
//
// Note: this is a load-once hook (no refetch/polling) — enough for read-only
// admin tables. We can extend it later if a page needs live refresh.

import { useEffect, useState } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFetch<T>(fn: () => Promise<T>): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    fn()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled)
          setState({ data: null, loading: false, error: e?.message || 'Failed to load' });
      });
    return () => {
      cancelled = true;
    };
    // fn is expected to be a fresh closure per render; we intentionally run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
