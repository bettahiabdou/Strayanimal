import type { Response, CookieOptions } from 'express'
import { env } from './env.js'
import { ttlToMs } from './jwt.js'

export const REFRESH_COOKIE = 'sa_refresh'

function cookieOptions(): CookieOptions {
  const isProd = env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProd, // required for SameSite=None on prod (Render → Vercel cross-origin)
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: ttlToMs(env.JWT_REFRESH_TTL),
  }
}

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, cookieOptions())
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { ...cookieOptions(), maxAge: 0 })
}
