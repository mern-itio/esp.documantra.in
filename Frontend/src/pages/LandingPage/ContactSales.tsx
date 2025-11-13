import React, { useState } from 'react'
import { Link } from 'react-router-dom'

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
    }
  }

  return (
    <div className="min-h-screen m-8 bg-gradient-to-br from-primary-50 via-white to-blue-50 pt-24">
      <div className="container-max px-4">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8">
          <div className="hidden lg:block rounded-2xl overflow-hidden shadow-xl">
            <img src="/contact-sale.png" alt="Contact Sales" className="w-full h-full object-cover" />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Contact Sales</h1>
            <p className="text-gray-600 mb-6">Tell us a bit about your needs. Our team will reach out shortly.</p>

            {submitted ? (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
                Thanks! We’ve received your request. Our sales team will contact you soon.
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full name</label>
                    <input
                      name="fullName"
                      value={formData.fullName}
                      onChange={onChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.fullName ? 'border-red-400' : 'border-gray-300'}`}
                      placeholder="Enter Name"
                    />
                    {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact number</label>
                    <input
                      name="phone"
                      inputMode="numeric"
                      pattern="\\d{10}"
                      maxLength={10}
                      value={formData.phone}
                      onChange={onChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.phone ? 'border-red-400' : 'border-gray-300'}`}
                      placeholder="Enter Phone Number"
                    />
                    {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company name</label>
                    <input
                      name="company"
                      value={formData.company}
                      onChange={onChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.company ? 'border-red-400' : 'border-gray-300'}`}
                      placeholder="Add Your Company Name"
                    />
                    {errors.company && <p className="text-red-600 text-xs mt-1">{errors.company}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={onChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                      placeholder="Enter Work Email"
                    />
                    {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={5}
                    value={formData.description}
                    onChange={onChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.description ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="Tell us about your use-case, team size, and timeline."
                  />
                  {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description}</p>}
                </div>

                <button type="submit" className="bg-[#260559] text-white rounded-md w-full md:w-auto px-6 py-3">Submit</button>

                <div className="text-xs text-gray-500 mt-3">
                  By submitting, you agree to our <Link to="/terms" className="text-[#260559]">Terms</Link> and <Link to="/privacy" className="text-[#260559]">Privacy Policy</Link>.
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactSales


