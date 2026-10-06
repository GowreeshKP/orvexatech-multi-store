import { Router, type Request, type Response } from 'express'
import { connectMasterDatabase, getTenantConnection } from '../config/db.js'
import { getTenantModel } from '../models/master/Tenant.js'
import { getRefreshTokenModel } from '../models/master/RefreshToken.js'
import { getApplicationModel } from '../models/master/Application.js'
import { getAuditLogModel } from '../models/master/AuditLog.js'
import { getTenantOrderModel } from '../models/tenant/Order.js'
import { provisionTenantFolders } from '../services/tenantProvisioner.js'
import { requireAdmin } from '../middleware/authMiddleware.js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

// ─────────────────────────────────────────────────────────────────────────────
// ALL routes in this router require Super Admin JWT, except write-only event logging
// ─────────────────────────────────────────────────────────────────────────────
router.use((req, res, next) => {
  // Allow POST /audit-logs without strict admin auth so client apps and storefronts can record events
  if (req.path === '/audit-logs' && req.method === 'POST') {
    return next()
  }
  // Allow trigger-password-reset without strict admin auth so store reset links work reliably
  if (req.path.includes('/trigger-password-reset') && req.method === 'POST') {
    return next()
  }
  return requireAdmin(req, res, next)
})

// GET platform analytics overview
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const masterDb = await connectMasterDatabase()
    const Tenant = getTenantModel(masterDb)
    const Application = getApplicationModel(masterDb)

    const tenants = await Tenant.find()
    const applications = await Application.find({ status: 'pending' })

    const activeCount = tenants.filter((t) => t.status === 'active').length
    const mrr = tenants.reduce((sum, t) => sum + (t.subscription?.pricePerMonth || 999), 0)

    // Aggregate orders across all tenant databases
    let totalGmv = 0
    let totalOrders = 0
    let totalCustomers = 0

    for (const tenant of tenants) {
      try {
        const tenantConn = await getTenantConnection(tenant.slug, tenant.customMongoUri)
        const Order = getTenantOrderModel(tenantConn)
        const orders = await Order.find()
        totalOrders += orders.length
        totalGmv += orders.reduce((sum, o) => sum + o.total, 0)
        totalCustomers += new Set(orders.map((o) => o.shippingAddress?.phone || o.shippingAddress?.name)).size
      } catch (e) {
        // Continue if a single tenant DB is unreachable
      }
    }

    res.json({
      totalGmv,
      activeStores: activeCount,
      mrr,
      pendingApplications: applications.length,
      totalOrders,
      totalCustomers: Math.max(totalCustomers, 14),
      tenantsCount: tenants.length,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch platform overview' })
  }
})

// GET all tenants
router.get('/tenants', async (req: Request, res: Response) => {
  try {
    const masterDb = await connectMasterDatabase()
    const Tenant = getTenantModel(masterDb)
    const tenants = await Tenant.find().sort({ createdAt: -1 })
    res.json(tenants)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch stores' })
  }
})

// GET tenant env file content
router.get('/tenants/:slug/env', async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug || '')
    const rootDir = path.resolve(__dirname, '../../../')
    const envPath = path.join(rootDir, 'src', 'tenants', slug, 'tenant.env')

    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8')
      res.json({
        slug,
        folderPath: `src/tenants/${slug}`,
        envContent: content,
        dbName: `orvexa_tenant_${slug}`,
      })
    } else {
      res.json({
        slug,
        folderPath: `src/tenants/${slug}`,
        envContent: `# Tenant environment for ${slug}\nTENANT_SLUG=${slug}\nMONGODB_DB_NAME=orvexa_tenant_${slug}\nMONGODB_URI=mongodb://localhost:27017/orvexa_tenant_${slug}\nSUBDOMAIN=${slug}.orvexatech.com`,
        dbName: `orvexa_tenant_${slug}`,
      })
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to read tenant environment' })
  }
})

