import { useEffect, useRef, type HTMLAttributes, type FC } from 'react'
import { Merge, FileText, Lock, Scan, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import AnimatedWorkflow from './AnimatedWorkflow'
import { motion, type MotionProps } from 'framer-motion';
type MotionDivProps = HTMLAttributes<HTMLDivElement> & MotionProps;
const MotionDiv: FC<MotionDivProps> = motion.div as unknown as FC<MotionDivProps>;
const tools = [
  {
    icon: Merge,
    title: 'Merge & split',
    description: 'Combine or split PDFs in seconds.',
    color: 'bg-violet-500',
  },
  {
    icon: FileText,
    title: 'Convert',
    description: 'PDF to Word, Excel, image and back.',
    color: 'bg-blue-500',
  },
  {
    icon: Lock,
    title: 'Secure',
    description: 'Password protect, encrypt, redact.',
    color: 'bg-emerald-500',
  },
  {
    icon: Scan,
    title: 'OCR & forms',
    description: 'Make PDFs searchable, fill forms.',
    color: 'bg-amber-500',
  },
]

const PDFToolsShowcaseSection = () => {
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!sectionRef.current) return

    const cards = sectionRef.current.querySelectorAll<HTMLElement>('[data-pdf-tool-card]')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0')
            entry.target.classList.remove('opacity-0', 'translate-y-6')
          }
        })
      },
      {
        threshold: 0.25,
      }
    )

    cards.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="pdf-tools"
      ref={sectionRef}
      className="section-padding relative overflow-hidden bg-slate-50/80"
    >
      {/* Subtle background */}
      <div
        className="pointer-events-none absolute inset-0 bg-[url('/pdf-section.jpg')] bg-cover bg-center opacity-100 md:opacity-30"
        aria-hidden="true"
      />

      <div className="container-max relative">

        {/* Header */}
        <div className="mb-12 flex flex-col items-center text-center">
         
          <h2 className="heading gradient-text">
            Power up every PDF in your workflow
          </h2>
          <p className="mt-3 max-w-2xl text-sm md:text-base details-text">
            Fast, secure, and beautifully simple tools for converting, cleaning, and preparing your PDFs before you send
            them for e‑sign.
          </p>
        </div>

        {/* Content layout */}
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-stretch">
          {/* Tool cards */}
          <div className="grid sm:grid-cols-2 gap-5 md:gap-6">
            {tools.map((item, index) => {
              const Icon = item.icon
              return (
                <Link
                  key={index}
                  to="/login"
                  data-pdf-tool-card
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm opacity-0 translate-y-6 transition-all duration-600 ease-out hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-md"
                  style={{ transitionDelay: `${index * 90}ms` }}
                >
                  {/* Document-style inner card */}
                  <div className="relative flex flex-1 flex-col rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 overflow-hidden">
                    {/* Page header bars (document feel) */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-8 rounded-full bg-slate-200" />
                        <div className="h-1.5 w-4 rounded-full bg-slate-100" />
                      </div>
                      <div className="relative h-5 w-5 rounded-md bg-indigo-100 border border-indigo-200/80">
                        <div className="absolute right-0 top-0 h-2 w-2 rounded-tr-md rounded-bl-md bg-indigo-400/80" />
                      </div>
                    </div>

                    <div className="relative flex items-start gap-3">
                      <div
                        className={`${item.color} relative mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-800">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-xs md:text-sm text-slate-600">{item.description}</p>

                        {/* Faux document lines */}
                        <div className="mt-3 space-y-1.5">
                          <div className="h-1.5 w-3/4 rounded-full bg-slate-200 group-hover:bg-slate-300/80 transition-colors" />
                          <div className="h-1.5 w-2/3 rounded-full bg-slate-100 group-hover:bg-slate-200/80 transition-colors" />
                          <div className="h-1.5 w-1/2 rounded-full bg-slate-100 group-hover:bg-slate-200/70 transition-colors" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Instant preview
                        </span>
                        <span className="hidden sm:inline">Drag &amp; drop supported</span>
                      </div>
                      <span className="hidden md:inline text-emerald-600/90">
                        No watermark
                      </span>
                    </div>

                    {/* CTA chip */}
                    <span className="mt-3 inline-flex h-7 w-fit items-center gap-1 rounded-full bg-indigo-600 px-2.5 text-[11px] font-medium text-white opacity-0 shadow-sm transition-all duration-200 group-hover:opacity-100">
                      Open PDF tool
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Side highlight panel */}
          <MotionDiv
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            <div className="relative">
              <div className="overflow-hidden">
                <AnimatedWorkflow />
              </div>
            </div>
            
            {/* Decorative glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-2xl -z-10" />
          </MotionDiv>
        </div>
      </div>
    </section>
  )
}

export default PDFToolsShowcaseSection
