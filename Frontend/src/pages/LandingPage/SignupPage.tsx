import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Gift,
  X,
  Shield,
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
    if (name === 'password') {
      setPasswordChecks(getPasswordChecks(String(value)))
    }
    if (name === 'email') {
      resetEmailVerification()
    }
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
    const emailError = validateField('email', formData.email, formData)
    if (emailError) {
      setErrors((prev) => ({ ...prev, email: emailError }))
      return
    }

    setIsVerifyingEmail(true)
    try {
      const result = await requestSignupEmailVerification(formData.email)
      if (result.exists) {
        setEmailStatusType('err')
        setEmailStatusMessage(result.message)
        resetEmailVerification()
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
      setEmailStatusMessage('Email verified successfully')
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

      if (result.loggedIn) {
        navigate('/dashboard')
      }
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
    <div className="relative min-h-screen bg-gradient-to-br from-[#260559] via-[#3E2B66] to-[#4d3577] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-[#F7F3EE] shadow-2xl overflow-hidden">
          <div className="px-6 pt-7 pb-4 text-center border-b border-slate-100">
            <Link to="/login" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#3E2B66] mb-4">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
            <BrandLogo className="h-10 w-auto object-contain mx-auto mb-3" />
            <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
            <p className="mt-1 text-sm text-slate-500">Join {BRAND.name} in a few quick steps</p>
          </div>

          <div className="p-6">
            {formError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            {referrerUserIdForSignup && !referralInviteBannerDismissed && (
              <div className="mb-4 relative rounded-xl border border-emerald-200 bg-emerald-50 p-3 pr-9">
                <button
                  type="button"
                  onClick={() => setReferralInviteBannerDismissed(true)}
                  className="absolute right-2 top-2 rounded p-1 text-gray-500 hover:bg-emerald-100"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex gap-2">
                  <Gift className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-900">
                    You were invited. Finish signup to unlock your welcome reward.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-xs font-semibold text-gray-700 mb-1">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm ${
                      errors.firstName ? 'border-red-400' : 'border-gray-300 focus:border-[#3E2B66]'
                    }`}
                    placeholder="John Doe"
                    required
                  />
                </div>
                {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone <span className="font-normal text-gray-500">(optional)</span>
                </label>
                <PhoneInput
                  country="in"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  inputProps={{ name: 'phone', id: 'phone' }}
                  containerClass="w-full"
                  inputClass={`!w-full !pl-12 !py-2.5 !text-sm !rounded-xl !border-2 ${
                    errors.phone ? '!border-red-400' : '!border-gray-300'
                  }`}
                  buttonClass="!border-2 !border-gray-300 !bg-[#F7F3EE]"
                />
                {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
                  Email address
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={emailPreVerified}
                      className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm disabled:bg-gray-100 ${
                        errors.email ? 'border-red-400' : emailPreVerified ? 'border-emerald-400' : 'border-gray-300'
                      }`}
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestEmailVerification}
                    disabled={isVerifyingEmail || emailPreVerified || !formData.email.trim()}
                    className="shrink-0 rounded-xl bg-[#260559] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3E2B66] disabled:opacity-50"
                  >
                    {emailPreVerified ? 'Verified' : isVerifyingEmail ? '...' : 'Verify'}
                  </button>
                </div>
                {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                {emailStatusMessage && (
                  <p
                    className={`text-xs mt-1 ${
                      emailStatusType === 'err'
                        ? 'text-red-600'
                        : emailStatusType === 'ok'
                          ? 'text-emerald-700'
                          : 'text-gray-600'
                    }`}
                  >
                    {emailStatusMessage}
                    {emailStatusType === 'err' && emailStatusMessage.includes('already exists') && (
                      <>
                        {' '}
                        <Link to="/login" className="font-semibold underline">
                          Sign in
                        </Link>
                      </>
                    )}
                  </p>
                )}
              </div>

              {emailOtpSent && !emailPreVerified && (
                <div>
                  <label htmlFor="emailOtp" className="block text-xs font-semibold text-gray-700 mb-1">
                    Email verification code
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
                        if (next.length === 6) {
                          void handleConfirmEmailOtp(next)
                        }
                      }}
                      className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm tracking-widest"
                      placeholder="000000"
                      autoComplete="one-time-code"
                    />
                    <button
                      type="button"
                      onClick={() => handleConfirmEmailOtp()}
                      disabled={isVerifyingEmail || emailOtp.length !== 6}
                      className="shrink-0 rounded-xl border border-[#3E2B66] px-3 py-2 text-xs font-semibold text-[#3E2B66] hover:bg-[#3E2B66]/10 disabled:opacity-50"
                    >
                      Confirm
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {emailOtpExpiresAt && emailOtpExpiresAt > otpNowTs
                      ? `Code expires in ${formatOtpCountdown()}`
                      : 'Code expired. Tap Verify to resend.'}
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-10 text-sm ${
                      errors.password ? 'border-red-400' : 'border-gray-300'
                    }`}
                    placeholder="Create a secure password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordFocused && formData.password.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-gray-500">
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
                          <span className="inline-block h-1 w-1 rounded-full bg-gray-400" />
                        )}
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                )}
                {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-700 mb-1">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-10 text-sm ${
                      errors.confirmPassword ? 'border-red-400' : 'border-gray-300'
                    }`}
                    placeholder="Re-enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="mt-0.5"
                    required
                  />
                  <span className="text-xs text-gray-700">
                    I agree to the{' '}
                    <Link to="/terms-of-service" className="text-[#3E2B66] underline">
                      Terms
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy-policy" className="text-[#3E2B66] underline">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="subscribeNewsletter"
                    checked={formData.subscribeNewsletter}
                    onChange={handleInputChange}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-gray-700">Send me product updates (optional)</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading || !emailPreVerified}
                className="w-full rounded-xl bg-gradient-to-r from-[#260559] to-[#3E2B66] py-3 text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? 'Creating account...' : (
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

            <p className="mt-4 text-center text-xs text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#3E2B66] underline">
                Sign in
              </Link>
            </p>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-gray-500">
              <Shield className="h-3 w-3" />
              256-bit SSL encryption
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
