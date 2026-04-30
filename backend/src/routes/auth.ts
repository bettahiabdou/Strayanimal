import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, UnauthorizedError } from '../lib/http.js'
import { REFRESH_COOKIE, clearRefreshCookie, setRefreshCookie } from '../lib/cookies.js'
import * as auth from '../services/auth.service.js'
import { requireAuth } from '../middleware/auth.js'
import { prisma } from '../lib/db.js'

export const authRouter = Router()

/* ───────────── POST /auth/login ───────────── */

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body)

    const result = await auth.login({
      email,
      password,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })

    setRefreshCookie(res, result.refreshToken)
    res.json({ user: result.user, accessToken: result.accessToken })
  }),
)

/* ───────────── POST /auth/refresh ───────────── */

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE]
    if (!raw) throw new UnauthorizedError('Aucune session.')

    const result = await auth.refresh({
      rawRefreshToken: raw,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })

    setRefreshCookie(res, result.refreshToken)
    res.json({ user: result.user, accessToken: result.accessToken })
  }),
)

/* ───────────── POST /auth/logout ───────────── */

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE]
    // Try to identify the user from the access token, but not required —
    // we still want logout to succeed even if the access token is expired.
    let userId: string | undefined
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) {
      try {
        const { verifyAccessToken } = await import('../lib/jwt.js')
        const payload = await verifyAccessToken(header.slice(7).trim())
        userId = payload.sub
      } catch {
        // ignore — log out anyway
      }
    }

    await auth.logout({ rawRefreshToken: raw, userId })
    clearRefreshCookie(res)
    res.status(204).end()
  }),
)

/* ───────────── GET /auth/me ───────────── */

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        zone: true,
        preferredLocale: true,
        lastLoginAt: true,
      },
    })
    if (!user) throw new UnauthorizedError()
    res.json({ user })
  }),
)
