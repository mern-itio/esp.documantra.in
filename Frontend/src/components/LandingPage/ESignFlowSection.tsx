import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, type MotionProps } from 'framer-motion'
import { Upload, Users, Send, FileCheck, ShieldCheck, PenTool } from 'lucide-react'
type MotionDivProps = React.HTMLAttributes<HTMLDivElement> & MotionProps
const MotionDiv = motion.div as React.FC<MotionDivProps>

const TOTAL_PAGES = 6

const ESignFlowSection = () => {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const scrollLockRef = useRef(false)

  const clampPage = (value: number) => {
    if (value < 0) return 0
    if (value > TOTAL_PAGES - 1) return TOTAL_PAGES - 1
    return value
  }

  const handleFlip = useCallback(
    (direction: 'next' | 'prev') => {
      if (isFlipping) return

      const target =
        direction === 'next' ? clampPage(currentPage + 1) : clampPage(currentPage - 1)

      if (target === currentPage) return

      setIsFlipping(true)
      setCurrentPage(target)
      // release flip state after animation duration
      setTimeout(() => setIsFlipping(false), 900)
    },
    [currentPage, isFlipping]
  )

  // One-page-per-scroll behaviour with scroll lock while inside the book
  useEffect(() => {
    const node = sectionRef.current
    if (!node) return

    const onWheel = (e: WheelEvent) => {
      const rect = node.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const sectionMid = rect.top + rect.height / 2
      const viewportMid = viewportHeight / 2
      const distanceToCenter = Math.abs(sectionMid - viewportMid)

      // Only lock scroll when the section is visually centered enough (book clearly in view)
      const centerThreshold = viewportHeight * 0.2
      const isCentered = distanceToCenter < centerThreshold

      if (!isCentered) return

      const atFirstPage = currentPage <= 0
      const atLastPage = currentPage >= TOTAL_PAGES - 1

      // While flipping, eat all scroll so the document doesn't move
      if (scrollLockRef.current) {
        e.preventDefault()
        return
      }

      const deltaY = e.deltaY

      // Small micro-scrolls: if we're between first/last, block them so the page doesn't drift
      if (Math.abs(deltaY) < 4) {
        if (!atFirstPage && !atLastPage) {
          e.preventDefault()
        }
        return
      }

      // At boundaries: let scroll escape the section in that direction
      if (deltaY > 0 && atLastPage) {
        return
      }
      if (deltaY < 0 && atFirstPage) {
        return
      }

      // Lock scroll to the book and flip exactly one spread
      e.preventDefault()
      scrollLockRef.current = true

      if (deltaY > 0 && !atLastPage) {
        handleFlip('next')
      } else if (deltaY < 0 && !atFirstPage) {
        handleFlip('prev')
      }

      setTimeout(() => {
        scrollLockRef.current = false
      }, 950)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel as any)
  }, [handleFlip, currentPage])

  const getPageContent = (index: number) => {
    // 0: explainer video, 1–4: feature spreads, 5: closing CTA
    if (index === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
          <div className="relative w-full max-w-[320px] aspect-video rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10">
            <video
              className="h-full w-full object-cover"
              src="/videos/workflow.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/40 via-transparent to-sky-500/10" />
            <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live e-sign experience
            </div>
          </div>
          <p className="max-w-xs text-center text-[13px] text-slate-600">
            Watch how a contract moves from upload to legally binding signature in under a minute.
          </p>
        </div>
      )
    }

    if (index === 5) {
      return (
        <div className="flex h-full flex-col justify-between px-8 py-8">
          <div>
            <p className="text-heading">
              You&apos;re one step away
            </p>
            <h3 className="mt-3 text-xl font-semibold text-slate-900">
              Turn every document into a finished deal.
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              Launch a complete e-sign workflow in days, not months. Bring contracts, approvals, and audit trails into
              one place your team actually loves using.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#084bdc] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#084bdc]/30 transition hover:bg-[#084bdc]/90">
              Start sending documents
              <span aria-hidden>→</span>
            </button>
            <p className="text-[11px] text-slate-500">
              No credit card required · SOC2-ready infrastructure · Full audit trail on every document
            </p>
          </div>
        </div>
      )
    }

    const featureIndex = index - 1
    const features = [
      {
        title: 'Upload & prepare instantly',
        description:
          'Upload PDFs, Word files, or start from smart templates. Add signatures, initials, dates, checkboxes, and text fields with precise placement and complete layout control.',
        icon: Upload,
        label: 'Step 1 · Upload',
      },
      {
        title: 'Add signers & define workflow',
        description:
          'Invite multiple recipients, assign roles, set signing order, and configure approval steps — all within a single, streamlined flow.',
        icon: Users,
        label: 'Step 2 · Configure',
      },
      {
        title: 'Verify identity & authenticate',
        description:
          'Secure every signature with flexible verification methods including Aadhaar eSign, OTP, email verification, ID checks, and advanced authentication layers.',
        icon: ShieldCheck,
        label: 'Step 3 · Verify',
      },
      {
        title: 'Send, track & manage in real time',
        description:
          'Send secure signing links instantly. Track views, reminders, signing progress, and completion status from a single live dashboard.',
        icon: Send,
        label: 'Step 4 · Send & Track',
      },
      {
        title: 'Sign digitally on any device',
        description:
          'Sign seamlessly on mobile, tablet, or desktop using eSign, Aadhaar-based signing, or drawn signatures — no app installation required.',
        icon: PenTool,
        label: 'Step 5 · Sign',
      },
      {
        title: 'Secure, audit & archive',
        description:
          'Automatically generate audit trails, tamper-proof seals, and encrypted documents, with long-term secure cloud storage and instant export options.',
        icon: FileCheck,
        label: 'Step 6 · Complete',
      },
    ]


    const safeIndex = Math.max(0, Math.min(features.length - 1, featureIndex))
    const feature = features[safeIndex]
    const Icon = feature.icon

    return (
      <div className="flex h-full flex-col gap-4 px-7 py-7">
        <p className="text-heading">
          {feature.label}
        </p>
        <div className="flex items-start gap-4">
          <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full text-[#084bdc]">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span>Designed to feel like your existing paperwork — just faster.</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-emerald-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure & compliant
          </span>
        </div>
      </div>
    )
  }

  const renderSpread = () => {
    // Only show active content on the right page; left is decorative
    const activeContent = getPageContent(currentPage)

    return (
      <div className="relative mx-auto flex max-w-5xl items-stretch justify-center">
        {/* Book spine shadow */}
        <div className="pointer-events-none absolute inset-y-6 left-1/2 w-[3px] -translate-x-1/2 bg-gradient-to-b from-slate-300/50 via-slate-500/70 to-slate-300/50 shadow-[0_0_20px_rgba(15,23,42,0.45)]" />

        {/* Left page – always shows brand logo */}
        <MotionDiv
          className="relative h-[460px] w-[56vw] max-w-[420px] origin-right rounded-l-2xl bg-cover bg-center shadow-[0_18px_60px_rgba(15,23,42,0.22)] ring-1 ring-slate-200/80"
          style={{
            perspective: 1600,
            backgroundImage: "url('/images/new-left.jpg')",
          }}
          initial={{ rotateY: -8, rotateX: 4, y: 10 }}
          animate={{ rotateY: -6, rotateX: 4, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-l-2xl bg-gradient-to-br from-white/80 via-white/40 to-slate-100/80" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-200/70 via-transparent to-transparent mix-blend-multiply" />
          <div className="relative flex h-full items-center justify-center overflow-hidden rounded-l-2xl">
            <div className="flex h-[72%] w-[82%] items-center justify-center">
              <img
                src="./Logo.png"
                alt="Draft&Sign logo"
                className="h-25 w-auto opacity-90"
              />
            </div>
          </div>
        </MotionDiv>

        {/* Right page (with flipping overlay) */}
        <div className="relative h-[460px] w-[56vw] max-w-[420px]">
          {/* Static right page (target) */}
          <MotionDiv
            className="absolute inset-0 origin-left rounded-r-2xl bg-cover bg-center shadow-[0_18px_60px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/80"
            style={{ perspective: 1600, backgroundImage: "url('/images/new-right.jpg')", }}
            initial={{ rotateY: 8, rotateX: 4, y: 10 }}
            animate={{ rotateY: 6, rotateX: 4, y: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          >
            <div className="pointer-events-none absolute inset-0 rounded-r-2xl bg-gradient-to-bl from-white via-white/60 to-slate-100/80" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-300/70 via-transparent to-transparent mix-blend-multiply" />
            <div className="relative h-full overflow-hidden rounded-r-2xl">{activeContent}</div>
          </MotionDiv>

          {/* Flipping sheet overlay */}
          <MotionDiv
            className="absolute inset-0 origin-left rounded-r-2xl bg-[#fdfbf7]"
            style={{ boxShadow: '0 22px 70px rgba(15,23,42,0.55)', transformStyle: 'preserve-3d' }}
            animate={
              isFlipping
                ? {
                  rotateY: [0, -40, -80, -120, -180],
                  rotateX: [4, 3, 2, 3, 4],
                  z: [0, 18, 26, 18, 0],
                  boxShadow: [
                    '0 22px 70px rgba(15,23,42,0.55)',
                    '0 26px 80px rgba(15,23,42,0.65)',
                    '0 26px 80px rgba(15,23,42,0.65)',
                    '0 20px 60px rgba(15,23,42,0.55)',
                    '0 18px 55px rgba(15,23,42,0.5)',
                  ],
                  opacity: [1, 0.98, 0.95, 0.75, 0],
                }
                : {
                  rotateY: 0,
                  rotateX: 4,
                  z: 0,
                  opacity: 0,
                }
            }
            transition={{
              duration: 0.9,
              ease: [0.22, 0.61, 0.36, 1],
            }}
          >
            {/* front of flipping page */}
            <div className="absolute inset-0 rounded-r-2xl bg-gradient-to-br from-white via-[#fdf8f0] to-slate-100/90" />
            {/* soft vertical curl highlights */}
            <div className="pointer-events-none absolute inset-y-4 left-8 w-10 rounded-full bg-gradient-to-r from-slate-200/35 via-white/0 to-slate-200/25 blur-md mix-blend-soft-light" />
            <div className="pointer-events-none absolute inset-y-6 left-1/2 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-slate-200/35 via-white/0 to-slate-200/25 blur-md mix-blend-soft-light" />
            {/* fake content lines to hint texture */}
            <div className="absolute inset-0 px-7 py-7 opacity-40">
              <div className="h-2 w-16 rounded-full bg-slate-200 mb-3" />
              <div className="h-3 w-32 rounded-full bg-slate-200 mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    className="h-[6px] rounded-full bg-slate-100"
                    style={{ width: `${80 - i * 4}%` }}
                  />
                ))}
              </div>
            </div>
          </MotionDiv>
        </div>
      </div>
    )
  }

  return (
    <section
      id="e-sign-flow"
      ref={sectionRef}
      className="section-padding bg-slate-50/80 relative overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-0 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />
      </div>

      <div className="container-max relative">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="heading">
            E-sign flow in four simple steps
          </h2>
          <p className="details-text max-w-2xl mx-auto">
            From upload to signed PDF with Aadhaar verification and a complete audit trail.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          {renderSpread()}


        </div>
      </div>
    </section>
  )
}

export default ESignFlowSection
