/**
 * Adapter between the API (UPPERCASE Prisma enums, ISO strings, /media URLs)
 * and the dashboard's existing component shape (lowerCamel, ISO strings,
 * full-URL photoUrls).
 *
 * Intentionally kept narrow: dashboard components don't need to know
 * about the API at all — they read the same Report shape they always have.
 */
import {
  type ApiReportRow,
  type ReportCategory as ApiCategory,
  type ReportStatus as ApiStatus,
  mediaUrl,
} from '@/lib/api'
import type { Report, ReportCategory, ReportStatus } from './mockReports'

const CATEGORY: Record<ApiCategory, ReportCategory> = {
  AGGRESSIVE: 'aggressive',
  INJURED: 'injured',
  STRAY: 'stray',
}

const STATUS: Record<ApiStatus, ReportStatus> = {
  PENDING: 'pending',
  APPROVED: 'approved',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'inProgress',
  RESOLVED: 'resolved',
  IMPOSSIBLE: 'impossible',
  REJECTED: 'rejected',
}

// Use a generic placeholder when a report has no photo yet.
const NO_PHOTO_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="#F3F4F6"/>
  <path d="M60 40c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm0 8a4 4 0 110 8 4 4 0 010-8zm-9 24c0-3 4-6 9-6s9 3 9 6v3H51v-3z" fill="#9CA3AF"/>
</svg>`)

export function adaptReport(api: ApiReportRow): Report {
  return {
    id: api.publicRef, // dashboard components use publicRef as the id (it's user-facing)
    photoUrl: mediaUrl(api.thumbnailUrl) ?? NO_PHOTO_PLACEHOLDER,
    category: CATEGORY[api.category],
    status: STATUS[api.status],
    zone: api.zone,
    address: api.address,
    receivedAt: api.receivedAt,
    reporter: {
      name: api.citizenName ?? undefined,
      phone: api.citizenPhone ?? undefined,
    },
    comment: api.comment,
    animalCount: api.animalCount,
    isUrgent: api.isUrgent,
    agent: api.agent?.name,
    team: api.team?.name,
    latitude: api.latitude,
    longitude: api.longitude,
  }
}

export function adaptReports(rows: ApiReportRow[]): Report[] {
  return rows.map(adaptReport)
}

/** Re-export so dashboard screens have a single import path. */
export { type Report, type ReportCategory, type ReportStatus } from './mockReports'
