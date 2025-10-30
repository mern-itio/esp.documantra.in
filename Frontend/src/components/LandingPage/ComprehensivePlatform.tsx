import { FileText, Edit, Users, Send, Shield, Zap, CheckCircle, ArrowRight, Upload, Eye, Building } from 'lucide-react'
import { Link } from 'react-router-dom'

const ComprehensivePlatform = () => {
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
    }
  ]

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
    }
  ]

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
  ]

  return (
    <section className="section-padding bg-gradient-to-br from-gray-50 to-white">
      <div className="container-max">
        {/* Main Title */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Complete Document Lifecycle Management
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            From creation to signature, DocuSigner handles every aspect of your document workflow.
            Prepare, generate, edit, compare, sign, and distribute - all with enterprise-grade security and compliance.
          </p>
        </div>

        {/* Platform Features Grid */}
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 mb-16">
          {platformFeatures.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 transition-colors duration-200 hover:border-primary-500 hover:shadow-xl cursor-pointer">
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

        {/* Workflow Process */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Streamlined Document Workflow
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our intelligent platform guides you through every step of the document lifecycle
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {workflowSteps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {step.step}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
                <p className="text-gray-600 text-sm">{step.description}</p>

                {/* Arrow for desktop */}
                {index < workflowSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 -right-4 transform">
                    <ArrowRight className="h-6 w-6 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div key={index} className=" cursor-pointer border border-transparent hover:border-blue-500 text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <benefit.icon className="h-6 w-6 text-primary-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{benefit.title}</h4>
              <p className="text-gray-600 text-sm">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Team Sharing Feature Highlight */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 mb-12 text-white">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Building className="h-8 w-8 text-indigo-200" />
                <span className="text-indigo-200 font-medium">Paid Plans Feature</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                Team Organization & Document Sharing
              </h3>
              <p className="text-indigo-100 mb-6 leading-relaxed">
                Create your organization and invite team members with customizable role-based permissions.
                Share documents seamlessly across your team while maintaining complete control over access rights and collaboration levels.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-indigo-200" />
                  <span className="text-indigo-100">Create unlimited organizations</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-indigo-200" />
                  <span className="text-indigo-100">Invite unlimited team members</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-indigo-200" />
                  <span className="text-indigo-100">Role-based access control</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-indigo-200" />
                  <span className="text-indigo-100">Shared document libraries</span>
                </li>
              </ul>
            </div>

            {/* Mock Organization Interface */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="bg-white rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">Acme Corp Organization</h4>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">JD</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">John Doe</div>
                      <div className="text-xs text-gray-500">Admin • Full Access</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">SM</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Sarah Miller</div>
                      <div className="text-xs text-gray-500">Editor • Can Edit & Sign</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">MJ</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Mike Johnson</div>
                      <div className="text-xs text-gray-500">Viewer • Read Only</div>
                    </div>
                  </div>
                </div>
                <Link to="/login">
                  <button className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                    + Invite Team Member
                  </button>

                </Link>

              </div>
            </div>
          </div>
        </div>

        {/* Free Plan Highlight */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-center text-white">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Start with Our Free Forever Plan
            </h3>
            <p className="text-primary-100 mb-6 text-lg">
              Get full access to all platform features with generous usage limits.
              Perfect for individuals and small teams to experience the complete DocuSigner ecosystem.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">10</div>
                <div className="text-primary-100 text-sm">Envelopes/month</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">30+</div>
                <div className="text-primary-100 text-sm">Free PDF tools</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">10</div>
                <div className="text-primary-100 text-sm">Legal templates/month</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* Primary Filled (White with Icon) */}
              <Link to="/signup">
               <button className="flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-gray-100 font-semibold text-base px-6 py-3 rounded-md shadow-md transition-all duration-200">
                Start Free Forever
                <ArrowRight className="h-4 w-4 align-middle" />
              </button>
              </Link>
             

                <Link to="/login">
              <button className="flex items-center justify-center gap-2 border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold text-base px-6 py-3 rounded-md transition-all duration-200">
                View All Features
              </button>
              </Link>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

export default ComprehensivePlatform