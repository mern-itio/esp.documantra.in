import React, { useEffect, useMemo, useState } from 'react'
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

  return (
    <div className="min-h-screen bg-[#F5F2EE] flex items-center justify-center py-10 px-4 sm:py-16 sm:px-6 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#155E4B]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="container-max relative w-full px-2 sm:px-4">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Left — brand story (hidden on small screens to keep form compact) */}
          <div className="hidden lg:block space-y-8 text-slate-900">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#155E4B]" />
              Start free — no credit card required
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
                Join{' '}
                <span className="text-[#155E4B]">{BRAND.name}</span>
                {' '}today
              </h1>
              <p className="max-w-xl text-sm md:text-base text-slate-600 leading-relaxed">
                Create, send, and sign documents in minutes. Secure e-signatures, smart templates, and
                team workflows — all in one place.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 max-w-xl">
              {[
                { icon: FileText, label: 'Templates', value: 'Ready to use' },
                { icon: PenTool, label: 'E-Sign', value: 'Legally binding' },
                { icon: Shield, label: 'Security', value: '256-bit SSL' },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 shadow-sm"
                >
                  <Icon className="h-4 w-4 text-[#155E4B] mb-1" />
                  <p className="text-[11px] text-slate-500">{label}</p>
                  <p className="text-sm font-semibold text-slate-800">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — signup card */}
          <div className="flex justify-center lg:justify-end mx-auto w-full max-w-md lg:max-w-none">
            <div className="w-full max-w-md rounded-[28px] sm:rounded-[32px] border border-[#E5DED3] bg-white p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Create your account</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Verify your email, set a password, and you&apos;re in.
                  </p>
                </div>
                <BrandLogo className="h-12 w-auto object-contain shrink-0" />
              </div>

              {formError && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {emailAlreadyExists && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
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
                <div className="mb-4 relative rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 pr-9">
                  <button
                    type="button"
                    onClick={() => setReferralInviteBannerDismissed(true)}
                    className="absolute right-2 top-2 rounded-lg p-1 text-slate-500 hover:bg-emerald-100"
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex gap-2">
                    <Gift className="h-5 w-5 text-emerald-700 shrink-0" />
                    <p className="text-xs text-emerald-900">
                      You were invited — finish signup to unlock your welcome reward.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className="block text-xs font-medium text-slate-800">
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
                  {errors.firstName && <p className="text-red-600 text-[11px]">{errors.firstName}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone" className="block text-xs font-medium text-slate-800">
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
                  {errors.phone && <p className="text-red-600 text-[11px]">{errors.phone}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-medium text-slate-800">
                    Email address
                  </label>
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
                      className="shrink-0 inline-flex items-center justify-center gap-1 rounded-xl bg-[#155E4B] px-3.5 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#155E4B]/25 hover:bg-[#155E4B]/90 disabled:opacity-50 min-w-[72px]"
                    >
                      {isVerifyingEmail ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : emailPreVerified ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        'Verify'
                      )}
                    </button>
                  </div>
                  {errors.email && <p className="text-red-600 text-[11px]">{errors.email}</p>}
                  {emailStatusMessage && !emailAlreadyExists && (
                    <p
                      className={`text-[11px] flex items-center gap-1 ${
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
                </div>

                {emailOtpSent && !emailPreVerified && (
                  <div className="space-y-1.5 rounded-2xl border border-[#E6D8C9] bg-[#F7F3EE]/60 p-3">
                    <label htmlFor="emailOtp" className="block text-xs font-medium text-slate-800">
                      Enter 6-digit code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="emailOtp"
                        inputMode="numeric"
                        maxLength={6}
                        value={emailOtp}
                        onChange={(e) => {
                          const next = e.target.value.replace(/\D/g, '').slice(0, 6)
                          setEmailOtp(next)
                          if (next.length === 6) void handleConfirmEmailOtp(next)
                        }}
                        className={`${inputClass()} flex-1 tracking-[0.35em] text-center font-mono`}
                        placeholder="000000"
                        autoComplete="one-time-code"
                      />
                      <button
                        type="button"
                        onClick={() => handleConfirmEmailOtp()}
                        disabled={isVerifyingEmail || emailOtp.length !== 6}
                        className="shrink-0 rounded-xl border border-[#155E4B] px-3 py-2 text-xs font-semibold text-[#155E4B] hover:bg-[#155E4B]/5 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {emailOtpExpiresAt && emailOtpExpiresAt > otpNowTs
                        ? `Expires in ${formatOtpCountdown()}`
                        : 'Code expired — tap Verify to resend.'}
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-xs font-medium text-slate-800">
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
                      placeholder="Create a secure password"
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
                  {passwordFocused && formData.password.length > 0 && (
                    <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-xl bg-[#F5F2EE] p-2.5 text-[10px] text-slate-500">
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
                  {errors.password && <p className="text-red-600 text-[11px]">{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-800">
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
                  {errors.confirmPassword && (
                    <p className="text-red-600 text-[11px]">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#155E4B] focus:ring-[#155E4B]/40"
                      required
                    />
                    <span className="text-xs text-slate-600 leading-snug">
                      I agree to the{' '}
                      <Link to="/terms-of-service" className="font-medium text-[#155E4B] hover:underline">
                        Terms
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy-policy" className="font-medium text-[#155E4B] hover:underline">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="subscribeNewsletter"
                      checked={formData.subscribeNewsletter}
                      onChange={handleInputChange}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#155E4B]"
                    />
                    <span className="text-xs text-slate-600">Send me product updates (optional)</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !emailPreVerified}
                  className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#155E4B] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#155E4B]/30 transition hover:bg-[#155E4B]/90 disabled:cursor-not-allowed disabled:bg-[#155E4B]/50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <FederatedLoginButtons
                  mode="signup"
                  disabled={isLoading}
                  onGoogleSuccess={handleGoogleSuccess}
                  onGoogleError={() => setFormError('Google Signup was unsuccessful. Please try again.')}
                  onError={setFormError}
                />
              </form>

              <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <p>
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-[#155E4B] hover:text-[#155E4B]/80">
                    Sign in
                  </Link>
                </p>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <Shield className="h-3 w-3" />
                  256-bit SSL encryption
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
