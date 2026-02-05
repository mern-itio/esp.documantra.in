import { ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

const VerificationSection = () => {
  // const points = [
  //   {
  //     icon: Fingerprint,
  //     title: 'Aadhaar-based verification',
  //     description: 'Verify signer identity using Aadhaar for high-assurance agreements.',
  //   },
  //   {
  //     icon: ShieldCheck,
  //     title: 'Secure & compliant',
  //     description: 'Data encrypted at rest and in transit. Compliant with Indian IT Act and eSign guidelines.',
  //   },
  //   {
  //     icon: FileCheck,
  //     title: 'Audit trail',
  //     description: 'Every view, sign, and verification event is logged with timestamp and IP.',
  //   },
  //   {
  //     icon: Lock,
  //     title: 'Access control',
  //     description: 'Role-based permissions and optional expiry for signing links.',
  //   },
  // ]

  return (
    <section className="section-padding bg-gradient-to-br from-[#260559] via-[#3d0d7a] to-[#260559] text-white">
      <div className="container-max">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 mb-4">
              <ShieldCheck className="h-4 w-4" />
              Identity & security
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Aadhaar verification &amp; secure signing
            </h2>
            <p className="text-lg text-white/80 max-w-xl mb-6">
              Verify signers with Aadhaar for critical agreements. Every signature is tied to a verifiable identity and a complete audit trail.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-[#260559] font-semibold px-5 py-3 hover:bg-white/95 transition-colors"
            >
              Enable verification
              <span aria-hidden>→</span>
            </Link>
          </div>
          <div className="space-y-6">
              <img
                src="/adhar.gif"
                alt="Aadhaar verification flow"
                className="w-full h-auto object-contain max-h-[280px] object-center"
              />
            
       
          </div>
        </div>
      </div>
    </section>
  )
}

export default VerificationSection
