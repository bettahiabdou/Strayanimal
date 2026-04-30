import { prisma } from '../lib/db.js'
import {
  type AnimalType,
  type Prisma,
  type ReportCategory,
  type ReportStatus,
} from '@prisma/client'
import { ConflictError, NotFoundError } from '../lib/http.js'

type Locale = 'fr' | 'ar'

/* ───────────── Public-ref generator ─────────────
 *
 * Format: OZN-{epoch4}-{rand2}, e.g. OZN-2618-47
 * Cheap, monotonically-trending, low collision risk; collision retries handled below.
 */
function buildPublicRef(): string {
  const epoch4 = String(Math.floor(Date.now() / 1000) % 10_000).padStart(4, '0')
  const rand2 = String(Math.floor(Math.random() * 90 + 10))
  return `OZN-${epoch4}-${rand2}`
}

/* ───────────── Inputs ───────────── */

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
  preferredLocale?: Locale
  /**
   * Photos as data URLs (e.g. "data:image/jpeg;base64,/9j/4AAQ…").
   * Stored inline in MediaAsset.data for Phase 1.
   */
  photos?: string[]

  // Forensics for audit
  ip?: string
  userAgent?: string
}

/* ───────── Image helpers ───────── */

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PHOTO_BYTES = 4 * 1024 * 1024 // 4 MB after base64 decode

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

export type SubmittedReport = {
  id: string
  publicRef: string
  status: ReportStatus
  receivedAt: string
}

/* ───────────── Submit ───────────── */

export async function submitCitizenReport(input: SubmitReportInput): Promise<SubmittedReport> {
  // Heuristic: aggressive cases are urgent by default; injured is also flagged urgent.
  const isUrgent = input.category === 'AGGRESSIVE' || input.category === 'INJURED'

  // Decode photos up-front so we fail before touching the DB on bad input.
  const photoBuffers =
    input.photos?.map((d, i) => {
      try {
        return decodeDataUrl(d)
      } catch (e) {
        throw new Error(`Photo ${i + 1}: ${(e as Error).message}`)
      }
    }) ?? []

  // Try a few times in case of unique-ref collision.
  let lastErr: unknown
  for (let attempt = 0; attempt < 5; attempt++) {
    const publicRef = buildPublicRef()
    try {
      const report = await prisma.report.create({
        data: {
          publicRef,
          source: 'WEB_FORM',
          category: input.category,
          animalType: input.animalType,
          animalCount: Math.max(1, Math.floor(input.animalCount)),
          isUrgent,
          status: 'PENDING',
          latitude: input.latitude,
          longitude: input.longitude,
          address: input.address,
          zone: input.zone,
          comment: input.comment,
          citizenName: input.citizenName,
          citizenPhone: input.citizenPhone,
          preferredLocale: input.preferredLocale ?? 'fr',
          // Inline photos as MediaAsset rows (Phase 1: bytes in DB).
          media: photoBuffers.length
            ? {
                create: photoBuffers.map((p) => ({
                  purpose: 'CITIZEN_REPORT' as const,
                  contentType: p.contentType,
                  bytes: p.bytes.length,
                  data: p.bytes,
                  storageKey: null,
                })),
              }
            : undefined,
        },
        select: { id: true, publicRef: true, status: true, receivedAt: true },
      })

      // Audit (best-effort).
      try {
        await prisma.auditEvent.create({
          data: {
            category: 'REPORT',
            action: 'report.submit',
            target: report.publicRef,
            ip: input.ip,
            userAgent: input.userAgent,
            details: {
              category: input.category,
              isUrgent,
              zone: input.zone,
            } as Prisma.InputJsonValue,
          },
        })
      } catch {
        /* never let audit failures block submission */
      }

      return {
        id: report.id,
        publicRef: report.publicRef,
        status: report.status,
        receivedAt: report.receivedAt.toISOString(),
      }
    } catch (err) {
      lastErr = err
      // P2002 = unique constraint violation (publicRef collision) → retry with new ref
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code?: string }).code === 'P2002'
      ) {
        continue
      }
      throw err
    }
  }
  throw lastErr ?? new Error('Failed to generate a unique publicRef after retries.')
}

