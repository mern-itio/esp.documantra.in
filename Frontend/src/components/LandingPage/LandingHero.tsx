import { ChevronsLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const LandingHero = () => {
  return (
    <section className="relative overflow-hidden bg-[#fdfdfd] pt-24 pb-16 md:pt-28 md:pb-20">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/bg.svg"
          alt=""
          className="h-full w-full object-cover opacity-80"
        />
        
      </div>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_70%_20%,rgba(38,5,89,0.08),transparent_50%),radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.06),transparent_50%)]" />
      <div className="container-max section-padding relative z-10">
        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-10 items-center">
          {/* Left: copy + actions */}
          <div className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
            <h1 className="heading  text-gray-900 tracking-tight leading-[1.1] mb-6">
              E-Sign, verify &amp; manage PDFs
              <span className="block gradient-text mt-1">in one secure platform</span>
            </h1>
            <p className="text-sm  max-w-xl mb-8 ">
              Upload documents, verify signers with Aadhaar, collect e-signatures, and use 30+ PDF tools all with a full audit trail and legal compliance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Link to="/signup" className="inline-flex items-center justify-center gap-2 bgColor text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg hover:bgColor/100 transition-colors">
               Try Now
               <ChevronsLeft className="h-4 w-4 rotate-180" />              
              </Link>
              <Link to="#e-sign-flow" className="inline-flex items-center justify-center gap-2 border-2 border-[#084bdc] text-[#084bdc] font-semibold px-6 py-3.5 rounded-xl hover:bg-[#260559]/5 transition-colors">
                See e-sign flow
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center gap-2 text-gray-600 font-medium px-6 py-3.5 rounded-xl hover:bg-gray-100 transition-colors">
                PDF tools
              </Link>
            </div>
          </div>

          {/* Right: signature video preview */}
          <div className="hidden md:block">
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-slate-900 shadow-2xl">
              <div className="aspect-video">
                <video
                  className="h-full w-full object-cover"
                  src="/videos/signature.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live signing preview
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-xs text-white/80 flex items-center justify-between gap-3">
                <span>Sign from any device in seconds.</span>
                <span className="hidden sm:inline text-white/60">No account needed for signers.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LandingHero
