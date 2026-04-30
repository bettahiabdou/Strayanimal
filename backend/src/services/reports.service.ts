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
