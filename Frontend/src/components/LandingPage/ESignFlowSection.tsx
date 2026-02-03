import { useEffect, useRef, useState } from 'react'
import { Upload, Users, Send, FileCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

const steps = [
  {
    step: '01',
    title: 'Upload document',
    description: 'Upload your PDF or create from a template. Add signer fields in seconds.',
    icon: Upload,
  },
  {
    step: '02',
    title: 'Add signers',
    description: 'Add recipients and set signing order. Optional Aadhaar verification for signers.',
    icon: Users,
  },
  {
    step: '03',
    title: 'Send for signature',
    description: 'Send the envelope by email. Signers get a secure link—no account needed.',
    icon: Send,
  },
  {
    step: '04',
    title: 'Sign & complete',
    description: 'Signers sign on any device. You get a signed PDF and full audit trail.',
    icon: FileCheck,
  },
]

const ESignFlowSection = () => {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [visibleStepCount, setVisibleStepCount] = useState(0)
  const [hasTriggered, setHasTriggered] = useState(false)
  // const originalOverflow = useRef<string | null>(null)
  const isHandlingScroll = useRef(false)

  // Lock/unlock page scroll
  // const lockScroll = () => {
  //   if (typeof document === 'undefined') return
  //   if (originalOverflow.current === null) {
  //     originalOverflow.current = document.body.style.overflow || ''
  //   }
  //   document.body.style.overflow = 'hidden'
  // }

  // const unlockScroll = () => {
  //   if (typeof document === 'undefined') return
  //   if (originalOverflow.current !== null) {
  //     document.body.style.overflow = originalOverflow.current
  //     originalOverflow.current = null
  //   } else {
  //     document.body.style.overflow = ''
  //   }
  // }

  // Detect when the section enters view, then start scroll-controlled reveal
  useEffect(() => {
    if (!sectionRef.current || hasTriggered) return

    const node = sectionRef.current

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTriggered) {
            setHasTriggered(true)
            // lockScroll()
            setVisibleStepCount(1) // first step visible as soon as user reaches section
          }
        })
      },
      {
        threshold: 0.4,
      }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
      // unlockScroll()
    }
  }, [hasTriggered])

  // While in this section, consume scroll gestures to show/hide steps
  // instead of scrolling the page, until user finishes the sequence.
  useEffect(() => {
    if (!hasTriggered || typeof window === 'undefined') return

    const handleWheel = (event: WheelEvent) => {
      if (!sectionRef.current) return

      const rect = sectionRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      const isInView = rect.top < viewportHeight && rect.bottom > 0
      if (!isInView) return

      const goingDown = event.deltaY > 5
      const goingUp = event.deltaY < -5
      if (!goingDown && !goingUp) return

      const allVisible = visibleStepCount >= steps.length
      const atFirst = visibleStepCount <= 0

      // Scroll down → reveal next step until all visible.
      if (goingDown) {
        if (!allVisible) {
          event.preventDefault()

          if (isHandlingScroll.current) return
          isHandlingScroll.current = true

          setVisibleStepCount((prev) => Math.min(prev + 1, steps.length))

          setTimeout(() => {
            isHandlingScroll.current = false
          }, 250)
        } else {
          // All steps already visible → release lock so user can move to next section
          // unlockScroll()
        }
        return
      }

      // Scroll up → hide previous step until only first is left.
      if (goingUp) {
        if (!atFirst) {
          event.preventDefault()

          if (isHandlingScroll.current) return
          isHandlingScroll.current = true

          setVisibleStepCount((prev) => Math.max(prev - 1, 1))

          setTimeout(() => {
            isHandlingScroll.current = false
          }, 250)
        } else {
          // At the first step and user scrolls up → allow normal scroll to previous section
          // unlockScroll()
        }
      }
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!sectionRef.current) return

      const rect = sectionRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      const isInView = rect.top < viewportHeight && rect.bottom > 0
      if (!isInView) return
      if (visibleStepCount >= steps.length) return

      // For touch we keep it simple: every swipe while locked reveals next step.
      event.preventDefault()

      if (isHandlingScroll.current) return
      isHandlingScroll.current = true

      setVisibleStepCount((prev) => Math.min(prev + 1, steps.length))

      setTimeout(() => {
        isHandlingScroll.current = false
      }, 250)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [hasTriggered, visibleStepCount])

  return (
    <section
      id="e-sign-flow"
      ref={sectionRef}
      className="section-padding bg-slate-50/80"
    >
      <div className="container-max">
        <div className="text-center mb-10 md:mb-14">
         
          <h2 className="heading gradient-text">
            E-sign flow in four simple steps
          </h2>
          <p className="details-text max-w-2xl mx-auto">
            From upload to signed PDF—with optional Aadhaar verification and a complete audit trail.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">
          {/* Left: workflow video */}
          <div className="relative">
            <div
              className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xl shadow-slate-300/60 ring-1 ring-slate-900/5"
              style={{ transform: 'perspective(1000px) rotateY(-3deg) rotateX(1deg)' }}
            >
              <div className="aspect-video">
                <video
                  className="h-full w-full object-cover"
                  src="/videos/workflow.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Real workflow demo
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/75 to-transparent text-[11px] text-white/90 flex items-center justify-between gap-3">
                <span>Upload → Add signers → Send → Sign</span>
                <span className="hidden sm:inline text-white/70">~60 seconds from upload to signed</span>
              </div>
            </div>
            <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[28px] bg-gradient-to-r from-indigo-500/10 via-sky-500/0 to-violet-500/10 blur-2xl" />
          </div>

          {/* Right: steps list */}
          <div>
            <ol className="relative space-y-5 pl-4 before:absolute before:left-2 before:top-1 before:h-[calc(100%-0.75rem)] before:w-px before:bg-gradient-to-b from-indigo-200 via-slate-200 to-transparent">
              {steps.map((item, index) => {
                const Icon = item.icon
                const isVisible = index < visibleStepCount
                return (
                  <li
                    key={index}
                    className={`relative flex gap-4 transition-all duration-500 ease-out ${
                      isVisible
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}
                  >
                    {/* Step badge */}
                    <div className="absolute -left-[14px] top-0 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-indigo-100">
                      <span className="text-[10px] font-semibold text-indigo-600">{item.step}</span>
                    </div>

                    {/* Content card */}
                    <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                          <p className="mt-1 text-xs md:text-sm text-slate-600">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>

            <div className="mt-5 flex items-center justify-start gap-3 text-xs md:text-sm">
            
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-indigo-700 font-semibold hover:text-indigo-900"
              >
                Start sending documents
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ESignFlowSection
