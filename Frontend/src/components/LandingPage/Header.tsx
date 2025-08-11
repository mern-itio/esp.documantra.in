import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ChevronDown, Shield, Users, Code, BookOpen, Building, Heart, Home, Briefcase, DollarSign, Scale, UserCheck, FileCheck,  Calendar, MessageSquare, Award, Globe, FileText, Zap, Database, Settings, TrendingUp, BarChart3, PieChart, Layers, Cloud, Smartphone, Monitor, Headphones, Search, Star } from 'lucide-react'
import { useAuth } from '../AuthService/AuthContext'

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
    setActiveDropdown(null)
  }

  const handleDropdownEnter = (dropdownName: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
      dropdownTimeoutRef.current = null
    }
    setActiveDropdown(dropdownName)
  }

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
    }, 150) // 150ms delay
  }
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  useEffect(() => {
    if (activeDropdown && dropdownRefs.current[activeDropdown]) {
      const dropdown = dropdownRefs.current[activeDropdown]!;
      const rect = dropdown.getBoundingClientRect();
      const screenWidth = window.innerWidth;

      if (rect.right > screenWidth) {
        dropdown.style.left = 'auto';
        dropdown.style.right = '0';
        dropdown.style.transform = 'none';
      } else if (rect.left < 0) {
        dropdown.style.left = '0';
        dropdown.style.right = 'auto';
        dropdown.style.transform = 'none';
      } else {
        dropdown.style.left = '50%';
        dropdown.style.right = 'auto';
        dropdown.style.transform = 'translateX(-50%)';
      }
    }
  }, [activeDropdown]);


  // Helper function to create tool links
  const createToolLink = (toolName: string, path: string, icon: string, color: string) => {
    return (
      <Link
        to={path}
        className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
        onClick={() => setActiveDropdown(null)}
      >
        <span className="text-lg">{icon}</span>
        <span className={`text-sm font-medium ${color}`}>{toolName}.</span>
      </Link>
    )
  }

  const pdfToolsMenu = {
    recent: [
      { name: 'Organize', icon: '📁', color: 'text-green-600' },
      createToolLink('PDF to Word*', '/pdf-to-word', '📄', 'text-orange-600'),
      createToolLink('Edit*', '/edit-pdf', '✏️', 'text-blue-600'),
      { name: 'Create Forms', icon: '📋', color: 'text-blue-600' },
      createToolLink('Compress*', '/compress-pdf', '🗜️', 'text-blue-600'),
      createToolLink('Extract Pages*', '/extract-pages', '📄', 'text-green-600'),
      createToolLink('Merge*', '/merge-pdf*', '🔗', 'text-green-600'),
      createToolLink('Crop*', '/crop-pdf', '✂️', 'text-purple-600')
    ],
    merge: [
      { name: 'Alternate & Mix', icon: '🔄', color: 'text-green-600' },
      createToolLink('Merge*', '/merge-pdf', '🔗', 'text-green-600'),
      { name: 'Organize', icon: '📁', color: 'text-green-600' }
    ],
    split: [
      createToolLink('Extract Pages*', '/extract-pages', '📄', 'text-green-600'),
      createToolLink('Split by pages*', '/split-pdf', '📑', 'text-green-600'),
      { name: 'Split by bookmarks', icon: '🔖', color: 'text-green-600' },
      { name: 'Split in half', icon: '✂️', color: 'text-green-600' },
      { name: 'Split by size', icon: '📏', color: 'text-green-600' },
      { name: 'Split by text', icon: '📝', color: 'text-green-600' }
    ],
    editSign: [
      createToolLink('Edit*', '/edit-pdf', '✏️', 'text-blue-600'),
      { name: 'Fill & Sign', icon: '✍️', color: 'text-blue-600' },
      { name: 'Create Forms', icon: '📋', color: 'text-blue-600' },
      createToolLink('Delete Pages*', '/delete-pages', '🗑️', 'text-blue-600')
    ],
    compress: [
      createToolLink('Compress*', '/compress-pdf', '🗜️', 'text-blue-600')
    ],
    security: [
      createToolLink('Protect*', '/protect-pdf', '🔒', 'text-blue-600'),
      createToolLink('Unlock*', '/unlock-pdf', '🔓', 'text-blue-600'),
      createToolLink('Watermark*', '/watermark-pdf', '💧', 'text-blue-600'),
      createToolLink('Flatten*', '/flatten-pdf', '📋', 'text-blue-600')
    ],
    convertFromPdf: [
      createToolLink('PDF to Excel*', '/pdf-to-excel', '📊', 'text-orange-600'),
      createToolLink('PDF to JPG*', '/pdf-to-jpg', '🖼️', 'text-orange-600'),
      createToolLink('PDF to PowerPoint*', '/pdf-to-powerpoint', '📽️', 'text-orange-600'),
      createToolLink('PDF to Text*', '/pdf-to-text', '📝', 'text-orange-600'),
      createToolLink('PDF to Word*', '/pdf-to-word', '📄', 'text-orange-600')
    ],
    convertToPdf: [
      createToolLink('HTML to PDF*', '/html-to-pdf', '🌐', 'text-purple-600'),
      createToolLink('JPG to PDF*', '/jpg-to-pdf', '🖼️', 'text-purple-600'),
      createToolLink('Word to PDF*', '/word-to-pdf', '📄', 'text-purple-600')
    ],
    other: [
      createToolLink('Bates Numbering*', '/bates-numbering', '🔢', 'text-purple-600'),
      createToolLink('Create Bookmarks*', '/create-bookmarks', '🔖', 'text-purple-600'),
      createToolLink('Crop*', '/crop-pdf', '✂️', 'text-purple-600'),
      createToolLink('Edit Metadata*', '/edit-metadata', '📋', 'text-purple-600'),
      createToolLink('Extract Images*', '/extract-images', '🖼️', 'text-purple-600'),
      createToolLink('Grayscale*', '/grayscale-pdf', '⚫', 'text-purple-600'),
      createToolLink('Header & Footer*', '/header-footer', '📄', 'text-purple-600'),
      createToolLink('N-up*', '/n-up', '📑', 'text-purple-600'),
      createToolLink('Page Numbers*', '/page-numbers', '🔢', 'text-purple-600')
    ],
    scans: [
      createToolLink('Deskew*', '/deskew-pdf', '📐', 'text-red-600'),
      createToolLink('OCR*', '/ocr-pdf', '👁️', 'text-red-600')
    ],
    automate: [
      { name: 'Workflows', icon: '⚙️', color: 'text-gray-600', badge: 'New' }
    ],
    compare: [
      { name: 'Compare Word', icon: '📄', color: 'text-blue-600' },
      { name: 'Compare Excel', icon: '📊', color: 'text-green-600' },
      { name: 'Compare PDF', icon: '📋', color: 'text-red-600' }
    ],
    rotate: [
      createToolLink('Rotate PDF*', '/rotate-pdf', '🔄', 'text-purple-600')
    ]
  }

  const whyDocuSignerMenu = [
    {
      category: 'Why Choose Us',
      items: [
        { name: 'All-in-One Platform', icon: Layers, description: 'Complete document lifecycle management' },
        { name: 'AI-Powered Features', icon: Zap, description: 'Smart document generation and processing' },
        { name: 'Global Compliance', icon: Globe, description: 'Legal in 40+ countries worldwide' },
        { name: 'Enterprise Security', icon: Shield, description: 'Bank-level encryption and compliance' }
      ]
    },
    {
      category: 'Key Benefits',
      items: [
        { name: 'Free Forever Plan', icon: Heart, description: '10 envelopes/month, no credit card required' },
        { name: '10x Faster Processing', icon: TrendingUp, description: 'Automated workflows save time' },
        { name: 'Expert Support', icon: Headphones, description: '24/7 customer assistance' },
        { name: 'Easy Integration', icon: Code, description: 'APIs and webhooks for seamless integration' }
      ]
    }
  ]

  const useCasesMenu = {
    industries: [
      {
        category: 'Business & Legal',
        items: [
          { name: 'Legal Firms', icon: Scale, description: 'Contract management and client agreements' },
          { name: 'Real Estate', icon: Home, description: 'Property transactions and lease agreements' },
          { name: 'Healthcare', icon: UserCheck, description: 'Patient forms and compliance documents' },
          { name: 'Financial Services', icon: DollarSign, description: 'Loan applications and financial agreements' }
        ]
      },
      {
        category: 'Technology & Enterprise',
        items: [
          { name: 'Software Companies', icon: Code, description: 'NDAs, employment contracts, and partnerships' },
          { name: 'Startups', icon: TrendingUp, description: 'Investor agreements and employee onboarding' },
          { name: 'Enterprise', icon: Building, description: 'Large-scale document workflows' },
          { name: 'Government', icon: Award, description: 'Public sector document management' }
        ]
      },
      {
        category: 'Education & Non-Profit',
        items: [
          { name: 'Educational Institutions', icon: BookOpen, description: 'Student forms and administrative documents' },
          { name: 'Non-Profit Organizations', icon: Heart, description: 'Volunteer agreements and donor forms' },
          { name: 'Consulting', icon: Users, description: 'Client contracts and project agreements' },
          { name: 'Freelancers', icon: Briefcase, description: 'Service agreements and invoicing' }
        ]
      }
    ],
    useCases: [
      { name: 'Contract Management', icon: FileCheck, description: 'End-to-end contract lifecycle' },
      { name: 'Employee Onboarding', icon: Users, description: 'HR documents and forms' },
      { name: 'Client Agreements', icon: Briefcase, description: 'Service and partnership agreements' },
      { name: 'Compliance Documentation', icon: Shield, description: 'Regulatory and audit documents' }
    ]
  }

  const resourcesMenu = {
    learn: [
      { name: 'Getting Started Guide', icon: BookOpen, description: 'Complete beginner tutorial' },
      { name: 'Video Tutorials', icon: Monitor, description: 'Step-by-step video guides' },
      { name: 'Webinars', icon: Calendar, description: 'Live training sessions' },
      { name: 'Best Practices', icon: Star, description: 'Expert tips and recommendations' }
    ],
    documentation: [
      { name: 'User Manual', icon: FileText, description: 'Comprehensive user documentation' },
      { name: 'Legal Compliance Guide', icon: Scale, description: 'Jurisdiction-specific requirements' },
      { name: 'Security Whitepaper', icon: Shield, description: 'Detailed security information' },
      { name: 'Integration Guides', icon: Code, description: 'Third-party integration tutorials' }
    ],
    community: [
      // { name: 'Blog', icon: BookOpen, description: 'Latest news and insights' },
      { name: 'Case Studies', icon: BarChart3, description: 'Customer success stories' },
      { name: 'Templates Library', icon: FileText, description: 'Free document templates' },
      { name: 'Community Forum', icon: MessageSquare, description: 'User discussions and support' }
    ]
  }

  const developerMenu = [
    {
      category: 'API & Integration',
      items: [
        { name: 'REST API Documentation', icon: Code, description: 'Complete API reference' },
        { name: 'Webhooks', icon: Zap, description: 'Real-time event notifications' },
        { name: 'SDKs & Libraries', icon: Database, description: 'Official SDKs for popular languages' },
        { name: 'Postman Collection', icon: Settings, description: 'Ready-to-use API collection' }
      ]
    },
    {
      category: 'Tools & Resources',
      items: [
        { name: 'API Explorer', icon: Search, description: 'Interactive API testing tool' },
        { name: 'Code Examples', icon: FileText, description: 'Sample implementations' },
        { name: 'Sandbox Environment', icon: Cloud, description: 'Test environment for development' },
        { name: 'Rate Limits & Pricing', icon: BarChart3, description: 'API usage and pricing information' }
      ]
    }
  ]

  const workspaceMenu = [
    {
      category: 'Analytics & Insights',
      items: [
        { name: 'Document Analytics', icon: BarChart3, description: 'Track document performance' },
        { name: 'Signing Metrics', icon: PieChart, description: 'Monitor signing completion rates' },
        { name: 'User Activity', icon: Users, description: 'Team usage and engagement' },
        { name: 'Compliance Reports', icon: Shield, description: 'Audit trails and compliance data' }
      ]
    },
    {
      category: 'Management Tools',
      items: [
        { name: 'Team Management', icon: Users, description: 'Manage users and permissions' },
        { name: 'Template Library', icon: FileText, description: 'Organize and share templates' },
        { name: 'Workflow Automation', icon: Settings, description: 'Automate document processes' },
        { name: 'Integration Hub', icon: Layers, description: 'Connect with your favorite tools' }
      ]
    }
  ]

  const industriesMenu = [
    {
      category: 'Professional Services',
      items: [
        { name: 'Legal & Law Firms', icon: Scale, description: 'Contract management and legal documents' },
        { name: 'Accounting & Finance', icon: DollarSign, description: 'Financial agreements and audit documents' },
        { name: 'Consulting', icon: Users, description: 'Client contracts and project agreements' },
        { name: 'Insurance', icon: Shield, description: 'Policy documents and claims processing' }
      ]
    },
    {
      category: 'Technology & Innovation',
      items: [
        { name: 'Software & SaaS', icon: Code, description: 'NDAs, partnerships, and user agreements' },
        { name: 'Startups', icon: TrendingUp, description: 'Investor docs and employee contracts' },
        { name: 'E-commerce', icon: Smartphone, description: 'Vendor agreements and terms of service' },
        { name: 'Manufacturing', icon: Settings, description: 'Supply chain and vendor contracts' }
      ]
    },
    {
      category: 'Healthcare & Education',
      items: [
        { name: 'Healthcare', icon: UserCheck, description: 'Patient forms and HIPAA compliance' },
        { name: 'Education', icon: BookOpen, description: 'Student enrollment and administrative forms' },
        { name: 'Non-Profit', icon: Heart, description: 'Volunteer agreements and donor forms' },
        { name: 'Government', icon: Award, description: 'Public sector document workflows' }
      ]
    }
  ]

  // const supportMenu = [
  //   {
  //     category: 'Security & Compliance',
  //     items: [
  //       { name: 'Security Overview', icon: Shield, description: 'Enterprise-grade security features' },
  //       { name: 'Compliance Center', icon: Award, description: 'GDPR, HIPAA, SOC 2 compliance' },
  //       { name: 'Trust Center', icon: Lock, description: 'Security certifications and audits' },
  //       { name: 'Data Privacy', icon: UserCheck, description: 'Privacy policies and data handling' }
  //     ]
  //   },
  //   {
  //     category: 'Help & Support',
  //     items: [
  //       { name: 'Help Center', icon: HelpCircle, description: 'FAQs and troubleshooting guides' },
  //       { name: 'Contact Support', icon: Headphones, description: '24/7 customer support' },
  //       { name: 'Live Chat', icon: MessageSquare, description: 'Instant help and assistance' },
  //       { name: 'Developer Resources', icon: Code, description: 'Technical documentation and APIs' }
  //     ]
  //   }
  // ]

  const featuresMenu = [
    {
      category: 'Core Features',
      items: [
        { name: 'eSignature', icon: FileCheck, description: 'Legally binding electronic signatures' },
        { name: 'PDF Tools', icon: FileText, description: '30+ free PDF editing tools' },
        { name: 'Legal Templates', icon: Scale, description: '45+ professional legal documents' },
        { name: 'Document Generation', icon: Zap, description: 'AI-powered document creation' }
      ]
    },
    {
      category: 'Advanced Features',
      items: [
        { name: 'Workflow Automation', icon: Settings, description: 'Automated document processes' },
        { name: 'Team Collaboration', icon: Users, description: 'Real-time document collaboration' },
        { name: 'API Integration', icon: Code, description: 'Seamless system integration' },
        { name: 'Analytics & Reporting', icon: BarChart3, description: 'Document performance insights' }
      ]
    }
  ]

  // Helper function to render tool items
  const renderToolItem = (tool: any, index: number) => {
    if (React.isValidElement(tool)) {
      return <div key={index}>{tool}</div>
    }

    return (
      <button
        key={index}
        className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="text-lg">{tool.icon}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${tool.color}`}>{tool.name}</span>
          {tool.badge && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
              {tool.badge}
            </span>
          )}
        </div>
      </button>
    )
  }

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'
      }`}>
      {/* Top Navigation Bar */}
      <div className="bg-primary-600 text-white">
        <div className="container-max">
          <div className="flex items-center justify-between h-10 text-sm">
            {/* Left side - Promotional message */}
            <div className="flex items-center gap-2">
              <span className="hidden md:block">🚀 New AI-powered document generation is here!</span>
              <span className="md:hidden">🚀 AI document generation live!</span>
            </div>

            {/* Right side - Utility links + Login */}
            <div className="flex items-center space-x-6">
              <a href="#" className="hover:text-primary-200 transition-colors">Blog</a>
              <a href="#" className="hover:text-primary-200 transition-colors">Docs</a>
              {/* <a href="#" className="hover:text-primary-200 transition-colors">Get Support</a> */}
              <a href="#" className="hover:text-primary-200 transition-colors">Contact Sales</a>
              {isAuthenticated ? (
                   <Link to="/dashboard" className="hover:text-primary-200 transition-colors font-medium">Dashboard</Link>
             
              ) : (
                <Link to="/login" className="hover:text-primary-200 transition-colors font-medium">Log in</Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-max">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold gradient-text">DraftnSign</Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              {/* PDF Tools Dropdown */}
              <div 
                className="relative group"
                onMouseEnter={() => handleDropdownEnter('pdf-tools')}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                >
                  PDF Tools <ChevronDown className="ml-1 h-4 w-4" />
                </button>

                {activeDropdown === 'pdf-tools' && (
                  <div
                    ref={(el) => {
                      dropdownRefs.current['pdf-tools'] = el;
                    }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[1050px] max-h-[80vh] overflow-y-auto bg-white rounded-lg shadow-2xl border border-gray-200 p-6 z-50 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
                  >
                    <div className="grid grid-cols-6 gap-6">
                      {/* Recent Column */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">RECENT</h3>
                        <div className="space-y-2">
                          {pdfToolsMenu.recent.map((tool, index) => renderToolItem(tool, index))}
                        </div>
                      </div>

                      {/* Merge Column */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">MERGE</h3>
                        <div className="space-y-2">
                          {pdfToolsMenu.merge.map((tool, index) => renderToolItem(tool, index))}
                        </div>

                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-6">SPLIT</h3>
                        <div className="space-y-2">
                          {pdfToolsMenu.split.map((tool, index) => renderToolItem(tool, index))}
                        </div>
                      </div>

                      {/* Edit & Sign Column */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">EDIT & SIGN</h3>
                        <div className="space-y-2">
                          {pdfToolsMenu.editSign.map((tool, index) => renderToolItem(tool, index))}
                        </div>

                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-6">COMPRESS</h3>
                        <div className="space-y-2">
                          {pdfToolsMenu.compress.map((tool, index) => renderToolItem(tool, index))}
                        </div>

                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-6">SECURITY</h3>
                        <div className="space-y-2">
                          {pdfToolsMenu.security.map((tool, index) => renderToolItem(tool, index))}
                        </div>
                      </div>

                      {/* Convert From PDF Column */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">CONVERT FROM PDF</h3>
                        <div className="space-y-2">
                          {pdfToolsMenu.convertFromPdf.map((tool, index) => renderToolItem(tool, index))}
                        </div>

                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-6">CONVERT TO PDF</h3>
                        <div className="space-y-2">
                          {pdfToolsMenu.convertToPdf.map((tool, index) => renderToolItem(tool, index))}
                        </div>
                      </div>

                      {/* Other & Compare Column */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">OTHER</h3>
                        <div className="space-y-2">
                          {pdfToolsMenu.other.map((tool, index) => renderToolItem(tool, index))}
                        </div>

                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-6">COMPARE</h3>
                        <div className="space-y-2">
                          {pdfToolsMenu.compare.map((tool, index) => renderToolItem(tool, index))}
                        </div>
                      </div>

                      {/* Scans & Automate Column */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">SCANS</h3>
                        <div className="space-y-2">
                          {pdfToolsMenu.scans.map((tool, index) => renderToolItem(tool, index))}
                        </div>

                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-6">AUTOMATE</h3>
                        <div className="space-y-2">
                          {pdfToolsMenu.automate.map((tool, index) => renderToolItem(tool, index))}
                        </div>

                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-6">ROTATE</h3>
                        <div className="space-y-2">
                          {pdfToolsMenu.rotate.map((tool, index) => renderToolItem(tool, index))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom CTA */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">30+ PDF tools</span> available for free
                        </div>
                        <button
                          onClick={() => scrollToSection('pdf-tools')}
                          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors"
                        >
                          View All Tools
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Why DocuSigner Dropdown */}
              <div 
                className="relative group"
                onMouseEnter={() => handleDropdownEnter('why-docusigner')}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Why DraftnSign <ChevronDown className="ml-1 h-4 w-4" />
                </button>

                {activeDropdown === 'why-docusigner' && (
                  <div
                    ref={(el) => {
                      dropdownRefs.current['why-docusigner'] = el;
                    }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 p-6 z-50"
                  >
                    <div className="grid grid-cols-2 gap-6">
                      {whyDocuSignerMenu.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{section.category}</h3>
                          <div className="space-y-3">
                            {section.items.map((item, index) => (
                              <button
                                key={index}
                                className="flex items-start gap-3 w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <item.icon className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                                  <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Use Cases Dropdown */}
              <div 
                className="relative group"
                onMouseEnter={() => handleDropdownEnter('use-cases')}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Use Cases <ChevronDown className="ml-1 h-4 w-4" />
                </button>

                {activeDropdown === 'use-cases' && (
                  <div
                                         ref={(el) => {
                       dropdownRefs.current['use-cases'] = el;
                     }}
                     className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[1050px] max-h-[80vh] overflow-y-auto bg-white rounded-lg shadow-2xl border border-gray-200 p-6 z-50 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
                  >
                    <div className="grid grid-cols-3 gap-6">
                      {useCasesMenu.industries.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{section.category}</h3>
                          <div className="space-y-3">
                            {section.items.map((item, index) => (
                              <button
                                key={index}
                                className="flex items-start gap-3 w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <item.icon className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                                  <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">COMMON USE CASES</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {useCasesMenu.useCases.map((useCase, index) => (
                          <button
                            key={index}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                          >
                            <useCase.icon className="h-5 w-5 text-primary-600" />
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{useCase.name}</div>
                              <div className="text-xs text-gray-500">{useCase.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Resources Dropdown */}
              <div 
                className="relative group"
                onMouseEnter={() => handleDropdownEnter('resources')}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Resources <ChevronDown className="ml-1 h-4 w-4" />
                </button>

                {activeDropdown === 'resources' && (
                  <div
                    ref={(el) => {
                      dropdownRefs.current['resources'] = el;
                    }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[700px] bg-white rounded-lg shadow-2xl border border-gray-200 p-6 z-50"
                  >
                    <div className="grid grid-cols-3 gap-6">
                      {Object.entries(resourcesMenu).map(([key, section]) => (
                        <div key={key}>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            {key === 'learn' ? 'LEARN' : key === 'documentation' ? 'DOCUMENTATION' : 'COMMUNITY'}
                          </h3>
                          <div className="space-y-3">
                            {section.map((item, index) => (
                              <button
                                key={index}
                                className="flex items-start gap-3 w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <item.icon className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                                  <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Developer Dropdown */}
              <div 
                className="relative group"
                onMouseEnter={() => handleDropdownEnter('developer')}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Developer <ChevronDown className="ml-1 h-4 w-4" />
                </button>

                {activeDropdown === 'developer' && (
                  <div
                    ref={(el) => {
                      dropdownRefs.current['developer'] = el;
                    }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 p-6 z-50"
                  >
                    <div className="grid grid-cols-2 gap-6">
                      {developerMenu.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{section.category}</h3>
                          <div className="space-y-3">
                            {section.items.map((item, index) => (
                              <button
                                key={index}
                                className="flex items-start gap-3 w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <item.icon className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                                  <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Workspace Dropdown */}
              <div 
                className="relative group"
                onMouseEnter={() => handleDropdownEnter('workspace')}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Workspace <ChevronDown className="ml-1 h-4 w-4" />
                </button>

                {activeDropdown === 'workspace' && (
                  <div
                    ref={(el) => {
                      dropdownRefs.current['workspace'] = el;
                    }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 p-6 z-50"
                  >
                    <div className="grid grid-cols-2 gap-6">
                      {workspaceMenu.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{section.category}</h3>
                          <div className="space-y-3">
                            {section.items.map((item, index) => (
                              <button
                                key={index}
                                className="flex items-start gap-3 w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <item.icon className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                                  <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Industries Dropdown */}
              <div 
                className="relative group"
                onMouseEnter={() => handleDropdownEnter('industries')}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Industries <ChevronDown className="ml-1 h-4 w-4" />
                </button>

                {activeDropdown === 'industries' && (
                  <div
                    ref={(el) => {
                      dropdownRefs.current['industries'] = el;
                    }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[800px] bg-white rounded-lg shadow-2xl border border-gray-200 p-6 z-50"
                  >
                    <div className="grid grid-cols-3 gap-6">
                      {industriesMenu.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{section.category}</h3>
                          <div className="space-y-3">
                            {section.items.map((item, index) => (
                              <button
                                key={index}
                                className="flex items-start gap-3 w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <item.icon className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                                  <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Features Dropdown */}
              <div 
                className="relative group"
                onMouseEnter={() => handleDropdownEnter('features')}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Features <ChevronDown className="ml-1 h-4 w-4" />
                </button>

                {activeDropdown === 'features' && (
                  <div
                    ref={(el) => {
                      dropdownRefs.current['features'] = el;
                    }}
                    className="absolute top-full mt-2 w-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 p-6 z-50"
                  >
                    <div className="grid grid-cols-2 gap-6">
                      {featuresMenu.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{section.category}</h3>
                          <div className="space-y-3">
                            {section.items.map((item, index) => (
                              <button
                                key={index}
                                className="flex items-start gap-3 w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <item.icon className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                                  <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Mobile menu button - No CTA buttons on desktop */}
            <button
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="lg:hidden bg-white border-t">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <button onClick={() => scrollToSection('pdf-tools')} className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600">PDF Tools</button>
                <button className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600">Why DraftnSign</button>
                <button className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600">Use Cases</button>
                <button className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600">Resources</button>
                <button className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600">Developer</button>
                <button className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600">Workspace</button>
                <button className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600">Industries</button>
                <button className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600">Features</button>
                <div className="px-3 py-2 space-y-2">
                  {isAuthenticated ? (
                    <>
                      <div className="text-center py-2 text-primary-600 text-sm">Welcome, {user?.name}</div>
                      <Link to="/dashboard" className="w-full text-center py-2 text-primary-600 font-medium block">Dashboard</Link>
                      <button
                        onClick={logout}
                        className="w-full text-center py-2 text-red-600 font-medium block"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link to="/login" className="w-full text-center py-2 text-primary-600 font-medium block">Log in</Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header