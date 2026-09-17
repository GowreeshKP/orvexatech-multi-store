import { Router, type Request, type Response } from 'express'
import { tenantResolver } from '../middleware/tenantResolver.js'
import { requireSeller, requireTenantAccess } from '../middleware/authMiddleware.js'
import { closeTenantConnection, getTenantConnection, connectMasterDatabase } from '../config/db.js'
import { getTenantModel } from '../models/master/Tenant.js'

const router = Router({ mergeParams: true })

// Apply dynamic tenant database resolver to all routes
router.use(tenantResolver)

// ====================================================================
// 1. PRODUCTS (Stored in tenant's isolated MongoDB)
// ====================================================================

// GET all products
router.get('/products', async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query
    const filter: any = {}

    if (category && category !== 'all') {
      filter.category = category
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { fabricTech: { $regex: search, $options: 'i' } },
      ]
    }

    const products = await req.tenantDb!.Product.find(filter).sort({ id: 1 })
    res.json(products)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch products' })
  }
})

// GET single product
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10)
    const product = await req.tenantDb!.Product.findOne({ id })
    if (!product) {
      res.status(404).json({ error: 'Product not found' })
      return
    }
    res.json(product)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch product' })
  }
})

// POST create new product — merchant only
router.post('/products', requireSeller, requireTenantAccess, async (req: Request, res: Response) => {
  try {
    const Product = req.tenantDb!.Product
    let nextId = req.body.id

    if (!nextId) {
      const highest = await Product.findOne().sort({ id: -1 })
      nextId = highest ? highest.id + 1 : 1
    }

    const newProduct = new Product({
      ...req.body,
      id: nextId,
      priceFormatted: req.body.priceFormatted || `₹${Number(req.body.price).toLocaleString()}`,
    })

    const saved = await newProduct.save()
    res.status(201).json(saved)
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create product' })
  }
})

// PUT update product — merchant only
router.put('/products/:id', requireSeller, requireTenantAccess, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10)
    const Product = req.tenantDb!.Product

    const updated = await Product.findOneAndUpdate(
      { id },
      {
        ...req.body,
        priceFormatted: req.body.priceFormatted || `₹${Number(req.body.price).toLocaleString()}`,
      },
      { new: true }
    )

    if (!updated) {
      res.status(404).json({ error: 'Product not found' })
      return
    }

    res.json(updated)
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update product' })
  }
})

// DELETE product — merchant only
router.delete('/products/:id', requireSeller, requireTenantAccess, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10)
    const deleted = await req.tenantDb!.Product.findOneAndDelete({ id })
    if (!deleted) {
      res.status(404).json({ error: 'Product not found' })
      return
    }
    res.json({ success: true, message: 'Product deleted from store database' })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete product' })
  }
})

// ====================================================================
// 2. STOREFRONT THEME & HOMEPAGE PICTURE CUSTOMIZER
// ====================================================================

// GET theme config
router.get('/theme', async (req: Request, res: Response) => {
  try {
    let themeDoc = await req.tenantDb!.ThemeConfig.findOne()
    if (!themeDoc) {
      // Fallback to tenant.theme from master DB
      res.json(req.tenant!.theme)
      return
    }
    res.json(themeDoc)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch theme' })
  }
})

// PUT update theme & hero picture — merchant only
router.put('/theme', requireSeller, requireTenantAccess, async (req: Request, res: Response) => {
  try {
    const ThemeConfig = req.tenantDb!.ThemeConfig
    let themeDoc = await ThemeConfig.findOne()

    if (!themeDoc) {
      themeDoc = new ThemeConfig(req.body)
    } else {
      Object.assign(themeDoc, req.body)
    }

    const savedTheme = await themeDoc.save()

    // Also sync to Master DB tenant document for fast initial loads
    const masterDb = await connectMasterDatabase()
    const TenantModel = getTenantModel(masterDb)
    await TenantModel.findOneAndUpdate(
      { slug: req.tenant!.slug },
      { $set: { theme: savedTheme.toObject() } }
    )

    res.json({ success: true, theme: savedTheme })
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update theme' })
  }
})

// ====================================================================
// 3. ORDERS (Isolated per tenant database)
// ====================================================================

