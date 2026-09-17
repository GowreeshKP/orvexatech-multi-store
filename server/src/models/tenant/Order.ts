// --- Tenant Database: Scoped Order Model ---
import { Schema, type Connection, type Model, type Document } from 'mongoose'

export interface IOrderItem {
  name: string
  price: number
  quantity: number
  size: string
  lining?: string
  zip?: string
  length?: string
  image: string
}

export interface IOrderTimelineStep {
  title: string
  time: string
  desc: string
  completed: boolean
}

export interface IOrder extends Document {
  id: string
  date: string
  status: 'Processing' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Cancelled'
  courier: string
  awb: string
  estimatedDelivery: string
  subtotal: number
  discount?: number
  shipping: number
  total: number
  paymentMethod: string
  shippingAddress: {
    name: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
  }
  items: IOrderItem[]
  timeline: IOrderTimelineStep[]
}

export const OrderSchema = new Schema<IOrder>(
  {
    id: { type: String, required: true, unique: true, index: true },
    date: { type: String, required: true },
    status: {
      type: String,
      enum: ['Processing', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Processing',
      index: true,
    },
    courier: { type: String, default: 'Blue Dart Express' },
    awb: { type: String, default: '' },
    estimatedDelivery: { type: String, default: '' },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, default: 'UPI' },
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    items: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        size: { type: String, default: '' },
        lining: { type: String },
        zip: { type: String },
        length: { type: String },
        image: { type: String, default: '' },
      },
    ],
    timeline: [
      {
        title: { type: String, required: true },
        time: { type: String, required: true },
        desc: { type: String, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
)

export function getTenantOrderModel(conn: Connection): Model<IOrder> {
  return conn.models.Order || conn.model<IOrder>('Order', OrderSchema)
}
