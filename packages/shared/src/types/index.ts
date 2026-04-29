/**
 * Domain types shared between backend (Express) and frontends (React).
 * These mirror the Prisma schema enums but are kept independent so the
 * frontend doesn't pull in @prisma/client.
 */

// ───────── Enums ─────────

export const REPORT_CATEGORIES = ['AGGRESSIVE', 'INJURED', 'STRAY'] as const
export type ReportCategory = (typeof REPORT_CATEGORIES)[number]

export const ANIMAL_TYPES = ['DOG', 'CAT', 'OTHER'] as const
export type AnimalType = (typeof ANIMAL_TYPES)[number]

export const REPORT_STATUSES = [
  'PENDING',
  'APPROVED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'IMPOSSIBLE',
  'REJECTED',
] as const
export type ReportStatus = (typeof REPORT_STATUSES)[number]

export const REPORT_SOURCES = ['WEB_FORM', 'WHATSAPP', 'PHONE', 'AGENT_MANUAL'] as const
export type ReportSource = (typeof REPORT_SOURCES)[number]

export const MISSION_STATUSES = [
  'ASSIGNED',
  'EN_ROUTE',
  'ON_SITE',
  'CAPTURED',
  'IMPOSSIBLE',
] as const
export type MissionStatus = (typeof MISSION_STATUSES)[number]

export const USER_ROLES = ['ADMIN', 'SUPERVISOR', 'AGENT', 'FIELD_TEAM'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'PENDING_INVITE'] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export const SUPPORTED_LOCALES = ['fr', 'ar'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

// ───────── DTOs ─────────

export type CitizenReportInput = {
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
  /** uploaded photo storage keys returned from /uploads/sign */
  photoKeys?: string[]
}

export type ReportSummary = {
  id: string
  publicRef: string
  category: ReportCategory
  status: ReportStatus
  isUrgent: boolean
  zone: string
  address: string
  animalCount: number
  receivedAt: string // ISO
  thumbnailUrl?: string
}

export type ApiError = {
  error: {
    code: string
    message: string
    details?: unknown
  }
}
