import { Link } from 'react-router-dom';
import {
  FileText, Edit, Users, Send, Shield, Zap, CheckCircle,
  ArrowRight, Upload, Eye, Building,
  PenTool, BarChart3, Database, Settings, Globe, Code
} from 'lucide-react';

const AllInOnePlatformPage = () => {
  const platformFeatures = [
    {
      icon: Upload,
      title: "Document Preparation",
      description: "Upload any document format or create from scratch with our intelligent templates",
      features: ["Multi-format support", "Smart templates", "Bulk upload", "Auto-formatting"],
      color: "bg-blue-500"
    },
    {
      icon: Zap,
      title: "AI-Powered Generation",
      description: "Generate legal documents instantly using natural language prompts",
      features: ["Natural language input", "Legal compliance", "Custom fields", "Instant generation"],
      color: "bg-purple-500"
    },
    {
      icon: Edit,
      title: "Advanced Editing Suite",
      description: "Professional editing tools with real-time collaboration and version control",
      features: ["Real-time editing", "Version history", "Collaborative review", "Track changes"],
      color: "bg-green-500"
    },
    {
      icon: Eye,
      title: "Document Comparison",
      description: "Compare documents side-by-side with intelligent difference detection",
      features: ["Side-by-side view", "Change highlighting", "Merge conflicts", "Export reports"],
      color: "bg-orange-500"
    },
    {
      icon: Users,
      title: "E-Signature Workflows",
      description: "Secure electronic signatures with custom signing orders and notifications",
      features: ["Multi-signer support", "Custom workflows", "Auto-reminders", "Legal compliance"],
      color: "bg-indigo-500"
    },
    {
      icon: Send,
      title: "Smart Distribution",
      description: "Send documents with tracking, notifications, and automated follow-ups",
      features: ["Delivery tracking", "Read receipts", "Auto-reminders", "Bulk sending"],
      color: "bg-pink-500"
    },
    {
      icon: FileText,
      title: "PDF Tools Suite",
      description: "30+ professional PDF tools for editing, converting, merging, and more",
      features: ["Format conversion", "Compression", "Merging & splitting", "OCR technology"],
      color: "bg-red-500"
    },
    {
      icon: PenTool,
      title: "Legal Templates",
      description: "45+ professionally drafted legal templates for business and personal use",
      features: ["Customizable templates", "Legal compliance", "Industry-specific", "Regular updates"],
      color: "bg-yellow-500"
    }
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "Prepare & Generate",
      description: "Upload documents or generate new ones using AI-powered templates",
      icon: FileText
    },
    {
      step: "02",
      title: "Edit & Customize",
      description: "Use advanced editing tools to customize and perfect your documents",
      icon: Edit
    },
    {
      step: "03",
      title: "Compare & Review",
      description: "Compare versions and collaborate with team members for review",
      icon: Eye
    },
    {
      step: "04",
      title: "Sign & Send",
      description: "Collect signatures and distribute final documents securely",
      icon: Send
    },
    {
      step: "05",
      title: "Track & Manage",
      description: "Monitor document status and manage your document library",
      icon: BarChart3
    },
    {
      step: "06",
      title: "Store & Archive",
      description: "Securely store and archive documents for future reference",
      icon: Database
    }
  ];

  const integrations = [
    {
      name: "Google Workspace",
      description: "Seamlessly integrate with Google Drive, Gmail, and Google Calendar",
      icon: "G"
    },
    {
      name: "Microsoft 365",
      description: "Connect with Microsoft Word, OneDrive, and Outlook",
      icon: "M"
    },
    {
      name: "Salesforce",
      description: "Automate document workflows within your CRM",
      icon: "S"
    },
    {
      name: "Dropbox",
      description: "Sync documents with your Dropbox storage",
      icon: "D"
    },
    {
      name: "Slack",
      description: "Get notifications and manage documents from Slack",
      icon: "S"
    },
    {
      name: "Zapier",
      description: "Connect with 3,000+ apps for unlimited automation",
      icon: "Z"
    }
  ];

  const benefits = [
    {
      icon: CheckCircle,
      title: "All-in-One Solution",
      description: "Everything you need in one platform - no more switching between tools"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption and compliance with global regulations"
    },
    {
      icon: Zap,
      title: "10x Faster Processing",
      description: "Automated workflows reduce document processing time dramatically"
    },
    {
      icon: Building,
      title: "Team Organization",
      description: "Create organizations, invite team members, and share documents with role-based permissions"
    }
  ];

  const useCases = [
    {
      title: "Contract Management",
      description: "Streamline your entire contract lifecycle from creation to signing and renewal",
      steps: [
        "Generate contracts using AI or templates",
        "Collaborate on edits with stakeholders",
        "Secure electronic signatures from all parties",
        "Store and manage contracts in a centralized repository",
        "Set up automated renewal reminders"
      ]
    },
    {
      title: "HR Document Processing",
      description: "Simplify employee onboarding, policy management, and HR documentation",
      steps: [
        "Create standardized onboarding packets",
        "Collect employee signatures efficiently",
        "Maintain digital personnel files",
        "Distribute and track policy acknowledgments",
        "Generate employment verification documents"
      ]
    },
    {
      title: "Legal Document Preparation",
      description: "Draft, review, and execute legal documents with confidence",
      steps: [
        "Access professional legal templates",
        "Customize documents to your specific needs",
        "Collaborate with clients and colleagues",
        "Collect legally binding signatures",
        "Maintain secure document archives"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white pt-24">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Complete Document Lifecycle <span className="gradient-text">Management</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              From creation to signature, Draft&Sign handles every aspect of your document workflow in one integrated platform. No more juggling multiple tools or subscriptions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/signup"
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                Start Free Forever
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                to="/demo"
                className="btn-secondary inline-flex items-center justify-center"
              >
                Watch Demo
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section className="py-16 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              One Platform, Complete Solution
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Draft&Sign combines all the tools you need for document management in a single, intuitive platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {platformFeatures.map((feature, index) => (
              <div key={index} className="card-hover border border-gray-100 hover:border-primary-500 hover:shadow-xl cursor-pointer transition-all bg-white rounded-xl p-6 shadow-lg ">
                <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-6`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Process */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Streamlined Document Workflow
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our intelligent platform guides you through every step of the document lifecycle
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {workflowSteps.map((step, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md card-hover border border-gray-100 hover:border-primary-500 hover:shadow-xl cursor-pointer transition-all relative">
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {step.step}
                </div>
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                  <step.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose an All-in-One Solution?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the advantages of consolidating your document workflow in a single platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="card-hover border border-gray-100 hover:border-primary-500 hover:shadow-xl cursor-pointer transition-all text-center p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-all duration-200">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="real-world-use-cases" className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Real-World Use Cases
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how organizations use Draft&Sign to streamline their document processes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="card-hover border border-gray-100 hover:border-primary-500 hover:shadow-xl cursor-pointer transition-all bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{useCase.title}</h3>
                <p className="text-gray-600 mb-6">{useCase.description}</p>
                <div className="space-y-4">
                  {useCase.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-primary-600 text-xs font-bold">{stepIndex + 1}</span>
                      </div>
                      <span className="text-gray-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Seamless Integrations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Draft&Sign connects with your favorite tools to create a unified workflow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {integrations.map((integration, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  {integration.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                  <p className="text-sm text-gray-600">{integration.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/api-documentation" className="inline-flex items-center text-primary-600 font-medium hover:text-primary-700">
              View all integrations
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Developer-Friendly API
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Integrate Draft&Sign's powerful features directly into your applications with our comprehensive API. Build custom document workflows that fit your exact needs.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">RESTful API with comprehensive documentation</span>
                    <p className="text-sm text-gray-600 mt-1">Clear, well-documented endpoints for all platform features</p>
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

      {/* Team Collaboration */}
      <section className="py-16 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-gray-50 rounded-xl p-8 shadow-lg">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">Acme Corp Organization</h4>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">JD</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">John Doe</div>
                      <div className="text-xs text-gray-500">Admin • Full Access</div>
                    </div>
                    <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Online</div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">SM</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Sarah Miller</div>
                      <div className="text-xs text-gray-500">Editor • Can Edit & Sign</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">MJ</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Mike Johnson</div>
                      <div className="text-xs text-gray-500">Viewer • Read Only</div>
                    </div>
                  </div>
                </div>
                <Link to='/login'>
                  <button className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                    + Invite Team Member
                  </button>
                </Link>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Team Collaboration & Organization
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Create your organization and invite team members with customizable role-based permissions. Share documents seamlessly across your team while maintaining complete control over access rights.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Role-Based Access Control</span>
                    <p className="text-sm text-gray-600 mt-1">Assign specific permissions to team members based on their role</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Real-Time Collaboration</span>
                    <p className="text-sm text-gray-600 mt-1">Work on documents simultaneously with team members</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Shared Document Libraries</span>
                    <p className="text-sm text-gray-600 mt-1">Create centralized repositories for team access</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Activity Tracking</span>
                    <p className="text-sm text-gray-600 mt-1">Monitor document activity and user actions</p>
                  </div>
                </li>
              </ul>
              <Link to="/login" className="btn-primary inline-flex items-center">
                Explore Team Features
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Savings Calculator */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Calculate Your Savings
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how much you can save by switching to Draft&Sign's all-in-one platform
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Typical Costs with Multiple Tools</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">E-Signature Solution</span>
                    <span className="font-bold">$25-50/month</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">PDF Editor</span>
                    <span className="font-bold">$15-30/month</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Document Management</span>
                    <span className="font-bold">$10-25/month</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Legal Template Services</span>
                    <span className="font-bold">$15-40/month</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg font-bold">
                    <span>Total Cost</span>
                    <span className="text-red-600">$65-145/month</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Draft&Sign All-in-One Cost</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-primary-50 rounded-lg">
                    <span className="font-medium">Free Plan</span>
                    <span className="font-bold">$0/month</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary-50 rounded-lg">
                    <span className="font-medium">Starter Plan</span>
                    <span className="font-bold">$10/month</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary-50 rounded-lg">
                    <span className="font-medium">Business Plan</span>
                    <span className="font-bold">$30/month</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary-50 rounded-lg">
                    <span className="font-medium">Enterprise Plan</span>
                    <span className="font-bold">Custom</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-100 rounded-lg font-bold">
                    <span>Potential Savings</span>
                    <span className="text-green-600">Up to 80%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                to="/pricing"
                className="btn-primary inline-flex items-center gap-2"
              >
                View Detailed Pricing
                <ArrowRight className="h-5 w-5" />
              </Link>

            </div>
          </div>
        </div>
      </section>

      {/* Global Accessibility */}
      <section className="py-16 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Global Accessibility & Compliance
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Draft&Sign's platform is designed to be accessible worldwide, with compliance features for 40+ countries and support for multiple languages.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Multi-Language Support</span>
                    <p className="text-sm text-gray-600 mt-1">Interface and documents available in 25+ languages</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Regional Compliance</span>
                    <p className="text-sm text-gray-600 mt-1">Adherence to local e-signature and data protection laws</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Data Residency Options</span>
                    <p className="text-sm text-gray-600 mt-1">Store your data in specific geographic regions</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Settings className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Accessibility Compliance</span>
                    <p className="text-sm text-gray-600 mt-1">WCAG 2.1 AA compliant for users with disabilities</p>
                  </div>
                </li>
              </ul>
              <Link to="/global-compliance" className="btn-primary inline-flex items-center">
                Learn About Global Compliance
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            <div className="bg-gray-50 rounded-xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Supported Regions</h3>
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
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-2xl">🇦🇺</span>
                  <div>
                    <div className="font-medium text-gray-900">Australia</div>
                    <div className="text-xs text-gray-500">Electronic Transactions Act</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-2xl">🌏</span>
                  <div>
                    <div className="font-medium text-gray-900">35+ More Countries</div>
                    <div className="text-xs text-gray-500">Global Coverage</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Use Cases */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Detailed Use Cases
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how Draft&Sign's all-in-one platform transforms document workflows
            </p>
          </div>

          <div className="space-y-12">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{useCase.title}</h3>
                <p className="text-lg text-gray-600 mb-6">{useCase.description}</p>
                <div className="grid md:grid-cols-5 gap-4">
                  {useCase.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="relative">
                      {stepIndex < useCase.steps.length - 1 && (
                        <div className="absolute top-1/2 right-0 w-full h-0.5 bg-gray-200 -z-10 hidden md:block"></div>
                      )}
                      <div className="bg-primary-50 rounded-lg p-4 relative z-10">
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm mb-3 mx-auto">
                          {stepIndex + 1}
                        </div>
                        <p className="text-center text-gray-700 text-sm">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Streamline Your Document Workflow?
            </h2>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Join thousands of organizations who trust Draft&Sign's all-in-one platform for their document management,
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

export default AllInOnePlatformPage;