/* ─────────────────────────── List ─────────────────────────── */

export type ListReportsInput = {
  status?: ReportStatus | 'ALL'
  isUrgent?: boolean
  zone?: string
  search?: string
  page?: number
  pageSize?: number
}

export async function listReports(input: ListReportsInput = {}) {
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 25))
  const where: Prisma.ReportWhereInput = {}

  if (input.status && input.status !== 'ALL') where.status = input.status
  if (typeof input.isUrgent === 'boolean') where.isUrgent = input.isUrgent
  if (input.zone) where.zone = { contains: input.zone, mode: 'insensitive' }
  if (input.search) {
    const q = input.search
    where.OR = [
      { publicRef: { contains: q, mode: 'insensitive' } },
      { address: { contains: q, mode: 'insensitive' } },
      { zone: { contains: q, mode: 'insensitive' } },
      { citizenName: { contains: q, mode: 'insensitive' } },
    ]
  }

  const [rows, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: [{ isUrgent: 'desc' }, { receivedAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        publicRef: true,
        category: true,
        animalType: true,
        animalCount: true,
        status: true,
        isUrgent: true,
        zone: true,
        address: true,
        comment: true,
        latitude: true,
        longitude: true,
        receivedAt: true,
        citizenName: true,
        citizenPhone: true,
        triagedBy: { select: { id: true, name: true } },
        assignedBy: { select: { id: true, name: true } },
        mission: {
          select: {
            id: true,
            status: true,
            team: { select: { id: true, name: true } },
          },
        },
        media: {
          select: { id: true, contentType: true },
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.report.count({ where }),
  ])

  return {
    reports: rows.map(serializeReportRow),
    page,
    pageSize,
    total,
  }
}

/* ─────────────────────────── Triage actions ──────────────── */

async function getPendingReportOrThrow(publicRef: string) {
  const r = await prisma.report.findUnique({
    where: { publicRef },
    select: { id: true, publicRef: true, status: true },
  })
  if (!r) throw new NotFoundError('Signalement introuvable.')
  if (r.status !== 'PENDING') {
    throw new ConflictError(`Ce signalement n'est plus en attente (statut actuel : ${r.status}).`)
  }
  return r
}

export async function approveReport({
  publicRef,
  userId,
  agentNote,
}: {
  publicRef: string
  userId: string
  agentNote?: string
}) {
  const found = await getPendingReportOrThrow(publicRef)
  const updated = await prisma.report.update({
    where: { id: found.id },
    data: {
      status: 'APPROVED',
      triagedById: userId,
      triagedAt: new Date(),
    },
    select: { id: true, publicRef: true, status: true },
  })
  try {
    await prisma.auditEvent.create({
      data: {
        category: 'REPORT',
        action: 'report.approve',
        target: updated.publicRef,
        userId,
        details: agentNote ? ({ note: agentNote } as Prisma.InputJsonValue) : undefined,
      },
    })
  } catch {
    /* never let audit failures block approve */
  }
  return updated
}

export async function rejectReport({
  publicRef,
  userId,
  reason,
}: {
  publicRef: string
  userId: string
  reason: string
}) {
  const found = await getPendingReportOrThrow(publicRef)
  const updated = await prisma.report.update({
    where: { id: found.id },
    data: {
      status: 'REJECTED',
      rejectReason: reason,
      triagedById: userId,
      triagedAt: new Date(),
    },
    select: { id: true, publicRef: true, status: true },
  })
  try {
    await prisma.auditEvent.create({
      data: {
        category: 'REPORT',
        action: 'report.reject',
        target: updated.publicRef,
        userId,
        details: { reason } as Prisma.InputJsonValue,
      },
    })
  } catch {
    /* never let audit failures block reject */
  }
  return updated
}

/* ─────────────────────────── Detail ───────────────────────── */

export async function getReportByRef(publicRef: string) {
  const r = await prisma.report.findUnique({
    where: { publicRef },
    select: {
      id: true,
      publicRef: true,
      source: true,
      category: true,
      animalType: true,
      animalCount: true,
      status: true,
      isUrgent: true,
      zone: true,
      address: true,
      comment: true,
      latitude: true,
      longitude: true,
      receivedAt: true,
      resolvedAt: true,
      citizenName: true,
      citizenPhone: true,
      preferredLocale: true,
      rejectReason: true,
      triagedAt: true,
      assignedAt: true,
      triagedBy: { select: { id: true, name: true } },
      assignedBy: { select: { id: true, name: true } },
      mission: {
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
          team: { select: { id: true, name: true, zone: true } },
        },
      },
      media: {
        select: { id: true, contentType: true, purpose: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  return r
}

/* ─────────────────────────── Stats ────────────────────────── */

export async function getReportStats() {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - 7)

  const [pendingTriage, inProgress, resolvedToday, totalThisWeek, byCategory, recentActivity] =
    await Promise.all([
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.report.count({
        where: { status: { in: ['APPROVED', 'ASSIGNED', 'IN_PROGRESS'] } },
      }),
      prisma.report.count({
        where: { status: 'RESOLVED', resolvedAt: { gte: startOfDay } },
      }),
      prisma.report.count({ where: { receivedAt: { gte: startOfWeek } } }),
      prisma.report.groupBy({
        by: ['category'],
        _count: { _all: true },
      }),
      prisma.auditEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          createdAt: true,
          action: true,
          target: true,
          category: true,
          user: { select: { name: true, role: true } },
        },
      }),
    ])

  // Average mission duration this week (closed only).
  const closedMissions = await prisma.mission.findMany({
    where: { closedAt: { gte: startOfWeek }, durationMin: { not: null } },
    select: { durationMin: true },
  })
  const avgResponseMinutes = closedMissions.length
    ? Math.round(
        closedMissions.reduce((s, m) => s + (m.durationMin ?? 0), 0) / closedMissions.length,
      )
    : null

  // Hot zones (top 5 by submissions in the last 7d).
  const hotZonesRaw = await prisma.report.groupBy({
    by: ['zone'],
    where: { receivedAt: { gte: startOfWeek } },
    _count: { _all: true },
    orderBy: { _count: { zone: 'desc' } },
    take: 5,
  })

  return {
    pendingTriage,
    inProgress,
    resolvedToday,
    totalThisWeek,
    avgResponseMinutes,
    byCategory: byCategory.map((c) => ({ category: c.category, count: c._count._all })),
    hotZones: hotZonesRaw.map((z) => ({ zone: z.zone, count: z._count._all })),
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      at: a.createdAt.toISOString(),
      action: a.action,
      target: a.target,
      category: a.category,
      who: a.user?.name ?? 'Système',
      role: a.user?.role ?? null,
    })),
  }
}

