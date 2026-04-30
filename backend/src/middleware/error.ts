import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { HttpError } from '../lib/http.js'
import { InvalidTokenError } from '../lib/jwt.js'
import { logger } from '../lib/logger.js'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // ─── Zod validation errors → 400
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Données invalides.',
        details: err.flatten(),
      },
    })
  }

  // ─── JWT failures → 401
  if (err instanceof InvalidTokenError) {
    return res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'Token invalide ou expiré.' },
    })
  }

  // ─── Domain HttpErrors
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    })
  }

  // ─── Unknown
  logger.error({ err }, 'unhandled error')
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Une erreur est survenue.' },
  })
}
