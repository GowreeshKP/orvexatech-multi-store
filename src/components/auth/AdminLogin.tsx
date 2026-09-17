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
    <div className="min-h-screen bg-[#07070b] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans text-white">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-[#111119]/90 border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-2xl relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 border border-white/20 mb-3 shadow-lg shadow-violet-500/20">
            <span className="text-2xl">👑</span>
          </div>
          <p className="text-[10px] font-mono tracking-[0.25em] text-violet-400 uppercase font-bold">
            ORVEXA TECH PLATFORM MASTER GATEWAY
          </p>
          <h1 className="text-2xl font-serif text-white mt-1">Orvexa Tech Super Admin Console</h1>
          <p className="text-xs text-white/50 mt-1">
            Sign in to manage multi-tenant merchant stores, subscription billing, and domain routing.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-950/80 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2 animate-shake">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
              Admin Login ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="admin@platform.com"
                className="w-full bg-black/50 border border-white/15 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-white placeholder-white/25 outline-none transition-all font-mono"
                required
              />
              <span className="absolute right-3.5 top-3.5 text-white/40 text-xs">🛡️</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                Master Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
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
                className="w-full bg-black/50 border border-white/15 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-white placeholder-white/25 outline-none transition-all font-mono"
                required
              />
              <span className="absolute right-3.5 top-3.5 text-white/40 text-xs">🔑</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-lg shadow-violet-600/30 active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authorizing Master Key...</span>
              </>
            ) : (
              <span>Unlock Super Admin Console →</span>
            )}
          </button>
        </form>

        {/* Quick Demo Helper */}
        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleFillDemo}
            className="text-[11px] text-violet-300 hover:text-white transition-colors underline cursor-pointer"
          >
            Auto-fill Demo Admin Credentials
          </button>
          <span className="text-[10px] font-mono text-white/30">v2.4 Enterprise</span>
        </div>

        {/* Storefront Link */}
        <div className="mt-6 text-center">
          <a
            href="/?tenant=lunar"
            className="text-xs text-white/40 hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            <span>🏬 View Tenant Storefront (The Lunar Clothing) →</span>
          </a>
        </div>
      </div>
    </div>
  )
}
