// --- Tenant Resolver ---
// Detects which application layer and which tenant to serve
// based on hostname (production) or query params (development)

export type ApplicationLayer = 'storefront' | 'dashboard' | 'admin'

const RESERVED_SUBDOMAINS = ['admin', 'app', 'api', 'www', 'mail', 'staging']

/**
 * Resolve the current application layer from the URL.
 *
 * Production:
 *   admin.orvexatech.com  → 'admin'
 *   app.orvexatech.com    → 'dashboard'
 *   brand.orvexatech.com  → 'storefront'
 *
 * Development (localhost):
 *   ?panel=admin      → 'admin'
 *   ?panel=dashboard  → 'dashboard'
 *   (default)         → 'storefront'
 */
export function resolveApplicationLayer(): ApplicationLayer {
  if (typeof window === 'undefined') return 'admin'

  const params = new URLSearchParams(window.location.search)
  const panel = params.get('panel') || params.get('layer') || params.get('view')

  if (panel === 'admin' || params.get('admin') === 'true') return 'admin'
  if (panel === 'dashboard' || panel === 'seller' || params.get('seller') === 'true') return 'dashboard'
  if (panel === 'storefront' || panel === 'store') return 'storefront'

  const path = window.location.pathname.toLowerCase()
  if (path === '/admin' || path.startsWith('/admin/')) return 'admin'
  if (path === '/dashboard' || path.startsWith('/dashboard/') || path === '/seller' || path.startsWith('/seller/')) return 'dashboard'
  if (path.startsWith('/store/') || path.startsWith('/stores/')) return 'storefront'

  // If explicit tenant or store param is provided in URL, load that tenant's storefront
  if (params.get('tenant') || params.get('store')) {
    return 'storefront'
  }

  const hostname = window.location.hostname

  // Skip subdomain detection for deployment preview platforms (Vercel, Netlify, GitHub Pages, Cloudflare Pages)
  // These platforms use subdomains as part of their own URL scheme, not as tenant identifiers
  const PREVIEW_PLATFORM_DOMAINS = ['vercel.app', 'netlify.app', 'github.io', 'pages.dev', 'cloudflareapps.com']
  const isPreviewPlatform = PREVIEW_PLATFORM_DOMAINS.some(domain => hostname.endsWith('.' + domain) || hostname === domain)

  if (!isPreviewPlatform) {
    // Production: check subdomain (e.g. lunar.orvexatech.com, admin.orvexatech.com)
    const parts = hostname.split('.')
    if (parts.length >= 3) {
      const sub = parts[0].toLowerCase()
      if (sub === 'admin') return 'admin'
      if (sub === 'app' || sub === 'seller' || sub === 'merchant') return 'dashboard'
      if (!RESERVED_SUBDOMAINS.includes(sub)) {
        // Subdomain is a specific tenant store (e.g. lunar.orvexatech.com, silkhaus.orvexatech.com)
        return 'storefront'
      }
    }
  }

  // Root platform default: Launch Orvexa Tech Multi-Tenant Super Admin & Platform Console!
  return 'admin'
}

/**
 * Resolve the tenant slug from the URL.
 *
 * Development/Direct query param:
 *   ?tenant=brand → 'brand'
 *   (default)     → 'lunar'
 *
 * Production:
 *   brand.orvexatech.com → 'brand'
 */
export function resolveTenantSlug(): string {
  const params = new URLSearchParams(window.location.search)
  const tenantParam = params.get('tenant')
  if (tenantParam) {
    return tenantParam
  }

  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
    return 'lunar'
  }

  // Production: extract subdomain
  const parts = hostname.split('.')
  if (parts.length >= 3) {
    const sub = parts[0]
    if (!RESERVED_SUBDOMAINS.includes(sub)) {
      return sub
    }
  }

  // Fallback for custom domains: lookup by full hostname
  return hostname
}

/**
 * Check if the current request is for a reserved platform subdomain.
 */
export function isReservedSubdomain(slug: string): boolean {
  return RESERVED_SUBDOMAINS.includes(slug)
}
