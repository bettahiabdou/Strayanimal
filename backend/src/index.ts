import express, { type Request, type Response } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { pinoHttp } from 'pino-http'
import { env, corsOrigins } from './lib/env.js'
import { logger } from './lib/logger.js'
import { prisma } from './lib/db.js'
import { authRouter } from './routes/auth.js'
import { reportsRouter } from './routes/reports.js'
import { mediaRouter } from './routes/media.js'
import { teamsRouter } from './routes/teams.js'
import { missionsRouter } from './routes/missions.js'
import { errorHandler } from './middleware/error.js'

const app = express()

// Trust proxy headers (Render is behind a proxy → req.ip needs this)
app.set('trust proxy', 1)

app.use(
  cors({
    origin: (origin, cb) => {
      // No origin (curl, server-to-server): allow.
      if (!origin) return cb(null, true)

      // Wildcard or exact match.
      if (corsOrigins.includes('*') || corsOrigins.includes(origin)) {
        return cb(null, true)
      }

      // Mismatch: don't throw (would 500 the preflight). Return false so cors
      // responds without ACAO headers — the browser will block, with a clear
      // CORS error (not a 500), and we log enough context to fix it fast.
      logger.warn(
        { origin, allowed: corsOrigins },
        'CORS origin rejected — check CORS_ORIGINS env var',
      )
      cb(null, false)
    },
    credentials: true,
  }),
)

// Body limit bumped to 5mb to accommodate base64-encoded citizen photos
// (clients resize to ~1280px JPEG q0.8 → typically <300kb after base64 inflation).
app.use(express.json({ limit: '5mb' }))
app.use(cookieParser())
app.use(pinoHttp({ logger }))

/* ───────── Health (used by Render and uptime monitors) */
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', db: 'ok', uptime: process.uptime() })
  } catch (err) {
    logger.error({ err }, 'health check failed')
    res.status(503).json({ status: 'degraded', db: 'down' })
  }
})

/* ───────── API routes */
app.use('/auth', authRouter)
app.use('/reports', reportsRouter)
app.use('/teams', teamsRouter)
app.use('/missions', missionsRouter)
app.use('/media', mediaRouter)

/* ───────── 404 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  })
})

/* ───────── Centralised error handler (must be last) */
app.use(errorHandler)

const server = app.listen(env.PORT, () => {
  logger.info(`✅ API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`)
  logger.info(`   CORS origins: ${corsOrigins.join(', ')}`)
})

/* ───────── Graceful shutdown */
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down…`)
  server.close()
  await prisma.$disconnect()
  process.exit(0)
}
process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
