import React, { useState } from 'react'
import { Mail, Linkedin, Github, Globe, Search, ArrowRight} from 'lucide-react'
import { Link } from 'react-router-dom'

const Footer = () => {
  const [searchCountry, setSearchCountry] = useState('')
  // const [expandedCountry, setExpandedCountry] = useState(null)
  // const [activeTab, setActiveTab] = useState('all')
  // const [userCountry, setUserCountry] = useState('United States') // This would be detected via IP

  // // Simulate IP-based country detection
  // useEffect(() => {
  //   // In a real app, this would be an API call to detect user's country by IP
  //   // For demo purposes, we'll simulate this
  //   const detectUserCountry = async () => {
  //     try {
  //       // Simulated IP detection - in reality you'd use a service like ipapi.co
  //       const response = await fetch('https://ipapi.co/json/')
  //       const data = await response.json()
  //       setUserCountry(data.country_name)
        
  //       // For demo, we'll randomly assign a country
  //       // const demoCountries = ['United States', 'United Kingdom', 'Canada', 'Australia', 'India']
  //       // const randomCountry = demoCountries[Math.floor(Math.random() * demoCountries.length)]
  //       // setUserCountry(randomCountry)
  //     } catch (error) {
  //       console.log('Could not detect user country')
  //     }
  //   }

  //   detectUserCountry()
  // }, [])

  // Auto-advance through steps
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setActiveStep((prev) => (prev + 1) % documentLifecycle.length)
  //   }, 4000)
  //   return () => clearInterval(timer)
  // }, [])

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
      statusColor: 'text-purple-600',
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

  // const certifications = [
  //   {
  //     name: 'PCI DSS',
  //     fullName: 'PCI DSS certification',
  //     description: 'Payment Card Industry Data Security Standard',
  //     status: 'Certified',
  //     icon: () => (
  //       <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
  //         <div className="text-center">
  //           <div className="text-lg font-bold text-blue-800">PCI</div>
  //           <div className="text-xs text-blue-600">DSS</div>
  //         </div>
  //       </div>
  //     ),
  //     color: 'bg-blue-100 text-blue-800'
  //   },
  //   {
  //     name: '21 CFR Part 11',
  //     fullName: '21 CFR Part 11',
  //     description: 'Guarantees full compliance with 21 CFR Part 11',
  //     status: 'Compliant',
  //     icon: () => (
  //       <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
  //         <div className="text-center">
  //           <div className="text-sm font-bold text-gray-800">FDA</div>
  //           <div className="text-xs text-gray-600">21 CFR</div>
  //         </div>
  //       </div>
  //     ),
  //     color: 'bg-gray-100 text-gray-800'
  //   },
  //   {
  //     name: 'GDPR',
  //     fullName: 'GDPR compliance',
  //     description: 'General Data Protection Regulation',
  //     status: 'Compliant',
  //     icon: () => (
  //       <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
  //         <div className="text-center">
  //           <div className="text-xs font-bold text-blue-800">GDPR</div>
  //           <div className="text-lg">🇪🇺</div>
  //         </div>
  //       </div>
  //     ),
  //     color: 'bg-blue-100 text-blue-800'
  //   },
  //   {
  //     name: 'HIPAA',
  //     fullName: 'HIPAA compliance',
  //     description: 'Health Insurance Portability and Accountability Act',
  //     status: 'Compliant',
  //     icon: () => (
  //       <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
  //         <div className="text-center">
  //           <div className="text-xs font-bold text-red-800">HIPAA</div>
  //           <div className="text-lg">⚕️</div>
  //         </div>
  //       </div>
  //     ),
  //     color: 'bg-red-100 text-red-800'
  //   },
  //   {
  //     name: 'SOC 2 Type II',
  //     fullName: 'SOC 2 Type II Certified',
  //     description: 'System and Organization Controls (Type II)',
  //     status: 'Certified',
  //     icon: () => (
  //       <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
  //         <div className="text-center">
  //           <div className="text-xs font-bold text-purple-800">AICPA</div>
  //           <div className="text-xs font-bold text-purple-800">SOC 2</div>
  //         </div>
  //       </div>
  //     ),
  //     color: 'bg-purple-100 text-purple-800'
  //   },
  //   {
  //     name: 'ISO 27001',
  //     fullName: 'ISO 27001 Certified',
  //     description: 'ISO 27001 Certified',
  //     status: 'Certified',
  //     icon: () => (
  //       <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
  //         <div className="text-center">
  //           <div className="text-xs font-bold text-blue-800">ISO</div>
  //           <div className="text-xs font-bold text-blue-800">27001</div>
  //         </div>
  //       </div>
  //     ),
  //     color: 'bg-blue-100 text-blue-800'
  //   }
  // ]

  // const countryTabs = [
  //   { id: 'all', name: 'All Countries', flag: '🌍' },
  //   { id: 'us', name: 'United States', flag: '🇺🇸' },
  //   { id: 'ca', name: 'Canada', flag: '🇨🇦' },
  //   { id: 'uk', name: 'United Kingdom', flag: '🇬🇧' },
  //   { id: 'eu', name: 'European Union', flag: '🇪🇺' },
  //   { id: 'au', name: 'Australia', flag: '🇦🇺' }
  // ]

  // Sort countries to show user's country first
  // const sortedCountries = [...countries].sort((a, b) => {
  //   if (a.name === userCountry) return -1
  //   if (b.name === userCountry) return 1
  //   return 0
  // })

  // const filteredCountries = sortedCountries.filter(country =>
  //   country.name.toLowerCase().includes(searchCountry.toLowerCase()) ||
  //   country.laws.some(law => law.toLowerCase().includes(searchCountry.toLowerCase()))
  // )

  // Document Lifecycle with DocuSigner
  // const documentLifecycle = [
  //   {
  //     step: 1,
  //     title: "Document Drafting & Creation",
  //     description: "Create or upload documents using AI-powered templates and smart editing tools",
  //     icon: FileText,
  //     color: "from-blue-500 to-blue-600",
  //     bgColor: "bg-blue-50",
  //     textColor: "text-blue-700",
  //     docusignerFeatures: [
  //       "AI-powered document generation",
  //       "20+ legal templates library",
  //       "Smart field detection",
  //       "Multi-format support (PDF, Word, etc.)"
  //     ],
  //     legalRequirements: [
  //       "Ensure document completeness",
  //       "Include all necessary terms",
  //       "Verify legal language accuracy",
  //       "Check jurisdiction compliance"
  //     ]
  //   },
  //   {
  //     step: 2,
  //     title: "Document Review & Editing",
  //     description: "Collaborate with team members to review, edit, and finalize document content",
  //     icon: Edit,
  //     color: "from-purple-500 to-purple-600",
  //     bgColor: "bg-purple-50",
  //     textColor: "text-purple-700",
  //     docusignerFeatures: [
  //       "Real-time collaborative editing",
  //       "Version control & history",
  //       "Comment and annotation tools",
  //       "Track changes functionality"
  //     ],
  //     legalRequirements: [
  //       "Maintain version control",
  //       "Document all changes",
  //       "Ensure reviewer authorization",
  //       "Preserve edit history"
  //     ]
  //   },
  //   {
  //     step: 3,
  //     title: "Signature Field Preparation",
  //     description: "Add signature fields, assign signers, and configure signing workflow",
  //     icon: UserCheck,
  //     color: "from-green-500 to-green-600",
  //     bgColor: "bg-green-50",
  //     textColor: "text-green-700",
  //     docusignerFeatures: [
  //       "Drag-and-drop field placement",
  //       "Multi-signer workflow setup",
  //       "Custom signing order",
  //       "Field validation rules"
  //     ],
  //     legalRequirements: [
  //       "Verify signer identity",
  //       "Obtain consent for e-signatures",
  //       "Set appropriate signature methods",
  //       "Configure authentication levels"
  //     ]
  //   },
  //   {
  //     step: 4,
  //     title: "Document Distribution & Signing",
  //     description: "Send documents to signers with secure delivery and real-time tracking",
  //     icon: Send,
  //     color: "from-orange-500 to-orange-600",
  //     bgColor: "bg-orange-50",
  //     textColor: "text-orange-700",
  //     docusignerFeatures: [
  //       "Secure email delivery",
  //       "Real-time signing status",
  //       "Automated reminders",
  //       "Mobile-friendly signing"
  //     ],
  //     legalRequirements: [
  //       "Secure transmission methods",
  //       "Signer authentication",
  //       "Intent to sign verification",
  //       "Delivery confirmation"
  //     ]
  //   },
  //   {
  //     step: 5,
  //     title: "Signature Verification & Security",
  //     description: "Verify signatures using advanced security measures and fraud detection",
  //     icon: ShieldCheck,
  //     color: "from-red-500 to-red-600",
  //     bgColor: "bg-red-50",
  //     textColor: "text-red-700",
  //     docusignerFeatures: [
  //       "Digital signature certificates",
  //       "Biometric signature capture",
  //       "IP address logging",
  //       "Device fingerprinting"
  //     ],
  //     legalRequirements: [
  //       "Strong authentication methods",
  //       "Non-repudiation measures",
  //       "Fraud prevention",
  //       "Signature integrity verification"
  //     ]
  //   },
  //   {
  //     step: 6,
  //     title: "Audit Trail Generation",
  //     description: "Create comprehensive audit trails documenting the entire signing process",
  //     icon: FileCheck,
  //     color: "from-indigo-500 to-indigo-600",
  //     bgColor: "bg-indigo-50",
  //     textColor: "text-indigo-700",
  //     docusignerFeatures: [
  //       "Detailed activity logs",
  //       "Timestamped events",
  //       "Signer behavior tracking",
  //       "Legal certificate generation"
  //     ],
  //     legalRequirements: [
  //       "Complete activity documentation",
  //       "Tamper-evident records",
  //       "Chronological event logging",
  //       "Legal admissibility standards"
  //     ]
  //   },
  //   {
  //     step: 7,
  //     title: "Secure Document Storage",
  //     description: "Store signed documents with enterprise-grade security and encryption",
  //     icon: Database,
  //     color: "from-teal-500 to-teal-600",
  //     bgColor: "bg-teal-50",
  //     textColor: "text-teal-700",
  //     docusignerFeatures: [
  //       "256-bit encryption at rest",
  //       "Redundant cloud storage",
  //       "Access control management",
  //       "Backup and recovery"
  //     ],
  //     legalRequirements: [
  //       "Secure storage standards",
  //       "Data protection compliance",
  //       "Access logging",
  //       "Retention policy enforcement"
  //     ]
  //   },
  //   {
  //     step: 8,
  //     title: "Document Distribution & Copies",
  //     description: "Automatically distribute final signed copies to all parties involved",
  //     icon: Copy,
  //     color: "from-pink-500 to-pink-600",
  //     bgColor: "bg-pink-50",
  //     textColor: "text-pink-700",
  //     docusignerFeatures: [
  //       "Automatic copy distribution",
  //       "Custom delivery options",
  //       "Download notifications",
  //       "Bulk distribution tools"
  //     ],
  //     legalRequirements: [
  //       "Provide copies to all parties",
  //       "Maintain original integrity",
  //       "Delivery confirmation",
  //       "Equal access to documents"
  //     ]
  //   },
  //   {
  //     step: 9,
  //     title: "Long-term Record Retention",
  //     description: "Maintain documents according to legal retention requirements and regulations",
  //     icon: Archive,
  //     color: "from-gray-500 to-gray-600",
  //     bgColor: "bg-gray-50",
  //     textColor: "text-gray-700",
  //     docusignerFeatures: [
  //       "Automated retention policies",
  //       "Legal hold capabilities",
  //       "Compliance monitoring",
  //       "Secure disposal processes"
  //     ],
  //     legalRequirements: [
  //       "Meet retention periods",
  //       "Maintain document integrity",
  //       "Compliance with regulations",
  //       "Secure disposal when required"
  //     ]
  //   }
  // ]

  const handleCountrySearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchCountry.trim()) {
      // This would redirect to a country-specific compliance page
      console.log(`Redirecting to compliance page for: ${searchCountry}`)
      // In a real app: window.location.href = `/compliance/${searchCountry.toLowerCase()}`
    }
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-max">
        {/* Compliance Section */}
        <div className="py-12 border-b border-gray-800">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Global eSignature Compliance
            </h3>
            <p className="text-gray-300 max-w-2xl mx-auto mb-6">
              Stay compliant with local e-signature laws and regulations. Search our comprehensive database of legal requirements by country and jurisdiction.
            </p>
            
            {/* Country Search */}
            <form onSubmit={handleCountrySearch} className="max-w-md mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by country..."
                  value={searchCountry}
                  onChange={(e) => setSearchCountry(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-400"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Top Countries Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {countries.slice(0, 4).map((country, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{country.flag}</span>
                  <h4 className="font-medium text-white text-sm">{country.name}</h4>
                </div>
                <div className="text-xs text-gray-400 mb-2">{country.laws[0]}</div>
                <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                  country.status === 'Fully Compliant' ? 'bg-green-900 text-green-300' :
                  country.status === 'Qualified Signatures' ? 'bg-blue-900 text-blue-300' :
                  country.status === 'Digital Signatures' ? 'bg-purple-900 text-purple-300' :
                  'bg-orange-900 text-orange-300'
                }`}>
                  {country.status}
                </div>
              </div>
            ))}
          </div>

          {/* All Countries Link */}
          <div className="text-center">
            <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              View All Countries & Laws
            </button>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-16 grid lg:grid-cols-6 md:grid-cols-3 sm:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  eSignature
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  PDF Tools
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Legal Templates
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  API
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  AI Assistant
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Mobile App
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Partners
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Press Kit
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  API Docs
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Whitepapers
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Webinars
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Templates
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/terms-of-service"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Cookie Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Document Retention
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Refund Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  GDPR
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Trust & Security</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/security-overview"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Security Overview
                </Link>
              </li>
              <li>
                <Link
                  to="/accessibility"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Accessibility
                </Link>
              </li>
              <li>
                <Link
                  to="/data-residency"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Data Residency
                </Link>
              </li>
              <li>
                <Link
                  to="/status"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Status Page
                </Link>
              </li>
              <li>
                <Link
                  to="/bug-bounty"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Bug Bounty
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Certifications
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Compare</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/docusigner-vs-docusign"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  DraftnSign vs DocuSign
                </Link>
              </li>
              <li>
                <Link
                  to="/docusigner-vs-hellosign"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  DraftnSign vs HelloSign
                </Link>
              </li>
              <li>
                <Link
                  to="/docusigner-vs-adobe-sign"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  DraftnSign vs Adobe Sign
                </Link>
              </li>
              <li>
                <Link
                  to="/docusigner-vs-pandadoc"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  DraftnSign vs PandaDoc
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  All Comparisons
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter & Language Selector */}
        <div className="py-8 border-t border-gray-800">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Newsletter */}
            <div>
              <h3 className="font-semibold text-white mb-4">Stay Updated</h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-400"
                />
                <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Subscribe
                </button>
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex items-center justify-end gap-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-gray-400" />
                <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  <option>English</option>
                  <option>Español</option>
                  <option>Français</option>
                  <option>Deutsch</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile App Download Section */}
        <div className="py-8 border-t border-gray-800">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Download Our Mobile App</h3>
            <p className="text-gray-400 text-sm">Sign documents on the go with our mobile apps</p>
          </div>
          <div className="flex justify-center gap-4">
            {/* iOS App Store */}
            <a
              href="#"
              className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-400">Download on the</div>
                <div className="text-sm font-semibold text-white">App Store</div>
              </div>
            </a>

            {/* Google Play Store */}
            <a
              href="#"
              className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-400">Get it on</div>
                <div className="text-sm font-semibold text-white">Google Play</div>
              </div>
            </a>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="py-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo & Copyright */}
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold gradient-text">DraftnSign</div>
              <span className="text-gray-400 text-sm">
                © 2025 DraftnSign. All rights reserved.
              </span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
              >
                <Linkedin className="h-5 w-5 text-gray-400 hover:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
              >
                <Github className="h-5 w-5 text-gray-400 hover:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
              >
                <Mail className="h-5 w-5 text-gray-400 hover:text-white" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer