import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Smartphone } from 'lucide-react'
import { useAuth } from '../../components/AuthService/AuthContext'
import { APP_NAME } from '../../components/constants/appConfig'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import ReCAPTCHA from 'react-google-recaptcha'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE"
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "YOUR_RECAPTCHA_SITE_KEY_HERE"

type LoginStep = 'login' | 'verify'

const LoginPage = () => {
  const { login, googleLogin, verifySignupEmailOtp, sendSignupPhoneOtp, verifySignupPhoneOtp, verifyTwoFaLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<LoginStep>('login')
  const [signupToken, setSignupToken] = useState<string>('')
  const [emailOtp, setEmailOtp] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [canSendPhoneOtp, setCanSendPhoneOtp] = useState(false)
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [twoFaToken, setTwoFaToken] = useState<string>('')
  const [twoFaOtp, setTwoFaOtp] = useState('')
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const REMEMBER_ME_KEY = 'dns_rememberMe'
  const REMEMBERED_EMAIL_KEY = 'dns_rememberedEmail'

  // Restore "remember me" preferences (safe: we only remember email, never password)
  useEffect(() => {
    try {
      const remembered = localStorage.getItem(REMEMBER_ME_KEY) === 'true'
      const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY) || ''
      setRememberMe(remembered)
      if (remembered && rememberedEmail) setEmail(rememberedEmail)
    } catch {
      // ignore localStorage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    
    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification.')
      return
    }

    setIsLoading(true)

    try {
      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, 'true')
          localStorage.setItem(REMEMBERED_EMAIL_KEY, email)
        } else {
          localStorage.setItem(REMEMBER_ME_KEY, 'false')
          localStorage.removeItem(REMEMBERED_EMAIL_KEY)
        }
      } catch {
        // ignore localStorage errors
      }
      await login(email, password, recaptchaToken)
      const returnTo = (location.state as any)?.returnTo || '/dashboard'
      navigate(returnTo)
    } catch (error) {
      // Reset reCAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset()
      }
      setRecaptchaToken(null)
      
      const anyErr: any = error
      if (anyErr?.name === 'VerificationRequiredError') {
        if (anyErr?.signupToken) setSignupToken(anyErr.signupToken)
        setStep('verify')
        setEmailVerified(!!anyErr?.emailVerified)
        setPhoneVerified(!!anyErr?.phoneVerified)
        // if backend says canSendPhoneOtp, trust it; otherwise infer from step
        setCanSendPhoneOtp(
          typeof anyErr?.canSendPhoneOtp === 'boolean'
            ? anyErr.canSendPhoneOtp
            : anyErr?.step === 'phone'
        )
        setPhoneOtpSent(false)
        setError(anyErr?.message || 'Please verify your account to continue.')
      } else if (anyErr?.name === 'TwoFaRequiredError') {
        setTwoFaToken(anyErr?.twoFaToken || '')
        setTwoFaOtp('')
        // Reuse verify step UI area, but render a 2FA block
        setStep('verify')
        // Hide signup verification blocks by marking email verified, and disabling phone otp send
        setEmailVerified(true)
        setPhoneVerified(true)
        setCanSendPhoneOtp(false)
        setError(anyErr?.message || 'Enter the verification code to continue.')
      } else {
        setError(anyErr?.message || 'Invalid email or password. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('')
    setIsLoading(true)
    try {
      if (credentialResponse.credential) {
        await googleLogin(credentialResponse.credential)
        const returnTo = (location.state as any)?.returnTo || '/dashboard'
        navigate(returnTo)
      } else {
        setError('Google Login failed. No credential received.')
      }
    } catch (error: any) {
      setError(error.message || 'Google Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('Google Login was unsuccessful. Please try again.')
  }

  const handleVerifyTwoFa = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const code = twoFaOtp.replace(/\D/g, '').slice(0, 6)
    if (!twoFaToken) {
      setError('Verification code session expired. Please login again.')
      setStep('login')
      return
    }
    if (code.length !== 6) {
      setError('Please enter the 6-digit code.')
      return
    }
    setIsLoading(true)
    try {
      await verifyTwoFaLogin(twoFaToken, code)
      const returnTo = (location.state as any)?.returnTo || '/dashboard'
      navigate(returnTo)
    } catch (err) {
      setError((err as Error)?.message || 'Invalid code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const emailTrim = emailOtp.replace(/\D/g, '').slice(0, 6)
    if (!signupToken) {
      setError('Verification session expired. Please login again to resend codes.')
      setStep('login')
      return
    }
    if (emailTrim.length !== 6) {
      setError('Please enter the 6-digit code from your email.')
      return
    }
    setIsLoading(true)
    try {
      const st = await verifySignupEmailOtp(signupToken, emailTrim)
      setEmailVerified(st.emailVerified)
      setPhoneVerified(st.phoneVerified)
      setCanSendPhoneOtp(st.canSendPhoneOtp)
      if (st.loggedIn || localStorage.getItem('accessToken')) {
        const returnTo = (location.state as any)?.returnTo || '/dashboard'
        navigate(returnTo)
      }
    } catch (err) {
      setError((err as Error)?.message || 'Email verification failed. Please check the code and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendPhoneOtp = async () => {
    setError('')
    if (!signupToken) return
    setIsLoading(true)
    try {
      const st = await sendSignupPhoneOtp(signupToken)
      setEmailVerified(st.emailVerified)
      setPhoneVerified(st.phoneVerified)
      setCanSendPhoneOtp(st.canSendPhoneOtp)
      setPhoneOtpSent(true)
    } catch (err) {
      setError((err as Error)?.message || 'Failed to send phone OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const phoneTrim = phoneOtp.replace(/\D/g, '').slice(0, 6)
    if (!signupToken) {
      setError('Verification session expired. Please login again to resend codes.')
      setStep('login')
      return
    }
    if (phoneTrim.length !== 6) {
      setError('Please enter the 6-digit code from your phone.')
      return
    }
    setIsLoading(true)
    try {
      const st = await verifySignupPhoneOtp(signupToken, phoneTrim)
      setEmailVerified(st.emailVerified)
      setPhoneVerified(st.phoneVerified)
      setCanSendPhoneOtp(st.canSendPhoneOtp)
      if (st.loggedIn) {
        const returnTo = (location.state as any)?.returnTo || '/dashboard'
        navigate(returnTo)
      }
    } catch (err) {
      setError((err as Error)?.message || 'Phone verification failed. Please check the code and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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

              {step === 'verify' ? (
                twoFaToken ? (
                  <form onSubmit={handleVerifyTwoFa} className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="twoFaOtp" className="block text-xs font-medium text-slate-800">
                     Enter Verification Code
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          id="twoFaOtp"
                          value={twoFaOtp}
                          onChange={(e) => setTwoFaOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          inputMode="numeric"
                          maxLength={6}
                          className="w-full rounded-xl border border-slate-200 bg-white px-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#260559] focus:outline-none focus:ring-2 focus:ring-[#260559]/20"
                          placeholder="000000"
                          autoComplete="one-time-code"
                          required
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
                          Verifying...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Continue
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep('login')
                        setTwoFaToken('')
                        setTwoFaOtp('')
                      }}
                      className="w-full text-xs font-medium text-slate-600 hover:text-slate-800"
                    >
                      Back to login
                    </button>
                  </form>
                ) : (
                <form className="space-y-4">
                  {!emailVerified && (
                    <>
                      <div className="space-y-1.5">
                        <label htmlFor="emailOtp" className="block text-xs font-medium text-slate-800">
                          Email verification code
                        </label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            id="emailOtp"
                            value={emailOtp}
                            onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            inputMode="numeric"
                            maxLength={6}
                            className="w-full rounded-xl border border-slate-200 bg-white px-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#260559] focus:outline-none focus:ring-2 focus:ring-[#260559]/20"
                            placeholder="000000"
                            autoComplete="one-time-code"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleVerifyEmail(e as any)}
                        disabled={isLoading}
                        className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#084bdc] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#084bdc]/30 transition hover:bg-[#084bdc]/90 disabled:cursor-not-allowed disabled:bg-[#084bdc]/50"
                      >
                        {isLoading ? 'Verifying email...' : 'Verify email'}
                      </button>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="phoneOtp" className="block text-xs font-medium text-slate-800">
                      Phone verification code
                    </label>
                    <div className="relative">
                      <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        id="phoneOtp"
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        inputMode="numeric"
                        maxLength={6}
                        className="w-full rounded-xl border border-slate-200 bg-white px-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#260559] focus:outline-none focus:ring-2 focus:ring-[#260559]/20"
                        placeholder="000000"
                        autoComplete="one-time-code"
                        disabled={!emailVerified}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleSendPhoneOtp}
                      disabled={isLoading || !canSendPhoneOtp}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {phoneOtpSent ? 'Resend phone OTP' : 'Send phone OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleVerifyPhone(e as any)}
                      disabled={isLoading || !emailVerified || phoneVerified}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#084bdc] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#084bdc]/30 transition hover:bg-[#084bdc]/90 disabled:cursor-not-allowed disabled:bg-[#084bdc]/50"
                    >
                      {phoneVerified ? 'Phone verified' : (isLoading ? 'Verifying phone...' : 'Verify phone')}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('login')
                      setEmailOtp('')
                      setPhoneOtp('')
                    }}
                    className="w-full text-xs font-medium text-slate-600 hover:text-slate-800"
                  >
                    Back to login
                  </button>
                </form>
                )
              ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-center w-full mb-4">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap
                    shape="rectangular"
                    theme="outline"
                    text="signin_with"
                    size="large"
                    width="100%"
                  />
                </div>
                
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-medium">Or continue with email</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-medium text-slate-800">
                    E-mail ID
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
                      onChange={(e) => {
                        const checked = e.target.checked
                        setRememberMe(checked)
                        try {
                          localStorage.setItem(REMEMBER_ME_KEY, checked ? 'true' : 'false')
                          if (!checked) localStorage.removeItem(REMEMBERED_EMAIL_KEY)
                        } catch {
                          // ignore localStorage errors
                        }
                      }}
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

                <div className="flex justify-center my-4">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={RECAPTCHA_SITE_KEY}
                    onChange={(token) => setRecaptchaToken(token)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !recaptchaToken}
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
              )}

              <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <div className="flex items-center justify-between gap-3">
                  <p>
                    New to {APP_NAME}?{' '}
                    <Link
                      to="/signup"
                      className="font-medium text-[#084bdc] hover:text-[#084bdc]/80"
                    >
                      Create account for free 
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
    </GoogleOAuthProvider>
  )
}

export default LoginPage