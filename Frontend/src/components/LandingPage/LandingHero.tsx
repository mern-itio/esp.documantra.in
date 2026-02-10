
import { Link } from 'react-router-dom'
import { APP_NAME } from '../constants/appConfig'

const LandingHero = () => {
  return (
    <section className="relative overflow-hidden bg-[#e9f3ff] text-slate-900 pt-24 pb-24 md:pt-28 md:pb-32">
    <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/images/bg-hero.avif"
          alt=""
          className="h-full w-full object-cover opacity-80"
        />
        
      </div>
      {/* Soft blue gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(255,255,255,0.9),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(219,234,254,0.9),transparent_60%),radial-gradient(circle_at_50%_70%,rgba(59,130,246,0.4),transparent_60%)]" />

      <div className="relative z-10 container-max px-4 md:px-6">
        {/* Top content */}
        <div className="max-w-4xl mx-auto text-center">
         
          <h1 className="mt-2 text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-5">
          Sign Documents Faster with 
            <span className="block text-indigo-600">
              {APP_NAME}
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-700/90 max-w-2xl mx-auto mb-8">
            Upload documents, verify signers, and collect secure e-signatures in minutes. Track every step in real time with a complete audit trail for transparency and compliance.
          </p>

          {/* Primary actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-6">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-full bg-[#2563eb] px-7 py-3 text-sm md:text-base font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.35)] hover:bg-[#1d4ed8] transition-colors"
            >
              Get started for free
            </Link>
            <Link
              to="/book-demo"
              className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-white/80 px-7 py-3 text-sm md:text-base font-semibold text-sky-700 shadow-sm hover:bg-white transition-colors"
            >
              Get a demo
            </Link>
          </div>

          {/* Small perks row */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs md:text-sm text-sky-900/80">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Secure & encrypted document workflows
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Real-time tracking & activity logs
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Fast setup with instant signing links
            </span>
          </div>
        </div>

        {/* Bottom card with video preview (instead of table) */}
        <div className="mt-10 md:mt-14 flex justify-center">
          <div className="relative w-full max-w-7xl rounded-2xl bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.18)] border border-sky-50 overflow-hidden">
            {/* Card header */}
            {/* <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3 text-xs md:text-sm font-medium text-slate-700">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-700 text-xs font-semibold">
                  DS
                </span>
                <span>Live signing session</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Real‑time signer view
              </div>
            </div> */}

            {/* Video body */}
              <div className="border border-slate-200/80 bg-slate-900 overflow-hidden shadow-sm">
                <div >
                  {/* <video
                    className="h-full w-full object-cover"
                    src="/videos/ai-features.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                  /> */}
                  <img
                    className="h-full w-full object-cover"
                    src="./Hero-image.png"
                    alt="Live signing session preview"
                  />
                </div>
              </div>

             
          </div>
        </div>
      </div>
    </section>
  )
}

export default LandingHero
