/**
 * Mission service — the field team's side of the system.
 *
 * Drives the state machine:
 *   ASSIGNED → EN_ROUTE → ON_SITE → CAPTURED | IMPOSSIBLE
 *
 * Each transition is auth-gated (the user must be a member of the mission's
 * team), audited, and on the terminal step cascades to the parent Report
 * (CAPTURED → RESOLVED, IMPOSSIBLE → IMPOSSIBLE) and computes durationMin.
 */

import { prisma } from '../lib/db.js'
import type { MissionStatus, Prisma } from '@prisma/client'
import { ConflictError, ForbiddenError, NotFoundError } from '../lib/http.js'

/* ───────────── Allowed transitions ───────────── */

const ALLOWED: Record<MissionStatus, MissionStatus[]> = {
  ASSIGNED: ['EN_ROUTE'],
  EN_ROUTE: ['ON_SITE'],
  ON_SITE: ['CAPTURED', 'IMPOSSIBLE'],
  CAPTURED: [], // terminal
  IMPOSSIBLE: [], // terminal
}

const TERMINAL: MissionStatus[] = ['CAPTURED', 'IMPOSSIBLE']

/* ───────────── Photo decode (same shape as reports.service) ───────────── */

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PHOTO_BYTES = 4 * 1024 * 1024

function decodeDataUrl(dataUrl: string): { contentType: string; bytes: Buffer } {
  const m = dataUrl.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/)
  if (!m) throw new Error('Invalid data URL')
  const contentType = m[1]!.toLowerCase()
  if (!ALLOWED_MIME.includes(contentType)) {
    throw new Error(`Unsupported image type: ${contentType}`)
  }
  const bytes = Buffer.from(m[2]!, 'base64')
  if (bytes.length > MAX_PHOTO_BYTES) {
    throw new Error(`Image too large (max ${Math.round(MAX_PHOTO_BYTES / 1024 / 1024)} MB)`)
  }
  return { contentType, bytes }
}

/* ───────────── Helpers ───────────── */

/**
 * Resolve the mission and confirm the user is a member of its team.
 * Anything else raises 403/404. Used by every write operation.
 */
async function getMissionForMember(missionId: string, userId: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      id: true,
      reportId: true,
      teamId: true,
      status: true,
      assignedAt: true,
      enRouteAt: true,
      onSiteAt: true,
      report: { select: { publicRef: true, status: true } },
    },
  })
  if (!mission) throw new NotFoundError('Mission introuvable.')

  const membership = await prisma.teamMember.findFirst({
    where: { userId, teamId: mission.teamId },
    select: { teamId: true },
  })
  if (!membership) throw new ForbiddenError("Vous n'êtes pas membre de l'équipe affectée.")

  return mission
}

/* ───────────── List ─────────────
 *
 * Missions belonging to the logged-in user's team. Two scopes:
 *   - 'active'    → ASSIGNED, EN_ROUTE, ON_SITE
 *   - 'completed' → CAPTURED, IMPOSSIBLE
 */

export type MyMissionsScope = 'active' | 'completed'

