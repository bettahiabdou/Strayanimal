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

export type ReportCategory = 'AGGRESSIVE' | 'INJURED' | 'STRAY'
export type AnimalType = 'DOG' | 'CAT' | 'OTHER'
export type ReportStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'IMPOSSIBLE'
  | 'REJECTED'

export type SubmitReportInput = {
  category: ReportCategory
  animalType: AnimalType
  animalCount: number
  latitude: number
  longitude: number
  address: string
  zone: string
  comment: string
  citizenName?: string
  citizenPhone?: string
  preferredLocale?: 'fr' | 'ar'
  /** Photos as data URLs (data:image/jpeg;base64,...). Up to 3. */
  photos?: string[]
}

export type SubmittedReport = {
  id: string
  publicRef: string
  status: ReportStatus
  receivedAt: string
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

  /** Citizen anonymous submission. Public route — no auth needed. */
  async submitReport(input: SubmitReportInput): Promise<SubmittedReport> {
    const { report } = await request<{ report: SubmittedReport }>('POST', '/reports', input, {
      skipAuthRefresh: true,
    })
    return report
  },

  /* ───────── Auth-protected report endpoints (used by the dashboard) ───────── */

  async listReports(query: ListReportsQuery = {}): Promise<ListReportsResponse> {
    const qs = new URLSearchParams()
    if (query.status) qs.set('status', query.status)
    if (typeof query.urgent === 'boolean') qs.set('urgent', String(query.urgent))
    if (query.zone) qs.set('zone', query.zone)
    if (query.search) qs.set('search', query.search)
    if (query.page) qs.set('page', String(query.page))
    if (query.pageSize) qs.set('pageSize', String(query.pageSize))
    const path = qs.toString() ? `/reports?${qs}` : '/reports'
    return request<ListReportsResponse>('GET', path)
  },

  async getReport(publicRef: string): Promise<{ report: ReportDetail }> {
    return request<{ report: ReportDetail }>('GET', `/reports/${encodeURIComponent(publicRef)}`)
  },

  async reportStats(): Promise<{ stats: ReportStats }> {
    return request<{ stats: ReportStats }>('GET', '/reports/stats')
  },

  /** Approve a pending report (AGENT+ only). */
  async approveReport(
    publicRef: string,
    agentNote?: string,
  ): Promise<{ id: string; publicRef: string; status: ReportStatus }> {
    const { report } = await request<{
      report: { id: string; publicRef: string; status: ReportStatus }
    }>('POST', `/reports/${encodeURIComponent(publicRef)}/approve`, agentNote ? { agentNote } : {})
    return report
  },

  /** Reject a pending report with a reason (AGENT+ only). */
  async rejectReport(
    publicRef: string,
    reason: string,
  ): Promise<{ id: string; publicRef: string; status: ReportStatus }> {
    const { report } = await request<{
      report: { id: string; publicRef: string; status: ReportStatus }
    }>('POST', `/reports/${encodeURIComponent(publicRef)}/reject`, { reason })
    return report
  },

  /** Assign an APPROVED report to a team (AGENT+ only). */
  async assignReport(
    publicRef: string,
    teamId: string,
    agentNote?: string,
  ): Promise<{ id: string; publicRef: string; status: ReportStatus }> {
    const { report } = await request<{
      report: { id: string; publicRef: string; status: ReportStatus }
    }>('POST', `/reports/${encodeURIComponent(publicRef)}/assign`, {
      teamId,
      ...(agentNote ? { agentNote } : {}),
    })
    return report
  },

  /** Active teams — populates the assign dropdown. */
  async listTeams(): Promise<{ teams: ApiTeam[] }> {
    return request<{ teams: ApiTeam[] }>('GET', '/teams')
  },
}

/* ───────── Dashboard query/response types ───────── */

export type ListReportsQuery = {
  status?: ReportStatus | 'ALL'
  urgent?: boolean
  zone?: string
  search?: string
  page?: number
  pageSize?: number
}

export type ApiReportRow = {
  id: string
  publicRef: string
  category: ReportCategory
  animalType: AnimalType
  animalCount: number
  status: ReportStatus
  isUrgent: boolean
  zone: string
  address: string
  comment: string
  latitude: number
  longitude: number
  receivedAt: string
  citizenName: string | null
  citizenPhone: string | null
  agent: { id: string; name: string } | null
  team: { id: string; name: string } | null
  missionStatus: string | null
  thumbnailUrl: string | null
}

export type ListReportsResponse = {
  reports: ApiReportRow[]
  page: number
  pageSize: number
  total: number
}

export type ReportDetail = ApiReportRow & {
  source: string
  rejectReason: string | null
  triagedAt: string | null
  assignedAt: string | null
  resolvedAt: string | null
  preferredLocale: string
  mission: {
    id: string
    status: string
    agentNote: string | null
    fieldNote: string | null
    assignedAt: string
    enRouteAt: string | null
    onSiteAt: string | null
    closedAt: string | null
    outcome: string | null
    durationMin: number | null
    team: { id: string; name: string; zone: string } | null
  } | null
  media: Array<{ id: string; contentType: string; purpose: string; createdAt: string }>
  /**
   * Report-specific audit trail (events whose `target` matches this publicRef).
   * Sorted oldest-first so the drawer can render it as a top-down timeline.
   */
  audit: Array<{
    id: string
    at: string
    action: string
    details: unknown
    who: string
    role: 'ADMIN' | 'SUPERVISOR' | 'AGENT' | 'FIELD_TEAM' | null
  }>
}

export type ApiTeam = {
  id: string
  name: string
  zone: string
  isActive: boolean
  memberCount: number
}

export type ReportStats = {
  pendingTriage: number
  inProgress: number
  resolvedToday: number
  totalThisWeek: number
  avgResponseMinutes: number | null
  byCategory: Array<{ category: ReportCategory; count: number }>
  hotZones: Array<{ zone: string; count: number }>
  recentActivity: Array<{
    id: string
    at: string
    action: string
    target: string | null
    category: string
    who: string
    role: string | null
  }>
}

/* ───────── Helper: full URL for a /media/:id (used in <img src>) ───────── */
export function mediaUrl(thumbnailPath: string | null | undefined): string | null {
  if (!thumbnailPath) return null
  if (thumbnailPath.startsWith('http')) return thumbnailPath
  return `${API_URL}${thumbnailPath}`
}

export const apiUrl = API_URL
