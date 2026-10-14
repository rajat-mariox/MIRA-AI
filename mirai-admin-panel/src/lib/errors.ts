/** Extracts the backend's `{ success:false, message }` text from an axios or RTK Query error. */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!err || typeof err !== 'object') return fallback;
  const e = err as {
    response?: { data?: { message?: unknown } };
    data?: { message?: unknown } | string;
    error?: unknown;
    message?: unknown;
    status?: unknown;
  };
  const axiosMsg = e.response?.data?.message;
  if (typeof axiosMsg === 'string' && axiosMsg) return axiosMsg;
  if (e.data && typeof e.data === 'object' && typeof e.data.message === 'string' && e.data.message) return e.data.message;
  if (typeof e.error === 'string' && e.error) return e.status === 'FETCH_ERROR' ? 'Cannot reach the server. Is the backend running?' : e.error;
  if (typeof e.message === 'string' && e.message) return e.message;
  return fallback;
}

/** HTTP status of an axios or RTK Query error (undefined for network errors). */
export function getErrorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const e = err as { response?: { status?: unknown }; status?: unknown };
  const s = e.response?.status ?? e.status;
  return typeof s === 'number' ? s : undefined;
}
