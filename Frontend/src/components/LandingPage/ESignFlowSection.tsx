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
  return (
    <section id="e-sign-flow" className="section-padding bg-white">
      <div className="container-max">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 mb-4">
            How it works
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            E-sign flow in four steps
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From upload to signed document—with optional Aadhaar verification and full legal validity.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-14 items-center">
          {/* Left: workflow video */}
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-slate-900 shadow-xl">
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
            <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              E-sign workflow
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
              <p className="text-xs text-white/90">
                Upload → Add signers → Send → Sign
              </p>
            </div>
          </div>

          {/* Right: steps list */}
          <div className="space-y-6">
            {steps.map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={index}
                  className="flex gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#260559] text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-indigo-600">{item.step}</span>
                    <h3 className="font-semibold text-gray-900 mt-0.5">{item.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                </div>
              )
            })}
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-[#260559] font-semibold hover:underline"
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
