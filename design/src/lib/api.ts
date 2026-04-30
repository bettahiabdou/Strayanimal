/**
 * Thin typed API client.
 *
 * - Reads VITE_API_URL at build time. Falls back to localhost for dev.
 * - Sends `credentials: "include"` so the HttpOnly refresh cookie travels both ways.
 * - Attaches the access token from the in-memory store when present.
 * - On 401 from any non-auth endpoint, attempts a single /auth/refresh, then retries.
 */

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ??
  'http://localhost:4000'

/* ───────── Token store (in-memory; survives page navigations within SPA) ───────── */

let accessToken: string | null = null
const subscribers = new Set<(t: string | null) => void>()

export function getAccessToken() {
  return accessToken
}
export function setAccessToken(t: string | null) {
  accessToken = t
  subscribers.forEach((fn) => fn(t))
}
export function onTokenChange(fn: (t: string | null) => void) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

/* ───────── Domain types ───────── */

export type ApiUser = {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'SUPERVISOR' | 'AGENT' | 'FIELD_TEAM'
  zone?: string | null
  preferredLocale: string
  lastLoginAt?: string | null
}

export type LoginResponse = {
  user: ApiUser
  accessToken: string
}

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

/* ───────── Core request fn ───────── */

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  opts: { skipAuthRefresh?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // Try silent refresh once on 401 (except for auth routes themselves).
  if (res.status === 401 && !opts.skipAuthRefresh && !path.startsWith('/auth/')) {
    const refreshed = await tryRefresh()
    if (refreshed) return request<T>(method, path, body, { skipAuthRefresh: true })
  }

  if (res.status === 204) return undefined as T

  let payload: unknown = null
  try {
    payload = await res.json()
  } catch {
    /* non-JSON body */
  }

  if (!res.ok) {
    const err = (payload as { error?: { code?: string; message?: string; details?: unknown } })
      ?.error
    throw new ApiError(
      res.status,
      err?.code ?? 'UNKNOWN',
      err?.message ?? `HTTP ${res.status}`,
      err?.details,
    )
  }
  return payload as T
}

/* ───────── Auth endpoints ───────── */

async function tryRefresh(): Promise<boolean> {
  try {
    const data = await request<LoginResponse>('POST', '/auth/refresh', undefined, {
      skipAuthRefresh: true,
    })
    setAccessToken(data.accessToken)
    return true
  } catch {
    setAccessToken(null)
    return false
  }
}

export const api = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const data = await request<LoginResponse>(
      'POST',
      '/auth/login',
      { email, password },
      { skipAuthRefresh: true },
    )
    setAccessToken(data.accessToken)
    return data
  },

  async logout(): Promise<void> {
    try {
      await request<void>('POST', '/auth/logout', undefined, { skipAuthRefresh: true })
    } finally {
      setAccessToken(null)
    }
  },

  async me(): Promise<{ user: ApiUser }> {
    return request<{ user: ApiUser }>('GET', '/auth/me')
  },

  /** Try to restore the session from the refresh cookie at app load. */
  async bootstrap(): Promise<ApiUser | null> {
    const ok = await tryRefresh()
    if (!ok) return null
    try {
      const { user } = await this.me()
      return user
    } catch {
      setAccessToken(null)
      return null
    }
  },

  /** Health (used by the preview hub if we want to display API status). */
  async health(): Promise<{ status: string; db: string; uptime: number }> {
    return request('GET', '/health')
  },
}

export const apiUrl = API_URL
