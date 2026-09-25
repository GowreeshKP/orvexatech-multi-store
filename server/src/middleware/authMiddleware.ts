// --- JWT Authentication & Authorization Middleware ---
// Provides token verification and role/tenant-scoped access control.
// Access tokens are short-lived (15 min); refresh tokens are long-lived (30 days)
// and stored server-side in the RefreshToken collection for revocation support.

import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'orvexatech_super_secure_jwt_secret_2026'
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'orvexatech_refresh_secret_2026_long_random'

export interface JwtPayload {
  userId: string
  email: string
  role: 'seller' | 'super_admin' | 'staff'
  tenantId?: string
  tenantSlug?: string
  brandName?: string
  /** Distinguishes access tokens from refresh tokens to prevent misuse */
  tokenType?: 'access' | 'refresh'
}

// Extend Express Request with decoded token payload
declare global {
  namespace Express {
    interface Request {
      authUser?: JwtPayload
    }
  }
}

// ─────────────────────────────────────────────────────────
// Core: parse and verify a Bearer token from Authorization header
// ─────────────────────────────────────────────────────────
export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header. Expected: Bearer <token>' })
    return
  }

  const token = authHeader.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    // Reject refresh tokens used as access tokens
    if (decoded.tokenType === 'refresh') {
      res.status(401).json({ error: 'Invalid token type. Use your access token for API requests.' })
      return
    }
    req.authUser = decoded
    next()
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Session expired. Please refresh your session.' })
    } else {
      res.status(401).json({ error: 'Invalid token. Please log in again.' })
    }
  }
}

// ─────────────────────────────────────────────────────────
// Require super_admin role (platform admin panel routes)
// ─────────────────────────────────────────────────────────
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  verifyToken(req, res, () => {
    if (req.authUser?.role !== 'super_admin') {
      res.status(403).json({ error: 'Access denied. Super Admin privileges required.' })
      return
    }
    next()
  })
}

// ─────────────────────────────────────────────────────────
// Require seller role (merchant dashboard routes)
// ─────────────────────────────────────────────────────────
export function requireSeller(req: Request, res: Response, next: NextFunction): void {
  verifyToken(req, res, () => {
    if (req.authUser?.role !== 'seller' && req.authUser?.role !== 'super_admin') {
      res.status(403).json({ error: 'Access denied. Merchant credentials required.' })
      return
    }
    next()
  })
}

// ─────────────────────────────────────────────────────────
// Require staff-level access or above (seller, staff, super_admin)
// Used on store operator routes (packing, dispatch, inventory reads)
// ─────────────────────────────────────────────────────────
export function requireStaff(req: Request, res: Response, next: NextFunction): void {
  verifyToken(req, res, () => {
    const role = req.authUser?.role
    if (role !== 'staff' && role !== 'seller' && role !== 'super_admin') {
      res.status(403).json({ error: 'Access denied. Store staff credentials required.' })
      return
    }
    next()
  })
}

// ─────────────────────────────────────────────────────────
// Require that the authenticated user belongs to the requested tenant.
// Super admins bypass this check (platform-level access).
// Must be used AFTER requireSeller/requireStaff and AFTER tenantResolver.
// ─────────────────────────────────────────────────────────
export function requireTenantAccess(req: Request, res: Response, next: NextFunction): void {
  const user = req.authUser

  // Super admins can access any tenant
  if (user?.role === 'super_admin') {
    next()
    return
  }

  const paramSlug = req.params.tenantSlug || req.tenant?.slug
  if (!paramSlug) {
    res.status(400).json({ error: 'Tenant slug missing from request.' })
    return
  }

  if (user?.tenantSlug !== paramSlug) {
    res.status(403).json({
      error: 'Access denied. You are not authorized to manage this store.',
    })
    return
  }

  next()
}

// ─────────────────────────────────────────────────────────
// Utilities: issue short-lived access token (15m) and
//            long-lived refresh token (30d, signed with separate secret)
// ─────────────────────────────────────────────────────────

/** Issue a short-lived access token (default 15 minutes) */
export function signToken(payload: JwtPayload, expiresIn: string = '15m'): string {
  return jwt.sign({ ...payload, tokenType: 'access' }, JWT_SECRET, { expiresIn } as jwt.SignOptions)
}

/** Issue a long-lived refresh token (default 30 days) signed with a separate secret */
export function signRefreshToken(payload: Omit<JwtPayload, 'tokenType'>, expiresIn: string = '30d'): string {
  return jwt.sign({ ...payload, tokenType: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn } as jwt.SignOptions)
}

/** Verify and decode a refresh token */
export function verifyRefreshToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload
  if (decoded.tokenType !== 'refresh') {
    throw new Error('Invalid token type')
  }
  return decoded
}

