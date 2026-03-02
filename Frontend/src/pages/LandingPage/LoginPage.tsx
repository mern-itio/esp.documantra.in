import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../../components/AuthService/AuthContext'
import { APP_NAME } from '../../components/constants/appConfig'

const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // If a valid token/userData already exists (e.g. synced from the Chrome extension),
  // skip the login form and send the user to their workspace.
  useEffect(() => {
    const attemptAutoRedirect = () => {
      try {
        const token = localStorage.getItem('accessToken')
        const userData = localStorage.getItem('userData')
        if (token && userData) {
          const returnTo = (location.state as any)?.returnTo || '/dashboard'
          navigate(returnTo)
        }
      } catch {
        // ignore localStorage errors
      }
    }

    attemptAutoRedirect()

    const handler = () => attemptAutoRedirect()
    window.addEventListener('dns-extension-auth-synced', handler as EventListener)
    return () => {
      window.removeEventListener('dns-extension-auth-synced', handler as EventListener)
    }
  }, [navigate, location.state])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      const returnTo = (location.state as any)?.returnTo || '/dashboard'
      navigate(returnTo)
    } catch (error) {
      setError('Invalid email or password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-sky-50 pt-34 relative overflow-hidden">
      {/* Decorative background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-[#260559]/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-emerald-200/30 blur-2xl" />
      </div>

      <div className="container-max relative px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Brand / Story */}
          <div className="space-y-8 text-slate-900">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Secure, AI-powered document workflows
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900">
                Welcome back to{' '}
                <span className="bg-gradient-to-r from-[#260559] via-sky-600 to-indigo-500 bg-clip-text text-transparent">
                  {APP_NAME}
                </span>
              </h1>
              <p className="max-w-xl text-sm md:text-base text-slate-600">
                Pick up where you left off. Review contracts, send proposals, or finalize eSignatures – all from one
                secure workspace designed for modern teams.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 max-w-xl">
              <div className="rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-xs text-slate-500">Average time to sign</p>
                <p className="mt-1 text-lg font-semibold text-emerald-600">6 min</p>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-xs text-slate-500">Documents processed</p>
                <p className="mt-1 text-lg font-semibold text-sky-700">2M+</p>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-xs text-slate-500">Global teams</p>
                <p className="mt-1 text-lg font-semibold text-[#260559]">120+</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="font-medium text-slate-700">Trusted by teams in</span>
              <div className="flex flex-wrap gap-3 opacity-90">
                <span className="rounded-full border border-sky-100 bg-white/80 px-3 py-1">
                  Fintech
                </span>
                <span className="rounded-full border border-sky-100 bg-white/80 px-3 py-1">
                  Legal
                </span>
                <span className="rounded-full border border-sky-100 bg-white/80 px-3 py-1">
                  Sales Ops
                </span>
              </div>
            </div>
          </div>

          {/* Right: Login Card */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md rounded-3xl border border-sky-100 bg-white/90 p-6 sm:p-8 shadow-[0_18px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Sign in to your workspace</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Use your {APP_NAME} account to access documents, templates, and teams.
                  </p>
                </div>
                <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#260559] to-sky-500 text-white text-xs font-semibold">
                  D&S
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-medium text-slate-800">
                    Work email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#260559] focus:outline-none focus:ring-2 focus:ring-[#260559]/20"
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-xs font-medium text-slate-800">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-9 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#260559] focus:outline-none focus:ring-2 focus:ring-[#260559]/20"
                      placeholder="Enter your password"
                      required
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

                <div className="flex items-center justify-between text-xs">
                  <label className="inline-flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 bg-white text-[#260559] focus:ring-[#260559]/40"
                    />
                    <span>Remember this device</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="font-medium text-[#084bdc] hover:text-[#084bdc]/80"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#084bdc] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#084bdc]/30 transition hover:bg-[#084bdc]/90 disabled:cursor-not-allowed disabled:bg-[#084bdc]/50"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Signing you in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Login
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <div className="flex items-center justify-between gap-3">
                  <p>
                    New to {APP_NAME}?{' '}
                    <Link
                      to="/signup"
                      className="font-medium text-[#084bdc] hover:text-[#084bdc]/80"
                    >
                      Create a free account
                    </Link>
                  </p>
                </div>

                <p className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-emerald-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  End-to-end encryption, SOC2-ready infrastructure, and region-aware data residency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage