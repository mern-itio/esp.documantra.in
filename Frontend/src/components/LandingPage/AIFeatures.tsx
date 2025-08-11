import { Brain, Scan, FileSearch, PenTool, Zap, ArrowRight } from 'lucide-react'

const AIFeatures = () => {
  const features = [
    {
      icon: Scan,
      title: "Auto-detect Signature Fields",
      description: "AI automatically identifies where signatures are needed in uploaded documents",
      color: "bg-blue-500"
    },
    {
      icon: FileSearch,
      title: "Smart Template Generation",
      description: "Generate legal templates from document uploads using advanced AI analysis",
      color: "bg-purple-500"
    },
    {
      icon: PenTool,
      title: "AI-Assisted Legal Writing",
      description: "Get suggestions for legal language and proofreading assistance",
      color: "bg-green-500"
    },
    {
      icon: Brain,
      title: "OCR & Summarization",
      description: "Extract text from images and generate document summaries automatically",
      color: "bg-orange-500"
    }
  ]

  return (
    <section className="section-padding bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="container-max">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-purple-300" />
            <span className="text-purple-300 font-medium">AI-Powered</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Intelligent Document Processing
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Leverage artificial intelligence to streamline your document workflows
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 card-hover">
              <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-6`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
              <p className="text-gray-300 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Demo Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-yellow-400" />
                <span className="text-yellow-400 font-medium">Coming Soon</span>
              </div>
              <h3 className="text-2xl font-bold text-white">
                AI Document Assistant
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Our AI assistant will help you create, review, and optimize your documents with intelligent suggestions and automated workflows.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Natural language document creation</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Intelligent field placement</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Automated compliance checking</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Smart recipient suggestions</span>
                </li>
              </ul>
            </div>

            {/* Mock AI Interface */}
            <div className="bg-gray-900 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-700">
                <Brain className="h-5 w-5 text-purple-400" />
                <span className="text-white font-medium">AI Assistant</span>
                <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>

              <div className="space-y-3">
                <div className="bg-purple-600/20 rounded-lg p-3">
                  <p className="text-purple-200 text-sm">
                    "Create a non-disclosure agreement for a software development project"
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-300 text-sm">
                    I'll create an NDA template for your software project. I've identified the key fields needed:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-gray-400">
                    <li>• Company names and addresses</li>
                    <li>• Project description</li>
                    <li>• Confidentiality period</li>
                    <li>• Signature fields</li>
                  </ul>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse"></div>
                  <span>AI is typing...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <button className="flex items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-100 font-semibold text-base px-6 py-3 rounded-md shadow-md hover:shadow-lg transition-all duration-200 mx-auto">
            See AI in Action
            <ArrowRight className="h-4 w-4 align-middle" />
          </button>
        </div>

      </div>
    </section>
  )
}

export default AIFeatures