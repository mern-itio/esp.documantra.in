import { useState, useEffect } from 'react'
import { ArrowRight, Play, Check } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const navigate = useNavigate();

  const slides = [
    {
      id: 'main',
      title: (
        <>
          All-in-One Platform for{' '}
          <span className="gradient-text">Document Management</span>

        </>
      ),
      subtitle: "Prepare, sign, edit, and secure your legal & business documents—all in one powerful workspace.",
      primaryCTA: "Start Free",
      secondaryCTA: "Try PDF Tools",
      features: [
        "Free Forever Plan",
        "No Credit Card Required",
        "Legal in 40+ Countries",
      ]
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
      ]
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
      ]
    },
    {
      id: 'complete-solution',
      title: (
        <>
          Complete Document Solution for{' '}
          <span className="gradient-text">Modern Teams</span>
        </>
      ),
      subtitle: "Edit PDFs, create legal documents, collect eSignatures, and automate workflows.",
      primaryCTA: "Get Started Free",
      secondaryCTA: "Watch Demo",
      features: [
        "500,000+ documents created",
        "8,000+ businesses globally",
        "4.9 rating on G2"
      ]
    }
  ]
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 8000) 
    return () => clearInterval(timer)
  }, [slides.length])
  const currentSlideData = slides[currentSlide]
  return (
    <section className="pt-20 relative overflow-hidden bg-[#fdfdfd]">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.35),transparent_60%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.10),transparent_60%)]"></div>
      <div className="container-max section-padding relative z-10">
        <div className="gap-12 items-center">
          <div className="space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                {currentSlideData.title}
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                {currentSlideData.subtitle}
              </p>
            </div>
            {currentSlideData.features && (
              <div className="flex gap-6 flex-wrap justify-center">
                {currentSlideData.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login" className='inline-block'>
                <button className="flex items-center justify-center gap-2 text-white font-semibold text-base px-6 py-3 rounded-md shadow-md transition" style={{backgroundColor: '#260559'}}>
                  {currentSlideData.primaryCTA}
                  <ArrowRight className="h-4 w-4 align-middle" />
                </button>
              </Link>

              <button
                onClick={() => {
                  if (currentSlideData.secondaryCTA === "Try PDF Tools") {
                    navigate("/login");
                  }
                }}
                className="flex items-center justify-center gap-2 border text-blue-600 font-semibold text-base px-6 py-3 rounded-md hover:bg-blue-50 transition" style = {{borderColor: '#260559', color: '#260559'}}
              >
                {currentSlideData.secondaryCTA === "Watch Demo" && (
                  <Play className="h-4 w-4 align-middle" />
                )}
                {currentSlideData.secondaryCTA}
              </button>
            </div>
            <div className="pt-4">
              <p className="text-sm text-gray-500">Trusted by 50,000+ businesses worldwide</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero