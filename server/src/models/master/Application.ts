// --- Master Database: Merchant Application Model ---
import { Schema, type Connection, type Model, type Document } from 'mongoose'

export interface IApplication extends Document {
  id: string
  brandName: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  category: string
  description: string
  requestedSubdomain: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  reviewedAt?: string
  reviewNotes?: string
}

export const ApplicationSchema = new Schema<IApplication>(
  {
    id: { type: String, required: true, unique: true, index: true },
    brandName: { type: String, required: true },
    ownerName: { type: String, required: true },
    ownerEmail: { type: String, required: true },
    ownerPhone: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    requestedSubdomain: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    submittedAt: { type: String, default: () => new Date().toISOString() },
    reviewedAt: { type: String },
    reviewNotes: { type: String },
  },
  { timestamps: true }
)

export function getApplicationModel(conn: Connection): Model<IApplication> {
  return conn.models.Application || conn.model<IApplication>('Application', ApplicationSchema)
}
