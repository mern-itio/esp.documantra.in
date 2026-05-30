import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Smartphone, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '../../components/AuthService/AuthContext'
import { APP_NAME } from '../../components/constants/appConfig'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE"
const SIGNUP_REFERRER_STORAGE_KEY = 'signupReferrerUserId'

type LoginStep = 'login' | 'verify'

const LoginPage = () => {
  const { login, googleLogin, verifySignupEmailOtp, sendSignupPhoneOtp, verifySignupPhoneOtp, verifyTwoFaLogin, getTwoFaRecoveryQuestions, verifyTwoFaRecoveryAnswer, verifyTwoFaRecoveryAnswers, verifyTwoFaRecoveryOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const referrerUserIdForOAuth = useMemo(() => {
    const fromUrl = searchParams.get('ref')?.trim()
    if (fromUrl) {
      try {
        sessionStorage.setItem(SIGNUP_REFERRER_STORAGE_KEY, fromUrl)
      } catch {
        /* ignore */
      }
      return fromUrl
    }
    try {
      return sessionStorage.getItem(SIGNUP_REFERRER_STORAGE_KEY)?.trim() || ''
    } catch {
      return ''
    }
  }, [searchParams])
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
  const [twoFaMethod, setTwoFaMethod] = useState<'email' | 'sms' | 'authenticator'>('email')
  const [recoveryAvailable, setRecoveryAvailable] = useState(false)
  const [showRecoveryFlow, setShowRecoveryFlow] = useState(false)
  const [recoveryQuestions, setRecoveryQuestions] = useState<string[]>([])
  const [recoveryAnswers, setRecoveryAnswers] = useState<Record<string, string>>({})
  const [recoveryChoices, setRecoveryChoices] = useState<Array<{ key: 'primary' | 'recovery'; label: string; masked: string }>>([])
  const [recoveryToken, setRecoveryToken] = useState('')
  const [recoveryOtp, setRecoveryOtp] = useState('')
  const [recoveryDestinationMasked, setRecoveryDestinationMasked] = useState('')
  const [recoveryStep, setRecoveryStep] = useState<'questions' | 'email' | 'otp'>('questions')
  const [showRecoveryEmailFallback, setShowRecoveryEmailFallback] = useState(false)
  const [currentRecoveryQuestionIndex, setCurrentRecoveryQuestionIndex] = useState(0)
  const [completedRecoveryQuestions, setCompletedRecoveryQuestions] = useState<Record<string, boolean>>({})
  const [wrongRecoveryQuestions, setWrongRecoveryQuestions] = useState<string[]>([])
  

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
      await login(email, password, 'disabled')
      const returnTo = (location.state as any)?.returnTo || '/dashboard'
      navigate(returnTo)
    } catch (error) {
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
        setTwoFaMethod(anyErr?.method || 'email')
        setRecoveryAvailable(!!anyErr?.recoveryAvailable)
        setShowRecoveryFlow(false)
        setRecoveryQuestions([])
        setRecoveryAnswers({})
        setRecoveryToken('')
        setRecoveryOtp('')
        setRecoveryDestinationMasked('')
        setRecoveryStep('questions')
        setShowRecoveryEmailFallback(false)
        setCurrentRecoveryQuestionIndex(0)
        setCompletedRecoveryQuestions({})
        setWrongRecoveryQuestions([])
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
        await googleLogin(credentialResponse.credential, {
          ...(referrerUserIdForOAuth ? { referrerUserId: referrerUserIdForOAuth } : {}),
        })
        try {
          sessionStorage.removeItem(SIGNUP_REFERRER_STORAGE_KEY)
        } catch {
          /* ignore */
        }
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
    const digits = twoFaOtp.replace(/\D/g, '').slice(0, 8)
    if (!twoFaToken) {
      setError('Verification code session expired. Please login again.')
      setStep('login')
      return
    }
    const allowBackup = twoFaMethod === 'authenticator'
    if (allowBackup) {
      if (digits.length !== 6 && digits.length !== 8) {
        setError('Enter the 6-digit app code or an 8-digit backup code.')
        return
      }
    } else if (digits.length !== 6) {
      setError('Please enter the 6-digit code.')
      return
    }
    const code = digits
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

  const startRecoveryFlow = async () => {
    if (!twoFaToken) {
      setError('Recovery session expired. Please login again.')
      setStep('login')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      const data = await getTwoFaRecoveryQuestions(twoFaToken)
      setRecoveryQuestions(data.questions || [])
      setRecoveryChoices(data.emailChoices || [])
      setRecoveryAnswers({})
      setRecoveryStep('questions')
      setShowRecoveryEmailFallback(false)
      setRecoveryToken('')
      setRecoveryOtp('')
      setRecoveryDestinationMasked('')
      setCurrentRecoveryQuestionIndex(0)
      setCompletedRecoveryQuestions({})
      setWrongRecoveryQuestions([])
      setShowRecoveryFlow(true)
    } catch (err) {
      setError((err as Error)?.message || 'Could not start recovery flow.')
    } finally {
      setIsLoading(false)
    }
  }

  const markRecoveryQuestionComplete = (question: string) => {
    const answer = (recoveryAnswers[question] || '').trim()
    if (!answer) return false
    setCompletedRecoveryQuestions((prev) => ({ ...prev, [question]: true }))
    return true
  }

  const handleNextRecoveryQuestion = async () => {
    const question = recoveryQuestions[currentRecoveryQuestionIndex]
    if (!question) return
    setError('')
    const answer = (recoveryAnswers[question] || '').trim()
    if (!answer) {
      setError('Please answer this question before moving next.')
      return
    }
    setIsLoading(true)
    setWrongRecoveryQuestions((prev) => prev.filter((item) => item !== question))
    let ok = false
    try {
      await verifyTwoFaRecoveryAnswer(twoFaToken, question, answer)
      ok = markRecoveryQuestionComplete(question)
    } catch (err: any) {
      const wrong = Array.isArray(err?.wrongQuestions) ? err.wrongQuestions : [question]
      setWrongRecoveryQuestions((prev) => Array.from(new Set([...prev, ...wrong])))
      setCompletedRecoveryQuestions((prev) => ({ ...prev, [question]: false }))
      setError(`Wrong answer for: ${wrong.join(', ')}`)
    } finally {
      setIsLoading(false)
    }
    if (!ok) {
      return
    }
    if (currentRecoveryQuestionIndex < recoveryQuestions.length - 1) {
      setCurrentRecoveryQuestionIndex((prev) => prev + 1)
      return
    }
    setRecoveryStep('email')
  }

  const verifyCurrentRecoveryQuestion = async () => {
    const question = recoveryQuestions[currentRecoveryQuestionIndex]
    if (!question) return false
    const answer = (recoveryAnswers[question] || '').trim()
    if (!answer) return false
    setError('')
    setIsLoading(true)
    setWrongRecoveryQuestions((prev) => prev.filter((item) => item !== question))
    try {
      await verifyTwoFaRecoveryAnswer(twoFaToken, question, answer)
      markRecoveryQuestionComplete(question)
      return true
    } catch (err: any) {
      const wrong = Array.isArray(err?.wrongQuestions) ? err.wrongQuestions : [question]
      setWrongRecoveryQuestions((prev) => Array.from(new Set([...prev, ...wrong])))
      setCompletedRecoveryQuestions((prev) => ({ ...prev, [question]: false }))
      setError(`Wrong answer for: ${wrong.join(', ')}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const sendRecoveryOtpTo = async (destination: 'primary' | 'recovery') => {
    setError('')
    if (!twoFaToken) {
      setError('Recovery session expired. Please login again.')
      setStep('login')
      return
    }
    const payload = recoveryQuestions.map((question) => ({ question, answer: (recoveryAnswers[question] || '').trim() }))
    if (payload.some((item) => item.answer.length === 0)) {
      setError('Please answer all security questions.')
      setRecoveryStep('questions')
      return
    }
    setIsLoading(true)
    try {
      const data = await verifyTwoFaRecoveryAnswers(twoFaToken, payload, destination)
      setRecoveryToken(data.recoveryToken)
      setRecoveryDestinationMasked(data.destinationMasked)
      setRecoveryStep('otp')
    } catch (err) {
      setError((err as Error)?.message || 'Could not send recovery OTP.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyRecoveryOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const code = recoveryOtp.replace(/\D/g, '').slice(0, 6)
    if (!recoveryToken) {
      setError('Recovery OTP session is missing. Verify security answers first.')
      return
    }
    if (code.length !== 6) {
      setError('Please enter the 6-digit recovery OTP.')
      return
    }
    setIsLoading(true)
    try {
      await verifyTwoFaRecoveryOtp(recoveryToken, code)
      const returnTo = (location.state as any)?.returnTo || '/dashboard'
      navigate(returnTo)
    } catch (err) {
      setError((err as Error)?.message || 'Recovery OTP verification failed.')
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
     <div className="min-h-screen bg-[#F5F2EE] flex items-center justify-center py-16 px-6 relative overflow-hidden">
       
        <div className="container-max relative px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left: Brand / Story */}
            <div className="space-y-8 text-slate-900">
             <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Secure, AI-powered document workflows
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900">
                  Welcome back to{' '}
                  <span className="text-[#155E4B]">
                    {APP_NAME}
                  </span>
                </h1>
                <p className="max-w-2xl text-sm md:text-base text-slate-600">
                  Pick up where you left off. Review contracts, send proposals, or finalize eSignatures -  all from one
                  secure workspace designed for modern teams.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 max-w-xl">
                <div className="rounded-2xl border border-sky-100 bg-[#FFFFFF]/80 px-4 py-3 shadow-sm">
                  <p className="text-xs text-slate-500">Average time to sign</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-600">6 min</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-[#FFFFFF]/80 px-4 py-3 shadow-sm">
                  <p className="text-xs text-slate-500">Documents processed</p>
                  <p className="mt-1 text-lg font-semibold text-sky-700">2M+</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-[#FFFFFF]/80 px-4 py-3 shadow-sm">
                  <p className="text-xs text-slate-500">Global teams</p>
                  <p className="mt-1 text-lg font-semibold text-[#155E4B]">120+</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="font-medium text-slate-700">Trusted by teams in</span>
                <div className="flex flex-wrap gap-3 opacity-90">
                  <span className="rounded-full border border-sky-100 bg-[#F7F3EE]/80 px-3 py-1">
                    Fintech
                  </span>
                  <span className="rounded-full border border-sky-100 bg-[#F7F3EE]/80 px-3 py-1">
                    Legal
                  </span>
                  <span className="rounded-full border border-sky-100 bg-[#F7F3EE]/80 px-3 py-1">
                    Sales Ops
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Login Card */}
            <div className="flex justify-center lg:justify-end">
             <div className="w-full max-w-md rounded-[32px] border border-[#E5DED3] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Sign in to your workspace</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Use your {APP_NAME} account to access documents, templates, and teams.
                    </p>
                  </div>
                <img
  src="https://documantra.in/logo.png"
  alt="Documantra"
  className="h-14 w-auto object-contain"
/>
                </div>

                {error && (
                  <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>
                )}

                {step === 'verify' ? (
                  twoFaToken ? (
                    showRecoveryFlow ? (
                      recoveryStep === 'otp' && recoveryToken ? (
                        <form onSubmit={handleVerifyRecoveryOtp} className="space-y-4">
                          <div className="space-y-1.5">
                            <label htmlFor="recoveryOtp" className="block text-xs font-medium text-slate-800">
                              Recovery OTP
                            </label>
                            <p className="text-[11px] text-slate-500">
                              Enter the 6-digit code sent to {recoveryDestinationMasked || 'your selected email'}.
                            </p>
                            <div className="relative">
                              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                id="recoveryOtp"
                                value={recoveryOtp}
                                onChange={(e) => setRecoveryOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                inputMode="numeric"
                                maxLength={6}
                                className="w-full rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] px-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#155E4B] focus:outline-none focus:ring-2 focus:ring-[#155E4B]/20"
                                placeholder="000000"
                                autoComplete="one-time-code"
                                required
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#155E4B] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#155E4B]/30 transition hover:bg-[#155E4B]/90 disabled:cursor-not-allowed disabled:bg-[#155E4B]/50"
                          >
                            {isLoading ? 'Verifying...' : 'Complete recovery login'}
                          </button>
                        </form>
                      ) : recoveryStep === 'email' ? (
                        <div className="space-y-4">
                          <p className="text-xs text-slate-600">
                            Security answers verified. Send OTP to your primary email first.
                          </p>
                          {recoveryChoices.find((item) => item.key === 'primary') && (
                            <button
                              type="button"
                              onClick={() => sendRecoveryOtpTo('primary')}
                              disabled={isLoading}
                              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#155E4B] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#155E4B]/30 transition hover:bg-[#155E4B]/90 disabled:cursor-not-allowed disabled:bg-[#155E4B]/50"
                            >
                              {isLoading ? 'Sending OTP...' : `Send OTP to ${recoveryChoices.find((item) => item.key === 'primary')?.masked}`}
                            </button>
                          )}
                          {recoveryChoices.find((item) => item.key === 'recovery') && (
                            <div className="space-y-2">
                              {!showRecoveryEmailFallback ? (
                                <button
                                  type="button"
                                  onClick={() => setShowRecoveryEmailFallback(true)}
                                  className="w-full text-xs font-medium text-[#155E4B] hover:text-[#155E4B]/80"
                                >
                                  Lost access to primary email?
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => sendRecoveryOtpTo('recovery')}
                                  disabled={isLoading}
                                  className="w-full rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-[#F5F2EE] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isLoading ? 'Sending OTP...' : `Send OTP to recovery email (${recoveryChoices.find((item) => item.key === 'recovery')?.masked})`}
                                </button>
                              )}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setRecoveryStep('questions')}
                            className="w-full text-xs font-medium text-slate-600 hover:text-slate-800"
                          >
                            Back to questions
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowRecoveryFlow(false)}
                            className="w-full text-xs font-medium text-slate-600 hover:text-slate-800"
                          >
                            Back to 2FA code entry
                          </button>
                        </div>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            void handleNextRecoveryQuestion()
                          }}
                          className="space-y-4"
                        >
                          <p className="text-xs text-slate-600">
                            Answer your security questions.
                          </p>
                          {recoveryQuestions.length > 0 && (
                            <>
                              <div className="flex justify-center">
                                <div className="flex items-center gap-3">
                                  {recoveryQuestions.map((question, idx) => {
                                    const done = !!completedRecoveryQuestions[question]
                                    const active = idx === currentRecoveryQuestionIndex
                                    const wrong = wrongRecoveryQuestions.includes(question)

                                    return (
                                      <div key={question} className="flex items-center gap-3">
                                        <div
                                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${done
                                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                              : wrong
                                                ? 'border-red-400 bg-red-50 text-red-700'
                                                : active
                                                  ? 'border-[#155E4B] bg-[#155E4B]/10 text-[#155E4B]'
                                                  : 'border-slate-300 bg-[#F7F3EE] text-slate-500'
                                            }`}
                                        >
                                          {idx + 1}
                                        </div>

                                        {idx < recoveryQuestions.length - 1 && (
                                          <div
                                            className={`h-0.5 w-16 rounded ${done ? 'bg-emerald-300' : 'bg-slate-200'
                                              }`}
                                          />
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-slate-800">
                                  {currentRecoveryQuestionIndex + 1}. {recoveryQuestions[currentRecoveryQuestionIndex]}
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={recoveryAnswers[recoveryQuestions[currentRecoveryQuestionIndex]] || ''}
                                    onChange={(e) =>
                                      setRecoveryAnswers((prev) => ({
                                        ...prev,
                                        [recoveryQuestions[currentRecoveryQuestionIndex]]: e.target.value
                                      }))
                                    }
                                    onBlur={() => {
                                      void verifyCurrentRecoveryQuestion()
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault()
                                        void handleNextRecoveryQuestion()
                                      }
                                    }}
                                    className="w-full rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] px-3 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#155E4B] focus:outline-none focus:ring-2 focus:ring-[#155E4B]/20"
                                    placeholder="Your answer"
                                    required
                                    autoFocus
                                  />
                                  {wrongRecoveryQuestions.includes(recoveryQuestions[currentRecoveryQuestionIndex]) ? (
                                    <XCircle className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-red-500" />
                                  ) : completedRecoveryQuestions[recoveryQuestions[currentRecoveryQuestionIndex]] ? (
                                    <CheckCircle2 className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-500" />
                                  ) : null}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  void handleNextRecoveryQuestion()
                                }}
                                disabled={isLoading}
                                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#155E4B] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#155E4B]/30 transition hover:bg-[#155E4B]/90 disabled:cursor-not-allowed disabled:bg-[#155E4B]/50"
                              >
                                {isLoading
                                  ? 'Checking answer...'
                                  : (currentRecoveryQuestionIndex < recoveryQuestions.length - 1 ? 'Next question' : 'Continue')}
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowRecoveryFlow(false)}
                            className="w-full text-xs font-medium text-slate-600 hover:text-slate-800"
                          >
                            Back to 2FA code entry
                          </button>
                        </form>
                      )
                    ) : (
                      <form onSubmit={handleVerifyTwoFa} className="space-y-4">
                        <div className="space-y-1.5">
                          <label htmlFor="twoFaOtp" className="block text-xs font-medium text-slate-800">
                            {twoFaMethod === 'authenticator'
                              ? 'Authenticator or backup code'
                              : 'Enter verification code'}
                          </label>
                          <p className="text-[11px] text-slate-500">
                            {twoFaMethod === 'authenticator'
                              ? '6-digit code from your app, or a one-time 8-digit backup code.'
                              : 'Enter the 6-digit code we sent you.'}
                          </p>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              id="twoFaOtp"
                              value={twoFaOtp}
                              onChange={(e) =>
                                setTwoFaOtp(
                                  e.target.value.replace(/\D/g, '').slice(0, twoFaMethod === 'authenticator' ? 8 : 6)
                                )
                              }
                              inputMode="numeric"
                              maxLength={twoFaMethod === 'authenticator' ? 8 : 6}
                              className="w-full rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] px-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#155E4B] focus:outline-none focus:ring-2 focus:ring-[#155E4B]/20"
                              placeholder={twoFaMethod === 'authenticator' ? '000000 or 00000000' : '000000'}
                              autoComplete="one-time-code"
                              required
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#155E4B] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#155E4B]/30 transition hover:bg-[#155E4B]/90 disabled:cursor-not-allowed disabled:bg-[#155E4B]/50"
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
                            setTwoFaMethod('email')
                          }}
                          className="w-full text-xs font-medium text-slate-600 hover:text-slate-800"
                        >
                          Back to login
                        </button>
                        {recoveryAvailable && (
                          <button
                            type="button"
                            onClick={startRecoveryFlow}
                            disabled={isLoading}
                            className="w-full text-xs font-medium text-[#155E4B] hover:text-[#155E4B]/80"
                          >
                            Lost access to device?
                          </button>
                        )}
                      </form>
                    )
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
                                className="w-full rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] px-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#155E4B] focus:outline-none focus:ring-2 focus:ring-[#155E4B]/20"
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
                            className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#155E4B] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#155E4B]/30 transition hover:bg-[#155E4B]/90 disabled:cursor-not-allowed disabled:bg-[#155E4B]/50"
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
                            className="w-full rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] px-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#155E4B] focus:outline-none focus:ring-2 focus:ring-[#155E4B]/20"
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
                          className="w-full rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-[#F5F2EE] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {phoneOtpSent ? 'Resend phone OTP' : 'Send phone OTP'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleVerifyPhone(e as any)}
                          disabled={isLoading || !emailVerified || phoneVerified}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#155E4B] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#155E4B]/30 transition hover:bg-[#155E4B]/90 disabled:cursor-not-allowed disabled:bg-[#155E4B]/50"
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
                      <div className="flex-grow border-t border-[#E6D8C9]"></div>
                      <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-medium">Or continue with email</span>
                      <div className="flex-grow border-t border-[#E6D8C9]"></div>
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
                          className="w-full rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] px-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#155E4B] focus:outline-none focus:ring-2 focus:ring-[#155E4B]/20"
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
                          className="w-full rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] px-9 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#155E4B] focus:outline-none focus:ring-2 focus:ring-[#155E4B]/20"
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
                          className="h-3.5 w-3.5 rounded border-slate-300 bg-[#F7F3EE] text-[#155E4B] focus:ring-[#155E4B]/40"
                        />
                        <span>Remember this device</span>
                      </label>
                      <Link
                        to="/forgot-password"
                        className="font-medium text-[#155E4B] hover:text-[#155E4B]/80"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#155E4B] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#155E4B]/30 transition hover:bg-[#155E4B]/90 disabled:cursor-not-allowed disabled:bg-[#155E4B]/50"
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
                        className="font-medium text-[#155E4B] hover:text-[#155E4B]/80"
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
