import { Link } from 'react-router-dom';
import { 
  Layers, Shield, Zap, Globe, Code, Award, Heart, 
  CheckCircle, ArrowRight, FileText, DollarSign, 
  Clock,  Lock
} from 'lucide-react';

const WhyDocuSignerPage = () => {
  const keyFeatures = [
    {
      icon: Layers,
      title: "All-in-One Platform",
      description: "Complete document lifecycle management in a single platform. Create, edit, sign, and manage documents without switching between multiple tools.",
      benefits: [
        "Eliminate multiple software subscriptions",
        "Streamline your document workflow",
        "Reduce training and onboarding time",
        "Centralize document management"
      ]
    },
    {
      icon: Zap,
      title: "AI-Powered Features",
      description: "Advanced artificial intelligence that streamlines document creation, automates field detection, and enhances document processing.",
      benefits: [
        "Generate legal documents from simple prompts",
        "Auto-detect signature fields and form elements",
        "Extract and analyze document data",
        "Reduce manual data entry by up to 90%"
      ]
    },
    {
      icon: Globe,
      title: "Global Compliance",
      description: "Legally binding in 40+ countries with comprehensive compliance with international e-signature laws and regulations.",
      benefits: [
        "ESIGN Act, UETA, and eIDAS compliant",
        "Court-admissible audit trails",
        "Jurisdiction-specific compliance features",
        "Regular compliance updates as laws change"
      ]
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with advanced encryption, compliance certifications, and comprehensive data protection.",
      benefits: [
        "256-bit AES encryption for all data",
        "SOC 2 Type II certified",
        "GDPR and CCPA compliant",
        "Regular security audits and penetration testing"
      ]
    }
  ];

  const competitiveAdvantages = [
    {
      title: "Free Forever Plan",
      description: "Unlike competitors who only offer limited trials, DocuSigner provides a genuinely useful free plan with 10 envelopes per month, full access to PDF tools, and legal templates.",
      icon: Heart
    },
    {
      title: "Integrated PDF Tools",
      description: "30+ professional PDF tools included at no extra cost, eliminating the need for separate PDF software subscriptions.",
      icon: FileText
    },
    {
      title: "Legal Template Library",
      description: "45+ professionally drafted legal templates that save thousands in potential legal fees and consultation costs.",
      icon: Award
    },
    {
      title: "Superior Value",
      description: "50-70% cost savings compared to competitors, with more features at every price point.",
      icon: DollarSign
    },
    {
      title: "Developer-Friendly API",
      description: "Comprehensive API with free tier access, generous limits, and straightforward integration.",
      icon: Code
    },
    {
      title: "Faster Implementation",
      description: "Intuitive interface and streamlined onboarding gets teams up and running in minutes instead of days.",
      icon: Clock
    }
  ];

  const testimonials = [
    {
      quote: "We switched from DocuSign to DocuSigner and saved over 60% on our annual costs while gaining access to powerful PDF tools we were paying for separately.",
      author: "Sarah Johnson",
      position: "Operations Director",
      company: "TechCorp Inc."
    },
    {
      quote: "The legal templates alone make DocuSigner worth it. The platform is intuitive, and the pricing is much more reasonable than what we were paying with our previous provider.",
      author: "Michael Chen",
      position: "Legal Counsel",
      company: "Horizon Financial"
    },
    {
      quote: "The free PDF tools and AI-powered features have streamlined our entire document workflow. DocuSigner has become an essential part of our business operations.",
      author: "Emily Rodriguez",
      position: "HR Manager",
      company: "Global Solutions"
    }
  ];

  const stats = [
    { value: "500,000+", label: "Documents Processed" },
    { value: "50,000+", label: "Active Users" },
    { value: "40+", label: "Countries Supported" },
    { value: "99.9%", label: "Uptime SLA" }
  ];

  return (
    <div className="min-h-screen bg-white pt-24">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose <span className="gradient-text">DocuSigner</span>?
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              DocuSigner is more than just e-signatures. It's a complete document ecosystem designed to streamline your workflow, reduce costs, and enhance productivity.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/signup" className="btn-primary">
                Start Free Forever <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link to="/pricing" className="btn-secondary">
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Key Features That Set Us Apart
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              DocuSigner combines powerful features with intuitive design to deliver an unmatched document management experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {keyFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 card-hover">
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center mb-6 bg-primary-100`}>
                  <feature.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <div className="space-y-3">
                  {feature.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-primary-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Advantages */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why DocuSigner Outperforms Competitors
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how DocuSigner offers more value and better features than other document management platforms.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {competitiveAdvantages.map((advantage, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md border border-gray-100 card-hover">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <advantage.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{advantage.title}</h3>
                </div>
                <p className="text-gray-600">{advantage.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/docusigner-vs-docusign" className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700">
              See detailed comparisons with competitors
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Thousands of businesses trust DocuSigner for their document needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8 card-hover">
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 italic mb-6">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-600">{testimonial.position}, {testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Perfect for Every Industry
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              DocuSigner adapts to your specific needs, no matter your industry or use case.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 card-hover">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Legal Firms</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Client agreements and contracts</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Court filings and legal documents</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Legal template customization</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 card-hover">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Real Estate</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Lease agreements and contracts</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Property disclosures and forms</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Multi-party transaction management</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 card-hover">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Healthcare</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">HIPAA-compliant patient forms</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Consent and authorization documents</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Secure medical record management</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 card-hover">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Financial Services</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Loan applications and agreements</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Financial disclosures and forms</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Secure client onboarding</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 card-hover">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Human Resources</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Employee onboarding documents</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Policy acknowledgments</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Performance reviews and contracts</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 card-hover">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Technology</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">NDAs and IP agreements</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Service level agreements</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">API integration for document workflows</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-16 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Enterprise-Grade Security & Compliance
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your documents and data are protected with the highest security standards.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <Lock className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Security Features</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">256-bit AES Encryption</span>
                    <p className="text-sm text-gray-600 mt-1">All data encrypted in transit and at rest</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Multi-Factor Authentication</span>
                    <p className="text-sm text-gray-600 mt-1">Additional security layer for account access</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Tamper-Evident Seals</span>
                    <p className="text-sm text-gray-600 mt-1">Detect any document alterations after signing</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">SOC 2 Type II Certified</span>
                    <p className="text-sm text-gray-600 mt-1">Rigorous third-party security verification</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <Globe className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Compliance Certifications</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">GDPR Compliance</span>
                    <p className="text-sm text-gray-600 mt-1">Full compliance with EU data protection regulations</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">HIPAA Compliance</span>
                    <p className="text-sm text-gray-600 mt-1">Secure handling of protected health information</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">ISO 27001 Certified</span>
                    <p className="text-sm text-gray-600 mt-1">International standard for information security</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">CCPA Compliance</span>
                    <p className="text-sm text-gray-600 mt-1">California Consumer Privacy Act adherence</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link to="/security-overview" className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700">
              Learn more about our security measures
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Document Workflow?
            </h2>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Join thousands of organizations who trust DocuSigner for their document management, 
              e-signature, and legal template needs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/signup" className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-lg">
                Start Free Forever <ArrowRight className="ml-2 h-5 w-5 inline" />
              </Link>
              <Link to="/contact" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-4 px-8 rounded-lg transition-all duration-200 text-lg">
                Schedule Demo
              </Link>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span className="text-primary-100">No credit card required</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span className="text-primary-100">Free forever plan</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span className="text-primary-100">Setup in 2 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WhyDocuSignerPage;