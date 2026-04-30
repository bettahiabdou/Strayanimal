import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../lib/http.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { getSettings, updateSettings } from '../services/settings.service.js'

export const settingsRouter = Router()

/* ─────────── GET /settings ───────────
 *
 * PUBLIC. The citizen site reads this on load to render the hotline,
 * email, address, and hours. No auth — these values are by definition
 * the public face of the commune.
 */

settingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const settings = await getSettings()
    res.json({ settings })
  }),
)

/* ─────────── PATCH /settings ───────────
 *
 * Auth required (ADMIN / SUPERVISOR). Partial update: only the keys
 * present in the body are touched. Empty strings on optional fields
 * (internalHotline) clear them.
 */

const updateSchema = z.object({
  communeName: z.string().min(1).max(200).optional(),
  serviceTitle: z.string().min(1).max(200).optional(),
  publicHotline: z.string().min(1).max(40).optional(),
  internalHotline: z.string().max(40).nullable().optional(),
  publicEmail: z.string().email().max(200).optional(),
  address: z.string().min(1).max(500).optional(),
  openingHours: z.string().min(1).max(2000).optional(),
})

settingsRouter.patch(
  '/',
  requireAuth,
  requireRole('ADMIN', 'SUPERVISOR'),
  asyncHandler(async (req, res) => {
    const body = updateSchema.parse(req.body ?? {})
    const settings = await updateSettings(
      {
        ...body,
        // Normalise empty strings on optional fields → null.
        ...(body.internalHotline === '' ? { internalHotline: null } : {}),
      },
      req.user!.sub,
    )
    res.json({ settings })
  }),
)
