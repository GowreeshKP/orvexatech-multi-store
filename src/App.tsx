import { useState, useMemo, useEffect, useRef } from 'react'
import DashboardApp from './layers/DashboardApp'
import AdminApp from './layers/AdminApp'
import { useApplicationLayer, useTenant } from './context/TenantContext'
import { mockStore } from './api/mock-store'
import { MOCK_TENANTS } from './data/mock-tenants'
import type { TenantConfig } from './types/tenant'

// --- THE LUNAR CLOTHING OFFICIAL PRODUCT DATASET ---
export interface Product {
  id: number
  name: string
  category: 'maxis' | 'dresses' | 'kalamkari' | 'handloom' | 'all'
  sculptLevel: string
  fabricTech: string
  fabricDesc: string
  compression: string
  price: number
  priceFormatted: string
  rating: number
  reviewsCount: number
  badge?: string
  colors: { name: string; hex: string }[]
  sizes: string[]
  imgMain: string
  images: string[]
  desc: string
  details: string[]
  fitInfo: string
}

export interface CartItem {
  product: Product
  selectedColor: { name: string; hex: string }
  selectedSize: string
  selectedLining: string
  selectedZip: string
  selectedLength: string
  quantity: number
}

export interface Review {
  id: number
  productId: number
  author: string
  rating: number
  date: string
  title: string
  comment: string
  verified: boolean
}

export interface UserAccount {
  name: string
  email: string
  phone: string
  verified: boolean
}

export interface OrderItem {
  name: string
  price: number
  quantity: number
  size: string
  lining?: string
  zip?: string
  length?: string
  image: string
}

export interface TrackedOrder {
  id: string
  date: string
  status: 'Processing' | 'In Transit' | 'Out for Delivery' | 'Delivered'
  courier: string
  awb: string
  estimatedDelivery: string
  items: OrderItem[]
  subtotal: number
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
  timeline: {
    title: string
    time: string
    desc: string
    completed: boolean
    current?: boolean
  }[]
}

