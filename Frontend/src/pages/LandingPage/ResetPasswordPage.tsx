import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { authApi } from '../../services/apiHelper'

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) setError('Missing reset link. Please use the link from your email or request a new one.')
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setIsLoading(true)

    try {
      await authApi.post('/reset-password', { token, newPassword })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid or expired reset link. Please request a new one.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-sky-50 pt-34 relative overflow-hidden flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-sky-100 bg-[#F7F3EE]/90 p-6 sm:p-8 shadow-[0_18px_80px_rgba(15,23,42,0.08)]">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
          <Link to="/forgot-password" className="mt-4 inline-block text-sm font-medium text-[#084bdc] hover:text-[#084bdc]/80">
            Request a new reset link
          </Link>
          <Link to="/login" className="mt-2 block text-sm text-slate-500 hover:text-slate-700">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-sky-50 pt-34 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-[#260559]/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-emerald-200/30 blur-2xl" />
      </div>

      <div className="container-max relative px-4 flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-sky-100 bg-[#F7F3EE]/90 p-6 sm:p-8 shadow-[0_18px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-slate-900">Set new password</h1>
              <p className="mt-1 text-xs text-slate-500">
                Enter your new password below. Use at least 6 characters.
              </p>
            </div>

            {success ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  Password has been reset successfully. Redirecting you to sign in...
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#084bdc] hover:text-[#084bdc]/80"
                >
                  Sign in now
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="newPassword" className="block text-xs font-medium text-slate-800">
                      New password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="newPassword"
                        name="newPassword"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] px-9 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#260559] focus:outline-none focus:ring-2 focus:ring-[#260559]/20"
                        placeholder="At least 6 characters"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-800">
                      Confirm password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] px-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#260559] focus:outline-none focus:ring-2 focus:ring-[#260559]/20"
                        placeholder="Confirm new password"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#084bdc] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#084bdc]/30 transition hover:bg-[#084bdc]/90 disabled:cursor-not-allowed disabled:bg-[#084bdc]/50"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Resetting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Reset password
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                </form>

                <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <Link to="/login" className="font-medium text-[#084bdc] hover:text-[#084bdc]/80">
                    Back to sign in
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
