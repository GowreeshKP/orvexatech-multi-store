// --- JWT Authentication & Authorization Middleware ---
// Provides token verification and role/tenant-scoped access control

import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'orvexatech_super_secure_jwt_secret_2026'

export interface JwtPayload {
  userId: string
  email: string
  role: 'seller' | 'super_admin'
  tenantId?: string
  tenantSlug?: string
  brandName?: string
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
    req.authUser = decoded
    next()
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Session expired. Please log in again.' })
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
// Require that the authenticated seller owns the requested tenant.
// Super admins bypass this check (platform-level access).
// Must be used AFTER requireSeller and AFTER tenantResolver.
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
// Utility: issue a signed JWT
// ─────────────────────────────────────────────────────────
export function signToken(payload: JwtPayload, expiresIn: string = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions)
}
