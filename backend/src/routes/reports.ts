import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../lib/http.js'
import { submitCitizenReport } from '../services/reports.service.js'

export const reportsRouter = Router()

/* ─────────── POST /reports ───────────
 *
 * Public, anonymous citizen submission. No auth required.
 * Photo upload is handled separately (R2 pre-signed URLs) — see Sprint 1.6.
 */

const submitSchema = z.object({
  category: z.enum(['AGGRESSIVE', 'INJURED', 'STRAY']),
  animalType: z.enum(['DOG', 'CAT', 'OTHER']),
  animalCount: z.number().int().positive().max(50).default(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(1).max(500),
  zone: z.string().min(1).max(200),
  comment: z.string().min(1).max(2000),
  citizenName: z.string().max(200).optional(),
  citizenPhone: z.string().max(40).optional(),
  preferredLocale: z.enum(['fr', 'ar']).optional(),
  photoKeys: z.array(z.string()).max(5).optional(),
})

reportsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = submitSchema.parse(req.body)

    const report = await submitCitizenReport({
      ...input,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })

    res.status(201).json({ report })
  }),
)
