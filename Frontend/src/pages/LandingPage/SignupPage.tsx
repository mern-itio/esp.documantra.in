import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Building, Locate, FileText, PenTool, Shield, Sparkles, CheckCircle2, ArrowLeft, Smartphone, RotateCcw, Check, Gift, X } from 'lucide-react'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { useAuth } from '../../components/AuthService/AuthContext'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE"

type SignupStep = 'form' | 'verify'
const OTP_EXPIRY_SECONDS = 10 * 60
const SIGNUP_REFERRER_STORAGE_KEY = 'signupReferrerUserId'

const SignupPage = () => {
  const { signup, googleLogin, sendSignupEmailOtp, verifySignupEmailOtp, sendSignupPhoneOtp, verifySignupPhoneOtp } = useAuth()
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
  const [step, setStep] = useState<SignupStep>('form')
  const [signupToken, setSignupToken] = useState<string>('')
  const [emailOtp, setEmailOtp] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [emailOtpExpiresAt, setEmailOtpExpiresAt] = useState<number | null>(null)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [canSendPhoneOtp, setCanSendPhoneOtp] = useState(false)
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [phoneOtpExpiresAt, setPhoneOtpExpiresAt] = useState<number | null>(null)
  const [otpNowTs, setOtpNowTs] = useState<number>(Date.now())
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [errors, setErrors] = useState<{ [k: string]: string }>({})
  const [passwordChecks, setPasswordChecks] = useState({ letter: false, number: false, length: false })
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [bookOpen, setBookOpen] = useState(false)
  const [referralInviteBannerDismissed, setReferralInviteBannerDismissed] = useState(false)

  const formatOtpCountdown = (expiresAt: number | null) => {
    if (!expiresAt) return ''
    const remainingSec = Math.max(0, Math.ceil((expiresAt - otpNowTs) / 1000))
    const mm = Math.floor(remainingSec / 60).toString().padStart(2, '0')
    const ss = (remainingSec % 60).toString().padStart(2, '0')
    return `${mm}:${ss}`
  }

  useEffect(() => {
    const hasActiveTimer =
      (!!emailOtpSent && !emailVerified && !!emailOtpExpiresAt && emailOtpExpiresAt > Date.now()) ||
      (!!phoneOtpSent && !phoneVerified && !!phoneOtpExpiresAt && phoneOtpExpiresAt > Date.now())
    if (!hasActiveTimer) return

    const timer = window.setInterval(() => {
      setOtpNowTs(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [emailOtpSent, emailVerified, emailOtpExpiresAt, phoneOtpSent, phoneVerified, phoneOtpExpiresAt])

  useEffect(() => {
    // Trigger book opening animation on mount
    const timer = setTimeout(() => {
      setBookOpen(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])
  const [formData, setFormData] = useState({
    firstName: '',
    phone: '',
    email: '',
    company: '',
    address: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    subscribeNewsletter: true
  })

  const validateField = (name: string, value: string | boolean, form: typeof formData) => {
    switch (name) {
      case 'firstName': {
        const v = String(value).trim()
        if (!v) return 'Name is required'
        if (!/^[a-zA-Z\s]{3,}$/.test(v)) return 'Name must be at least 3 letters'
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
      case 'password': {
        const v = String(value)
        if (!v) return 'Password is required'
        if (v.length < 8) return 'Password must be at least 8 characters'
        if (!/[A-Z]/.test(v)) return 'Must include an uppercase letter'
        if (!/[a-z]/.test(v)) return 'Must include a lowercase letter'
        if (!/\d/.test(v)) return 'Must include a number'
        return ''
      }
      case 'confirmPassword': {
        const v = String(value)
        if (!v) return 'Confirm your password'
        if (v !== form.password) return 'Passwords do not match'
        return ''
      }
      case 'agreeToTerms': {
        if (!value) return 'You must agree to the terms'
        return ''
      }
      default:
        return ''
    }
  }

  const validateAll = (form: typeof formData) => {
    const nextErrors: { [k: string]: string } = {}
      ;['firstName', 'phone', 'email', 'password', 'confirmPassword', 'agreeToTerms'].forEach((f) => {
        const msg = validateField(f, (form as any)[f], form)
        if (msg) nextErrors[f] = msg
      })
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!validateAll(formData)) return
    

    setIsLoading(true)
    try {
      const { signupToken: token } = await signup({
        fullname: formData.firstName,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        address: formData.address,
        password: formData.password,
        recaptchaToken: 'disabled',
        ...(referrerUserIdForSignup ? { referrerUserId: referrerUserIdForSignup } : {}),
      })
      setSignupToken(token)
      // email OTP is already sent by register; keep phone OTP gated
      setEmailVerified(false)
      setEmailOtpSent(true)
      setEmailOtpExpiresAt(Date.now() + OTP_EXPIRY_SECONDS * 1000)
      setPhoneVerified(false)
      setCanSendPhoneOtp(false)
      setPhoneOtpSent(false)
      setPhoneOtpExpiresAt(null)
      setStep('verify')
    } catch (error) {setFormError((error as Error)?.message || 'An error occurred during signup. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const emailTrim = emailOtp.replace(/\D/g, '').slice(0, 6)
    if (emailTrim.length !== 6) {
      setFormError('Please enter the 6-digit code from your email.')
      return
    }
    setIsLoading(true)
    try {
      const st = await verifySignupEmailOtp(signupToken, emailTrim)
      setEmailVerified(st.emailVerified)
      setPhoneVerified(st.phoneVerified)
      setCanSendPhoneOtp(st.canSendPhoneOtp)
      if (st.loggedIn) {
        try {
          sessionStorage.removeItem(SIGNUP_REFERRER_STORAGE_KEY)
        } catch {
          /* ignore */
        }
        navigate('/dashboard')
      }
    } catch (error) {
      setFormError((error as Error)?.message || 'Email verification failed. Please check the code and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendPhoneOtp = async () => {
    setFormError('')
    if (!signupToken) return
    setIsLoading(true)
    try {
      const st = await sendSignupPhoneOtp(signupToken)
      setEmailVerified(st.emailVerified)
      setPhoneVerified(st.phoneVerified)
      setCanSendPhoneOtp(st.canSendPhoneOtp)
      setPhoneOtpSent(true)
      setPhoneOtpExpiresAt(Date.now() + OTP_EXPIRY_SECONDS * 1000)
    } catch (error) {
      setFormError((error as Error)?.message || 'Failed to send phone OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendEmailOtp = async () => {
    setFormError('')
    if (!signupToken || emailVerified) return
    setIsLoading(true)
    try {
      const st = await sendSignupEmailOtp(signupToken)
      setEmailVerified(st.emailVerified)
      setPhoneVerified(st.phoneVerified)
      setCanSendPhoneOtp(st.canSendPhoneOtp)
      setEmailOtpSent(true)
      setEmailOtpExpiresAt(Date.now() + OTP_EXPIRY_SECONDS * 1000)
    } catch (error) {
      setFormError((error as Error)?.message || 'Failed to resend email OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const phoneTrim = phoneOtp.replace(/\D/g, '').slice(0, 6)
    if (phoneTrim.length !== 6) {
      setFormError('Please enter the 6-digit code from your phone.')
      return
    }
    setIsLoading(true)
    try {
      const st = await verifySignupPhoneOtp(signupToken, phoneTrim)
      setEmailVerified(st.emailVerified)
      setPhoneVerified(st.phoneVerified)
      setCanSendPhoneOtp(st.canSendPhoneOtp)
      if (st.loggedIn) {
        try {
          sessionStorage.removeItem(SIGNUP_REFERRER_STORAGE_KEY)
        } catch {
          /* ignore */
        }
        navigate('/dashboard')
      }
    } catch (error) {
      setFormError((error as Error)?.message || 'Phone verification failed. Please check the code and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setFormError('')
    setIsLoading(true)
    try {
      if (credentialResponse.credential) {
        await googleLogin(credentialResponse.credential, {
          ...(referrerUserIdForSignup ? { referrerUserId: referrerUserIdForSignup } : {}),
        })
        try {
          sessionStorage.removeItem(SIGNUP_REFERRER_STORAGE_KEY)
        } catch {
          /* ignore */
        }
        navigate('/dashboard')
      } else {
        setFormError('Google Signup failed. No credential received.')
      }
    } catch (error: any) {
      setFormError(error.message || 'Google Signup failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleError = () => {
    setFormError('Google Signup was unsuccessful. Please try again.')
  }

  // Social signup providers can be integrated here later

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (name === 'password') {
      const v = String(value)
      setPasswordChecks({
        letter: /[A-Za-z]/.test(v),
        number: /\d/.test(v),
        length: v.length >= 8,
      })
    }
    // Validate on change (lightweight)
    const msg = validateField(name, type === 'checkbox' ? checked : value, {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
    setErrors(prev => ({ ...prev, [name]: msg }))
  }

  const handlePhoneChange = (val: string) => {
    // react-phone-input-2 gives digits with country code, e.g. "919876543210" for India
    setFormData(prev => ({
      ...prev,
      phone: val
    }))
    const msg = validateField('phone', val, {
      ...formData,
      phone: val
    })
    setErrors(prev => ({ ...prev, phone: msg }))
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <div className="min-h-screen bg-gradient-to-br from-[#260559] via-[#3E2B66] to-[#4d3577] flex items-center justify-center p-4 relative">
      {/* Blurred Dashboard Background */}
      <div className="absolute inset-0 bg-gray-100 overflow-y-auto">
        {/* Dashboard Preview Content */}
        <div className="p-6 space-y-6 min-h-screen">
          {/* Dashboard Header */}
          <div className="bg-[#F7F3EE] rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome to {BRAND.name}</h1>
                <p className="text-gray-600 mt-1">Your document management dashboard</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-green-600 font-medium">+12% this month</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Documents', value: '1,247', color: 'bg-blue-100', iconColor: 'text-blue-600' },
              { title: 'Signed', value: '892', color: 'bg-green-100', iconColor: 'text-green-600' },
              { title: 'Pending', value: '156', color: 'bg-yellow-100', iconColor: 'text-yellow-600' },
              { title: 'Templates', value: '43', color: 'bg-[#DCFCE7]', iconColor: 'text-[#155E4B]' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-[#F7F3EE] rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <FileText className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#F7F3EE] rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Documents</h3>
              <div className="space-y-3">
                {['Contract_2024.pdf', 'Invoice_001.pdf', 'Agreement.docx'].map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-[#F5F2EE] rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#F7F3EE] rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {['Upload', 'Sign', 'Template', 'Share'].map((action, idx) => (
                  <div key={idx} className="p-4 bg-[#F5F2EE] rounded-lg text-center">
                    <span className="text-sm font-medium text-gray-700">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blur Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md"></div>

      {/* Signup Form Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 items-stretch book-container" style={{ perspective: '2000px' }}>
          {/* Left Column - Signup Form */}
          <div className={`order-2 lg:order-1 flex book-page-left ${bookOpen ? 'book-open-left' : ''}`}>
            <div className="bg-[#F7F3EE] shadow-2xl p-8 lg:p-6 w-full flex flex-col book-page-inner">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-[#260559] to-[#3E2B66] rounded-lg">
                    <Link to="/login">
                      <ArrowLeft className="h-4 w-4 text-white" />
                    </Link>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">Create Your Account</h1>
                </div>
                <p className="text-gray-600">Join thousands of users who trust {BRAND.name} for their document needs</p>
              </div>
              {formError && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
                  <p className="text-red-600 text-sm font-medium">{formError}</p>
                </div>
              )}

              {referrerUserIdForSignup && !referralInviteBannerDismissed && (
                <div className="mb-6 relative rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-4 pr-10 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setReferralInviteBannerDismissed(true)}
                    className="absolute right-3 top-3 rounded-lg p-1 text-gray-500 hover:bg-emerald-100/80 hover:text-gray-800"
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow">
                      <Gift className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">You were invited</p>
                      <p className="mt-1 text-sm text-emerald-900/90">
                        Finish signup, then <span className="font-medium">send your first document</span> from this
                        account to unlock your welcome reward. Your referrer gets credit at the same time. Track progress
                        in <span className="font-medium">Profile ? Rewards</span>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {step === 'verify' ? (
                /* Verification step: Email OTP + Phone OTP */
                <div className="space-y-5">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Verify your account</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      We sent a 6-digit code to your email. After you verify email, you can optionally verify your phone
                      with SMS.
                    </p>
                  </div>
                  <form className="space-y-5">
                    <div className="form-field-group">
                      <label htmlFor="emailOtp" className="block text-xs font-semibold text-gray-700 mb-1">
                        Email verification code
                      </label>
                      <div className="relative group">
                        <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          id="emailOtp"
                          inputMode="numeric"
                          maxLength={6}
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full pl-8 pr-24 py-2 text-sm border-2 rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3E2B66]/20 focus:border-[#3E2B66]"
                          placeholder="000000"
                          autoComplete="one-time-code"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleSendEmailOtp}
                            disabled={isLoading || emailVerified}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#3E2B66]/40 text-[#3E2B66] hover:bg-[#3E2B66]/10 disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label={emailOtpSent ? 'Resend email OTP' : 'Send email OTP'}
                            title={emailOtpSent ? 'Resend email OTP' : 'Send email OTP'}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                          {emailVerified ? (
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                              <Check className="h-4 w-4" />
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleVerifyEmail(e as any)}
                              disabled={isLoading}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#260559] text-white hover:bg-[#3E2B66] disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Verify email OTP"
                              title="Verify email OTP"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      {emailOtpSent && !emailVerified && (
                        <p className="mt-1 text-[11px] text-gray-500">
                          {emailOtpExpiresAt && emailOtpExpiresAt > otpNowTs
                            ? `Email OTP expires in ${formatOtpCountdown(emailOtpExpiresAt)}`
                            : 'Email OTP expired. Please resend.'}
                        </p>
                      )}
                    </div>
                    <div className="form-field-group">
                      <label htmlFor="phoneOtp" className="block text-xs font-semibold text-gray-700 mb-1">
                        Phone verification code <span className="font-normal text-gray-500">(optional)</span>
                      </label>
                      <div className="relative group">
                        <Smartphone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          id="phoneOtp"
                          inputMode="numeric"
                          maxLength={6}
                          value={phoneOtp}
                          onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full pl-8 pr-24 py-2 text-sm border-2 rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3E2B66]/20 focus:border-[#3E2B66]"
                          placeholder="000000"
                          autoComplete="one-time-code"
                          disabled={!emailVerified}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleSendPhoneOtp}
                            disabled={isLoading || !canSendPhoneOtp}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#3E2B66]/40 text-[#3E2B66] hover:bg-[#3E2B66]/10 disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label={phoneOtpSent ? 'Resend phone OTP' : 'Send phone OTP'}
                            title={phoneOtpSent ? 'Resend phone OTP' : 'Send phone OTP'}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                          {phoneVerified ? (
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                              <Check className="h-4 w-4" />
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleVerifyPhone(e as any)}
                              disabled={isLoading || !emailVerified}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#260559] text-white hover:bg-[#3E2B66] disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Verify phone OTP"
                              title="Verify phone OTP"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      {phoneOtpSent && !phoneVerified && (
                        <p className="mt-1 text-[11px] text-gray-500">
                          {phoneOtpExpiresAt && phoneOtpExpiresAt > otpNowTs
                            ? `Phone OTP expires in ${formatOtpCountdown(phoneOtpExpiresAt)}`
                            : 'Phone OTP expired. Please resend.'}
                        </p>
                      )}
                    </div>
                  </form>
                  <p className="text-xs text-gray-500 text-center">
                    Email code expires in 10 minutes. Phone SMS is optional if you added a number at signup.
                  </p>
                </div>
              ) : (
              /* Signup Form */
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex justify-center w-full mb-4">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap
                    shape="rectangular"
                    theme="outline"
                    text="signup_with"
                    size="large"
                    width="100%"
                  />
                </div>
                
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-[#E6D8C9]"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-medium">Or continue with email</span>
                  <div className="flex-grow border-t border-[#E6D8C9]"></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-field-group">
                    <label htmlFor="firstName" className="block text-xs font-semibold text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative group">
                      <User className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${errors.firstName ? 'text-red-500' : 'text-gray-400 group-focus-within:text-[#3E2B66]'}`} />
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full pl-8 pr-3 py-2 text-sm border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#3E2B66]/20 ${
                          errors.firstName 
                            ? 'border-red-400 focus:border-red-500' 
                            : 'border-gray-300 focus:border-[#3E2B66] hover:border-gray-400'
                        }`}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    {errors.firstName && <p className="text-red-600 text-xs mt-1 animate-fade-in">{errors.firstName}</p>}
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1">
                      Phone <span className="font-normal text-gray-500">(optional)</span>
                    </label>
                    <div className="relative group">
                      <PhoneInput
                        country="in"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        inputProps={{
                          name: 'phone',
                          id: 'phone',
                          required: false
                        }}
                        containerClass="w-full"
                        inputClass={`w-full !pl-12 !pr-3 !py-2 !text-sm !border-2 !rounded-lg !bg-[#F7F3EE] focus:!outline-none focus:!ring-2 !transition-all !duration-300 ${
                          errors.phone
                            ? '!border-red-400 focus:!border-red-500 focus:!ring-red-200'
                            : '!border-gray-300 focus:!border-[#3E2B66] focus:!ring-[#3E2B66]/20 hover:!border-gray-400'
                        }`}
                        buttonClass="!border-2 !border-gray-300 !bg-[#F7F3EE]"
                      />
                    </div>
                    {errors.phone && <p className="text-red-600 text-xs mt-1 animate-fade-in">{errors.phone}</p>}
                  </div>
                </div>

                <div className="form-field-group">
                  <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${errors.email ? 'text-red-500' : 'text-gray-400 group-focus-within:text-[#3E2B66]'}`} />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-8 pr-3 py-2 text-sm border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#3E2B66]/20 ${
                        errors.email 
                          ? 'border-red-400 focus:border-red-500' 
                          : 'border-gray-300 focus:border-[#3E2B66] hover:border-gray-400'
                      }`}
                      placeholder="john.doe@example.com"
                      required
                    />
                  </div>
                  {errors.email && <p className="text-red-600 text-xs mt-1 animate-fade-in">{errors.email}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-field-group">
                    <label htmlFor="company" className="block text-xs font-semibold text-gray-700 mb-1">
                      Company Name
                    </label>
                    <div className="relative group">
                      <Building className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${errors.company ? 'text-red-500' : 'text-gray-400 group-focus-within:text-[#3E2B66]'}`} />
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className={`w-full pl-8 pr-3 py-2 text-sm border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#3E2B66]/20 ${
                          errors.company 
                            ? 'border-red-400 focus:border-red-500' 
                            : 'border-gray-300 focus:border-[#3E2B66] hover:border-gray-400'
                        }`}
                        placeholder="Acme Inc."
                        required
                      />
                    </div>
                  </div>
                  <div className="form-field-group">
                    <label htmlFor="address" className="block text-xs font-semibold text-gray-700 mb-1">
                     Business Address
                    </label>
                    <div className="relative group">
                      <Locate className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${errors.address ? 'text-red-500' : 'text-gray-400 group-focus-within:text-[#3E2B66]'}`} />
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className={`w-full pl-8 pr-3 py-2 text-sm border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#3E2B66]/20 ${
                          errors.address 
                            ? 'border-red-400 focus:border-red-500' 
                            : 'border-gray-300 focus:border-[#3E2B66] hover:border-gray-400'
                        }`}
                        placeholder="123 Main St"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="form-field-group">
                  <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${errors.password ? 'text-red-500' : 'text-gray-400 group-focus-within:text-[#3E2B66]'}`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      className={`w-full pl-8 pr-10 py-2 text-sm border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#3E2B66]/20 ${
                        errors.password 
                          ? 'border-red-400 focus:border-red-500' 
                          : 'border-gray-300 focus:border-[#3E2B66] hover:border-gray-400'
                      }`}
                      placeholder="Create a secure password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#3E2B66] transition-colors duration-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordFocused && formData.password.length > 0 && (
                    <div className="mt-2 p-2 bg-[#F5F2EE] rounded-lg animate-fade-in">
                      <div className="grid grid-cols-3 gap-1.5 text-xs">
                        <div className={`flex items-center gap-1 transition-all duration-300 ${passwordChecks.letter ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordChecks.letter ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <span className="inline-block w-1 h-1 rounded-full bg-gray-400" />
                          )}
                          <span>Add atleast one letter</span>
                        </div>
                        <div className={`flex items-center gap-1 transition-all duration-300 ${passwordChecks.length ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordChecks.length ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <span className="inline-block w-1 h-1 rounded-full bg-gray-400" />
                          )}
                          <span>Min. length 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-1 transition-all duration-300 ${passwordChecks.number ? 'text-green-600' : 'text-gray-500'}`}>
                          {passwordChecks.number ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <span className="inline-block w-1 h-1 rounded-full bg-gray-400" />
                          )}
                          <span>Add a number</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-field-group">
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <Lock className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${errors.confirmPassword ? 'text-red-500' : 'text-gray-400 group-focus-within:text-[#3E2B66]'}`} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full pl-8 pr-10 py-2 text-sm border-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#3E2B66]/20 ${
                        errors.confirmPassword 
                          ? 'border-red-400 focus:border-red-500' 
                          : 'border-gray-300 focus:border-[#3E2B66] hover:border-gray-400'
                      }`}
                      placeholder="Re-enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#3E2B66] transition-colors duration-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-600 text-xs mt-1 animate-fade-in">{errors.confirmPassword}</p>}
                </div>


                {/* Terms and Newsletter */}
                <div className="space-y-2 pt-1">
                  <label className="flex items-start gap-2 cursor-pointer group/checkbox">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className="mt-0.5 w-3.5 h-3.5 text-[#3E2B66] border-gray-300 rounded focus:ring-[#3E2B66] focus:ring-2 transition-all duration-300 cursor-pointer"
                      required
                    />
                    <span className="text-xs text-gray-700 leading-tight">
                      I agree to the{' '}
                      <Link to="/terms-of-service" className="text-[#3E2B66] hover:text-[#260559] font-medium underline transition-colors">
                        Terms
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy-policy" className="text-[#3E2B66] hover:text-[#260559] font-medium underline transition-colors">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {errors.agreeToTerms && <p className="text-red-600 text-xs mt-1 animate-fade-in">{errors.agreeToTerms}</p>}
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="subscribeNewsletter"
                      checked={formData.subscribeNewsletter}
                      onChange={handleInputChange}
                      className="mt-0.5 w-3.5 h-3.5 text-[#3E2B66] border-gray-300 rounded focus:ring-[#3E2B66] focus:ring-2 transition-all duration-300 cursor-pointer"
                    />
                    <span className="text-xs text-gray-700 leading-tight">
                      Send me product updates (optional)
                    </span>
                  </label>
                </div>

                

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group w-full bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white text-base font-semibold py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:from-[#3E2B66] hover:to-[#4d3577] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-100"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">?</span>
                      Creating Account...
                    </span>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </button>
              </form>
              )}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#3E2B66] hover:text-[#260559] font-semibold underline transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Live Document Preview */}
          <div className={`order-1 lg:order-2 hidden lg:block flex book-page-right ${bookOpen ? 'book-open-right' : ''}`}>
            <div className="w-full flex flex-col h-full">
              <div className="bg-gradient-to-br from-purple-50 via-emerald-50 to-blue-50 shadow-2xl overflow-hidden flex-1 flex flex-col border-2 border-[#BBF7D0]/50 relative book-page-inner">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)] animate-pulse"></div>
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(139,92,246,0.05)_25%,rgba(139,92,246,0.05)_50%,transparent_50%,transparent_75%,rgba(139,92,246,0.05)_75%)] bg-[length:20px_20px]"></div>
                </div>
                <div className="p-4 lg:p-7.5 relative z-10 flex-1 flex flex-col overflow-y-auto">
                    <div className="space-y-4">
                      {/* Document Title */}
                    <div className="border-b-2 border-purple-300/50 pb-2.5 animate-fade-in">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 bg-gradient-to-r from-[#260559] to-[#260559]/600 bg-clip-text text-transparent">User Registration Agreement</h3>
                      <p className="text-xs text-gray-600">Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    {/* Personal Information Section */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <User className="h-4 w-4 text-[#3E2B66]" />
                        Personal Information
                      </h4>
                      <div className="bg-[#F7F3EE] p-3 rounded-lg border border-gray-200 shadow-sm">
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-500">Full Name</p>
                            <p className={`text-m font-medium font-brush text-gray-900 min-h-[18px] transition-all duration-500 ${formData.firstName ? 'field-completed' : ''}`}>
                              {formData.firstName || <span className="text-gray-300 italic text-xs">Your name will appear here</span>}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-500 ">Phone Number</p>
                              <p className={`text-m font-medium font-brush text-gray-900 min-h-[18px] transition-all duration-500 ${formData.phone ? 'field-completed' : ''}`}>
                                {formData.phone || <span className="text-gray-300 italic text-xs">Your phone will appear here</span>}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Email Address</p>
                              <p className={`text-m font-medium font-brush text-gray-900 min-h-[18px] transition-all duration-500 ${formData.email ? 'field-completed' : ''}`}>
                                {formData.email || <span className="text-gray-300 italic text-xs">Your email will appear here</span>}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Company Information Section */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Building className="h-4 w-4 text-[#3E2B66]" />
                        Company Information
                      </h4>
                      <div className="bg-[#F7F3EE] p-3 rounded-lg border border-gray-200 shadow-sm">
                          <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-500">Company Name</p>
                            <p className={`text-m font-medium font-brush text-gray-900 min-h-[18px] transition-all duration-500 ${formData.company ? 'field-completed' : ''}`}>
                              {formData.company || <span className="text-gray-300 italic text-xs">Your company name will appear here</span>}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Business Address</p>
                            <p className={`text-m font-medium font-brush text-gray-900 min-h-[18px] transition-all duration-500 ${formData.address ? 'field-completed' : ''}`}>
                              {formData.address || <span className="text-gray-300 italic text-xs">Your address will appear here</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Signature Section */}
                    <div className="space-y-2 pt-2 border-t-2 border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <PenTool className="h-4 w-4 text-[#3E2B66]" />
                        Signature
                      </h4>
                      <div className="bg-gradient-to-br from-purple-50 to-emerald-50 p-4 rounded-lg border-2 border-dashed border-[#3E2B66]/30">
                        <div className="flex items-center justify-center min-h-[100px]">
                          {formData.firstName && formData.email ? (
                            <div className="text-center w-full animate-fade-in">
                              {/* Cursive Signature Display */}
                              <div className="bg-[#F7F3EE] p-2 rounded-lg shadow-inner border border-gray-200">
                                <div className="signature-container">
                                  <div className="signature-line"></div>
                                  <div className="signature-text">
                                    {formData.firstName}
                                  </div>
                                  <div className="signature-line"></div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mt-2">Your information will be securely stored</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <PenTool className="h-8 w-8 text-gray-300 mx-auto mb-1" />
                              <p className="text-xs text-gray-400">Fill the form to see your signature preview</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Security Badge */}
                    <div className="flex items-center justify-center gap-2 pt-1 border-t border-gray-200">
                      <Shield className="h-3 w-3 text-[#3E2B66]" />
                      <span className="text-xs text-gray-600">256-bit SSL Encryption</span>
                      <Sparkles className="h-3 w-3 text-[#3E2B66] animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </GoogleOAuthProvider>
  );
}

export default SignupPage