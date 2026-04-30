import type { Request, Response, NextFunction } from 'express'
import type { UserRole } from '@prisma/client'
import { verifyAccessToken, type AccessPayload } from '../lib/jwt.js'
import { ForbiddenError, UnauthorizedError } from '../lib/http.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessPayload
    }
  }
}

/**
 * Require a valid access token. Decorates req.user.
 * Public routes don't use this; protected routes mount it as middleware.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token manquant.')
    }
    const token = header.slice('Bearer '.length).trim()
    const payload = await verifyAccessToken(token)
    req.user = payload
    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Restrict to a list of roles. Use AFTER requireAuth.
 *   router.get('/admin-thing', requireAuth, requireRole('ADMIN'), handler)
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError())
    if (!roles.includes(req.user.role)) return next(new ForbiddenError())
    next()
  }
}
