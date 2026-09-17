// --- Multi-Tenant Context Provider ---
// Provides tenant configuration to the entire component tree
// and dynamically injects CSS variables for theming

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { TenantConfig } from '@/types/tenant'
import { resolveTenantSlug, resolveApplicationLayer, type ApplicationLayer } from '@/lib/tenant-resolver'
import { mockStore } from '@/api/mock-store'

interface TenantContextValue {
  tenant: TenantConfig | null
  loading: boolean
  error: string | null
  layer: ApplicationLayer
  refreshTenant: () => void
  switchTenant: (slug: string) => void
  switchLayer: (layer: ApplicationLayer) => void
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  loading: true,
  error: null,
  layer: 'storefront',
  refreshTenant: () => {},
  switchTenant: () => {},
  switchLayer: () => {},
})

export function useTenant() {
  return useContext(TenantContext)
}

export function useApplicationLayer(): ApplicationLayer {
  return useContext(TenantContext).layer
}

export function useSwitchLayer() {
  return useContext(TenantContext).switchLayer
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [layer, setLayer] = useState<ApplicationLayer>(() => resolveApplicationLayer())

  const loadTenant = (customSlug?: string) => {
    try {
      const currentLayer = resolveApplicationLayer()
      setLayer(currentLayer)

      const slug = customSlug || resolveTenantSlug()
      const config = mockStore.getTenantBySlug(slug)

      if (config) {
        setTenant({ ...config })
        setError(null)
      } else {
        // If exact slug not found, fallback to lunar
        const fallback = mockStore.getTenantBySlug('lunar') || MOCK_TENANTS[0]
        if (fallback) {
          setTenant({ ...fallback })
          setError(null)
        } else {
          setError(`Store "${slug}" not found.`)
        }
      }
    } catch (e) {
      setError('Failed to load store configuration.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const switchTenant = (slug: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('tenant', slug)
    window.history.pushState({}, '', url.toString())
    loadTenant(slug)
  }

  const switchLayer = (newLayer: ApplicationLayer) => {
    const url = new URL(window.location.href)
    if (newLayer === 'storefront') {
      url.searchParams.delete('panel')
      url.searchParams.delete('admin')
      url.searchParams.delete('layer')
      url.searchParams.delete('seller')
      if (url.pathname === '/admin' || url.pathname === '/dashboard' || url.pathname === '/seller') {
        url.pathname = '/'
      }
    } else {
      url.searchParams.set('panel', newLayer)
    }
    window.history.pushState({}, '', url.toString())
    setLayer(newLayer)
  }

  useEffect(() => {
    loadTenant()

    const handleLocationChange = () => {
      loadTenant()
    }

    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  // Inject CSS variables into :root based on tenant theme
  useEffect(() => {
    if (!tenant) return

    const root = document.documentElement
    const t = tenant.theme

    root.style.setProperty('--brand-primary', t.primaryColor)
    root.style.setProperty('--brand-accent', t.accentColor)
    root.style.setProperty('--brand-bg', t.backgroundColor)
    root.style.setProperty('--brand-font-display', t.fontDisplay)
    root.style.setProperty('--brand-font-sans', t.fontSans)

    // Update document title
    document.title = `${tenant.brandName} | Official Online Store`

    return () => {
      root.style.removeProperty('--brand-primary')
      root.style.removeProperty('--brand-accent')
      root.style.removeProperty('--brand-bg')
      root.style.removeProperty('--brand-font-display')
      root.style.removeProperty('--brand-font-sans')
    }
  }, [tenant])

  return (
    <TenantContext.Provider
      value={{
        tenant,
        loading,
        error,
        layer,
        refreshTenant: () => loadTenant(),
        switchTenant,
        switchLayer,
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

export default TenantContext
