import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Shield,
  Zap,
  Users,
  Code,
  CheckCircle2,
  ArrowRight,
  FileSignature,
  Lock,
  Search,
  Merge,
  BookOpen,
  Mail,
  Settings,
  Server,
  Award,
  Edit,
  Rocket,
  Target,
  Sparkles,
  ChevronRight,
  Briefcase,
  Home,
  Scale,
  GraduationCap,
  DollarSign,
  Heart,
} from 'lucide-react';

const BlogPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const blogSections = [
    {
      id: 'introduction',
      title: 'Introduction to Draft and Sign',
      icon: Rocket,
      content: {
        overview: 'Draft and Sign is a comprehensive all-in-one document management and electronic signature platform designed to streamline your document workflows. Whether you need to create, edit, sign, or manage documents, our platform provides everything you need in one place.',
        keyPoints: [
          'Legally binding electronic signatures compliant across 40+ countries',
          '30+ free PDF manipulation tools',
          '45+ professionally drafted legal document templates',
          'AI-powered document generation and editing',
          'Real-time collaboration and document sharing',
          'Enterprise-grade security and compliance'
        ]
      }
    },
    {
      id: 'esignature',
      title: 'Electronic Signature Features',
      icon: FileSignature,
      content: {
        overview: 'Our e-signature solution provides legally binding signatures with advanced authentication methods, custom workflows, and comprehensive audit trails.',
        features: [
          {
            name: 'Envelope Management',
            description: 'Create and manage document envelopes with multiple recipients, custom signing orders, and automated reminders.',
            details: [
              'Multi-recipient support (signers, reviewers, CC recipients)',
              'Sequential or parallel signing workflows',
              'Custom signing order configuration',
              'Automated email notifications and reminders',
              'Document expiration and deadline management',
              'Real-time status tracking'
            ]
          },
          {
            name: 'PowerForms',
            description: 'Create reusable document templates that can be embedded on your website, allowing anyone to fill out and sign without needing an account.',
            details: [
              'Public-facing forms for external signers',
              'Embeddable forms with custom URLs',
              'Template-based document generation',
              'Automatic field mapping and validation',
              'Submission tracking and analytics',
              'No account required for signers'
            ]
          },
          {
            name: 'Advanced Authentication',
            description: 'Multiple authentication methods to ensure document security and legal compliance.',
            details: [
              'Email verification (default)',
              'SMS verification',
              'Access code authentication',
              'Knowledge-based authentication (KBA)',
              'Biometric authentication',
              'Multi-factor authentication (MFA)',
              'Identity verification services'
            ]
          },
          {
            name: 'Signature Types',
            description: 'Choose from standard, advanced, or qualified signature types based on your compliance requirements.',
            details: [
              'Standard signatures for general use',
              'Advanced signatures with enhanced security',
              'Qualified signatures for highest legal validity',
              'Compliance with eIDAS, ESIGN Act, and more',
              'Complete audit trails for all signatures'
            ]
          },
          {
            name: 'Signing Editor',
            description: 'Intuitive drag-and-drop interface for placing signature fields, text fields, checkboxes, and more.',
            details: [
              'Visual field placement on documents',
              'Multiple field types (signature, initial, text, date, etc.)',
              'Recipient-specific field assignment',
              'Color-coded recipient identification',
              'Field validation and requirements',
              'Real-time preview'
            ]
          }
        ]
      }
    },
    {
      id: 'pdftools',
      title: 'PDF Tools Suite',
      icon: FileText,
      content: {
        overview: 'Comprehensive collection of 30+ free PDF manipulation tools to convert, edit, manage, secure, and optimize your PDF documents.',
        categories: [
          {
            name: 'Convert',
            icon: FileText,
            tools: [
              { name: 'PDF to Word', description: 'Convert PDF documents to editable Word format' },
              { name: 'PDF to Excel', description: 'Extract tables and data from PDFs to Excel spreadsheets' },
              { name: 'PDF to PowerPoint', description: 'Convert PDF presentations to PowerPoint format' },
              { name: 'PDF to Image', description: 'Convert PDF pages to high-quality images (PNG, JPG)' },
              { name: 'Word to PDF', description: 'Convert Word documents to PDF format' },
              { name: 'Excel to PDF', description: 'Convert Excel spreadsheets to PDF' },
              { name: 'PowerPoint to PDF', description: 'Convert PowerPoint presentations to PDF' },
              { name: 'Image to PDF', description: 'Combine multiple images into a single PDF document' },
              { name: 'HTML to PDF', description: 'Convert web pages and HTML files to PDF' },
              { name: 'Text to PDF', description: 'Create PDFs from plain text files' },
              { name: 'PDF to EPUB', description: 'Convert PDFs to EPUB format for e-readers' }
            ]
          },
          {
            name: 'Edit',
            icon: Edit,
            tools: [
              { name: 'Fill PDF Forms', description: 'Fill out PDF forms with auto-fill capabilities and validation' },
              { name: 'Create Fillable Forms', description: 'Design interactive PDF forms with various field types' },
              { name: 'Add Text', description: 'Add text annotations and watermarks to PDFs' },
              { name: 'Add Images', description: 'Insert images into PDF documents' },
              { name: 'Highlight Text', description: 'Highlight important text in PDFs' },
              { name: 'Annotate PDF', description: 'Add comments, notes, and annotations' },
              { name: 'Redact Content', description: 'Permanently remove sensitive information from PDFs' },
              { name: 'Find and Replace', description: 'Search and replace text in PDF documents' },
              { name: 'Spell Check', description: 'Check spelling and grammar in PDF documents' },
              { name: 'Add Stamps', description: 'Add custom stamps and seals to documents' }
            ]
          },
          {
            name: 'Manage',
            icon: Merge,
            tools: [
              { name: 'Merge PDFs', description: 'Combine multiple PDF files into one document' },
              { name: 'Split PDF', description: 'Split PDFs into separate files by pages or bookmarks' },
              { name: 'Extract Pages', description: 'Extract specific pages from PDF documents' },
              { name: 'Delete Pages', description: 'Remove unwanted pages from PDFs' },
              { name: 'Reorder Pages', description: 'Rearrange page order in PDF documents' },
              { name: 'Insert PDF', description: 'Insert pages from another PDF into existing documents' },
              { name: 'Rotate Pages', description: 'Rotate PDF pages in 90-degree increments' },
              { name: 'Crop PDF', description: 'Crop PDF pages to remove unwanted margins' },
              { name: 'Add Page Numbers', description: 'Add automatic page numbering to PDFs' },
              { name: 'Add Header & Footer', description: 'Add custom headers and footers to PDF pages' },
              { name: 'PDF Bookmarks', description: 'Create and manage bookmarks for easy navigation' }
            ]
          },
          {
            name: 'Secure',
            icon: Lock,
            tools: [
              { name: 'Password Protect', description: 'Add password protection to PDF documents' },
              { name: 'Remove Password', description: 'Remove password protection from PDFs' },
              { name: 'Digital Signature', description: 'Add digital signatures with certificate-based authentication' },
              { name: 'Set Permissions', description: 'Control printing, copying, and editing permissions' },
              { name: 'Remove Metadata', description: 'Remove sensitive metadata from PDF files' },
              { name: 'Edit Metadata', description: 'Edit document properties and metadata' },
              { name: 'Encrypt PDF', description: 'Encrypt PDFs with AES encryption' },
              { name: 'Secure Sharing', description: 'Share documents with access controls and expiration' }
            ]
          },
          {
            name: 'Optimize',
            icon: Zap,
            tools: [
              { name: 'Compress PDF', description: 'Reduce PDF file size without losing quality' },
              { name: 'Optimize Images', description: 'Optimize images within PDFs to reduce file size' },
              { name: 'Optimize Fonts', description: 'Optimize font embedding to reduce file size' },
              { name: 'Remove Unused Objects', description: 'Clean up unused objects and resources' },
              { name: 'Linearize PDF', description: 'Optimize PDFs for fast web viewing' },
              { name: 'Color Optimization', description: 'Optimize color profiles for smaller file sizes' },
              { name: 'Quality Analysis', description: 'Analyze PDF quality and optimization opportunities' },
              { name: 'Batch Optimization', description: 'Optimize multiple PDFs at once' }
            ]
          },
          {
            name: 'OCR & Text Extraction',
            icon: Search,
            tools: [
              { name: 'OCR (Optical Character Recognition)', description: 'Extract text from scanned documents and images' },
              { name: 'Make Searchable', description: 'Convert scanned PDFs into searchable documents' },
              { name: 'Extract Text', description: 'Extract all text content from PDF documents' },
              { name: 'Extract Tables', description: 'Extract tables and structured data from PDFs' },
              { name: 'Handwriting Recognition', description: 'Recognize and extract handwritten text' },
              { name: 'Form Recognition', description: 'Automatically detect and extract form fields' }
            ]
          },
          {
            name: 'Advanced Tools',
            icon: Settings,
            tools: [
              { name: 'PDF Info', description: 'View detailed information about PDF documents' },
              { name: 'PDF Validator', description: 'Validate PDF structure and compliance' },
              { name: 'Compare PDFs', description: 'Compare two PDFs and highlight differences' },
              { name: 'Repair PDF', description: 'Fix corrupted or damaged PDF files' },
              { name: 'PDF Statistics', description: 'View comprehensive statistics about PDF documents' },
              { name: 'Calculate Fields', description: 'Perform calculations in PDF form fields' },
              { name: 'Document Tracking', description: 'Track document views and interactions' }
            ]
          }
        ]
      }
    },
    {
      id: 'templates',
      title: 'Legal Document Templates',
      icon: BookOpen,
      content: {
        overview: 'Access 45+ professionally drafted legal document templates covering business, employment, real estate, and personal use cases.',
        categories: [
          {
            name: 'Business',
            icon: Briefcase,
            templates: [
              'Non-Disclosure Agreement (NDA)',
              'Service Agreement',
              'Partnership Agreement',
              'Vendor Agreement',
              'Consulting Agreement',
              'License Agreement',
              'Franchise Agreement',
              'Distribution Agreement'
            ]
          },
          {
            name: 'Employment',
            icon: Users,
            templates: [
              'Employment Contract',
              'Independent Contractor Agreement',
              'Non-Compete Agreement',
              'Employee Handbook Acknowledgment',
              'Termination Agreement',
              'Offer Letter',
              'Confidentiality Agreement',
              'Severance Agreement'
            ]
          },
          {
            name: 'Real Estate',
            icon: Home,
            templates: [
              'Lease Agreement',
              'Purchase Agreement',
              'Rental Agreement',
              'Property Management Agreement',
              'Real Estate Sales Contract',
              'Tenant Application Form'
            ]
          },
          {
            name: 'Legal',
            icon: Scale,
            templates: [
              'Power of Attorney',
              'Last Will and Testament',
              'Living Will',
              'Trust Agreement',
              'Settlement Agreement',
              'Release of Liability'
            ]
          }
        ],
        features: [
          'AI-powered template generation',
          'Customizable fields and variables',
          'Jurisdiction-specific templates',
          'Real-time preview',
          'One-click document generation',
          'Legal compliance verification'
        ]
      }
    },
    {
      id: 'document-management',
      title: 'Document Management',
      icon: FileText,
      content: {
        overview: 'Comprehensive document management system with version control, collaboration, sharing, and analytics.',
        features: [
          {
            name: 'Document Storage',
            description: 'Secure cloud storage for all your documents with unlimited space on paid plans.',
            details: [
              'Organized folder structure',
              'Advanced search and filtering',
              'Document tagging and categorization',
              'Bulk operations support',
              'Document preview and thumbnails'
            ]
          },
          {
            name: 'Collaboration',
            description: 'Real-time collaboration features for teams to work together on documents.',
            details: [
              'Real-time document editing',
              'Comment and annotation system',
              'Version history and tracking',
              'Change notifications',
              'Collaborative review workflows'
            ]
          },
          {
            name: 'Sharing & Access Control',
            description: 'Share documents securely with granular access controls.',
            details: [
              'Public and private sharing links',
              'Password-protected sharing',
              'Expiration dates for shared links',
              'Access permission management',
              'Download and print restrictions',
              'View tracking and analytics'
            ]
          },
          {
            name: 'Analytics & Reporting',
            description: 'Track document usage, views, and engagement with comprehensive analytics.',
            details: [
              'Document view statistics',
              'User engagement metrics',
              'Sharing analytics',
              'Export reports',
              'Custom date ranges'
            ]
          }
        ]
      }
    },
    {
      id: 'api-integration',
      title: 'API Integration',
      icon: Code,
      content: {
        overview: 'Developer-friendly REST APIs for seamless integration with your existing systems and workflows.',
        features: [
          {
            name: 'E-Signature API',
            description: 'Integrate electronic signatures into your applications.',
            endpoints: [
              'Create and manage envelopes',
              'Send documents for signature',
              'Track signature status',
              'Retrieve signed documents',
              'Manage recipients and workflows'
            ]
          },
          {
            name: 'PDF Tools API',
            description: 'Access all PDF manipulation tools programmatically.',
            endpoints: [
              'Convert documents',
              'Merge and split PDFs',
              'Extract text and data',
              'Apply security settings',
              'OCR and text recognition'
            ]
          },
          {
            name: 'Document Management API',
            description: 'Manage documents, folders, and sharing programmatically.',
            endpoints: [
              'Upload and download documents',
              'Manage folders and organization',
              'Share documents with links',
              'Track document analytics',
              'Version control operations'
            ]
          },
          {
            name: 'Template API',
            description: 'Generate documents from templates using API calls.',
            endpoints: [
              'List available templates',
              'Generate documents from templates',
              'Customize template fields',
              'Retrieve generated documents'
            ]
          }
        ],
        benefits: [
          'RESTful API architecture',
          'Comprehensive documentation',
          'API key authentication',
          'Webhook support for events',
          'Rate limiting and quotas',
          'SDK support for popular languages'
        ]
      }
    },
    {
      id: 'security-compliance',
      title: 'Security & Compliance',
      icon: Shield,
      content: {
        overview: 'Enterprise-grade security and compliance with certifications and standards recognized worldwide.',
        security: [
          {
            name: 'Data Encryption',
            description: 'All data is encrypted both in transit and at rest.',
            details: [
              'TLS 1.3 for data in transit',
              'AES-256 encryption for data at rest',
              'End-to-end encryption for sensitive documents',
              'Secure key management'
            ]
          },
          {
            name: 'Authentication & Authorization',
            description: 'Multiple layers of authentication and fine-grained access controls.',
            details: [
              'JWT-based authentication',
              'Multi-factor authentication (MFA)',
              'Role-based access control (RBAC)',
              'Single Sign-On (SSO) support',
              'Session management'
            ]
          },
          {
            name: 'Audit Trails',
            description: 'Comprehensive logging and audit trails for compliance and security.',
            details: [
              'Complete document history',
              'User activity logging',
              'Signature audit trails',
              'Access log tracking',
              'Compliance reporting'
            ]
          }
        ],
        compliance: [
          {
            name: 'Legal Compliance',
            standards: [
              'eIDAS (European Union)',
              'ESIGN Act (United States)',
              'UETA (Uniform Electronic Transactions Act)',
              'PIPEDA (Canada)',
              'eSign Act compliance in 40+ countries'
            ]
          },
          {
            name: 'Industry Standards',
            standards: [
              'SOC 2 Type II certified',
              'GDPR compliant',
              'CCPA compliant',
              'HIPAA compliant (for healthcare)',
              'ISO 27001 certified'
            ]
          }
        ]
      }
    },
    {
      id: 'use-cases',
      title: 'Use Cases',
      icon: Target,
      content: {
        overview: 'Draft and Sign serves businesses and individuals across various industries and use cases.',
        cases: [
          {
            industry: 'Legal',
            icon: Scale,
            useCases: [
              'Contract management and execution',
              'Client engagement agreements',
              'Settlement agreements',
              'Legal document templates',
              'Compliance documentation'
            ]
          },
          {
            industry: 'Real Estate',
            icon: Home,
            useCases: [
              'Lease agreements',
              'Purchase contracts',
              'Property management documents',
              'Tenant applications',
              'Disclosure forms'
            ]
          },
          {
            industry: 'Human Resources',
            icon: Users,
            useCases: [
              'Employment contracts',
              'Onboarding documents',
              'NDAs and confidentiality agreements',
              'Performance reviews',
              'Termination documents'
            ]
          },
          {
            industry: 'Healthcare',
            icon: Heart,
            useCases: [
              'Patient consent forms',
              'HIPAA-compliant documentation',
              'Medical release forms',
              'Insurance forms',
              'Treatment agreements'
            ]
          },
          {
            industry: 'Finance',
            icon: DollarSign,
            useCases: [
              'Loan agreements',
              'Financial disclosures',
              'Investment documents',
              'Account opening forms',
              'Compliance documentation'
            ]
          },
          {
            industry: 'Education',
            icon: GraduationCap,
            useCases: [
              'Enrollment forms',
              'Student agreements',
              'Parent consent forms',
              'Scholarship applications',
              'Academic contracts'
            ]
          }
        ]
      }
    },
    {
      id: 'technology',
      title: 'Technology Stack',
      icon: Server,
      content: {
        overview: 'Built with modern technologies for scalability, performance, and reliability.',
        frontend: {
          title: 'Frontend',
          technologies: [
            { name: 'React 18', description: 'Modern React with hooks and functional components' },
            { name: 'TypeScript', description: 'Type-safe JavaScript for better code quality' },
            { name: 'Tailwind CSS', description: 'Utility-first CSS framework for rapid UI development' },
            { name: 'Vite', description: 'Fast build tool and development server' },
            { name: 'React Router', description: 'Client-side routing for single-page application' },
            { name: 'Lucide React', description: 'Beautiful and consistent icon library' }
          ]
        },
        backend: {
          title: 'Backend (Microservices)',
          technologies: [
            { name: 'Node.js', description: 'JavaScript runtime for server-side development' },
            { name: 'Express.js', description: 'Web application framework for REST APIs' },
            { name: 'MongoDB', description: 'NoSQL database for flexible data storage' },
            { name: 'JWT', description: 'JSON Web Tokens for secure authentication' },
            { name: 'Docker', description: 'Containerization for consistent deployments' },
            { name: 'Nginx', description: 'Reverse proxy and API gateway' }
          ]
        },
        services: [
          'Auth Service - User authentication and authorization',
          'E-Sign Service - Electronic signature processing',
          'PDF Service - PDF manipulation and conversion',
          'Document Service - Document management and storage',
          'Template Service - Legal template management',
          'Subscription Service - Billing and plan management'
        ]
      }
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Rocket,
      content: {
        overview: 'Start using Draft and Sign in minutes with our simple onboarding process.',
        steps: [
          {
            step: 1,
            title: 'Create Your Account',
            description: 'Sign up for free and get instant access to all basic features.',
            details: [
              'No credit card required',
              'Free plan with essential features',
              'Email verification',
              'Quick setup wizard'
            ]
          },
          {
            step: 2,
            title: 'Explore the Dashboard',
            description: 'Familiarize yourself with the intuitive dashboard and navigation.',
            details: [
              'Document management interface',
              'Quick access to PDF tools',
              'E-signature workflow creator',
              'Template library access'
            ]
          },
          {
            step: 3,
            title: 'Create Your First Document',
            description: 'Start by creating a document from a template or uploading your own.',
            details: [
              'Choose from 45+ legal templates',
              'Upload existing documents',
              'Use AI to generate documents',
              'Customize to your needs'
            ]
          },
          {
            step: 4,
            title: 'Send for Signature',
            description: 'Add recipients and send your document for electronic signature.',
            details: [
              'Add multiple signers',
              'Set signing order',
              'Configure authentication methods',
              'Send and track status'
            ]
          },
          {
            step: 5,
            title: 'Manage and Collaborate',
            description: 'Use document management features to organize and collaborate.',
            details: [
              'Organize documents in folders',
              'Share with team members',
              'Track document analytics',
              'Maintain version history'
            ]
          }
        ],
        resources: [
          {
            name: 'Documentation',
            link: '/api-documentation',
            description: 'Comprehensive API and feature documentation'
          },
          {
            name: 'Video Tutorials',
            link: '#',
            description: 'Step-by-step video guides for all features'
          },
          {
            name: 'Help & Support',
            link: '/help-support',
            description: 'Get help from our support team'
          },
          {
            name: 'Contact Sales',
            link: '/contact-sales',
            description: 'Talk to our sales team for enterprise solutions'
          }
        ]
      }
    }
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  return (
    <div className="min-h-screen mt-12 bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <style>{`
        .prose ul > li::before {
          content: none !important;
          display: none !important;
        }
        .prose ul {
          list-style: none !important;
          padding-left: 0 !important;
        }
        .prose ol > li::before {
          content: none !important;
          display: none !important;
        }
      `}</style>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#260559] to-blue-700 text-white py-20">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
              <BookOpen className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Draft and Sign Blog</h1>
            <p className="text-xl text-blue-100 mb-8">
              Everything you need to know about our comprehensive document management and e-signature platform
            </p>
          </div>
        </div>
      </section>

      <div className="container-max px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Table of Contents</h2>
                <nav className="space-y-2">
                  {blogSections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeSection === section.id
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{section.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-12">
              {blogSections.map((section) => {
                const Icon = section.icon;
                return (
                  <article
                    key={section.id}
                    id={section.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 scroll-mt-24"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-indigo-100 rounded-lg">
                        <Icon className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900">{section.title}</h2>
                    </div>

                    <div className="prose prose-lg max-w-none">
                      <p className="text-lg text-gray-600 mb-6">{section.content.overview}</p>

                      {/* Introduction Section */}
                      {section.id === 'introduction' && (
                        <div className="space-y-6">
                          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-100">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Highlights</h3>
                            <ul className="space-y-3 !list-none" style={{ listStyle: 'none', paddingLeft: 0 }}>
                              {section.content.keyPoints?.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                  <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                                  <span className="text-gray-700">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* E-Signature Section */}
                      {section.id === 'esignature' && (
                        <div className="space-y-8">
                          {(section.content.features as { name: string; description: string; details: string[] }[] | undefined)?.map((feature: { name: string; description: string; details: string[] }, idx: number) => (
                            <div key={idx} className="border-l-4 border-indigo-500 pl-6">
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.name}</h3>
                              <p className="text-gray-600 mb-4">{feature.description}</p>
                              <ul className="space-y-2 !list-none" style={{ listStyle: 'none', paddingLeft: 0 }}>
                                {feature.details.map((detail: string, detailIdx: number) => (
                                  <li key={detailIdx} className="flex items-start gap-2 text-gray-700">
                                    <ChevronRight className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-1" />
                                    <span>{detail}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* PDF Tools Section */}
                      {section.id === 'pdftools' && (
                        <div className="space-y-8">
                          {(section.content.categories as { name: string; icon: React.ComponentType<{ className?: string }>; tools: { name: string; description: string }[] }[] | undefined)?.map((category: { name: string; icon: React.ComponentType<{ className?: string }>; tools: { name: string; description: string }[] }, idx: number) => {
                            const CategoryIcon = category.icon;
                            return (
                              <div key={idx} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2 bg-indigo-100 rounded-lg">
                                    <CategoryIcon className="w-5 h-5 text-indigo-600" />
                                  </div>
                                  <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                  {category.tools.map((tool: { name: string; description: string }, toolIdx: number) => (
                                    <div key={toolIdx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <h4 className="font-medium text-gray-900">{tool.name}</h4>
                                        <p className="text-sm text-gray-600">{tool.description}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Templates Section */}
                      {section.id === 'templates' && (
                        <div className="space-y-8">
                            {(section.content.categories as { name: string; icon: React.ComponentType<{ className?: string }>; templates: string[] }[] | undefined)?.map((category: { name: string; icon: React.ComponentType<{ className?: string }>; templates: string[] }, idx: number) => {
                              const CategoryIcon = category.icon;
                              return (
                                <div key={idx} className="border border-gray-200 rounded-lg p-6">
                                  <div className="flex items-center gap-3 mb-4">
                                    <CategoryIcon className="w-5 h-5 text-indigo-600" />
                                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                                  </div>
                                  <ul className="space-y-2 !list-none" style={{ listStyle: 'none', paddingLeft: 0 }}>
                                    {category.templates.map((template: string, templateIdx: number) => (
                                      <li key={templateIdx} className="flex items-start gap-2 text-gray-700">
                                        <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                                        <span>{template}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })}
                          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Features</h3>
                            <div className="grid md:grid-cols-2 gap-3">
                              {(section.content.features as string[] | undefined)?.map((feature: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-blue-600" />
                                  <span className="text-gray-700">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Document Management Section */}
                      {section.id === 'document-management' && (
                        <div className="space-y-6">
                          {(section.content.features as { name: string; description: string; details: string[] }[] | undefined)?.map((feature: { name: string; description: string; details: string[] }, idx: number) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-6">
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.name}</h3>
                              <p className="text-gray-600 mb-4">{feature.description}</p>
                              <ul className="grid md:grid-cols-2 gap-2 !list-none" style={{ listStyle: 'none', paddingLeft: 0 }}>
                                {feature.details.map((detail: string, detailIdx: number) => (
                                  <li key={detailIdx} className="flex items-start gap-2 text-gray-700">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">{detail}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* API Integration Section */}
                      {section.id === 'api-integration' && (
                        <div className="space-y-6">
                          {(section.content.features as { name: string; description: string; endpoints: string[] }[] | undefined)?.map((feature: { name: string; description: string; endpoints: string[] }, idx: number) => (
                            <div key={idx} className="border-l-4 border-blue-500 pl-6">
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.name}</h3>
                              <p className="text-gray-600 mb-4">{feature.description}</p>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-2">Available Endpoints:</h4>
                                <ul className="space-y-1 !list-none" style={{ listStyle: 'none', paddingLeft: 0 }}>
                                  {feature.endpoints?.map((endpoint: string, endpointIdx: number) => (
                                    <li key={endpointIdx} className="flex items-start gap-2 text-sm text-gray-700">
                                      <Code className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                      <span>{endpoint}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                          <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">API Benefits</h3>
                            <div className="grid md:grid-cols-2 gap-3">
                              {section.content.benefits?.map((benefit, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Award className="w-4 h-4 text-indigo-600" />
                                  <span className="text-gray-700">{benefit}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Security & Compliance Section */}
                      {section.id === 'security-compliance' && (
                        <div className="space-y-8">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Security Features</h3>
                            <div className="space-y-4">
                              {section.content.security?.map((item, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-lg p-6">
                                  <h4 className="font-semibold text-gray-900 mb-2">{item.name}</h4>
                                  <p className="text-gray-600 mb-3">{item.description}</p>
                                  <ul className="space-y-2 !list-none" style={{ listStyle: 'none', paddingLeft: 0 }}>
                                    {item.details.map((detail, detailIdx) => (
                                      <li key={detailIdx} className="flex items-start gap-2 text-gray-700">
                                        <Shield className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm">{detail}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Compliance Standards</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                              {section.content.compliance?.map((item, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-lg p-6">
                                  <h4 className="font-semibold text-gray-900 mb-3">{item.name}</h4>
                                  <ul className="space-y-2 !list-none" style={{ listStyle: 'none', paddingLeft: 0 }}>
                                    {item.standards.map((standard, standardIdx) => (
                                      <li key={standardIdx} className="flex items-start gap-2 text-gray-700">
                                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm">{standard}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Use Cases Section */}
                      {section.id === 'use-cases' && (
                        <div className="grid md:grid-cols-2 gap-6">
                          {section.content.cases?.map((useCase, idx) => {
                            const CaseIcon = useCase.icon;
                            return (
                              <div key={idx} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2 bg-indigo-100 rounded-lg">
                                    <CaseIcon className="w-5 h-5 text-indigo-600" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-gray-900">{useCase.industry}</h3>
                                </div>
                                <ul className="space-y-2 !list-none" style={{ listStyle: 'none', paddingLeft: 0 }}>
                                  {useCase.useCases.map((uc, ucIdx) => (
                                    <li key={ucIdx} className="flex items-start gap-2 text-gray-700">
                                      <ArrowRight className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                                      <span className="text-sm">{uc}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Technology Stack Section */}
                      {section.id === 'technology' && (
                        <div className="space-y-8">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">{section.content.frontend?.title}</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                              {section.content.frontend?.technologies.map((tech, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                                  <h4 className="font-semibold text-gray-900 mb-1">{tech.name}</h4>
                                  <p className="text-sm text-gray-600">{tech.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">{section.content.backend?.title}</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                              {section.content.backend?.technologies.map((tech, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                                  <h4 className="font-semibold text-gray-900 mb-1">{tech.name}</h4>
                                  <p className="text-sm text-gray-600">{tech.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Microservices Architecture</h3>
                            <div className="space-y-3">
                              {section.content.services?.map((service, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                  <Server className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                                  <span className="text-gray-700">{service}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Getting Started Section */}
                      {section.id === 'getting-started' && (
                        <div className="space-y-8">
                          <div className="space-y-6">
                            {section.content.steps?.map((step, idx) => (
                              <div key={idx} className="border-l-4 border-indigo-500 pl-6">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-full font-bold">
                                    {step.step}
                                  </div>
                                  <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                                </div>
                                <p className="text-gray-600 mb-4">{step.description}</p>
                                <ul className="grid md:grid-cols-2 gap-2 !list-none" style={{ listStyle: 'none', paddingLeft: 0 }}>
                                  {step.details.map((detail, detailIdx) => (
                                    <li key={detailIdx} className="flex items-start gap-2 text-gray-700">
                                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                      <span className="text-sm">{detail}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Helpful Resources</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                              {section.content.resources?.map((resource, idx) => (
                                <Link
                                  key={idx}
                                  to={resource.link}
                                  className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow border border-gray-200"
                                >
                                  <BookOpen className="w-5 h-5 text-indigo-600" />
                                  <div>
                                    <h4 className="font-medium text-gray-900">{resource.name}</h4>
                                    <p className="text-sm text-gray-600">{resource.description}</p>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-16 bg-gradient-to-r from-[#260559] to-blue-700 rounded-xl p-8 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-blue-100 mb-6">
              Join thousands of users who trust Draft and Sign for their document management needs
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#260559] rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <Rocket className="w-5 h-5" />
                Sign Up Free
              </Link>
              <Link
                to="/contact-sales"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                <Mail className="w-5 h-5" />
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;

