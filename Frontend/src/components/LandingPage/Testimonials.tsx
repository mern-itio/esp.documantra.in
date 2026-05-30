import { Star, Quote, Shield, Users, FileCheck } from 'lucide-react'

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Legal Director",
      company: "TechCorp Inc.",
      content: "DocuFie has revolutionized our contract management process. The AI-powered field detection saves us hours every week.",
      rating: 5,
      avatar: "SJ"
    },
    {
      name: "Michael Chen",
      role: "HR Manager",
      company: "StartupXYZ",
      content: "The legal templates are incredibly comprehensive. We've streamlined our hiring process significantly with DocuFie.",
      rating: 5,
      avatar: "MC"
    },
    {
      name: "Emily Rodriguez",
      role: "Operations Manager",
      company: "Global Solutions",
      content: "The API integration was seamless. Our developers had it up and running in less than a day. Excellent documentation!",
      rating: 5,
      avatar: "ER"
    }
  ]

  const stats = [
    {
      icon: FileCheck,
      value: "500,000+",
      label: "Documents Prepared"
    },
    {
      icon: Users,
      value: "50,000+",
      label: "Active Users"
    },
    {
      icon: Shield,
      value: "99.9%",
      label: "Uptime SLA"
    }
  ]

  const trustBadges = [
    { name: "GDPR Compliant", color: "bg-green-100 text-green-800" },
    { name: "SOC2 Type II", color: "bg-blue-100 text-blue-800" },
    { name: "ISO27001", color: "bg-[#DCFCE7] text-purple-800" },
    { name: "256-bit SSL", color: "bg-orange-100 text-orange-800" }
  ]

  return (
    <section className="section-padding bg-[#F5F2EE]">
      <div className="container-max">
        {/* Stats Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
            Trusted by Thousands of Organizations
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-[#260559]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-8 w-8 text-[#260559]" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-[#F7F3EE] rounded-xl shadow-lg p-8 card-hover">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <Quote className="h-8 w-8 text-gray-300 mb-4" />
              
              <p className="text-gray-700 leading-relaxed mb-6">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#260559]/60 rounded-full flex items-center justify-center text-white font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                  <div className="text-sm text-gray-500">{testimonial.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="bg-[#F7F3EE] rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Enterprise-Grade Security & Compliance
            </h3>
            <p className="text-gray-600">
              Your documents are protected with industry-leading security standards
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {trustBadges.map((badge, index) => (
              <div
                key={index}
                className={`px-4 py-2 rounded-full font-medium ${badge.color}`}
              >
                {badge.name}
              </div>
            ))}
          </div>
        </div>

        {/* Company Logos */}
        <div className="text-center mt-12">
          <p className="text-gray-500 mb-8">Trusted by leading companies worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {/* Placeholder for company logos */}
            <div className="w-24 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs font-medium">
              TechCorp
            </div>
            <div className="w-24 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs font-medium">
              StartupXYZ
            </div>
            <div className="w-24 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs font-medium">
              Global Inc
            </div>
            <div className="w-24 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs font-medium">
              Innovation Co
            </div>
            <div className="w-24 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs font-medium">
              Future Ltd
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials