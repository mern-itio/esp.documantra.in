import { Smartphone, MousePointer, FileSignature, CheckCircle, ChevronsLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const SignatureExperienceSection = () => {
  return (
    <section className="section-padding bg-slate-50">
      <div className="container-max">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-200/80 px-3 py-1.5 text-xs font-medium text-slate-700 mb-4">
              <FileSignature className="h-4 w-4" />
              Signing experience
            </div>
            <h2 className="sub-heading gradient-text">
              Sign from any device no account needed
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-xl">
              Recipients open the link, review the document, and sign with a click or draw. They don’t need to create an account. You get the signed PDF and a legal audit trail.
            </p>
            <ul className="space-y-4">
              {[
                'One-click or draw signature',
                'Works on mobile and desktop',
                'Legal validity with audit trail',
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
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
              <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                <Smartphone className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">Signer view</span>
              </div>
              <div className="mt-4 space-y-4">
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  Document: NDA_Contract.pdf
                </div>
                <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-4">
                  <MousePointer className="h-5 w-5 text-indigo-500" />
                  <span className="text-sm font-medium text-indigo-700">Click to sign here</span>
                </div>
                <p className="text-xs text-gray-500">
                  Signer opens link → reviews → signs. No signup required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SignatureExperienceSection
