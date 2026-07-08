import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { authApi } from '../../services/apiHelper'
import BrandLogo from '../../components/BrandLogo'

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
 const SignatureIcon = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 120 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M8 28C14 18 18 14 22 14C26 14 26 21 30 21C34 21 35 10 41 10C47 10 45 29 52 29C58 29 57 16 64 16C71 16 68 31 77 31C84 31 84 21 91 21C98 21 102 25 112 14"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M76 33H110"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
);

const DocumentIcon = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 64 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M14 4H38L54 20V70C54 73.3137 51.3137 76 48 76H14C10.6863 76 8 73.3137 8 70V10C8 6.68629 10.6863 4 14 4Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M38 4V16C38 18.2091 39.7909 20 42 20H54"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M18 30H44"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M18 40H44"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.8"
    />
    <path
      d="M18 50H36"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
);

const bgItems = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  type: i % 2 === 0 ? 'signature' : 'document',
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
  rotate: `${Math.random() * 30 - 15}deg`,
  scale: 0.7 + Math.random() * 0.6,
  delay: `${Math.random() * 4}s`,
  duration: `${6 + Math.random() * 4}s`,
}));
  return (
    <div className="relative min-h-screen bg-blue-50 flex flex-col overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-10">
        {bgItems.map((item) => (
          <div
            key={item.id}
            className="absolute text-gray-400 animate-float"
            style={{
              top: item.top,
              left: item.left,
              transform: `translate(-50%, -50%) rotate(${item.rotate})`,
            }}
          >
            {item.type === 'signature' ? (
              <SignatureIcon className="w-16" />
            ) : (
              <DocumentIcon className="w-10" />
            )}
          </div>
        ))}
      </div>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className="rounded-2xl border border-[#E6D8C9]/90 bg-[#F7F3EE] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            {/* Card header with brand */}
            <div className="px-6 pt-8 pb-2 text-center border-b border-slate-100">
              <BrandLogo className="h-12 w-auto object-contain mx-auto mb-4" />
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
                          className="w-full rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#084bdc] focus:outline-none focus:ring-2 focus:ring-[#084bdc]/20"
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
        <style>
        {`
          @keyframes float {
            0%, 100% {
              transform: translate(-50%, -50%) translateY(0) rotate(0deg);
            }
            50% {
              transform: translate(-50%, -50%) translateY(-10px) rotate(2deg);
            }
          }

          .animate-float {
            animation-name: float;
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
          }
        `}
      </style>
    </div>
  )
}

export default ForgotPasswordPage
