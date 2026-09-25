// --- Authentication API Routes ---
// Full multi-tenant auth: dual JWT (access 15m + refresh 30d), token rotation,
// explicit logout, self-service password reset, and per-store staff login.

import crypto from 'crypto'
import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { connectMasterDatabase } from '../config/db.js'
import { getTenantModel } from '../models/master/Tenant.js'
import { getAdminUserModel } from '../models/master/AdminUser.js'
import { getRefreshTokenModel } from '../models/master/RefreshToken.js'
import {
  signToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../middleware/authMiddleware.js'

const router = Router()

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

/** SHA-256 hash a raw refresh token before persisting */
function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

/** Build the dual-token response object (access + refresh) */
async function issueTokenPair(
  masterDb: Awaited<ReturnType<typeof connectMasterDatabase>>,
  payload: {
    userId: string
    email: string
    role: 'super_admin' | 'seller' | 'staff'
    tenantId?: string
    tenantSlug?: string
    brandName?: string
  }
) {
  const accessToken = signToken(payload)
  const refreshToken = signRefreshToken(payload)

  // Persist hashed refresh token for revocation support
  const RefreshToken = getRefreshTokenModel(masterDb)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  await new RefreshToken({
    tokenHash: hashToken(refreshToken),
    userId: payload.userId,
    role: payload.role,
    tenantId: payload.tenantId,
    tenantSlug: payload.tenantSlug,
    expiresAt,
  }).save()

  return { accessToken, refreshToken }
}

// ─────────────────────────────────────────────────────────
// POST /api/auth/seller/login
// Merchant login — verifies bcrypt password, issues dual JWT
// ─────────────────────────────────────────────────────────
router.post('/seller/login', async (req: Request, res: Response) => {
  try {
    const { loginId, password } = req.body

    if (!loginId || !password) {
      res.status(400).json({ error: 'Please enter your Login ID and password.' })
      return
    }

    const cleanId = loginId.trim().toLowerCase()
    const cleanPass = password.trim()

    const masterDb = await connectMasterDatabase()
    const Tenant = getTenantModel(masterDb)
    const tenant = await Tenant.findOne({
      $or: [{ ownerEmail: cleanId }, { slug: cleanId }],
    })

    if (!tenant) {
      res.status(401).json({ error: 'No store found with these credentials.' })
      return
    }

    if (tenant.status === 'suspended') {
      res.status(403).json({ error: 'Your store has been suspended. Please contact support.' })
      return
    }

    if (tenant.status === 'pending') {
      res.status(403).json({ error: 'Your store application is still under review.' })
      return
    }

    if (!tenant.passwordHash) {
      res.status(401).json({ error: 'Account password not configured. Please contact your platform admin.' })
      return
    }

    const isValid = await bcrypt.compare(cleanPass, tenant.passwordHash)
    if (!isValid) {
      res.status(401).json({ error: 'Incorrect password.' })
      return
    }

    const userId = `usr_${tenant.slug}`
    const { accessToken, refreshToken } = await issueTokenPair(masterDb, {
      userId,
      email: tenant.ownerEmail,
      role: 'seller',
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      brandName: tenant.brandName,
    })

    res.json({
      success: true,
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      session: {
        userId,
        name: tenant.ownerName || 'Merchant',
        email: tenant.ownerEmail,
        role: 'seller',
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        brandName: tenant.brandName,
        loginTime: new Date().toISOString(),
      },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Authentication error' })
  }
})

// ─────────────────────────────────────────────────────────
// POST /api/auth/admin/login
// Platform super admin login
// ─────────────────────────────────────────────────────────
router.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const { loginId, password } = req.body

    if (!loginId || !password) {
      res.status(400).json({ error: 'Please enter Admin ID and master password.' })
      return
    }

    const cleanId = loginId.trim().toLowerCase()
    const cleanPass = password.trim()

    const masterDb = await connectMasterDatabase()
    const AdminUser = getAdminUserModel(masterDb)
    const adminUser = await AdminUser.findOne({
      $or: [{ email: cleanId }, { id: cleanId }],
    })

    if (!adminUser) {
      res.status(401).json({ error: 'Invalid Super Admin credentials.' })
      return
    }

    const isValid = await bcrypt.compare(cleanPass, adminUser.passwordHash)
    if (!isValid) {
      res.status(401).json({ error: 'Incorrect admin password.' })
      return
    }

    await AdminUser.findOneAndUpdate({ _id: adminUser._id }, { $set: { lastLogin: new Date().toISOString() } })

    const { accessToken, refreshToken } = await issueTokenPair(masterDb, {
      userId: adminUser.id,
      email: adminUser.email,
      role: 'super_admin',
    })

    res.json({
      success: true,
      accessToken,
      refreshToken,
      expiresIn: 900,
      session: {
        userId: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: 'super_admin',
        loginTime: new Date().toISOString(),
      },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Authentication error' })
  }
})

// ─────────────────────────────────────────────────────────
// POST /api/auth/staff/login
// Per-store staff/operator login (Level 3)
// Body: { tenantSlug, email, password }
// ─────────────────────────────────────────────────────────
router.post('/staff/login', async (req: Request, res: Response) => {
  try {
    const { tenantSlug, email, password } = req.body

    if (!tenantSlug || !email || !password) {
      res.status(400).json({ error: 'tenantSlug, email, and password are required.' })
      return
    }

    const masterDb = await connectMasterDatabase()
    const Tenant = getTenantModel(masterDb)
    const tenant = await Tenant.findOne({ slug: tenantSlug.trim().toLowerCase() })

    if (!tenant) {
      res.status(401).json({ error: 'Invalid store or staff credentials.' })
      return
    }

    if (tenant.status !== 'active') {
      res.status(403).json({ error: 'This store is not active.' })
      return
    }

    const staffMember = tenant.staffMembers.find(
      (s) => s.email.toLowerCase() === email.trim().toLowerCase()
    )

    if (!staffMember) {
      res.status(401).json({ error: 'Invalid store or staff credentials.' })
      return
    }

    const isValid = await bcrypt.compare(password.trim(), staffMember.passwordHash)
    if (!isValid) {
      res.status(401).json({ error: 'Invalid store or staff credentials.' })
      return
    }

    const { accessToken, refreshToken } = await issueTokenPair(masterDb, {
      userId: staffMember.id,
      email: staffMember.email,
      role: 'staff',
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      brandName: tenant.brandName,
    })

    res.json({
      success: true,
      accessToken,
      refreshToken,
      expiresIn: 900,
      session: {
        userId: staffMember.id,
        name: staffMember.name,
        email: staffMember.email,
        role: 'staff',
        staffRole: staffMember.role,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        brandName: tenant.brandName,
        loginTime: new Date().toISOString(),
      },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Authentication error' })
  }
})

// ─────────────────────────────────────────────────────────
// POST /api/auth/refresh
// Rotate refresh token — returns new access + refresh token pair.
// Old refresh token is deleted (single-use rotation).
// Body: { refreshToken }
// ─────────────────────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      res.status(400).json({ error: 'refreshToken is required.' })
      return
    }

    // 1. Verify JWT signature and expiry
    let decoded: ReturnType<typeof verifyRefreshToken>
    try {
      decoded = verifyRefreshToken(refreshToken)
    } catch {
      res.status(401).json({ error: 'Invalid or expired refresh token. Please log in again.' })
      return
    }

    // 2. Check token exists in DB (not revoked)
    const masterDb = await connectMasterDatabase()
    const RefreshToken = getRefreshTokenModel(masterDb)
    const tokenHash = hashToken(refreshToken)
    const stored = await RefreshToken.findOne({ tokenHash })

    if (!stored) {
      res.status(401).json({ error: 'Refresh token has been revoked. Please log in again.' })
      return
    }

    // 3. Delete old token (rotation — single use)
    await RefreshToken.deleteOne({ tokenHash })

    // 4. Issue a fresh pair
    const payload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId,
      tenantSlug: decoded.tenantSlug,
      brandName: decoded.brandName,
    }

    const { accessToken, refreshToken: newRefreshToken } = await issueTokenPair(masterDb, payload)

    res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Token refresh failed' })
  }
})

