import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../../config/brand';
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap, 
  CheckCircle,
  Send,
  Building2,
  Phone,
  Mail,
  Clock,
  ArrowRight
} from 'lucide-react';

const ContactSales: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    company: '',
    email: '',
    description: ''
  })
  const [errors, setErrors] = useState<{[k: string]: string}>({})
  const [submitted, setSubmitted] = useState(false)

  const validate = (field: string, value: string) => {
    switch (field) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required'
        if (!/^[a-zA-Z\s]{3,}$/.test(value.trim())) return 'Enter at least 3 letters'
        return ''
      case 'phone':
        if (!value.trim()) return 'Contact number is required'
        if (!/^\d{10}$/.test(value)) return 'Must be 10 digits'
        return ''
      case 'company':
        if (!value.trim()) return 'Company name is required'
        return ''
      case 'email':
        if (!value.trim()) return 'Email is required'
        if (!/^[\w.!#$%&'*+/=?^_`{|}~-]+@[\w-]+(\.[\w-]+)+$/.test(value.trim())) return 'Enter a valid email'
        return ''
      case 'description':
        if (!value.trim()) return 'Please add a short description'
        return ''
      default:
        return ''
    }
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const nextValue = name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value
    setFormData(prev => ({ ...prev, [name]: nextValue }))
    const msg = validate(name, nextValue)
    setErrors(prev => ({ ...prev, [name]: msg }))
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fields = ['fullName','phone','company','email','description']
    const nextErrors: {[k: string]: string} = {}
    fields.forEach(f => {
      const msg = validate(f, (formData as any)[f])
      if (msg) nextErrors[f] = msg
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      setSubmitted(true)
      // TODO: send to backend/email provider
      console.log('Contact sales:', formData)
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          fullName: '',
          phone: '',
          company: '',
          email: '',
          description: ''
        });
      }, 5000);
    }
  }

  const benefits = [
    {
      icon: Users,
      title: 'Dedicated Account Manager',
      description: 'Get personalized support from a dedicated account manager',
      color: 'bg-blue-500'
    },
    {
      icon: TrendingUp,
      title: 'Custom Pricing',
      description: 'Tailored pricing plans based on your business needs',
      color: 'bg-[#F0FDF4]0'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Advanced security features and compliance certifications',
      color: 'bg-green-500'
    },
    {
      icon: Zap,
      title: 'Priority Support',
      description: '24/7 priority support with faster response times',
      color: 'bg-orange-500'
    }
  ];

  const salesChannels = [
    {
      icon: Mail,
      title: 'Email Sales',
      description: 'Send us an email',
      contact: BRAND.salesEmail,
      responseTime: 'Within 2 hours',
      color: 'text-blue-600'
    },
    {
      icon: Phone,
      title: 'Phone Sales',
      description: 'Call us directly',
      contact: '+1 (555) 123-4567',
      responseTime: 'Mon-Fri, 9 AM - 6 PM EST',
      color: 'text-green-600'
    },
    {
      icon: MessageSquare,
      title: 'Schedule a Demo',
      description: 'Book a personalized demo',
      contact: 'Available online',
      responseTime: 'Flexible scheduling',
      color: 'text-[#155E4B]'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 pt-24">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-[#260559] to-blue-700 text-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#F7F3EE]/20 rounded-full mb-6">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Sales</h1>
            <p className="text-xl text-blue-100 mb-8">
              Get in touch with our sales team to discover how we can help your business grow
            </p>
          </div>
        </div>
      </section>

      <div className="container-max px-4 sm:px-6 lg:px-8 py-12">
        {/* Benefits Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why Contact Sales?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-blue-300 group"
                >
                  <div className={`w-12 h-12 ${benefit.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Send className="w-6 h-6 text-blue-600" />
                Get in Touch
              </h2>
              <p className="text-gray-600 mb-6">Tell us a bit about your needs. Our team will reach out shortly.</p>

              {submitted ? (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Request Submitted!</span>
                  </div>
                  <p className="text-sm text-green-600">
                    Thanks! We've received your request. Our sales team will contact you within 2 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full name <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="fullName"
                        value={formData.fullName}
                        onChange={onChange}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.fullName ? 'border-red-400' : 'border-gray-300'
                        }`}
                        placeholder="Enter Name"
                      />
                      {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact number <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="phone"
                        inputMode="numeric"
                        pattern="\\d{10}"
                        maxLength={10}
                        value={formData.phone}
                        onChange={onChange}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.phone ? 'border-red-400' : 'border-gray-300'
                        }`}
                        placeholder="Enter Phone Number"
                      />
                      {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company name <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="company"
                        value={formData.company}
                        onChange={onChange}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.company ? 'border-red-400' : 'border-gray-300'
                        }`}
                        placeholder="Add Your Company Name"
                      />
                      {errors.company && <p className="text-red-600 text-xs mt-1">{errors.company}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={onChange}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.email ? 'border-red-400' : 'border-gray-300'
                        }`}
                        placeholder="Enter Work Email"
                      />
                      {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      rows={5}
                      value={formData.description}
                      onChange={onChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                        errors.description ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="Tell us about your use-case, team size, and timeline."
                    />
                    {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description}</p>}
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-[#260559] text-white py-3 rounded-lg font-semibold hover:bg-[#1d0444] transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit Request
                  </button>

                  <div className="text-xs text-gray-500 mt-3 text-center">
                    By submitting, you agree to our <Link to="/terms-of-service" className="text-[#260559] hover:underline">Terms</Link> and <Link to="/privacy-policy" className="text-[#260559] hover:underline">Privacy Policy</Link>.
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar - Sales Channels & Resources */}
          <div className="space-y-6">
            {/* Sales Channels */}
            <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                Other Ways to Reach Us
              </h3>
              <div className="space-y-4">
                {salesChannels.map((channel, index) => {
                  const Icon = channel.icon;
                  return (
                    <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-[#F5F2EE] transition-colors">
                      <div className={`${channel.color} p-2 rounded-lg`}>
                        <Icon className="w-5 h-5 text-black" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{channel.title}</h4>
                        <p className="text-sm text-gray-600 mb-1">{channel.description}</p>
                        <p className="text-sm font-medium text-gray-900">{channel.contact}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{channel.responseTime}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resources */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Popular Resources
              </h3>
              <div className="space-y-3">
                <Link to="/help-support" className="flex items-center gap-3 p-3 bg-[#F7F3EE] rounded-lg hover:shadow-md transition-shadow group">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Help & Support</div>
                    <div className="text-xs text-gray-600">Get answers to common questions</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/api-documentation" className="flex items-center gap-3 p-3 bg-[#F7F3EE] rounded-lg hover:shadow-md transition-shadow group">
                  <Building2 className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Enterprise Solutions</div>
                    <div className="text-xs text-gray-600">Learn about enterprise features</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/security-overview" className="flex items-center gap-3 p-3 bg-[#F7F3EE] rounded-lg hover:shadow-md transition-shadow group">
                  <Shield className="w-5 h-5 text-[#155E4B]" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Security & Compliance</div>
                    <div className="text-xs text-gray-600">Learn about our security</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#155E4B] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactSales


