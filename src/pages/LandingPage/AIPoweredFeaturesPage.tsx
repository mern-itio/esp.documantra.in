import { Link } from 'react-router-dom';
import { 
  Brain, Scan, FileSearch, PenTool, Zap, ArrowRight, 
  CheckCircle, MessageSquare, Sparkles,
  Eye, AlertTriangle, Code, Database, Lock,
  Send
} from 'lucide-react';

const AIPoweredFeaturesPage = () => {
  const aiFeatures = [
    {
      icon: Scan,
      title: "Auto-detect Signature Fields",
      description: "Our AI automatically identifies where signatures, initials, dates, and other form fields are needed in your documents.",
      benefits: [
        "Save 90% of setup time for signature requests",
        "Eliminate manual field placement",
        "Reduce errors and missed signature fields",
        "Works with any document format"
      ],
      color: "bg-blue-500"
    },
    {
      icon: FileSearch,
      title: "Smart Template Generation",
      description: "Generate legal templates from document uploads or create new documents from simple text prompts using advanced AI analysis.",
      benefits: [
        "Create legal documents in seconds",
        "Customize templates to your specific needs",
        "Ensure legal compliance across jurisdictions",
        "Save thousands in legal consulting fees"
      ],
      color: "bg-purple-500"
    },
    {
      icon: PenTool,
      title: "AI-Assisted Legal Writing",
      description: "Get intelligent suggestions for legal language, clause improvements, and proofreading assistance as you draft documents.",
      benefits: [
        "Improve clarity and precision in legal documents",
        "Identify potential issues before they become problems",
        "Ensure consistent terminology throughout documents",
        "Reduce review cycles with better first drafts"
      ],
      color: "bg-green-500"
    },
    {
      icon: Brain,
      title: "OCR & Summarization",
      description: "Extract text from images and scanned documents, then generate concise summaries of lengthy documents automatically.",
      benefits: [
        "Make any document searchable and editable",
        "Quickly understand key points in lengthy contracts",
        "Extract important data from legacy documents",
        "Save hours of manual review time"
      ],
      color: "bg-orange-500"
    },
    {
      icon: MessageSquare,
      title: "Intelligent Document Analysis",
      description: "Our AI analyzes documents to identify risks, inconsistencies, and opportunities for improvement.",
      benefits: [
        "Highlight potential legal risks automatically",
        "Compare against best practices",
        "Identify missing clauses or provisions",
        "Ensure compliance with regulations"
      ],
      color: "bg-red-500"
    },
    {
      icon: Sparkles,
      title: "Smart Document Comparison",
      description: "AI-powered document comparison that goes beyond simple text differences to understand semantic changes.",
      benefits: [
        "Identify substantive changes between versions",
        "Understand the impact of modifications",
        "Track changes across multiple document versions",
        "Generate comprehensive change reports"
      ],
      color: "bg-indigo-500"
    }
  ];

  const useCases = [
    {
      title: "Legal Contract Review",
      description: "AI analyzes contracts to identify risks, unusual clauses, and missing elements",
      steps: [
        "Upload contract for AI analysis",
        "Receive risk assessment and suggestions",
        "Review highlighted sections and recommendations",
        "Make informed decisions based on AI insights"
      ]
    },
    {
      title: "Document Generation",
      description: "Create custom legal documents from simple text prompts",
      steps: [
        "Describe document needs in plain language",
        "AI generates document draft with proper legal language",
        "Review and customize as needed",
        "Finalize and send for signature"
      ]
    },
    {
      title: "Automated Form Preparation",
      description: "Convert any document into a signable form with AI-detected fields",
      steps: [
        "Upload any document format",
        "AI automatically detects required fields",
        "Review and adjust field placement if needed",
        "Send for signature with one click"
      ]
    }
  ];

  const testimonials = [
    {
      quote: "The AI field detection has cut our document preparation time by 85%. What used to take hours now takes minutes.",
      author: "Michael Chen",
      position: "Legal Operations Director",
      company: "Global Financial Services"
    },
    {
      quote: "DocuSigner's AI document generation has transformed how we create legal documents. The quality and accuracy are impressive.",
      author: "Sarah Johnson",
      position: "General Counsel",
      company: "TechCorp Inc."
    },
    {
      quote: "The document analysis feature has helped us identify several critical issues in contracts that we would have otherwise missed.",
      author: "David Rodriguez",
      position: "Contract Manager",
      company: "Enterprise Solutions"
    }
  ];

  const faqItems = [
    {
      question: "How accurate is the AI signature field detection?",
      answer: "Our AI field detection achieves over 95% accuracy for standard documents and contracts. The system continuously improves through machine learning as more documents are processed. For complex or non-standard documents, you can always manually adjust field placement after AI detection."
    },
    {
      question: "Is my data used to train the AI?",
      answer: "No, your documents and data are private and secure. We do not use customer documents to train our AI models. Our models are pre-trained on public legal documents and templates, and we use anonymized usage patterns only to improve the system's performance."
    },
    {
      question: "What languages does the AI support?",
      answer: "Our AI currently supports document analysis and generation in English, Spanish, French, German, Italian, Portuguese, Dutch, and Japanese. We're continuously adding support for additional languages."
    },
    {
      question: "How does AI document generation work?",
      answer: "Our AI document generation uses advanced natural language processing to convert your requirements into properly formatted legal documents. You can provide a simple description of what you need, and the AI will generate a complete document with appropriate clauses, formatting, and legal language."
    },
    {
      question: "Can the AI help with document compliance?",
      answer: "Yes, our AI can analyze documents for compliance with various regulations and standards, including GDPR, HIPAA, and industry-specific requirements. It can identify potential compliance issues and suggest improvements to meet regulatory standards."
    }
  ];

  return (
    <div className="min-h-screen bg-white pt-24">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain className="h-10 w-10 text-purple-300" />
              <span className="text-purple-300 font-medium text-xl">AI-Powered</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Intelligent Document Processing
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Leverage cutting-edge artificial intelligence to streamline your document workflows, 
              reduce manual work, and gain valuable insights from your documents.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/signup" className="bg-white text-indigo-900 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl">
                Try AI Features Free <ArrowRight className="ml-2 h-5 w-5 inline" />
              </Link>
              <Link to="/demo" className="border-2 border-white text-white hover:bg-white hover:text-indigo-900 font-semibold py-3 px-8 rounded-lg transition-all duration-200">
                Watch Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Grid */}
      <section className="py-16 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              AI-Powered Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our advanced AI capabilities transform how you create, manage, and extract value from your documents.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aiFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 card-hover">
                <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-6`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="space-y-2">
                  {feature.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-2">
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

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Our AI Technology Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powered by advanced machine learning models and natural language processing
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Document Analysis</h3>
              <p className="text-gray-600">
                Our AI analyzes document structure, content, and context to understand the document's purpose and requirements.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Machine Learning</h3>
              <p className="text-gray-600">
                Trained on millions of documents, our models recognize patterns and make intelligent predictions about document needs.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Intelligent Automation</h3>
              <p className="text-gray-600">
                The AI automatically applies its insights to streamline workflows, reducing manual tasks and human error.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Document Assistant Demo */}
      <section className="py-16 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Zap className="h-6 w-6 text-yellow-500" />
                <span className="text-yellow-500 font-medium">Coming Soon</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                AI Document Assistant
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Our AI assistant will help you create, review, and optimize your documents with intelligent suggestions and automated workflows.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Natural language document creation</span>
                    <p className="text-sm text-gray-600 mt-1">Simply describe what you need, and the AI will generate the appropriate document</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Intelligent field placement</span>
                    <p className="text-sm text-gray-600 mt-1">AI automatically identifies where fields should be placed in documents</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Automated compliance checking</span>
                    <p className="text-sm text-gray-600 mt-1">Ensures documents meet regulatory requirements and best practices</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Smart recipient suggestions</span>
                    <p className="text-sm text-gray-600 mt-1">Recommends appropriate signers and reviewers based on document content</p>
                  </div>
                </li>
              </ul>
              <Link to="/ai-assistant-waitlist" className="btn-primary inline-flex items-center">
                Join the Waitlist
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>

            {/* AI Assistant Demo Interface */}
            <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
              <div className="p-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
                  <Brain className="h-5 w-5 text-purple-400" />
                  <span className="text-white font-medium">AI Assistant</span>
                  <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                
                <div className="mt-6 space-y-4">
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
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-gray-300 text-sm">
                      I've generated the NDA. Here's a preview of key sections:
                    </p>
                    <div className="mt-2 p-2 bg-gray-700 rounded text-xs text-gray-300 font-mono">
                      <p>1. CONFIDENTIAL INFORMATION</p>
                      <p>2. OBLIGATIONS OF RECEIVING PARTY</p>
                      <p>3. TERM AND TERMINATION</p>
                      <p>4. GOVERNING LAW</p>
                    </div>
                    <div className="mt-2 text-xs text-green-400">
                      Document ready for review and customization
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse"></div>
                    <span>AI is thinking...</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 p-4 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ask a question about your document..."
                  className="flex-1 bg-gray-700 border-none rounded-lg px-4 py-2 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                />
                <button className="bg-purple-600 text-white p-2 rounded-lg">
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              AI in Action: Real-World Use Cases
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how organizations are leveraging our AI-powered features to transform their document workflows
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 card-hover">
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

      {/* Technology Behind Our AI */}
      <section className="py-16 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              The Technology Behind Our AI
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powered by cutting-edge machine learning and natural language processing
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">AI Models & Capabilities</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Natural Language Processing</h4>
                    <p className="text-gray-600 text-sm">
                      Advanced NLP models understand document context, legal terminology, and user intent to generate appropriate content and identify key information.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Eye className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Computer Vision</h4>
                    <p className="text-gray-600 text-sm">
                      Our vision models analyze document layout, identify form fields, and extract information from scanned documents and images.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Database className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Knowledge Base</h4>
                    <p className="text-gray-600 text-sm">
                      Our AI is trained on a vast corpus of legal documents, templates, and best practices to ensure accuracy and compliance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Security & Ethics</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lock className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Data Privacy</h4>
                    <p className="text-gray-600 text-sm">
                      Your documents are never used to train our AI models. All processing is done securely, and your data remains private and protected.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Human Oversight</h4>
                    <p className="text-gray-600 text-sm">
                      While our AI is powerful, we maintain human oversight to ensure quality, accuracy, and ethical use of the technology.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Code className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Continuous Improvement</h4>
                    <p className="text-gray-600 text-sm">
                      Our AI models are continuously improved based on anonymized usage patterns and feedback, ensuring ever-increasing accuracy and capabilities.
                    </p>
                  </div>
                </div>
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
              Hear from organizations that have transformed their document workflows with our AI-powered features
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

      {/* AI Roadmap */}
      <section className="py-16 bg-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              AI Feature Roadmap
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Exciting AI capabilities coming soon to the DocuSigner platform
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {/* Timeline Items */}
              <div className="space-y-12">
                <div className="relative pl-12">
                  <div className="absolute left-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center border-4 border-white">
                    <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6 shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        Now Available
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Field Detection</h3>
                    <p className="text-gray-600">
                      Automatically detect signature fields, form fields, and other required elements in documents.
                    </p>
                  </div>
                </div>

                <div className="relative pl-12">
                  <div className="absolute left-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center border-4 border-white">
                    <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6 shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                        Q2 2025
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Document Assistant</h3>
                    <p className="text-gray-600">
                      Interactive AI assistant that helps you create, review, and optimize documents with natural language interaction.
                    </p>
                  </div>
                </div>

                <div className="relative pl-12">
                  <div className="absolute left-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center border-4 border-white">
                    <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6 shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                        Q3 2025
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Document Analytics</h3>
                    <p className="text-gray-600">
                      AI-powered analytics that provide insights into document usage, workflow efficiency, and content patterns.
                    </p>
                  </div>
                </div>

                <div className="relative pl-12">
                  <div className="absolute left-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center border-4 border-white">
                    <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6 shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
                        Q4 2025
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Intelligent Workflow Automation</h3>
                    <p className="text-gray-600">
                      AI that learns your document workflows and suggests automation opportunities to streamline processes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Common questions about our AI-powered features
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {faqItems.map((faq, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Experience the Power of AI in Document Management
            </h2>
            <p className="text-xl text-indigo-100 mb-8 leading-relaxed">
              Join thousands of organizations that are transforming their document workflows with DocuSigner's AI-powered features.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/signup" className="bg-white text-indigo-700 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-lg">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5 inline" />
              </Link>
              <Link to="/contact" className="border-2 border-white text-white hover:bg-white hover:text-indigo-700 font-semibold py-4 px-8 rounded-lg transition-all duration-200 text-lg">
                Schedule Demo
              </Link>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span className="text-indigo-100">No credit card required</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span className="text-indigo-100">Free forever plan</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span className="text-indigo-100">Setup in 2 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AIPoweredFeaturesPage;