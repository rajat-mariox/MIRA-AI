import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { cache } from './cache';
import { logger } from './logger';

/**
 * Google Places for the birth place field (GOOGLE_MAPS_API_KEY): city suggestions while typing
 * and the chosen place's coordinates + UTC offset. Uses Places API (New) and falls back to the
 * legacy Places API when only that one is enabled on the key. Results are cached so the same
 * search costs one Google call.
 */

export interface PlaceSuggestion {
  placeId: string;
  /** "Jaipur" */
  name: string;
  /** "Rajasthan, India" */
  region: string;
  /** "Jaipur, Rajasthan, India" */
  description: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  /** UTC offset in hours (IST = 5.5); null when Google does not give one */
  tzone: number | null;
}

const TIMEOUT_MS = 8000;
const SEARCH_TTL = 7 * 24 * 3600;
const DETAILS_TTL = 90 * 24 * 3600;

export function isPlacesConfigured(): boolean {
  return Boolean(env.GOOGLE_MAPS_API_KEY);
}

const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

// Google's JSON is read field by field below
type Json = any; // eslint-disable-line @typescript-eslint/no-explicit-any

async function getJson(url: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; body: Json }> {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
    return { ok: res.ok, status: res.status, body: await res.json().catch(() => null) };
  } catch (err) {
    logger.warn({ reason: (err as Error).message }, '[places] request failed');
    throw new ApiError(503, 'places.unavailable');
  }
}

// ─── Places API (New) ─────────────────────────────────────────────────────────

async function searchNew(input: string, session?: string): Promise<PlaceSuggestion[] | null> {
  const r = await getJson('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY! },
    body: JSON.stringify({
      input,
      includedPrimaryTypes: ['(cities)'],
      languageCode: 'en',
      ...(session ? { sessionToken: session } : {}),
    }),
  });
  if (!r.ok) {
    logger.warn({ status: r.status, message: r.body?.error?.message }, '[places] autocomplete (new) failed');
    return null;
  }
  return ((r.body?.suggestions ?? []) as Json[])
    .map((s) => s.placePrediction)
    .filter(Boolean)
    .map((p) => ({
      placeId: String(p.placeId),
      name: String(p.structuredFormat?.mainText?.text ?? p.text?.text ?? ''),
      region: String(p.structuredFormat?.secondaryText?.text ?? ''),
      description: String(p.text?.text ?? ''),
    }));
}

async function detailsNew(placeId: string, session?: string): Promise<PlaceDetails | null> {
  const qs = session ? `?sessionToken=${encodeURIComponent(session)}` : '';
  const r = await getJson(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}${qs}`, {
    headers: {
      'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY!,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,utcOffsetMinutes',
    },
  });
  if (!r.ok || !r.body?.location) {
    logger.warn({ status: r.status, message: r.body?.error?.message }, '[places] details (new) failed');
    return null;
  }
  const b = r.body;
  return {
    placeId,
    name: String(b.displayName?.text ?? ''),
    address: String(b.formattedAddress ?? ''),
    lat: round4(Number(b.location.latitude)),
    lon: round4(Number(b.location.longitude)),
    tzone: typeof b.utcOffsetMinutes === 'number' ? b.utcOffsetMinutes / 60 : null,
  };
}

// ─── Legacy Places API ────────────────────────────────────────────────────────

async function searchLegacy(input: string, session?: string): Promise<PlaceSuggestion[] | null> {
  const qs = new URLSearchParams({ input, types: '(cities)', language: 'en', key: env.GOOGLE_MAPS_API_KEY! });
  if (session) qs.set('sessiontoken', session);
  const r = await getJson(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${qs}`);
  const status = r.body?.status;
  if (status !== 'OK' && status !== 'ZERO_RESULTS') {
    logger.warn({ status, message: r.body?.error_message }, '[places] autocomplete (legacy) failed');
    return null;
  }
  return ((r.body?.predictions ?? []) as Json[]).map((p) => ({
    placeId: String(p.place_id),
    name: String(p.structured_formatting?.main_text ?? p.description ?? ''),
    region: String(p.structured_formatting?.secondary_text ?? ''),
    description: String(p.description ?? ''),
  }));
}

async function detailsLegacy(placeId: string, session?: string): Promise<PlaceDetails | null> {
  const qs = new URLSearchParams({
    place_id: placeId,
    fields: 'name,formatted_address,geometry/location,utc_offset',
    key: env.GOOGLE_MAPS_API_KEY!,
  });
  if (session) qs.set('sessiontoken', session);
  const r = await getJson(`https://maps.googleapis.com/maps/api/place/details/json?${qs}`);
  const res = r.body?.result;
  if (r.body?.status !== 'OK' || !res?.geometry?.location) {
    logger.warn({ status: r.body?.status, message: r.body?.error_message }, '[places] details (legacy) failed');
    return null;
  }
  return {
    placeId,
    name: String(res.name ?? ''),
    address: String(res.formatted_address ?? ''),
    lat: round4(Number(res.geometry.location.lat)),
    lon: round4(Number(res.geometry.location.lng)),
    tzone: typeof res.utc_offset === 'number' ? res.utc_offset / 60 : null,
  };
}

// ─── Public ───────────────────────────────────────────────────────────────────

function assertConfigured(): void {
  if (!isPlacesConfigured()) throw new ApiError(503, 'places.notConfigured');
}

/** City suggestions for what the user typed (empty for under 2 characters) */
export async function searchPlaces(input: string, session?: string): Promise<PlaceSuggestion[]> {
  assertConfigured();
  const q = input.trim().replace(/\s+/g, ' ');
  if (q.length < 2) return [];
  const key = `places:search:${q.toLowerCase()}`;
  const hit = await cache.get<PlaceSuggestion[]>(key);
  if (hit) return hit;
  const list = (await searchNew(q, session)) ?? (await searchLegacy(q, session));
  if (!list) throw new ApiError(502, 'places.failed');
  await cache.set(key, list, SEARCH_TTL);
  return list;
}

/** Coordinates and UTC offset of a suggestion the user picked */
export async function placeDetails(placeId: string, session?: string): Promise<PlaceDetails> {
  assertConfigured();
  const key = `places:details:${placeId}`;
  const hit = await cache.get<PlaceDetails>(key);
  if (hit) return hit;
  const d = (await detailsNew(placeId, session)) ?? (await detailsLegacy(placeId, session));
  if (!d || !Number.isFinite(d.lat) || !Number.isFinite(d.lon)) throw new ApiError(502, 'places.failed');
  await cache.set(key, d, DETAILS_TTL);
  return d;
}
