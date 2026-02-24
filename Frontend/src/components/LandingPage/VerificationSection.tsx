import { ShieldCheck, Fingerprint, FileCheck, Lock, CheckCircle2, PhoneCall } from 'lucide-react'
import { Link } from 'react-router-dom'

const VerificationSection = () => {
  const points = [
    {
      icon: Fingerprint,
      title: 'Aadhaar e‑KYC',
      description: 'Verify signer identity using Aadhaar OTP for high‑value and compliance‑heavy agreements.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure & compliant',
      description: 'Data is encrypted end‑to‑end and aligned with UIDAI, IT Act and eSign guidelines.',
    },
    {
      icon: FileCheck,
      title: 'Tamper‑proof audit trail',
      description: 'Every OTP, consent and signature event is logged with timestamp, IP, and device details.',
    },
    {
      icon: Lock,
      title: 'Granular access control',
      description: 'Restrict who can verify, set link expiry and enable step‑up verification when needed.',
    },
  ]

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 mb-4">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Trusted identity &amp; KYC
            </div>

            <h2 className="text-3xl md:text-4xl aadhar-heading text-slate-900 tracking-tight mb-3">
              Aadhaar verification {''}
              <span className="text-primary">
                built into service
              </span>
            </h2>

            <p className="text-base md:text-lg text-slate-600 max-w-xl mb-6 details-text">
              Add Aadhaar e‑KYC to your signing flows in a few clicks. We handle consent, OTP, and
              secure storage so that signature is backed by a verified Indian identity.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {points.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-xl bg-white/80 border border-slate-200/80 p-4 shadow-sm"
                  >
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bgColor px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
              >
                Start Aadhaar verification
                <CheckCircle2 className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <PhoneCall className="h-4 w-4 text-slate-500" />
                Talk to compliance
              </Link>
            </div>
          </div>

          {/* Right: verification card */}
          <div className="relative">
            <img
                src="./images/adhar-img.png"
                alt="Aadhaar verification flow"
                className="w-full h-auto object-contain max-h-[380px] object-center"
              />
          </div>
        </div>
      </div>
    </section>
  )
}

export default VerificationSection
