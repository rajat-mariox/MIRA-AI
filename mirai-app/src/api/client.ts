import { API_BASE_URL, getAppLanguage, REQUEST_TIMEOUT_MS } from '../config';
import { clearSession, getTokens, saveTokens, type Tokens } from './storage';

/** Backend envelope: `{ success, statusCode, message, data, errors? }`. */
type Envelope<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  errors?: FieldError[];
};

export type FieldError = { field: string; message: string };

/** Error thrown for every failed request (HTTP error, bad JSON, network or timeout). */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly errors: FieldError[];
  /** true when the server could not be reached (no HTTP response) */
  readonly isNetworkError: boolean;
  /** The error envelope's `data`, when the server sent one (e.g. `{ requiresPlan, quota }` on a 402) */
  readonly data: unknown;

  constructor(
    statusCode: number,
    message: string,
    errors: FieldError[] = [],
    isNetworkError = false,
    data: unknown = undefined,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isNetworkError = isNetworkError;
    this.data = data;
  }

  /** Message for one field (validation errors), if the server sent one. */
  fieldError(field: string): string | undefined {
    return this.errors.find(e => e.field === field || e.field.endsWith(`.${field}`))?.message;
  }
}

/** Astrology endpoints answer 503 (Divine not configured) / 502 (Divine failed). */
export function isAstrologyUnavailable(err: unknown): boolean {
  return err instanceof ApiError && (err.statusCode === 502 || err.statusCode === 503);
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return 'Something went wrong. Please try again.';
}

type Query = Record<string, string | number | boolean | undefined | null>;

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
  /** send the Bearer token and refresh it on 401 (default true) */
  auth?: boolean;
  timeoutMs?: number;
};

// Called once when the session cannot be refreshed (tokens are already cleared).
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

function buildUrl(path: string, query?: Query) {
  const qs = query
    ? Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  return `${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`;
}

async function rawRequest<T>(path: string, opts: RequestOptions, token?: string): Promise<{ data: T; message: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? REQUEST_TIMEOUT_MS);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': getAppLanguage(),
  };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    const aborted = (e as Error)?.name === 'AbortError';
    throw new ApiError(
      0,
      aborted ? 'The server is taking too long to respond. Please try again.' : "Can't reach the server. Check your internet connection.",
      [],
      true,
    );
  } finally {
    clearTimeout(timer);
  }

  let json: Envelope<T> | null = null;
  try {
    json = (await res.json()) as Envelope<T>;
  } catch {
    json = null;
  }
  if (!res.ok || !json || json.success === false) {
    throw new ApiError(
      json?.statusCode ?? res.status,
      json?.message || `Request failed (${res.status}).`,
      Array.isArray(json?.errors) ? json!.errors : [],
      false,
      json?.data,
    );
  }
  return { data: json.data as T, message: json.message };
}

// Single-flight refresh: concurrent 401s share one refresh call.
let refreshing: Promise<Tokens | null> | null = null;

async function refreshTokens(): Promise<Tokens | null> {
  const current = getTokens();
  if (!current) return null;
  try {
    const { data } = await rawRequest<Tokens>('/auth/refresh-token', {
      method: 'POST',
      body: { refreshToken: current.refreshToken },
      auth: false,
    });
    await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return data;
  } catch (e) {
    // Offline: keep the tokens and let the caller show a network error
    if (e instanceof ApiError && e.isNetworkError) throw e;
    await clearSession();
    onSessionExpired?.();
    return null;
  }
}

function refreshOnce(): Promise<Tokens | null> {
  if (!refreshing) {
    refreshing = refreshTokens().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

/** Sends a request and returns `data` + the server message. */
export async function requestWithMessage<T>(path: string, opts: RequestOptions = {}): Promise<{ data: T; message: string }> {
  const useAuth = opts.auth !== false;
  // Wait for a refresh already in progress so we don't send a stale token
  if (useAuth && refreshing) await refreshing.catch(() => null);
  const token = useAuth ? getTokens()?.accessToken : undefined;
  try {
    return await rawRequest<T>(path, opts, token);
  } catch (e) {
    if (!(e instanceof ApiError) || e.statusCode !== 401 || !useAuth || !token) throw e;
    const fresh = await refreshOnce();
    if (!fresh) throw e;
    return rawRequest<T>(path, opts, fresh.accessToken);
  }
}

/** Sends a request and returns the envelope's `data`. */
export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  return (await requestWithMessage<T>(path, opts)).data;
}
