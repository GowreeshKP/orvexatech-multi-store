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
  const params = new URLSearchParams(window.location.search)
  const panel = params.get('panel')
  if (panel === 'admin') return 'admin'
  if (panel === 'dashboard') return 'dashboard'

  const hostname = window.location.hostname

  // Production: use subdomain
  const parts = hostname.split('.')
  if (parts.length >= 3) {
    const sub = parts[0]
    if (sub === 'admin') return 'admin'
    if (sub === 'app') return 'dashboard'
  }

  return 'storefront'
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
