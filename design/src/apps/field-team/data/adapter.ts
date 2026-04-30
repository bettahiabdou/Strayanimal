/**
 * Adapter: API mission rows → the field-team UI's Mission shape.
 *
 * Mirrors the dashboard's adapter. Keeps the screens unchanged when we
 * swap mock data for the real API.
 */
import {
  type ApiMissionRow,
  type ApiMissionStatus,
  type ReportCategory as ApiCategory,
  mediaUrl,
} from '@/lib/api'
import type { Mission, MissionCategory, MissionStatus } from './mockMissions'

const CATEGORY: Record<ApiCategory, MissionCategory> = {
  AGGRESSIVE: 'aggressive',
  INJURED: 'injured',
  STRAY: 'stray',
}

const STATUS: Record<ApiMissionStatus, MissionStatus> = {
  ASSIGNED: 'assigned',
  EN_ROUTE: 'enRoute',
  ON_SITE: 'onSite',
  CAPTURED: 'captured',
  IMPOSSIBLE: 'impossible',
}

const NO_PHOTO_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="#F3F4F6"/>
  <path d="M60 40c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm0 8a4 4 0 110 8 4 4 0 010-8zm-9 24c0-3 4-6 9-6s9 3 9 6v3H51v-3z" fill="#9CA3AF"/>
</svg>`)

/** Rough-distance placeholder until we wire real geolocation in the field team. */
function distanceKmPlaceholder(): number {
  return Math.round((Math.random() * 4 + 0.5) * 10) / 10
}
function etaMinPlaceholder(km: number): number {
  return Math.max(3, Math.round(km * 4))
}

export function adaptMission(api: ApiMissionRow): Mission {
  const photoId = api.report.photos[0]?.id
  const photoUrl = photoId ? mediaUrl(`/media/${photoId}`) : null
  const km = distanceKmPlaceholder()
  return {
    // The mission's own id (cuid) — used by transition calls.
    id: api.id,
    status: STATUS[api.status],
    category: CATEGORY[api.report.category],
    isUrgent: api.report.isUrgent,
    address: api.report.address,
    zone: api.report.zone,
    distanceKm: km,
    etaMin: etaMinPlaceholder(km),
    receivedAt: api.report.receivedAt,
    agentName: api.report.assignedByName ?? '—',
    agentNote: api.agentNote ?? undefined,
    citizenComment: api.report.comment,
    animalCount: api.report.animalCount,
    photoUrl: photoUrl ?? NO_PHOTO_PLACEHOLDER,
    finishedAt: api.closedAt ?? undefined,
    outcome:
      api.outcome === 'CAPTURED'
        ? 'captured'
        : api.outcome === 'IMPOSSIBLE'
          ? 'impossible'
          : undefined,
    durationMin: api.durationMin ?? undefined,
    // Stash the public ref + lat/lng so screens can deep-link to maps.
    publicRef: api.report.publicRef,
    latitude: api.report.latitude,
    longitude: api.report.longitude,
  }
}

export function adaptMissions(rows: ApiMissionRow[]): Mission[] {
  return rows.map(adaptMission)
}
