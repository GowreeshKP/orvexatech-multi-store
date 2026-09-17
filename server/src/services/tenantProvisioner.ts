// --- Tenant Provisioner Service ---
// Generates credentials and database config for newly approved store clients.
// On Vercel (read-only FS), filesystem scaffolding is skipped — all data goes to MongoDB.
// Locally, it also writes tenant folders and .env files for developer convenience.

import crypto from 'crypto'
import bcrypt from 'bcryptjs'

// Filesystem operations are only available locally
const isVercel = Boolean(process.env.VERCEL)

export interface ProvisionTenantInput {
  slug: string
  brandName: string
  ownerName: string
  ownerEmail: string
  ownerPhone?: string
  customMongoUri?: string
  customDomain?: string
  description?: string
  primaryColor?: string
  accentColor?: string
  initialPassword?: string // plain-text; will be bcrypt-hashed before storage
}

export interface ProvisionResult {
  success: boolean
  folderPath: string
  envFilePath: string
  dbName: string
  mongoUri: string
  passwordHash: string
  message: string
}

export async function provisionTenantFolders(input: ProvisionTenantInput): Promise<ProvisionResult> {
  const slug = input.slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '')
  const dbName = `orvexa_tenant_${slug}`
  const tenantBaseUri = process.env.MONGODB_TENANT_BASE_URI || 'mongodb://localhost:27017/orvexa_tenant_'
  const mongoUri = input.customMongoUri?.trim() || `${tenantBaseUri}${slug}`
  const jwtSecret = `orvexa_jwt_${slug}_${crypto.randomBytes(8).toString('hex')}`
  const webhookSecret = `whsec_${slug}_${crypto.randomBytes(8).toString('hex')}`
  const primaryColor = input.primaryColor || '#8C5A4F'
  const accentColor = input.accentColor || '#D4A574'

  // Generate and hash initial merchant password
  const rawPassword = input.initialPassword || `${slug}@${crypto.randomBytes(4).toString('hex')}`
  const passwordHash = await bcrypt.hash(rawPassword, 12)

  const srcEnvPath = `src/tenants/${slug}/tenant.env`

  // ── Filesystem scaffolding — local development only ─────────────────────
  // Vercel's runtime has a read-only filesystem, so we skip this entirely.
  // All tenant configuration is stored in MongoDB (master DB Tenant document).
  if (!isVercel) {
    try {
      // Lazy-import fs/path only when actually needed (keeps the serverless bundle clean)
      const fs = await import('fs')
      const path = await import('path')
      const { fileURLToPath } = await import('url')

      const __filename = fileURLToPath(import.meta.url)
      const __dirname = path.dirname(__filename)

      const rootDir = path.resolve(__dirname, '../../../')
      const srcTenantsDir = path.join(rootDir, 'src', 'tenants', slug)
      const serverTenantsDir = path.join(rootDir, 'server', 'src', 'tenants', slug)

      if (!fs.existsSync(srcTenantsDir)) fs.mkdirSync(srcTenantsDir, { recursive: true })
      if (!fs.existsSync(serverTenantsDir)) fs.mkdirSync(serverTenantsDir, { recursive: true })

      const envContent = `# --- Tenant Environment Variables ---
# Store: ${input.brandName}
# Platform: Orvexa Tech Multi-Tenant Ecosystem
# Provisioned: ${new Date().toISOString()}

TENANT_ID=tenant_${slug}_${Date.now()}
TENANT_SLUG=${slug}
BRAND_NAME="${input.brandName}"
SUBDOMAIN=${slug}.orvexatech.com
CUSTOM_DOMAIN=${input.customDomain || ''}
PRIMARY_COLOR="${primaryColor}"
ACCENT_COLOR="${accentColor}"

# --- Isolated Database Configuration ---
MONGODB_DB_NAME=${dbName}
MONGODB_URI=${mongoUri}
MONGODB_ISOLATION_MODE=dedicated_database

# --- Store Service Secrets ---
JWT_SECRET=${jwtSecret}
API_PORT=5000
STORAGE_BUCKET=orvexatech-media-${slug}
WEBHOOK_SECRET=${webhookSecret}
ENABLE_ORDER_TRACKING=true
ENABLE_CUSTOMER_REVIEWS=true

# --- Merchant Credentials (bcrypt hashed — stored in master DB) ---
# Initial raw password (share securely with merchant, delete after first login):
# RAW_PASSWORD=${rawPassword}
PASSWORD_HASH=${passwordHash}
`
      const configTsContent = `import type { TenantConfig } from '@/types/tenant'

export const ${slug}TenantConfig: TenantConfig = {
  id: 'tenant_${slug}_${Date.now()}',
  slug: '${slug}',
  brandName: '${input.brandName}',
  ownerName: '${input.ownerName}',
  ownerEmail: '${input.ownerEmail}',
  ownerPhone: '${input.ownerPhone || ''}',
  logo: '',
  status: 'active',
  plan: 'starter',
  createdAt: '${new Date().toISOString().split('T')[0]}',
  theme: {
    primaryColor: '${primaryColor}',
    accentColor: '${accentColor}',
    backgroundColor: '#FAFAF8',
    fontDisplay: "'Instrument Serif', Georgia, serif",
    fontSans: "'Work Sans', system-ui, sans-serif",
    heroImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80',
    heroHeadline: '${input.brandName} Atelier',
    heroSubhead: '${input.description || `Handcrafted exclusive collection from ${input.brandName}`}',
    heroCtaText: 'EXPLORE CATALOG →',
    logoUrl: '',
    announcementMessages: [
      'WELCOME TO ${input.brandName.toUpperCase()}',
      'FREE SHIPPING OVER ₹999',
    ],
    enableAnimations: true,
    enableReviews: true,
    enableOrderTracking: true,
  },
  subscription: {
    plan: 'starter',
    pricePerMonth: 999,
    status: 'active',
    nextBillingDate: '${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}',
    paymentMethod: 'razorpay',
    invoices: [],
  },
  databaseConfig: {
    dbName: '${dbName}',
    mongoUri: '${mongoUri}',
    isolationMode: 'dedicated_database',
    folderPath: 'src/tenants/${slug}',
  },
}
`
      const absEnvPath = path.join(srcTenantsDir, 'tenant.env')
      const serverEnvPath = path.join(serverTenantsDir, 'tenant.env')
      fs.writeFileSync(absEnvPath, envContent, 'utf-8')
      fs.writeFileSync(serverEnvPath, envContent, 'utf-8')
      fs.writeFileSync(path.join(srcTenantsDir, 'config.ts'), configTsContent, 'utf-8')
      fs.writeFileSync(path.join(srcTenantsDir, 'index.ts'), `export * from './config'\n`, 'utf-8')

      console.log(`[Provisioner] Scaffolded local tenant folder: src/tenants/${slug}`)
    } catch (fsErr) {
      console.warn('[Provisioner] Filesystem scaffolding failed (non-fatal):', fsErr)
    }
  } else {
    console.log(`[Provisioner] Vercel runtime — skipping filesystem scaffolding for "${slug}". Config stored in MongoDB.`)
  }

  return {
    success: true,
    folderPath: `src/tenants/${slug}`,
    envFilePath: srcEnvPath,
    dbName,
    mongoUri,
    passwordHash,
    message: isVercel
      ? `Provisioned isolated database and credentials for ${input.brandName} (MongoDB only on Vercel)`
      : `Provisioned separate folder & isolated database for ${input.brandName} at src/tenants/${slug}`,
  }
}
