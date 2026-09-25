// --- Super Admin Hub Authentication Gateway ---
// Login ID & Password interface for Super Admin control center

import { useState } from 'react'
import { authService, DEMO_ADMIN_CREDENTIAL, type AdminSession } from '@/api/auth'

interface AdminLoginProps {
  onLoginSuccess: (session: AdminSession) => void
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [loginId, setLoginId] = useState(DEMO_ADMIN_CREDENTIAL.loginId)
  const [password, setPassword] = useState(DEMO_ADMIN_CREDENTIAL.password)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!loginId.trim() || !password.trim()) {
      setError('Please provide your Super Admin ID and Master Password.')
      return
    }

    setLoading(true)
    const res = await authService.loginAdmin(loginId, password)
    setLoading(false)
    if (res.success && res.session) {
      onLoginSuccess(res.session)
    } else {
      setError(res.error || 'Authentication failed. Invalid master credentials.')
    }
  }

  const handleFillDemo = () => {
    setLoginId(DEMO_ADMIN_CREDENTIAL.loginId)
    setPassword(DEMO_ADMIN_CREDENTIAL.password)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/40 to-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans text-slate-900">
      {/* Ambient background subtle glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-violet-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-white/95 border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/60 p-6 sm:p-8 backdrop-blur-2xl relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 border border-violet-200 mb-3 shadow-lg shadow-violet-500/25 text-white">
            <span className="text-2xl">👑</span>
          </div>
          <p className="text-[10px] font-mono tracking-[0.22em] text-violet-700 uppercase font-bold">
            ORVEXA TECH PLATFORM MASTER GATEWAY
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1.5" style={{ fontFamily: 'var(--font-display)' }}>
            Super Admin Console
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Sign in to manage multi-tenant merchant stores, subscription billing, and domain routing.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 animate-shake">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Admin Login ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="admin@platform.com"
                className="w-full bg-slate-50/80 border border-slate-300 focus:bg-white focus:border-violet-600 focus:ring-4 focus:ring-violet-500/10 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all font-mono shadow-xs"
                required
              />
              <span className="absolute right-3.5 top-3.5 text-slate-400 text-xs">🛡️</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Master Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] text-violet-600 hover:text-violet-800 transition-colors uppercase tracking-wider font-bold cursor-pointer"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-slate-50/80 border border-slate-300 focus:bg-white focus:border-violet-600 focus:ring-4 focus:ring-violet-500/10 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all font-mono shadow-xs"
                required
              />
              <span className="absolute right-3.5 top-3.5 text-slate-400 text-xs">🔑</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-lg shadow-violet-600/25 active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Authorizing Master Key...</span>
              </>
            ) : (
              <span>Unlock Super Admin Console →</span>
            )}
          </button>
        </form>

        {/* Quick Demo Helper */}
        <div className="mt-7 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleFillDemo}
            className="text-[11px] text-violet-600 hover:text-violet-800 font-semibold transition-colors underline cursor-pointer"
          >
            Auto-fill Demo Admin Credentials
          </button>
          <span className="text-[10px] font-mono text-slate-400">v2.4 Enterprise</span>
        </div>

        {/* Storefront Link */}
        <div className="mt-5 text-center">
          <a
            href="/?tenant=lunar"
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5 font-medium"
          >
            <span>🏬 View Tenant Storefront (The Lunar Clothing) →</span>
          </a>
        </div>
      </div>
    </div>
  )
}
