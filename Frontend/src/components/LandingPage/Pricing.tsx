import { useState, useEffect, Fragment } from 'react'
import { Check, Minus, ChevronDown, ArrowRight, Info, X, HelpCircle, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '../constants/appConfig'
import Lottie from 'lottie-react'
import aadhaarPhotoMatchAnim from '../../assets/lottie/Aadhar-card.json'
import faceScan from '../../assets/lottie/Face-scanning.json'
import strongVideoProofAnim from '../../assets/lottie/Verification.json'
import DigitaCertificate from './DigitaCertificate'
type BillingPeriod = 'monthly' | 'annually'
type PricingMode = 'subscription' | 'perDocument'
type PerDocTabId = 'safelite' | 'safepro' | 'safemax'

const PER_DOC_PLANS: Record<
  PerDocTabId,
  {
    name: string
    subtitle: string
    price: number
    description: string
    addOnFeatures: { label: string; included: boolean }[]
    notes: string[]
    includedBenefits: string
  }
> = {
  safelite: {
    name: 'SafeLite',
    subtitle: 'Quick. Safe.',
    price: 49,
    description: 'To eSign everyday documents',
    addOnFeatures: [
      { label: 'Traditional Sign / Stamp', included: true },
      { label: 'AI Face Verified', included: false },
      { label: 'Aadhaar Photo Match', included: false },
      { label: 'Strong Video Proof', included: false },
    ],
    notes: [
      'Additional signs at ₹7/sign after two signs.',
      'Cannot be used with e-notary service.',
    ],
    includedBenefits: 'NA',
  },
  safepro: {
    name: 'SafePro',
    subtitle: 'AI Photo',
    price: 89,
    description: 'For important documents like affidavits and agreements.',
    addOnFeatures: [
      { label: 'Traditional Sign / Stamp', included: true },
      { label: 'AI Face Verified', included: true },
      { label: 'Aadhaar Photo Match', included: true },
      { label: 'Strong Video Proof', included: false },
    ],
    notes: [
      'Additional signs at ₹3/sign after two signs.',
      'Cannot be used with e-notary service.',
    ],
    includedBenefits: 'No additional benefits',
  },
  safemax: {
    name: 'SafeMax',
    subtitle: 'AI Photo + Video',
    price: 139,
    description: 'For critical documents like multi party agreements and legal docs.',
    addOnFeatures: [
      { label: 'Traditional Sign / Stamp', included: true },
      { label: 'AI Face Verified', included: true },
      { label: 'Aadhaar Photo Match', included: true },
      { label: 'Strong Video Proof', included: true },
    ],
    notes: [],
    includedBenefits: '✔ Additional signs FREE',
  },
}

const PLANS = [
  {
    id: 'explorer',
    name: 'Explorer',
    tagline: 'For small businesses who need professional eSign without the price tag.',
    priceMonthly: 0,
    priceAnnually: 0,
    periodLabelMonthly: '10 Documents Per month for free',
    periodLabelAnnually: '10 Documents Per month for free',
    cta: 'Sign up for Free',
    ctaLink: '/signup',
    highlight: false,
    features: [
      'Rich media drag and drop document editor',
      'Real-time tracking and notifications',
      '24/7 email and chat support',
      'Cryptographic Signatures with audit trail',
      'Bulk Send',
      'Web forms',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'For quickly creating and signing forms and agreements.',
    priceMonthly: 10,
    priceAnnually: 6,
    periodLabelMonthly: '100 Documents per month, billed monthly',
    periodLabelAnnually: '100 Documents per month, billed annually',
    cta: 'Start 14 days free trial',
    ctaLink: '/signup',
    highlight: true,
    features: [
      'Custom quotes and sales agreements',
      'Aadhar based signer verification',
      'OTP based signer verification',
      'Biometric verification',
      
    ],
  },
  {
    id: 'custom',
    name: 'Custom',
    tagline: 'For end-to-end document workflows and advanced automations.',
    priceMonthly: null,
    priceAnnually: null,
    periodLabelMonthly: 'Flexible per-user or per-document pricing',
    periodLabelAnnually: 'Flexible per-user or per-document pricing',
    cta: 'Contact sales',
    ctaLink: '/contact-sales',
    highlight: false,
    features: [
    'Advanced CPQ (configure, price & quote)',
    'End-to-end workflow automation',
    'AI-powered smart content',
    'Secure single sign-on (SSO)',
    'Collaborative team workspaces',
    'Integrated digital notary',
    'Robust developer APIs',
  ],

  },
]

type PlanId = 'explore' | 'business' | 'custom'
const PLAN_IDS: PlanId[] = ['explore', 'business', 'custom']

const FEATURE_HELP: Record<string, string> = {
  'Secure & Compliant eSignatures':
    'Simply add an eSignature block to any existing document, attach a recipient and send. Our eSignatures are legally binding and compliant with UETA and ESIGN Act equivalents.',
  'Documents sent':
    'Number of documents you can send for review and signature within the billing period.',
  'PDF Tools':
    'Convert, merge, and optimize PDFs so they are ready for sending and signing.',
  'Documents Tracking':
    'See when a document is opened, viewed, and completed so you can follow up at the right time.',
  'Reuse your own documents':
    'Save your frequently used contracts and proposals as reusable templates.',
  'Bulk import':
    'Import multiple contacts or documents at once instead of uploading them one‑by‑one.',
  'Document editor':
    'Use the built‑in editor to add fields, text, pricing tables, and more directly on your documents.',
  'Templates':
    'Create reusable templates for your most common document workflows.',
  'Web Forms':
    'Turn templates into public web forms that you can embed or share via link.',
  'AI based smart content':
    'Use AI suggestions and content blocks to assemble documents faster with fewer errors.',
  'Inline comments':
    'Collaborate with stakeholders by leaving comments directly in the document.',
  'Content library':
    'Store approved clauses, pricing blocks, and content snippets for easy reuse.',
  Rooms:
    'Create shared spaces to collaborate on deals that involve multiple documents and participants.',
  'Bulk Send':
    'Send the same document to many recipients at once with individualized copies.',
  'Signing order':
    'Control the sequence in which recipients receive and sign your documents.',
  'Reminders & deadlines':
    'Automatically remind signers and set due dates to keep deals moving.',
  'In-person signing':
    'Collect signatures in person on a shared device, ideal for front‑desk or field teams.',
  Notary:
    'Access notary workflows where supported, including identity checks and notarization steps.',
  'Real-time notifications':
    'Get instant alerts when someone views, comments on, or signs your document.',
  'Audit trail':
    'Track every important action on a document for legal and compliance purposes.',
  'Signature certificate':
    'Attach a certificate containing signer, device, IP, and timestamp details.',
  'Two-Factor Authentication':
    'Add an extra verification step (like SMS or OTP) before recipients can access a document.',
  'PKI-Based Digital Signatures':
    'Infrastructure and processes audited to meet PKI-Based Digital Signatures security standards.',
  'GDPR compliance':
    'Data handling practices designed to support GDPR compliant workflows.',
  'Automated reports':
    'Generate usage, performance, and adoption reports automatically.',
  'User management':
    'Add, remove, and manage users and their access from a central admin console.',
  'Team Organization':
    'Group users into teams so permissions and reporting align with your org structure.',
  'Shared Organization':
    'Share templates, content, and settings across your entire organization.',
  'Single Sign-On (SSO)':
    'Let users log in with existing identity providers such as Google Workspace or Azure AD.',
  'Help Center 24/7':
    'Search articles, how‑tos, and troubleshooting guides any time.',
  'Email support 24/7':
    'Reach our support team by email around the clock.',
  'Chat support':
    'Get real‑time help from support agents from within the app.',
  'Dedicated Customer Success Manager':
    'Work with a named specialist to optimize rollout, adoption, and ROI.',
  'Cryptographic Signatures with audit trail':
    'Our eSignatures use advanced cryptographic techniques to ensure document integrity and provide a detailed audit trail of signer actions, device information, and timestamps for enhanced security and legal compliance.',
  'Aadhar based signer verification':
    'Verify signer identities using Aadhaar-based authentication, leveraging government‑issued ID for a secure and compliant signing process.',
  'OTP based signer verification':
    'Add an extra layer of security by requiring signers to verify their identity with a one‑time password (OTP) sent to their mobile device.',
  'Biometric verification':
    'Use biometric data such as fingerprint or facial recognition to confirm signer identity and enhance security for sensitive documents.',
}

const COMPARISON_GROUPS: {
  heading: string
  features: Record<string, Record<PlanId, boolean | string>>
}[] = [
    {
      heading: 'Usage',
      features: {
        'Secure & Compliant eSignatures': { explore: '10 per month', business: '100', custom: 'As per requirment' },
        'Documents sent': { explore: '10 per month', business: '100', custom: 'unlimited' },
        'PDF Tools': { explore: 'Unlimited conversion', business: 'PDF Editor Support', custom: 'unlimited' },
        'Documents Tracking': { explore: false, business: true, custom: true },
        // 'Mobile App': { explore: true, business: true, custom: true },
      },
    },
    {
      heading: 'Build professional, error-free documents',
      features: {
        'Reuse your own documents': { explore: true, business: true, custom: true },
        'Bulk import': { explore: true, business: true, custom: true },
        'Document editor': { explore: 'up to 5', business: true, custom: true },
        'Templates': { explore: 'up to 5', business: 'Unlimited', custom: true },
        'Web Forms': { explore: 'up to 5', business: 'Unlimited', custom: true },
        'AI based smart content': { explore: '1', business: '100', custom: true },
      },
    },
    {
      heading: 'Branding & collaboration',
      features: {
        'Inline comments': { explore: true, business: true, custom: true },
        'Content library': { explore: false, business: false, custom: true },
        // 'Approval workflows': { explore: false, business: false, custom: true },
        'Rooms': { explore: false, business: false, custom: true },

      },
    },
    {
      heading: 'Send & Sign',
      features: {
        'Bulk Send': { explore: true, business: true, custom: true },
        'Signing order': { explore: true, business: true, custom: true },
        'Reminders & deadlines': { explore: true, business: true, custom: true },
        'In-person signing': { explore: true, business: true, custom: true },
        'Notary': { explore: false, business: false, custom: true },
      },
    },
    {
      heading: 'Authentication & security',
      features: {
        'Cryptographic Signatures with audit trail': { explore: true, business: true, custom: true },
        'Aadhar based signer verification': { explore: false, business: true, custom: true },
        'OTP based signer verification': { explore: false, business: true, custom: true },
        'Biometric verification': { explore: false, business: true, custom: true },
      },
    },
    {
      heading: 'Security & compliance',
      features: {
        'Real-time notifications': { explore: true, business: true, custom: true },
        'Audit trail': { explore: true, business: true, custom: true },
        'Signature certificate': { explore: true, business: true, custom: true },
        'Two-Factor Authentication': { explore: true, business: true, custom: true },
        'PKI-Based Digital Signatures': { explore: true, business: true, custom: true },
        'GDPR compliance': { explore: true, business: true, custom: true },
        'Automated reports': { explore: true, business: true, custom: true },
      },
    },
    {
      heading: 'Admin & User Management',
      features: {
        'User management': { explore: true, business: true, custom: true },
        'Team Organization': { explore: true, business: true, custom: true },
        'Shared Organization': { explore: true, business: true, custom: true },
        'Single Sign-On (SSO)': { explore: false, business: false, custom: true },
      },
    },
    {
      heading: 'Support',
      features: {
        'Help Center 24/7': { explore: true, business: true, custom: true },
        'Email support 24/7': { explore: true, business: true, custom: true },
        'Chat support': { explore: true, business: true, custom: true },
        'Dedicated Customer Success Manager': { explore: false, business: false, custom: true }
      },
    },
  ]

type FaqCategoryId = 'getting-started' | 'signing' | 'verification' | 'billing'

const FAQ_CATEGORIES: { id: FaqCategoryId; label: string }[] = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'signing', label: 'Signing & Workflow' },
  { id: 'verification', label: 'Verification & Security' },
  { id: 'billing', label: 'Billing & Account' },
]

