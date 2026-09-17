// --- Multi-Tenant Dynamic Database Resolver Middleware ---
// Intercepts requests, resolves the tenant from Master DB, and connects to the tenant's isolated MongoDB database

import type { Request, Response, NextFunction } from 'express'
import type { Connection, Model } from 'mongoose'
import { connectMasterDatabase, getTenantConnection } from '../config/db.js'
import { getTenantModel, type ITenant } from '../models/master/Tenant.js'
import { getTenantProductModel, type IProduct } from '../models/tenant/Product.js'
import { getTenantOrderModel, type IOrder } from '../models/tenant/Order.js'
import {
  getTenantReviewModel,
  getTenantThemeModel,
  getTenantCustomerModel,
  type IReview,
  type IThemeConfigDoc,
  type ICustomerDoc,
} from '../models/tenant/Review.js'

export interface TenantDbContext {
  connection: Connection
  Product: Model<IProduct>
  Order: Model<IOrder>
  Review: Model<IReview>
  ThemeConfig: Model<IThemeConfigDoc>
  Customer: Model<ICustomerDoc>
}

declare global {
  namespace Express {
    interface Request {
      tenant?: ITenant
      tenantDb?: TenantDbContext
    }
  }
}

export async function tenantResolver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let slug = 'lunar'
    if (typeof req.params.tenantSlug === 'string' && req.params.tenantSlug) {
      slug = req.params.tenantSlug
    } else if (typeof req.headers['x-tenant-slug'] === 'string' && req.headers['x-tenant-slug']) {
      slug = req.headers['x-tenant-slug']
    } else if (typeof req.query.tenant === 'string' && req.query.tenant) {
      slug = req.query.tenant
    }
    slug = slug.trim().toLowerCase()

    // 2. Query master database for tenant configuration
    const masterDb = await connectMasterDatabase()
    const TenantModel = getTenantModel(masterDb)
    let tenant = await TenantModel.findOne({ slug })

    // Fallback to primary store ('lunar') if not found
    if (!tenant && slug !== 'lunar') {
      tenant = await TenantModel.findOne({ slug: 'lunar' })
    }

    if (!tenant) {
      res.status(404).json({ error: `Store "${slug}" not found in Orvexa Tech Platform.` })
      return
    }

    // 3. Enforce tenant status — suspended/pending stores cannot serve or receive data
    if (tenant.status === 'suspended') {
      res.status(403).json({ error: 'This store has been suspended. Please contact support.' })
      return
    }

    if (tenant.status === 'pending') {
      res.status(403).json({ error: 'This store is pending approval and not yet active.' })
      return
    }

    // 4. Connect to the tenant's dedicated database (custom Mongo URI or provisioned multi-db)
    const tenantConn = await getTenantConnection(tenant.slug, tenant.customMongoUri)

    // 4. Attach scoped models to request
    req.tenant = tenant
    req.tenantDb = {
      connection: tenantConn,
      Product: getTenantProductModel(tenantConn),
      Order: getTenantOrderModel(tenantConn),
      Review: getTenantReviewModel(tenantConn),
      ThemeConfig: getTenantThemeModel(tenantConn),
      Customer: getTenantCustomerModel(tenantConn),
    }

    next()
  } catch (error) {
    console.error('[Tenant Resolver Error]:', error)
    res.status(500).json({ error: 'Failed to connect to isolated store database.' })
  }
}
