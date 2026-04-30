import { SignJWT, jwtVerify, errors as joseErrors } from 'jose'
import { randomBytes, createHash } from 'node:crypto'
import type { UserRole } from '@prisma/client'
import { env } from './env.js'

/* ─────── Access token (short-lived JWT) ─────── */

export type AccessPayload = {
  sub: string // user id
  email: string
  role: UserRole
  name: string
}

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET)
// JWT_REFRESH_SECRET is reserved for a future signed-refresh-token strategy.
// We currently use opaque-token + DB hash, so it isn't needed for verify.
void env.JWT_REFRESH_SECRET

export async function signAccessToken(payload: AccessPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_TTL)
    .sign(accessSecret)
}

export async function verifyAccessToken(token: string): Promise<AccessPayload> {
  try {
    const { payload } = await jwtVerify(token, accessSecret)
    return payload as unknown as AccessPayload
  } catch (err) {
    if (err instanceof joseErrors.JOSEError) {
      throw new InvalidTokenError(err.code ?? 'INVALID_TOKEN')
    }
    throw err
  }
}

/* ─────── Refresh token (opaque, hashed in DB) ─────── */

/**
 * Generate a new refresh token: a random opaque string we send to the client,
 * and a SHA-256 hash we persist. We never store the raw token server-side.
 */
export function generateRefreshToken(): { raw: string; hash: string } {
  const raw = randomBytes(48).toString('base64url')
  const hash = createHash('sha256').update(raw).digest('hex')
  return { raw, hash }
}

export function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

/**
 * Convert "30d" / "12h" / "15m" → milliseconds. Used to set the cookie
 * Max-Age and the DB expiresAt.
 */
export function ttlToMs(ttl: string): number {
  const m = ttl.match(/^(\d+)([smhd])$/)
  if (!m) throw new Error(`Invalid TTL: ${ttl}`)
  const n = Number(m[1])
  switch (m[2]) {
    case 's':
      return n * 1000
    case 'm':
      return n * 60_000
    case 'h':
      return n * 3_600_000
    case 'd':
      return n * 86_400_000
    default:
      throw new Error(`Invalid TTL unit: ${m[2]}`)
  }
}

export class InvalidTokenError extends Error {
  constructor(public code: string) {
    super('Invalid token')
    this.name = 'InvalidTokenError'
  }
}
