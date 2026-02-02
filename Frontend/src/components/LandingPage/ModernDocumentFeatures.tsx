import { CheckCircle2, Shield, Zap, Globe2, Clock3 } from 'lucide-react'

const ModernDocumentFeatures = () => {
  return (
    <section className="section-padding bg-slate-950 text-white">
      <div className="container-max">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs md:text-sm font-medium text-slate-100 backdrop-blur">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/20">
              <Zap className="h-3 w-3 text-emerald-300" />
            </span>
            Modern, compliant e‑signing for teams
          </div>
        </div>

        {/* Main layout */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center">
          {/* Left: Copy */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight">
              The new standard for
              <span className="block bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 bg-clip-text text-transparent">
                secure digital signatures
              </span>
            </h2>

            <p className="text-sm md:text-base text-slate-300 max-w-xl">
              Draft, send, and sign agreements in minutes—not days. Draft &amp; Sign
              brings AI, e‑signatures, and PDF workflows together in one clean
              experience designed for modern legal, sales, and operations teams.
            </p>

            {/* Key points */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                <div className="mb-3 inline-flex items-center gap-2 text-emerald-300 text-xs font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Frictionless signing
                </div>
                <p className="text-xs md:text-sm text-slate-200">
                  One-click signing on any device with no account required for your signers.
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                <div className="mb-3 inline-flex items-center gap-2 text-cyan-300 text-xs font-medium">
                  <Shield className="h-4 w-4" />
                  Enterprise‑grade security
                </div>
                <p className="text-xs md:text-sm text-slate-200">
                  Encrypted at rest and in transit with full audit trails for every signature event.
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                <div className="mb-3 inline-flex items-center gap-2 text-sky-300 text-xs font-medium">
                  <Globe2 className="h-4 w-4" />
                  Global compliance
                </div>
                <p className="text-xs md:text-sm text-slate-200">
                  Built to meet eIDAS, ESIGN, and GDPR standards so you can sign anywhere with confidence.
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                <div className="mb-3 inline-flex items-center gap-2 text-amber-300 text-xs font-medium">
                  <Clock3 className="h-4 w-4" />
                  Faster cycle times
                </div>
                <p className="text-xs md:text-sm text-slate-200">
                  Templates, bulk send, and smart reminders cut deal and approval times by up to 80%.
                </p>
              </div>
            </div>

            {/* Mini stats */}
            <div className="flex flex-wrap gap-6 pt-2">
              <div>
                <div className="text-lg md:text-2xl font-semibold text-white">10K+</div>
                <div className="text-xs md:text-sm text-slate-400">Documents signed every month</div>
              </div>
              <div>
                <div className="text-lg md:text-2xl font-semibold text-white">4.9/5</div>
                <div className="text-xs md:text-sm text-slate-400">Average signer satisfaction</div>
              </div>
              <div>
                <div className="text-lg md:text-2xl font-semibold text-white">3x</div>
                <div className="text-xs md:text-sm text-slate-400">Faster time‑to‑signature</div>
              </div>
            </div>
          </div>

          {/* Right: Product video card */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-2xl">
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_60%)]" />

              {/* Video */}
              <div className="relative aspect-video">
                <video
                  className="h-full w-full object-cover"
                  src="/videos/signature.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                />

                {/* Overlay gradient */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />

                {/* Floating label */}
                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium text-slate-100 backdrop-blur">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live signing experience
                </div>

                {/* Bottom overlay content */}
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300/70">
                        Overview
                      </p>
                      <p className="text-xs md:text-sm font-medium text-slate-50">
                        Watch how documents move from draft to signed in under a minute.
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-slate-100">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      No training required
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Glow + shadow */}
            <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[32px] bg-gradient-to-br from-emerald-500/15 via-cyan-500/10 to-sky-500/0 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default ModernDocumentFeatures