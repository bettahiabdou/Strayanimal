import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import { pinoHttp } from 'pino-http'
import { env, corsOrigins } from './lib/env.js'
import { logger } from './lib/logger.js'
import { prisma } from './lib/db.js'

const app = express()

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin / curl (no Origin header) and listed origins
      if (!origin || corsOrigins.includes(origin) || corsOrigins.includes('*')) {
        cb(null, true)
      } else {
        cb(new Error(`Origin ${origin} not allowed by CORS`))
      }
    },
    credentials: true,
  }),
)

app.use(express.json({ limit: '1mb' }))
app.use(pinoHttp({ logger }))

// ───── Health check (used by Render and uptime monitors)
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', db: 'ok', uptime: process.uptime() })
  } catch (err) {
    logger.error({ err }, 'health check failed')
    res.status(503).json({ status: 'degraded', db: 'down' })
  }
})

// ───── 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  })
})

// ───── Centralised error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'unhandled error')
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Une erreur est survenue.' },
  })
})

const server = app.listen(env.PORT, () => {
  logger.info(`✅ API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`)
  logger.info(`   CORS origins: ${corsOrigins.join(', ')}`)
})

// ───── Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down…`)
  server.close()
  await prisma.$disconnect()
  process.exit(0)
}
process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
