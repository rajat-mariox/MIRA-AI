import { useCallback, useEffect, useRef, useState } from 'react';

type State<T> = { data: T | undefined; error: unknown; loading: boolean; refreshing: boolean };

/**
 * Runs `load` on mount and whenever `deps` change. `reload()` refetches (keeping the old
 * data visible); `refresh()` does the same but flags `refreshing` for pull-to-refresh.
 * Responses that arrive after a newer request started are ignored.
 */
export default function useApi<T>(load: () => Promise<T>, deps: unknown[], enabled = true) {
  const [state, setState] = useState<State<T>>({ data: undefined, error: undefined, loading: enabled, refreshing: false });
  const loadRef = useRef(load);
  loadRef.current = load;
  const seq = useRef(0);

  const run = useCallback(async (mode: 'load' | 'reload' | 'refresh') => {
    const id = ++seq.current;
    setState(s => ({
      ...s,
      error: undefined,
      loading: mode !== 'refresh',
      refreshing: mode === 'refresh',
      data: mode === 'load' ? undefined : s.data,
    }));
    try {
      const data = await loadRef.current();
      if (id === seq.current) setState({ data, error: undefined, loading: false, refreshing: false });
    } catch (error) {
      if (id === seq.current) setState(s => ({ ...s, error, loading: false, refreshing: false }));
    }
  }, []);

  useEffect(() => {
    if (enabled) run('load');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, run, ...deps]);

  const reload = useCallback(() => run('reload'), [run]);
  const refresh = useCallback(() => run('refresh'), [run]);
  return { ...state, reload, refresh };
}
