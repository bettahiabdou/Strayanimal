import argon2 from 'argon2'
import { prisma } from '../lib/db.js'
import { generateRefreshToken, hashRefreshToken, signAccessToken, ttlToMs } from '../lib/jwt.js'
import { env } from '../lib/env.js'
import { ForbiddenError, UnauthorizedError } from '../lib/http.js'
import { type Prisma, type AuditCategory, type User, type UserRole } from '@prisma/client'

type LoginInput = {
  email: string
  password: string
  ip?: string
  userAgent?: string
}

type AuthSuccess = {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    preferredLocale: string
  }
  accessToken: string
  /** Raw refresh token to set as HttpOnly cookie. Never return this in JSON. */
  refreshToken: string
}

const REFRESH_EXPIRY_MS = () => ttlToMs(env.JWT_REFRESH_TTL)

/* ───────────────────────────── Login ───────────────────────────── */

export async function login({ email, password, ip, userAgent }: LoginInput): Promise<AuthSuccess> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

  if (!user) {
    await audit({ category: 'AUTH', action: 'login.failed', target: email, ip, userAgent })
    throw new UnauthorizedError('Identifiants invalides.')
  }

  if (user.status !== 'ACTIVE') {
    await audit({
      category: 'AUTH',
      action: 'login.blocked',
      target: email,
      userId: user.id,
      ip,
      userAgent,
      details: { status: user.status },
    })
    throw new ForbiddenError('Ce compte est désactivé.')
  }

  const ok = await argon2.verify(user.passwordHash, password)
  if (!ok) {
    await audit({
      category: 'AUTH',
      action: 'login.failed',
      target: email,
      userId: user.id,
      ip,
      userAgent,
    })
    throw new UnauthorizedError('Identifiants invalides.')
  }

  const tokens = await issueTokens(user, { ip, userAgent })

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  await audit({
    category: 'AUTH',
    action: 'login.success',
    userId: user.id,
    ip,
    userAgent,
  })

  return tokens
}

/* ──────────────────────────── Refresh ──────────────────────────── */

export async function refresh({
  rawRefreshToken,
  ip,
  userAgent,
}: {
  rawRefreshToken: string
  ip?: string
  userAgent?: string
}): Promise<AuthSuccess> {
  const tokenHash = hashRefreshToken(rawRefreshToken)
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!stored) throw new UnauthorizedError('Session expirée.')
  if (stored.revokedAt) throw new UnauthorizedError('Session révoquée.')
  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    })
    throw new UnauthorizedError('Session expirée.')
  }
  if (stored.user.status !== 'ACTIVE') {
    throw new ForbiddenError('Compte désactivé.')
  }

  // Rotate: revoke the old token, issue a fresh pair.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  })

  return issueTokens(stored.user, { ip, userAgent })
}

/* ───────────────────────────── Logout ──────────────────────────── */

export async function logout({
  rawRefreshToken,
  userId,
}: {
  rawRefreshToken?: string
  userId?: string
}): Promise<void> {
  if (rawRefreshToken) {
    const tokenHash = hashRefreshToken(rawRefreshToken)
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }
  if (userId) {
    await audit({ category: 'AUTH', action: 'logout', userId })
  }
}

/* ─────────────────────────── Internals ─────────────────────────── */

async function issueTokens(
  user: User,
  ctx: { ip?: string; userAgent?: string },
): Promise<AuthSuccess> {
  const { raw, hash } = generateRefreshToken()
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS())

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hash,
      expiresAt,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    },
  })

  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  })

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferredLocale: user.preferredLocale,
    },
    accessToken,
    refreshToken: raw,
  }
}

async function audit(input: {
  category: AuditCategory
  action: string
  target?: string
  userId?: string
  ip?: string
  userAgent?: string
  details?: Prisma.InputJsonValue
}) {
  try {
    await prisma.auditEvent.create({
      data: {
        category: input.category,
        action: input.action,
        target: input.target,
        userId: input.userId,
        ip: input.ip,
        userAgent: input.userAgent,
        details: input.details,
      },
    })
  } catch {
    // never let audit failures block auth
  }
}
