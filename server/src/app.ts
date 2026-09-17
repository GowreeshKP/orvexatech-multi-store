// --- Orvexa Tech Express Application ---
// Pure app configuration — no listen() call so it can be used
// both by the local dev server (index.ts) and the Vercel serverless handler (api/index.ts)

import express, { type Request, type Response } from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import masterRoutes from './routes/masterRoutes.js'
import storeRoutes from './routes/storeRoutes.js'
import authRoutes from './routes/authRoutes.js'

export function createApp() {
  const app = express()

  // Allowed origins — extend via CORS_ORIGIN env var (comma-separated)
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:8443')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          callback(null, true)
        } else {
          callback(new Error(`CORS: origin "${origin}" not allowed`))
        }
      },
      credentials: true,
    })
  )

  // Global rate limit — 200 requests / 15 min per IP
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please slow down and try again later.' },
  })

  // Stricter limit on auth endpoints — 10 attempts / 15 min per IP
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please wait 15 minutes before trying again.' },
  })

  app.use(globalLimiter)
  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ extended: true, limit: '50mb' }))

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      platform: 'Orvexa Tech Multi-Tenant Engine',
      timestamp: new Date().toISOString(),
      runtime: process.env.VERCEL ? 'vercel-serverless' : 'node',
    })
  })

  // Route groups
  app.use('/api/auth', authLimiter, authRoutes)
  app.use('/api/admin', masterRoutes)
  app.use('/api/stores/:tenantSlug', storeRoutes)

  // Fallback error handler
  app.use((err: any, _req: Request, res: Response, _next: any) => {
    console.error('[Server Error]:', err)
    res.status(500).json({ error: err.message || 'Internal Server Error' })
  })

  return app
}

// Singleton instance — re-used across warm serverless invocations
export const app = createApp()
export default app
