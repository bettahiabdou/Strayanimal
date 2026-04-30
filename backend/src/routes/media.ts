import { Router } from 'express'
import { asyncHandler, NotFoundError } from '../lib/http.js'
import { prisma } from '../lib/db.js'

export const mediaRouter = Router()

/* ─────────── GET /media/:id ───────────
 *
 * Streams a stored photo's bytes back as the original content type.
 * Public for now (the citizen photo is not sensitive — it's the report).
 * If/when we move sensitive media behind auth, gate this route.
 */
mediaRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id
    const m = await prisma.mediaAsset.findUnique({
      where: { id },
      select: { contentType: true, data: true, url: true },
    })
    if (!m) throw new NotFoundError('Photo introuvable.')

    // Phase 2 escape hatch: external URL, redirect.
    if (!m.data && m.url) {
      res.redirect(302, m.url)
      return
    }
    if (!m.data) throw new NotFoundError('Photo non disponible.')

    res.setHeader('Content-Type', m.contentType)
    // Cache aggressively — content is immutable per id.
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.send(m.data)
  }),
)
