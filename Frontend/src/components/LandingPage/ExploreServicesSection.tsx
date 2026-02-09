import React from 'react'

type ServiceKey = 'pdf' | 'esign'

const services: Record<
  ServiceKey,
  {
    label: string
    title: string
    description: string
  }
> = {
  pdf: {
    label: 'PDF Service',
    title: 'Prepare, protect, and share PDFs effortlessly',
    description:
      'Upload contracts, agreements, and supporting documents, then optimise them for review and signing. Compress, merge and organise PDFs so they are always ready to send.',
  },
  esign: {
    label: 'E‑Sign Service',
    title: 'Collect secure e‑signatures in a few clicks',
    description:
      'Send documents for signature, define signer roles, and track status from one place. Ensure every signature is compliant and auditable end‑to‑end.',
  },
}

const ExploreServicesSection: React.FC = () => {
  const [active, setActive] = React.useState<ServiceKey>('pdf')
  const activeService = services[active]

  return (
    <section className="relative bg-slate-900 py-14 sm:py-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:gap-12 lg:px-8">
        {/* Left: Heading */}
        <div className="lg:w-5/12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Explore services
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
            Choose how you want to work with documents
          </h2>
          <p className="mt-3 text-sm text-slate-300 sm:text-[15px]">
            Switch between PDF tools and e‑sign workflows with a single click. Start with files, finish with
            legally‑binding signatures.
          </p>
        </div>

        {/* Right: Toggle + content */}
        <div className="lg:w-7/12">
          <div className="inline-flex rounded-full border border-slate-700 bg-slate-800/70 p-1 text-xs font-medium text-slate-300 shadow-sm">
            <button
              type="button"
              onClick={() => setActive('pdf')}
              className={`inline-flex items-center gap-1 rounded-full px-4 py-2 transition ${
                active === 'pdf' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-white'
              }`}
            >
              PDF Service
            </button>
            <button
              type="button"
              onClick={() => setActive('esign')}
              className={`inline-flex items-center gap-1 rounded-full px-4 py-2 transition ${
                active === 'esign' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-white'
              }`}
            >
              E‑Sign Service
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-800/70 p-5 shadow-lg sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
              {activeService.label}
            </p>
            <h3 className="mt-2 text-base font-semibold text-white sm:text-lg">{activeService.title}</h3>
            <p className="mt-2 text-sm text-slate-300 sm:text-[15px]">{activeService.description}</p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                Get started
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-400 hover:text-white"
              >
                Learn more
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ExploreServicesSection

