import { ApiError } from '../utils/ApiError';
import { cache } from './cache';
import { logger } from './logger';

/**
 * Place name -> coordinates via the free OpenStreetMap Nominatim API.
 * Usage policy: identifying User-Agent, max ~1 req/s, cache results — so every lookup is
 * cached for 30 days (misses for 1 day) under `geo:nominatim:<normalised place>`.
 */
export interface GeoPoint {
  lat: number;
  lon: number;
  displayName: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'MIRAI-Backend/1.0';
const HIT_TTL = 30 * 24 * 3600;
const MISS_TTL = 24 * 3600;

type Cached = { found: true; point: GeoPoint } | { found: false };

/** Returns null when the place is unknown. Throws 503 `geo.unavailable` if Nominatim cannot be reached. */
export async function geocodePlace(place: string): Promise<GeoPoint | null> {
  const q = place.trim().replace(/\s+/g, ' ');
  if (!q) return null;
  const key = `geo:nominatim:${q.toLowerCase()}`;

  const hit = await cache.get<Cached>(key);
  if (hit) return hit.found ? hit.point : null;

  const url = `${NOMINATIM_URL}?${new URLSearchParams({ format: 'json', limit: '1', q })}`;
  let rows: Array<{ lat: string; lon: string; display_name: string }>;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`http ${res.status}`);
    rows = (await res.json()) as typeof rows;
  } catch (err) {
    logger.warn({ place: q, reason: (err as Error).message }, 'Geocoding failed');
    throw new ApiError(503, 'geo.unavailable');
  }

  const first = Array.isArray(rows) ? rows[0] : undefined;
  const lat = first ? Number(first.lat) : NaN;
  const lon = first ? Number(first.lon) : NaN;
  if (!first || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    await cache.set(key, { found: false } satisfies Cached, MISS_TTL);
    return null;
  }
  const point: GeoPoint = { lat: Math.round(lat * 1e4) / 1e4, lon: Math.round(lon * 1e4) / 1e4, displayName: first.display_name };
  await cache.set(key, { found: true, point } satisfies Cached, HIT_TTL);
  return point;
}