const FAQ_ITEMS: { category: FaqCategoryId; q: string; a: string }[] = [
  {
    category: 'getting-started',
    q: 'Is document sending free?',
    a: `Yes. With ${APP_NAME}, sending documents for signing is always free. You only pay when you add extra verification methods (Aadhaar, OTP via Email/WhatsApp/SMS, or Biometric) on top of the free cryptographic signature.`,
  },
  {
    category: 'getting-started',
    q: 'Do signers need to install an app?',
    a: 'No. Signers can open the signing link in any modern browser on desktop or mobile and complete the process without downloading an app or creating an account.',
  },
  {
    category: 'getting-started',
    q: 'How do signers receive the document?',
    a: 'Signers receive a secure link by email. They open the link on any device, complete the required verification (e.g. OTP or Aadhaar), and sign. No account is required for signers.',
  },
  {
    category: 'getting-started',
    q: 'What is cryptographic signature?',
    a: 'It is a digital signature that uses encryption to bind the signer’s identity to the document and detect any tampering. It is included free with every document and ensures integrity and authenticity.',
  },
  {
    category: 'signing',
    q: 'Can I have multiple signers on one document?',
    a: 'Yes. You can add multiple recipients and set the signing order. Each signer gets a private link to sign. You can assign different verification methods per signer and drag-and-drop signature, date, and other fields onto the PDF for each recipient.',
  },
  {
    category: 'signing',
    q: 'Can I reorder the signing sequence?',
    a: 'Yes. Before sending or paying, you can drag and reorder signers so they sign in the sequence you want. The signing order is shown in the confirmation step and can be edited there as well.',
  },
  {
    category: 'signing',
    q: 'What happens after everyone has signed?',
    a: 'Once all signers have completed their part, the fully signed agreement is automatically shared with all participants via email, along with a detailed audit trail. The completed document is also available in both the sender’s and recipients’ dashboard for easy access and tracking.',

  },
  {
    category: 'signing',
    q: 'Can I change or cancel after sending?',
    a: 'You can manage the envelope from your dashboard: remind signers where allowed. After a document is signed, it cannot be altered.',
  },
  {
    category: 'verification',
    q: 'Are e-signatures legally valid?',
    a: 'Electronic signatures are recognized under the Information Technology Act, 2000 in India when they comply with prescribed requirements and applicable rules. The Act provides legal recognition to electronic records and digital signatures that meet its standards.'
  },
  
  {
    category: 'verification',
    q: 'How do verification methods work?',
    a: 'You can choose Cryptographic Signature (free), Aadhaar-based verification, OTP (sent to email, WhatsApp, or SMS), and Biometric verification. Each added method increases signer identity assurance and is charged per document as shown in the pricing section.',
  },
  {
    category: 'verification',
    q: 'How is my document kept secure?',
    a: 'Documents are transmitted and stored using encryption. Verification methods (OTP, Aadhaar, biometric) ensure the right person is signing. Cryptographic signing makes any change to the document detectable.',
  },
  {
    category: 'verification',
    q: 'Can I use this for agreements and legal documents?',
    a: 'Yes. The platform is suitable for contracts, agreements, affidavits, indemnity bonds, and other legal documents. Higher verification tiers (e.g. Aadhaar, OTP, biometric) are recommended for high-value or regulated use cases.',
  },
  {
    category: 'billing',
    q: 'When am I charged?',
    a: 'You are only charged for the verification methods you add per document (Aadhaar, OTP, Biometric). Document sending and the basic cryptographic signature are free. The total is shown before you pay.',
  },
  {
    category: 'billing',
    q: 'Can I change my plan or verification choices later?',
    a: 'For per-document pricing, you choose verification methods for each document before sending. You can start with free-only signing or add paid verification as needed for that document.',
  },
  {
    category: 'billing',
    q: 'What payment methods do you accept?',
    a: 'We accept major credit/debit cards and other payment options as shown at checkout. Invoicing may be available for enterprise plans.',
  },
  {
    category: 'billing',
    q: 'Is there a free trial?',
    a: 'Document sending is always free. You can send documents with the free cryptographic signature at no cost. Paid verification methods are charged per document when you choose to add them.',
  },
]

