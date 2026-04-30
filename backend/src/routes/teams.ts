import { Router } from 'express'
import { asyncHandler } from '../lib/http.js'
import { requireAuth } from '../middleware/auth.js'
import { listActiveTeams } from '../services/teams.service.js'

export const teamsRouter = Router()

/* ─────────── GET /teams ───────────
 *
 * Auth required. Used by the dashboard's assign-to-team dropdown and (later)
 * the team-management screen.
 */
teamsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const teams = await listActiveTeams()
    res.json({ teams })
  }),
)
