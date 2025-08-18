import { useState, useEffect } from 'react'
import { ArrowRight, Shield, Globe, CreditCard, ChevronLeft, ChevronRight, Play, FileText, Zap, Users, Check } from 'lucide-react'

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      id: 'main',
      title: (
        <>
          All-in-One Platform for{' '}
          <span className="gradient-text">Signing, Editing & Managing</span>{' '}
          Documents
        </>
      ),
      subtitle: "Prepare, sign, edit, and secure your legal & business documents—all in one powerful workspace.",
      primaryCTA: "Start Free",
      secondaryCTA: "Try PDF Tools",
      trustBadges: [
        { icon: Shield, text: "Free Forever Plan" },
        { icon: CreditCard, text: "No Credit Card" },
        { icon: Globe, text: "Legal in 40+ Countries" }
      ],
      mockup: (
        <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-1 hover:rotate-0 transition-transform duration-300">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">D</span>
                </div>
                <span className="font-semibold text-gray-900">ITIO DocuSigner Dashboard</span>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Contract Agreement.pdf</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Ready to Sign</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-primary-600 rounded-full w-3/4"></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>3 of 4 signatures collected</span>
                  <span>75% complete</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">JS</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">John Smith</div>
                  <div className="text-xs text-gray-500">Signed 2 hours ago</div>
                </div>
                <div className="text-green-500 text-sm">✓</div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">MJ</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Mary Johnson</div>
                  <div className="text-xs text-gray-500">Pending signature</div>
                </div>
                <div className="text-orange-500 text-sm animate-pulse">⏳</div>
              </div>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 bg-accent-orange text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-bounce-slow">
            500K+ Documents Signed
          </div>
          <div className="absolute -bottom-4 -left-4 bg-accent-green text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
            GDPR Compliant
          </div>
        </div>
      )
    },
    {
      id: 'ai-powered',
      title: (
        <>
          Sign Documents in{' '}
          <span className="gradient-text">Seconds</span>{' '}
          with AI Assistance
        </>
      ),
      subtitle: "The world's most intelligent e-signature platform. Create, edit, and sign documents with AI assistance. Get started with 10 free envelopes - no credit card required.",
      primaryCTA: "Get Started Free",
      secondaryCTA: "Watch Demo",
      features: [
        "10 free envelopes monthly",
        "AI document generation",
        "Free PDF tools suite",
        "Legal compliance built-in"
      ],
      mockup: (
        <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b">
            <h3 className="font-semibold text-gray-900">AI Document Generator</h3>
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">User Input:</label>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                "Create a lease agreement for a furnished apartment in NYC, $3,500/month"
              </div>
            </div>
            <div className="flex items-center justify-center py-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">AI Generated:</span>
              </div>
              <div className="bg-white rounded-lg p-3 space-y-2">
                <h4 className="font-semibold text-gray-900">RESIDENTIAL LEASE AGREEMENT</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Property: [Address], New York, NY</p>
                  <p>Rent: $3,500.00 per month</p>
                  <p>Term: 12 months</p>
                  <p>Furnished: Yes</p>
                </div>
              </div>
              <button className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Generate Full Document
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'all-in-one',
      title: (
        <>
          All-in-One Document, PDF &{' '}
          <span className="gradient-text">eSignature Platform</span>
        </>
      ),
      subtitle: "Create, convert, edit, sign, and manage documents effortlessly. Trusted by 500,000+ professionals worldwide.",
      primaryCTA: "Start Free",
      secondaryCTA: "Try PDF Tools",
      features: [
        "No credit card required",
        "30+ free PDF tools",
        "GDPR compliant"
      ],
      mockup: (
        <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900">DocuSigner Workspace</span>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Signed ✓</span>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Document Progress</span>
                <span className="text-xs text-blue-600">AI Powered</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div className="bg-blue-600 h-2 rounded-full w-full"></div>
              </div>
              <div className="text-xs text-gray-500">Processing complete</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
                Add Signature
              </button>
              <button className="bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
                Send
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center">L</div>
                <span className="text-sm font-medium text-gray-700">Legal</span>
              </div>
              <div className="text-xs text-gray-500">Document validated and compliant</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'complete-solution',
      title: (
        <>
          Complete Document Solution for{' '}
          <span className="gradient-text">Modern Teams</span>
        </>
      ),
      subtitle: "Edit PDFs, create legal documents, collect eSignatures, and automate workflows. All in one secure platform trusted by 500,000+ users worldwide.",
      primaryCTA: "Get Started Free",
      secondaryCTA: "Watch Demo",
      stats: [
        { icon: FileText, value: "500,000+", label: "documents created" },
        { icon: Users, value: "8,000+", label: "businesses globally" },
        { icon: Shield, value: "4.9", label: "rating on G2" }
      ],
      features: [
        "Free forever plan",
        "No credit card required",
        "5-minute setup"
      ]
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 8000) // Change slide every 8 seconds

    return () => clearInterval(timer)
  }, [slides.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const currentSlideData = slides[currentSlide]

  return (
    <section className="pt-20 pb-16 bg-gradient-to-br from-primary-50 via-white to-accent-orange/5 relative overflow-hidden">
      <div className="container-max section-padding">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[600px]">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                {currentSlideData.title}
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                {currentSlideData.subtitle}
              </p>
            </div>

            {/* Features List (for slides that have them) */}
            {currentSlideData.features && (
              <div className="space-y-3">
                {currentSlideData.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Stats (for complete solution slide) */}
            {currentSlideData.stats && (
              <div className="grid grid-cols-3 gap-6 py-6">
                {currentSlideData.stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <stat.icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-6 py-3 rounded-md shadow-md transition">
                {currentSlideData.primaryCTA}
                <ArrowRight className="h-4 w-4 align-middle" />
              </button>

              <button
                onClick={() => currentSlideData.secondaryCTA === 'Try PDF Tools' ? scrollToSection('pdf-tools') : null}
                className="flex items-center justify-center gap-2 border border-blue-600 text-blue-600 font-semibold text-base px-6 py-3 rounded-md hover:bg-blue-50 transition"
              >
                {currentSlideData.secondaryCTA === 'Watch Demo' && (
                  <Play className="h-4 w-4 align-middle" />
                )}
                {currentSlideData.secondaryCTA}
              </button>
            </div>


            {/* Trust Badges (for main slide) */}
            {currentSlideData.trustBadges && (
              <div className="flex flex-wrap gap-6 pt-4">
                {currentSlideData.trustBadges.map((badge, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <badge.icon className="h-5 w-5 text-green-500" />
                    <span className="font-medium">{badge.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Additional features for complete solution */}
            {currentSlideData.id === 'complete-solution' && currentSlideData.features && (
              <div className="flex flex-wrap gap-6 pt-4">
                {currentSlideData.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="h-5 w-5 text-green-500" />
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Trusted by text for AI slide */}
            {currentSlideData.id === 'ai-powered' && (
              <div className="pt-4">
                <p className="text-sm text-gray-500">Trusted by 50,000+ businesses worldwide</p>
              </div>
            )}
          </div>

          {/* Right Visual */}
          <div className="relative">
            {currentSlideData.mockup || (
              <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                <div className="space-y-6">
                  <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="h-12 w-12 text-primary-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Complete Solution</h3>
                  <p className="text-gray-600">Everything you need for modern document workflows</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Slide Navigation */}
        <div className="flex items-center justify-center gap-4 mt-12">
          <button
            onClick={prevSlide}
            className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-primary-600 w-8' : 'bg-gray-300'
                  }`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default Hero