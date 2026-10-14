import { env } from '../config/env';
import { logger } from './logger';
import { ApiError } from '../utils/ApiError';

/**
 * Indian festivals & holidays from Google Calendar's public "Holidays in India" calendar
 * (Calendar API v3, API key only). Used for the Panchang festivals list when configured,
 * since the Divine plan doesn't include the festivals APIs.
 */

const REQUEST_TIMEOUT_MS = 15_000;

export function isGoogleHolidaysConfigured(): boolean {
  return Boolean(env.GOOGLE_CALENDAR_API_KEY);
}

interface GoogleEvent {
  summary?: string;
  start?: { date?: string; dateTime?: string };
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

/**
 * Festivals in a Gregorian month, in the same shape as Divine's english-calendar-festivals
 * (object keyed by slug, `{ date: 'YYYY-MM-DD', name }`), so the app reads both alike.
 */
export async function fetchGoogleFestivals(year: number, month: number): Promise<Record<string, { date: string; name: string }>> {
  const from = `${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`;
  const next = month === 12 ? `${year + 1}-01-01T00:00:00Z` : `${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00Z`;
  const params = new URLSearchParams({
    key: env.GOOGLE_CALENDAR_API_KEY!,
    timeMin: from,
    timeMax: next,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.GOOGLE_HOLIDAY_CALENDAR_ID)}/events?${params}`;

  let body: { items?: GoogleEvent[]; error?: { message?: string } };
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    body = (await res.json()) as typeof body;
    if (!res.ok) {
      // Never log the URL (it carries the API key)
      logger.error({ status: res.status, message: body.error?.message }, '[google-holidays] request failed');
      throw new ApiError(502, 'festivals.unavailable');
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    logger.error({ err: (err as Error).message }, '[google-holidays] request failed');
    throw new ApiError(502, 'festivals.unavailable');
  }

  const out: Record<string, { date: string; name: string }> = {};
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  for (const ev of body.items ?? []) {
    const name = ev.summary?.trim();
    const date = (ev.start?.date ?? ev.start?.dateTime ?? '').slice(0, 10);
    if (!name || !date.startsWith(prefix)) continue;
    // Same festival name twice in a month (e.g. two Ekadashis): keep both with a date suffix
    let key = slugify(name) || 'festival';
    if (out[key]) key = `${key}_${date.slice(8, 10)}`;
    out[key] = { date, name };
  }
  return out;
}
