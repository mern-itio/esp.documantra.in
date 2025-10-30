import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../../components/AuthService/AuthContext'

const SignupPage = () => {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [errors, setErrors] = useState<{ [k: string]: string }>({})
  const [passwordChecks, setPasswordChecks] = useState({ letter: false, number: false, length: false })
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    phone: '',
    email: '',
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
        const v = String(value).trim()
        if (!v) return 'Phone is required'
        if (!/^\d{10}$/.test(v)) return 'Phone must be 10 digits'
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
      await signup({
        fullname: formData.firstName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      })
      navigate('/dashboard')
    } catch (error) {
      setFormError('An error occurred during signup. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Social signup providers can be integrated here later

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    // Special handling for phone: digits only and capped at 10
    const nextValue = name === 'phone'
      ? value.replace(/\D/g, '').slice(0, 10)
      : value

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : nextValue
    }))
    if (name === 'password') {
      const v = String(nextValue)
      setPasswordChecks({
        letter: /[A-Za-z]/.test(v),
        number: /\d/.test(v),
        length: v.length >= 8,
      })
    }
    // Validate on change (lightweight)
    const msg = validateField(name, type === 'checkbox' ? checked : nextValue, {
      ...formData,
      [name]: type === 'checkbox' ? checked : nextValue
    })
    setErrors(prev => ({ ...prev, [name]: msg }))
  }

  return (
    <div className="min-h-screen mb-4 mt-4 bg-gradient-to-br from-primary-50 to-white pt-24">
      <div >
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
            <p className="text-gray-600">Join thousands of users who trust DocuSigner for their document needs</p>
          </div>

          {/* Signup Form */}
          <div className="bg-white shadow-lg p-8">
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{formError}</p>
              </div>
            )}
            {/* Social Signup Buttons */}
            {/* <div className="space-y-3 mb-6">
              <button
                onClick={() => handleSocialSignup('google')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-5 h-5 bg-red-500 rounded"></div>
                <span className="font-medium text-gray-700">Sign up with Google</span>
              </button>

              <button
                onClick={() => handleSocialSignup('linkedin')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-5 h-5 bg-blue-600 rounded"></div>
                <span className="font-medium text-gray-700">Sign up with LinkedIn</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSocialSignup('twitter')}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-5 h-5 bg-black rounded"></div>
                  <span className="font-medium text-gray-700">X</span>
                </button>

                <button
                  onClick={() => handleSocialSignup('github')}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-5 h-5 bg-gray-800 rounded"></div>
                  <span className="font-medium text-gray-700">GitHub</span>
                </button>
              </div>
            </div> */}

            {/* Divider */}
            {/* <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or create account with email</span>
              </div>
            </div> */}

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.firstName ? 'border-red-400' : 'border-gray-300'}`}
                      placeholder="Enter Name"
                      required
                    />
                  </div>
                  {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.phone ? 'border-red-400' : 'border-gray-300'}`}
                    inputMode="numeric"
                    pattern="\d{10}"
                    maxLength={10}
                    placeholder="Phone Number"
                    required
                  />
                  {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
              </div>
             
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                      placeholder="Create a password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordFocused && formData.password.length > 0 && (
                  <div className="mt-2 flex items-center gap-3 text-sm whitespace-nowrap overflow-x-auto">
                    <div className={`flex items-center gap-2 ${passwordChecks.letter ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordChecks.letter ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                      <span>At least 1 letter</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordChecks.length ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordChecks.length ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordChecks.number ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordChecks.number ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                      <span>At least 1 number</span>
                    </div>
                  </div>
                  )}
                  {/* {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>} */}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'}`}
                      placeholder="Confirm password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>


              {/* Terms and Newsletter */}
              <div className="space-y-3">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="mt-1 text-primary-600 focus:ring-primary-500"
                    required
                  />
                  <span className="text-xs text-gray-700">
                    I agree to the{' '}
                    <Link to="/terms-of-service" className="text-primary-600 hover:text-primary-700">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy-policy" className="text-primary-600 hover:text-primary-700">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.agreeToTerms && <p className="text-red-600 text-sm mt-1">{errors.agreeToTerms}</p>}
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="subscribeNewsletter"
                    checked={formData.subscribeNewsletter}
                    onChange={handleInputChange}
                    className="mt-1 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-700">
                    Send me product updates and tips (optional)
                  </span>
                </label>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  "Creating Account..."
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage