import { API_BASE_URL } from '../config';

/** Backend origin, e.g. "http://192.168.1.40:5000" (API_BASE_URL without "/api/v1") */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '').replace(/\/+$/, '');

const LOCAL_ORIGINS = /^https?:\/\/(localhost|127\.0\.0\.1):5000(?=\/|$)/i;

/**
 * Makes media URLs from the API loadable on the phone:
 * - "/uploads/x.png" -> "<API origin>/uploads/x.png"
 * - "http://localhost:5000/..." / "http://127.0.0.1:5000/..." -> "<API origin>/..."
 * Other URLs are returned as is; empty values become undefined.
 */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  const u = url?.trim();
  if (!u) return undefined;
  if (u.startsWith('//')) return `https:${u}`;
  if (u.startsWith('/')) return `${API_ORIGIN}${u}`;
  if (LOCAL_ORIGINS.test(u)) return u.replace(LOCAL_ORIGINS, API_ORIGIN);
  return u;
}