/* ─────────────────────────── Serialization ────────────────── */

type ListRowSelect = Awaited<ReturnType<typeof listRowSelect>>
function listRowSelect() {
  return prisma.report.findFirst({
    select: {
      id: true,
      publicRef: true,
      category: true,
      animalType: true,
      animalCount: true,
      status: true,
      isUrgent: true,
      zone: true,
      address: true,
      comment: true,
      latitude: true,
      longitude: true,
      receivedAt: true,
      citizenName: true,
      citizenPhone: true,
      triagedBy: { select: { id: true, name: true } },
      assignedBy: { select: { id: true, name: true } },
      mission: {
        select: {
          id: true,
          status: true,
          team: { select: { id: true, name: true } },
        },
      },
      media: {
        select: { id: true, contentType: true },
        take: 1,
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

function serializeReportRow(r: NonNullable<ListRowSelect>) {
  return {
    id: r.id,
    publicRef: r.publicRef,
    category: r.category,
    animalType: r.animalType,
    animalCount: r.animalCount,
    status: r.status,
    isUrgent: r.isUrgent,
    zone: r.zone,
    address: r.address,
    comment: r.comment,
    latitude: r.latitude,
    longitude: r.longitude,
    receivedAt: r.receivedAt.toISOString(),
    citizenName: r.citizenName,
    citizenPhone: r.citizenPhone,
    agent: r.triagedBy ?? r.assignedBy ?? null,
    team: r.mission?.team ?? null,
    missionStatus: r.mission?.status ?? null,
    thumbnailUrl: r.media[0] ? `/media/${r.media[0].id}` : null,
  }
}
