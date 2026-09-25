// --- Password Reset Modal ---
// Reads ?reset_token=<token>&slug=<tenantSlug> from URL query params.
// Can also be used as a controlled modal by passing props directly.

import { useState, useCallback, useEffect } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  /** Pre-populate from URL if not passed as a prop */
  resetToken?: string
  tenantSlug?: string
}

export default function ResetPasswordModal({ isOpen, onClose, resetToken: propToken, tenantSlug: propSlug }: Props) {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  // Read token and slug from URL if not passed as props
  const [resetToken, setResetToken] = useState(propToken || '')
  const [tenantSlug, setTenantSlug] = useState(propSlug || '')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Read from URL on open
  useEffect(() => {
    if (isOpen && !propToken) {
      const params = new URLSearchParams(window.location.search)
      setResetToken(params.get('reset_token') || '')
      setTenantSlug(params.get('slug') || propSlug || '')
    }
  }, [isOpen, propToken, propSlug])

  // Password strength
  const getStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (pwd.length === 0) return { label: '', color: 'transparent', width: '0%' }
    if (pwd.length < 8) return { label: 'Too short', color: '#ef4444', width: '20%' }
    const hasUpper = /[A-Z]/.test(pwd)
    const hasLower = /[a-z]/.test(pwd)
    const hasNum = /\d/.test(pwd)
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd)
    const score = [hasUpper, hasLower, hasNum, hasSpecial].filter(Boolean).length
    if (score <= 2) return { label: 'Weak', color: '#f97316', width: '40%' }
    if (score === 3) return { label: 'Good', color: '#eab308', width: '70%' }
    return { label: 'Strong', color: '#22c55e', width: '100%' }
  }

  const strength = getStrength(newPassword)

  const handleReset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords don't match.")
        return
      }

      if (!resetToken || !tenantSlug) {
        setError('Missing reset token or store slug. Please use the link from your email.')
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`${API_BASE}/api/auth/seller/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantSlug, resetToken, newPassword }),
        })

        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Failed to reset password.')
        } else {
          setSuccess(true)
          // Remove token from URL without reload
          const url = new URL(window.location.href)
          url.searchParams.delete('reset_token')
          url.searchParams.delete('slug')
          window.history.replaceState({}, '', url.toString())
        }
      } catch {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [resetToken, tenantSlug, newPassword, confirmPassword, API_BASE]
  )

  const handleClose = () => {
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
    setSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      id="reset-password-modal-overlay"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        id="reset-password-modal"
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <button
            id="reset-password-close-btn"
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
            >
              🔑
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {success ? 'Password Updated!' : 'Set New Password'}
              </h2>
              <p className="text-xs text-white/50">
                {success ? "You're all set — please log in" : 'Choose a strong password for your store'}
              </p>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mb-6" />
        </div>

        <div className="px-8 pb-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl"
                style={{ background: 'rgba(34,197,94,0.2)' }}>
                ✅
              </div>
              <p className="text-sm text-white/70">
                Your password has been updated. All existing sessions have been invalidated for security.
              </p>
              <button
                id="reset-password-done-btn"
                onClick={handleClose}
                className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form id="reset-password-form" onSubmit={handleReset} className="space-y-4">
              {error && (
                <div className="rounded-xl p-3 text-sm text-red-300 border border-red-500/30"
                  style={{ background: 'rgba(239,68,68,0.1)' }}>
                  {error}
                </div>
              )}

              {/* Token & slug (editable in case URL params weren't captured) */}
              {!propToken && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                      Store Slug
                    </label>
                    <input
                      id="reset-tenant-slug"
                      type="text"
                      value={tenantSlug}
                      onChange={(e) => setTenantSlug(e.target.value)}
                      placeholder="yourstore"
                      className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                      onFocus={(e) => (e.target.style.borderColor = 'rgba(6,182,212,0.6)')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                      Reset Token
                    </label>
                    <input
                      id="reset-token-input"
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Paste your reset token here"
                      className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-all font-mono text-xs"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                      onFocus={(e) => (e.target.style.borderColor = 'rgba(6,182,212,0.6)')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="reset-new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-white/25 outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(6,182,212,0.6)')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-sm"
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>

                {/* Password strength bar */}
                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: strength.width, background: strength.color }}
                      />
                    </div>
                    <p className="text-xs" style={{ color: strength.color }}>{strength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <input
                  id="reset-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${confirmPassword && confirmPassword !== newPassword ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'}`,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(6,182,212,0.6)')}
                  onBlur={(e) => (e.target.style.borderColor = confirmPassword && confirmPassword !== newPassword ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)')}
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
                )}
              </div>

              <button
                id="reset-password-submit-btn"
                type="submit"
                disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating…
                  </span>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
