// --- Authentication API Routes ---
// Real bcrypt password verification + JWT issuance for sellers and super admins

import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { connectMasterDatabase } from '../config/db.js'
import { getTenantModel } from '../models/master/Tenant.js'
import { getAdminUserModel } from '../models/master/AdminUser.js'
import { signToken } from '../middleware/authMiddleware.js'

const router = Router()

// ─────────────────────────────────────────────────────────
// POST /api/auth/seller/login
// Merchant login — verifies bcrypt password, issues JWT
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

    // Verify password against bcrypt hash
    if (!tenant.passwordHash) {
      // No password set yet — first-time login setup not complete
      res.status(401).json({ error: 'Account password not configured. Please contact your platform admin.' })
      return
    }

    const isValid = await bcrypt.compare(cleanPass, tenant.passwordHash)
    if (!isValid) {
      res.status(401).json({ error: 'Incorrect password.' })
      return
    }

    // Issue JWT
    const token = signToken({
      userId: `usr_${tenant.slug}_${Date.now()}`,
      email: tenant.ownerEmail,
      role: 'seller',
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      brandName: tenant.brandName,
    })

    res.json({
      success: true,
      token,
      session: {
        userId: `usr_${tenant.slug}`,
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
// Platform super admin login — verifies against AdminUser collection
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

    // Update last login timestamp
    await AdminUser.findOneAndUpdate({ _id: adminUser._id }, { $set: { lastLogin: new Date().toISOString() } })

    // Issue JWT with super_admin role
    const token = signToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: 'super_admin',
    })

    res.json({
      success: true,
      token,
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
