import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  CheckCircle2,
  Gift,
  X,
  Shield,
  FileText,
  PenTool,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { useAuth } from '../../components/AuthService/AuthContext'
import { FederatedLoginButtons } from '../../components/AuthService/FederatedLoginButtons'
import { getPasswordChecks, getPasswordPolicyError } from '../../utils/passwordPolicy'
import BrandLogo from '../../components/BrandLogo'
import { BRAND } from '../../config/brand'

const OTP_EXPIRY_SECONDS = 10 * 60
const SIGNUP_REFERRER_STORAGE_KEY = 'signupReferrerUserId'

const SIGNUP_STEPS = [
  { id: 1, label: 'Email' },
  { id: 2, label: 'Verify' },
  { id: 3, label: 'Account' },
] as const

function OtpDigitInput({
  value,
  onChange,
  onComplete,
  disabled,
}: {
  value: string
  onChange: (next: string) => void
  onComplete?: (code: string) => void
  disabled?: boolean
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '')

  const setDigit = (index: number, digit: string) => {
    const clean = digit.replace(/\D/g, '').slice(-1)
    const next = digits.map((d, i) => (i === index ? clean : d)).join('').replace(/\s/g, '')
    onChange(next)
    if (clean && index < 5) refs.current[index + 1]?.focus()
    if (next.length === 6) onComplete?.(next)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    onChange(pasted)
    if (pasted.length === 6) onComplete?.(pasted)
    refs.current[Math.min(pasted.length, 5)]?.focus()
  }

  return (
    <div className="flex justify-between gap-2" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => setDigit(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="h-11 w-full max-w-[44px] rounded-xl border border-[#E6D8C9] bg-white text-center text-base font-semibold text-slate-900 shadow-sm transition focus:border-[#155E4B] focus:outline-none focus:ring-2 focus:ring-[#155E4B]/20 disabled:opacity-60"
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}

function SignupProgress({ step }: { step: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-2">
        {SIGNUP_STEPS.map((item, index) => {
          const active = step === item.id
          const done = step > item.id
          return (
            <React.Fragment key={item.id}>
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    done
                      ? 'bg-[#155E4B] text-white shadow-md shadow-[#155E4B]/30'
                      : active
                        ? 'bg-[#155E4B]/10 text-[#155E4B] ring-2 ring-[#155E4B]/30'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : item.id}
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide ${
                    active || done ? 'text-[#155E4B]' : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </div>
              {index < SIGNUP_STEPS.length - 1 && (
                <div
                  className={`mb-5 h-0.5 flex-1 rounded-full transition-colors ${
                    step > item.id ? 'bg-[#155E4B]/50' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

const inputClass = (hasError?: boolean, success?: boolean) =>
  `w-full rounded-xl border bg-[#F7F3EE] py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-[#155E4B]/20 ${
    hasError
      ? 'border-red-400 focus:border-red-500'
      : success
        ? 'border-emerald-400 focus:border-emerald-500'
        : 'border-[#E6D8C9] focus:border-[#155E4B]'
  }`

const SignupPage = () => {
  const {
    signup,
    googleLogin,
    requestSignupEmailVerification,
    confirmSignupEmailVerification,
  } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const referrerUserIdForSignup = useMemo(() => {
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

  const [formData, setFormData] = useState({
    firstName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    subscribeNewsletter: true,
  })
  const [emailOtp, setEmailOtp] = useState('')
  const [emailVerificationToken, setEmailVerificationToken] = useState('')
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [emailPreVerified, setEmailPreVerified] = useState(false)
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false)
  const [emailStatusMessage, setEmailStatusMessage] = useState('')
  const [emailStatusType, setEmailStatusType] = useState<'ok' | 'err' | 'info'>('info')
  const [emailOtpExpiresAt, setEmailOtpExpiresAt] = useState<number | null>(null)
  const [otpNowTs, setOtpNowTs] = useState(Date.now())
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [formError, setFormError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordChecks, setPasswordChecks] = useState({
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
    length: false,
  })
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [referralInviteBannerDismissed, setReferralInviteBannerDismissed] = useState(false)

  useEffect(() => {
    if (!emailOtpSent || emailPreVerified || !emailOtpExpiresAt || emailOtpExpiresAt <= Date.now()) return
    const timer = window.setInterval(() => setOtpNowTs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [emailOtpSent, emailPreVerified, emailOtpExpiresAt])

  const formatOtpCountdown = () => {
    if (!emailOtpExpiresAt) return ''
    const remainingSec = Math.max(0, Math.ceil((emailOtpExpiresAt - otpNowTs) / 1000))
    const mm = Math.floor(remainingSec / 60).toString().padStart(2, '0')
    const ss = (remainingSec % 60).toString().padStart(2, '0')
    return `${mm}:${ss}`
  }

  const resetEmailVerification = () => {
    setEmailOtp('')
    setEmailVerificationToken('')
    setEmailOtpSent(false)
    setEmailPreVerified(false)
    setEmailAlreadyExists(false)
    setEmailStatusMessage('')
    setEmailOtpExpiresAt(null)
  }

  const validateField = (name: string, value: string | boolean, form: typeof formData) => {
    switch (name) {
      case 'firstName': {
        const v = String(value).trim()
        if (!v) return 'Name is required'
        if (!/^[a-zA-Z\s'.-]{3,}$/.test(v)) return 'Name must be at least 3 letters'
        return ''
      }
      case 'phone': {
        const digits = String(value || '').replace(/\D/g, '')
        if (!digits) return ''
        if (digits.length < 10) return 'Enter a valid phone number or leave blank'
        return ''
      }
      case 'email': {
        const v = String(value).trim()
        if (!v) return 'Email is required'
        if (!/^[\w.!#$%&'*+/=?^_`{|}~-]+@[\w-]+(\.[\w-]+)+$/.test(v)) return 'Enter a valid email address'
        return ''
      }
      case 'password':
        return getPasswordPolicyError(String(value)) || ''
      case 'confirmPassword': {
        const v = String(value)
        if (!v) return 'Confirm your password'
        if (v !== form.password) return 'Passwords do not match'
        return ''
      }
      case 'agreeToTerms':
        return value ? '' : 'You must agree to the terms'
      default:
        return ''
    }
  }

  const validateAll = (form: typeof formData) => {
    const nextErrors: Record<string, string> = {}
    ;['firstName', 'phone', 'email', 'password', 'confirmPassword', 'agreeToTerms'].forEach((field) => {
      const msg = validateField(field, (form as any)[field], form)
      if (msg) nextErrors[field] = msg
    })
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    const nextValue = type === 'checkbox' ? checked : value
    const nextForm = { ...formData, [name]: nextValue }
    setFormData(nextForm)
    if (name === 'password') setPasswordChecks(getPasswordChecks(String(value)))
    if (name === 'email') resetEmailVerification()
    setErrors((prev) => ({ ...prev, [name]: validateField(name, nextValue, nextForm) }))
  }

  const handlePhoneChange = (val: string) => {
    const nextForm = { ...formData, phone: val }
    setFormData(nextForm)
    setErrors((prev) => ({ ...prev, phone: validateField('phone', val, nextForm) }))
  }

  const handleRequestEmailVerification = async () => {
    setFormError('')
    setEmailStatusMessage('')
    setEmailAlreadyExists(false)
    const emailError = validateField('email', formData.email, formData)
    if (emailError) {
      setErrors((prev) => ({ ...prev, email: emailError }))
      return
    }

    setIsVerifyingEmail(true)
    try {
      const result = await requestSignupEmailVerification(formData.email)
      if (result.exists) {
        setEmailAlreadyExists(true)
        setEmailStatusType('err')
        setEmailStatusMessage(result.message)
        return
      }
      setEmailOtpSent(true)
      setEmailOtpExpiresAt(Date.now() + OTP_EXPIRY_SECONDS * 1000)
      setEmailStatusType('ok')
      setEmailStatusMessage(result.message)
    } catch (error) {
      setEmailStatusType('err')
      setEmailStatusMessage((error as Error).message || 'Failed to send verification code')
    } finally {
      setIsVerifyingEmail(false)
    }
  }

  const handleConfirmEmailOtp = async (code?: string) => {
    const emailTrim = (code ?? emailOtp).replace(/\D/g, '').slice(0, 6)
    if (emailTrim.length !== 6) {
      setEmailStatusType('err')
      setEmailStatusMessage('Enter the 6-digit code from your email')
      return
    }

    setIsVerifyingEmail(true)
    setFormError('')
    try {
      const result = await confirmSignupEmailVerification(formData.email, emailTrim)
      setEmailVerificationToken(result.emailVerificationToken)
      setEmailPreVerified(true)
      setEmailOtp(emailTrim)
      setEmailStatusType('ok')
      setEmailStatusMessage('Email verified — you can finish creating your account.')
    } catch (error) {
      setEmailStatusType('err')
      setEmailStatusMessage((error as Error).message || 'Invalid verification code')
    } finally {
      setIsVerifyingEmail(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!validateAll(formData)) {
      setFormError(
        'Please fix the highlighted fields. Password must include uppercase, lowercase, a number, and a special character (@$!%*?&).'
      )
      return
    }
    if (!emailPreVerified || !emailVerificationToken) {
      setFormError('Please verify your email address before creating an account.')
      return
    }

    setIsLoading(true)
    try {
      const result = await signup({
        fullname: formData.firstName,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone,
        password: formData.password,
        emailVerificationToken,
        recaptchaToken: 'disabled',
        agreeToTerms: formData.agreeToTerms,
        subscribeNewsletter: formData.subscribeNewsletter,
        termsVersion: 'v1',
        privacyVersion: 'v1',
        marketingVersion: 'v1',
        ...(referrerUserIdForSignup ? { referrerUserId: referrerUserIdForSignup } : {}),
      })

      try {
        sessionStorage.removeItem(SIGNUP_REFERRER_STORAGE_KEY)
      } catch {
        /* ignore */
      }

      if (result.loggedIn) navigate('/dashboard')
    } catch (error) {
      setFormError((error as Error)?.message || 'An error occurred during signup. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: string | { credential?: string }) => {
    setFormError('')
    setIsLoading(true)
    try {
      const credential =
        typeof credentialResponse === 'string' ? credentialResponse : credentialResponse?.credential
      if (!credential) {
        setFormError('Google Signup failed. No credential received.')
        return
      }
      await googleLogin(credential, {
        ...(referrerUserIdForSignup ? { referrerUserId: referrerUserIdForSignup } : {}),
      })
      try {
        sessionStorage.removeItem(SIGNUP_REFERRER_STORAGE_KEY)
      } catch {
        /* ignore */
      }
      navigate('/dashboard')
    } catch (error: any) {
      setFormError(error.message || 'Google Signup failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const signupStep = emailPreVerified ? 3 : emailOtpSent ? 2 : 1

  const passwordStrength = useMemo(() => {
    const passed = Object.values(passwordChecks).filter(Boolean).length
    if (passed <= 2) return { label: 'Weak', bar: 'w-1/3', color: 'bg-red-500', text: 'text-red-600' }
    if (passed <= 4) return { label: 'Fair', bar: 'w-2/3', color: 'bg-amber-500', text: 'text-amber-600' }
    return { label: 'Strong', bar: 'w-full', color: 'bg-emerald-500', text: 'text-emerald-600' }
  }, [passwordChecks])

  const highlights = [
    { icon: FileText, title: 'Smart templates', desc: 'Launch contracts in minutes' },
    { icon: PenTool, title: 'E-Sign built in', desc: 'Legally binding signatures' },
    { icon: Shield, title: 'Enterprise security', desc: '256-bit encryption & audit trails' },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F5F2EE]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#155E4B]/10 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-100/60 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(21,94,75,0.08) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <div className="container-max w-full">
          <div className="grid items-stretch gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 xl:gap-20">
            {/* Left — brand story */}
            <div className="flex flex-col justify-center space-y-8 text-slate-900">
              <div className="lg:hidden flex items-center justify-between gap-4">
                <BrandLogo className="h-10 w-auto object-contain" />
                <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-700 shadow-sm backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5 text-[#155E4B]" />
                  Free to start
                </div>
              </div>

              <div className="hidden lg:inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Join 120+ teams already on {BRAND.name}
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
                  Create your account and start signing in{' '}
                  <span className="bg-gradient-to-r from-[#155E4B] to-emerald-600 bg-clip-text text-transparent">
                    minutes
                  </span>
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                  One workspace for documents, e-signatures, and team workflows. Verify your email,
                  set a password, and you&apos;re ready to send your first envelope.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Avg. time to sign', value: '6 min', tone: 'text-emerald-600' },
                  { label: 'Documents processed', value: '2M+', tone: 'text-sky-700' },
                  { label: 'Uptime', value: '99.9%', tone: 'text-[#155E4B]' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-sm"
                  >
                    <p className="text-[11px] text-slate-500">{stat.label}</p>
                    <p className={`mt-1 text-lg font-bold ${stat.tone}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="hidden lg:grid gap-3">
                {highlights.map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/60 px-4 py-3.5 shadow-sm backdrop-blur-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#155E4B]/10 text-[#155E4B]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{title}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden lg:flex items-center gap-3 rounded-2xl border border-[#E6D8C9]/80 bg-gradient-to-r from-white/90 to-[#F7F3EE]/90 p-4 shadow-sm">
                <div className="flex -space-x-2">
                  {['S', 'A', 'R', 'M'].map((initial, i) => (
                    <div
                      key={initial}
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#155E4B] text-xs font-bold text-white"
                      style={{ zIndex: 4 - i }}
                    >
                      {initial}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    &ldquo;Onboarding took less than 2 minutes — we sent our first contract the same day.&rdquo;
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Operations lead, mid-market SaaS team</p>
                </div>
              </div>
            </div>

            {/* Right — signup card */}
            <div className="flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                <div className="absolute -inset-0.5 rounded-[34px] bg-gradient-to-br from-[#155E4B]/25 via-emerald-300/20 to-sky-300/30 blur-sm" />
                <div className="relative overflow-hidden rounded-[32px] border border-[#E5DED3]/90 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
                  <div className="h-1.5 bg-gradient-to-r from-[#155E4B] via-emerald-500 to-sky-400" />

                  <div className="p-6 sm:p-8">
                    <div className="mb-2 hidden items-center justify-between gap-4 lg:flex">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">Create your account</h2>
                        <p className="mt-1 text-xs text-slate-500">No credit card required</p>
                      </div>
                      <BrandLogo className="h-12 w-auto shrink-0 object-contain" />
                    </div>

                    <SignupProgress step={signupStep} />

                    {formError && (
                      <div className="mb-4 flex gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    {emailAlreadyExists && (
                      <div className="mb-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3">
                        <div className="flex gap-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                          <div className="text-xs text-amber-900">
                            <p className="font-semibold">This email is already registered</p>
                            <p className="mt-1 text-amber-800/90">{emailStatusMessage}</p>
                            <Link
                              to="/login"
                              className="mt-2 inline-flex items-center gap-1 font-semibold text-[#155E4B] hover:underline"
                            >
                              Sign in instead
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}

                    {referrerUserIdForSignup && !referralInviteBannerDismissed && (
                      <div className="relative mb-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-3 pr-9">
                        <button
                          type="button"
                          onClick={() => setReferralInviteBannerDismissed(true)}
                          className="absolute right-2 top-2 rounded-lg p-1 text-slate-500 hover:bg-emerald-100"
                          aria-label="Dismiss"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="flex gap-2">
                          <Gift className="h-5 w-5 shrink-0 text-emerald-700" />
                          <p className="text-xs text-emerald-900">
                            You were invited — finish signup to unlock your welcome reward.
                          </p>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid gap-3.5 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                          <label htmlFor="firstName" className="block text-xs font-semibold text-slate-800">
                            Full name
                          </label>
                          <div className="relative">
                            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              id="firstName"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className={`${inputClass(!!errors.firstName)} pl-10 pr-3`}
                              placeholder="John Doe"
                              required
                            />
                          </div>
                          {errors.firstName && <p className="text-[11px] text-red-600">{errors.firstName}</p>}
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <label htmlFor="phone" className="block text-xs font-semibold text-slate-800">
                            Phone <span className="font-normal text-slate-500">(optional)</span>
                          </label>
                          <PhoneInput
                            country="in"
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            inputProps={{ name: 'phone', id: 'phone' }}
                            containerClass="w-full"
                            inputClass={`!w-full !pl-12 !py-2.5 !text-sm !rounded-xl !bg-[#F7F3EE] !border ${
                              errors.phone ? '!border-red-400' : '!border-[#E6D8C9]'
                            } focus:!border-[#155E4B] focus:!ring-2 focus:!ring-[#155E4B]/20`}
                            buttonClass="!border !border-[#E6D8C9] !bg-[#F7F3EE] !rounded-l-xl"
                          />
                          {errors.phone && <p className="text-[11px] text-red-600">{errors.phone}</p>}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#E6D8C9]/80 bg-gradient-to-br from-[#F7F3EE]/80 to-white p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <label htmlFor="email" className="text-xs font-semibold text-slate-800">
                            Work email
                          </label>
                          {emailPreVerified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="email"
                              id="email"
                              name="email"
                              autoComplete="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              disabled={emailPreVerified}
                              className={`${inputClass(!!errors.email, emailPreVerified)} pl-10 pr-3 disabled:opacity-70`}
                              placeholder="you@company.com"
                              required
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleRequestEmailVerification}
                            disabled={isVerifyingEmail || emailPreVerified || !formData.email.trim()}
                            className="inline-flex min-w-[80px] shrink-0 items-center justify-center gap-1 rounded-xl bg-[#155E4B] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#155E4B]/25 transition hover:bg-[#124a3b] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isVerifyingEmail ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : emailPreVerified ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : emailOtpSent ? (
                              'Resend'
                            ) : (
                              'Verify'
                            )}
                          </button>
                        </div>
                        {errors.email && <p className="mt-1.5 text-[11px] text-red-600">{errors.email}</p>}
                        {emailStatusMessage && !emailAlreadyExists && (
                          <p
                            className={`mt-1.5 flex items-center gap-1 text-[11px] ${
                              emailStatusType === 'err'
                                ? 'text-red-600'
                                : emailStatusType === 'ok'
                                  ? 'text-emerald-700'
                                  : 'text-slate-600'
                            }`}
                          >
                            {emailStatusType === 'ok' && <CheckCircle2 className="h-3 w-3" />}
                            {emailStatusMessage}
                          </p>
                        )}

                        {emailOtpSent && !emailPreVerified && (
                          <div className="mt-4 space-y-3 border-t border-[#E6D8C9]/60 pt-4">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-800">Enter verification code</p>
                              {emailOtpExpiresAt && emailOtpExpiresAt > otpNowTs && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                  {formatOtpCountdown()}
                                </span>
                              )}
                            </div>
                            <OtpDigitInput
                              value={emailOtp}
                              onChange={setEmailOtp}
                              onComplete={(code) => void handleConfirmEmailOtp(code)}
                              disabled={isVerifyingEmail}
                            />
                            <button
                              type="button"
                              onClick={() => handleConfirmEmailOtp()}
                              disabled={isVerifyingEmail || emailOtp.length !== 6}
                              className="w-full rounded-xl border border-[#155E4B] bg-white py-2 text-xs font-semibold text-[#155E4B] transition hover:bg-[#155E4B]/5 disabled:opacity-50"
                            >
                              {isVerifyingEmail ? 'Confirming…' : 'Confirm code'}
                            </button>
                            {emailOtpExpiresAt && emailOtpExpiresAt <= otpNowTs && (
                              <p className="text-center text-[11px] text-amber-700">
                                Code expired — tap Resend to get a new one.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid gap-3.5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label htmlFor="password" className="block text-xs font-semibold text-slate-800">
                            Password
                          </label>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              id="password"
                              name="password"
                              autoComplete="new-password"
                              value={formData.password}
                              onChange={handleInputChange}
                              onFocus={() => setPasswordFocused(true)}
                              onBlur={() => setPasswordFocused(false)}
                              className={`${inputClass(!!errors.password)} pl-10 pr-10`}
                              placeholder="Create password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {formData.password.length > 0 && (
                            <div className="mt-2 space-y-1.5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-500">Password strength</span>
                                <span className={`font-semibold ${passwordStrength.text}`}>{passwordStrength.label}</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.bar}`}
                                />
                              </div>
                            </div>
                          )}
                          {passwordFocused && formData.password.length > 0 && (
                            <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-[#F5F2EE] p-2.5 text-[10px] text-slate-500">
                              {[
                                ['uppercase', 'Uppercase'],
                                ['lowercase', 'Lowercase'],
                                ['number', 'Number'],
                                ['special', 'Special (@$!%*?&)'],
                                ['length', 'Min 8 chars'],
                              ].map(([key, label]) => (
                                <div
                                  key={key}
                                  className={`flex items-center gap-1 ${
                                    passwordChecks[key as keyof typeof passwordChecks] ? 'text-emerald-600' : ''
                                  }`}
                                >
                                  {passwordChecks[key as keyof typeof passwordChecks] ? (
                                    <CheckCircle2 className="h-3 w-3" />
                                  ) : (
                                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                                  )}
                                  <span>{label}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {errors.password && <p className="text-[11px] text-red-600">{errors.password}</p>}
                        </div>

                        <div className="space-y-1.5">
                          <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-800">
                            Confirm password
                          </label>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              id="confirmPassword"
                              name="confirmPassword"
                              autoComplete="new-password"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              className={`${inputClass(!!errors.confirmPassword)} pl-10 pr-10`}
                              placeholder="Re-enter password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {formData.confirmPassword && formData.password === formData.confirmPassword && (
                            <p className="flex items-center gap-1 text-[11px] text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Passwords match
                            </p>
                          )}
                          {errors.confirmPassword && (
                            <p className="text-[11px] text-red-600">{errors.confirmPassword}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2.5 rounded-2xl bg-[#F7F3EE]/50 p-3.5">
                        <label className="flex cursor-pointer items-start gap-2.5">
                          <input
                            type="checkbox"
                            name="agreeToTerms"
                            checked={formData.agreeToTerms}
                            onChange={handleInputChange}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#155E4B] focus:ring-[#155E4B]/40"
                            required
                          />
                          <span className="text-xs leading-snug text-slate-600">
                            I agree to the{' '}
                            <Link to="/terms-of-service" className="font-semibold text-[#155E4B] hover:underline">
                              Terms
                            </Link>{' '}
                            and{' '}
                            <Link to="/privacy-policy" className="font-semibold text-[#155E4B] hover:underline">
                              Privacy Policy
                            </Link>
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-start gap-2.5">
                          <input
                            type="checkbox"
                            name="subscribeNewsletter"
                            checked={formData.subscribeNewsletter}
                            onChange={handleInputChange}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#155E4B]"
                          />
                          <span className="text-xs text-slate-600">Send me product tips and updates (optional)</span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || !emailPreVerified}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#155E4B] to-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#155E4B]/30 transition hover:shadow-xl hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating account…
                          </>
                        ) : (
                          <>
                            Create free account
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>

                      <div className="relative py-1">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-[11px]">
                          <span className="bg-white px-3 text-slate-400">or continue with</span>
                        </div>
                      </div>

                      <FederatedLoginButtons
                        mode="signup"
                        disabled={isLoading}
                        onGoogleSuccess={handleGoogleSuccess}
                        onGoogleError={() => setFormError('Google Signup was unsuccessful. Please try again.')}
                        onError={setFormError}
                      />
                    </form>

                    <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                      <p className="text-xs text-slate-500">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-[#155E4B] hover:underline">
                          Sign in
                        </Link>
                      </p>
                      <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                        <Shield className="h-3 w-3" />
                        256-bit SSL · SOC-ready workflows
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
