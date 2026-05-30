import { useState, useEffect } from 'react'
import { Globe, Shield, Search, ChevronDown, Check, Award, MapPin, FileText, Edit, Send, Archive, Zap, CheckCircle, AlertCircle, Scale, FileCheck, UserCheck, ShieldCheck, Database, Copy, ChevronRight } from 'lucide-react'

const Compliance = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCountry, setExpandedCountry] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [userCountry, setUserCountry] = useState('') // This would be detected via IP
  const [activeStep, setActiveStep] = useState(0)

  // Simulate IP-based country detection
  useEffect(() => {
    // In a real app, this would be an API call to detect user's country by IP
    // For demo purposes, we'll simulate this
    const detectUserCountry = async () => {
      try {
        // Simulated IP detection - in reality you'd use a service like ipapi.co
        const response = await fetch('https://ipapi.co/json/')
        const data = await response.json()
        setUserCountry(data.country_name)
        
        // For demo, we'll randomly assign a country
        // const demoCountries = ['United States', 'United Kingdom', 'Canada', 'Australia', 'India']
        // const randomCountry = demoCountries[Math.floor(Math.random() * demoCountries.length)]
        // setUserCountry(randomCountry)
      } catch (error) {
        console.log('Could not detect user country')
      }
    }

    detectUserCountry()
  }, [])

  // Auto-advance through steps
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % documentLifecycle.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const countries = [
    {
      name: 'United States',
      flag: '🇺🇸',
      laws: ['ESIGN Act', 'UETA'],
      status: 'Fully Compliant',
      statusColor: 'text-green-600',
      description: 'The U.S. has comprehensive federal and state laws supporting electronic signatures.',
      lastUpdated: '2024-01-15',
      legalValidity: 'Legally Binding',
      courtAcceptance: 'Widely Accepted',
      keyRequirements: [
        'Intent to sign must be demonstrated',
        'Records must be retained',
        'Consent to electronic transactions',
        'Audit trail required'
      ]
    },
    {
      name: 'European Union',
      flag: '🇪🇺',
      laws: ['eIDAS Regulation'],
      status: 'Qualified Signatures',
      statusColor: 'text-blue-600',
      description: 'The eIDAS regulation provides a comprehensive framework for electronic signatures across all EU member states.',
      lastUpdated: '2024-01-10',
      legalValidity: 'Legally Binding',
      courtAcceptance: 'Widely Accepted',
      keyRequirements: [
        'Three levels of electronic signatures',
        'Cross-border recognition',
        'Qualified signatures for high-value transactions',
        'Strong authentication required'
      ]
    },
    {
      name: 'India',
      flag: '🇮🇳',
      laws: ['IT Act 2000', 'Digital India Act'],
      status: 'Digital Signatures',
      statusColor: 'text-[#155E4B]',
      description: 'Electronic signatures are legally recognized under the Information Technology Act.',
      lastUpdated: '2024-01-12',
      legalValidity: 'Legally Binding',
      courtAcceptance: 'Widely Accepted',
      keyRequirements: [
        'Digital signature certificates required',
        'Certified authority validation',
        'Non-repudiation support',
        'Secure key management'
      ]
    },
    {
      name: 'United Kingdom',
      flag: '🇬🇧',
      laws: ['Electronic Communications Act 2000'],
      status: 'Fully Compliant',
      statusColor: 'text-green-600',
      description: 'The UK maintains strong electronic signature laws post-Brexit, largely aligned with EU standards.',
      lastUpdated: '2024-01-12',
      legalValidity: 'Legally Binding',
      courtAcceptance: 'Widely Accepted',
      keyRequirements: [
        'Electronic signatures admissible in court',
        'Reliable method of identification',
        'Intent to authenticate required',
        'Proper record keeping'
      ]
    },
    {
      name: 'Canada',
      flag: '🇨🇦',
      laws: ['Electronic Transactions Acts (Provincial)'],
      status: 'Provincial Compliance',
      statusColor: 'text-blue-600',
      description: 'Each Canadian province has its own Electronic Transactions Act, providing comprehensive coverage.',
      lastUpdated: '2024-01-08',
      legalValidity: 'Legally Binding',
      courtAcceptance: 'Widely Accepted',
      keyRequirements: [
        'Consent to electronic format',
        'Integrity of information maintained',
        'Reliable signature method',
        'Accessibility requirements'
      ]
    },
    {
      name: 'Australia',
      flag: '🇦🇺',
      laws: ['Electronic Transactions Act 1999'],
      status: 'Commonwealth Approved',
      statusColor: 'text-green-600',
      description: 'Australia has well-established electronic signature laws with broad acceptance.',
      lastUpdated: '2024-01-05',
      legalValidity: 'Legally Binding',
      courtAcceptance: 'Widely Accepted',
      keyRequirements: [
        'Method identifies person and indicates intention',
        'Consent to electronic transactions',
        'Method is reliable and appropriate',
        'Record retention requirements'
      ]
    },
    {
      name: 'United Arab Emirates',
      flag: '🇦🇪',
      laws: ['Electronic Transactions Law'],
      status: 'Legally Binding',
      statusColor: 'text-orange-600',
      description: 'UAE has comprehensive electronic signature legislation supporting digital transformation.',
      lastUpdated: '2024-01-10',
      legalValidity: 'Legally Binding',
      courtAcceptance: 'Government Recognized',
      keyRequirements: [
        'Digital certificate authentication',
        'Secure signature creation',
        'Identity verification required',
        'Audit trail maintenance'
      ]
    },
    {
      name: 'Singapore',
      flag: '🇸🇬',
      laws: ['Electronic Transactions Act'],
      status: 'Fully Compliant',
      statusColor: 'text-green-600',
      description: 'Singapore has robust electronic signature laws supporting its digital economy.',
      lastUpdated: '2024-01-08',
      legalValidity: 'Legally Binding',
      courtAcceptance: 'Widely Accepted',
      keyRequirements: [
        'Secure signature creation device',
        'Certificate-based authentication',
        'Non-repudiation capabilities',
        'Regulatory compliance'
      ]
    }
  ]

  const certifications = [
    {
      name: 'PCI DSS',
      fullName: 'PCI DSS certification',
      description: 'Payment Card Industry Data Security Standard',
      status: 'Certified',
      icon: () => (
        <div className="w-16 h-16 bg-[#F7F3EE] rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-800">PCI</div>
            <div className="text-xs text-blue-600">DSS</div>
          </div>
        </div>
      ),
      color: 'bg-[#260559]/5 text-[#260559]'
    },
    {
      name: '21 CFR Part 11',
      fullName: '21 CFR Part 11',
      description: 'Guarantees full compliance with 21 CFR Part 11',
      status: 'Compliant',
      icon: () => (
        <div className="w-16 h-16 bg-[#F7F3EE] rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-sm font-bold text-gray-800">FDA</div>
            <div className="text-xs text-gray-600">21 CFR</div>
          </div>
        </div>
      ),
      color: 'bg-gray-100 text-gray-800'
    },
    {
      name: 'GDPR',
      fullName: 'GDPR compliance',
      description: 'General Data Protection Regulation',
      status: 'Compliant',
      icon: () => (
        <div className="w-16 h-16 bg-[#F7F3EE] rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-xs font-bold text-blue-800">GDPR</div>
            <div className="text-lg">🇪🇺</div>
          </div>
        </div>
      ),
      color: 'bg-blue-100 text-blue-800'
    },
    {
      name: 'HIPAA',
      fullName: 'HIPAA compliance',
      description: 'Health Insurance Portability and Accountability Act',
      status: 'Compliant',
      icon: () => (
        <div className="w-16 h-16 bg-[#F7F3EE] rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-xs font-bold text-red-800">HIPAA</div>
            <div className="text-lg">⚕️</div>
          </div>
        </div>
      ),
      color: 'bg-red-100 text-red-800'
    },
    {
      name: 'SOC 2 Type II',
      fullName: 'SOC 2 Type II Certified',
      description: 'System and Organization Controls (Type II)',
      status: 'Certified',
      icon: () => (
        <div className="w-16 h-16 bg-[#F7F3EE] rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-xs font-bold text-purple-800">AICPA</div>
            <div className="text-xs font-bold text-purple-800">SOC 2</div>
          </div>
        </div>
      ),
      color: 'bg-[#DCFCE7] text-purple-800'
    },
    {
      name: 'ISO 27001',
      fullName: 'ISO 27001 Certified',
      description: 'ISO 27001 Certified',
      status: 'Certified',
      icon: () => (
        <div className="w-16 h-16 bg-[#F7F3EE] rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-xs font-bold text-blue-800">ISO</div>
            <div className="text-xs font-bold text-blue-800">27001</div>
          </div>
        </div>
      ),
      color: 'bg-blue-100 text-blue-800'
    }
  ]

  const countryTabs = [
    { id: 'all', name: 'All Countries', flag: '🌍' },
    { id: 'us', name: 'United States', flag: '🇺🇸' },
    { id: 'ca', name: 'Canada', flag: '🇨🇦' },
    { id: 'uk', name: 'United Kingdom', flag: '🇬🇧' },
    { id: 'eu', name: 'European Union', flag: '🇪🇺' },
    { id: 'au', name: 'Australia', flag: '🇦🇺' }
  ]

  // Sort countries to show user's country first
  const sortedCountries = [...countries].sort((a, b) => {
    if (a.name === userCountry) return -1
    if (b.name === userCountry) return 1
    return 0
  })

  const filteredCountries = sortedCountries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.laws.some(law => law.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Document Lifecycle with {BRAND.name}
  const documentLifecycle = [
    {
      step: 1,
      title: "Document Drafting & Creation",
      description: "Create or upload documents using AI-powered templates and smart editing tools",
      icon: FileText,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      docusignerFeatures: [
        "AI-powered document generation",
        "20+ legal templates library",
        "Smart field detection",
        "Multi-format support (PDF, Word, etc.)"
      ],
      legalRequirements: [
        "Ensure document completeness",
        "Include all necessary terms",
        "Verify legal language accuracy",
        "Check jurisdiction compliance"
      ]
    },
    {
      step: 2,
      title: "Document Review & Editing",
      description: "Collaborate with team members to review, edit, and finalize document content",
      icon: Edit,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-[#F0FDF4]",
      textColor: "text-[#155E4B]",
      docusignerFeatures: [
        "Real-time collaborative editing",
        "Version control & history",
        "Comment and annotation tools",
        "Track changes functionality"
      ],
      legalRequirements: [
        "Maintain version control",
        "Document all changes",
        "Ensure reviewer authorization",
        "Preserve edit history"
      ]
    },
    {
      step: 3,
      title: "Signature Field Preparation",
      description: "Add signature fields, assign signers, and configure signing workflow",
      icon: UserCheck,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      docusignerFeatures: [
        "Drag-and-drop field placement",
        "Multi-signer workflow setup",
        "Custom signing order",
        "Field validation rules"
      ],
      legalRequirements: [
        "Verify signer identity",
        "Obtain consent for e-signatures",
        "Set appropriate signature methods",
        "Configure authentication levels"
      ]
    },
    {
      step: 4,
      title: "Document Distribution & Signing",
      description: "Send documents to signers with secure delivery and real-time tracking",
      icon: Send,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
      docusignerFeatures: [
        "Secure email delivery",
        "Real-time signing status",
        "Automated reminders",
        "Mobile-friendly signing"
      ],
      legalRequirements: [
        "Secure transmission methods",
        "Signer authentication",
        "Intent to sign verification",
        "Delivery confirmation"
      ]
    },
    {
      step: 5,
      title: "Signature Verification & Security",
      description: "Verify signatures using advanced security measures and fraud detection",
      icon: ShieldCheck,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      docusignerFeatures: [
        "Digital signature certificates",
        "Biometric signature capture",
        "IP address logging",
        "Device fingerprinting"
      ],
      legalRequirements: [
        "Strong authentication methods",
        "Non-repudiation measures",
        "Fraud prevention",
        "Signature integrity verification"
      ]
    },
    {
      step: 6,
      title: "Audit Trail Generation",
      description: "Create comprehensive audit trails documenting the entire signing process",
      icon: FileCheck,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      docusignerFeatures: [
        "Detailed activity logs",
        "Timestamped events",
        "Signer behavior tracking",
        "Legal certificate generation"
      ],
      legalRequirements: [
        "Complete activity documentation",
        "Tamper-evident records",
        "Chronological event logging",
        "Legal admissibility standards"
      ]
    },
    {
      step: 7,
      title: "Secure Document Storage",
      description: "Store signed documents with enterprise-grade security and encryption",
      icon: Database,
      color: "from-teal-500 to-teal-600",
      bgColor: "bg-teal-50",
      textColor: "text-teal-700",
      docusignerFeatures: [
        "256-bit encryption at rest",
        "Redundant cloud storage",
        "Access control management",
        "Backup and recovery"
      ],
      legalRequirements: [
        "Secure storage standards",
        "Data protection compliance",
        "Access logging",
        "Retention policy enforcement"
      ]
    },
    {
      step: 8,
      title: "Document Distribution & Copies",
      description: "Automatically distribute final signed copies to all parties involved",
      icon: Copy,
      color: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-50",
      textColor: "text-pink-700",
      docusignerFeatures: [
        "Automatic copy distribution",
        "Custom delivery options",
        "Download notifications",
        "Bulk distribution tools"
      ],
      legalRequirements: [
        "Provide copies to all parties",
        "Maintain original integrity",
        "Delivery confirmation",
        "Equal access to documents"
      ]
    },
    {
      step: 9,
      title: "Long-term Record Retention",
      description: "Maintain documents according to legal retention requirements and regulations",
      icon: Archive,
      color: "from-gray-500 to-gray-600",
      bgColor: "bg-[#F5F2EE]",
      textColor: "text-gray-700",
      docusignerFeatures: [
        "Automated retention policies",
        "Legal hold capabilities",
        "Compliance monitoring",
        "Secure disposal processes"
      ],
      legalRequirements: [
        "Meet retention periods",
        "Maintain document integrity",
        "Compliance with regulations",
        "Secure disposal when required"
      ]
    }
  ]

  // const handleCountrySearch = (e: React.FormEvent) => {
  //   e.preventDefault()
  //   if (searchTerm.trim()) {
  //     // This would redirect to a country-specific compliance page
  //     console.log(`Redirecting to compliance page for: ${searchTerm}`)
  //     // In a real app: window.location.href = `/compliance/${searchTerm.toLowerCase()}`
  //   }
  // }

  return (
    <section id="compliance" className="section-padding bg-gradient-to-br from-blue-50 to-emerald-100">
      <div className="container-max">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Legally Binding in <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">40+ Countries</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {BRAND.name} ensures your electronic signatures are legally binding and compliant with regulations worldwide. Stay informed about e-signature laws in your jurisdiction.
          </p>

          {/* User Location Banner */}
          {userCountry && (
            <div className="bg-[#260559]/10 border border-[#260559]/20 rounded-lg p-4 max-w-md mx-auto mb-8">
              <div className="flex items-center justify-center gap-2 text-[#260559]/80">
                <MapPin className="h-5 w-5" />
                <span className="font-medium">
                  Based on your location: {userCountry}
                </span>
              </div>
              <p className="text-sm text-[#260559]/80 mt-1">
                Your country's compliance information is highlighted below
              </p>
            </div>
          )}

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 bg-[#F7F3EE] px-4 py-2 rounded-full shadow-sm">
              <Globe className="h-5 w-5 text-[#260559]" />
              <span className="text-sm font-medium text-gray-700">15+ Countries Covered</span>
            </div>
            <div className="flex items-center gap-2 bg-[#F7F3EE] px-4 py-2 rounded-full shadow-sm">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Legally Binding</span>
            </div>
            <div className="flex items-center gap-2 bg-[#F7F3EE] px-4 py-2 rounded-full shadow-sm">
              <Award className="h-5 w-5 text-[#155E4B]" />
              <span className="text-sm font-medium text-gray-700">Court Accepted</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search countries or laws..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-[#F7F3EE]"
            />
          </div>
        </div>

        {/* Enhanced Best Practices Section - Document Lifecycle */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Best Practices for <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">Legal Compliance</span>
            </h3>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
              Follow the complete document lifecycle with {BRAND.name} - from drafting to long-term retention. 
              Our platform ensures legal compliance at every step while streamlining your workflow.
            </p>
            
            {/* Lifecycle Overview */}
            <div className="bg-[#F7F3EE] rounded-2xl shadow-lg p-8 mb-12">
              <h4 className="text-2xl font-bold text-gray-900 mb-6">Complete Document Lifecycle with {BRAND.name}</h4>
              
              {/* Progress Indicator */}
              <div className="flex justify-center mb-8">
                <div className="flex items-center space-x-2">
                  {documentLifecycle.map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === activeStep ? 'bg-[#260559]/90 w-8' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Active Step Display */}
              <div className="max-w-4xl mx-auto">
                <div className={`${documentLifecycle[activeStep].bgColor} rounded-2xl p-8 transition-all duration-500`}>
                  <div className="flex items-center justify-center mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-r ${documentLifecycle[activeStep].color} rounded-full flex items-center justify-center text-white shadow-lg`}>
                      {(() => {
                        const CurrentIcon = documentLifecycle[activeStep].icon;
                        return <CurrentIcon className="h-8 w-8" />;
                      })()}
                    </div>
                  </div>
                  
                  <div className="text-center mb-8">
                    <div className="text-sm font-medium text-gray-500 mb-2">
                      Step {documentLifecycle[activeStep].step} of {documentLifecycle.length}
                    </div>
                    <h5 className="text-2xl font-bold text-gray-900 mb-4">
                      {documentLifecycle[activeStep].title}
                    </h5>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      {documentLifecycle[activeStep].description}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* {BRAND.name} Features */}
                    <div className="bg-[#F7F3EE] rounded-xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                          <Zap className="h-5 w-5 text-white" />
                        </div>
                        <h6 className="font-semibold text-gray-900">{BRAND.name} Features</h6>
                      </div>
                      <ul className="space-y-3">
                        {documentLifecycle[activeStep].docusignerFeatures.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Legal Requirements */}
                    <div className="bg-[#F7F3EE] rounded-xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                          <Scale className="h-5 w-5 text-white" />
                        </div>
                        <h6 className="font-semibold text-gray-900">Legal Requirements</h6>
                      </div>
                      <ul className="space-y-3">
                        {documentLifecycle[activeStep].legalRequirements.map((requirement, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step Navigation */}
              <div className="flex justify-center mt-8 gap-4">
                <button
                  onClick={() => setActiveStep((prev) => (prev - 1 + documentLifecycle.length) % documentLifecycle.length)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  Previous
                </button>
                <button
                  onClick={() => setActiveStep((prev) => (prev + 1) % documentLifecycle.length)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#260559]/90 hover:bg-[#260559]/80 text-white rounded-lg transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Lifecycle Grid Overview */}
            <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-6 mb-12">
              {documentLifecycle.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <div
                    key={index}
                    onClick={() => setActiveStep(index)}
                    className={`cursor-pointer transition-all duration-300 ${step.bgColor} rounded-xl p-6 hover:shadow-lg ${
                      index === activeStep ? 'ring-2 ring-primary-500 shadow-lg' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-lg flex items-center justify-center text-white shadow-sm`}>
                        <StepIcon className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-500">Step {step.step}</div>
                        <h6 className="font-semibold text-gray-900 text-sm">{step.title}</h6>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Key Benefits */}
           <div className="p-8 mb-12 text-white rounded-sm bg-gradient-to-r from-[#260559] via-[#4b0ea0] to-[#7b2fff]">
              <h4 className="text-2xl font-bold text-center mb-8">
                Why Choose {BRAND.name} for Legal Compliance?
              </h4>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#F7F3EE]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <h5 className="font-semibold mb-2">End-to-End Compliance</h5>
                  <p className="text-primary-100 text-sm">Complete legal compliance from document creation to long-term retention</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#F7F3EE]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <h5 className="font-semibold mb-2">Automated Workflows</h5>
                  <p className="text-primary-100 text-sm">Streamlined processes that ensure no compliance step is missed</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#F7F3EE]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <h5 className="font-semibold mb-2">Global Standards</h5>
                  <p className="text-primary-100 text-sm">Compliant with international regulations and local laws</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Country Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {countryTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[#260559]/90 text-white shadow-lg'
                  : 'bg-[#F7F3EE] text-gray-700 hover:bg-[#F5F2EE]'
              }`}
            >
              <span>{tab.flag}</span>
              <span className="text-sm">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Enhanced Certifications Section */}
        <div className="bg-[#F7F3EE] rounded-2xl shadow-lg p-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Enterprise-Grade Security & Compliance
          </h3>
          <p className="text-gray-600 text-center mb-8 max-w-3xl mx-auto">
            Your documents are protected with industry-leading security standards and compliance certifications. 
            We maintain the highest levels of data protection and regulatory compliance.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert, index) => (
              <div key={index} className="text-center p-6 bg-[#F5F2EE] rounded-xl hover:shadow-lg transition-all duration-200">
                <div className="flex justify-center mb-4">
                  <cert.icon />
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${cert.color}`}>
                  {cert.name}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{cert.fullName}</h4>
                <div className="text-xs text-gray-600 mb-2">{cert.status}</div>
                <p className="text-gray-600 text-sm">{cert.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Countries Grid */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            E-Signature Laws by Country
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredCountries.length} countries shown)
            </span>
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCountries.map((country, index) => (
              <div
                key={index}
                className={`bg-[#F7F3EE] rounded-lg shadow-lg overflow-hidden card-hover ${
                  country.name === userCountry ? 'ring-2 ring-primary-500 ring-opacity-50' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{country.flag}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          {country.name}
                          {country.name === userCountry && (
                            <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full font-medium">
                              Your Location
                            </span>
                          )}
                        </h3>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      Updated {country.lastUpdated}
                    </span>
                  </div>
                  
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                    country.status === 'Fully Compliant' ? 'bg-green-100 text-green-800' :
                    country.status === 'Qualified Signatures' ? 'bg-blue-100 text-blue-800' :
                    country.status === 'Digital Signatures' ? 'bg-[#DCFCE7] text-purple-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {country.status}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{country.description}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm mb-2">Governing Laws:</h4>
                      <div className="flex flex-wrap gap-2">
                        {country.laws.map((law, lawIndex) => (
                          <span
                            key={lawIndex}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                          >
                            {law}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-700">Legal Validity</div>
                        <div className="text-green-600 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          {country.legalValidity}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Court Acceptance</div>
                        <div className="text-green-600 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          {country.courtAcceptance}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-[#F5F2EE] border-t">
                  <button
                    onClick={() => setExpandedCountry(expandedCountry === index ? null : index)}
                    className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <span>Key Requirements</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${
                      expandedCountry === index ? 'rotate-180' : ''
                    }`} />
                  </button>
                  
                  {expandedCountry === index && (
                    <div className="mt-3 space-y-2">
                      {country.keyRequirements.map((req, reqIndex) => (
                        <div key={reqIndex} className="flex items-start gap-2 text-xs text-gray-600">
                          <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <button className="bg-[#260559] text-white rounded-sm px-8 py-4 mb-4">
            View Complete Compliance Guide
          </button>
          <p className="text-gray-600 text-sm">
            Need help with compliance in your jurisdiction? Our legal team can assist you.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Compliance