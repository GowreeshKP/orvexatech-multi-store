// --- Master Database: Tenant Store Registry Model ---
import { Schema, type Connection, type Model, type Document } from 'mongoose'

export interface ITenant extends Document {
  id: string
  slug: string
  brandName: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  passwordHash?: string
  logo?: string
  customDomain?: string
  customMongoUri?: string // Bring-Your-Own-Database URI
  customDbName?: string // Custom MongoDB Database Name
  status: 'active' | 'suspended' | 'pending'
  plan: 'starter' | 'growth' | 'pro' | 'enterprise'
  createdAt: string
  theme: {
    primaryColor: string
    accentColor: string
    backgroundColor: string
    fontDisplay: string
    fontSans: string
    heroImage: string
    heroHeadline?: string
    heroSubhead?: string
    heroCtaText?: string
    secondaryCtaText?: string
    logoUrl?: string
    announcementMessages: string[]
    enableAnimations: boolean
    enableReviews: boolean
    enableOrderTracking: boolean
  }
  subscription?: {
    plan: string
    pricePerMonth: number
    status: string
    nextBillingDate: string
    paymentMethod: string
    invoices: Array<{ id: string; amount: number; status: string; date: string; description: string }>
  }
}

export const TenantSchema = new Schema<ITenant>(
  {
    id: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    brandName: { type: String, required: true },
    ownerName: { type: String, required: true },
    ownerEmail: { type: String, required: true, index: true },
    ownerPhone: { type: String, default: '' },
    passwordHash: { type: String, default: '' },
    logo: { type: String, default: '' },
    customDomain: { type: String, default: '' },
    customMongoUri: { type: String, default: '' },
    customDbName: { type: String, default: '' },
    status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
    plan: { type: String, enum: ['starter', 'growth', 'pro', 'enterprise'], default: 'starter' },
    createdAt: { type: String, default: () => new Date().toISOString() },
    theme: {
      primaryColor: { type: String, default: '#8C5A4F' },
      accentColor: { type: String, default: '#D4A574' },
      backgroundColor: { type: String, default: '#FAFAF8' },
      fontDisplay: { type: String, default: "'Instrument Serif', Georgia, serif" },
      fontSans: { type: String, default: "'Work Sans', system-ui, sans-serif" },
      heroImage: { type: String, default: '' },
      heroHeadline: { type: String, default: '' },
      heroSubhead: { type: String, default: '' },
      heroCtaText: { type: String, default: 'EXPLORE COLLECTIONS →' },
      secondaryCtaText: { type: String, default: 'ABOUT US' },
      logoUrl: { type: String, default: '' },
      announcementMessages: { type: [String], default: [] },
      enableAnimations: { type: Boolean, default: true },
      enableReviews: { type: Boolean, default: true },
      enableOrderTracking: { type: Boolean, default: true },
    },
    subscription: {
      plan: { type: String, default: 'starter' },
      pricePerMonth: { type: Number, default: 999 },
      status: { type: String, default: 'active' },
      nextBillingDate: { type: String, default: '' },
      paymentMethod: { type: String, default: 'razorpay' },
      invoices: {
        type: [
          {
            id: String,
            amount: Number,
            status: String,
            date: String,
            description: String,
          },
        ],
        default: [],
      },
    },
  },
  { timestamps: true }
)

export function getTenantModel(conn: Connection): Model<ITenant> {
  return conn.models.Tenant || conn.model<ITenant>('Tenant', TenantSchema)
}
