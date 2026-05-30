import { FileSignature, CheckCircle, ChevronsLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const SignatureExperienceSection = () => {
  return (
    <section className="section-padding section-bg bg-[#F5F2EE]">
      <div className="container-max">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-200/80 px-3 py-1.5 text-xs font-medium text-slate-700 mb-4">
              <FileSignature className="h-4 w-4" />
              Signing experience
            </div>
            <h2 className="aadhar-heading text-3xl md:text-4xl tracking-tight mb-3">
              Sign from any device <span className='gradient-text'>no account needed</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-xl details-text">
             Track every document in real time from sending to final signature with a complete audit trail. Stay informed, stay compliant, and close deals faster without manual follow-ups.
            </p>
            <ul className="space-y-4">
              {[
                'One-click or draw signature',
                'Works on mobile and desktop',
                'PKI Certified signatures',
                'Download signed PDF instantly',
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="text-gray-700">{text}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#084bdc] text-white font-semibold px-5 py-3 hover:bg-[#084bdc]/90 transition-colors"
            >
              Send your first document
            <ChevronsLeft className="h-4 w-4 rotate-180" />
            </Link>
          </div>
          <div className="relative">
            <img src='./signer.png' alt="Signer experience preview" className="w-full rounded-2xl h-auto object-contain  object-center" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default SignatureExperienceSection