// ─────────────────────────────────────────────────────────
// POST /api/auth/logout
// Revoke a refresh token — effectively ends the session.
// Body: { refreshToken }
// ─────────────────────────────────────────────────────────
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      // Graceful logout even if no token provided
      res.json({ success: true, message: 'Logged out.' })
      return
    }

    const masterDb = await connectMasterDatabase()
    const RefreshToken = getRefreshTokenModel(masterDb)
    await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) })

    res.json({ success: true, message: 'Logged out successfully.' })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Logout failed' })
  }
})

// ─────────────────────────────────────────────────────────
// POST /api/auth/seller/forgot-password
// Generate a time-limited password reset token (15 min).
// In development: token returned in response body.
// In production: send via email (wire up your mailer here).
// Body: { email }
// ─────────────────────────────────────────────────────────
router.post('/seller/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400).json({ error: 'email is required.' })
      return
    }

    const masterDb = await connectMasterDatabase()
    const Tenant = getTenantModel(masterDb)
    const tenant = await Tenant.findOne({ ownerEmail: email.trim().toLowerCase() })

    // Always return 200 to prevent email enumeration
    if (!tenant) {
      res.json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
      })
      return
    }

    // Generate a cryptographically random 6-char reset token (URL-safe)
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = hashToken(rawToken)

    // Store hashed reset token with 15-minute expiry in RefreshToken collection
    // We reuse the RefreshToken model with role='seller' and a special userId prefix
    const RefreshToken = getRefreshTokenModel(masterDb)
    // Remove any existing reset tokens for this user
    await RefreshToken.deleteMany({ userId: `reset_${tenant.slug}` })

    await new RefreshToken({
      tokenHash,
      userId: `reset_${tenant.slug}`,
      role: 'seller',
      tenantSlug: tenant.slug,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    }).save()

    // In production, send rawToken via email here.
    // For development, include it in the response.
    const isDev = !process.env.VERCEL && process.env.NODE_ENV !== 'production'
    res.json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
      ...(isDev && { resetToken: rawToken, note: 'DEV ONLY — do not expose in production' }),
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to initiate password reset' })
  }
})

