import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../lib/http.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { listMyMissions, transitionMission } from '../services/missions.service.js'

export const missionsRouter = Router()

/* ─────────── GET /missions/mine ───────────
 *
 * The logged-in field-team user's mission inbox.
 *   ?scope=active     (default) ASSIGNED, EN_ROUTE, ON_SITE
 *   ?scope=completed  CAPTURED, IMPOSSIBLE
 *
 * ADMIN/SUPERVISOR/AGENT users could in theory query this too, but they
 * have the dashboard for that — keep this route field-team-scoped to make
 * the intent explicit.
 */

const listSchema = z.object({
  scope: z.enum(['active', 'completed']).default('active'),
})

missionsRouter.get(
  '/mine',
  requireAuth,
  requireRole('FIELD_TEAM'),
  asyncHandler(async (req, res) => {
    const q = listSchema.parse(req.query)
    const result = await listMyMissions(req.user!.sub, q.scope)
    res.json(result)
  }),
)

/* ─────────── POST /missions/:id/transition ───────────
 *
 * Move the mission along the state machine. Body:
 *   { to: 'EN_ROUTE' | 'ON_SITE' | 'CAPTURED' | 'IMPOSSIBLE',
 *     fieldNote?: string,
 *     photo?: dataUrl }
 *
 * Service layer enforces:
 *   - the user belongs to the mission's team
 *   - the transition is legal from the current status
 *   - on terminal status: cascade to Report + compute duration + insert
 *     POST_INTERVENTION photo if provided.
 */

const transitionSchema = z.object({
  to: z.enum(['EN_ROUTE', 'ON_SITE', 'CAPTURED', 'IMPOSSIBLE']),
  fieldNote: z.string().max(2000).optional(),
  photo: z
    .string()
    .regex(/^data:image\/(jpeg|png|webp);base64,/)
    .optional(),
})

missionsRouter.post(
  '/:id/transition',
  requireAuth,
  requireRole('FIELD_TEAM'),
  asyncHandler(async (req, res) => {
    const body = transitionSchema.parse(req.body)
    const id = req.params.id ?? ''
    const mission = await transitionMission({
      missionId: id,
      userId: req.user!.sub,
      to: body.to,
      fieldNote: body.fieldNote,
      photo: body.photo,
    })
    res.json({ mission })
  }),
)