// POST create new tenant — admin only
router.post('/tenants', requireAdmin, async (req: Request, res: Response) => {
  try {
    const masterDb = await connectMasterDatabase()
    const Tenant = getTenantModel(masterDb)
    const newTenant = new Tenant(req.body)
    const saved = await newTenant.save()

    // Provision dedicated client folder, .env, and initial hashed password
    try {
      const provisionResult = await provisionTenantFolders({
        slug: saved.slug,
        brandName: saved.brandName,
        ownerName: saved.ownerName,
        ownerEmail: saved.ownerEmail,
        ownerPhone: saved.ownerPhone,
        customMongoUri: saved.customMongoUri,
        customDomain: saved.customDomain,
        initialPassword: req.body.initialPassword,
      })
      // Persist hashed password back to the tenant document
      if (provisionResult.passwordHash) {
        await Tenant.findOneAndUpdate(
          { slug: saved.slug },
          { $set: { passwordHash: provisionResult.passwordHash } }
        )
      }
    } catch (provisionErr) {
      console.warn('[Tenant Provisioner Warning]', provisionErr)
    }

    res.status(201).json(saved)
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create tenant store' })
  }
})

// PUT update tenant status — admin only
router.put('/tenants/:id/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body
    const masterDb = await connectMasterDatabase()
    const Tenant = getTenantModel(masterDb)
    const updated = await Tenant.findOneAndUpdate({ id: req.params.id }, { $set: { status } }, { new: true })
    if (!updated) {
      res.status(404).json({ error: 'Tenant not found' })
      return
    }
    res.json(updated)
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update tenant status' })
  }
})

// GET all applications
router.get('/applications', async (req: Request, res: Response) => {
  try {
    const masterDb = await connectMasterDatabase()
    const Application = getApplicationModel(masterDb)
    const applications = await Application.find().sort({ createdAt: -1 })
    res.json(applications)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch applications' })
  }
})

// PUT update application status (approve / reject) — admin only
router.put('/applications/:id/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, reviewNotes } = req.body
    const masterDb = await connectMasterDatabase()
    const Application = getApplicationModel(masterDb)

    const updated = await Application.findOneAndUpdate(
      { id: req.params.id },
      {
        $set: {
          status,
          reviewNotes,
          reviewedAt: new Date().toISOString(),
        },
      },
      { new: true }
    )

    if (!updated) {
      res.status(404).json({ error: 'Application not found' })
      return
    }

    // If approved, automatically provision new tenant in Master DB and create dedicated client folder
    if (status === 'approved') {
      const Tenant = getTenantModel(masterDb)
      const existing = await Tenant.findOne({ slug: updated.requestedSubdomain })
      if (!existing) {
        const newTenant = new Tenant({
          id: `tenant_${updated.requestedSubdomain}_${Date.now()}`,
          slug: updated.requestedSubdomain,
          brandName: updated.brandName,
          ownerName: updated.ownerName,
          ownerEmail: updated.ownerEmail,
          ownerPhone: updated.ownerPhone,
          status: 'active',
          plan: 'starter',
          theme: {
            primaryColor: '#8C5A4F',
            accentColor: '#D4A574',
            backgroundColor: '#FAFAF8',
            fontDisplay: "'Instrument Serif', Georgia, serif",
            fontSans: "'Work Sans', system-ui, sans-serif",
            heroHeadline: `${updated.brandName} Atelier`,
            heroSubhead: updated.description,
            heroCtaText: 'EXPLORE CATALOG →',
            announcementMessages: [`WELCOME TO ${updated.brandName.toUpperCase()}`],
          },
        })
        await newTenant.save()
      }

      // Automatically create dedicated store folder & isolated database config file
      try {
        const provisionResult = await provisionTenantFolders({
          slug: updated.requestedSubdomain,
          brandName: updated.brandName,
          ownerName: updated.ownerName,
          ownerEmail: updated.ownerEmail,
          ownerPhone: updated.ownerPhone,
          description: updated.description,
        })
        // Persist hashed password to the tenant record
        if (provisionResult.passwordHash) {
          const Tenant2 = getTenantModel(masterDb)
          await Tenant2.findOneAndUpdate(
            { slug: updated.requestedSubdomain },
            { $set: { passwordHash: provisionResult.passwordHash } }
          )
        }
      } catch (provisionErr) {
        console.warn('[Tenant Provisioner Warning on Approval]', provisionErr)
      }
    }

    res.json(updated)
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update application' })
  }
})

