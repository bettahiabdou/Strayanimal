import { prisma } from '../lib/db.js'
import {
  type AnimalType,
  type Prisma,
  type ReportCategory,
  type ReportStatus,
} from '@prisma/client'

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
  /** photoKeys reserved for Sprint 1.6 (R2). Ignored for now. */
  photoKeys?: string[]

  // Forensics for audit
  ip?: string
  userAgent?: string
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
