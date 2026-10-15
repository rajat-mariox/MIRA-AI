import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';
import { getPlace, searchPlaces, type PlaceSuggestion } from '../api/places';

/** The place the user picked from the suggestions */
export type PickedPlace = { name: string; lat: number; lon: number; tzone: number | null };

const DEBOUNCE_MS = 300;
const MAX_SUGGESTIONS = 5;

// Google bills one autocomplete "session" from the first keystroke to the pick
const newSession = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;

/**
 * City suggestions for a birth place field. Call `onType` from onChangeText and `pick` when a
 * suggestion is tapped. When the backend has no Google key the field simply works as plain text.
 */
export default function usePlaceAutocomplete() {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const session = useRef(newSession());
  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Turned off for this screen after "not configured", so typing doesn't keep failing
  const disabled = useRef(false);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onType = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    const q = text.trim();
    const id = ++seq.current;
    if (disabled.current || q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(() => {
      searchPlaces(q, session.current)
        .then(list => {
          if (id === seq.current) setSuggestions(list.slice(0, MAX_SUGGESTIONS));
        })
        .catch(e => {
          if (e instanceof ApiError && e.statusCode === 503) disabled.current = true;
          if (id === seq.current) setSuggestions([]);
        })
        .finally(() => {
          if (id === seq.current) setLoading(false);
        });
    }, DEBOUNCE_MS);
  }, []);

  /** Resolves the tapped suggestion's coordinates; null if that fails (the typed text is kept) */
  const pick = useCallback(async (s: PlaceSuggestion): Promise<PickedPlace | null> => {
    ++seq.current;
    if (timer.current) clearTimeout(timer.current);
    setSuggestions([]);
    setLoading(false);
    try {
      const d = await getPlace(s.placeId, session.current);
      return { name: s.description || d.address || d.name, lat: d.lat, lon: d.lon, tzone: d.tzone };
    } catch {
      return null;
    } finally {
      session.current = newSession();
    }
  }, []);

  const clear = useCallback(() => {
    ++seq.current;
    setSuggestions([]);
    setLoading(false);
  }, []);

  return { suggestions, loading, onType, pick, clear };
}