const INITIAL_ORDERS: TrackedOrder[] = [
  {
    id: 'LUNAR-892410',
    date: '09 Sep 2026',
    status: 'In Transit',
    courier: 'Blue Dart Express',
    awb: 'BD8912401IN',
    estimatedDelivery: 'Tomorrow, by 7:00 PM',
    subtotal: 2198,
    shipping: 0,
    total: 2198,
    paymentMethod: 'Instant UPI (GPay)',
    shippingAddress: {
      name: 'Priya Sharma',
      phone: '+91 98765 43210',
      address: 'Flat 402, Sunshine Heights, Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500033',
    },
    items: [
      {
        name: 'Yellow Petal Cotton Maxi',
        price: 1099,
        quantity: 1,
        size: 'M',
        lining: 'No Lining',
        zip: 'Both Sides Vertical Feeding Zip (+₹100)',
        length: '44 inch',
        image: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5227_1.jpg?v=1778607243',
      },
      {
        name: 'Teal Floral Cotton Maxi',
        price: 1099,
        quantity: 1,
        size: 'M',
        lining: 'Cotton Lining (+₹150)',
        zip: 'None',
        length: '44 inch',
        image: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_2171_1.jpg?v=1766941862',
      },
    ],
    timeline: [
      {
        title: 'Order Confirmed & Payment Verified',
        time: '09 Sep 2026, 11:30 AM',
        desc: 'Payment received via UPI. Order registered with The Lunar Clothing online studio.',
        completed: true,
      },
      {
        title: 'Artisan Tailoring & Quality Inspection',
        time: '10 Sep 2026, 03:15 PM',
        desc: 'Handcrafted garments passed QC inspection and wrapped in Lunar eco-packaging.',
        completed: true,
      },
      {
        title: 'Dispatched with Blue Dart Express',
        time: '10 Sep 2026, 07:45 PM',
        desc: 'Handed over to Blue Dart Express (Hyderabad Hub). Tracking AWB: BD8912401IN.',
        completed: true,
      },
      {
        title: 'In Transit to Destination Delivery Hub',
        time: '11 Sep 2026, 08:30 AM',
        desc: 'Shipment arrived at destination city hub and is out for route sorting.',
        completed: true,
        current: true,
      },
      {
        title: 'Out for Doorstep Delivery',
        time: 'Expected Tomorrow, 10:00 AM',
        desc: 'Delivery agent will attempt delivery to your address.',
        completed: false,
      },
      {
        title: 'Delivered',
        time: 'Expected Tomorrow, by 7:00 PM',
        desc: 'Package delivered to recipient.',
        completed: false,
      },
    ],
  },
  {
    id: 'LUNAR-719324',
    date: '22 Aug 2026',
    status: 'Delivered',
    courier: 'Delhivery',
    awb: 'DL839210492',
    estimatedDelivery: 'Delivered on 25 Aug 2026',
    subtotal: 1299,
    shipping: 0,
    total: 1299,
    paymentMethod: 'Cash on Delivery (COD)',
    shippingAddress: {
      name: 'Priya Sharma',
      phone: '+91 98765 43210',
      address: 'Flat 402, Sunshine Heights, Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500033',
    },
    items: [
      {
        name: 'Red Checked Soft Mul Chanderi Dress',
        price: 1299,
        quantity: 1,
        size: 'M',
        lining: 'Included Breathable Cotton Lining',
        zip: 'None',
        length: 'Standard 44 inch',
        image: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5234.jpg?v=1778607246',
      },
    ],
    timeline: [
      {
        title: 'Order Confirmed',
        time: '22 Aug 2026, 04:10 PM',
        desc: 'COD order confirmed via SMS.',
        completed: true,
      },
      {
        title: 'Dispatched via Delhivery',
        time: '23 Aug 2026, 01:20 PM',
        desc: 'Courier AWB: DL839210492.',
        completed: true,
      },
      {
        title: 'Delivered to Doorstep',
        time: '25 Aug 2026, 02:40 PM',
        desc: 'Package safely handed over and COD payment received.',
        completed: true,
      },
    ],
  },
]

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Yellow Petal Cotton Maxi',
    category: 'maxis',
    sculptLevel: '100% SOFT COTTON',
    fabricTech: 'Handcrafted Soft Cotton',
    fabricDesc: 'Pure breathable cotton woven for airy comfort with attached side ropes and functional deep pockets.',
    compression: 'Relaxed Fit',
    price: 1099,
    priceFormatted: '₹1,099',
    rating: 4.9,
    reviewsCount: 142,
    badge: 'Bestseller',
    colors: [
      { name: 'Sunflower Yellow', hex: '#F4C430' },
      { name: 'Pastel Cream', hex: '#FFF8DC' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    imgMain: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5227_1.jpg?v=1778607243',
    images: [
      'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5227_1.jpg?v=1778607243',
      'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5205.jpg?v=1778607246',
      'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5223_1.jpg?v=1778607242',
    ],
    desc: 'The Yellow Petal Cotton Maxi by The Lunar Clothing offers effortless summer elegance with 44-inch flowing length, side tie-up ropes, and deep utility pockets.',
    details: [
      'Length: 44 Inches (Extra charges for lining)',
      'Side waist tie-up ropes & deep functional pocket attached',
      'Material: 100% Premium Soft Breathable Cotton',
      'Model Wearing: Size S / Pre-shrunk fabric',
    ],
    fitInfo: 'True to size. Flowing flared maxi silhouette.',
  },
  {
    id: 2,
    name: 'Teal Floral Cotton Maxi',
    category: 'maxis',
    sculptLevel: '100% SOFT COTTON',
    fabricTech: 'Teal Floral Print Cotton',
    fabricDesc: 'Lightweight premium cotton with hand-printed floral motifs and adjustable waist ropes.',
    compression: 'Relaxed Fit',
    price: 1099,
    priceFormatted: '₹1,099',
    rating: 4.9,
    reviewsCount: 98,
    badge: 'Trending',
    colors: [
      { name: 'Teal Blue', hex: '#008080' },
      { name: 'Ocean Green', hex: '#2E8B57' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    imgMain: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_2171_1.jpg?v=1766941862',
    images: [
      'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_2171_1.jpg?v=1766941862',
      'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_2175.jpg?v=1766941862',
      'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_2197.jpg?v=1766941862',
    ],
    desc: 'Deep teal floral prints combined with featherlight soft cotton for everyday lounge and outing perfection.',
    details: [
      'Length: 44 Inches',
      'Convenient side pocket & tie ropes attached',
      'Material: 100% Soft Cotton',
      'Color fastness guaranteed with gentle hand wash',
    ],
    fitInfo: 'Comfortable relaxed fit.',
  },
  {
    id: 3,
    name: 'Grey Kalamkari Cotton Maxi',
    category: 'kalamkari',
    sculptLevel: 'ARTISANAL KALAMKARI',
    fabricTech: 'Handblock Kalamkari Print',
    fabricDesc: 'Artisanal Kalamkari block print on natural grey cotton yarn.',
    compression: 'Regular Fit',
    price: 1099,
    priceFormatted: '₹1,099',
    rating: 5.0,
    reviewsCount: 124,
    badge: 'Artisan Pick',
    colors: [
      { name: 'Charcoal Grey', hex: '#36454F' },
      { name: 'Earth Brown', hex: '#5C4033' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    imgMain: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5223_1.jpg?v=1778607242',
    images: [
      'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5223_1.jpg?v=1778607242',
      'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5232.jpg?v=1778607247',
    ],
    desc: 'Ethically crafted Kalamkari motif maxi dress featuring authentic Indian heritage craftsmanship and modern functional pockets.',
    details: [
      'Authentic Kalamkari Block Print',
      'Length: 44 Inches with side pocket',
      '100% Natural Cotton Yarn',
    ],
    fitInfo: 'Relaxed flared maxi fit.',
  },
  {
    id: 4,
    name: 'Dark Violet Floral Cotton Maxi',
    category: 'maxis',
    sculptLevel: 'PREMIUM COTTON',
    fabricTech: 'Soft Violet Cotton',
    fabricDesc: 'Rich dark violet shade accented with intricate floral motifs and adjustable waist ropes.',
    compression: 'Relaxed Fit',
    price: 1199,
    priceFormatted: '₹1,199',
    rating: 4.8,
    reviewsCount: 86,
    badge: 'New Season',
    colors: [
      { name: 'Dark Violet', hex: '#4B0082' },
      { name: 'Deep Plum', hex: '#673147' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    imgMain: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5205.jpg?v=1778607246',
    images: [
      'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5205.jpg?v=1778607246',
      'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5234.jpg?v=1778607246',
    ],
    desc: 'Regal dark violet maxi dress designed for festive gatherings and casual day wear.',
    details: [
      'Length: 44 Inches with attached side pocket',
      '100% Premium Soft Cotton',
      'Adjustable side cinch ropes',
    ],
    fitInfo: 'True to size with flared waist.',
  },
  {
    id: 5,
    name: 'Red Checked Soft Mul Chanderi Dress',
    category: 'dresses',
    sculptLevel: 'MUL CHANDERI SILK',
    fabricTech: 'Soft Mul Chanderi Silk',
    fabricDesc: 'Luxurious Mul Chanderi fabric lined with soft cotton for a weightless festive silhouette.',
    compression: 'Festive Flare',
    price: 1299,
    priceFormatted: '₹1,299',
    rating: 5.0,
    reviewsCount: 64,
    badge: 'Exclusive',
    colors: [
      { name: 'Crimson Red', hex: '#990000' },
      { name: 'Gold Accent', hex: '#D4AF37' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    imgMain: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5234.jpg?v=1778607246',
    images: [
      'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5234.jpg?v=1778607246',
      'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_2175.jpg?v=1766941862',
    ],
    desc: 'Soft Mul Chanderi dress featuring classic red checks, handcrafted neck piping, and soft cotton lining.',
    details: [
      'Premium Soft Mul Chanderi Silk Blend',
      'Includes breathable inner cotton lining',
      'Side pocket and festive tiered hem',
    ],
    fitInfo: 'Flowing A-line dress silhouette.',
  },
  {
    id: 6,
    name: 'Purple Heart Handloom Cotton Maxi',
    category: 'handloom',
    sculptLevel: 'HANDLOOM WEAVE',
    fabricTech: 'Handloom Soft Cotton',
    fabricDesc: 'Woven on traditional Indian handlooms with delicate purple heart motifs.',
    compression: 'Artisanal Weave',
    price: 1299,
    priceFormatted: '₹1,299',
    rating: 4.9,
    reviewsCount: 78,
    badge: 'Limited Edition',
    colors: [
      { name: 'Dusty Purple', hex: '#7D526E' },
      { name: 'Natural Cotton', hex: '#FDFBF7' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    imgMain: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_2175.jpg?v=1766941862',
    images: [
      'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_2175.jpg?v=1766941862',
      'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_2197.jpg?v=1766941862',
    ],
    desc: 'Artisanal Handloom Cotton Maxi woven with love and designed for all-day breathability.',
    details: [
      'Length: 44 Inches',
      'Traditional Handloom Weave Texture',
      'Pockets and side tie ropes included',
    ],
    fitInfo: 'Relaxed ethnic maxi fit.',
  },
  {
    id: 7,
    name: 'Royal Blue Blossom Cotton Maxi',
    category: 'maxis',
    sculptLevel: '100% SOFT COTTON',
    fabricTech: 'Royal Blossom Print',
    fabricDesc: 'Vivid royal blue cotton backdrop with bright floral blossom handprints.',
    compression: 'Relaxed Fit',
    price: 1199,
    priceFormatted: '₹1,199',
    rating: 4.8,
    reviewsCount: 52,
    badge: 'Popular',
    colors: [
      { name: 'Royal Blue', hex: '#4169E1' },
      { name: 'Sky Blue', hex: '#87CEEB' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    imgMain: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_2197.jpg?v=1766941862',
    images: [
      'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_2197.jpg?v=1766941862',
      'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_2199.jpg?v=1766941862',
    ],
    desc: 'Eye-catching Royal Blue Blossom Cotton Maxi featuring side pockets and adjustable waist ties.',
    details: [
      'Length: 44 Inches',
      'Material: 100% Soft Breathable Cotton',
      'Deep side pockets',
    ],
    fitInfo: 'True to size.',
  },
  {
    id: 8,
    name: 'Black Dandelions Cotton Maxi',
    category: 'maxis',
    sculptLevel: '100% SOFT COTTON',
    fabricTech: 'Dandelion Block Print',
    fabricDesc: 'Midnight black cotton fabric adorned with white dandelion seed prints.',
    compression: 'Relaxed Fit',
    price: 1199,
    priceFormatted: '₹1,199',
    rating: 4.9,
    reviewsCount: 110,
    badge: 'Must Have',
    colors: [
      { name: 'Jet Black', hex: '#111111' },
      { name: 'Chalk White', hex: '#FAFAFA' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    imgMain: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5232.jpg?v=1778607247',
    images: [
      'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5232.jpg?v=1778607247',
      'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5227_1.jpg?v=1778607243',
    ],
    desc: 'Timeless black dandelion cotton maxi dress with attached side pockets and flattering flared hemline.',
    details: [
      'Length: 44 Inches',
      'Pocket & waist ropes attached',
      '100% Pure Soft Cotton',
    ],
    fitInfo: 'Flattering flared maxi fit.',
  },
]

const INITIAL_REVIEWS: Review[] = [
  {
    id: 1,
    productId: 1,
    author: 'Priya S.',
    rating: 5,
    date: '12 Aug 2026',
    title: 'Super soft & functional pockets!',
    comment: 'The cotton fabric is exceptionally soft and breathable. Pockets are deep enough to comfortably fit my phone. Loved the side ties!',
    verified: true,
  },
  {
    id: 2,
    productId: 1,
    author: 'Ananya R.',
    rating: 5,
    date: '04 Aug 2026',
    title: 'Perfect for Indian summer',
    comment: 'Lightweight and elegant. I ordered with the feeding zip add-on and it is stitched so neatly. 10/10 recommend!',
    verified: true,
  },
  {
    id: 3,
    productId: 2,
    author: 'Meera V.',
    rating: 5,
    date: '28 Jul 2026',
    title: 'Beautiful Teal Shade',
    comment: 'Color is vibrant and exact to picture. Fits true to size with flowing flare.',
    verified: true,
  },
]

// --- INTERACTIVE LUXURY AMBIENT BACKGROUND SYSTEM ---
function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const spotlightRef = useRef<HTMLDivElement | null>(null)
  const [breezeActive, setBreezeActive] = useState(true)
  const mouseTargetRef = useRef<{ x: number; y: number }>({ x: -500, y: -500 })
  const mouseCurrentRef = useRef<{ x: number; y: number }>({ x: -500, y: -500 })

  // Track mouse coordinates for the ambient spotlight
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseTargetRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Smooth lerp for the ambient mouse glow directly on DOM node for 60fps performance
  useEffect(() => {
    let animId: number
    const updateGlow = () => {
      mouseCurrentRef.current.x += (mouseTargetRef.current.x - mouseCurrentRef.current.x) * 0.08
      mouseCurrentRef.current.y += (mouseTargetRef.current.y - mouseCurrentRef.current.y) * 0.08
      if (spotlightRef.current) {
        const x = Math.round(mouseCurrentRef.current.x)
        const y = Math.round(mouseCurrentRef.current.y)
        spotlightRef.current.style.background = `radial-gradient(650px circle at ${x}px ${y}px, rgba(244, 162, 175, 0.12), rgba(254, 215, 170, 0.06), transparent 70%)`
      }
      animId = requestAnimationFrame(updateGlow)
    }
    animId = requestAnimationFrame(updateGlow)
    return () => cancelAnimationFrame(animId)
  }, [])

  // Floating organic cotton petals & stardust particles canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Palette of soft cotton petals and gold stardust
    const colors = [
      'rgba(244, 162, 175, 0.45)', // Soft Rose Coral
      'rgba(255, 230, 200, 0.55)', // Airy Cotton Cream
      'rgba(245, 205, 120, 0.40)', // Golden Pollen Stardust
      'rgba(235, 180, 200, 0.40)', // Dusty Mauve
      'rgba(255, 255, 255, 0.60)', // Pure Cotton Fluff
    ]

    interface Particle {
      x: number
      y: number
      size: number
      speedY: number
      speedX: number
      rotation: number
      rotationSpeed: number
      color: string
      isPetal: boolean
      swayOffset: number
      swaySpeed: number
      opacity: number
    }

    const particles: Particle[] = []
    const PARTICLE_COUNT = 32

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 8 + 4,
        speedY: Math.random() * 0.7 + 0.3,
        speedX: (Math.random() - 0.5) * 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        color: colors[Math.floor(Math.random() * colors.length)],
        isPetal: Math.random() > 0.35,
        swayOffset: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.02 + 0.01,
        opacity: Math.random() * 0.5 + 0.3,
      })
    }

    let time = 0

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      time += 0.015

      if (breezeActive) {
        particles.forEach((p) => {
          // Sway movement
          p.swayOffset += p.swaySpeed
          const sway = Math.sin(p.swayOffset) * 0.6

          p.y += p.speedY
          p.x += p.speedX + sway
          p.rotation += p.rotationSpeed

          // Interactive breeze repulsion from mouse
          const dx = p.x - mouseTargetRef.current.x
          const dy = p.y - mouseTargetRef.current.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 140 && dist > 0) {
            const force = (140 - dist) / 140
            p.x += (dx / dist) * force * 3.5
            p.y += (dy / dist) * force * 2.5
          }

          // Loop back to top if off screen
          if (p.y > height + 20) {
            p.y = -20
            p.x = Math.random() * width
          }
          if (p.x < -20) p.x = width + 20
          if (p.x > width + 20) p.x = -20

          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rotation)
          ctx.fillStyle = p.color
          ctx.globalAlpha = p.opacity

          if (p.isPetal) {
            // Draw delicate cotton petal curve
            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.quadraticCurveTo(p.size, -p.size * 0.5, p.size * 1.4, 0)
            ctx.quadraticCurveTo(p.size, p.size * 0.5, 0, 0)
            ctx.fill()
          } else {
            // Draw twinkling stardust sparkle
            ctx.beginPath()
            ctx.arc(0, 0, p.size * 0.35, 0, Math.PI * 2)
            ctx.fill()
          }

          ctx.restore()
        })
      }

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [breezeActive])

  return (
    <>
      {/* 1. Interactive Cursor Light Spotlight (Smooth warm illumination) */}
      <div
        ref={spotlightRef}
        className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-700 select-none"
      />

      {/* 2. Ambient Drifting Mesh Orbs (Ethereal luxury atmosphere) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {/* Soft Coral Rose Orb */}
        <div className="absolute -top-[12%] -left-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-rose-300/18 via-pink-200/10 to-transparent blur-3xl animate-orb-1 transform-gpu" />

        {/* Warm Golden Honey Orb */}
        <div className="absolute top-[28%] -right-[12%] w-[620px] h-[620px] rounded-full bg-gradient-to-bl from-amber-200/15 via-orange-100/8 to-transparent blur-3xl animate-orb-2 transform-gpu" />

        {/* Delicate Lunar Lavender Orb */}
        <div className="absolute -bottom-[15%] left-[20%] w-[580px] h-[580px] rounded-full bg-gradient-to-tr from-purple-200/14 via-indigo-100/6 to-transparent blur-3xl animate-orb-3 transform-gpu" />

        {/* Mid-screen Breath Orb */}
        <div className="absolute top-[68%] -left-[10%] w-[480px] h-[480px] rounded-full bg-gradient-to-r from-emerald-100/10 via-rose-100/10 to-transparent blur-3xl animate-orb-2 transform-gpu" />
      </div>

      {/* 3. Interactive Floating Cotton Petals & Sparkle Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-20 w-full h-full select-none"
      />

      {/* 4. Floating Dragonfly Silhouette Brand Watermarks (Matching the Logo) */}
      <div className="fixed inset-0 pointer-events-none z-[15] overflow-hidden select-none">
        {/* Top Dragonfly Glide */}
        <div className="absolute animate-dragonfly-1 opacity-25">
          <svg width="42" height="42" viewBox="0 0 100 100" fill="none" className="text-rose-900 drop-shadow-sm">
            {/* Dragonfly wings with flapping micro-animation */}
            <g className="animate-wing">
              <ellipse cx="28" cy="42" rx="26" ry="7" fill="currentColor" opacity="0.5" transform="rotate(-15 28 42)" />
              <ellipse cx="72" cy="42" rx="26" ry="7" fill="currentColor" opacity="0.5" transform="rotate(15 72 42)" />
              <ellipse cx="30" cy="52" rx="22" ry="5" fill="currentColor" opacity="0.4" transform="rotate(-8 30 52)" />
              <ellipse cx="70" cy="52" rx="22" ry="5" fill="currentColor" opacity="0.4" transform="rotate(8 70 52)" />
            </g>
            {/* Body */}
            <circle cx="50" cy="38" r="4" fill="currentColor" />
            <line x1="50" y1="42" x2="50" y2="78" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        {/* Lower Dragonfly Glide */}
        <div className="absolute animate-dragonfly-2 opacity-20">
          <svg width="36" height="36" viewBox="0 0 100 100" fill="none" className="text-amber-900 drop-shadow-sm">
            <g className="animate-wing">
              <ellipse cx="28" cy="42" rx="26" ry="7" fill="currentColor" opacity="0.5" transform="rotate(-15 28 42)" />
              <ellipse cx="72" cy="42" rx="26" ry="7" fill="currentColor" opacity="0.5" transform="rotate(15 72 42)" />
              <ellipse cx="30" cy="52" rx="22" ry="5" fill="currentColor" opacity="0.4" transform="rotate(-8 30 52)" />
              <ellipse cx="70" cy="52" rx="22" ry="5" fill="currentColor" opacity="0.4" transform="rotate(8 70 52)" />
            </g>
            <circle cx="50" cy="38" r="4" fill="currentColor" />
            <line x1="50" y1="42" x2="50" y2="78" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* 5. Client Interactive Breeze Control Pill (Bottom Left) */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setBreezeActive(!breezeActive)}
          className="flex items-center gap-2 bg-white/85 backdrop-blur-md border border-black/15 shadow-lg hover:border-black text-black px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer select-none"
          title="Toggle interactive background breeze"
        >
          <span className={`w-2 h-2 rounded-full ${breezeActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
          <span>{breezeActive ? '✨ Floating Breeze: Active' : '✨ Floating Breeze: Paused'}</span>
        </button>
      </div>
    </>
  )
}

// --- DYNAMIC TENANT BRAND LOGO COMPONENT ---
function BrandLogo({
  tenant,
  className,
  isWhiteText,
}: {
  tenant?: TenantConfig | null
  className?: string
  isWhiteText?: boolean
}) {
  if (tenant?.logo || tenant?.theme?.logoUrl) {
    return (
      <img
        src={tenant.logo || tenant.theme.logoUrl}
        alt={tenant.brandName}
        className={className || "h-10 md:h-11 w-auto object-contain rounded-sm shadow-xs"}
      />
    )
  }

  const initial = (tenant?.brandName || 'Lunar').charAt(0).toUpperCase()
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-800 to-black text-white flex items-center justify-center font-bold text-xs shadow-sm border border-white/20">
        {initial}
      </div>
      <span
        className={`font-serif text-lg md:text-xl font-bold uppercase tracking-wider ${
          isWhiteText ? 'text-white' : 'text-black'
        }`}
      >
        {tenant?.brandName || 'The Lunar Clothing'}
      </span>
    </div>
  )
}

// 1. Announcement Bar with Dynamic Moving Marquee Ticker
function AnnouncementBar({
  tenant,
  onDismiss,
}: {
  tenant?: TenantConfig | null
  onDismiss: () => void
}) {
  const brandName = tenant?.brandName || 'The Lunar Clothing'
  const customMessages = tenant?.theme?.announcementMessages

  const tickerItems = useMemo(() => {
    if (customMessages && customMessages.length > 0) {
      return [...customMessages, ...customMessages]
    }
    return [
      `${brandName.toUpperCase()} • EXCLUSIVE ARTISANAL ONLINE COLLECTION`,
      'FREE SHIPPING IN INDIA OVER ₹999',
      `USE CODE: ${(tenant?.slug || 'LUNAR').toUpperCase()}10 FOR 10% OFF`,
      '100% PURE BREATHABLE FABRICS • FUNCTIONAL UTILITY',
      `${brandName.toUpperCase()} • EXCLUSIVE ARTISANAL ONLINE COLLECTION`,
      'FREE SHIPPING IN INDIA OVER ₹999',
      `USE CODE: ${(tenant?.slug || 'LUNAR').toUpperCase()}10 FOR 10% OFF`,
      '100% PURE BREATHABLE FABRICS • FUNCTIONAL UTILITY',
    ]
  }, [tenant, customMessages, brandName])

  return (
    <div className="bg-[#0055FF] text-white py-2.5 relative overflow-hidden flex items-center font-sans text-[11px] font-bold tracking-[0.2em] uppercase select-none z-50 shadow-md">
      <div className="animate-marquee flex items-center whitespace-nowrap gap-12">
        {tickerItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-12">
            <span>{item}</span>
            <span className="text-white/40">✦</span>
          </div>
        ))}
      </div>

      <button
        onClick={onDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#0055FF] pl-3 pr-1 text-white/80 hover:text-white text-sm font-light leading-none z-20 cursor-pointer"
        aria-label="Dismiss announcement"
      >
        ✕
      </button>
    </div>
  )
}

// 2. Navigation Header
function Navigation({
  tenant,
  products = PRODUCTS,
  cartCount,
  wishlistCount,
  user,
  onOpenCart,
  onOpenWishlist,
  onOpenSearch,
  onOpenMobileMenu,
  onOpenAuth,
  onOpenAccount,
  onOpenAbout,
  onOpenContact,
  onNavigate,
  currentCategory,
}: {
  tenant?: TenantConfig | null
  products?: Product[]
  cartCount: number
  wishlistCount: number
  user: UserAccount | null
  onOpenCart: () => void
  onOpenWishlist: () => void
  onOpenSearch: () => void
  onOpenMobileMenu: () => void
  onOpenAuth: () => void
  onOpenAccount: () => void
  onOpenAbout: () => void
  onOpenContact: () => void
  onNavigate: (view: 'home' | 'catalog', category?: string) => void
  currentCategory: string
}) {
  const [megaOpen, setMegaOpen] = useState(false)

  // Derive unique categories from products
  const categoryList = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category)))
  }, [products])

  const formatCatName = (cat: string) => {
    if (cat === 'maxis') return 'Kurtas & Maxis'
    if (cat === 'dresses') return 'Sarees & Dresses'
    if (cat === 'kalamkari') return 'Artisanal Prints & Stoles'
    if (cat === 'handloom') return 'Handloom Weaves'
    return cat.charAt(0).toUpperCase() + cat.slice(1)
  }

  const featuredProduct = products[0] || null

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-black/8 transition-all">
      <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Mobile hamburger */}
        <button
          className="md:hidden p-2 text-black cursor-pointer"
          onClick={onOpenMobileMenu}
          aria-label="Toggle Navigation Menu"
        >
          <div className="w-5 h-0.5 bg-black mb-1" />
          <div className="w-5 h-0.5 bg-black mb-1" />
          <div className="w-5 h-0.5 bg-black" />
        </button>

        {/* Brand Official Logo */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center hover:opacity-85 transition-opacity cursor-pointer text-left py-0.5"
            aria-label={`${tenant?.brandName || 'Brand'} Home`}
          >
            <BrandLogo tenant={tenant} />
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-[0.18em] uppercase">
            <div
              className="relative py-5 cursor-pointer group"
              onMouseEnter={() => setMegaOpen(true)}
              onMouseLeave={() => setMegaOpen(false)}
            >
              <button
                onClick={() => onNavigate('catalog', 'all')}
                className={`flex items-center gap-1 hover:text-black/60 transition-colors cursor-pointer ${
                  currentCategory ? 'text-black' : 'text-black/80'
                }`}
              >
                SHOP COLLECTIONS
                <span className="text-[9px]">▼</span>
              </button>

              {/* SHOP MEGA MENU */}
              {megaOpen && (
                <div className="absolute top-full left-0 w-[840px] bg-white border border-black/10 shadow-2xl p-8 grid grid-cols-4 gap-8 z-50 normal-case tracking-normal animate-slide-down">
                  {categoryList.slice(0, 3).map((cat) => {
                    const catProducts = products.filter((p) => p.category === cat)
                    return (
                      <div key={cat}>
                        <p className="text-xs font-bold tracking-widest uppercase text-black/40 mb-4">
                          {formatCatName(cat)}
                        </p>
                        <ul className="space-y-2.5 text-sm text-black/80 font-normal">
                          {catProducts.slice(0, 3).map((p) => (
                            <li key={p.id}>
                              <button
                                onClick={() => {
                                  setMegaOpen(false)
                                  onNavigate('catalog', cat)
                                }}
                                className="hover:font-semibold flex items-center justify-between w-full cursor-pointer text-left"
                              >
                                <span className="truncate pr-2">{p.name}</span>
                                {p.badge && (
                                  <span className="text-[9px] bg-black text-white px-1.5 py-0.5 font-mono flex-shrink-0">
                                    {p.badge.toUpperCase()}
                                  </span>
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}

                  <div className="bg-stone-100 p-4 relative group/card overflow-hidden">
                    {featuredProduct && (
                      <>
                        <img
                          src={featuredProduct.imgMain}
                          alt={featuredProduct.name}
                          className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover/card:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="relative h-full flex flex-col justify-end text-white">
                          <p className="text-[10px] tracking-widest uppercase font-bold text-white/70">SIGNATURE PIECE</p>
                          <p className="text-base font-serif leading-tight mb-2 truncate">{featuredProduct.name}</p>
                          <button
                            onClick={() => {
                              setMegaOpen(false)
                              onNavigate('catalog', 'all')
                            }}
                            className="text-xs font-semibold uppercase tracking-widest underline underline-offset-4 cursor-pointer"
                          >
                            Explore All →
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onOpenAbout}
              className="text-black/80 hover:text-black transition-colors cursor-pointer"
            >
              ABOUT
            </button>
            <button
              onClick={onOpenContact}
              className="text-black/80 hover:text-black transition-colors cursor-pointer"
            >
              CONTACT
            </button>
          </nav>
        </div>

        {/* Right Nav Icons */}
        <div className="flex items-center gap-4 md:gap-5">
          {/* User Account / Login & Orders trigger */}
          {user ? (
            <button
              onClick={onOpenAccount}
              className="flex items-center gap-2 text-xs font-bold tracking-wider text-black hover:bg-stone-100 px-2.5 py-1.5 border border-black/20 hover:border-black transition-all cursor-pointer rounded-xs"
              title="My Account & Track Orders"
            >
              <div className="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline uppercase">{user.name.split(' ')[0]}</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-xs flex items-center gap-1">
                <span>ORDERS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-black hover:text-black/70 px-2.5 py-1.5 border border-black/25 hover:border-black transition-all cursor-pointer rounded-xs bg-stone-50"
              title="Log in to track orders"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>LOG IN</span>
            </button>
          )}

          {/* Search trigger */}
          <button
            onClick={onOpenSearch}
            className="text-black/80 hover:text-black transition-colors p-1.5 flex items-center gap-1 text-xs font-medium uppercase tracking-wider cursor-pointer"
            aria-label="Search Catalog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="hidden lg:inline">Search</span>
          </button>

          {/* Wishlist count trigger */}
          <button
            onClick={onOpenWishlist}
            className="relative p-1 text-black/80 hover:text-black transition-colors cursor-pointer"
            title="View Wishlist"
            aria-label="View Wishlist"
          >
            <span className="text-sm">♥</span>
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-amber-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Bag Icon */}
          <button
            onClick={onOpenCart}
            className="flex items-center gap-2 text-black hover:opacity-75 transition-opacity relative p-1 active:scale-95 duration-150 cursor-pointer"
            aria-label="Open Shopping Bag"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="bg-black text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center -ml-1 shadow-md">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}

// 2b. Mobile Navigation Side Drawer
function MobileMenuDrawer({
  tenant,
  products = PRODUCTS,
  isOpen,
  onClose,
  onNavigate,
  onOpenWishlist,
  onOpenSearch,
  onOpenAuth,
  onOpenAccount,
  onOpenAbout,
  onOpenContact,
  user,
  wishlistCount,
}: {
  tenant?: TenantConfig | null
  products?: Product[]
  isOpen: boolean
  onClose: () => void
  onNavigate: (view: 'home' | 'catalog', category?: string) => void
  onOpenWishlist: () => void
  onOpenSearch: () => void
  onOpenAuth: () => void
  onOpenAccount: () => void
  onOpenAbout: () => void
  onOpenContact: () => void
  user: UserAccount | null
  wishlistCount: number
}) {
  if (!isOpen) return null

  const safeProducts = products || PRODUCTS
  const categories = Array.from(new Set(safeProducts.map((p) => p.category)))

  return (
    <div className="fixed inset-0 z-50 overflow-hidden md:hidden">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in" />
      <div className="absolute inset-y-0 left-0 max-w-full flex pr-10">
        <div className="w-screen max-w-xs bg-white shadow-2xl flex flex-col justify-between animate-slide-down p-6">
          <div>
            <div className="flex items-center justify-between border-b border-black/10 pb-4 mb-6">
              <BrandLogo tenant={tenant} />
              <button onClick={onClose} className="text-black/60 text-lg cursor-pointer">✕</button>
            </div>

            <nav className="flex flex-col space-y-4 text-xs font-bold tracking-[0.18em] uppercase">
              <button
                onClick={() => { onClose(); onNavigate('home') }}
                className="text-left py-2 hover:text-black/60 border-b border-black/5 cursor-pointer"
              >
                HOME
              </button>
              <button
                onClick={() => { onClose(); onNavigate('catalog', 'all') }}
                className="text-left py-2 hover:text-black/60 border-b border-black/5 flex items-center justify-between cursor-pointer"
              >
                <span>ALL COLLECTIONS</span>
                <span className="text-[10px] bg-black text-white px-2 py-0.5 font-mono">NEW</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { onClose(); onNavigate('catalog', cat) }}
                  className="text-left py-2 hover:text-black/60 border-b border-black/5 cursor-pointer"
                >
                  {cat.toUpperCase()}
                </button>
              ))}
              <button
                onClick={() => { onClose(); onOpenAbout() }}
                className="text-left py-2 hover:text-black/60 border-b border-black/5 cursor-pointer text-amber-900"
              >
                ABOUT OUR STUDIO
              </button>
              <button
                onClick={() => { onClose(); onOpenContact() }}
                className="text-left py-2 hover:text-black/60 border-b border-black/5 cursor-pointer text-amber-900"
              >
                CONTACT & CARE
              </button>
            </nav>
          </div>

          <div className="border-t border-black/10 pt-6 space-y-3">
            {user ? (
              <button
                onClick={() => { onClose(); onOpenAccount() }}
                className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-2.5 text-xs font-bold tracking-widest uppercase hover:bg-black cursor-pointer"
              >
                📦 MY ORDERS & TRACKING ({user.name.split(' ')[0]})
              </button>
            ) : (
              <button
                onClick={() => { onClose(); onOpenAuth() }}
                className="w-full flex items-center justify-center gap-2 bg-black text-white py-2.5 text-xs font-bold tracking-widest uppercase hover:bg-stone-800 cursor-pointer"
              >
                🔐 LOG IN & TRACK ORDERS
              </button>
            )}

            <button
              onClick={() => { onClose(); onOpenSearch() }}
              className="w-full flex items-center justify-center gap-2 border border-black/20 py-2.5 text-xs font-bold tracking-widest uppercase hover:bg-stone-50 cursor-pointer"
            >
              🔍 SEARCH STORE
            </button>
            <button
              onClick={() => { onClose(); onOpenWishlist() }}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-2.5 text-xs font-bold tracking-widest uppercase hover:bg-stone-800 cursor-pointer"
            >
              ♥ MY WISHLIST ({wishlistCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 2c. Wishlist Drawer Component
function WishlistDrawer({
  isOpen,
  onClose,
  products,
  wishlistIds,
  onRemoveWishlist,
  onSelectProduct,
}: {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  wishlistIds: number[]
  onRemoveWishlist: (id: number) => void
  onSelectProduct: (id: number) => void
}) {
  if (!isOpen) return null

  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id))

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in" />
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-slide-in-right">
          <div className="p-6 border-b border-black/10 flex items-center justify-between bg-stone-50">
            <h2 className="text-xl font-serif text-black uppercase tracking-wider">
              MY WISHLIST ({wishlistedProducts.length})
            </h2>
            <button onClick={onClose} className="text-black/60 hover:text-black p-1 text-xl font-light cursor-pointer">
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {wishlistedProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-black/50 py-16">
                <span className="text-4xl mb-3">♡</span>
                <p className="text-lg font-serif text-black mb-1">Your wishlist is empty</p>
                <p className="text-xs mb-6 max-w-xs">Save your favorite pieces and custom items here.</p>
                <button
                  onClick={onClose}
                  className="bg-black text-white font-bold text-xs tracking-widest uppercase px-6 py-3 cursor-pointer"
                >
                  DISCOVER PRODUCTS
                </button>
              </div>
            ) : (
              wishlistedProducts.map((product) => (
                <div key={product.id} className="flex gap-4 border-b border-black/10 pb-6">
                  <img
                    src={product.imgMain}
                    alt={product.name}
                    className="w-20 h-26 object-cover bg-stone-100 border border-black/10 cursor-pointer"
                    onClick={() => { onSelectProduct(product.id); onClose() }}
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4
                        onClick={() => { onSelectProduct(product.id); onClose() }}
                        className="font-bold text-sm text-black hover:underline cursor-pointer"
                      >
                        {product.name}
                      </h4>
                      <p className="text-xs font-mono font-bold text-amber-700 mt-1">{product.sculptLevel}</p>
                      <p className="text-sm font-bold text-black mt-1">{product.priceFormatted}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <button
                        onClick={() => { onSelectProduct(product.id); onClose() }}
                        className="bg-black text-white px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase hover:bg-stone-800 cursor-pointer"
                      >
                        SELECT OPTIONS & ADD
                      </button>

                      <button
                        onClick={() => onRemoveWishlist(product.id)}
                        className="text-xs text-black/40 hover:text-red-600 underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 3. Hero Section
function HeroSection({
  tenant,
  onShopClick,
}: {
  tenant?: TenantConfig | null
  onShopClick: () => void
}) {
  const heroImage = tenant?.theme?.heroImage || 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5227_1.jpg?v=1778607243'
  const brandTitle = tenant?.brandName || 'THE LUNAR CLOTHING'
  const headline = tenant?.theme?.heroHeadline || tenant?.tagline || brandTitle
  const subhead = tenant?.theme?.heroSubhead || 'Handcrafted collections with pure breathable fabrics, master heritage craftsmanship, and functional luxury details.'
  const ctaText = tenant?.theme?.heroCtaText || 'EXPLORE COLLECTIONS →'
  const announcementSub = tenant?.theme?.announcementMessages?.[0] || 'HANDCRAFTED ARTISANAL ETHNIC COLLECTION'

  return (
    <section className="relative h-[88vh] min-h-[640px] bg-stone-950 flex items-center justify-center overflow-hidden">
      <img
        src={heroImage}
        alt={brandTitle}
        className="absolute inset-0 w-full h-full object-cover object-center opacity-70 scale-105 transition-all duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

      <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
        <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold tracking-[0.25em] uppercase px-4 py-1.5 mb-6 inline-block border border-white/30">
          {announcementSub}
        </span>
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-normal tracking-tight uppercase leading-[0.95] mb-6 text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {headline}
        </h1>
        <p className="text-sm md:text-lg tracking-widest text-white/80 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
          {subhead}
        </p>
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <button
            onClick={onShopClick}
            className="bg-white text-black font-bold text-xs tracking-[0.2em] uppercase px-9 py-4 hover:bg-black hover:text-white border border-white transition-all duration-300 shadow-2xl active:scale-95 cursor-pointer"
          >
            {ctaText}
          </button>
        </div>
      </div>
    </section>
  )
}

// 4. Trust Banner - Moving Ticker
function TrustBar({ tenant }: { tenant?: TenantConfig | null }) {
  const brandShort = tenant?.brandName?.split(' ')?.[0] || 'LUNAR'
  const items = [
    { icon: '🌐', text: 'FREE SHIPPING IN INDIA > ₹999' },
    { icon: '❇️', text: '100% AUTHENTIC ARTISANAL CRAFT' },
    { icon: '🛡️', text: 'QUALITY CERTIFIED & TESTED' },
    { icon: '❇️', text: `10,000+ HAPPY ${brandShort.toUpperCase()} CLIENTS` },
    { icon: '💧', text: 'HANDLOOM & HERITAGE WEAVES' },
    { icon: '⚡', text: '100% SATISFACTION GUARANTEE' },
    { icon: '🌐', text: 'FREE SHIPPING IN INDIA > ₹999' },
    { icon: '❇️', text: '100% AUTHENTIC ARTISANAL CRAFT' },
    { icon: '🛡️', text: 'QUALITY CERTIFIED & TESTED' },
    { icon: '❇️', text: `10,000+ HAPPY ${brandShort.toUpperCase()} CLIENTS` },
    { icon: '💧', text: 'HANDLOOM & HERITAGE WEAVES' },
    { icon: '⚡', text: '100% SATISFACTION GUARANTEE' },
  ]

  return (
    <div className="bg-white/80 backdrop-blur-xs border-y border-black/10 py-3.5 overflow-hidden relative select-none z-10">
      <div className="animate-marquee flex items-center whitespace-nowrap gap-16 text-xs font-bold tracking-[0.18em] uppercase text-black">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-16">
            <div className="flex items-center gap-2">
              <span className="text-sm">{item.icon}</span>
              <span>{item.text}</span>
            </div>
            <span className="text-black/20 text-[10px]">✦</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 5. Product Card
function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onSelectProduct,
}: {
  product: Product
  isWishlisted: boolean
  onToggleWishlist: (id: number) => void
  onSelectProduct: (id: number) => void
}) {
  const [hovered, setHovered] = useState(false)
  const secondaryImage = product.images[1] || product.imgMain

  return (
    <div
      className="group cursor-pointer flex-shrink-0 w-64 md:w-72 relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        onClick={() => onSelectProduct(product.id)}
        className="relative aspect-[4/5] bg-stone-100 overflow-hidden mb-3 shadow-md"
      >
        <img
          src={hovered ? secondaryImage : product.imgMain}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {product.badge && (
            <span className="bg-black text-white text-[9px] font-bold tracking-widest uppercase px-2 py-1 shadow-sm">
              {product.badge}
            </span>
          )}
          <span className="bg-white/95 backdrop-blur-sm text-black text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 border border-black/10">
            {product.sculptLevel}
          </span>
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleWishlist(product.id)
          }}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-xs transition-transform active:scale-75 shadow-sm cursor-pointer"
          title="Add to Wishlist"
        >
          <span className={isWishlisted ? 'text-red-600 scale-110' : 'text-black/50 hover:text-black'}>
            {isWishlisted ? '♥' : '♡'}
          </span>
        </button>

        {/* Hover Quick View overlay button */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelectProduct(product.id)
            }}
            className="w-full bg-white/95 text-black font-bold text-[10px] tracking-widest uppercase py-2.5 shadow-md border border-black/10 hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            QUICK VIEW & SIZE →
          </button>
        </div>
      </div>

      <div onClick={() => onSelectProduct(product.id)}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-xs font-bold tracking-wider uppercase text-black/50">{product.fabricTech}</p>
          <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
            <span>★ {product.rating}</span>
            <span className="text-black/40">({product.reviewsCount})</span>
          </div>
        </div>

        <h3 className="text-sm font-semibold tracking-wide text-black group-hover:underline underline-offset-4 mb-1 truncate">
          {product.name}
        </h3>

        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-black">{product.priceFormatted}</p>
          <div className="flex items-center gap-1">
            {product.colors.map((c) => (
              <span
                key={c.name}
                className="w-2.5 h-2.5 rounded-full border border-black/20"
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// 6. Bestsellers Section
function BestsellersSection({
  tenant,
  products,
  wishlist,
  onToggleWishlist,
  onSelectProduct,
}: {
  tenant?: TenantConfig | null
  products: Product[]
  wishlist: number[]
  onToggleWishlist: (id: number) => void
  onSelectProduct: (id: number) => void
}) {
  const brandName = tenant?.brandName || 'The Lunar Clothing'
  return (
    <section className="py-20 bg-white/70 backdrop-blur-xs relative z-10">
      <div className="max-w-screen-2xl mx-auto px-6 mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-black/40 mb-2">HANDCRAFTED ARTISANAL COLLECTION</p>
          <h2 className="text-4xl md:text-5xl font-normal text-black" style={{ fontFamily: 'var(--font-display)' }}>
            {tenant?.brandName ? `${tenant.brandName.split(' ')[0]} Bestsellers` : 'Signature Bestsellers'}
          </h2>
        </div>
        <button
          onClick={() => onSelectProduct(products[0]?.id || 1)}
          className="text-xs font-bold tracking-widest uppercase text-black hover:text-black/60 border-b border-black pb-0.5 cursor-pointer"
        >
          VIEW ALL PRODUCTS →
        </button>
      </div>

      <div className="pl-6 md:pl-[max(24px,calc((100vw-1536px)/2+24px))] flex gap-6 overflow-x-auto scroll-hide pb-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isWishlisted={wishlist.includes(product.id)}
            onToggleWishlist={onToggleWishlist}
            onSelectProduct={onSelectProduct}
          />
        ))}
      </div>
    </section>
  )
}

// 8. Shop By Category Dark Carousel Section
function ShopByCategorySection({
  products,
  onSelectCategory,
}: {
  products: Product[]
  onSelectCategory: (cat: string) => void
}) {
  const scrollLeft = () => {
    const el = document.getElementById('category-scroll-container')
    if (el) el.scrollBy({ left: -520, behavior: 'smooth' })
  }

  const scrollRight = () => {
    const el = document.getElementById('category-scroll-container')
    if (el) el.scrollBy({ left: 520, behavior: 'smooth' })
  }

  const categories = useMemo(() => {
    const map = new Map<string, { name: string; category: string; img: string }>()
    products.forEach((p) => {
      if (!map.has(p.category)) {
        const displayName = p.category === 'maxis' ? 'KURTAS & MAXIS →'
          : p.category === 'dresses' ? 'SAREES & DRESSES →'
          : p.category === 'kalamkari' ? 'PRINTS & STOLES →'
          : p.category === 'handloom' ? 'HANDLOOM WEAVES →'
          : `${p.category.toUpperCase()} →`

        map.set(p.category, {
          name: displayName,
          category: p.category,
          img: p.imgMain,
        })
      }
    })
    return Array.from(map.values())
  }, [products])

  return (
    <section className="py-24 md:py-32 bg-[#141414] text-white border-t border-white/10 select-none">
      <div className="max-w-screen-2xl mx-auto px-6 mb-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm md:text-base font-bold tracking-[0.25em] uppercase text-white/90">
            SHOP BY CATEGORY
          </h2>
          <span className="text-sm text-white/50">↘</span>
        </div>

        {/* Arrow Navigation Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={scrollLeft}
            className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white hover:text-black flex items-center justify-center text-lg font-bold transition-all active:scale-90 border border-white/10 shadow-lg cursor-pointer"
            aria-label="Scroll left"
          >
            ←
          </button>
          <button
            onClick={scrollRight}
            className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white hover:text-black flex items-center justify-center text-lg font-bold transition-all active:scale-90 border border-white/10 shadow-lg cursor-pointer"
            aria-label="Scroll right"
          >
            →
          </button>
        </div>
      </div>

      <div
        id="category-scroll-container"
        className="pl-6 md:pl-[max(24px,calc((100vw-1536px)/2+24px))] flex gap-6 md:gap-8 overflow-x-auto scroll-hide pb-4"
      >
        {categories.map((cat, idx) => (
          <div
            key={idx}
            onClick={() => onSelectCategory(cat.category)}
            className="flex-shrink-0 w-[82vw] sm:w-[420px] md:w-[480px] lg:w-[540px] group cursor-pointer"
          >
            <div className="relative aspect-[3/4] md:h-[680px] lg:h-[740px] w-full overflow-hidden bg-stone-900 shadow-2xl border border-white/10 mb-4">
              <img
                src={cat.img}
                alt={cat.name}
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <p className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-white group-hover:underline underline-offset-4 font-sans">
              {cat.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

// 9. Fabric Matrix
function LeggingsFabricMatrix({
  products,
  onSelectProduct,
}: {
  products: Product[]
  onSelectProduct: (id: number) => void
}) {
  const fabrics = useMemo(() => {
    return products.slice(0, 4).map((p, idx) => ({
      num: `0${idx + 1}`,
      title: `${p.fabricTech.toUpperCase()}©`,
      sculpt: p.sculptLevel,
      desc: p.fabricDesc,
      img: p.imgMain,
      id: p.id,
    }))
  }, [products])

  return (
    <section className="py-20 bg-[#F5F4F1]/75 backdrop-blur-xs relative z-10">
      <div className="max-w-screen-2xl mx-auto px-6 mb-12">
        <p className="text-xs font-bold tracking-[0.25em] uppercase text-black/40 mb-2">CRAFT & FABRIC MATRIX</p>
        <h2 className="text-4xl md:text-5xl font-normal text-black" style={{ fontFamily: 'var(--font-display)' }}>
          Signature Fabric Weaves
        </h2>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {fabrics.map((f) => (
          <div
            key={f.num}
            onClick={() => onSelectProduct(f.id)}
            className="group cursor-pointer relative bg-stone-900 overflow-hidden aspect-[3/4] shadow-lg"
          >
            <img
              src={f.img}
              alt={f.title}
              className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-serif text-white/50">{f.num}</span>
                <span className="text-[9px] font-mono tracking-widest bg-white/20 backdrop-blur-md text-white px-2 py-0.5">
                  {f.sculpt}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-serif leading-tight mb-1">{f.title}</h3>
                <p className="text-xs text-white/70 leading-relaxed mb-4">{f.desc}</p>
                <span className="text-xs font-bold tracking-widest uppercase underline underline-offset-4 group-hover:text-white">
                  EXPLORE WEAVE →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// 10. Triptych Category Banner
function ActivityTriptych({
  products,
  onSelectProduct,
}: {
  products: Product[]
  onSelectProduct: (id: number) => void
}) {
  const activities = useMemo(() => {
    return products.slice(0, 3).map((p) => ({
      title: p.name.toUpperCase(),
      img: p.imgMain,
      id: p.id,
    }))
  }, [products])

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 h-[65vh] min-h-[480px]">
      {activities.map((a) => (
        <div
          key={a.id}
          onClick={() => onSelectProduct(a.id)}
          className="relative overflow-hidden group cursor-pointer bg-stone-900"
        >
          <img
            src={a.img}
            alt={a.title}
            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8 text-white max-w-xs">
            <p className="text-xs tracking-[0.2em] font-semibold uppercase text-white/60 mb-2">← EXPLORE RANGE</p>
            <h3 className="text-3xl md:text-4xl font-serif uppercase tracking-tight line-clamp-2">{a.title}</h3>
          </div>
        </div>
      ))}
    </section>
  )
}

// 11. Mission Block
function MissionBlock({
  tenant,
  onShopClick,
}: {
  tenant?: TenantConfig | null
  onShopClick: () => void
}) {
  const brandName = tenant?.brandName || 'The Lunar Clothing'
  const owner = tenant?.ownerName || 'Our Artisans'
  const bgImg = tenant?.theme?.heroImage || 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_2171_1.jpg?v=1766941862'

  return (
    <section className="relative py-36 md:py-48 bg-stone-950 text-center text-white overflow-hidden select-none border-t border-white/10">
      <img
        src={bgImg}
        alt={`${brandName} Philosophy`}
        className="absolute inset-0 w-full h-full object-cover opacity-25 object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />

      <div className="relative z-10 max-w-3xl mx-auto px-6">
        <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-white/70 mb-4 font-mono">
          THE {brandName.toUpperCase()} PHILOSOPHY
        </p>

        <h2
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-normal leading-none uppercase mb-6 tracking-tight text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          LESS BUT BETTER.
        </h2>

        <p className="text-xs sm:text-sm md:text-base font-light text-white/80 max-w-xl mx-auto mb-10 leading-relaxed font-sans">
          {brandName} was created by {owner} with a genuine desire for less but better. Pure artisanal fabrics, conscious craftsmanship, and timeless quality created to last.
        </p>

        <div className="flex items-center justify-center">
          <button
            onClick={onShopClick}
            className="bg-white text-black font-bold text-xs tracking-[0.2em] uppercase px-8 py-3.5 hover:bg-black hover:text-white border border-white transition-all shadow-2xl active:scale-95 cursor-pointer"
          >
            OUR STORY →
          </button>
        </div>
      </div>
    </section>
  )
}

// 12. Reviews Section & Modal Component
function CustomerReviewsSection({
  productId,
  reviews,
  onAddReviewClick,
}: {
  productId: number
  reviews: Review[]
  onAddReviewClick: () => void
}) {
  const productReviews = reviews.filter((r) => r.productId === productId || r.productId === 1)
  const avgRating = productReviews.length
    ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
    : '4.9'

  return (
    <div className="border-t border-black/10 pt-16 mt-16">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
        <div>
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-black/40 mb-1">VERIFIED REVIEWS</p>
          <h2 className="text-3xl font-serif text-black">Customer Ratings & Reviews</h2>
        </div>

        <button
          onClick={onAddReviewClick}
          className="bg-black text-white font-bold text-xs tracking-widest uppercase px-6 py-3 hover:bg-stone-800 cursor-pointer"
        >
          WRITE A REVIEW +
        </button>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12 bg-stone-50 border border-black/10 p-6 md:p-8">
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-black/10 pr-0 md:pr-8 pb-6 md:pb-0">
          <span className="text-5xl font-bold font-serif text-black">{avgRating}</span>
          <div className="text-amber-500 text-lg my-1">★★★★★</div>
          <p className="text-xs text-black/50 uppercase tracking-wider font-semibold">
            Based on {productReviews.length} Verified Buyer Reviews
          </p>
        </div>

        <div className="md:col-span-8 flex flex-col justify-center space-y-2 text-xs">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = productReviews.filter((r) => r.rating === stars).length
            const pct = productReviews.length ? Math.round((count / productReviews.length) * 100) : stars === 5 ? 85 : 15
            return (
              <div key={stars} className="flex items-center gap-3">
                <span className="w-10 font-bold text-black">{stars} Stars</span>
                <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-10 text-right text-black/50 font-mono">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-6">
        {productReviews.map((rev) => (
          <div key={rev.id} className="border-b border-black/10 pb-6 text-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-amber-500 text-sm">{'★'.repeat(rev.rating)}</span>
                <h4 className="font-bold text-black text-sm">{rev.title}</h4>
              </div>
              <span className="text-black/40">{rev.date}</span>
            </div>

            <p className="text-black/70 leading-relaxed mb-2 font-normal">{rev.comment}</p>

            <div className="flex items-center gap-2 text-[10px] text-black/50 font-medium">
              <span className="font-bold text-black">{rev.author}</span>
              {rev.verified && (
                <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-xs">
                  ✓ VERIFIED BUYER
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function WriteReviewModal({
  isOpen,
  onClose,
  onSaveReview,
}: {
  isOpen: boolean
  onClose: () => void
  onSaveReview: (review: { author: string; rating: number; title: string; comment: string }) => void
}) {
  const [rating, setRating] = useState(5)
  const [author, setAuthor] = useState('')
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!author.trim() || !comment.trim()) return
    onSaveReview({ author, rating, title, comment })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full p-8 border border-black/10 shadow-2xl relative animate-slide-down">
        <button onClick={onClose} className="absolute top-4 right-4 text-black/50 hover:text-black text-xl cursor-pointer">
          ✕
        </button>

        <h3 className="text-2xl font-serif text-black mb-2">Write a Product Review</h3>
        <p className="text-xs text-black/60 mb-6">Share your honest experience with The Lunar Clothing cotton fabric, sizing & fit.</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-black mb-1">Select Rating</label>
            <div className="flex gap-2 text-2xl cursor-pointer">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  className={star <= rating ? 'text-amber-500' : 'text-stone-300'}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-black mb-1">Your Name *</label>
            <input
              type="text"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Sneha P."
              className="w-full border border-black/20 p-2.5 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-black mb-1">Review Headline</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Loved the pockets & soft fabric!"
              className="w-full border border-black/20 p-2.5 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-black mb-1">Detailed Comment *</label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How does it fit? How is the cotton quality?"
              className="w-full border border-black/20 p-2.5 outline-none focus:border-black"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white font-bold text-xs uppercase tracking-widest py-3.5 hover:bg-stone-800 cursor-pointer"
          >
            SUBMIT REVIEW
          </button>
        </form>
      </div>
    </div>
  )
}

// 13. PRODUCT DETAIL PAGE (PDP) WITH MAGNIFIER LENS & LUNAR ADD-ONS
function ProductDetailPage({
  product,
  wishlist,
  reviews,
  products = PRODUCTS,
  tenant,
  onToggleWishlist,
  onAddToCart,
  onBack,
  onSelectProduct,
  onSaveReview,
}: {
  product: Product
  wishlist: number[]
  reviews: Review[]
  products?: Product[]
  tenant?: TenantConfig
  onToggleWishlist: (id: number) => void
  onAddToCart: (
    product: Product,
    color: { name: string; hex: string },
    size: string,
    lining: string,
    zip: string,
    length: string,
    qty: number,
    totalUnitPrice: number
  ) => void
  onBack: () => void
  onSelectProduct: (id: number) => void
  onSaveReview: (review: { author: string; rating: number; title: string; comment: string }) => void
}) {
  const [selectedColor, setSelectedColor] = useState(product.colors[0])
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  const [selectedSize, setSelectedSize] = useState('S')

  const [selectedLining, setSelectedLining] = useState<'No Lining' | 'Lining'>('No Lining')
  const [selectedZip, setSelectedZip] = useState<'None' | 'Double Zip' | 'Center Zip'>('None')
  const [selectedLength, setSelectedLength] = useState<'44 inch' | '46 inch' | '48 inch' | '50 inch'>('44 inch')

  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [openAccordion, setOpenAccordion] = useState<'fabric' | 'fit' | 'shipping' | null>('fabric')
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [showWriteReview, setShowWriteReview] = useState(false)
  const [addedToast, setAddedToast] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })

  const liningPrice = selectedLining === 'Lining' ? 100 : 0
  const zipPrice = selectedZip === 'Double Zip' ? 120 : selectedZip === 'Center Zip' ? 100 : 0
  const lengthPrice = selectedLength === '46 inch' ? 50 : selectedLength === '48 inch' ? 80 : selectedLength === '50 inch' ? 100 : 0

  const unitPrice = product.price + liningPrice + zipPrice + lengthPrice
  const totalPrice = unitPrice * quantity

  const activeImage = product.images[activeImageIndex] || product.imgMain
  const isWishlisted = wishlist.includes(product.id)
  const isSoldOut = selectedSize === 'XS'

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }

  const handleAdd = () => {
    if (isSoldOut) return
    onAddToCart(product, selectedColor, selectedSize, selectedLining, selectedZip, selectedLength, quantity, unitPrice)
    setAddedToast(true)
    setTimeout(() => setAddedToast(false), 2500)
  }

  return (
    <div className="bg-white py-10 min-h-screen select-none">
      <div className="max-w-screen-2xl mx-auto px-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-xs text-black/50 tracking-wider uppercase">
            <button onClick={onBack} className="hover:text-black transition-colors font-medium cursor-pointer">
              STORE
            </button>
            <span>/</span>
            <span className="capitalize">{product.category}</span>
            <span>/</span>
            <span className="text-black font-semibold">{product.name}</span>
          </div>

          <button
            onClick={() => onToggleWishlist(product.id)}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-black/70 hover:text-black cursor-pointer"
          >
            <span className={isWishlisted ? 'text-red-600 text-sm' : ''}>{isWishlisted ? '♥ SAVED' : '♡ SAVE TO WISHLIST'}</span>
          </button>
        </div>

        {/* PDP Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          {/* Left Gallery */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[600px] scroll-hide">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative flex-shrink-0 w-20 aspect-[4/5] bg-stone-100 border-2 transition-all cursor-pointer ${
                    activeImageIndex === idx ? 'border-black opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Display Image */}
            <div
              className="relative flex-1 aspect-[4/5] bg-stone-100 overflow-hidden shadow-sm cursor-zoom-in"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <img
                src={activeImage}
                alt={product.name}
                className={`w-full h-full object-cover transition-transform duration-200 ${
                  isZoomed ? 'scale-150 origin-center' : 'scale-100'
                }`}
                style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
              />
              {product.badge && (
                <span className="absolute top-4 left-4 bg-black text-white text-xs font-bold tracking-widest uppercase px-3 py-1.5 shadow-md">
                  {product.badge}
                </span>
              )}
              {isSoldOut && (
                <span className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold tracking-widest uppercase px-3 py-1.5 shadow-md">
                  SOLD OUT
                </span>
              )}
              <span className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-black text-[10px] font-bold tracking-widest uppercase px-2.5 py-1">
                🔍 HOVER TO MAGNIFY FABRIC
              </span>
            </div>
          </div>

          {/* Right Product Options & Customizations */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono font-bold bg-black text-white px-2 py-0.5">
                {product.sculptLevel}
              </span>
              <span className="text-xs font-bold tracking-[0.25em] uppercase text-black/40">
                {product.fabricTech}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-normal text-black mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              {product.name}
            </h1>

            {/* Rating & Dynamic Price row */}
            <div className="flex items-center justify-between border-b border-black/10 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="flex text-amber-500 text-sm">★★★★★</div>
                <span className="text-xs font-semibold text-black">{product.rating}</span>
                <span className="text-xs text-black/40">({product.reviewsCount} verified reviews)</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-black/40 font-medium">Regular Price</p>
                <p className="text-2xl font-bold text-black">₹{unitPrice.toLocaleString()}</p>
              </div>
            </div>

            <p className="text-sm text-black/70 leading-relaxed mb-6">{product.desc}</p>

            {/* Size Selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-bold tracking-widest uppercase text-black">
                  Size: <span className="text-black/60 font-normal">{selectedSize}</span>
                </label>
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="text-xs font-medium text-black/60 hover:text-black underline underline-offset-2 cursor-pointer"
                >
                  Size Guide & Measurements
                </button>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {availableSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`py-2.5 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      selectedSize === s
                        ? 'border-black bg-black text-white'
                        : 'border-black/20 bg-white text-black hover:border-black'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {isSoldOut ? (
                <p className="text-xs font-bold text-red-600 mt-2 flex items-center gap-1">
                  <span>⛔ Size {selectedSize} is currently Sold Out</span>
                </p>
              ) : (
                <p className="text-[11px] text-amber-700 font-medium mt-2">
                  ⚡ Stock Alert: Only 3 items left in size {selectedSize}!
                </p>
              )}
            </div>

            {/* --- ADD-ON CUSTOMIZATIONS --- */}
            <div className="mb-5 bg-stone-50 border border-black/10 p-3.5 rounded-sm">
              <label className="block text-xs font-bold tracking-widest uppercase text-black mb-2 flex items-center justify-between">
                <span>Lining (Add on)</span>
                {liningPrice > 0 && <span className="text-amber-700 font-semibold">+ ₹100.00</span>}
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedLining('No Lining')}
                  className={`py-2 px-3 border font-semibold tracking-wider text-center transition-all cursor-pointer ${
                    selectedLining === 'No Lining'
                      ? 'border-black bg-black text-white'
                      : 'border-black/20 bg-white text-black/80 hover:border-black'
                  }`}
                >
                  No Lining (+ ₹0)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLining('Lining')}
                  className={`py-2 px-3 border font-semibold tracking-wider text-center transition-all cursor-pointer ${
                    selectedLining === 'Lining'
                      ? 'border-black bg-black text-white'
                      : 'border-black/20 bg-white text-black/80 hover:border-black'
                  }`}
                >
                  Lining (+ ₹100.00)
                </button>
              </div>
            </div>

            <div className="mb-5 bg-stone-50 border border-black/10 p-3.5 rounded-sm">
              <label className="block text-xs font-bold tracking-widest uppercase text-black mb-2 flex items-center justify-between">
                <span>Feeding Zip (Add on)</span>
                {zipPrice > 0 && <span className="text-amber-700 font-semibold">+ ₹{zipPrice}.00</span>}
              </label>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedZip('None')}
                  className={`py-2 px-2 border font-semibold tracking-wider text-center transition-all cursor-pointer ${
                    selectedZip === 'None'
                      ? 'border-black bg-black text-white'
                      : 'border-black/20 bg-white text-black/80 hover:border-black'
                  }`}
                >
                  None (+ ₹0)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedZip('Double Zip')}
                  className={`py-2 px-2 border font-semibold tracking-wider text-center transition-all cursor-pointer ${
                    selectedZip === 'Double Zip'
                      ? 'border-black bg-black text-white'
                      : 'border-black/20 bg-white text-black/80 hover:border-black'
                  }`}
                >
                  Double Zip (+ ₹120.00)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedZip('Center Zip')}
                  className={`py-2 px-2 border font-semibold tracking-wider text-center transition-all cursor-pointer ${
                    selectedZip === 'Center Zip'
                      ? 'border-black bg-black text-white'
                      : 'border-black/20 bg-white text-black/80 hover:border-black'
                  }`}
                >
                  Center Zip (+ ₹100.00)
                </button>
              </div>
            </div>

            <div className="mb-6 bg-stone-50 border border-black/10 p-3.5 rounded-sm">
              <label className="block text-xs font-bold tracking-widest uppercase text-black mb-2 flex items-center justify-between">
                <span>Length (Add on)</span>
                {lengthPrice > 0 && <span className="text-amber-700 font-semibold">+ ₹{lengthPrice}.00</span>}
              </label>
              <div className="grid grid-cols-4 gap-2 text-[11px]">
                {(['44 inch', '46 inch', '48 inch', '50 inch'] as const).map((len) => {
                  const addCost = len === '46 inch' ? 50 : len === '48 inch' ? 80 : len === '50 inch' ? 100 : 0
                  return (
                    <button
                      key={len}
                      type="button"
                      onClick={() => setSelectedLength(len)}
                      className={`py-2 px-1 border font-semibold tracking-wider text-center transition-all cursor-pointer ${
                        selectedLength === len
                          ? 'border-black bg-black text-white'
                          : 'border-black/20 bg-white text-black/80 hover:border-black'
                      }`}
                    >
                      {len} {addCost > 0 ? `(+ ₹${addCost})` : '(Standard)'}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quantity Stepper & Add to Bag CTA */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-black/20">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-3.5 text-black hover:bg-stone-100 font-bold active:scale-90 cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 py-3.5 font-bold text-xs">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3.5 py-3.5 text-black hover:bg-stone-100 font-bold active:scale-90 cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAdd}
                disabled={isSoldOut}
                className={`flex-1 font-bold text-xs tracking-[0.2em] uppercase py-4 px-6 transition-colors shadow-lg active:scale-95 cursor-pointer ${
                  isSoldOut
                    ? 'bg-stone-300 text-stone-600 cursor-not-allowed border border-stone-300'
                    : 'bg-black text-white hover:bg-stone-800'
                }`}
              >
                {isSoldOut
                  ? `SOLD OUT — ₹${totalPrice.toLocaleString()}`
                  : addedToast
                  ? '✓ ADDED TO BAG!'
                  : `ADD TO BAG — ₹${totalPrice.toLocaleString()}`}
              </button>
            </div>

            {/* Guarantee Callout */}
            <div className="bg-[#F5F4F1] border border-black/10 p-4 mb-8 flex items-start gap-3 text-xs text-black/80">
              <span className="text-lg">🛡️</span>
              <div>
                <p className="font-bold uppercase tracking-wider text-black">30-Day Sweat & Fit Guarantee</p>
                <p className="text-black/60 mt-0.5">
                  100% soft breathable cotton fabric. If you aren't completely thrilled, return within 30 days for a full refund.
                </p>
              </div>
            </div>

            {/* Expandable Accordions */}
            <div className="border-t border-black/10 divide-y divide-black/10 text-xs">
              <div>
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'fabric' ? null : 'fabric')}
                  className="w-full py-4 flex items-center justify-between font-bold uppercase tracking-wider text-left text-black cursor-pointer"
                >
                  <span>FABRICATION & TECHNICAL DETAILS</span>
                  <span>{openAccordion === 'fabric' ? '−' : '+'}</span>
                </button>
                {openAccordion === 'fabric' && (
                  <div className="pb-4 text-black/70 space-y-2 leading-relaxed animate-slide-down">
                    <p className="font-medium text-black">{product.fabricDesc}</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {product.details.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'fit' ? null : 'fit')}
                  className="w-full py-4 flex items-center justify-between font-bold uppercase tracking-wider text-left text-black cursor-pointer"
                >
                  <span>FIT & SCULPT LEVEL</span>
                  <span>{openAccordion === 'fit' ? '−' : '+'}</span>
                </button>
                {openAccordion === 'fit' && (
                  <div className="pb-4 text-black/70 leading-relaxed animate-slide-down">
                    <p className="font-semibold text-black mb-1">Sculpt Rating: {product.sculptLevel}</p>
                    <p>{product.fitInfo}</p>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'shipping' ? null : 'shipping')}
                  className="w-full py-4 flex items-center justify-between font-bold uppercase tracking-wider text-left text-black cursor-pointer"
                >
                  <span>SHIPPING & RETURNS</span>
                  <span>{openAccordion === 'shipping' ? '−' : '+'}</span>
                </button>
                {openAccordion === 'shipping' && (
                  <div className="pb-4 text-black/70 leading-relaxed space-y-1 animate-slide-down">
                    <p>• Free Express Delivery across India on orders over ₹999</p>
                    <p>• Cash on Delivery & Instant UPI Available at checkout</p>
                    <p>• Easy 30-Day returns & exchange policy</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <CustomerReviewsSection
          productId={product.id}
          reviews={reviews}
          onAddReviewClick={() => setShowWriteReview(true)}
        />

        {/* Complete the look recommendation carousel */}
        <div className="border-t border-black/10 pt-16 mb-16">
          <h2 className="text-3xl font-normal font-serif text-black mb-8">Complete The Look</h2>
          <div className="flex gap-6 overflow-x-auto scroll-hide pb-4">
            {products.filter((p) => p.id !== product.id).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isWishlisted={wishlist.includes(p.id)}
                onToggleWishlist={onToggleWishlist}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Sizing Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white max-w-lg w-full p-8 border border-black/10 shadow-2xl relative animate-slide-down">
            <button
              onClick={() => setShowSizeGuide(false)}
              className="absolute top-4 right-4 text-black/50 hover:text-black text-xl cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-2xl font-serif text-black mb-2">{tenant?.name || 'The Lunar Clothing'} Size & Fit Guide</h3>
            <p className="text-xs text-black/60 mb-6">Measurements in inches. All cotton maxis feature attached side waist tie-up ropes for an adjustable flared fit.</p>

            <table className="w-full text-xs text-left border-collapse mb-6">
              <thead>
                <tr className="border-b border-black font-bold uppercase">
                  <th className="py-2">Size</th>
                  <th className="py-2">Bust</th>
                  <th className="py-2">Waist</th>
                  <th className="py-2">Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                <tr><td className="py-2.5 font-bold">XS</td><td>32-34"</td><td>26-28"</td><td>44" Standard (Up to 50")</td></tr>
                <tr><td className="py-2.5 font-bold">S</td><td>34-36"</td><td>28-30"</td><td>44" Standard (Up to 50")</td></tr>
                <tr><td className="py-2.5 font-bold">M</td><td>36-38"</td><td>30-32"</td><td>44" Standard (Up to 50")</td></tr>
                <tr><td className="py-2.5 font-bold">L</td><td>38-40"</td><td>32-34"</td><td>44" Standard (Up to 50")</td></tr>
                <tr><td className="py-2.5 font-bold">XL</td><td>40-42"</td><td>34-36"</td><td>44" Standard (Up to 50")</td></tr>
                <tr><td className="py-2.5 font-bold">XXL</td><td>42-44"</td><td>36-38"</td><td>44" Standard (Up to 50")</td></tr>
              </tbody>
            </table>

            <button
              onClick={() => setShowSizeGuide(false)}
              className="w-full bg-black text-white font-bold text-xs uppercase tracking-widest py-3 cursor-pointer"
            >
              GOT IT — CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={showWriteReview}
        onClose={() => setShowWriteReview(false)}
        onSaveReview={onSaveReview}
      />
    </div>
  )
}

// 14. SLIDE-OVER CART DRAWER
function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onStartCheckout,
}: {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  onUpdateQuantity: (index: number, delta: number) => void
  onRemoveItem: (index: number) => void
  onStartCheckout: () => void
}) {
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null)
  const [promoError, setPromoError] = useState('')

  if (!isOpen) return null

  const rawSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
  const discountAmount = appliedPromo === 'LUNAR15' ? Math.round(rawSubtotal * 0.15) : 0
  const subtotal = rawSubtotal - discountAmount

  const freeShippingThreshold = 999
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal)
  const freeShippingPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100)

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault()
    if (promoCode.trim().toUpperCase() === 'LUNAR15' || promoCode.trim().toUpperCase() === 'FIRST15') {
      setAppliedPromo('LUNAR15')
      setPromoError('')
    } else {
      setPromoError('Invalid code. Use LUNAR15 for 15% off!')
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in" />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
          <div className="p-6 border-b border-black/10 flex items-center justify-between bg-stone-50">
            <h2 className="text-xl font-serif text-black uppercase tracking-wider">
              YOUR BAG ({cart.reduce((sum, i) => sum + i.quantity, 0)})
            </h2>
            <button onClick={onClose} className="text-black/60 hover:text-black p-1 text-xl font-light cursor-pointer">
              ✕
            </button>
          </div>

          <div className="bg-black text-white px-6 py-3.5 text-xs">
            {remainingForFreeShipping > 0 ? (
              <p className="mb-2 tracking-wide font-medium">
                Add <span className="font-bold underline">₹{remainingForFreeShipping}</span> more for Free Delivery in India
              </p>
            ) : (
              <p className="mb-2 font-bold tracking-wide text-emerald-400">🎉 YOU QUALIFY FOR FREE DELIVERY IN INDIA!</p>
            )}
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${freeShippingPercent}%` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-black/50 py-12">
                <span className="text-4xl mb-3">🛍️</span>
                <p className="text-lg font-serif text-black mb-1">Your bag is empty</p>
                <p className="text-xs mb-6 max-w-xs">Explore our handcrafted Cotton Maxis and Mul Chanderi dresses.</p>
                <button
                  onClick={onClose}
                  className="bg-black text-white font-bold text-xs tracking-widest uppercase px-6 py-3 cursor-pointer"
                >
                  START SHOPPING
                </button>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="flex gap-4 border-b border-black/10 pb-6">
                  <img
                    src={item.product.imgMain}
                    alt={item.product.name}
                    className="w-20 h-24 object-cover bg-stone-100 border border-black/10"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between font-bold text-sm text-black">
                        <h4>{item.product.name}</h4>
                        <p>₹{(item.product.price * item.quantity).toLocaleString()}</p>
                      </div>

                      {/* Add-on custom tags display */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="bg-stone-100 border border-black/10 text-[10px] font-medium px-1.5 py-0.5 text-black">
                          Size: {item.selectedSize}
                        </span>
                        <span className="bg-stone-100 border border-black/10 text-[10px] font-medium px-1.5 py-0.5 text-black">
                          {item.selectedLining}
                        </span>
                        {item.selectedZip !== 'None' && (
                          <span className="bg-stone-100 border border-black/10 text-[10px] font-medium px-1.5 py-0.5 text-black">
                            {item.selectedZip}
                          </span>
                        )}
                        <span className="bg-stone-100 border border-black/10 text-[10px] font-medium px-1.5 py-0.5 text-black">
                          {item.selectedLength}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-black/20 text-xs">
                        <button
                          onClick={() => onUpdateQuantity(idx, -1)}
                          className="px-2.5 py-1 text-black font-bold hover:bg-stone-100 active:scale-90 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-3 font-bold">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(idx, 1)}
                          className="px-2.5 py-1 text-black font-bold hover:bg-stone-100 active:scale-90 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(idx)}
                        className="text-xs text-black/40 hover:text-black underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-6 border-t border-black/10 bg-stone-50 space-y-4">
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="PROMO CODE (e.g. LUNAR15)"
                  className="flex-1 border border-black/20 bg-white px-3 py-2 text-xs uppercase tracking-wider outline-none focus:border-black"
                />
                <button
                  type="submit"
                  className="bg-black text-white text-xs font-bold uppercase tracking-wider px-4 py-2 hover:bg-stone-800 cursor-pointer"
                >
                  APPLY
                </button>
              </form>

              {appliedPromo && (
                <p className="text-xs font-bold text-emerald-700 flex items-center justify-between">
                  <span>✓ Code LUNAR15 Applied (15% Off)</span>
                  <span>-₹{discountAmount.toLocaleString()}</span>
                </p>
              )}
              {promoError && <p className="text-xs text-red-600 font-medium">{promoError}</p>}

              <div className="border-t border-black/10 pt-3">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-black/60">Subtotal</span>
                  <span className="text-xl font-bold text-black">₹{subtotal.toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-black/50 mb-4">Taxes & shipping calculated at checkout.</p>
                <button
                  onClick={onStartCheckout}
                  className="w-full bg-black text-white font-bold text-xs tracking-[0.2em] uppercase py-4 shadow-lg hover:bg-stone-800 transition-colors active:scale-95 cursor-pointer"
                >
                  CHECKOUT NOW — ₹{subtotal.toLocaleString()}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 15. CHECKOUT MULTI-STEP MODAL
function CheckoutModal({
  isOpen,
  onClose,
  cart,
  subtotal,
  discountAmount,
  user,
  onOrderPlaced,
  onOpenAccount,
  onCompleteOrder,
}: {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  subtotal: number
  discountAmount: number
  user: UserAccount | null
  onOrderPlaced: (order: TrackedOrder) => void
  onOpenAccount: () => void
  onCompleteOrder: () => void
}) {
  const [step, setStep] = useState<'shipping' | 'payment' | 'success'>('shipping')
  const [formData, setFormData] = useState({
    name: user?.name || 'Priya Sharma',
    email: user?.email || 'priya.sharma@example.com',
    phone: user?.phone || '+91 98765 43210',
    address: 'Flat 402, Sunshine Heights, Jubilee Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500033',
    paymentMethod: 'upi',
  })
  const [orderId, setOrderId] = useState('')

  if (!isOpen) return null

  const shippingCost = subtotal >= 999 ? 0 : 70
  const finalTotal = subtotal + shippingCost

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('payment')
  }

  const handlePlaceOrder = () => {
    const generatedId = 'LUNAR-' + Math.floor(100000 + Math.random() * 900000)
    const awbCode = 'BD' + Math.floor(100000000 + Math.random() * 900000000) + 'IN'
    const newTrackedOrder: TrackedOrder = {
      id: generatedId,
      date: 'Just now',
      status: 'Processing',
      courier: 'Blue Dart Express',
      awb: awbCode,
      estimatedDelivery: '3 - 5 Business Days',
      subtotal,
      shipping: shippingCost,
      total: finalTotal,
      paymentMethod:
        formData.paymentMethod === 'upi'
          ? 'Instant UPI (GPay)'
          : formData.paymentMethod === 'cod'
          ? 'Cash on Delivery (COD)'
          : 'Credit / Debit Card',
      shippingAddress: {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      },
      items: cart.map((i) => ({
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        size: i.selectedSize,
        lining: i.selectedLining,
        zip: i.selectedZip,
        length: i.selectedLength,
        image: i.product.imgMain,
      })),
      timeline: [
        {
          title: 'Order Confirmed & Payment Verified',
          time: 'Just now',
          desc: 'Order received and logged in The Lunar Clothing fulfillment studio.',
          completed: true,
          current: true,
        },
        {
          title: 'Garment Tailoring & Quality Inspection',
          time: 'Pending Next Step',
          desc: 'Pieces prepared according to chosen length, lining, and zipper specifications.',
          completed: false,
        },
        {
          title: 'Dispatched with Blue Dart Express',
          time: 'Expected Tomorrow',
          desc: `Will be dispatched via Blue Dart Express (AWB: ${awbCode}).`,
          completed: false,
        },
        {
          title: 'Delivered to Doorstep',
          time: '3 - 5 Business Days',
          desc: `Doorstep delivery to ${formData.city}.`,
          completed: false,
        },
      ],
    }

    setOrderId(generatedId)
    onOrderPlaced(newTrackedOrder)
    setStep('success')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full border border-black/10 shadow-2xl rounded-sm overflow-hidden animate-slide-down my-8">
        <div className="bg-black text-white p-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono tracking-[0.25em] text-white/60 uppercase">SECURE CHECKOUT</p>
            <h2 className="text-xl font-serif">THE LUNAR CLOTHING</h2>
          </div>
          {step !== 'success' && (
            <button onClick={onClose} className="text-white/70 hover:text-white text-xl cursor-pointer">
              ✕
            </button>
          )}
        </div>

        <div className="bg-stone-100 px-6 py-3 border-b border-black/10 flex items-center justify-around text-xs font-bold tracking-widest uppercase">
          <span className={step === 'shipping' ? 'text-black border-b-2 border-black pb-0.5' : 'text-black/40'}>
            1. Shipping Address
          </span>
          <span className="text-black/30">→</span>
          <span className={step === 'payment' ? 'text-black border-b-2 border-black pb-0.5' : 'text-black/40'}>
            2. Payment Method
          </span>
          <span className="text-black/30">→</span>
          <span className={step === 'success' ? 'text-emerald-700 font-bold' : 'text-black/40'}>
            3. Confirmation & Tracking
          </span>
        </div>

        <div className="p-6 md:p-8">
          {step === 'shipping' && (
            <form onSubmit={handleShippingSubmit} className="space-y-4 text-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black mb-2">Delivery Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-black/60 font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-black/20 p-2.5 outline-none focus:border-black text-xs"
                  />
                </div>
                <div>
                  <label className="block text-black/60 font-medium mb-1">Phone Number (For WhatsApp Updates) *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-black/20 p-2.5 outline-none focus:border-black text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-black/60 font-medium mb-1">Email Address (For Order Tracking) *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-black/20 p-2.5 outline-none focus:border-black text-xs"
                />
              </div>

              <div>
                <label className="block text-black/60 font-medium mb-1">Street Address / House No. *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-black/20 p-2.5 outline-none focus:border-black text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-black/60 font-medium mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full border border-black/20 p-2.5 outline-none focus:border-black text-xs"
                  />
                </div>
                <div>
                  <label className="block text-black/60 font-medium mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full border border-black/20 p-2.5 outline-none focus:border-black text-xs"
                  />
                </div>
                <div>
                  <label className="block text-black/60 font-medium mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full border border-black/20 p-2.5 outline-none focus:border-black text-xs"
                  />
                </div>
              </div>

              <div className="bg-stone-50 border border-black/10 p-4 mt-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-black uppercase">Order Total</p>
                  <p className="text-black/50 text-[11px]">Free Express Delivery In India</p>
                </div>
                <p className="text-lg font-bold text-black">₹{finalTotal.toLocaleString()}</p>
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white font-bold text-xs tracking-[0.2em] uppercase py-3.5 mt-4 hover:bg-stone-800 cursor-pointer"
              >
                PROCEED TO PAYMENT →
              </button>
            </form>
          )}

          {step === 'payment' && (
            <div className="space-y-6 text-xs">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-black">Select Payment Option</h3>
                <button onClick={() => setStep('shipping')} className="text-black/50 hover:text-black underline cursor-pointer">
                  ← Edit Address
                </button>
              </div>

              <div className="space-y-3">
                <label className={`block border p-4 cursor-pointer transition-all ${
                  formData.paymentMethod === 'upi' ? 'border-black bg-stone-50' : 'border-black/20'
                }`}>
                  <div className="flex items-center gap-3 font-bold text-sm text-black">
                    <input
                      type="radio"
                      name="payment"
                      checked={formData.paymentMethod === 'upi'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'upi' })}
                    />
                    <span>Instant UPI / Google Pay / PhonePe / Paytm</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 ml-auto">
                      RECOMMENDED
                    </span>
                  </div>
                  {formData.paymentMethod === 'upi' && (
                    <p className="text-xs text-black/60 mt-2 pl-6">
                      Pay instantly via GPay, PhonePe, or Scan QR Code at delivery.
                    </p>
                  )}
                </label>

                <label className={`block border p-4 cursor-pointer transition-all ${
                  formData.paymentMethod === 'cod' ? 'border-black bg-stone-50' : 'border-black/20'
                }`}>
                  <div className="flex items-center gap-3 font-bold text-sm text-black">
                    <input
                      type="radio"
                      name="payment"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                    />
                    <span>Cash on Delivery (COD)</span>
                  </div>
                  {formData.paymentMethod === 'cod' && (
                    <p className="text-xs text-black/60 mt-2 pl-6">
                      Pay cash to courier executive upon delivery.
                    </p>
                  )}
                </label>

                <label className={`block border p-4 cursor-pointer transition-all ${
                  formData.paymentMethod === 'card' ? 'border-black bg-stone-50' : 'border-black/20'
                }`}>
                  <div className="flex items-center gap-3 font-bold text-sm text-black">
                    <input
                      type="radio"
                      name="payment"
                      checked={formData.paymentMethod === 'card'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'card' })}
                    />
                    <span>Credit Card / Debit Card / Net Banking</span>
                  </div>
                </label>
              </div>

              <div className="border-t border-black/10 pt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-black/60">Amount Payable</p>
                  <p className="text-xl font-bold text-black">₹{finalTotal.toLocaleString()}</p>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  className="bg-black text-white font-bold text-xs tracking-[0.2em] uppercase px-8 py-3.5 hover:bg-stone-800 shadow-lg cursor-pointer"
                >
                  PLACE ORDER NOW ✓
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 font-bold">
                ✓
              </div>
              <p className="text-xs font-mono font-bold tracking-[0.2em] text-emerald-700 uppercase mb-1">
                ORDER SUCCESSFULLY PLACED!
              </p>
              <h2 className="text-3xl font-serif text-black mb-2">Thank you for your order, {formData.name}!</h2>
              <p className="text-xs text-black/60 mb-6">
                Order ID: <span className="font-bold text-black font-mono">{orderId}</span> • A confirmation has been sent to <span className="font-medium text-black">{formData.email}</span>.
              </p>

              <div className="bg-stone-50 border border-black/10 p-4 text-left mb-6 text-xs space-y-3">
                <div className="flex justify-between border-b border-black/10 pb-2">
                  <span className="font-bold uppercase text-black/60">Shipping To:</span>
                  <span className="text-right text-black font-medium">{formData.address}, {formData.city}, {formData.pincode}</span>
                </div>
                <div className="flex justify-between border-b border-black/10 pb-2">
                  <span className="font-bold uppercase text-black/60">Estimated Delivery:</span>
                  <span className="text-emerald-700 font-bold">3 - 5 Business Days (Blue Dart Express)</span>
                </div>
                <div>
                  <p className="font-bold uppercase text-black/60 mb-2">Itemized Summary:</p>
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-black/5 text-[11px]">
                      <span>{item.quantity}x {item.product.name} (Size: {item.selectedSize}, {item.selectedLining}, {item.selectedZip}, {item.selectedLength})</span>
                      <span className="font-bold">₹{(item.product.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-2 text-sm font-bold text-black">
                  <span>Grand Total Paid</span>
                  <span>₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                <button
                  onClick={() => {
                    onCompleteOrder()
                    onClose()
                    onOpenAccount()
                  }}
                  className="bg-black text-white font-bold text-xs tracking-[0.2em] uppercase px-6 py-3.5 hover:bg-stone-800 cursor-pointer shadow-lg flex items-center justify-center gap-2"
                >
                  <span>📦 TRACK ORDER IN YOUR ACCOUNT →</span>
                </button>
                <button
                  onClick={() => {
                    onCompleteOrder()
                    onClose()
                  }}
                  className="border border-black/30 text-black font-bold text-xs tracking-[0.2em] uppercase px-6 py-3.5 hover:bg-stone-50 cursor-pointer"
                >
                  CONTINUE SHOPPING
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 15b. AUTHENTICATION MODAL (SIGN IN & REGISTER WITH EMAIL VERIFICATION)
function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: (user: UserAccount, isNew?: boolean) => void
}) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [signInEmail, setSignInEmail] = useState('priya.sharma@example.com')
  const [signInPassword, setSignInPassword] = useState('lunar123')
  const [showPassword, setShowPassword] = useState(false)
  const [signInError, setSignInError] = useState('')

  // Sign up state
  const [signUpStep, setSignUpStep] = useState<'form' | 'otp'>('form')
  const [signUpName, setSignUpName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPhone, setSignUpPhone] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('849201')
  const [otpError, setOtpError] = useState('')
  const [resendTimer, setResendTimer] = useState(30)

  useEffect(() => {
    let interval: any
    if (signUpStep === 'otp' && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [signUpStep, resendTimer])

  if (!isOpen) return null

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!signInEmail || !signInPassword) {
      setSignInError('Please provide both email and password.')
      return
    }
    const user: UserAccount = {
      name: signInEmail.includes('priya') ? 'Priya Sharma' : signInEmail.split('@')[0].toUpperCase(),
      email: signInEmail,
      phone: '+91 98765 43210',
      verified: true,
    }
    onLoginSuccess(user, false)
    onClose()
  }

  const handleFillDemo = () => {
    setSignInEmail('priya.sharma@example.com')
    setSignInPassword('lunar123')
    setSignInError('')
  }

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUpName || !signUpEmail || !signUpPassword) {
      setOtpError('Please fill out all mandatory fields.')
      return
    }
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(randomOtp)
    setSignUpStep('otp')
    setResendTimer(30)
    setOtpError('')
  }

  const handleVerifyOtpAndRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.trim() !== generatedOtp && otpCode.trim() !== '849201') {
      setOtpError('Invalid verification code. Please check and try again.')
      return
    }

    const newUser: UserAccount = {
      name: signUpName,
      email: signUpEmail,
      phone: signUpPhone || '+91 98765 00000',
      verified: true,
    }
    onLoginSuccess(newUser, true)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full border border-black/10 shadow-2xl rounded-sm overflow-hidden animate-slide-down">
        {/* Header */}
        <div className="bg-black text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/lunar-logo.png" alt="Lunar" className="h-8 w-auto object-contain rounded-md" />
            <div>
              <p className="text-[10px] font-mono tracking-[0.25em] text-white/60 uppercase">THE LUNAR CLOTHING</p>
              <h2 className="text-lg font-serif">Customer Portal & Tracking</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl cursor-pointer">
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-black/10 text-xs font-bold uppercase tracking-widest bg-stone-50">
          <button
            onClick={() => { setTab('signin'); setSignUpStep('form') }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              tab === 'signin' ? 'bg-white text-black border-b-2 border-black' : 'text-black/50 hover:text-black'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setSignUpStep('form') }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              tab === 'signup' ? 'bg-white text-black border-b-2 border-black' : 'text-black/50 hover:text-black'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {tab === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-900 rounded-xs flex items-center justify-between">
                <span>⚡ Test with demo account to view existing orders:</span>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="font-bold underline text-amber-950 hover:text-black cursor-pointer"
                >
                  Quick Fill
                </button>
              </div>

              <div>
                <label className="block text-black/60 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="e.g. priya.sharma@example.com"
                  className="w-full border border-black/20 p-2.5 outline-none focus:border-black text-xs"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-black/60 font-semibold">Password *</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-black/50 hover:text-black cursor-pointer"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-black/20 p-2.5 outline-none focus:border-black text-xs"
                />
              </div>

              {signInError && <p className="text-red-600 font-medium">{signInError}</p>}

              <button
                type="submit"
                className="w-full bg-black text-white font-bold text-xs tracking-[0.2em] uppercase py-3.5 mt-2 hover:bg-stone-800 transition-colors cursor-pointer shadow-md"
              >
                SIGN IN TO VIEW ORDERS →
              </button>

              <div className="text-center pt-2 text-black/50">
                <span>New to The Lunar Clothing? </span>
                <button
                  type="button"
                  onClick={() => { setTab('signup'); setSignUpStep('form') }}
                  className="text-black font-bold underline cursor-pointer"
                >
                  Register here
                </button>
              </div>
            </form>
          ) : (
            <div>
              {signUpStep === 'form' ? (
                <form onSubmit={handleSendOtp} className="space-y-3.5 text-xs">
                  <p className="text-[11px] text-black/60 mb-2">
                    Create an account to track all your orders, manage custom tailoring options, and get express support.
                  </p>

                  <div>
                    <label className="block text-black/60 font-semibold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full border border-black/20 p-2.5 outline-none focus:border-black text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-black/60 font-semibold mb-1">Email Address * (Will be verified)</label>
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="e.g. priya.sharma@example.com"
                      className="w-full border border-black/20 p-2.5 outline-none focus:border-black text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-black/60 font-semibold mb-1">Mobile Number (For Courier Updates)</label>
                    <input
                      type="tel"
                      value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full border border-black/20 p-2.5 outline-none focus:border-black text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-black/60 font-semibold mb-1">Create Password *</label>
                    <input
                      type="password"
                      required
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full border border-black/20 p-2.5 outline-none focus:border-black text-xs"
                    />
                  </div>

                  {otpError && <p className="text-red-600 font-medium">{otpError}</p>}

                  <button
                    type="submit"
                    className="w-full bg-black text-white font-bold text-xs tracking-[0.2em] uppercase py-3.5 mt-2 hover:bg-stone-800 transition-colors cursor-pointer shadow-md"
                  >
                    CONTINUE TO EMAIL VERIFICATION →
                  </button>

                  <div className="text-center pt-2 text-black/50">
                    <span>Already registered? </span>
                    <button
                      type="button"
                      onClick={() => setTab('signin')}
                      className="text-black font-bold underline cursor-pointer"
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtpAndRegister} className="space-y-4 text-xs">
                  <div className="text-center py-2">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xl mx-auto mb-2 font-bold">
                      ✉
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-black">Verify Your Email</h3>
                    <p className="text-black/60 text-[11px] mt-1">
                      We sent a 6-digit verification code to <span className="font-bold text-black">{signUpEmail}</span>
                    </p>
                  </div>

                  {/* Demo OTP auto-paste box */}
                  <div className="bg-emerald-50 border border-emerald-200 p-3 text-center rounded-xs">
                    <p className="text-[11px] text-emerald-800 font-medium">Demo verification code sent to your inbox:</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="font-mono text-base font-bold tracking-widest text-emerald-900 bg-white px-3 py-1 border border-emerald-300">
                        {generatedOtp}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOtpCode(generatedOtp)}
                        className="text-[10px] uppercase font-bold text-emerald-900 underline cursor-pointer"
                      >
                        Auto-Fill Code
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-black/60 font-semibold mb-1">Enter 6-Digit Code *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="e.g. 849201"
                      className="w-full border border-black/20 p-2.5 text-center font-mono text-lg tracking-[0.3em] font-bold outline-none focus:border-black"
                    />
                  </div>

                  {otpError && <p className="text-red-600 font-medium text-center">{otpError}</p>}

                  <button
                    type="submit"
                    className="w-full bg-black text-white font-bold text-xs tracking-[0.2em] uppercase py-3.5 hover:bg-stone-800 cursor-pointer shadow-md"
                  >
                    VERIFY EMAIL & COMPLETE SIGN UP ✓
                  </button>

                  <div className="flex justify-between items-center text-[11px] text-black/60 pt-2">
                    <button
                      type="button"
                      onClick={() => setSignUpStep('form')}
                      className="underline hover:text-black cursor-pointer"
                    >
                      ← Edit details
                    </button>
                    {resendTimer > 0 ? (
                      <span>Resend code in {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const code = Math.floor(100000 + Math.random() * 900000).toString()
                          setGeneratedOtp(code)
                          setResendTimer(30)
                        }}
                        className="font-bold underline text-black cursor-pointer"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 15c. ACCOUNT DRAWER (EXISTING ORDERS & LIVE REAL-TIME TRACKING)
function AccountDrawer({
  isOpen,
  onClose,
  user,
  orders,
  onSignOut,
  onSelectProduct,
}: {
  isOpen: boolean
  onClose: () => void
  user: UserAccount | null
  orders: TrackedOrder[]
  onSignOut: () => void
  onSelectProduct: (id: number) => void
}) {
  const [activeTab, setActiveTab] = useState<'orders' | 'lookup' | 'profile'>('orders')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(orders[0]?.id || null)
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null)
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupResult, setLookupResult] = useState<TrackedOrder | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  if (!isOpen) return null

  const handleCopyAwb = (awb: string) => {
    navigator.clipboard.writeText(awb)
    setCopiedAwb(awb)
    setTimeout(() => setCopiedAwb(null), 2000)
  }

  const handleSearchOrder = (e: React.FormEvent) => {
    e.preventDefault()
    setHasSearched(true)
    const cleaned = lookupQuery.trim().toUpperCase()
    const found = orders.find(
      (o) => o.id.toUpperCase() === cleaned || o.awb.toUpperCase() === cleaned || o.shippingAddress.phone.includes(cleaned)
    )
    setLookupResult(found || null)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in" />
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col justify-between animate-slide-in-right">
          {/* Header */}
          <div className="p-6 border-b border-black/10 bg-stone-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <img src="/lunar-logo.png" alt="Lunar" className="h-9 w-auto object-contain rounded-md" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-serif tracking-wider uppercase">{user ? user.name : 'Customer Account'}</h2>
                  {user?.verified && (
                    <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>✓</span> Verified Email
                    </span>
                  )}
                </div>
                <p className="text-white/60 text-xs">{user?.email || 'priya.sharma@example.com'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user && (
                <button
                  onClick={onSignOut}
                  className="text-xs text-white/70 hover:text-white underline cursor-pointer tracking-wider uppercase font-semibold"
                >
                  Sign Out
                </button>
              )}
              <button onClick={onClose} className="text-white/60 hover:text-white p-1 text-2xl font-light cursor-pointer">
                ✕
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-black/10 text-xs font-bold uppercase tracking-widest bg-stone-50">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-3.5 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'orders' ? 'bg-white text-black border-b-2 border-black' : 'text-black/50 hover:text-black'
              }`}
            >
              <span>Existing Orders</span>
              <span className="bg-black text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {orders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('lookup')}
              className={`flex-1 py-3.5 text-center transition-colors cursor-pointer ${
                activeTab === 'lookup' ? 'bg-white text-black border-b-2 border-black' : 'text-black/50 hover:text-black'
              }`}
            >
              🔍 Direct AWB Tracker
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-3.5 text-center transition-colors cursor-pointer ${
                activeTab === 'profile' ? 'bg-white text-black border-b-2 border-black' : 'text-black/50 hover:text-black'
              }`}
            >
              Customer Details
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-black/5">
                  <p className="text-xs font-bold tracking-wider uppercase text-black/60">
                    Showing All Order History ({orders.length})
                  </p>
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    Live Courier Synchronization Active
                  </p>
                </div>

                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order.id
                  const isDelivered = order.status === 'Delivered'
                  const isInTransit = order.status === 'In Transit'

                  return (
                    <div
                      key={order.id}
                      className={`border transition-all ${
                        isExpanded ? 'border-black shadow-md bg-white' : 'border-black/15 bg-stone-50/50 hover:border-black/40'
                      }`}
                    >
                      {/* Order Summary Header */}
                      <div
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-sm text-black">{order.id}</span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                isDelivered
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isInTransit
                                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isInTransit && '● '}
                              {order.status}
                            </span>
                            <span className="text-xs text-black/50">• {order.date}</span>
                          </div>
                          <p className="text-xs text-black/70 mt-1">
                            {order.items.length} item(s) • <span className="font-bold text-black">₹{order.total.toLocaleString()}</span> via {order.paymentMethod}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-black uppercase tracking-wider">
                            {isExpanded ? 'Hide Details ▲' : 'Track Order ▼'}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Order Details & Tracking Stepper */}
                      {isExpanded && (
                        <div className="border-t border-black/10 p-5 space-y-6 bg-white animate-fade-in">
                          {/* Courier & ETA Pill */}
                          <div className="bg-stone-100 p-4 border border-black/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                            <div>
                              <p className="text-black/50 font-bold uppercase text-[10px] tracking-wider">Courier Service & AWB</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-bold text-black">{order.courier}</span>
                                <span className="font-mono bg-white px-2 py-0.5 border border-black/20 text-black">
                                  {order.awb}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyAwb(order.awb)}
                                  className="text-[10px] font-bold text-black/70 hover:text-black underline cursor-pointer"
                                >
                                  {copiedAwb === order.awb ? '✓ Copied' : 'Copy'}
                                </button>
                              </div>
                            </div>

                            <div className="md:text-right">
                              <p className="text-black/50 font-bold uppercase text-[10px] tracking-wider">Estimated Delivery</p>
                              <p className="font-bold text-emerald-800 mt-0.5">{order.estimatedDelivery}</p>
                            </div>
                          </div>

                          {/* Visual Step Timeline */}
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-black mb-4 flex items-center gap-2">
                              <span>📍 Real-Time Tracking Timeline</span>
                              <span className="text-[10px] font-normal text-black/50 font-sans">(Live Status)</span>
                            </h4>

                            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-black/15">
                              {order.timeline.map((step, sIdx) => {
                                return (
                                  <div key={sIdx} className="relative group">
                                    {/* Indicator Dot */}
                                    <div
                                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                        step.completed
                                          ? 'bg-black text-white'
                                          : step.current
                                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                                          : 'bg-white border-2 border-black/25 text-black/40'
                                      }`}
                                    >
                                      {step.completed ? '✓' : sIdx + 1}
                                    </div>

                                    <div>
                                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                                        <p
                                          className={`text-xs font-bold ${
                                            step.completed || step.current ? 'text-black' : 'text-black/40'
                                          }`}
                                        >
                                          {step.title}
                                        </p>
                                        <span className="text-[10px] font-mono text-black/50">{step.time}</span>
                                      </div>
                                      <p className="text-[11px] text-black/60 mt-0.5 leading-relaxed">{step.desc}</p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Items Purchased in this order */}
                          <div className="border-t border-black/10 pt-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-black mb-3">
                              Garments In This Order
                            </h4>
                            <div className="space-y-3">
                              {order.items.map((item, iIdx) => (
                                <div key={iIdx} className="flex gap-3.5 bg-stone-50 p-3 border border-black/10">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-16 h-20 object-cover border border-black/10 bg-white"
                                  />
                                  <div className="flex-1 flex flex-col justify-between text-xs">
                                    <div>
                                      <p className="font-bold text-black">{item.name}</p>
                                      <div className="flex gap-2 flex-wrap text-[11px] text-black/60 mt-1">
                                        <span className="bg-white border border-black/10 px-1.5 py-0.5">Size: {item.size}</span>
                                        {item.lining && <span className="bg-white border border-black/10 px-1.5 py-0.5">{item.lining}</span>}
                                        {item.zip && item.zip !== 'None' && (
                                          <span className="bg-white border border-black/10 px-1.5 py-0.5">{item.zip}</span>
                                        )}
                                        {item.length && <span className="bg-white border border-black/10 px-1.5 py-0.5">{item.length}</span>}
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                      <span className="text-black/60">Qty: {item.quantity}</span>
                                      <span className="font-bold text-black">₹{(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Shipping Destination & Actions */}
                          <div className="border-t border-black/10 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                            <div>
                              <p className="font-bold uppercase text-[10px] tracking-wider text-black/50">Delivery Address</p>
                              <p className="text-black font-medium mt-0.5">
                                {order.shippingAddress.name} • {order.shippingAddress.address}, {order.shippingAddress.city} {order.shippingAddress.pincode}
                              </p>
                            </div>

                            <a
                              href={`https://wa.me/919876543210?text=Hello%20The%20Lunar%20Clothing,%20I%20need%20assistance%20tracking%20my%20order%20${order.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 bg-emerald-700 text-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-800 transition-colors cursor-pointer"
                            >
                              <span>WhatsApp Support 💬</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === 'lookup' && (
              <div className="space-y-6">
                <div className="bg-stone-50 border border-black/10 p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-black mb-1">Direct Courier & Order Lookup</h3>
                  <p className="text-xs text-black/60 mb-4">
                    Enter any Order ID (e.g. <span className="font-mono font-bold text-black">LUNAR-892410</span>) or Courier AWB number to fetch instant live tracking records.
                  </p>

                  <form onSubmit={handleSearchOrder} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={lookupQuery}
                      onChange={(e) => setLookupQuery(e.target.value)}
                      placeholder="e.g. LUNAR-892410 or BD8912401IN"
                      className="flex-1 border border-black/20 bg-white p-2.5 text-xs font-mono uppercase tracking-wider outline-none focus:border-black"
                    />
                    <button
                      type="submit"
                      className="bg-black text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 hover:bg-stone-800 cursor-pointer"
                    >
                      TRACK →
                    </button>
                  </form>
                </div>

                {hasSearched && (
                  <div>
                    {lookupResult ? (
                      <div className="border border-black p-5 bg-white space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center border-b border-black/10 pb-3">
                          <div>
                            <span className="font-mono font-bold text-base text-black">{lookupResult.id}</span>
                            <p className="text-xs text-black/50">Placed on {lookupResult.date}</p>
                          </div>
                          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
                            {lookupResult.status}
                          </span>
                        </div>

                        <div className="bg-stone-50 p-3 text-xs flex justify-between">
                          <span>Courier: <strong className="text-black">{lookupResult.courier}</strong> (AWB: {lookupResult.awb})</span>
                          <span className="font-bold text-emerald-700">{lookupResult.estimatedDelivery}</span>
                        </div>

                        {/* Timeline */}
                        <div className="pt-2 pl-4 space-y-4 border-l-2 border-black/20">
                          {lookupResult.timeline.map((step, idx) => (
                            <div key={idx} className="relative">
                              <span
                                className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full ${
                                  step.completed ? 'bg-black' : step.current ? 'bg-blue-600 ring-2 ring-blue-200' : 'bg-stone-300'
                                }`}
                              />
                              <p className="text-xs font-bold text-black">{step.title}</p>
                              <p className="text-[11px] text-black/60">{step.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-black/50 border border-dashed border-black/20 p-6">
                        <p className="text-base font-serif text-black mb-1">No matching order found</p>
                        <p className="text-xs">Please verify your order reference number or mobile number and try again.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6 text-xs">
                <div className="bg-stone-50 border border-black/10 p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-black/10 pb-3">
                    <h3 className="font-bold uppercase tracking-wider text-black">Account Profile</h3>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-xs">
                      ✓ Email Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-black/50 uppercase text-[10px] font-bold">Registered Name</p>
                      <p className="font-bold text-black text-sm">{user?.name || 'Priya Sharma'}</p>
                    </div>
                    <div>
                      <p className="text-black/50 uppercase text-[10px] font-bold">Email Address</p>
                      <p className="font-bold text-black text-sm">{user?.email || 'priya.sharma@example.com'}</p>
                    </div>
                    <div>
                      <p className="text-black/50 uppercase text-[10px] font-bold">Phone Number</p>
                      <p className="font-bold text-black text-sm">{user?.phone || '+91 98765 43210'}</p>
                    </div>
                    <div>
                      <p className="text-black/50 uppercase text-[10px] font-bold">Default Delivery City</p>
                      <p className="font-bold text-black text-sm">Hyderabad, Telangana (500033)</p>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-50 border border-black/10 p-5">
                  <h3 className="font-bold uppercase tracking-wider text-black mb-2">Saved Delivery Address</h3>
                  <p className="text-black/80 font-medium leading-relaxed">
                    Flat 402, Sunshine Heights, Road No. 36, Jubilee Hills,<br />
                    Hyderabad, Telangana — 500033<br />
                    Phone: +91 98765 43210
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 15d. ABOUT BRAND MODAL
function AboutModal({
  isOpen,
  onClose,
  onShopClick,
  tenant,
}: {
  isOpen: boolean
  onClose: () => void
  onShopClick: () => void
  tenant?: TenantConfig
}) {
  if (!isOpen) return null

  const brandName = tenant?.name || 'THE LUNAR CLOTHING'
  const brandTagline = tenant?.tagline || 'Thoughtfully Handcrafted For Weightless Everyday Living.'
  const aboutBio = tenant?.aboutStory || `${brandName} was born out of a desire for effortless silhouettes and bespoke artisanal craft. Each piece is crafted with utmost care, celebrating authentic Indian textile traditions, premium fabrics, and heirloom silhouettes that elevate everyday occasions and festive celebrations.`
  const currencySymbol = tenant?.currencySymbol || '₹'
  const freeThreshold = tenant?.contact?.shippingThresholdFormatted || `${currencySymbol}999`

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full border border-black/10 shadow-2xl rounded-sm overflow-hidden animate-slide-down my-8">
        <div className="bg-black text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo tenant={tenant} className="h-9 w-auto" />
            <div>
              <p className="text-[10px] font-mono tracking-[0.25em] text-white/60 uppercase">{brandName}</p>
              <h2 className="text-lg font-serif">About Our Studio & Craft</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl cursor-pointer">
            ✕
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6 text-xs text-black/80 leading-relaxed">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded-xs">
              HERITAGE & COMFORT
            </span>
            <h3 className="text-2xl font-serif text-black mt-2 mb-3">
              {brandTagline}
            </h3>
            <p className="text-sm font-light text-black/70 leading-relaxed">
              {aboutBio}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="border border-black/10 p-4 bg-stone-50">
              <div className="text-xl mb-1">🌿</div>
              <h4 className="font-bold text-black uppercase tracking-wider mb-1">Pure Artisanal Fabrics</h4>
              <p className="text-[11px] text-black/60 leading-normal">
                Airy, skin-friendly handloom & organic weaves pre-treated for pure comfort.
              </p>
            </div>

            <div className="border border-black/10 p-4 bg-stone-50">
              <div className="text-xl mb-1">👗</div>
              <h4 className="font-bold text-black uppercase tracking-wider mb-1">Tailored Silhouettes</h4>
              <p className="text-[11px] text-black/60 leading-normal">
                Bespoke sizing, custom lengths, and functional utility side pockets.
              </p>
            </div>

            <div className="border border-black/10 p-4 bg-stone-50">
              <div className="text-xl mb-1">🎨</div>
              <h4 className="font-bold text-black uppercase tracking-wider mb-1">Ethical Heritage</h4>
              <p className="text-[11px] text-black/60 leading-normal">
                Direct weaver partnerships sustaining generational Indian artisan clusters.
              </p>
            </div>
          </div>

          <div className="bg-stone-900 text-white p-5 rounded-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold uppercase tracking-wider text-sm">Experience {brandName}</p>
              <p className="text-white/60 text-[11px]">Free shipping across India on orders over {freeThreshold}.</p>
            </div>
            <button
              onClick={() => {
                onClose()
                onShopClick()
              }}
              className="bg-white text-black font-bold text-xs tracking-widest uppercase px-6 py-3 hover:bg-stone-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              EXPLORE COLLECTIONS →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 15e. CONTACT & CARE MODAL
function ContactModal({
  isOpen,
  onClose,
  onSuccessMessage,
  tenant,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccessMessage: (msg: string) => void
  tenant?: TenantConfig
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('Order Tracking Inquiry')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  const brandName = tenant?.name || 'The Lunar Clothing'
  const contactPhone = tenant?.contact?.phone || '+91 98765 43210'
  const contactEmail = tenant?.contact?.email || 'care@thelunarclothing.com'
  const contactAddress = tenant?.contact?.address || 'Studio: Jubilee Hills, Hyderabad & Jaipur'
  const workingHours = tenant?.contact?.workingHours || 'Mon–Sat: 10AM – 7PM IST'
  const cleanPhone = contactPhone.replace(/[^0-9]/g, '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    onSuccessMessage(`Thank you! Your message has been sent to ${brandName} Customer Care.`)
    setTimeout(() => {
      setSubmitted(false)
      onClose()
    }, 1800)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white max-w-xl w-full border border-black/10 shadow-2xl rounded-sm overflow-hidden animate-slide-down my-8">
        <div className="bg-black text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo tenant={tenant} className="h-9 w-auto" />
            <div>
              <p className="text-[10px] font-mono tracking-[0.25em] text-white/60 uppercase">{brandName}</p>
              <h2 className="text-lg font-serif">Contact Customer Care</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl cursor-pointer">
            ✕
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6 text-xs">
          {/* Direct channels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${brandName}, I have an inquiry regarding my order.`)}`}
              target="_blank"
              rel="noreferrer"
              className="border border-emerald-300 bg-emerald-50/70 p-3.5 flex items-center gap-3 hover:bg-emerald-100 transition-colors cursor-pointer group"
            >
              <span className="text-2xl">💬</span>
              <div>
                <p className="font-bold text-emerald-950 uppercase tracking-wider text-[11px]">Instant WhatsApp</p>
                <p className="text-emerald-800 text-[11px] font-mono font-semibold">{contactPhone}</p>
              </div>
            </a>

            <div className="border border-black/10 bg-stone-50 p-3.5 flex items-center gap-3">
              <span className="text-2xl">✉</span>
              <div>
                <p className="font-bold text-black uppercase tracking-wider text-[11px]">Email Support</p>
                <p className="text-black/70 text-[11px] font-mono">{contactEmail}</p>
              </div>
            </div>
          </div>

          <div className="bg-stone-50 border border-black/10 p-3 text-[11px] text-black/70 flex justify-between items-center">
            <span>📍 {contactAddress}</span>
            <span className="font-semibold text-black">{workingHours}</span>
          </div>

          {/* Form */}
          {submitted ? (
            <div className="text-center py-8 bg-emerald-50 border border-emerald-200 p-6">
              <span className="text-3xl">✓</span>
              <h4 className="text-base font-bold text-emerald-950 mt-2">Message Sent Successfully!</h4>
              <p className="text-emerald-800 text-[11px] mt-1">Our support executive at {brandName} will get back to you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <h4 className="font-bold uppercase tracking-wider text-black border-b border-black/10 pb-2">
                Send Us a Note
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-black/60 font-semibold mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Priya Sharma"
                    className="w-full border border-black/20 p-2.5 outline-none focus:border-black text-xs"
                  />
                </div>
                <div>
                  <label className="block text-black/60 font-semibold mb-1">Phone / WhatsApp Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={contactPhone}
                    className="w-full border border-black/20 p-2.5 outline-none focus:border-black text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-black/60 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya.sharma@example.com"
                  className="w-full border border-black/20 p-2.5 outline-none focus:border-black text-xs"
                />
              </div>

              <div>
                <label className="block text-black/60 font-semibold mb-1">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-black/20 p-2.5 outline-none focus:border-black text-xs bg-white cursor-pointer"
                >
                  <option value="Order Tracking Inquiry">Order Tracking & Courier Delivery</option>
                  <option value="Custom Tailoring / Sizing">Custom Length, Sizing or Fabric Details</option>
                  <option value="Exchange or Return">Exchange & Returns Support</option>
                  <option value="Wholesale or Collaboration">Artisan Collaboration / Bulk Orders</option>
                  <option value="General Inquiry">General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-black/60 font-semibold mb-1">Your Message *</label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we assist you today?"
                  className="w-full border border-black/20 p-2.5 outline-none focus:border-black text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white font-bold text-xs tracking-[0.2em] uppercase py-3.5 hover:bg-stone-800 transition-colors cursor-pointer shadow-md"
              >
                SEND MESSAGE →
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// 16. SEARCH OVERLAY DRAWER
function SearchOverlay({
  isOpen,
  onClose,
  onSelectProduct,
  products = PRODUCTS,
  tenant,
}: {
  isOpen: boolean
  onClose: () => void
  onSelectProduct: (id: number) => void
  products?: Product[]
  tenant?: TenantConfig
}) {
  const [query, setQuery] = useState('')

  if (!isOpen) return null

  const results = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase()) ||
      p.fabricTech.toLowerCase().includes(query.toLowerCase()) ||
      p.sculptLevel.toLowerCase().includes(query.toLowerCase())
  )

  const brandName = tenant?.name || 'Our'

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in flex flex-col items-center pt-20 px-6">
      <div className="max-w-2xl w-full bg-white shadow-2xl border border-black/10 p-6 animate-slide-down">
        <div className="flex items-center justify-between border-b border-black/20 pb-4 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${brandName} products, fabrics, collections...`}
            className="w-full text-lg font-serif text-black outline-none bg-transparent placeholder-black/30"
            autoFocus
          />
          <button onClick={onClose} className="text-black/50 hover:text-black text-xl ml-4 cursor-pointer">
            ✕
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-4">
          {query.trim() === '' ? (
            <p className="text-xs text-black/40 uppercase tracking-widest text-center py-6">
              Type to search products, fabrics, or categories in {brandName}...
            </p>
          ) : results.length === 0 ? (
            <p className="text-xs text-black/50 text-center py-6">No products found matching "{query}"</p>
          ) : (
            results.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onSelectProduct(p.id)
                  onClose()
                }}
                className="flex items-center gap-4 p-2 hover:bg-stone-50 cursor-pointer transition-colors border-b border-black/5"
              >
                <img src={p.imgMain} alt={p.name} className="w-14 h-16 object-cover bg-stone-100" />
                <div>
                  <h4 className="font-bold text-sm text-black">{p.name}</h4>
                  <p className="text-xs text-black/50">{p.sculptLevel} · {p.priceFormatted}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// 17. CATALOG VIEW PAGE WITH SORTING CONTROLS
function CatalogPage({
  categoryFilter,
  wishlist,
  products = PRODUCTS,
  tenant,
  onToggleWishlist,
  onSelectProduct,
}: {
  categoryFilter: string
  wishlist: number[]
  products?: Product[]
  tenant?: TenantConfig
  onToggleWishlist: (id: number) => void
  onSelectProduct: (id: number) => void
}) {
  const [activeFilter, setActiveFilter] = useState(categoryFilter || 'all')
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured')

  useEffect(() => {
    setActiveFilter(categoryFilter || 'all')
  }, [categoryFilter])

  const filteredProducts = useMemo(() => {
    let list = activeFilter === 'all' ? [...products] : products.filter((p) => p.category === activeFilter)

    if (sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating)
    }

    return list
  }, [activeFilter, sortBy, products])

  // Derive unique categories dynamically
  const categories = useMemo(() => {
    const rawCategories = Array.from(new Set(products.map((p) => p.category)))
    return ['all', ...rawCategories]
  }, [products])

  const brandName = tenant?.name || 'THE LUNAR CLOTHING'
  const brandTagline = tenant?.tagline || 'Handcrafted Cotton Maxis & Ethnic Dresses'

  return (
    <div className="py-12 bg-white min-h-screen">
      <div className="max-w-screen-2xl mx-auto px-6">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-black/40 mb-2">{brandName} COLLECTION</p>
          <h1 className="text-4xl md:text-5xl font-serif text-black mb-4">{brandTagline}</h1>
          <p className="text-sm text-black/60 leading-relaxed">
            {tenant?.aboutStory || 'Discover handcrafted silhouettes, breathable pure fabrics, and timeless artisanal craft.'}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-center gap-3 mb-8 flex-wrap text-xs font-bold tracking-widest uppercase">
          {categories.map((cat) => {
            const label = cat === 'all' ? 'ALL PRODUCTS' : cat.toUpperCase()
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-5 py-2.5 border transition-all cursor-pointer ${
                  activeFilter === cat ? 'bg-black text-white border-black shadow-md' : 'bg-white text-black border-black/20 hover:border-black'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Sorting & Filter Header Bar */}
        <div className="flex items-center justify-between border-b border-black/10 pb-4 mb-8 text-xs font-semibold uppercase tracking-wider text-black/70">
          <div>
            Showing <span className="font-bold text-black">{filteredProducts.length}</span> Products
          </div>

          <div className="flex items-center gap-2">
            <span className="text-black/50">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-stone-50 border border-black/20 px-3 py-1.5 font-bold outline-none cursor-pointer"
            >
              <option value="featured">Featured Picks</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              isWishlisted={wishlist.includes(p.id)}
              onToggleWishlist={onToggleWishlist}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// 18. FOOTER COMPONENT
function Footer({ tenant }: { tenant?: TenantConfig }) {
  const brandName = tenant?.name || 'THE LUNAR CLOTHING'
  const brandTagline = tenant?.tagline || 'Handcrafted 100% soft cotton maxis, artisanal block prints, and festive dresses with functional side pockets.'
  const shippingText = tenant?.contact?.shippingThresholdFormatted ? `Free Shipping over ${tenant.contact.shippingThresholdFormatted}` : 'Free Shipping over ₹999'

  return (
    <footer className="bg-black text-white pt-20 pb-12 border-t border-white/10 select-none">
      <div className="max-w-screen-2xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3.5 mb-4">
              <BrandLogo tenant={tenant} className="h-9 w-auto" />
              <h3 className="text-2xl md:text-3xl font-bold tracking-[0.2em] font-sans uppercase">{brandName}</h3>
            </div>
            <p className="text-white/60 text-sm max-w-sm mb-6 leading-relaxed">
              {brandTagline}
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex max-w-md border-b border-white/30 pb-2">
              <input
                type="email"
                placeholder="ENTER YOUR EMAIL FOR 15% OFF"
                className="bg-transparent text-xs text-white placeholder-white/40 flex-1 outline-none uppercase tracking-widest"
              />
              <button type="submit" className="text-xs font-bold uppercase tracking-widest text-white/80 hover:text-white cursor-pointer">
                JOIN →
              </button>
            </form>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-white/40 mb-4">CUSTOMER CARE</h4>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li><a href="#" className="hover:text-white">{shippingText}</a></li>
              <li><a href="#" className="hover:text-white">Shipping & Delivery in India</a></li>
              <li><a href="#" className="hover:text-white">Fabric Care & Washing Guide</a></li>
              <li><a href="#" className="hover:text-white">Size Guide & Custom Lengths</a></li>
              <li><a href="#" className="hover:text-white">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-white/40 mb-4">COLLECTIONS</h4>
            <ul className="space-y-2.5 text-xs text-white/70">
              {tenant?.categories?.map((cat) => (
                <li key={cat.id}><a href="#" className="hover:text-white">{cat.name}</a></li>
              )) || (
                <>
                  <li><a href="#" className="hover:text-white">100% Soft Cotton Maxis</a></li>
                  <li><a href="#" className="hover:text-white">Mul Chanderi Silk Dresses</a></li>
                  <li><a href="#" className="hover:text-white">Kalamkari Handblock Print</a></li>
                  <li><a href="#" className="hover:text-white">Handloom Cotton Series</a></li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-white/40 mb-4">PARTNER & PORTAL</h4>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li>
                <a
                  href={`/?panel=dashboard&tenant=${tenant?.slug || 'lunar'}`}
                  className="hover:text-white flex items-center gap-1.5 text-amber-300 font-semibold"
                >
                  <span>🔐</span>
                  <span>Seller Portal Login</span>
                </a>
              </li>
              <li>
                <a
                  href="/?panel=admin"
                  className="hover:text-white flex items-center gap-1.5 text-violet-300 font-semibold"
                >
                  <span>🛡️</span>
                  <span>Orvexa Tech Admin Hub</span>
                </a>
              </li>
              <li><a href="#" className="hover:text-white">Merchant Application</a></li>
              <li><a href="#" className="hover:text-white">Brand Partnerships</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>© {new Date().getFullYear()} {brandName}. All rights reserved.</p>
          <div className="flex gap-6">
            <span>PRIVACY POLICY</span>
            <span>TERMS OF SERVICE</span>
            <span>INDIA ({tenant?.currencySymbol || '₹'} {tenant?.currency || 'INR'})</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const layer = useApplicationLayer()
  const { tenant } = useTenant()

  if (layer === 'admin') {
    return <AdminApp />
  }

  if (layer === 'dashboard') {
    return <DashboardApp />
  }

  // Active Tenant Resolution
  const activeTenant: TenantConfig = tenant || mockStore.getTenantBySlug('lunar') || MOCK_TENANTS[0]
  const tenantProducts = useMemo(() => mockStore.getProducts(activeTenant.id), [activeTenant.id])
  const tenantReviews = useMemo(() => mockStore.getReviews(activeTenant.id), [activeTenant.id])
  const tenantOrders = useMemo(() => mockStore.getOrders(activeTenant.id), [activeTenant.id])

  const [showAnnouncement, setShowAnnouncement] = useState(true)
  const [view, setView] = useState<'home' | 'catalog' | 'pdp'>('home')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  
  // User Authentication & Order Tracking State
  const [user, setUser] = useState<UserAccount | null>(null)
  const [orders, setOrders] = useState<TrackedOrder[]>(tenantOrders)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const [wishlist, setWishlist] = useState<number[]>([tenantProducts[0]?.id || 1, tenantProducts[1]?.id || 2])
  const [reviews, setReviews] = useState<Review[]>(tenantReviews)
  const [cart, setCart] = useState<CartItem[]>([
    {
      product: tenantProducts[0] || PRODUCTS[0],
      selectedColor: (tenantProducts[0] || PRODUCTS[0]).colors[0],
      selectedSize: 'M',
      selectedLining: 'No Lining',
      selectedZip: 'None',
      selectedLength: '44 inch',
      quantity: 1,
    },
  ])

  // Sync state when active tenant changes
  useEffect(() => {
    setOrders(tenantOrders)
    setReviews(tenantReviews)
    if (tenantProducts.length > 0) {
      setCart([
        {
          product: tenantProducts[0],
          selectedColor: tenantProducts[0].colors[0],
          selectedSize: 'M',
          selectedLining: 'No Lining',
          selectedZip: 'None',
          selectedLength: '44 inch',
          quantity: 1,
        },
      ])
      setWishlist([tenantProducts[0].id, tenantProducts[1]?.id || tenantProducts[0].id])
    }
  }, [activeTenant.id])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handleLoginSuccess = (loggedInUser: UserAccount, isNew?: boolean) => {
    setUser(loggedInUser)
    showToast(isNew ? `Account created! Email verified for ${loggedInUser.name}.` : `Welcome back, ${loggedInUser.name}!`)
    setIsAccountOpen(true)
  }

  const handleSignOut = () => {
    setUser(null)
    setIsAccountOpen(false)
    showToast('Signed out successfully.')
  }

  const handleOrderPlaced = (newOrder: TrackedOrder) => {
    setOrders((prev) => [newOrder, ...prev])
    if (!user) {
      setUser({
        name: newOrder.shippingAddress.name,
        email: 'priya.sharma@example.com',
        phone: newOrder.shippingAddress.phone,
        verified: true,
      })
    }
    showToast(`Order ${newOrder.id} confirmed! Tracking is now active.`)
  }

  const handleToggleWishlist = (id: number) => {
    setWishlist((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const handleSelectProduct = (id: number) => {
    setSelectedProductId(id)
    setView('pdp')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNavigate = (newView: 'home' | 'catalog', category: string = 'all') => {
    setCategoryFilter(category)
    setView(newView)
    setSelectedProductId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddToCart = (
    product: Product,
    selectedColor: { name: string; hex: string },
    selectedSize: string,
    selectedLining: string,
    selectedZip: string,
    selectedLength: string,
    quantity: number,
    totalUnitPrice: number
  ) => {
    const customizedProduct = {
      ...product,
      price: totalUnitPrice,
      priceFormatted: `${activeTenant.currencySymbol || '₹'}${totalUnitPrice.toLocaleString()}`,
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) =>
          i.product.id === product.id &&
          i.selectedColor.name === selectedColor.name &&
          i.selectedSize === selectedSize &&
          i.selectedLining === selectedLining &&
          i.selectedZip === selectedZip &&
          i.selectedLength === selectedLength
      )
      if (existingIdx > -1) {
        const next = [...prev]
        next[existingIdx].quantity += quantity
        return next
      }
      return [
        ...prev,
        {
          product: customizedProduct,
          selectedColor,
          selectedSize,
          selectedLining,
          selectedZip,
          selectedLength,
          quantity,
        },
      ]
    })
    setIsCartOpen(true)
  }

  const handleUpdateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const next = [...prev]
      const newQty = next[index].quantity + delta
      if (newQty <= 0) {
        return next.filter((_, i) => i !== index)
      }
      next[index].quantity = newQty
      return next
    })
  }

  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSaveReview = (newReviewData: { author: string; rating: number; title: string; comment: string }) => {
    const newRev: Review = {
      id: Date.now(),
      productId: selectedProductId || tenantProducts[0]?.id || 1,
      author: newReviewData.author,
      rating: newReviewData.rating,
      date: 'Just now',
      title: newReviewData.title || 'Great Product!',
      comment: newReviewData.comment,
      verified: true,
    }
    setReviews((prev) => [newRev, ...prev])
  }

  const rawSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
  const selectedProduct = tenantProducts.find((p) => p.id === selectedProductId) || tenantProducts[0] || PRODUCTS[0]

  return (
    <div className="min-h-screen bg-stone-50/20 text-black font-sans antialiased relative selection:bg-rose-100 selection:text-black">
      {/* Dynamic Ambient Background & Interactive Breeze Simulation */}
      <InteractiveBackground />

      {showAnnouncement && <AnnouncementBar tenant={activeTenant} onDismiss={() => setShowAnnouncement(false)} />}

      <Navigation
        tenant={activeTenant}
        products={tenantProducts}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlist.length}
        user={user}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        onNavigate={handleNavigate}
        currentCategory={categoryFilter}
      />

      <main>
        {view === 'home' && (
          <>
            <HeroSection tenant={activeTenant} onShopClick={() => handleNavigate('catalog', 'all')} />
            <TrustBar tenant={activeTenant} />
            <BestsellersSection
              tenant={activeTenant}
              products={tenantProducts}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onSelectProduct={handleSelectProduct}
            />
            <ShopByCategorySection
              tenant={activeTenant}
              products={tenantProducts}
              onSelectCategory={(cat) => handleNavigate('catalog', cat)}
            />
            <LeggingsFabricMatrix
              tenant={activeTenant}
              products={tenantProducts}
              onSelectProduct={handleSelectProduct}
            />
            <ActivityTriptych
              tenant={activeTenant}
              products={tenantProducts}
              onSelectProduct={handleSelectProduct}
            />
            <MissionBlock tenant={activeTenant} onShopClick={() => handleNavigate('catalog', 'all')} />
          </>
        )}

        {view === 'catalog' && (
          <CatalogPage
            tenant={activeTenant}
            products={tenantProducts}
            categoryFilter={categoryFilter}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {view === 'pdp' && (
          <ProductDetailPage
            tenant={activeTenant}
            product={selectedProduct}
            products={tenantProducts}
            wishlist={wishlist}
            reviews={reviews}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
            onBack={() => handleNavigate('catalog', 'all')}
            onSelectProduct={handleSelectProduct}
            onSaveReview={handleSaveReview}
          />
        )}
      </main>

      <Footer tenant={activeTenant} />

      {/* Mobile Drawer Navigation */}
      <MobileMenuDrawer
        tenant={activeTenant}
        products={tenantProducts}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavigate={handleNavigate}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        user={user}
        wishlistCount={wishlist.length}
      />

      {/* Wishlist Slide-over Drawer */}
      <WishlistDrawer
        tenant={activeTenant}
        products={tenantProducts}
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistIds={wishlist}
        onRemoveWishlist={handleToggleWishlist}
        onSelectProduct={handleSelectProduct}
      />

      {/* Slide-over Shopping Bag */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onStartCheckout={() => {
          setIsCartOpen(false)
          setIsCheckoutOpen(true)
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        subtotal={rawSubtotal}
        discountAmount={0}
        user={user}
        onOrderPlaced={handleOrderPlaced}
        onOpenAccount={() => setIsAccountOpen(true)}
        onCompleteOrder={() => {
          setCart([])
          setIsCheckoutOpen(false)
        }}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Account & Real-Time Order Tracking Drawer */}
      <AccountDrawer
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        user={user}
        orders={orders}
        onSignOut={handleSignOut}
        onSelectProduct={handleSelectProduct}
      />

      {/* About Brand Modal */}
      <AboutModal
        tenant={activeTenant}
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        onShopClick={() => {
          setIsAboutOpen(false)
          handleNavigate('catalog', 'all')
        }}
      />

      {/* Contact Customer Care Modal */}
      <ContactModal
        tenant={activeTenant}
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        onSuccessMessage={(msg) => showToast(msg)}
      />

      {/* Interactive Search Overlay */}
      <SearchOverlay
        tenant={activeTenant}
        products={tenantProducts}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={handleSelectProduct}
      />

      {/* Floating Status Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 rounded-xs shadow-2xl border border-white/20 text-xs font-semibold tracking-wider uppercase flex items-center gap-3 animate-slide-down">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}

