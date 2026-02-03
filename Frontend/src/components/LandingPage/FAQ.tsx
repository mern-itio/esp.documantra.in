import { useState, useRef, type RefObject } from 'react'
import type { FC, HTMLAttributes, ButtonHTMLAttributes, RefAttributes } from 'react'
import { motion, AnimatePresence, useInView, useMotionValue, useSpring, useTransform, type MotionProps } from 'framer-motion'
import { Link } from 'react-router-dom'

type MotionDivProps = HTMLAttributes<HTMLDivElement> & MotionProps & RefAttributes<HTMLDivElement>
type MotionSpanProps = HTMLAttributes<HTMLSpanElement> & MotionProps
type MotionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & MotionProps
const MotionDiv: FC<MotionDivProps> = motion.div as unknown as FC<MotionDivProps>
const MotionSpan: FC<MotionSpanProps> = motion.span as unknown as FC<MotionSpanProps>
const MotionButton: FC<MotionButtonProps> = motion.button as unknown as FC<MotionButtonProps>
import {
  Gift,
  Scale,
  Building2,
  Shield,
  Plug,
  FileType,
  Headphones,
  CreditCard,
  HelpCircle,
  Sparkles,
  MessageCircle,
} from 'lucide-react'

const faqs = [
  {
    question: "Is DraftnSign really free to use?",
    answer: "Yes! DraftnSign offers a free forever plan that includes 10 envelopes per month, full access to PDF tools, and up to 10 legal documents per month. No credit card required to get started.",
    icon: Gift,
  },
  {
    question: "Are DraftnSign signatures legally binding?",
    answer: "Absolutely. DraftnSign signatures are legally binding in 40+ countries including the US (ESIGN Act), EU (eIDAS), India (IT Act 2000), and many others. We provide full audit trails and compliance certificates.",
    icon: Scale,
  },
  {
    question: "Can I use DraftnSign for my business documents?",
    answer: "Yes, DraftnSign is designed for both personal and business use. We offer legal templates, multi-signer workflows, API access, and enterprise features for businesses of all sizes.",
    icon: Building2,
  },
  {
    question: "How secure is my data with DraftnSign?",
    answer: "Your data security is our top priority. We use 256-bit SSL encryption, are SOC 2 Type II certified, ISO 27001 compliant, and GDPR ready. All documents are stored securely with bank-level encryption.",
    icon: Shield,
  },
  {
    question: "Can I integrate DraftnSign with my existing software?",
    answer: "Yes! DraftnSign offers robust APIs and webhooks for seamless integration. We provide 10 free API calls per month, with paid plans offering more capacity and advanced features.",
    icon: Plug,
  },
  {
    question: "What file formats does DraftnSign support?",
    answer: "DraftnSign supports PDF, Word, Excel, PowerPoint, and various image formats. Our PDF tools can convert between formats, and our eSignature platform works with any document type.",
    icon: FileType,
  },
  {
    question: "Do you offer customer support?",
    answer: "Yes! Free users get email support, while paid plans include priority support. Enterprise customers get dedicated account management and SLA guarantees.",
    icon: Headphones,
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Absolutely. You can cancel your subscription at any time with no questions asked. There are no setup fees or cancellation penalties.",
    icon: CreditCard,
  },
]

