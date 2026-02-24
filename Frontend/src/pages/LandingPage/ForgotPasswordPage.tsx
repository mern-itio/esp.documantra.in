import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { authApi } from '../../services/apiHelper'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsLoading(true)

    try {
      await authApi.post<{ message?: string }>('/forgot-password', {
        email: email.trim().toLowerCase(),
      })
      setSuccess(true)
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.'
      setError(msg)
      setSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
    
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            {/* Card header with brand */}
            <div className="px-6 pt-8 pb-2 text-center border-b border-slate-100">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#260559] to-[#084bdc] text-white text-sm font-bold mb-4">
                D&S
              </div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                {success ? 'Check your email' : 'Reset your password'}
              </h1>
              {!success && (
                <p className="mt-2 text-sm text-slate-500 max-w-[320px] mx-auto">
                  Enter the email address associated with your account. We'll send you a link to reset your password.
                </p>
              )}
            </div>

            <div className="p-6 sm:p-8">
              {success ? (
                <div className="space-y-5">
                  <div className="flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      We've sent password reset instructions to <strong className="text-slate-900">{email}</strong>. Click the link in that email to set a new password.
                    </p>
                    <p className="text-xs text-slate-500">
                      The link expires in 1 hour. If you don't see the email, check your spam or junk folder.
                    </p>
                    <p className="text-xs text-slate-400 pt-1">
                      If you didn't request this, you can safely ignore the email.
                    </p>
                  </div>
                  <Link
                    to="/login"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#084bdc] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#084bdc]/90 transition-colors"
                  >
                    Back to sign in
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Link>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700">
                        Email address
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          id="forgot-email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#084bdc] focus:outline-none focus:ring-2 focus:ring-[#084bdc]/20"
                          placeholder="you@company.com"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#084bdc] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#084bdc]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
                    >
                      {isLoading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Sending...
                        </>
                      ) : (
                        'Send reset link'
                      )}
                    </button>
                  </form>

                  <p className="text-center text-sm text-slate-500 pt-2">
                    Remember your password?{' '}
                    <Link to="/login" className="font-medium text-[#084bdc] hover:underline">
                      Sign in
                    </Link>
                  </p>
                </>
              )}
            </div>
          </div>

          {/* <p className="mt-6 text-center text-xs text-slate-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p> */}
        </div>
      </main>
    </div>
  )
}

export default ForgotPasswordPage