export async function listMyMissions(userId: string, scope: MyMissionsScope) {
  const member = await prisma.teamMember.findUnique({
    where: { userId },
    select: { teamId: true, team: { select: { id: true, name: true, zone: true } } },
  })
  if (!member) {
    // User isn't on any team — return empty list rather than 403, so the UI
    // can show a "no team yet" state instead of an error banner.
    return { missions: [], team: null }
  }

  const statusFilter: MissionStatus[] =
    scope === 'completed' ? ['CAPTURED', 'IMPOSSIBLE'] : ['ASSIGNED', 'EN_ROUTE', 'ON_SITE']

  const rows = await prisma.mission.findMany({
    where: { teamId: member.teamId, status: { in: statusFilter } },
    orderBy:
      scope === 'completed' ? { closedAt: 'desc' } : [{ status: 'asc' }, { assignedAt: 'desc' }],
    select: {
      id: true,
      status: true,
      agentNote: true,
      fieldNote: true,
      assignedAt: true,
      enRouteAt: true,
      onSiteAt: true,
      closedAt: true,
      outcome: true,
      durationMin: true,
      report: {
        select: {
          id: true,
          publicRef: true,
          category: true,
          animalType: true,
          animalCount: true,
          isUrgent: true,
          address: true,
          zone: true,
          comment: true,
          latitude: true,
          longitude: true,
          receivedAt: true,
          citizenName: true,
          citizenPhone: true,
          assignedBy: { select: { name: true } },
          media: {
            select: { id: true, contentType: true, purpose: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  })

  return {
    team: member.team,
    missions: rows.map((m) => ({
      id: m.id,
      status: m.status,
      agentNote: m.agentNote,
      fieldNote: m.fieldNote,
      assignedAt: m.assignedAt.toISOString(),
      enRouteAt: m.enRouteAt?.toISOString() ?? null,
      onSiteAt: m.onSiteAt?.toISOString() ?? null,
      closedAt: m.closedAt?.toISOString() ?? null,
      outcome: m.outcome,
      durationMin: m.durationMin,
      report: {
        id: m.report.id,
        publicRef: m.report.publicRef,
        category: m.report.category,
        animalType: m.report.animalType,
        animalCount: m.report.animalCount,
        isUrgent: m.report.isUrgent,
        address: m.report.address,
        zone: m.report.zone,
        comment: m.report.comment,
        latitude: m.report.latitude,
        longitude: m.report.longitude,
        receivedAt: m.report.receivedAt.toISOString(),
        citizenName: m.report.citizenName,
        citizenPhone: m.report.citizenPhone,
        assignedByName: m.report.assignedBy?.name ?? null,
        photos: m.report.media
          .filter((x) => x.purpose === 'CITIZEN_REPORT')
          .map((x) => ({ id: x.id, contentType: x.contentType })),
      },
    })),
  }
}

/* ───────────── Transition ─────────────
 *
 * Atomic state transition. On the terminal step (CAPTURED / IMPOSSIBLE):
 *   - mission.outcome is set
 *   - mission.closedAt and durationMin are computed
 *   - report.status flips to RESOLVED or IMPOSSIBLE
 *   - report.resolvedAt is set
 * If a photo is provided it's stored as a POST_INTERVENTION MediaAsset.
 *
 * Everything happens inside a Prisma transaction so the mission/report/media
 * stay consistent on failure.
 */

export type TransitionInput = {
  missionId: string
  userId: string
  to: MissionStatus
  fieldNote?: string
  /** data:image/jpeg;base64,... — only meaningful on terminal transitions. */
  photo?: string
}

export async function transitionMission(input: TransitionInput) {
  const mission = await getMissionForMember(input.missionId, input.userId)

  // Validate transition.
  const allowed = ALLOWED[mission.status]
  if (!allowed.includes(input.to)) {
    throw new ConflictError(`Transition invalide : ${mission.status} → ${input.to}.`)
  }

  // Decode photo up-front so a malformed image fails before we touch the DB.
  const decoded = input.photo ? decodeDataUrl(input.photo) : null

  const now = new Date()
  const isTerminal = TERMINAL.includes(input.to)

  // Compute duration from assignedAt for terminal transitions. Fallback to
  // the most precise timestamp we have if assignedAt is somehow missing.
  let durationMin: number | null = null
  if (isTerminal) {
    const start = mission.assignedAt.getTime()
    durationMin = Math.max(0, Math.round((now.getTime() - start) / 60000))
  }

  // Build the mission update payload.
  const missionData: Prisma.MissionUpdateInput = {
    status: input.to,
    ...(input.fieldNote !== undefined ? { fieldNote: input.fieldNote || null } : {}),
    ...(input.to === 'EN_ROUTE' ? { enRouteAt: now } : {}),
    ...(input.to === 'ON_SITE' ? { onSiteAt: now } : {}),
    ...(isTerminal
      ? {
          closedAt: now,
          outcome: input.to,
          durationMin,
        }
      : {}),
  }

  // Cascade to report if terminal.
  const reportData: Prisma.ReportUpdateInput | null = isTerminal
    ? {
        status: input.to === 'CAPTURED' ? 'RESOLVED' : 'IMPOSSIBLE',
        resolvedAt: now,
      }
    : null

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.mission.update({
      where: { id: mission.id },
      data: missionData,
      select: {
        id: true,
        status: true,
        outcome: true,
        durationMin: true,
        enRouteAt: true,
        onSiteAt: true,
        closedAt: true,
        fieldNote: true,
      },
    })

    if (reportData) {
      await tx.report.update({
        where: { id: mission.reportId },
        data: reportData,
      })
    }

    if (decoded) {
      await tx.mediaAsset.create({
        data: {
          reportId: mission.reportId,
          purpose: 'POST_INTERVENTION',
          contentType: decoded.contentType,
          bytes: decoded.bytes.length,
          data: decoded.bytes,
          storageKey: null,
          uploadedById: input.userId,
        },
      })
    }

    return updated
  })

  // Audit (best-effort, never blocks the transition).
  try {
    await prisma.auditEvent.create({
      data: {
        category: 'REPORT',
        action: missionAuditAction(input.to),
        target: mission.report.publicRef,
        userId: input.userId,
        details: {
          missionId: mission.id,
          ...(input.fieldNote ? { fieldNote: input.fieldNote } : {}),
        } as Prisma.InputJsonValue,
      },
    })
  } catch {
    /* swallow */
  }

  return result
}

function missionAuditAction(to: MissionStatus): string {
  switch (to) {
    case 'EN_ROUTE':
      return 'mission.en_route'
    case 'ON_SITE':
      return 'mission.on_site'
    case 'CAPTURED':
      return 'mission.captured'
    case 'IMPOSSIBLE':
      return 'mission.impossible'
    default:
      return `mission.${to.toLowerCase()}`
  }
}
