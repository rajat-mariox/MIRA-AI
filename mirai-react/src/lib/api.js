// Tiny fetch helper for the MIRAI backend.
// Base URL comes from VITE_API_BASE_URL (.env for `npm run dev`, .env.production for builds).
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

/** Error thrown for non-2xx answers: `message` is the server's text, `errors` its field errors. */
export class ApiError extends Error {
  constructor(message, { status = 0, errors = [] } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

/**
 * `apiRequest('/leads', { method: 'POST', body: {...} })` -> the response's `data`.
 * The backend answers `{ success, statusCode, message, data?, errors? }`.
 */
export async function apiRequest(path, { method = 'GET', body, headers, signal } = {}) {
  let res
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch {
    throw new ApiError('Could not reach the server. Please check your connection and try again.')
  }

  let json = null
  try {
    json = await res.json()
  } catch {
    // non-JSON answer (proxy error page etc.)
  }

  if (!res.ok || json?.success === false) {
    throw new ApiError(json?.message || `Request failed (${res.status}). Please try again.`, {
      status: res.status,
      errors: Array.isArray(json?.errors) ? json.errors : [],
    })
  }
  return { data: json?.data, message: json?.message }
}

export const apiPost = (path, body, options) => apiRequest(path, { ...options, method: 'POST', body })