type ActiveFeatureHelp = { name: string; align: 'left' | 'right' } | null

const Pricing = () => {
  const [billing, setBilling] = useState<BillingPeriod>('annually')
  const [pricingMode, _setPricingMode] = useState<PricingMode>('subscription')
  const [perDocTab, setPerDocTab] = useState<PerDocTabId>('safemax')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [faqCategory, setFaqCategory] = useState<FaqCategoryId>('getting-started')
  const [activeFeatureHelp, setActiveFeatureHelp] = useState<ActiveFeatureHelp>(null)
  const [activeAddOnModal, setActiveAddOnModal] = useState<string | null>(null)

  // Close feature tooltips when clicking anywhere on the document
  useEffect(() => {
    const handleClick = () => {
      setActiveFeatureHelp(null)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const annualDiscount = 0.46

  return (
    <div className="min-h-screen bg-sky-50 pt-24">    
      <section className="relative overflow-hidden mt-6">     
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="heading font-bold">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-sm text-slate-600">
              No extra charges. No hidden fees.
            </p>

            {/* Pricing mode: Subscription vs Per document */}
            {/* <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="pricingMode"
                  checked={pricingMode === 'subscription'}
                  onChange={() => setPricingMode('subscription')}
                  className="h-4 w-4 border-slate-300 text-[#260559] focus:ring-[#260559]"
                />
                <span className="text-xs font-medium text-slate-700">Subscription</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="pricingMode"
                  checked={pricingMode === 'perDocument'}
                  onChange={() => setPricingMode('perDocument')}
                  className="h-4 w-4 border-slate-300 text-[#260559] focus:ring-[#260559]"
                />
                <span className="text-xs font-medium text-slate-700">Per document pricing</span>
              </label>
            </div> */}

            {/* Billing toggle (only when subscription) */}
            {pricingMode === 'subscription' && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>
                  Monthly
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={billing === 'annually'}
                  onClick={() => setBilling(billing === 'monthly' ? 'annually' : 'monthly')}
                  className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full transition-colors  ${billing === 'annually' ? 'bg-[#084bdc]' : 'bg-slate-200'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 mt-1 transform rounded-full bg-white shadow ring-0 transition ${billing === 'annually' ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
                <span className={`text-sm font-medium ${billing === 'annually' ? 'text-slate-900' : 'text-slate-500'}`}>
                  Annually
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                  Save up to {Math.round(annualDiscount * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Plan cards (subscription only) */}
      {pricingMode === 'subscription' && (
        <section className='py-4 mt-8'>
          <div className="container-max px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {PLANS.map((plan) => {
                const price = billing === 'annually' ? plan.priceAnnually : plan.priceMonthly
                const periodLabel = billing === 'annually' ? plan.periodLabelAnnually : plan.periodLabelMonthly
                const isCustom = plan.id === 'custom'
                const isBusiness = plan.id === 'business'
                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md ${plan.highlight ? 'border-[#084bdc] ring-2 ring-[#084bdc]/20' : 'border-slate-200'
                      }`}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#084bdc] px-3 py-1 text-xs font-medium text-white">
                        Most popular
                      </div>
                    )}
                    <h3 className="desc-text text-lg">{plan.name}</h3>
                    <p className="details-text">{plan.tagline}</p>
                    <div className="mt-6">
                      {isCustom ? (
                        <span className="text-2xl font-bold text-slate-900">Let's talk</span>
                      ) : (
                        <>
                          <span className="text-2xl font-bold text-slate-900">
                            ${price}
                            {/* <span className="text-base font-normal text-slate-500">USD</span> */}
                          </span> <br />
                          <span className="details-text">{periodLabel}</span>
                        </>
                      )}
                    </div>
                    <Link to={plan.ctaLink} className="mt-6 block">
                      <button
                        type="button"
                        className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition ${plan.highlight
                          ? 'bg-[#084bdc] text-white hover:bg-[#084bdc]/90'
                          : isCustom
                            ? 'border-2 border-slate-300 text-slate-700 hover:border-slate-400'
                            : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                          }`}
                      >
                        {plan.cta}
                      </button>
                    </Link>
                    <p className="mt-3 text-xs text-slate-500">No credit card required</p>

                    <ul className="mt-6 flex-1 space-y-3 border-t border-slate-100 pt-6">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Key features</span>
                      {(isBusiness || isCustom) && (
                        <p className="font-semibold text-black-500 text-sm">
                          Everything in Starter, plus:
                        </p>
                      )}

                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 details-text">
                          <Check className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="mt-8">
            <h3 className="text-center text-sm text-slate-500">Prices exclude any applicable taxes. </h3><br />
            <a
              href="#compare"
              className="block text-center text-slate-700 mx-auto "
            >
              Compare all features <ArrowRight className="inline h-4 w-4" />
            </a>
          </div>

        </section>
      )}

      {/* Add-on feature modals */}
      {activeAddOnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-w-lg w-full rounded-2xl bg-white p-6 sm:p-8 shadow-2xl">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setActiveAddOnModal(null)}
              className="ml-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {activeAddOnModal === 'Traditional Sign / Stamp' && (
              <>
                <h3 className="price-heading">Traditional Sign / Stamp</h3>
                <div className="mt-4 flex justify-center">
                  <video
                    src='/videos/signature.mp4'
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-30 w-auto"
                  />
                </div>
                <p className="mt-4 text-sm text-slate-700">
                  Use a familiar handwritten signature or stamp impression alongside digital processes, so signers can
                  complete documents in a way that feels natural.
                </p>
                <p className="text-heading mt-2">Key benefits</p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-slate-700">

                  <li>Familiar signing method that’s easy to explain.</li>
                  <li>Works well for people used to paper-based processes.</li>
                  <li>Can be combined with digital signing flows.</li>
                </ul>
              </>
            )}

            {activeAddOnModal === 'AI Face Verified' && (
              <>
                <h3 className="price-heading">AI Face Verified</h3>
                <div className="mt-4 flex justify-center">
                  <Lottie
                    animationData={faceScan}
                    loop
                    autoPlay
                    className="h-30 w-auto"
                  />
                </div>
                <p className="mt-4 text-sm text-slate-700">
                  Use AI‑powered face checks to confirm that a real person is present during the signing process and
                  reduce the risk of misuse of photos or videos.
                </p>
                <p className="mt-2 text-heading">Key benefits</p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-slate-700">
                  <li>Helps prevent photo or video spoofing attempts.</li>
                  <li>Provides real‑time presence checks for signers.</li>
                  <li>Adds an extra security layer to sensitive sign flows.</li>
                </ul>
              </>
            )}

            {activeAddOnModal === 'Aadhaar Photo Match' && (
              <>
                <h3 className="price-heading">Aadhaar Photo Match</h3>
                <div className="mt-4 flex justify-center">
                  <Lottie
                    animationData={aadhaarPhotoMatchAnim}
                    loop
                    autoPlay
                    className="h-30 w-auto"
                  />
                </div>
                <p className="mt-4 text-sm text-slate-700">
                  Compare a live capture of the signer with the photo from their Aadhaar document to help confirm that
                  the person signing is the same person on record.
                </p>
                <p className="mt-2 text-heading">Key benefits</p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-slate-700">
                  <li>Aligns the signing experience with Aadhaar‑based verification.</li>
                  <li>Helps reduce the risk of impersonation.</li>
                  <li>Supports additional checks for higher‑risk agreements.</li>
                </ul>
              </>
            )}

            {activeAddOnModal === 'Strong Video Proof' && (
              <>
                <h3 className="price-heading">Strong Video Proof</h3>
               <div className="mt-4 flex justify-center">
                  <Lottie
                    animationData={strongVideoProofAnim}
                    loop
                    autoPlay
                    className="h-40 w-auto"
                  />
                </div>
                <p className="mt-4 text-sm text-slate-700">
                  Record video evidence of the signing session so you can visually review how and when consent was
                  given, alongside your standard agreement records.
                </p>
                <p className="mt-2 text-heading">Key benefits</p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-slate-700">
                  <li>Captures the full signing journey as it happens.</li>
                  <li>Gives visual confirmation of signer actions and intent.</li>
                  <li>Provides a time‑stamped record that can be reviewed later.</li>
                </ul>
              </>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveAddOnModal(null)}
                className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-900"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Per-document pricing: 3 tabs + detail card */}
      {pricingMode === 'perDocument' && (
        <section className="py-8">
          <div className="container-max max-w-xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              {/* Tabs */}
              <div className="flex flex-wrap justify-center gap-3">
                {(['safelite', 'safepro', 'safemax'] as const).map((id) => {
                  const plan = PER_DOC_PLANS[id]
                  const isActive = perDocTab === id
                  const isRecommended = id === 'safemax'
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPerDocTab(id)}
                      className={`relative rounded-xl border-2 px-6 py-4 text-left transition  ${isActive
                        ? 'border-[#084bdc] bg-sky-50/80 text-slate-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                    >
                      {isRecommended && (
                        <span className="absolute -top-2.5 right-2 rounded bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          Recommended
                        </span>
                      )}
                      <span className="block text-xs font-bold">{plan.name}</span>
                      <span className="block text-xs text-slate-500">{plan.subtitle}</span>
                    </button>
                  )
                })}
              </div>

              {/* Detail card for selected tab */}
              <div className="mt-6 rounded-2xl border-2 border-[#084bdc] bg-white p-6 shadow-sm md:p-8">
                {(() => {
                  const plan = PER_DOC_PLANS[perDocTab]
                  return (
                    <>
                      <p className="text-sm font-bold text-slate-900">
                        {plan.name} ₹{plan.price}{' '}
                        <span className="text-xs font-normal text-slate-600">/ Signer • per document</span>
                      </p>
                      <p className="mt-2 details-text">{plan.description}</p>

                      <div className="mt-6">
                        <h4 className="flex items-center gap-1.5 font-bold text-slate-900">
                          Add on Features
                          <Info className="h-4 w-4 text-slate-400" aria-hidden />
                        </h4>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {plan.addOnFeatures.map((f) => (
                            <button
                              type="button"
                              key={f.label}
                              onClick={() => setActiveAddOnModal(f.label)}
                              className={`flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 text-left ${!f.included ? 'opacity-75' : ''}`}
                            >
                              {f.included ? (
                                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                </span>
                              ) : (
                                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                                  <X className="h-3.5 w-3.5 text-red-600" />
                                </span>
                              )}
                              <span className={f.included ? 'text-slate-800 text-sm' : 'text-slate-500'}>{f.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {plan.notes.length > 0 && (
                        <ul className="mt-4 list-disc space-y-1 pl-4 text-xs text-[#084bdc]">
                          {plan.notes.map((note, i) => (
                            <li key={i}>{note}</li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-6">
                        <h4 className="font-bold text-slate-900">Included benefits</h4>
                        <p className={`mt-1 text-xs ${plan.includedBenefits.startsWith('✔') ? 'text-emerald-600' : 'text-slate-600'}`}>
                          {plan.includedBenefits}
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </section>
      )}
      <section className="bg-gray-100 py-16 sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          {/* Left content */}
          <div className="lg:w-1/2">           
              <h2 className="heading leading-tight">
              Sign PDFs online
              <span className='block text-primary leading-tight'>for free</span>
            </h2>
            <p className="details-text">
            Offer a simple and secure way to upload, send, and track agreements — at no cost. Create your document, add signers, and complete signatures with a smooth, step-by-step workflow.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link to='/sign-pdf-online' className="inline-flex items-center justify-center rounded-full bg-[#084bdc] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#084bdc]/80">
                Upload PDF now
              </Link>
              <span className="text-sm font-semibold text-[#084bdc]">Try It Free - Send in Minutes</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600 sm:text-[11px]">
              <div className="inline-flex items-center gap-1">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[9px] font-semibold text-emerald-700">
                  ✓
                </span>
                <span>Secure signing for individuals and teams</span>
              </div>
              <div className="inline-flex items-center gap-1">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[9px] font-semibold text-emerald-700">
                  ✓
                </span>
                <span>Real-time status tracking for every document</span>
              </div>
              <div className="inline-flex items-center gap-1">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[9px] font-semibold text-emerald-700">
                  ✓
                </span>
                <span>Complete audit trail of signatures and activity</span>
              </div>
            </div>
          </div>

          {/* Right image */}
          <div className="flex justify-center lg:w-1/2">
            <div className="w-full max-w-4xl">
              <video
                src="/videos/scan.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 object-contain shadow-md"
              />
              {/* <p className="mt-3 text-center text-xs font-medium text-slate-500">
                Capture all key Aadhaar‑linked details in one guided signing experience.
              </p> */}
            </div>
          </div>
        </div>
      </section>

      {/* Compare plans table */}
      <section id='compare' className="border-t border-slate-200 bg-slate-50/50 py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl heading font-bold text-slate-900 md:text-4xl">Compare the plans</h2>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse rounded-xl border border-slate-200 bg-white shadow-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-4 text-left text-sm font-semibold text-slate-700 align-bottom">

                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700 align-bottom">

                  </th>
                  {/* Free */}
                  <th className="p-4 text-center align-bottom">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-heading">Free</span>
                      <span className="text-xs text-slate-500">$0 user/mo</span>
                      <Link to="/signup"
                        className="mt-2 inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-900 hover:text-white hover:bg-[#084bdc]"
                      >
                        Sign up for Free
                      </Link>
                    </div>
                  </th>
                  {/* Business (highlighted) */}
                  <th className="p-4 text-center align-bottom rounded-t-2xl border-t-2 border-x-2 border-[#084bdc]">
                    <div className="flex flex-col items-center gap-1 rounded-2xl bg-[#eaf0fc] px-4 py-3 shadow-sm">
                      <span className="text-sm font-semibold text-slate-900">Business</span>
                      <span className="text-xs text-slate-600">$6 user/mo billed annually</span>
                      <Link to="/signup"
                        className="mt-2 inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-900 text-white bg-[#084bdc] hover:bg-white hover:text-black "
                      >
                        Request a demo
                      </Link>
                    </div>
                  </th>
                  {/* Enterprise */}
                  <th className="p-4 text-center align-bottom">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-semibold text-slate-900">Custom</span>
                      <span className="text-xs text-slate-500">Per-seat or per-document pricing</span>
                      <button
                        type="button"
                        className="mt-2 inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                      >
                        Contact us
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_GROUPS.map((group, groupIndex) => (
                  <Fragment key={`group-${groupIndex}`}>
                    {/* Category breakpoint heading */}
                    <tr className="border-b border-slate-200 bg-slate-50/70">
                      <td className="p-3 pl-4 text-sm font-bold text-slate-900">
                        {group.heading}
                      </td>
                      {/* Empty cell for the help icon column to keep column alignment */}
                      <td />
                      {PLAN_IDS.map((plan) => {
                        const isBusinessCol = plan === 'business'
                        return (
                          <td
                            key={`${group.heading}-${plan}`}
                            className={isBusinessCol ? 'border-x-2 border-[#084bdc]' : ''}
                          />
                        )
                      })}
                    </tr>
                    {/* Feature rows under this group */}
                    {(() => {
                      const featureEntries = Object.entries(group.features)
                      const isLastGroup = groupIndex === COMPARISON_GROUPS.length - 1
                      return featureEntries.map(([feature, cols], featureIndex) => {
                        const isLastRowInGroup = featureIndex === featureEntries.length - 1
                        const isLastRowOverall = isLastGroup && isLastRowInGroup
                        return (
                          <tr key={feature} className="border-b border-slate-100">
                            <td className="p-4 text-sm text-slate-700">
                              <div className="inline-flex items-center gap-1.5">
                                <span>{feature}</span>
                              </div>
                            </td>
                            <td>
                              <button
                                type="button"
                                data-feature-help="true"
                                className="relative flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400 hover:text-slate-600"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  const buttonEl = event.currentTarget as HTMLElement
                                  const rect = buttonEl.getBoundingClientRect()
                                  const spaceRight = window.innerWidth - rect.right
                                  const align: 'left' | 'right' = spaceRight < 260 ? 'left' : 'right'

                                  setActiveFeatureHelp((current) =>
                                    current?.name === feature ? null : { name: feature, align }
                                  )
                                }}
                                aria-label="More info"
                              >
                                <HelpCircle className="h-3 w-3" />
                                {activeFeatureHelp?.name === feature && (
                                  <div
                                    className={`absolute  left-1/2  -translate-x-1/2  top-full z-30 mt-2 w-72 rounded-lg bg-slate-900 px-4 py-3 text-xs text-white shadow-lg ${activeFeatureHelp.align === 'left' ? 'right-0' : 'left-0'
                                      }`}
                                  >
                                    <p>{FEATURE_HELP[feature] ?? 'More details coming soon for this feature.'}</p>
                                    <div
                                      className={`absolute  left-1/2  -translate-x-1/2  -top-1.5 h-3 w-3 rotate-45 bg-slate-900 `}
                                    />
                                  </div>
                                )}
                              </button>
                            </td>
                            {PLAN_IDS.map((plan) => {
                              const val = cols[plan]
                              const isBusinessCol = plan === 'business'
                              const businessBorderClasses = isBusinessCol
                                ? `border-x-2 border-[#084bdc] ${isLastRowOverall ? 'border-b-2' : ''}`
                                : ''
                              return (
                                <td
                                  key={plan}
                                  className={`p-4 text-center ${businessBorderClasses}`}
                                >
                                  {val === true ? (
                                    <Check className="mx-auto h-5 w-5 p-1 text-white bg-blue-800 rounded-full" />
                                  ) : val === false ? (
                                    <Minus className="mx-auto h-5 w-5 text-slate-300" />
                                  ) : (
                                    <span className="text-sm text-slate-600">{String(val)}</span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })
                    })()}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-center text-sm text-slate-500">Prices exclude any applicable taxes.</p>
        </div>
      </section>

      {/* FAQ — category tabs + filtered list */}
      <section className="relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-slate-50/50" />
        <div className="container-max relative px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="heading">
              Frequently asked questions
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Choose a category to see related questions
            </p>
          </div>

          {/* Category tabs */}
          <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-2">
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setFaqCategory(cat.id)
                  setOpenFaq(null)
                }}
                className={`flex gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  faqCategory === cat.id
                    ? 'bg-[#084bdc] text-white shadow'
                    : 'bg-white text-slate-700 shadow-sm hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.label} <span className='mt-0.5'><Plus className='h-4 w-4' /></span>
              </button>
            ))}
          </div>

          {/* FAQ list for selected category */}
          <div className="mx-auto mt-8 max-w-3xl space-y-3">
            {FAQ_ITEMS.filter((item) => item.category === faqCategory).map((item, index) => {
              const isOpen = openFaq === index
              return (
                <div
                  key={`${item.category}-${index}`}
                  className="rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-semibold text-slate-900"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    {item.q}
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-100 px-4 pb-4 pt-2 text-sm text-slate-600">
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
   <DigitaCertificate />

      {/* Bottom CTA */}
      <section className="bg-gradient-to-br from-[#260559] to-[#3a0a7e] py-16 text-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold md:text-3xl">
              Streamline your document workflow
            </h2>
            <p className="mt-4 text-lg text-[#CBB9FF]">
              Get a <strong>personalized</strong> 1:1 demo with our product specialist.
            </p>
            <ul className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-white/90">
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-300" />
                Tailored to your needs
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-300" />
                Answers all your questions
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-300" />
                No commitment to buy
              </li>
            </ul>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/book-demo"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-[#260559] shadow-lg hover:bg-slate-100"
              >
                Schedule your free live demo
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/contact-sales"
                className="inline-flex items-center rounded-full border-2 border-white px-8 py-4 font-semibold hover:bg-white hover:text-[#260559]"
              >
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Pricing