// ─────────────────────────────────────────────────────────
// POST /api/auth/seller/reset-password
// Verify reset token and apply new password.
// Body: { tenantSlug, resetToken, newPassword }
// ─────────────────────────────────────────────────────────
router.post('/seller/reset-password', async (req: Request, res: Response) => {
  try {
    const { tenantSlug, resetToken, newPassword } = req.body

    if (!tenantSlug || !resetToken || !newPassword) {
      res.status(400).json({ error: 'tenantSlug, resetToken, and newPassword are required.' })
      return
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters.' })
      return
    }

    const masterDb = await connectMasterDatabase()
    const RefreshToken = getRefreshTokenModel(masterDb)
    const tokenHash = hashToken(resetToken)

    const stored = await RefreshToken.findOne({
      tokenHash,
      userId: `reset_${tenantSlug.trim().toLowerCase()}`,
    })

    if (!stored) {
      res.status(401).json({ error: 'Invalid or expired reset token.' })
      return
    }

    if (stored.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ tokenHash })
      res.status(401).json({ error: 'Reset token has expired. Please request a new one.' })
      return
    }

    // Apply new password
    const Tenant = getTenantModel(masterDb)
    const hash = await bcrypt.hash(newPassword, 12)
    await Tenant.findOneAndUpdate(
      { slug: stored.tenantSlug },
      { $set: { passwordHash: hash } }
    )

    // Invalidate reset token and all active refresh tokens for this user
    await RefreshToken.deleteMany({ userId: { $in: [`reset_${tenantSlug}`, `usr_${tenantSlug}`] } })

    res.json({ success: true, message: 'Password updated successfully. Please log in with your new password.' })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reset password' })
  }
})

// ─────────────────────────────────────────────────────────
// POST /api/auth/seller/set-password
// One-time or reset password setup for a merchant (admin-provisioned)
// Requires: { slug, adminKey, newPassword }
// ─────────────────────────────────────────────────────────
router.post('/seller/set-password', async (req: Request, res: Response) => {
  try {
    const { slug, adminKey, newPassword } = req.body
    const ADMIN_KEY = process.env.ADMIN_SETUP_KEY || 'orvexa_setup_2026'

    if (adminKey !== ADMIN_KEY) {
      res.status(403).json({ error: 'Invalid admin setup key.' })
      return
    }

    if (!slug || !newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'slug and newPassword (min 8 chars) are required.' })
      return
    }

    const masterDb = await connectMasterDatabase()
    const Tenant = getTenantModel(masterDb)
    const tenant = await Tenant.findOne({ slug: slug.toLowerCase() })

    if (!tenant) {
      res.status(404).json({ error: `Tenant "${slug}" not found.` })
      return
    }

    const hash = await bcrypt.hash(newPassword, 12)
    await Tenant.findOneAndUpdate({ slug: tenant.slug }, { $set: { passwordHash: hash } })

    res.json({ success: true, message: `Password set for store "${tenant.brandName}".` })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to set password' })
  }
})

// ─────────────────────────────────────────────────────────
// POST /api/auth/admin/bootstrap
// One-time setup to create the initial super admin account.
// Disabled automatically once an admin user exists.
// Requires: { name, email, password, bootstrapKey }
// ─────────────────────────────────────────────────────────
router.post('/admin/bootstrap', async (req: Request, res: Response) => {
  try {
    const BOOTSTRAP_KEY = process.env.ADMIN_BOOTSTRAP_KEY || 'orvexa_bootstrap_2026'
    const { name, email, password, bootstrapKey } = req.body

    if (bootstrapKey !== BOOTSTRAP_KEY) {
      res.status(403).json({ error: 'Invalid bootstrap key.' })
      return
    }

    const masterDb = await connectMasterDatabase()
    const AdminUser = getAdminUserModel(masterDb)
    const existingCount = await AdminUser.countDocuments()

    if (existingCount > 0) {
      res.status(409).json({ error: 'Admin already bootstrapped. Use the admin panel to manage accounts.' })
      return
    }

    if (!email || !password || password.length < 8) {
      res.status(400).json({ error: 'email and password (min 8 chars) required.' })
      return
    }

    const hash = await bcrypt.hash(password, 12)
    const admin = new AdminUser({
      id: `admin_${Date.now()}`,
      name: name || 'Super Admin',
      email: email.trim().toLowerCase(),
      passwordHash: hash,
      role: 'super_admin',
    })

    await admin.save()

    res.status(201).json({ success: true, message: 'Super admin account created. You can now log in.' })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Bootstrap failed' })
  }
})

export default router
