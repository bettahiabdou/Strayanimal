import type { Request, Response, NextFunction, RequestHandler } from 'express'

/* ─────── Domain errors ─────── */

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad request', details?: unknown) {
    super(400, 'BAD_REQUEST', message, details)
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Authentification requise.') {
    super(401, 'UNAUTHORIZED', message)
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Accès refusé.') {
    super(403, 'FORBIDDEN', message)
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Élément introuvable.') {
    super(404, 'NOT_FOUND', message)
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflict', details?: unknown) {
    super(409, 'CONFLICT', message, details)
  }
}

/* ─────── Async handler wrapper ─────── */

/**
 * Wraps an async route handler so thrown errors hit the central error
 * middleware instead of crashing the process.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
