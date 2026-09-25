import { Router, type Request, type Response } from 'express'
import { connectMasterDatabase, getTenantConnection } from '../config/db.js'
import { getTenantModel } from '../models/master/Tenant.js'
import { getApplicationModel } from '../models/master/Application.js'
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
// ALL routes in this router require Super Admin JWT
// ─────────────────────────────────────────────────────────────────────────────
router.use(requireAdmin)

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

export default router
