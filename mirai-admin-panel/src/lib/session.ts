/** Admin session helpers shared by the axios client, RTK Query and the auth slice. */

export const TOKEN_KEY = 'mira_admin_token';
export const USER_KEY = 'mira_admin_user';
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const MOCK_TOKEN = 'mock-token';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* storage unavailable */
  }
}

// A token left over from the mock (VITE_USE_MOCK=true) is meaningless to the real backend:
// drop it before the auth slice reads storage, so the user lands on /login instead of a 401 loop.
if (!USE_MOCK && safeGet(TOKEN_KEY) === MOCK_TOKEN) clearSession();

export function getToken(): string | null {
  return safeGet(TOKEN_KEY);
}

export function getStoredUser<T = unknown>(): T | null {
  const raw = safeGet(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Public admin auth endpoints: a 4xx there is a form error, never "session expired". */
const PUBLIC_AUTH_PATHS = ['/admin/login', '/admin/forgot-password', '/admin/verify-otp', '/admin/reset-password'];

export function isPublicAuthUrl(url: string | undefined): boolean {
  return !!url && PUBLIC_AUTH_PATHS.some((p) => url.includes(p));
}

let redirecting = false;

/** Called on any 401 from an authenticated call: clear the session and go to /login (full reload resets the store). */
export function handleUnauthorized(): void {
  clearSession();
  if (redirecting) return;
  redirecting = true;
  if (window.location.pathname !== '/login') window.location.assign('/login');
  else redirecting = false;
}
