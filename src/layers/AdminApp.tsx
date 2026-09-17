import { useState } from 'react'
import { useAdminTenants, useAdminApplications, usePlatformStats } from '@/api/hooks'
import { authService, type AdminSession } from '@/api/auth'
import AdminLogin from '@/components/auth/AdminLogin'
import type { TenantConfig } from '@/types/tenant'

const ADMIN_NAV = [
  { id: 'dashboard', label: 'Platform Overview', icon: '🏠' },
  { id: 'applications', label: 'Applications', icon: '📋' },
  { id: 'stores', label: 'All Stores', icon: '🏪' },
  { id: 'billing', label: 'Billing', icon: '💳' },
  { id: 'domains', label: 'Domains', icon: '🌐' },
] as const

type AdminView = (typeof ADMIN_NAV)[number]['id']

export default function AdminApp() {
  const [session, setSession] = useState<AdminSession | null>(() => authService.getAdminSession())
  const [activeView, setActiveView] = useState<AdminView>('dashboard')

  const handleLogout = () => {
    authService.logoutAdmin()
    setSession(null)
  }

  // If unauthenticated, require Super Admin master login
  if (!session) {
    return <AdminLogin onLoginSuccess={(newSession) => setSession(newSession)} />
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      {/* Dark Sidebar */}
      <aside className="w-64 bg-[#111118] border-r border-white/8 flex flex-col flex-shrink-0">
        {/* Platform Logo */}
        <div className="h-16 border-b border-white/8 flex items-center px-5 gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black">
            O
          </div>
          <div>
            <p className="text-sm font-bold text-white">Orvexa Tech</p>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">Platform Super Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {ADMIN_NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                activeView === item.id
                  ? 'bg-white/10 text-white font-bold'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'applications' && <PendingBadge />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/8 space-y-2">
          <p className="text-[10px] text-white/30 uppercase tracking-widest truncate">{session.name}</p>
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>🚪</span>
            <span>Sign Out Master</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-[#111118] border-b border-white/8 flex items-center justify-between px-8 sticky top-0 z-20">
          <h1 className="text-lg font-bold text-white">
            {ADMIN_NAV.find((n) => n.id === activeView)?.label}
          </h1>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-xs bg-white/10 hover:bg-white/20 text-white font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>🏬</span>
              <span>View Storefront</span>
            </a>
            <button
              onClick={handleLogout}
              className="text-xs bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-200 font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
            <span className="text-xs bg-violet-500/20 border border-violet-500/30 text-violet-300 font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
              Super Admin
            </span>
          </div>
        </header>

        <div className="p-8">
          {activeView === 'dashboard' && <PlatformOverview />}
          {activeView === 'applications' && <ApplicationQueue />}
          {activeView === 'stores' && <TenantDirectory />}
          {activeView === 'billing' && <BillingManager />}
          {activeView === 'domains' && <DomainManager />}
        </div>
      </main>
    </div>
  )
}

function PendingBadge() {
  const { applications } = useAdminApplications()
  const pending = applications.filter((a) => a.status === 'pending').length
  if (pending === 0) return null
  return (
    <span className="ml-auto text-[10px] bg-amber-500 text-black font-black w-5 h-5 rounded-full flex items-center justify-center">
      {pending}
    </span>
  )
}

// =====================================================
// Platform Overview
// =====================================================
function PlatformOverview() {
  const { stats } = usePlatformStats()

  if (!stats) return null

  const kpis = [
    { label: 'Total GMV', value: `₹${stats.totalGMV.toLocaleString()}`, icon: '💰', color: 'from-emerald-500/20 to-emerald-600/5' },
    { label: 'Active Stores', value: stats.activeStores.toString(), icon: '🏪', color: 'from-blue-500/20 to-blue-600/5' },
    { label: 'Monthly Recurring Revenue', value: `₹${stats.monthlyRecurringRevenue.toLocaleString()}`, icon: '📈', color: 'from-violet-500/20 to-violet-600/5' },
    { label: 'Pending Applications', value: stats.pendingApplications.toString(), icon: '📋', color: 'from-amber-500/20 to-amber-600/5' },
    { label: 'Total Customers', value: stats.totalCustomers.toString(), icon: '👥', color: 'from-rose-500/20 to-rose-600/5' },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`bg-gradient-to-br ${kpi.color} rounded-xl p-5 border border-white/8`}>
            <span className="text-2xl">{kpi.icon}</span>
            <p className="text-2xl font-bold text-white mt-3">{kpi.value}</p>
            <p className="text-[10px] text-white/40 font-bold tracking-wider uppercase mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/5 rounded-xl p-6 border border-white/8">
        <h3 className="text-sm font-bold tracking-wider uppercase text-white/40 mb-4">Quick Actions</h3>
        <div className="flex gap-3">
          <button
            onClick={() => {/* Switch to applications view */}}
            className="bg-amber-500/20 text-amber-300 text-xs font-bold tracking-widest uppercase px-5 py-2.5 rounded-lg hover:bg-amber-500/30 transition-colors cursor-pointer border border-amber-500/20"
          >
            REVIEW APPLICATIONS ({stats.pendingApplications})
          </button>
          <a
            href="/?panel=dashboard&tenant=lunar"
            className="bg-white/10 text-white text-xs font-bold tracking-widest uppercase px-5 py-2.5 rounded-lg hover:bg-white/15 transition-colors border border-white/10"
          >
            VIEW SAMPLE DASHBOARD
          </a>
          <a
            href="/"
            target="_blank"
            className="bg-white/10 text-white text-xs font-bold tracking-widest uppercase px-5 py-2.5 rounded-lg hover:bg-white/15 transition-colors border border-white/10"
          >
            VIEW SAMPLE STORE
          </a>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// Application Queue
// =====================================================
function ApplicationQueue() {
  const { applications, approve, reject } = useAdminApplications()
  const [provisionMessage, setProvisionMessage] = useState<string | null>(null)
  const pending = applications.filter((a) => a.status === 'pending')
  const processed = applications.filter((a) => a.status !== 'pending')

  const handleApproveWithFeedback = (id: string, slug: string, brandName: string) => {
    approve(id)
    setProvisionMessage(`✅ Successfully approved ${brandName}! Generated client folder 'src/tenants/${slug}/', initialized 'tenant.env', and provisioned isolated database 'orvexa_tenant_${slug}'.`)
    setTimeout(() => setProvisionMessage(null), 6000)
  }

  return (
    <div className="space-y-8">
      {provisionMessage && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 px-5 py-3.5 rounded-xl text-xs font-semibold flex items-center gap-3">
          <span className="text-lg">📁</span>
          <span>{provisionMessage}</span>
        </div>
      )}

      {/* Pending Applications */}
      <div>
        <h3 className="text-sm font-bold tracking-wider uppercase text-white/40 mb-4">
          Pending Applications ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-12 border border-white/8 text-center">
            <p className="text-3xl mb-3">✅</p>
            <p className="text-white/60">No pending applications</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pending.map((app) => (
              <div key={app.id} className="bg-white/5 rounded-xl p-6 border border-white/8 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white">{app.brandName}</h4>
                      <p className="text-xs text-white/40">{app.niche}</p>
                    </div>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Pending
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <p className="text-white/60">
                      <span className="text-white/30">Owner:</span> {app.ownerName}
                    </p>
                    <p className="text-white/60">
                      <span className="text-white/30">Email:</span> {app.ownerEmail}
                    </p>
                    <p className="text-white/60">
                      <span className="text-white/30">Subdomain:</span>{' '}
                      <code className="bg-white/10 px-2 py-0.5 rounded text-xs text-amber-300">{app.requestedSlug}.orvexatech.com</code>
                    </p>
                  </div>

                  {/* Dedicated Store Folder & Isolated Database Provisioning Info */}
                  <div className="bg-white/5 rounded-lg p-3.5 mb-4 border border-white/8 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40 font-mono">📁 Client Source Folder:</span>
                      <code className="text-white/80 font-mono bg-black/40 px-2 py-0.5 rounded text-[11px]">
                        src/tenants/{app.requestedSlug}/
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40 font-mono">🗄️ Isolated Database:</span>
                      <code className="text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded text-[11px]">
                        orvexa_tenant_{app.requestedSlug}
                      </code>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3 mb-5">
                    <p className="text-xs text-white/30 mb-1">Message:</p>
                    <p className="text-sm text-white/70 italic">&quot;{app.message}&quot;</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleApproveWithFeedback(app.id, app.requestedSlug, app.brandName)}
                    className="flex-1 bg-emerald-500 text-white text-xs font-bold tracking-widest uppercase py-2.5 rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    ✓ APPROVE & PROVISION FOLDER
                  </button>
                  <button
                    onClick={() => reject(app.id)}
                    className="bg-red-500/20 text-red-300 text-xs font-bold tracking-widest uppercase px-4 py-2.5 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer border border-red-500/20"
                  >
                    ✕ REJECT
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed Applications */}
      {processed.length > 0 && (
        <div>
          <h3 className="text-sm font-bold tracking-wider uppercase text-white/40 mb-4">
            Processed ({processed.length})
          </h3>
          <div className="space-y-2">
            {processed.map((app) => (
              <div key={app.id} className="bg-white/5 rounded-lg px-5 py-3 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    app.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {app.status.toUpperCase()}
                  </span>
                  <span className="text-sm text-white/70">{app.brandName}</span>
                  <code className="text-xs text-white/30">{app.requestedSlug}.orvexatech.com</code>
                  {app.status === 'approved' && (
                    <span className="text-[10px] text-white/40 font-mono bg-white/5 px-2 py-0.5 rounded hidden sm:inline">
                      📁 src/tenants/{app.requestedSlug}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/30">{app.ownerEmail}</span>
                  {app.status === 'approved' && (
                    <a
                      href={`/?tenant=${app.requestedSlug}`}
                      target="_blank"
                      className="text-[11px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold px-2.5 py-1 rounded border border-emerald-500/30 transition-colors cursor-pointer"
                    >
                      VIEW STORE ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// =====================================================
// Tenant Directory
// =====================================================
function TenantDirectory() {
  const { tenants, suspend, reactivate, changePlan } = useAdminTenants()
  const [search, setSearch] = useState('')
  const [inspectTenant, setInspectTenant] = useState<TenantConfig | null>(null)
  const [copiedEnv, setCopiedEnv] = useState(false)

  const filtered = tenants.filter((t) =>
    t.brandName.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase()) ||
    t.ownerEmail.toLowerCase().includes(search.toLowerCase())
  )

  const statusColor = (status: TenantConfig['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-300'
      case 'pending': return 'bg-amber-500/20 text-amber-300'
      case 'suspended': return 'bg-red-500/20 text-red-300'
      case 'cancelled': return 'bg-white/10 text-white/30'
    }
  }

  const getTenantEnvString = (t: TenantConfig) => {
    return `# --- Tenant Environment Variables ---
TENANT_ID=${t.id}
TENANT_SLUG=${t.slug}
BRAND_NAME="${t.brandName}"
SUBDOMAIN=${t.slug}.orvexatech.com
CUSTOM_DOMAIN=${t.customDomain || ''}
PRIMARY_COLOR="${t.theme.primaryColor}"
ACCENT_COLOR="${t.theme.accentColor}"

# --- Isolated Database Configuration ---
MONGODB_DB_NAME=orvexa_tenant_${t.slug}
MONGODB_URI=mongodb://localhost:27017/orvexa_tenant_${t.slug}
MONGODB_ISOLATION_MODE=dedicated_database

# --- Store Service Secrets ---
JWT_SECRET=orvexa_jwt_${t.slug}_sec_live
API_PORT=5000
STORAGE_BUCKET=orvexatech-media-${t.slug}
ENABLE_ORDER_TRACKING=${t.theme.enableOrderTracking}
ENABLE_CUSTOMER_REVIEWS=${t.theme.enableReviews}`
  }

  const handleCopyEnv = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedEnv(true)
    setTimeout(() => setCopiedEnv(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stores..."
          className="flex-1 bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-white/30 outline-none rounded-lg"
        />
        <p className="text-xs text-white/30">{filtered.length} stores</p>
      </div>

      <div className="bg-white/5 rounded-xl border border-white/8 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left text-[10px] font-bold tracking-widest uppercase text-white/30 px-6 py-3">Store</th>
              <th className="text-left text-[10px] font-bold tracking-widest uppercase text-white/30 px-4 py-3">Client Source Folder & DB</th>
              <th className="text-left text-[10px] font-bold tracking-widest uppercase text-white/30 px-4 py-3">Owner</th>
              <th className="text-left text-[10px] font-bold tracking-widest uppercase text-white/30 px-4 py-3">Plan</th>
              <th className="text-left text-[10px] font-bold tracking-widest uppercase text-white/30 px-4 py-3">Status</th>
              <th className="text-left text-[10px] font-bold tracking-widest uppercase text-white/30 px-4 py-3">MRR</th>
              <th className="text-right text-[10px] font-bold tracking-widest uppercase text-white/30 px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tenant) => (
              <tr key={tenant.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-bold text-white">{tenant.brandName}</p>
                    <code className="text-[10px] text-amber-300 font-mono">{tenant.slug}.orvexatech.com</code>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-white/70 bg-white/5 px-2 py-0.5 rounded">
                      📁 src/tenants/{tenant.slug}
                    </span>
                    <p className="text-[10px] font-mono text-emerald-400/80">
                      🗄️ orvexa_tenant_{tenant.slug}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-white/70">{tenant.ownerName}</p>
                  <p className="text-[10px] text-white/30">{tenant.ownerEmail}</p>
                </td>
                <td className="px-4 py-4">
                  <select
                    value={tenant.plan}
                    onChange={(e) => changePlan(tenant.id, e.target.value as 'starter' | 'pro' | 'enterprise')}
                    className="bg-white/10 text-white text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border border-white/10 cursor-pointer"
                  >
                    <option value="starter" className="bg-[#111] text-white">Starter</option>
                    <option value="pro" className="bg-[#111] text-white">Pro</option>
                    <option value="enterprise" className="bg-[#111] text-white">Enterprise</option>
                  </select>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${statusColor(tenant.status)}`}>
                    {tenant.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-bold text-white/70">
                  ₹{tenant.subscription.pricePerMonth.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setInspectTenant(tenant)}
                      className="text-[10px] bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer px-2.5 py-1 rounded border border-white/10 transition-colors flex items-center gap-1"
                    >
                      ⚙️ .ENV
                    </button>
                    <a
                      href={`/?tenant=${tenant.slug}`}
                      target="_blank"
                      className="text-[10px] text-white/40 hover:text-white font-bold cursor-pointer px-2 py-1 border border-white/10 rounded hover:border-white/30 transition-colors"
                    >
                      VIEW
                    </a>
                    {tenant.status === 'active' ? (
                      <button
                        onClick={() => suspend(tenant.id)}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold cursor-pointer px-2 py-1 border border-red-500/20 rounded hover:border-red-500/40 transition-colors"
                      >
                        SUSPEND
                      </button>
                    ) : tenant.status === 'suspended' ? (
                      <button
                        onClick={() => reactivate(tenant.id)}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer px-2 py-1 border border-emerald-500/20 rounded hover:border-emerald-500/40 transition-colors"
                      >
                        REACTIVATE
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inspect Tenant Folder & .env Modal */}
      {inspectTenant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-white/15 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">STORE SOURCE FOLDER & CONFIG</span>
                <h3 className="text-lg font-bold flex items-center gap-2 mt-0.5">
                  <span>📁 src/tenants/{inspectTenant.slug}/</span>
                </h3>
              </div>
              <button
                onClick={() => setInspectTenant(null)}
                className="text-white/40 hover:text-white text-lg font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/5 p-3 rounded-lg border border-white/8">
                <span className="text-white/40 block mb-1 font-mono">Store Subdomain</span>
                <code className="text-amber-300 font-mono">{inspectTenant.slug}.orvexatech.com</code>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/8">
                <span className="text-white/40 block mb-1 font-mono">Dedicated Database</span>
                <code className="text-emerald-400 font-mono">orvexa_tenant_{inspectTenant.slug}</code>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60 font-mono">File: src/tenants/{inspectTenant.slug}/tenant.env</span>
                <button
                  onClick={() => handleCopyEnv(getTenantEnvString(inspectTenant))}
                  className="text-[11px] bg-white/10 hover:bg-white/20 text-white font-semibold px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {copiedEnv ? '✓ Copied!' : '📋 Copy .env Content'}
                </button>
              </div>
              <pre className="bg-black/70 border border-white/10 rounded-xl p-4 text-[11px] font-mono text-stone-300 overflow-x-auto max-h-64 leading-relaxed">
                {getTenantEnvString(inspectTenant)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectTenant(null)}
                className="bg-white text-black font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =====================================================
// Billing Manager
// =====================================================
function BillingManager() {
  const { tenants } = useAdminTenants()
  const activeTenants = tenants.filter((t) => t.status === 'active' || t.status === 'pending')

  const totalMRR = activeTenants.reduce((sum, t) => sum + t.subscription.pricePerMonth, 0)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 rounded-xl p-5 border border-white/8">
          <p className="text-2xl font-bold text-white">₹{totalMRR.toLocaleString()}</p>
          <p className="text-[10px] text-white/40 font-bold tracking-wider uppercase mt-1">Monthly Recurring Revenue</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/5 rounded-xl p-5 border border-white/8">
          <p className="text-2xl font-bold text-white">{activeTenants.length}</p>
          <p className="text-[10px] text-white/40 font-bold tracking-wider uppercase mt-1">Active Subscriptions</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/5 rounded-xl p-5 border border-white/8">
          <p className="text-2xl font-bold text-white">₹{(totalMRR * 12).toLocaleString()}</p>
          <p className="text-[10px] text-white/40 font-bold tracking-wider uppercase mt-1">Annual Run Rate</p>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl border border-white/8 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/8">
          <h3 className="text-sm font-bold text-white">Subscription Details</h3>
        </div>
        {activeTenants.map((tenant) => (
          <div key={tenant.id} className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">{tenant.brandName}</p>
              <p className="text-xs text-white/30">{tenant.plan} • ₹{tenant.subscription.pricePerMonth}/mo</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                tenant.subscription.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                tenant.subscription.status === 'trial' ? 'bg-blue-500/20 text-blue-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                {tenant.subscription.status}
              </span>
              <span className="text-xs text-white/30">
                Next: {tenant.subscription.nextBillingDate}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// =====================================================
// Domain Manager
// =====================================================
function DomainManager() {
  const { tenants } = useAdminTenants()

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/40">Manage subdomain and custom domain mappings for all tenants.</p>

      <div className="bg-white/5 rounded-xl border border-white/8 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left text-[10px] font-bold tracking-widest uppercase text-white/30 px-6 py-3">Store</th>
              <th className="text-left text-[10px] font-bold tracking-widest uppercase text-white/30 px-4 py-3">Subdomain</th>
              <th className="text-left text-[10px] font-bold tracking-widest uppercase text-white/30 px-4 py-3">Custom Domain</th>
              <th className="text-left text-[10px] font-bold tracking-widest uppercase text-white/30 px-4 py-3">SSL</th>
              <th className="text-right text-[10px] font-bold tracking-widest uppercase text-white/30 px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {tenants.filter((t) => t.status === 'active').map((tenant) => (
              <tr key={tenant.id} className="border-b border-white/5">
                <td className="px-6 py-4 text-sm font-bold text-white">{tenant.brandName}</td>
                <td className="px-4 py-4">
                  <code className="text-xs text-violet-300 bg-violet-500/10 px-2 py-1 rounded">
                    {tenant.slug}.orvexatech.com
                  </code>
                </td>
                <td className="px-4 py-4">
                  {tenant.customDomain ? (
                    <code className="text-xs text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded">
                      {tenant.customDomain}
                    </code>
                  ) : (
                    <span className="text-xs text-white/20">Not configured</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span className={`text-[10px] font-bold ${tenant.customDomain ? 'text-emerald-400' : 'text-white/20'}`}>
                    {tenant.customDomain ? '🔒 Active' : '—'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-full">
                    LIVE
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
