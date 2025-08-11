import { FileText, Zap, Shield, Globe, Users, Code, Award } from 'lucide-react'

const ModernDocumentFeatures = () => {
  const features = [
    {
      icon: Zap,
      title: "AI-Powered E-Signatures",
      description: "Smart signature detection and fraud prevention with machine learning algorithms.",
      color: "bg-blue-500"
    },
    {
      icon: FileText,
      title: "Smart Document Generation",
      description: "Create legal documents from natural language prompts in seconds.",
      color: "bg-purple-500"
    },
    {
      icon: Shield,
      title: "Complete PDF Suite",
      description: "Convert, merge, split, protect, and edit PDFs with advanced OCR capabilities.",
      color: "bg-green-500"
    },
    {
      icon: Award,
      title: "Legal Template Library",
      description: "20+ professionally drafted legal templates for any business need.",
      color: "bg-orange-500"
    },
    {
      icon: Globe,
      title: "Global Compliance",
      description: "GDPR, HIPAA, eIDAS compliant with country-specific legal requirements.",
      color: "bg-emerald-500"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Process documents 10x faster with automated workflows and smart routing.",
      color: "bg-yellow-500"
    },
    {
      icon: Code,
      title: "API Integration",
      description: "Seamlessly integrate with your existing tools and workflows.",
      color: "bg-indigo-500"
    },
    {
      icon: Users,
      title: "Multi-Language Support",
      description: "Support for 25+ languages with localized legal requirements.",
      color: "bg-pink-500"
    }
  ]

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for <span className="gradient-text">Modern Documents</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful AI-driven features that transform how you create, manage, and sign documents. 
            More than just e-signatures - it's a complete document ecosystem.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 card-hover">
              <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-6`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            All features included in every plan
          </div>
        </div>
      </div>
    </section>
  )
}

export default ModernDocumentFeatures