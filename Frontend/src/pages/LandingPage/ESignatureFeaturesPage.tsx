import { Link } from 'react-router-dom';
import {
  FileCheck, Users, MousePointer, Shield, Repeat, Award,
  CheckCircle, ArrowRight, Clock, Globe, FileText,
  Smartphone, Zap, BarChart3, Bell, Settings, Eye,
  Star,
  Code
} from 'lucide-react';

const ESignatureFeaturesPage = () => {
  const features = [
    {
      icon: Users,
      title: "Multiple Signers",
      description: "Add unlimited signers to your documents with custom roles and permissions",
      details: [
        "Assign different roles (signer, approver, viewer)",
        "Set signing order and dependencies",
        "Group signers by organization or team",
        "Add cc recipients for notification only"
      ],
      color: "bg-blue-500"
    },
    {
      icon: MousePointer,
      title: "Drag-and-Drop Editor",
      description: "Easily place signature fields and form elements anywhere on your documents",
      details: [
        "Intuitive field placement interface",
        "Smart field alignment and positioning",
        "Field validation and formatting options",
        "Field grouping and conditional logic"
      ],
      color: "bg-purple-500"
    },
    {
      icon: Shield,
      title: "Advanced Security",
      description: "Protect your documents and signatures with enterprise-grade security",
      details: [
        "256-bit AES encryption for all documents",
        "Multi-factor authentication options",
        "IP address tracking and verification",
        "Tamper-evident seal technology"
      ],
      color: "bg-green-500"
    },
    {
      icon: FileCheck,
      title: "Comprehensive Audit Trails",
      description: "Detailed records of all document activity for compliance and verification",
      details: [
        "Timestamped activity logs",
        "Signer identity verification records",
        "Document access and view tracking",
        "Court-admissible evidence package"
      ],
      color: "bg-orange-500"
    },
    {
      icon: Repeat,
      title: "Reusable Templates",
      description: "Create templates for recurring documents to save time and ensure consistency",
      details: [
        "Save document layouts with fields",
        "Create template folders and categories",
        "Share templates with team members",
        "Version control for template updates"
      ],
      color: "bg-indigo-500"
    },
    {
      icon: Award,
      title: "Legal Compliance",
      description: "Ensure your electronic signatures meet legal requirements worldwide",
      details: [
        "ESIGN Act and UETA compliance (US)",
        "eIDAS compliance (EU)",
        "Jurisdiction-specific requirements",
        "Compliance certificates for each signature"
      ],
      color: "bg-pink-500"
    }
  ];

  const signatureTypes = [
    {
      name: "Standard Electronic Signature",
      description: "The most common type of e-signature, suitable for most business documents",
      useCases: ["Sales contracts", "Vendor agreements", "HR documents", "Customer onboarding"],
      securityLevel: "Standard",
      legalValidity: "Valid in most jurisdictions"
    },
    {
      name: "Advanced Electronic Signature",
      description: "Higher security with signer authentication and document integrity verification",
      useCases: ["Financial agreements", "Legal contracts", "Regulatory filings", "Insurance documents"],
      securityLevel: "High",
      legalValidity: "Valid in all major jurisdictions"
    },
    {
      name: "Qualified Electronic Signature",
      description: "Highest level of security with qualified certificates and strict identity verification",
      useCases: ["Government contracts", "Real estate transactions", "Medical consent forms", "High-value agreements"],
      securityLevel: "Very High",
      legalValidity: "Equivalent to handwritten signatures in EU"
    },
    {
      name: "Digital Signature",
      description: "Cryptographically secure signatures with PKI technology",
      useCases: ["Intellectual property documents", "Sensitive financial agreements", "Legal discovery documents", "Regulatory compliance"],
      securityLevel: "Very High",
      legalValidity: "Highest level of legal validity"
    }
  ];

  const workflowSteps = [
    {
      step: 1,
      title: "Prepare Document",
      description: "Upload your document or create one from a template",
      icon: FileText
    },
    {
      step: 2,
      title: "Add Recipients",
      description: "Specify who needs to sign, approve, or receive a copy",
      icon: Users
    },
    {
      step: 3,
      title: "Add Fields",
      description: "Place signature fields and other form elements",
      icon: MousePointer
    },
    {
      step: 4,
      title: "Set Options",
      description: "Configure signing order, reminders, and expiration",
      icon: Settings
    },
    {
      step: 5,
      title: "Send for Signature",
      description: "Send the document to all recipients",
      icon: ArrowRight
    },
    {
      step: 6,
      title: "Track Progress",
      description: "Monitor signing status in real-time",
      icon: Eye
    }
  ];

  const testimonials = [
    {
      quote: "DocuSigner has transformed our contract signing process. What used to take days now takes minutes, and the audit trail gives us complete peace of mind.",
      author: "Jennifer Martinez",
      position: "Legal Operations Director",
      company: "Global Financial Services"
    },
    {
      quote: "The ability to create templates and set up signing workflows has saved our HR team countless hours. The interface is intuitive and our employees love how easy it is to sign documents.",
      author: "Michael Thompson",
      position: "HR Director",
      company: "TechCorp Inc."
    },
    {
      quote: "As a real estate agency, we process hundreds of documents daily. DocuSigner's e-signature platform has cut our closing time in half and improved our client experience significantly.",
      author: "Sarah Johnson",
      position: "Managing Broker",
      company: "Premier Real Estate"
    }
  ];

  return (
    <div className="min-h-screen bg-white pt-24">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Professional <span className="gradient-text">eSignature</span> Platform
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Secure, legally binding electronic signatures with advanced workflow capabilities.
              Streamline your document signing process with enterprise-grade security and compliance.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/signup" className="btn-primary">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link to="/demo" className="btn-secondary">
                Watch Demo
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
              Powerful E-Signature Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to streamline your document signing process
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 card-hover">
                <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-6`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signature Types */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Signature Types for Every Need
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the right level of security and compliance for your documents
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {signatureTypes.map((type, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{type.name}</h3>
                <p className="text-gray-600 mb-4">{type.description}</p>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Common Use Cases:</h4>
                  <div className="flex flex-wrap gap-2">
                    {type.useCases.map((useCase, i) => (
                      <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {useCase}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Security Level:</h4>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${type.securityLevel === 'Standard' ? 'bg-blue-100 text-blue-800' :
                        type.securityLevel === 'High' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                      }`}>
                      {type.securityLevel}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Legal Validity:</h4>
                    <div className="text-sm text-gray-700">
                      {type.legalValidity}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Process */}
      <section className="py-16 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple Signing Workflow
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get your documents signed in just a few simple steps
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Connecting Line */}
              <div className="absolute top-24 left-0 right-0 h-0.5 bg-gray-200 hidden md:block"></div>

              <div className="grid md:grid-cols-6 gap-8">
                {workflowSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={index} className="relative text-center">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                        <StepIcon className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {step.step}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Advanced E-Signature Capabilities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features for complex document workflows
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Automated Reminders</h3>
              <p className="text-gray-600">
                Set up automatic reminders for signers who haven't completed their documents. Configure frequency and customize reminder messages.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Bell className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Notifications</h3>
              <p className="text-gray-600">
                Receive instant notifications when documents are viewed, signed, or completed. Stay informed at every step of the signing process.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Expiration Settings</h3>
              <p className="text-gray-600">
                Set document expiration dates to ensure timely completion. Configure automatic actions when documents expire.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <Smartphone className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Mobile Signing</h3>
              <p className="text-gray-600">
                Sign documents on any device with our responsive mobile interface. Draw signatures, type, or upload signature images.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <Globe className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Language Support</h3>
              <p className="text-gray-600">
                Provide signing experiences in the signer's preferred language with support for 25+ languages and localized interfaces.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Advanced Analytics</h3>
              <p className="text-gray-600">
                Gain insights into your document workflows with detailed analytics on completion rates, time to sign, and user engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-16 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Enterprise-Grade Security & Compliance
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Our e-signature platform meets the highest security standards and compliance requirements to ensure your documents are protected and legally binding.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">SOC 2 Type II Certified</span>
                    <p className="text-sm text-gray-600 mt-1">Rigorous third-party security verification</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">GDPR Compliant</span>
                    <p className="text-sm text-gray-600 mt-1">Full compliance with EU data protection regulations</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">HIPAA Compliant</span>
                    <p className="text-sm text-gray-600 mt-1">Secure handling of protected health information</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">21 CFR Part 11 Compliant</span>
                    <p className="text-sm text-gray-600 mt-1">Meets FDA requirements for electronic records</p>
                  </div>
                </li>
              </ul>
              <Link to="/security-overview" className="btn-primary inline-flex items-center">
                Learn More About Security
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Global Compliance</h3>
              <p className="text-gray-600 mb-6">
                DocuSigner's e-signatures are legally binding in 40+ countries worldwide, complying with major e-signature laws:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-2xl">🇺🇸</span>
                  <div>
                    <div className="font-medium text-gray-900">United States</div>
                    <div className="text-xs text-gray-500">ESIGN Act, UETA</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-2xl">🇪🇺</span>
                  <div>
                    <div className="font-medium text-gray-900">European Union</div>
                    <div className="text-xs text-gray-500">eIDAS Regulation</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-2xl">🇬🇧</span>
                  <div>
                    <div className="font-medium text-gray-900">United Kingdom</div>
                    <div className="text-xs text-gray-500">Electronic Communications Act</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-2xl">🇨🇦</span>
                  <div>
                    <div className="font-medium text-gray-900">Canada</div>
                    <div className="text-xs text-gray-500">PIPEDA, Provincial Acts</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Link to="/global-compliance" className="text-primary-600 hover:text-primary-700 font-medium">
                  View all supported countries →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Thousands of organizations trust DocuSigner for their e-signature needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg card-hover">
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

      {/* Signature Demo */}
      <section className="py-16 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                See E-Signature in Action
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Experience how easy it is to send, sign, and manage documents with DocuSigner's intuitive e-signature platform.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Intuitive Signing Experience</span>
                    <p className="text-sm text-gray-600 mt-1">Guide signers through the process with clear instructions and visual cues</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Mobile-Friendly Design</span>
                    <p className="text-sm text-gray-600 mt-1">Sign documents on any device, anywhere, anytime</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Real-Time Status Updates</span>
                    <p className="text-sm text-gray-600 mt-1">Track document status with instant notifications</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Comprehensive Audit Trail</span>
                    <p className="text-sm text-gray-600 mt-1">Every action is recorded for complete transparency</p>
                  </div>
                </li>
              </ul>
              <div className="flex gap-4">
                <Link to="/demo" className="btn-primary inline-flex items-center">
                  Watch Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link to="/signup" className="btn-secondary">
                  Try It Free
                </Link>
              </div>
            </div>

            {/* Signature Interface Demo */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                    <FileCheck className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900">Document Signing</span>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                  Ready to Sign
                </span>
              </div>

              {/* Document Preview */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-5 w-5 text-primary-600" />
                  <span className="font-medium text-gray-900">Employment Contract.pdf</span>
                </div>

                {/* Signature Fields */}
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-primary-300 rounded-lg p-4 bg-primary-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-primary-700">Signature Required</span>
                      <span className="text-xs text-primary-600">Page 1</span>
                    </div>
                    <div className="mt-2 text-xs text-primary-600">Click to sign</div>
                  </div>

                  <div className="border-2 border-dashed border-orange-300 rounded-lg p-4 bg-orange-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-orange-700">Date Field</span>
                      <span className="text-xs text-orange-600">Page 2</span>
                    </div>
                    <div className="mt-2 text-xs text-orange-600">Auto-filled: {new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Signers List */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Signing Order</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">John Doe (Employee)</div>
                      <div className="text-xs text-green-600">✓ Signed</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">HR Manager</div>
                      <div className="text-xs text-blue-600">⏳ Pending</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors">
                Continue Signing Process
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Seamless Integrations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect DocuSigner with your favorite tools and platforms
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-xl">G</span>
              </div>
              <h3 className="font-semibold text-gray-900">Google Workspace</h3>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-xl">M</span>
              </div>
              <h3 className="font-semibold text-gray-900">Microsoft 365</h3>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-xl">S</span>
              </div>
              <h3 className="font-semibold text-gray-900">Salesforce</h3>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-xl">D</span>
              </div>
              <h3 className="font-semibold text-gray-900">Dropbox</h3>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-xl">Z</span>
              </div>
              <h3 className="font-semibold text-gray-900">Zapier</h3>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-xl">+</span>
              </div>
              <h3 className="font-semibold text-gray-900">Many More</h3>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link to="/integrations" className="text-primary-600 hover:text-primary-700 font-medium">
              View all integrations →
            </Link>
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="py-16 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Developer-Friendly API
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Integrate e-signature capabilities directly into your applications with our comprehensive API. Build custom document workflows that fit your exact needs.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">RESTful API with comprehensive documentation</span>
                    <p className="text-sm text-gray-600 mt-1">Clear, well-documented endpoints for all e-signature features</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Webhook support for real-time events</span>
                    <p className="text-sm text-gray-600 mt-1">Get notified instantly when documents are viewed, signed, or completed</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">SDKs for popular languages</span>
                    <p className="text-sm text-gray-600 mt-1">JavaScript, Python, Ruby, PHP, and more</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Free tier with 10 API calls per month</span>
                    <p className="text-sm text-gray-600 mt-1">Start integrating without upfront costs</p>
                  </div>
                </li>
              </ul>
              <Link to="/api-documentation" className="btn-primary inline-flex items-center">
                Explore API Documentation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 text-white font-mono text-sm">
              <div className="flex items-center justify-between pb-4 border-b border-gray-700 mb-4">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-400" />
                  <span>API Example</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
              </div>
              <pre className="text-green-300">
                <code>{`// Create and send a document for signature
const docusigner = require('docusigner');
const client = new docusigner.Client({ apiKey: 'YOUR_API_KEY' });

async function sendDocument() {
  const envelope = await client.envelopes.create({
    documents: [{
      name: "Contract.pdf",
      content: base64Content
    }],
    recipients: [{
      email: "signer@example.com",
      name: "John Doe",
      role: "signer"
    }],
    fields: [{
      type: "signature",
      page: 1,
      x: 100,
      y: 200
    }]
  });
  
  console.log("Envelope sent:", envelope.id);
}

sendDocument();`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your needs. Start free, upgrade anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600 ml-2">forever</span>
              </div>
              <p className="text-gray-600 mb-6">Perfect for individuals and small teams</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">10 envelopes per month</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Basic templates</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Email support</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Mobile app access</span>
                </li>
              </ul>
              <Link to="/signup" className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-all duration-200 block text-center">
                Start Free
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border-2 border-primary-500 p-8 transform scale-105 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Most Popular
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">$10</span>
                <span className="text-gray-600 ml-2">per month</span>
              </div>
              <p className="text-gray-600 mb-6">Great for growing businesses</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">50 envelopes per month</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Advanced templates</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Custom branding</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Bulk sending</span>
                </li>
              </ul>
              <Link to="/signup" className="w-full py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all duration-200 block text-center shadow-lg hover:shadow-xl">
                Start 14-day Trial
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Business</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">$30</span>
                <span className="text-gray-600 ml-2">per month</span>
              </div>
              <p className="text-gray-600 mb-6">For teams and organizations</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">150 envelopes per month</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">All templates</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Advanced team features</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">API access</span>
                </li>
              </ul>
              <Link to="/signup" className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-all duration-200 block text-center">
                Start 14-day Trial
              </Link>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link to="/pricing" className="text-primary-600 hover:text-primary-700 font-medium">
              View full pricing details →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Streamline Your Document Signing?
            </h2>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Join thousands of organizations who trust DocuSigner for secure, legally binding electronic signatures.
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

export default ESignatureFeaturesPage;