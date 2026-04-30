import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, NotFoundError } from '../lib/http.js'
import { requireAuth } from '../middleware/auth.js'
import {
  getReportByRef,
  getReportStats,
  listReports,
  submitCitizenReport,
} from '../services/reports.service.js'

export const reportsRouter = Router()

/* ─────────── POST /reports ───────────
 *
 * Public, anonymous citizen submission. No auth required.
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
  /** photos as data URLs (data:image/jpeg;base64,...). Up to 3 per submission. */
  photos: z
    .array(z.string().regex(/^data:image\/(jpeg|png|webp);base64,/))
    .max(3)
    .optional(),
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

/* ─────────── GET /reports/stats ───────────
 *
 * Auth required. KPIs for the dashboard Overview screen.
 * Mounted before /:publicRef so the literal "stats" doesn't get caught by the param.
 */

reportsRouter.get(
  '/stats',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const stats = await getReportStats()
    res.json({ stats })
  }),
)

/* ─────────── GET /reports ───────────
 *
 * Auth required. Paginated list with optional filters.
 *   ?status=PENDING|APPROVED|...|ALL
 *   ?urgent=true|false
 *   ?zone=Hay Al Wahda
 *   ?search=text
 *   ?page=1&pageSize=25
 */

const listSchema = z.object({
  status: z
    .enum([
      'PENDING',
      'APPROVED',
      'ASSIGNED',
      'IN_PROGRESS',
      'RESOLVED',
      'IMPOSSIBLE',
      'REJECTED',
      'ALL',
    ])
    .optional(),
  urgent: z.enum(['true', 'false']).optional(),
  zone: z.string().max(200).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
})

reportsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const q = listSchema.parse(req.query)
    const result = await listReports({
      status: q.status,
      isUrgent: q.urgent === undefined ? undefined : q.urgent === 'true',
      zone: q.zone,
      search: q.search,
      page: q.page,
      pageSize: q.pageSize,
    })
    res.json(result)
  }),
)

/* ─────────── GET /reports/:publicRef ───────────
 *
 * Auth required. Full report detail (all fields, photos, mission, audit).
 */

reportsRouter.get(
  '/:publicRef',
  requireAuth,
  asyncHandler(async (req, res) => {
    const ref = req.params.publicRef ?? ''
    const report = await getReportByRef(ref)
    if (!report) throw new NotFoundError('Signalement introuvable.')
    res.json({ report })
  }),
)
