/**
 * Platform settings — singleton row keyed `'platform'`.
 *
 * The citizen site reads these values at page load (hotline, email,
 * address, hours). The dashboard's Settings screen edits them. We keep
 * the row alive on first read so a fresh deploy doesn't 404 the public
 * GET /settings before an admin opens the Settings screen.
 */

import { prisma } from '../lib/db.js'
import type { Prisma } from '@prisma/client'

const SETTING_ID = 'platform'

/** Defaults match what the citizen page used to hard-code, so a fresh
 *  deploy looks identical to the old one until an admin edits them. */
const DEFAULTS = {
  communeName: 'Groupement des communes territoriales — Ouarzazate',
  serviceTitle: 'Service de protection des animaux errants',
  publicHotline: '0524 88 24 87',
  internalHotline: '0524 88 50 12',
  publicEmail: 'info@animaux-ouarzazate.ma',
  address: 'Avenue Mohammed V, Ouarzazate 45000',
  openingHours: 'Lundi – Vendredi : 08h30 – 17h00\nWeek-end : urgences uniquement',
} as const

export type PlatformSettings = {
  communeName: string
  serviceTitle: string
  publicHotline: string
  internalHotline: string | null
  publicEmail: string
  address: string
  openingHours: string
  updatedAt: string
}

function serialize(row: {
  communeName: string
  serviceTitle: string
  publicHotline: string
  internalHotline: string | null
  publicEmail: string
  address: string
  openingHours: string
  updatedAt: Date
}): PlatformSettings {
  return {
    communeName: row.communeName,
    serviceTitle: row.serviceTitle,
    publicHotline: row.publicHotline,
    internalHotline: row.internalHotline,
    publicEmail: row.publicEmail,
    address: row.address,
    openingHours: row.openingHours,
    updatedAt: row.updatedAt.toISOString(),
  }
}

/**
 * Read-or-create. The first call after a deploy creates the row from
 * DEFAULTS; subsequent calls just read.
 */
export async function getSettings(): Promise<PlatformSettings> {
  const row = await prisma.setting.upsert({
    where: { id: SETTING_ID },
    update: {},
    create: { id: SETTING_ID, ...DEFAULTS },
  })
  return serialize(row)
}

export type UpdateSettingsInput = {
  communeName?: string
  serviceTitle?: string
  publicHotline?: string
  internalHotline?: string | null
  publicEmail?: string
  address?: string
  openingHours?: string
}

/**
 * Update the singleton. Upsert so the row appears even if getSettings was
 * never called. Audits as `settings.update` with the changed-keys list
 * (we deliberately don't log the new values into AuditEvent.details to
 * keep the audit log shorter; the `updatedAt` plus the row state are
 * enough for forensics).
 */
export async function updateSettings(input: UpdateSettingsInput, userId: string) {
  const data: Prisma.SettingUpdateInput = {}
  if (input.communeName !== undefined) data.communeName = input.communeName
  if (input.serviceTitle !== undefined) data.serviceTitle = input.serviceTitle
  if (input.publicHotline !== undefined) data.publicHotline = input.publicHotline
  if (input.internalHotline !== undefined) data.internalHotline = input.internalHotline
  if (input.publicEmail !== undefined) data.publicEmail = input.publicEmail
  if (input.address !== undefined) data.address = input.address
  if (input.openingHours !== undefined) data.openingHours = input.openingHours

  const row = await prisma.setting.upsert({
    where: { id: SETTING_ID },
    update: data,
    create: { id: SETTING_ID, ...DEFAULTS, ...input },
  })

  try {
    await prisma.auditEvent.create({
      data: {
        category: 'SETTINGS',
        action: 'settings.update',
        target: SETTING_ID,
        userId,
        details: { keys: Object.keys(input) } as Prisma.InputJsonValue,
      },
    })
  } catch {
    /* never let audit failures block the save */
  }

  return serialize(row)
}