const FAQCard = ({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: (typeof faqs)[0]
  index: number
  isOpen: boolean
  onToggle: () => void
}) => {
  const Icon = faq.icon
  const cardRef = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x)
  const mouseYSpring = useSpring(y)

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['8deg', '-8deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-8deg', '8deg'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = (e.clientX - rect.left) / width - 0.5
    const mouseY = (e.clientY - rect.top) / height - 0.5
    x.set(mouseX)
    y.set(mouseY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <MotionDiv
      ref={cardRef}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className="relative group"
    >
      {/* Animated gradient border on hover */}
      <MotionDiv
        className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 faq-gradient-border"
       
      />
      <MotionDiv
        animate={isOpen ? { boxShadow: '0 25px 50px -12px rgba(38, 5, 89, 0.25), 0 0 0 1px rgba(38, 5, 89, 0.1)' } : {}}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl border border-white/50 shadow-lg"
      >
        <button
          onClick={onToggle}
          className="w-full text-left px-6 py-5 flex items-start gap-4 hover:bg-white/50 transition-colors duration-300"
        >
          {/* Number badge with icon */}
          <MotionDiv
            animate={isOpen ? { scale: 1.1, rotate: 360 } : { scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#084bdc] to-[#7c3aed] text-white shadow-lg"
          >
            <Icon className="w-6 h-6" />
          </MotionDiv>

          <div className="flex-1 min-w-0">
            <MotionSpan
              animate={isOpen ? { color: '#260559' } : { color: '#1f2937' }}
              className="font-semibold text-gray-900 text-lg block"
            >
              {faq.question}
            </MotionSpan>
           
          </div>

          <MotionDiv
            animate={isOpen ? { rotate: 180 } : { rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </MotionDiv>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <MotionDiv
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden"
            >
              <MotionDiv
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                className="px-6 pb-6 pt-0"
              >
                <div className="pl-16 border-l-2 border-[#260559]/20 ml-4 pl-6">
                  <p className="text-gray-600 leading-relaxed text-base">
                    {faq.answer}
                  </p>
                </div>
              </MotionDiv>
            </MotionDiv>
          )}
        </AnimatePresence>
      </MotionDiv>
    </MotionDiv>
  )
}

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>()
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef as RefObject<Element>, { once: true, margin: '-100px' })

  return (
    <section
      ref={sectionRef}
      className="relative py-24 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #faf5ff 0%, #f3e8ff 30%, #ede9fe 60%, #e0e7ff 100%)',
      }}
    >
      {/* Animated background orbs */}
      <MotionDiv
        className="absolute inset-0 overflow-hidden pointer-events-none"
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={{
          visible: { opacity: 1 },
          hidden: { opacity: 0 },
        }}
      >
        <MotionDiv
          className="absolute w-96 h-96 rounded-full -top-48 -left-48"
          style={{
            background: 'radial-gradient(circle, rgba(38, 5, 89, 0.08) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <MotionDiv
          className="absolute w-80 h-80 rounded-full -bottom-32 -right-32"
          style={{
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, -25, 0],
            y: [0, 30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <MotionDiv
          className="absolute w-64 h-64 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </MotionDiv>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <MotionDiv
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[#260559]/20"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      <div className="container-max relative z-10">
        {/* Header with animation */}
        <MotionDiv
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <MotionDiv
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#260559]/10 text-[#260559] text-sm font-medium mb-6"
            animate={{
              boxShadow: ['0 0 0 0 rgba(38, 5, 89, 0)', '0 0 0 8px rgba(38, 5, 89, 0)', '0 0 0 0 rgba(38, 5, 89, 0)'],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Got questions?</span>
            <Sparkles className="w-4 h-4" />
          </MotionDiv>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #084bdc 0%, #7c3aed 50%, #06b6d4 100%)',
              }}
            >
              Questions
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about DraftnSign — answered
          </p>
        </MotionDiv>

        {/* FAQ Grid - 2 columns to consume space */}
        <div className="max-w-6xl mx-auto" style={{ perspective: 1200 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, index) => (
              <FAQCard
                key={index}
                faq={faq}
                index={index}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))}
          </div>
        </div>

        {/* CTA with magnetic-style hover */}
        <MotionDiv
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <MotionDiv
            className="inline-flex flex-col items-center gap-4 p-8 rounded-3xl bg-white/60 backdrop-blur-sm border border-white/80 shadow-xl"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center gap-2 text-gray-600">
              <MessageCircle className="w-5 h-5" />
              <p className="font-medium">Still have questions?</p>
            </div>
            <Link to="/help-support">
              <MotionButton
                className="px-8 py-3.5 rounded-xl font-semibold text-white shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #084bdc 0%, #7c3aed 100%)',
                }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 20px 40px -10px rgba(5, 32, 89, 0.4)',
                }}
                whileTap={{ scale: 0.98 }}
              >
                Contact Support
              </MotionButton>
            </Link>
          </MotionDiv>
        </MotionDiv>
      </div>

      {/* CSS for flowing gradient border animation */}
      <style>{`
        .faq-gradient-border {
          animation: faqGradientFlow 4s linear infinite;
        }
        @keyframes faqGradientFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
      `}</style>
    </section>
  )
}

export default FAQ