// GET orders
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const orders = await req.tenantDb!.Order.find().sort({ createdAt: -1 })
    res.json(orders)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch orders' })
  }
})

// POST place order — public (customers place orders on the storefront)
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const Order = req.tenantDb!.Order
    const newOrder = new Order(req.body)
    const saved = await newOrder.save()
    res.status(201).json(saved)
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to place order' })
  }
})

// PUT order status — merchant only
router.put('/orders/:id/status', requireSeller, requireTenantAccess, async (req: Request, res: Response) => {
  try {
    const { status, courier, awb } = req.body
    const Order = req.tenantDb!.Order

    const updated = await Order.findOneAndUpdate(
      { id: req.params.id },
      { $set: { status, courier, awb } },
      { new: true }
    )

    if (!updated) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    res.json(updated)
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update order' })
  }
})

// ====================================================================
// 4. REVIEWS
// ====================================================================

router.get('/reviews', async (req: Request, res: Response) => {
  try {
    const { productId } = req.query
    const filter: any = {}
    if (productId) filter.productId = parseInt(productId as string, 10)
    const reviews = await req.tenantDb!.Review.find(filter).sort({ createdAt: -1 })
    res.json(reviews)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch reviews' })
  }
})

// POST create review — public (customers submit reviews on storefront)
router.post('/reviews', async (req: Request, res: Response) => {
  try {
    const Review = req.tenantDb!.Review
    const highest = await Review.findOne().sort({ id: -1 })
    const nextId = highest ? highest.id + 1 : 1

    const newReview = new Review({
      ...req.body,
      id: nextId,
      date: req.body.date || 'Just now',
    })

    const saved = await newReview.save()
    res.status(201).json(saved)
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create review' })
  }
})

// ====================================================================
// 5. DATABASE SETTINGS (Bring-Your-Own-Database / Custom Mongo URI)
// ====================================================================

// GET database connection status
router.get('/database-status', async (req: Request, res: Response) => {
  try {
    const conn = req.tenantDb!.connection
    const isCustom = Boolean(req.tenant!.customMongoUri)
    const dbName = conn.name
    const host = conn.host
    const readyState = conn.readyState

    const productCount = await req.tenantDb!.Product.countDocuments()
    const orderCount = await req.tenantDb!.Order.countDocuments()
    const reviewCount = await req.tenantDb!.Review.countDocuments()

    res.json({
      tenantSlug: req.tenant!.slug,
      brandName: req.tenant!.brandName,
      isCustomDatabase: isCustom,
      databaseName: dbName,
      host,
      connected: readyState === 1,
      stats: {
        products: productCount,
        orders: orderCount,
        reviews: reviewCount,
      },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to inspect database' })
  }
})

// PUT update custom MongoDB URI & Database Name (Bring-Your-Own-Database) — merchant only
router.put('/database-config', requireSeller, requireTenantAccess, async (req: Request, res: Response) => {
  try {
    const { customMongoUri, customDbName } = req.body
    const slug = req.tenant!.slug
    const cleanUri = customMongoUri ? String(customMongoUri).trim() : ''
    const cleanDbName = customDbName ? String(customDbName).trim() : `orvexa_tenant_${slug}`

    // 1. Verify connection to the new custom URI if provided
    if (cleanUri) {
      try {
        const testConn = await getTenantConnection(`${slug}_test`, cleanUri)
        await testConn.close()
      } catch (connErr: any) {
        res.status(400).json({
          error: `Could not connect to the provided MongoDB URI: ${connErr.message}`,
        })
        return
      }
    }

    // 2. Save custom URI and Database Name to master DB
    const masterDb = await connectMasterDatabase()
    const TenantModel = getTenantModel(masterDb)
    const updatedTenant = await TenantModel.findOneAndUpdate(
      { slug },
      {
        $set: {
          customMongoUri: cleanUri,
          customDbName: cleanDbName,
        },
      },
      { new: true }
    )

    // 3. Close cached connection to force reload with new parameters
    await closeTenantConnection(slug)

    res.json({
      success: true,
      customMongoUri: cleanUri,
      customDbName: cleanDbName,
      message: cleanUri
        ? `Successfully connected and switched to custom database '${cleanDbName}'!`
        : 'Switched back to Orvexa Tech platform isolated multi-database engine.',
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update database config' })
  }
})

export default router
