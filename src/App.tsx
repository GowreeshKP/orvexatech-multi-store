import { useState, useMemo, useEffect } from 'react'

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

// 1. Announcement Bar with Electric Blue Moving Marquee Ticker
function AnnouncementBar({ onDismiss }: { onDismiss: () => void }) {
  const tickerItems = [
    'THE LUNAR CLOTHING • ELEGANT COTTON MAXIS & CHANDERI DRESSES',
    'FREE SHIPPING IN INDIA OVER ₹999',
    'USE CODE: LUNAR15 FOR 15% OFF YOUR ORDER',
    '100% PURE BREATHABLE COTTON • FUNCTIONAL POCKETS',
    'THE LUNAR CLOTHING • ELEGANT COTTON MAXIS & CHANDERI DRESSES',
    'FREE SHIPPING IN INDIA OVER ₹999',
    'USE CODE: LUNAR15 FOR 15% OFF YOUR ORDER',
    '100% PURE BREATHABLE COTTON • FUNCTIONAL POCKETS',
  ]

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
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenSearch,
  onOpenMobileMenu,
  onNavigate,
  currentCategory,
}: {
  cartCount: number
  wishlistCount: number
  onOpenCart: () => void
  onOpenWishlist: () => void
  onOpenSearch: () => void
  onOpenMobileMenu: () => void
  onNavigate: (view: 'home' | 'catalog', category?: string) => void
  currentCategory: string
}) {
  const [megaOpen, setMegaOpen] = useState(false)

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

        {/* Brand Wordmark */}
        <div className="flex items-center gap-10">
          <button
            onClick={() => onNavigate('home')}
            className="text-xl md:text-2xl font-bold tracking-[0.2em] font-sans uppercase hover:opacity-80 transition-opacity cursor-pointer"
          >
            THE LUNAR CLOTHING
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
                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase text-black/40 mb-4">Cotton Maxis</p>
                    <ul className="space-y-2.5 text-sm text-black/80 font-normal">
                      <li>
                        <button onClick={() => { setMegaOpen(false); onNavigate('catalog', 'maxis') }} className="hover:font-semibold flex items-center justify-between w-full cursor-pointer">
                          <span>Yellow Petal Cotton Maxi</span>
                          <span className="text-[9px] bg-black text-white px-1.5 py-0.5 font-mono">POPULAR</span>
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { setMegaOpen(false); onNavigate('catalog', 'maxis') }} className="hover:font-semibold flex items-center justify-between w-full cursor-pointer">
                          <span>Teal Floral Cotton Maxi</span>
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { setMegaOpen(false); onNavigate('catalog', 'maxis') }} className="hover:font-semibold flex items-center justify-between w-full cursor-pointer">
                          <span>Dark Violet Cotton Maxi</span>
                        </button>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase text-black/40 mb-4">Special Collections</p>
                    <ul className="space-y-2.5 text-sm text-black/80 font-normal">
                      <li>
                        <button onClick={() => { setMegaOpen(false); onNavigate('catalog', 'dresses') }} className="hover:font-semibold cursor-pointer">
                          Mul Chanderi Silk Dresses
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { setMegaOpen(false); onNavigate('catalog', 'kalamkari') }} className="hover:font-semibold cursor-pointer">
                          Kalamkari Block Print
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { setMegaOpen(false); onNavigate('catalog', 'handloom') }} className="hover:font-semibold cursor-pointer">
                          Handloom Cotton Maxis
                        </button>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase text-black/40 mb-4">Craft & Quality</p>
                    <ul className="space-y-2.5 text-sm text-black/80 font-normal">
                      <li>
                        <button onClick={() => { setMegaOpen(false); onNavigate('catalog', 'all') }} className="hover:font-semibold cursor-pointer">
                          Attached Utility Pockets
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { setMegaOpen(false); onNavigate('catalog', 'all') }} className="hover:font-semibold cursor-pointer">
                          Side Tie Waist Ropes
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { setMegaOpen(false); onNavigate('catalog', 'all') }} className="hover:font-semibold cursor-pointer">
                          100% Breathable Cotton
                        </button>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-stone-100 p-4 relative group/card overflow-hidden">
                    <img
                      src="https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5227_1.jpg?v=1778607243"
                      alt="Lunar Clothing Feature"
                      className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover/card:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="relative h-full flex flex-col justify-end text-white">
                      <p className="text-[10px] tracking-widest uppercase font-bold text-white/70">SIGNATURE COLLECTION</p>
                      <p className="text-base font-serif leading-tight mb-2">Soft Cotton Maxi Series</p>
                      <button
                        onClick={() => { setMegaOpen(false); onNavigate('catalog', 'maxis') }}
                        className="text-xs font-semibold uppercase tracking-widest underline underline-offset-4 cursor-pointer"
                      >
                        Shop Cotton Maxis →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate('catalog', 'maxis')}
              className="text-black/80 hover:text-black transition-colors cursor-pointer"
            >
              COTTON MAXIS
            </button>
            <button
              onClick={() => onNavigate('catalog', 'dresses')}
              className="text-black/80 hover:text-black transition-colors cursor-pointer"
            >
              CHANDERI DRESSES
            </button>
            <button
              onClick={() => onNavigate('catalog', 'kalamkari')}
              className="text-black/80 hover:text-black transition-colors cursor-pointer"
            >
              KALAMKARI
            </button>
          </nav>
        </div>

        {/* Right Nav Icons */}
        <div className="flex items-center gap-5">
          <span className="hidden md:block text-xs font-semibold tracking-wider text-black/80 border border-black/15 px-2.5 py-1 bg-stone-50">
            ₹ INR
          </span>

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
  isOpen,
  onClose,
  onNavigate,
  onOpenWishlist,
  onOpenSearch,
  wishlistCount,
}: {
  isOpen: boolean
  onClose: () => void
  onNavigate: (view: 'home' | 'catalog', category?: string) => void
  onOpenWishlist: () => void
  onOpenSearch: () => void
  wishlistCount: number
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden md:hidden">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in" />
      <div className="absolute inset-y-0 left-0 max-w-full flex pr-10">
        <div className="w-screen max-w-xs bg-white shadow-2xl flex flex-col justify-between animate-slide-down p-6">
          <div>
            <div className="flex items-center justify-between border-b border-black/10 pb-4 mb-6">
              <h3 className="font-bold text-sm tracking-[0.2em] uppercase text-black">THE LUNAR CLOTHING</h3>
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
              <button
                onClick={() => { onClose(); onNavigate('catalog', 'maxis') }}
                className="text-left py-2 hover:text-black/60 border-b border-black/5 cursor-pointer"
              >
                100% COTTON MAXIS
              </button>
              <button
                onClick={() => { onClose(); onNavigate('catalog', 'dresses') }}
                className="text-left py-2 hover:text-black/60 border-b border-black/5 cursor-pointer"
              >
                MUL CHANDERI DRESSES
              </button>
              <button
                onClick={() => { onClose(); onNavigate('catalog', 'kalamkari') }}
                className="text-left py-2 hover:text-black/60 border-b border-black/5 cursor-pointer"
              >
                KALAMKARI BLOCK PRINT
              </button>
              <button
                onClick={() => { onClose(); onNavigate('catalog', 'handloom') }}
                className="text-left py-2 hover:text-black/60 border-b border-black/5 cursor-pointer"
              >
                HANDLOOM SERIES
              </button>
            </nav>
          </div>

          <div className="border-t border-black/10 pt-6 space-y-3">
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
  wishlistIds,
  onRemoveWishlist,
  onSelectProduct,
}: {
  isOpen: boolean
  onClose: () => void
  wishlistIds: number[]
  onRemoveWishlist: (id: number) => void
  onSelectProduct: (id: number) => void
}) {
  if (!isOpen) return null

  const wishlistedProducts = PRODUCTS.filter((p) => wishlistIds.includes(p.id))

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
                <p className="text-xs mb-6 max-w-xs">Save your favorite cotton maxis and ethnic dresses here.</p>
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
function HeroSection({ onShopClick }: { onShopClick: () => void }) {
  return (
    <section className="relative h-[88vh] min-h-[640px] bg-stone-950 flex items-center justify-center overflow-hidden">
      <img
        src="https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5227_1.jpg?v=1778607243"
        alt="The Lunar Clothing Cotton Maxis"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-70 scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

      <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
        <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold tracking-[0.25em] uppercase px-4 py-1.5 mb-6 inline-block border border-white/30">
          ELEGANT COTTON MAXIS & CHANDERI DRESSES
        </span>
        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight uppercase leading-[0.95] mb-6 text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          THE LUNAR CLOTHING
        </h1>
        <p className="text-sm md:text-lg tracking-widest text-white/80 font-light max-w-xl mx-auto mb-10">
          Handcrafted 100% soft cotton maxis, artisanal Kalamkari prints, and Mul Chanderi dresses with functional side pockets.
        </p>
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <button
            onClick={onShopClick}
            className="bg-white text-black font-bold text-xs tracking-[0.2em] uppercase px-9 py-4 hover:bg-black hover:text-white border border-white transition-all duration-300 shadow-2xl active:scale-95 cursor-pointer"
          >
            EXPLORE COLLECTIONS →
          </button>
        </div>
      </div>
    </section>
  )
}

// 4. Trust Banner - Moving Ticker
function TrustBar() {
  const items = [
    { icon: '🌐', text: 'FREE SHIPPING IN INDIA > ₹999' },
    { icon: '❇️', text: '100% SOFT BREATHABLE COTTON' },
    { icon: '🛡️', text: 'FUNCTIONAL POCKETS ATTACHED' },
    { icon: '❇️', text: '15,000+ HAPPY CUSTOMERS' },
    { icon: '💧', text: 'ARTISANAL KALAMKARI & HANDLOOM' },
    { icon: '⚡', text: '100% QUALITY GUARANTEED' },
    { icon: '🌐', text: 'FREE SHIPPING IN INDIA > ₹999' },
    { icon: '❇️', text: '100% SOFT BREATHABLE COTTON' },
    { icon: '🛡️', text: 'FUNCTIONAL POCKETS ATTACHED' },
    { icon: '❇️', text: '15,000+ HAPPY CUSTOMERS' },
    { icon: '💧', text: 'ARTISANAL KALAMKARI & HANDLOOM' },
    { icon: '⚡', text: '100% QUALITY GUARANTEED' },
  ]

  return (
    <div className="bg-white border-y border-black/10 py-3.5 overflow-hidden relative select-none">
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

        <h3 className="text-sm font-semibold tracking-wide text-black group-hover:underline underline-offset-4 mb-1">
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
  wishlist,
  onToggleWishlist,
  onSelectProduct,
}: {
  wishlist: number[]
  onToggleWishlist: (id: number) => void
  onSelectProduct: (id: number) => void
}) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-screen-2xl mx-auto px-6 mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-black/40 mb-2">HANDCRAFTED ETHNIC COLLECTION</p>
          <h2 className="text-4xl md:text-5xl font-normal text-black" style={{ fontFamily: 'var(--font-display)' }}>
            Lunar Bestsellers
          </h2>
        </div>
        <button
          onClick={() => onSelectProduct(1)}
          className="text-xs font-bold tracking-widest uppercase text-black hover:text-black/60 border-b border-black pb-0.5 cursor-pointer"
        >
          VIEW ALL MAXIS →
        </button>
      </div>

      <div className="pl-6 md:pl-[max(24px,calc((100vw-1536px)/2+24px))] flex gap-6 overflow-x-auto scroll-hide pb-6">
        {PRODUCTS.map((product) => (
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
  onSelectCategory,
}: {
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

  const categories = [
    {
      name: 'COTTON MAXIS →',
      category: 'maxis',
      img: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5227_1.jpg?v=1778607243',
    },
    {
      name: 'CHANDERI DRESSES →',
      category: 'dresses',
      img: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5234.jpg?v=1778607246',
    },
    {
      name: 'KALAMKARI SERIES →',
      category: 'kalamkari',
      img: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5223_1.jpg?v=1778607242',
    },
    {
      name: 'HANDLOOM COTTON →',
      category: 'handloom',
      img: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_2175.jpg?v=1766941862',
    },
  ]

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
function LeggingsFabricMatrix({ onSelectProduct }: { onSelectProduct: (id: number) => void }) {
  const fabrics = [
    {
      num: '01',
      title: '100% SOFT COTTON©',
      sculpt: 'NATURAL WEAVE',
      desc: 'Pure breathable cotton yarn with attached side waist tie-up ropes and deep functional utility pockets.',
      img: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5227_1.jpg?v=1778607243',
    },
    {
      num: '02',
      title: 'MUL CHANDERI SILK©',
      sculpt: 'FESTIVE WEAVE',
      desc: 'Weightless Mul Chanderi silk fabric lined with pure cotton for festive occasions and celebrations.',
      img: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5234.jpg?v=1778607246',
    },
    {
      num: '03',
      title: 'ARTISANAL KALAMKARI©',
      sculpt: 'BLOCK PRINT',
      desc: 'Heritage Indian handblock Kalamkari motifs printed ethically with natural dyes on soft cotton.',
      img: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5223_1.jpg?v=1778607242',
    },
    {
      num: '04',
      title: 'HANDLOOM WEAVE©',
      sculpt: 'ETHNIC CRAFT',
      desc: 'Woven on traditional Indian handlooms with delicate motifs and pre-washed cloud soft texture.',
      img: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_2175.jpg?v=1766941862',
    },
  ]

  return (
    <section className="py-20 bg-[#F5F4F1]">
      <div className="max-w-screen-2xl mx-auto px-6 mb-12">
        <p className="text-xs font-bold tracking-[0.25em] uppercase text-black/40 mb-2">CRAFT & FABRIC MATRIX</p>
        <h2 className="text-4xl md:text-5xl font-normal text-black" style={{ fontFamily: 'var(--font-display)' }}>
          4 Signature Weaves
        </h2>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {fabrics.map((f) => (
          <div
            key={f.num}
            onClick={() => onSelectProduct(1)}
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
function ActivityTriptych({ onSelectProduct }: { onSelectProduct: (id: number) => void }) {
  const activities = [
    { title: 'COTTON MAXIS', img: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5227_1.jpg?v=1778607243' },
    { title: 'CHANDERI DRESSES', img: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5234.jpg?v=1778607246' },
    { title: 'KALAMKARI PRINTS', img: 'https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_5223_1.jpg?v=1778607242' },
  ]

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 h-[65vh] min-h-[480px]">
      {activities.map((a) => (
        <div
          key={a.title}
          onClick={() => onSelectProduct(1)}
          className="relative overflow-hidden group cursor-pointer bg-stone-900"
        >
          <img
            src={a.img}
            alt={a.title}
            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8 text-white">
            <p className="text-xs tracking-[0.2em] font-semibold uppercase text-white/60 mb-2">← EXPLORE RANGE</p>
            <h3 className="text-4xl md:text-5xl font-serif uppercase tracking-tight">{a.title}</h3>
          </div>
        </div>
      ))}
    </section>
  )
}

// 11. Mission Block
function MissionBlock({ onShopClick }: { onShopClick: () => void }) {
  return (
    <section className="relative py-36 md:py-48 bg-stone-950 text-center text-white overflow-hidden select-none border-t border-white/10">
      <img
        src="https://cdn.shopify.com/s/files/1/0957/7549/0340/files/IMG_2171_1.jpg?v=1766941862"
        alt="The Lunar Clothing Philosophy"
        className="absolute inset-0 w-full h-full object-cover opacity-25 object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />

      <div className="relative z-10 max-w-3xl mx-auto px-6">
        <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-white/70 mb-4 font-mono">
          THE LUNAR PHILOSOPHY
        </p>

        <h2
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-normal leading-none uppercase mb-6 tracking-tight text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          LESS BUT BETTER.
        </h2>

        <p className="text-xs sm:text-sm md:text-base font-light text-white/80 max-w-xl mx-auto mb-10 leading-relaxed font-sans">
          The Lunar Clothing was born from a genuine desire for less but better. Premium soft cotton maxis with functional side pockets, handmade Kalamkari details, and quality that lasts.
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
  onToggleWishlist,
  onAddToCart,
  onBack,
  onSelectProduct,
  onSaveReview,
}: {
  product: Product
  wishlist: number[]
  reviews: Review[]
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
            {PRODUCTS.filter((p) => p.id !== product.id).map((p) => (
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
            <h3 className="text-2xl font-serif text-black mb-2">The Lunar Clothing Size & Fit Guide</h3>
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
  onCompleteOrder,
}: {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  subtotal: number
  discountAmount: number
  onCompleteOrder: () => void
}) {
  const [step, setStep] = useState<'shipping' | 'payment' | 'success'>('shipping')
  const [formData, setFormData] = useState({
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91 98765 43210',
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
    setOrderId(generatedId)
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
            3. Confirmation
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
                <label className="block text-black/60 font-medium mb-1">Email Address *</label>
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
                Order ID: <span className="font-bold text-black font-mono">{orderId}</span> • A confirmation email has been sent to <span className="font-medium text-black">{formData.email}</span>.
              </p>

              <div className="bg-stone-50 border border-black/10 p-4 text-left mb-6 text-xs space-y-3">
                <div className="flex justify-between border-b border-black/10 pb-2">
                  <span className="font-bold uppercase text-black/60">Shipping To:</span>
                  <span className="text-right text-black font-medium">{formData.address}, {formData.city}, {formData.pincode}</span>
                </div>
                <div className="flex justify-between border-b border-black/10 pb-2">
                  <span className="font-bold uppercase text-black/60">Estimated Delivery:</span>
                  <span className="text-emerald-700 font-bold">3 - 5 Business Days</span>
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

              <button
                onClick={() => {
                  onCompleteOrder()
                  onClose()
                }}
                className="bg-black text-white font-bold text-xs tracking-[0.2em] uppercase px-8 py-3.5 hover:bg-stone-800 cursor-pointer"
              >
                CONTINUE SHOPPING →
              </button>
            </div>
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
}: {
  isOpen: boolean
  onClose: () => void
  onSelectProduct: (id: number) => void
}) {
  const [query, setQuery] = useState('')

  if (!isOpen) return null

  const results = PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase()) ||
      p.fabricTech.toLowerCase().includes(query.toLowerCase()) ||
      p.sculptLevel.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in flex flex-col items-center pt-20 px-6">
      <div className="max-w-2xl w-full bg-white shadow-2xl border border-black/10 p-6 animate-slide-down">
        <div className="flex items-center justify-between border-b border-black/20 pb-4 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Cotton Maxis, Kalamkari, Chanderi Dresses..."
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
              Type to search cotton maxis, kalamkari, or chanderi dresses...
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
  onToggleWishlist,
  onSelectProduct,
}: {
  categoryFilter: string
  wishlist: number[]
  onToggleWishlist: (id: number) => void
  onSelectProduct: (id: number) => void
}) {
  const [activeFilter, setActiveFilter] = useState(categoryFilter || 'all')
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured')

  useEffect(() => {
    setActiveFilter(categoryFilter || 'all')
  }, [categoryFilter])

  const filteredProducts = useMemo(() => {
    let list = activeFilter === 'all' ? [...PRODUCTS] : PRODUCTS.filter((p) => p.category === activeFilter)

    if (sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating)
    }

    return list
  }, [activeFilter, sortBy])

  const categoryLabels: Record<string, string> = {
    all: 'ALL PRODUCTS',
    maxis: 'COTTON MAXIS',
    dresses: 'CHANDERI DRESSES',
    kalamkari: 'KALAMKARI',
    handloom: 'HANDLOOM',
  }

  return (
    <div className="py-12 bg-white min-h-screen">
      <div className="max-w-screen-2xl mx-auto px-6">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-black/40 mb-2">THE LUNAR CLOTHING COLLECTION</p>
          <h1 className="text-4xl md:text-5xl font-serif text-black mb-4">Handcrafted Cotton Maxis & Ethnic Dresses</h1>
          <p className="text-sm text-black/60 leading-relaxed">
            100% pure breathable cotton maxis, artisanal Kalamkari prints, and Mul Chanderi dresses with functional side pockets.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-center gap-3 mb-8 flex-wrap text-xs font-bold tracking-widest uppercase">
          {['all', 'maxis', 'dresses', 'kalamkari', 'handloom'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-5 py-2.5 border transition-all cursor-pointer ${
                activeFilter === cat ? 'bg-black text-white border-black shadow-md' : 'bg-white text-black border-black/20 hover:border-black'
              }`}
            >
              {categoryLabels[cat] || cat.toUpperCase()}
            </button>
          ))}
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
function Footer() {
  return (
    <footer className="bg-black text-white pt-20 pb-12 border-t border-white/10 select-none">
      <div className="max-w-screen-2xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <h3 className="text-2xl md:text-3xl font-bold tracking-[0.2em] font-sans uppercase mb-4">THE LUNAR CLOTHING</h3>
            <p className="text-white/60 text-sm max-w-sm mb-6 leading-relaxed">
              Handcrafted 100% soft cotton maxis, artisanal Kalamkari block prints, and Mul Chanderi dresses with functional side pockets.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex max-w-md border-b border-white/30 pb-2">
              <input
                type="email"
                placeholder="ENTER YOUR EMAIL FOR 15% OFF (CODE: LUNAR15)"
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
              <li><a href="#" className="hover:text-white">Free Shipping over ₹999</a></li>
              <li><a href="#" className="hover:text-white">Shipping & Delivery in India</a></li>
              <li><a href="#" className="hover:text-white">Fabric Care & Washing Guide</a></li>
              <li><a href="#" className="hover:text-white">Size Guide & Custom Lengths</a></li>
              <li><a href="#" className="hover:text-white">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-white/40 mb-4">COLLECTIONS</h4>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li><a href="#" className="hover:text-white">100% Soft Cotton Maxis</a></li>
              <li><a href="#" className="hover:text-white">Mul Chanderi Silk Dresses</a></li>
              <li><a href="#" className="hover:text-white">Kalamkari Handblock Print</a></li>
              <li><a href="#" className="hover:text-white">Handloom Cotton Series</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>© {new Date().getFullYear()} THE LUNAR CLOTHING. All rights reserved.</p>
          <div className="flex gap-6">
            <span>PRIVACY POLICY</span>
            <span>TERMS OF SERVICE</span>
            <span>INDIA (₹ INR)</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const [showAnnouncement, setShowAnnouncement] = useState(true)
  const [view, setView] = useState<'home' | 'catalog' | 'pdp'>('home')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const [wishlist, setWishlist] = useState<number[]>([1, 3])
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS)
  const [cart, setCart] = useState<CartItem[]>([
    {
      product: PRODUCTS[0],
      selectedColor: PRODUCTS[0].colors[0],
      selectedSize: 'S',
      selectedLining: 'No Lining',
      selectedZip: 'None',
      selectedLength: '44 inch',
      quantity: 1,
    },
  ])

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
      priceFormatted: `₹${totalUnitPrice.toLocaleString()}`,
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
      productId: selectedProductId || 1,
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
  const selectedProduct = PRODUCTS.find((p) => p.id === selectedProductId) || PRODUCTS[0]

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased">
      {showAnnouncement && <AnnouncementBar onDismiss={() => setShowAnnouncement(false)} />}

      <Navigation
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlist.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onNavigate={handleNavigate}
        currentCategory={categoryFilter}
      />

      <main>
        {view === 'home' && (
          <>
            <HeroSection onShopClick={() => handleNavigate('catalog', 'all')} />
            <TrustBar />
            <BestsellersSection
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onSelectProduct={handleSelectProduct}
            />
            <ShopByCategorySection onSelectCategory={(cat) => handleNavigate('catalog', cat)} />
            <LeggingsFabricMatrix onSelectProduct={handleSelectProduct} />
            <ActivityTriptych onSelectProduct={handleSelectProduct} />
            <MissionBlock onShopClick={() => handleNavigate('catalog', 'all')} />
          </>
        )}

        {view === 'catalog' && (
          <CatalogPage
            categoryFilter={categoryFilter}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {view === 'pdp' && (
          <ProductDetailPage
            product={selectedProduct}
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

      <Footer />

      {/* Mobile Drawer Navigation */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavigate={handleNavigate}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        wishlistCount={wishlist.length}
      />

      {/* Wishlist Slide-over Drawer */}
      <WishlistDrawer
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
        onCompleteOrder={() => {
          setCart([])
          setIsCheckoutOpen(false)
        }}
      />

      {/* Interactive Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={handleSelectProduct}
      />
    </div>
  )
}
