import React, { useEffect, useRef, useState } from 'react'

const features = [
  {
    id: 'one',
    label: 'Create Document',
    title: 'Upload documents and configure signers securely',
    description:
      'Create documents by uploading files, adding multiple signers, defining signature fields, and selecting verification methods. Set signing order, add required fields, and prepare the document for a secure and compliant signing process.',
    image: '/images/steps/creation.jpg',
  },
  {
    id: 'two',
    label: 'Receive Document',
    title: 'View and sign documents with ease',
    description:
      'Recipients receive the document instantly, can review it securely, and complete the signing process using an intuitive interface. The signing experience is simple, guided, and works across devices.',
    image: '/images/steps/received.jpg',
  },
  {
    id: 'three',
    label: 'Envelope Tracking',
    title: 'Monitor document status in real time',
    description:
      'Admins can track each envelope to see how many signatures are completed, pending, or declined. Get real-time visibility into document progress and take action with reminders when needed.',
    image: '/images/steps/track.jpg',
  },
  {
    id: 'four',
    label: 'Audit Trail',
    title: 'Maintain a complete and tamper-proof audit record',
    description:
      'Every document includes a detailed audit report capturing timestamps, signer actions, IP addresses, and verification details. Ensure transparency, accountability, and legal compliance throughout the document lifecycle.',
    image: '/images/steps/Audit-trail.jpg',
  },
  {
    id: 'five',
    label: 'Aadhaar Verification',
    title: 'Verify signer identity with Aadhaar-based authentication',
    description:
      'Enable Aadhaar-based verification to confirm signer identity securely. This adds an extra layer of trust and compliance for sensitive and high-value documents.',
    image: '/images/steps/adhar-check.jpg',
  },
  {
    id: 'six',
    label: 'Customer Support',
    title: 'Get help whenever you need it',
    description:
      'Our customer support team is always available to assist with onboarding, document setup, verification issues, and technical questions—ensuring a smooth experience for both admins and signers.',
    image: '/images/steps/support.jpg',
  },
]


const AadhaarSignatureJourneySection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [isImageTransitioning, setIsImageTransitioning] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === 'undefined') return

      // Use a horizontal line near the top of the viewport as the trigger.
      // The card that crosses this line becomes active, so the previous
      // step is fully scrolled past that point before the image changes.
      const triggerY = window.innerHeight * 0.25
      let nextActiveIndex = activeIndex

      itemRefs.current.forEach((el, index) => {
        if (!el) return
        const rect = el.getBoundingClientRect()

        if (rect.top <= triggerY && rect.bottom >= triggerY) {
          nextActiveIndex = index
        }
      })

      if (nextActiveIndex !== activeIndex) {
        setActiveIndex(nextActiveIndex)
      }
    }

    // Run once on mount
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [activeIndex])

  // Add a very soft fade / blur animation whenever the active image changes
  useEffect(() => {
    setIsImageTransitioning(true)

    const timeoutId = window.setTimeout(() => {
      setIsImageTransitioning(false)
    }, 350)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [activeIndex])

  const activeFeature = features[activeIndex]

  return (
    <section className="relative bg-slate-50 py-20 sm:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-[url('/images/1.jpg')] bg-cover bg-center opacity-100 md:opacity-10"
        aria-hidden="true"
      />
      <div className="mb-12 flex flex-col items-center text-center">
        <h2 className="heading">
          End-to-End Digital Signature Workflow
        </h2>
       
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:flex-row lg:items-start lg:px-8">
        {/* Left: Sticky image, slightly lower for visual centering */}
        <div className="lg:sticky lg:top-32 lg:w-1/2">
          <div className="h-full rounded-xl bg-white/80 p-4 shadow-lg ring-1 ring-slate-200 backdrop-blur-sm">
            <div className="relative flex h-full items-center justify-center overflow-hidden rounded-2xl bg-slate-900/5">
              <img
                key={activeFeature.id}
                src={activeFeature.image}
                alt={activeFeature.title}
                className={`h-full w-full max-h-[380px] object-contain transition-all duration-500 ease-out ${
                  isImageTransitioning ? 'opacity-0 blur-sm scale-[1.01]' : 'opacity-100 blur-0 scale-100'
                }`}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 lg:w-1/2">      
          <div className="space-y-16">
            {features.map((feature, index) => (
              <div
                key={feature.id}
                data-index={index}
                ref={(el) => {
                  itemRefs.current[index] = el
                }}
                className={`relative rounded-xl border bg-white/80 p-5 shadow-sm ring-1 transition-all duration-300 sm:p-6 lg:min-h-[380px] ${index === activeIndex
                    ? 'border-indigo-500/60 ring-indigo-500/30 shadow-md'
                    : 'border-slate-200 ring-slate-200/60 opacity-70'
                  }`}
              >
                <div className="flex items-start gap-4">                  
                  <div>
                    <p
                      className={`text-xs font-bold text-heading ${index === activeIndex ? 'text-indigo-500' : 'text-slate-500'
                        }`}
                    >
                      {feature.label}
                    </p>
                    <h3 className="mt-1 desc-text text-base font-semibold text-slate-900 sm:text-lg">
                      {feature.title}
                    </h3>
                    <p className="mt-2 details-text text-sm text-slate-600 sm:text-[15px]">{feature.description}</p>

                    {/* Mobile image so users still see visual per step */}
                    <div className="mt-4 block lg:hidden">
                      <div className="overflow-hidden rounded-xl bg-slate-100">
                        <img
                          src={feature.image}
                          alt={feature.title}
                          className="w-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <a
              href="/sign_up/"
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Start for free
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AadhaarSignatureJourneySection
