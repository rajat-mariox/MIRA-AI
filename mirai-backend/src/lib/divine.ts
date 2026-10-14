import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import type { Lang } from './i18n';
import { logger } from './logger';

/**
 * Divine API (divineapi.com) client. Every endpoint is a POST with form fields
 * (x-www-form-urlencoded), `api_key` in the body and `Authorization: Bearer <token>`.
 * Responses are `{ success: 1, data }` (HTTP 200 even on errors; any `success !== 1` is an error).
 *
 *   const data = await divineRequest<MyShape>('basicAstroDetails', { ...birthParams }, req.lang);
 *
 * Errors: 503 `divine.notConfigured` (keys missing), 502 `divine.requestFailed` (anything else).
 */

export interface DivineEndpoint {
  host: string;
  path: string;
}

/** Host + path per endpoint (see divine-api-reference). Keep versions here only. */
export const DIVINE_ENDPOINTS = {
  // Horoscope (astroapi-5)
  dailyHoroscope: { host: 'astroapi-5.divineapi.com', path: '/api/v5/daily-horoscope' },
  weeklyHoroscope: { host: 'astroapi-5.divineapi.com', path: '/api/v5/weekly-horoscope' },
  monthlyHoroscope: { host: 'astroapi-5.divineapi.com', path: '/api/v5/monthly-horoscope' },
  yearlyHoroscope: { host: 'astroapi-5.divineapi.com', path: '/api/v5/yearly-horoscope' },
  // Panchang
  findPanchang: { host: 'astroapi-1.divineapi.com', path: '/indian-api/v2/find-panchang' },
  findNakshatra: { host: 'astroapi-1.divineapi.com', path: '/indian-api/v2/find-nakshatra' },
  auspiciousTimings: { host: 'astroapi-3.divineapi.com', path: '/indian-api/v1/auspicious-timings' },
  inauspiciousTimings: { host: 'astroapi-3.divineapi.com', path: '/indian-api/v1/inauspicious-timings' },
  englishCalendarFestivals: { host: 'astroapi-3.divineapi.com', path: '/indian-api/v1/english-calendar-festivals' },
  chandramasa: { host: 'astroapi-3.divineapi.com', path: '/indian-api/v2/chandramasa' },
  findSunAndMoon: { host: 'astroapi-2.divineapi.com', path: '/indian-api/v2/find-sun-and-moon' },
  findSamvat: { host: 'astroapi-2.divineapi.com', path: '/indian-api/v1/find-samvat' },
  findRituAndAyana: { host: 'astroapi-2.divineapi.com', path: '/indian-api/v1/find-ritu-and-anaya' },
  findNivasAndShool: { host: 'astroapi-2.divineapi.com', path: '/indian-api/v1/find-nivas-and-shool' },
  findOtherCalendars: { host: 'astroapi-2.divineapi.com', path: '/indian-api/v2/find-other-calendars-and-epoch' },
  // Kundli (astroapi-3)
  basicAstroDetails: { host: 'astroapi-3.divineapi.com', path: '/indian-api/v3/basic-astro-details' },
  planetaryPositions: { host: 'astroapi-3.divineapi.com', path: '/indian-api/v2/planetary-positions' },
  kaalSarpaYoga: { host: 'astroapi-3.divineapi.com', path: '/indian-api/v1/kaal-sarpa-yoga' },
  manglikDosha: { host: 'astroapi-3.divineapi.com', path: '/indian-api/v2/manglik-dosha' },
  sadheSati: { host: 'astroapi-3.divineapi.com', path: '/indian-api/v3/sadhe-sati' },
  horoscopeChart: { host: 'astroapi-3.divineapi.com', path: '/indian-api/v1/horoscope-chart' }, // + `/${chartId}`
  vimshottariDasha: { host: 'astroapi-3.divineapi.com', path: '/indian-api/v1/vimshottari-dasha' },
  ascendantReport: { host: 'astroapi-3.divineapi.com', path: '/indian-api/v2/ascendant-report' },
  ghataChakra: { host: 'astroapi-3.divineapi.com', path: '/indian-api/v1/ghata-chakra' },
} as const satisfies Record<string, DivineEndpoint>;

export type DivineEndpointName = keyof typeof DIVINE_ENDPOINTS;
export type DivineLan = 'en' | 'hi';
export type DivineFields = Record<string, string | number | undefined | null>;

const TIMEOUT_MS = 15_000;
/** Longest Retry-After we are willing to wait before the single retry. */
const MAX_RETRY_WAIT_MS = 5_000;

export function isDivineConfigured(): boolean {
  return Boolean(env.DIVINE_API_KEY && env.DIVINE_AUTH_TOKEN);
}

/**
 * Language actually sent to Divine. Non-English output needs Divine's Translator
 * (`-translator` hosts), so Hindi is only used when DIVINE_USE_TRANSLATOR=true;
 * otherwise everything falls back to English. Use this in cache keys.
 */
export function divineLan(lang: Lang | undefined): DivineLan {
  return lang === 'hi' && env.DIVINE_USE_TRANSLATOR ? 'hi' : 'en';
}

function resolveUrl(ep: DivineEndpoint, lan: DivineLan, pathSuffix = ''): string {
  // astroapi-5.divineapi.com -> astroapi-5-translator.divineapi.com for non-English
  const host = lan !== 'en' ? ep.host.replace(/^(astroapi-\d+)\./, '$1-translator.') : ep.host;
  return `https://${host}${ep.path}${pathSuffix}`;
}

class RetryableError extends Error {
  constructor(
    message: string,
    readonly waitMs = 500,
  ) {
    super(message);
  }
}

function parseRetryAfter(header: string | null): number {
  if (!header) return 1_000;
  const secs = Number(header);
  if (Number.isFinite(secs)) return Math.max(0, secs * 1000);
  const at = Date.parse(header);
  return Number.isNaN(at) ? 1_000 : Math.max(0, at - Date.now());
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function attempt(url: string, body: URLSearchParams): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.DIVINE_AUTH_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const name = (err as Error)?.name;
    throw new RetryableError(name === 'TimeoutError' ? 'timeout' : `network: ${(err as Error)?.message}`);
  }

  if (res.status === 429) throw new RetryableError('http 429', parseRetryAfter(res.headers.get('retry-after')));
  if (res.status >= 500) throw new RetryableError(`http ${res.status}`);

  const json = (await res.json().catch(() => null)) as { success?: unknown; msg?: unknown; message?: unknown; data?: unknown } | null;
  if (!res.ok) {
    throw new DivineFailure(`http ${res.status}`, { status: res.status, msg: json?.msg ?? json?.message });
  }
  if (!json || typeof json !== 'object') throw new DivineFailure('invalid json', { status: res.status });
  if (json.success !== 1 && json.success !== '1') {
    throw new DivineFailure('unsuccessful', { status: res.status, success: json.success, msg: json.msg ?? json.message });
  }
  return json.data;
}

class DivineFailure extends Error {
  constructor(
    message: string,
    readonly info: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

/**
 * POST to a Divine endpoint and return its `data` payload.
 * - timeout 15 s, one retry on network error / timeout / 5xx / 429 (honours Retry-After up to 5 s)
 * - `success !== 1` -> ApiError(502, 'divine.requestFailed'); missing keys -> ApiError(503, 'divine.notConfigured')
 */
export async function divineRequest<T = unknown>(
  name: DivineEndpointName,
  fields: DivineFields,
  lang?: Lang,
  opts: { pathSuffix?: string } = {},
): Promise<T> {
  if (!isDivineConfigured()) throw new ApiError(503, 'divine.notConfigured');

  const lan = divineLan(lang);
  const url = resolveUrl(DIVINE_ENDPOINTS[name], lan, opts.pathSuffix ?? '');
  const body = new URLSearchParams({ api_key: env.DIVINE_API_KEY! });
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null && k !== 'api_key') body.append(k, String(v));
  }
  if (!body.has('lan')) body.append('lan', lan);

  const started = Date.now();
  for (let i = 0; i < 2; i++) {
    try {
      const data = await attempt(url, body);
      logger.debug({ divine: name, ms: Date.now() - started }, 'Divine request ok');
      return data as T;
    } catch (err) {
      if (err instanceof RetryableError && i === 0 && err.waitMs <= MAX_RETRY_WAIT_MS) {
        logger.warn({ divine: name, reason: err.message, retryInMs: err.waitMs }, 'Divine request failed, retrying');
        await sleep(err.waitMs);
        continue;
      }
      // Never log the request body (contains api_key) or headers (bearer token).
      logger.error(
        {
          divine: name,
          url,
          reason: (err as Error).message,
          ...(err instanceof DivineFailure ? err.info : {}),
          ms: Date.now() - started,
        },
        'Divine request failed',
      );
      // The Divine plan doesn't include this API ("You are not authorized to access this API")
      const msg = err instanceof DivineFailure ? String(err.info.msg ?? '') : '';
      if (/not authori[sz]ed/i.test(msg)) throw new ApiError(403, 'divine.notInPlan');
      throw new ApiError(502, 'divine.requestFailed');
    }
  }
  throw new ApiError(502, 'divine.requestFailed'); // unreachable
}

/** Divine returns `{start_time,end_time}`, `[]` or an array of those; normalise to an array. */
export function toTimeRanges(v: unknown): Array<{ start_time: string; end_time: string }> {
  if (!v) return [];
  const arr = Array.isArray(v) ? v : [v];
  return arr.filter(
    (x): x is { start_time: string; end_time: string } => !!x && typeof x === 'object' && 'start_time' in x,
  );
}
