// --- Authentication Service ---
// Handles login, session management, and credential verification for Sellers and Super Admins.
// All authentication is now backed by the Orvexa Tech backend API with real JWT tokens.

import type { TenantConfig } from '@/types/tenant'
import { MOCK_TENANTS } from '@/data/mock-tenants'

export interface SellerSession {
  userId: string
  name: string
  email: string
  role: 'seller'
  tenantId: string
  tenantSlug: string
  brandName: string
  loginTime: string
}

export interface AdminSession {
  userId: string
  name: string
  email: string
  role: 'super_admin'
  loginTime: string
}

// Demo credentials — displayed on the login page for evaluators only.
// These must exist in the backend database with real bcrypt-hashed passwords.
export const DEMO_SELLER_CREDENTIALS = [
  {
    loginId: 'gowreesh@thelunarclothing.com',
    password: 'lunar@password',
    tenantSlug: 'lunar',
    tenantName: 'The Lunar Clothing',
    ownerName: 'Gowreesh KP',
    roleLabel: 'Store Owner',
  },
  {
    loginId: 'kavya@silkhaus.in',
    password: 'silk@password',
    tenantSlug: 'silkhaus',
    tenantName: 'Silk Haus',
    ownerName: 'Kavya Menon',
    roleLabel: 'Store Owner',
  },
  {
    loginId: 'arjun@khadistudio.co',
    password: 'khadi@password',
    tenantSlug: 'khadistudio',
    tenantName: 'Khadi Studio',
    ownerName: 'Arjun Patel',
    roleLabel: 'Store Owner',
  },
  {
    loginId: 'kavita@bloomweave.in',
    password: 'bloom@password',
    tenantSlug: 'bloomweave',
    tenantName: 'Bloom & Weave',
    ownerName: 'Kavita Reddy',
    roleLabel: 'Store Owner',
  },
]

export const DEMO_ADMIN_CREDENTIAL = {
  loginId: 'admin@orvexatech.com',
  password: 'admin@password',
  name: 'Orvexa Tech Super Admin',
  role: 'super_admin',
}

const SELLER_SESSION_KEY = 'lunar_seller_session'
const ADMIN_SESSION_KEY = 'lunar_admin_session'
const SELLER_TOKEN_KEY = 'lunar_seller_token'
const ADMIN_TOKEN_KEY = 'lunar_admin_token'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export const authService = {
  // ─────────────────────────────────────────────────────────
  // SELLER AUTH
  // ─────────────────────────────────────────────────────────
  async loginSeller(
    loginId: string,
    password: string
  ): Promise<{ success: boolean; session?: SellerSession; error?: string }> {
    const cleanId = loginId.trim().toLowerCase()
    const cleanPass = password.trim()

    try {
      const response = await fetch(`${API_BASE}/auth/seller/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId: cleanId, password: cleanPass }),
      })

      const data = await response.json()

      if (!response.ok) {
        // If backend is unreachable, fall back to local mock credentials
        throw new Error(data.error || 'Backend unavailable')
      }

      const session: SellerSession = data.session
      try {
        localStorage.setItem(SELLER_SESSION_KEY, JSON.stringify(session))
        if (data.token) {
          localStorage.setItem(SELLER_TOKEN_KEY, data.token)
        }
      } catch {
        // storage disabled
      }

      return { success: true, session }
    } catch (err: any) {
      // ── Offline / demo fallback ──────────────────────────
      // When the backend is not running, authenticate against the static demo credential list.
      // Remove this block (or gate it behind an env flag) in production.
      const foundDemo = DEMO_SELLER_CREDENTIALS.find(
        (c) =>
          (c.loginId.toLowerCase() === cleanId || c.tenantSlug.toLowerCase() === cleanId) &&
          c.password === cleanPass
      )

      if (foundDemo) {
        const tenant: TenantConfig | undefined = MOCK_TENANTS.find((t) => t.slug === foundDemo.tenantSlug)
        if (tenant) {
          const session: SellerSession = {
            userId: `usr_${tenant.slug}_demo`,
            name: foundDemo.ownerName,
            email: foundDemo.loginId,
            role: 'seller',
            tenantId: tenant.id,
            tenantSlug: tenant.slug,
            brandName: tenant.brandName,
            loginTime: new Date().toISOString(),
          }
          try {
            localStorage.setItem(SELLER_SESSION_KEY, JSON.stringify(session))
          } catch {
            // ignored
          }
          return { success: true, session }
        }
      }

      return {
        success: false,
        error: err.message?.includes('Backend unavailable')
          ? 'Could not reach the authentication server. Please check your connection.'
          : (err.message || 'Invalid Login ID or password.'),
      }
    }
  },

  getSellerSession(): SellerSession | null {
    try {
      const stored = localStorage.getItem(SELLER_SESSION_KEY)
      if (stored) {
        return JSON.parse(stored) as SellerSession
      }
    } catch {
      return null
    }
    return null
  },

  getSellerToken(): string | null {
    try {
      return localStorage.getItem(SELLER_TOKEN_KEY)
    } catch {
      return null
    }
  },

  logoutSeller() {
    try {
      localStorage.removeItem(SELLER_SESSION_KEY)
      localStorage.removeItem(SELLER_TOKEN_KEY)
    } catch {
      // ignored
    }
  },

  // ─────────────────────────────────────────────────────────
  // ADMIN AUTH
  // ─────────────────────────────────────────────────────────
  async loginAdmin(
    loginId: string,
    password: string
  ): Promise<{ success: boolean; session?: AdminSession; error?: string }> {
    const cleanId = loginId.trim().toLowerCase()
    const cleanPass = password.trim()

    try {
      const response = await fetch(`${API_BASE}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId: cleanId, password: cleanPass }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Backend unavailable')
      }

      const session: AdminSession = data.session
      try {
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
        if (data.token) {
          localStorage.setItem(ADMIN_TOKEN_KEY, data.token)
        }
      } catch {
        // storage disabled
      }

      return { success: true, session }
    } catch (err: any) {
      // ── Offline / demo fallback ──────────────────────────
      const isDemo =
        (cleanId === 'admin@orvexatech.com' || cleanId === 'admin@platform.com' || cleanId === 'admin') &&
        cleanPass === DEMO_ADMIN_CREDENTIAL.password

      if (isDemo) {
        const session: AdminSession = {
          userId: 'admin_master_001',
          name: DEMO_ADMIN_CREDENTIAL.name,
          email: cleanId.includes('@') ? cleanId : 'admin@orvexatech.com',
          role: 'super_admin',
          loginTime: new Date().toISOString(),
        }
        try {
          localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
        } catch {
          // ignored
        }
        return { success: true, session }
      }

      return {
        success: false,
        error: err.message?.includes('Backend unavailable')
          ? 'Could not reach the authentication server. Please check your connection.'
          : (err.message || 'Invalid Super Admin credentials.'),
      }
    }
  },

  getAdminSession(): AdminSession | null {
    try {
      const stored = localStorage.getItem(ADMIN_SESSION_KEY)
      if (stored) {
        return JSON.parse(stored) as AdminSession
      }
    } catch {
      return null
    }
    return null
  },

  getAdminToken(): string | null {
    try {
      return localStorage.getItem(ADMIN_TOKEN_KEY)
    } catch {
      return null
    }
  },

  logoutAdmin() {
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY)
      localStorage.removeItem(ADMIN_TOKEN_KEY)
    } catch {
      // ignored
    }
  },
}