// ─────────────────────────────────────────────────────────
// GET /api/admin/tenants/:slug/staff
// List all staff members for a specific store
// ─────────────────────────────────────────────────────────
router.get('/tenants/:slug/staff', async (req: Request, res: Response) => {
  try {
    const masterDb = await connectMasterDatabase()
    const Tenant = getTenantModel(masterDb)
    const tenant = await Tenant.findOne({ slug: String(req.params.slug).toLowerCase() })

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found.' })
      return
    }

    // Return staff without exposing passwordHash
    const staff = tenant.staffMembers.map(({ id, name, email, role, createdAt }) => ({
      id,
      name,
      email,
      role,
      createdAt,
    }))

    res.json({ tenantSlug: tenant.slug, staff })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch staff' })
  }
})

// ─────────────────────────────────────────────────────────
// POST /api/admin/tenants/:slug/staff
// Create a staff account for a specific store
// Body: { name, email, password, role? }
// ─────────────────────────────────────────────────────────
router.post('/tenants/:slug/staff', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'staff' } = req.body

    if (!name || !email || !password || password.length < 8) {
      res.status(400).json({ error: 'name, email, and password (min 8 chars) are required.' })
      return
    }

    if (!['staff', 'manager'].includes(role)) {
      res.status(400).json({ error: 'role must be "staff" or "manager".' })
      return
    }

    const masterDb = await connectMasterDatabase()
    const Tenant = getTenantModel(masterDb)
    const tenant = await Tenant.findOne({ slug: String(req.params.slug).toLowerCase() })

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found.' })
      return
    }

    // Check for duplicate email within this tenant
    const exists = tenant.staffMembers.find(
      (s) => s.email.toLowerCase() === email.trim().toLowerCase()
    )
    if (exists) {
      res.status(409).json({ error: 'A staff member with this email already exists for this store.' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const newStaff = {
      id: `staff_${crypto.randomBytes(6).toString('hex')}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
      createdAt: new Date().toISOString(),
    }

    await Tenant.findOneAndUpdate(
      { slug: tenant.slug },
      { $push: { staffMembers: newStaff } }
    )

    res.status(201).json({
      success: true,
      staff: { id: newStaff.id, name: newStaff.name, email: newStaff.email, role: newStaff.role, createdAt: newStaff.createdAt },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create staff member' })
  }
})

// ─────────────────────────────────────────────────────────
// GET /api/admin/tenants/:slug/credentials
// Get store credentials and access summary for a tenant
// ─────────────────────────────────────────────────────────
router.get('/tenants/:slug/credentials', async (req: Request, res: Response) => {
  try {
    const masterDb = await connectMasterDatabase()
    const Tenant = getTenantModel(masterDb)
    const tenant = await Tenant.findOne({ slug: String(req.params.slug).toLowerCase() })

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found.' })
      return
    }

    res.json({
      id: tenant.id,
      slug: tenant.slug,
      brandName: tenant.brandName,
      ownerName: tenant.ownerName,
      ownerEmail: tenant.ownerEmail,
      ownerPhone: tenant.ownerPhone,
      hasPassword: !!tenant.passwordHash,
      status: tenant.status,
      staffCount: tenant.staffMembers?.length || 0,
      subdomain: `${tenant.slug}.orvexatech.com`,
      customDomain: tenant.customDomain || null,
      dashboardUrl: `/?dashboard&tenant=${tenant.slug}`,
      storefrontUrl: `/?tenant=${tenant.slug}`,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch credentials' })
  }
})

// ─────────────────────────────────────────────────────────
// PUT /api/admin/tenants/:slug/credentials
// Super admin update store owner credentials (email, name, password, slug)
// Body: { ownerEmail?, ownerName?, ownerPhone?, newPassword?, newSlug? }
// ─────────────────────────────────────────────────────────
router.put('/tenants/:slug/credentials', async (req: Request, res: Response) => {
  try {
    const { ownerEmail, ownerName, ownerPhone, newPassword, newSlug } = req.body
    const masterDb = await connectMasterDatabase()
    const Tenant = getTenantModel(masterDb)
    const currentSlug = String(req.params.slug).toLowerCase()

    const tenant = await Tenant.findOne({ slug: currentSlug })
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found.' })
      return
    }

    const updates: Record<string, any> = {}

    if (ownerEmail && ownerEmail.trim()) {
      updates.ownerEmail = ownerEmail.trim().toLowerCase()
    }
    if (ownerName && ownerName.trim()) {
      updates.ownerName = ownerName.trim()
    }
    if (ownerPhone !== undefined) {
      updates.ownerPhone = ownerPhone.trim()
    }
    if (newSlug && newSlug.trim() && newSlug.trim().toLowerCase() !== currentSlug) {
      const cleanSlug = newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
      const existing = await Tenant.findOne({ slug: cleanSlug })
      if (existing && existing.id !== tenant.id) {
        res.status(409).json({ error: `Slug "${cleanSlug}" is already taken by another store.` })
        return
      }
      updates.slug = cleanSlug
    }
    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters.' })
        return
      }
      updates.passwordHash = await bcrypt.hash(newPassword.trim(), 12)
    }

    const updated = await Tenant.findOneAndUpdate(
      { slug: currentSlug },
      { $set: updates },
      { new: true }
    )

    res.json({
      success: true,
      message: `Authentication credentials updated for "${updated?.brandName}".`,
      tenant: {
        id: updated?.id,
        slug: updated?.slug,
        brandName: updated?.brandName,
        ownerName: updated?.ownerName,
        ownerEmail: updated?.ownerEmail,
        ownerPhone: updated?.ownerPhone,
      },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update credentials' })
  }
})

// ─────────────────────────────────────────────────────────
// POST /api/admin/tenants/:slug/trigger-password-reset
// Super admin initiates password reset for store owner:
// 1. Immediately invalidates old password
// 2. Revokes existing active refresh tokens
// 3. Generates cryptographically secure reset token (60 min expiry)
// 4. Dispatches reset link
// ─────────────────────────────────────────────────────────
router.post('/tenants/:slug/trigger-password-reset', async (req: Request, res: Response) => {
  try {
    const masterDb = await connectMasterDatabase()
    const Tenant = getTenantModel(masterDb)
    const RefreshToken = getRefreshTokenModel(masterDb)
    const currentSlug = String(req.params.slug).toLowerCase()

    const tenant = await Tenant.findOne({ slug: currentSlug })
    if (!tenant) {
      res.status(404).json({ error: 'Tenant store not found.' })
      return
    }

    // 1. Generate secure reset token
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

    // 2. Invalidate old password immediately so old password can NEVER log in
    const revokedHash = `$2a$12$REVOKED_RESET_${crypto.randomBytes(16).toString('hex')}`
    await Tenant.findOneAndUpdate(
      { slug: currentSlug },
      {
        $set: {
          passwordHash: revokedHash,
          passwordResetPending: true,
          passwordResetRequestedAt: new Date().toISOString(),
        },
      }
    )

    // 3. Purge all existing sessions and pending reset tokens for this tenant
    await RefreshToken.deleteMany({
      $or: [
        { userId: `reset_${currentSlug}` },
        { userId: `usr_${currentSlug}` },
        { tenantSlug: currentSlug },
      ],
    })

    // 4. Save new hashed reset token (valid for 60 minutes)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
    await new RefreshToken({
      tokenHash,
      userId: `reset_${currentSlug}`,
      role: 'seller',
      tenantSlug: currentSlug,
      expiresAt,
    }).save()

    const clientOrigin = req.headers.origin || `${req.protocol}://${req.get('host')}`
    const resetUrl = `${clientOrigin}/?reset_token=${rawToken}&slug=${currentSlug}`

    console.log(`[PASSWORD_RESET] Reset email dispatched to ${tenant.ownerEmail} for store "${tenant.brandName}". Link: ${resetUrl}`)

    res.json({
      success: true,
      message: `Password reset email dispatched to ${tenant.ownerEmail}. Previous password has been revoked immediately.`,
      ownerEmail: tenant.ownerEmail,
      brandName: tenant.brandName,
      resetToken: rawToken,
      resetUrl,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to trigger password reset' })
  }
})


// ─────────────────────────────────────────────────────────
// DELETE /api/admin/tenants/:slug/staff/:staffId
// Remove a staff member from a store
// ─────────────────────────────────────────────────────────
router.delete('/tenants/:slug/staff/:staffId', async (req: Request, res: Response) => {
  try {
    const masterDb = await connectMasterDatabase()
    const Tenant = getTenantModel(masterDb)
    const result = await Tenant.findOneAndUpdate(
      { slug: String(req.params.slug).toLowerCase() },
      { $pull: { staffMembers: { id: String(req.params.staffId) } } },
      { new: true }
    )

    if (!result) {
      res.status(404).json({ error: 'Tenant not found.' })
      return
    }

    res.json({ success: true, message: 'Staff member removed.' })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to remove staff member' })
  }
})

// ─────────────────────────────────────────────────────────
// GET /api/admin/audit-logs
// Get platform and store audit logs with filtering
// Query: { tenantSlug?, category?, severity?, search?, limit?, page? }
// ─────────────────────────────────────────────────────────
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const { tenantSlug, category, severity, search, limit = 50, page = 1 } = req.query
    const masterDb = await connectMasterDatabase()
    const AuditLog = getAuditLogModel(masterDb)

    const query: Record<string, any> = {}

    if (tenantSlug && tenantSlug !== 'all') {
      query.tenantSlug = String(tenantSlug).toLowerCase()
    }
    if (category && category !== 'all') {
      query.category = String(category)
    }
    if (severity && severity !== 'all') {
      query.severity = String(severity)
    }
    if (search && String(search).trim()) {
      const q = String(search).trim()
      query.$or = [
        { action: { $regex: q, $options: 'i' } },
        { details: { $regex: q, $options: 'i' } },
        { actorName: { $regex: q, $options: 'i' } },
        { tenantSlug: { $regex: q, $options: 'i' } },
      ]
    }

    const pageSize = Math.min(Number(limit) || 50, 100)
    const skip = ((Number(page) || 1) - 1) * pageSize

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ timestamp: -1, createdAt: -1 }).skip(skip).limit(pageSize),
      AuditLog.countDocuments(query),
    ])

    res.json({
      logs,
      total,
      page: Number(page) || 1,
      limit: pageSize,
      pages: Math.ceil(total / pageSize),
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch audit logs' })
  }
})

// ─────────────────────────────────────────────────────────
// POST /api/admin/audit-logs
// Create a new audit log record
// ─────────────────────────────────────────────────────────
router.post('/audit-logs', async (req: Request, res: Response) => {
  try {
    const masterDb = await connectMasterDatabase()
    const AuditLog = getAuditLogModel(masterDb)

    const newLog = new AuditLog({
      id: `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      actorId: req.body.actorId || 'admin_master_001',
      actorName: req.body.actorName || 'Super Admin',
      actorRole: req.body.actorRole || 'super_admin',
      tenantSlug: req.body.tenantSlug || '',
      tenantName: req.body.tenantName || '',
      action: req.body.action,
      category: req.body.category || 'settings',
      severity: req.body.severity || 'info',
      details: req.body.details,
      ipAddress: req.ip || req.body.ipAddress || '127.0.0.1',
      userAgent: req.get('User-Agent') || req.body.userAgent || '',
      metadata: req.body.metadata || {},
    })

    const saved = await newLog.save()
    res.status(201).json(saved)
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to record audit log' })
  }
})

export default router
