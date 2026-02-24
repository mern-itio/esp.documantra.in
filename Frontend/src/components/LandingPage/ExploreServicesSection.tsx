import React from 'react'

const ExploreServicesSection: React.FC = () => {

  return (
     <section className="bg-white py-10 sm:py-12 border-t border-slate-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Digital signatures powered by
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-2">
            {/* Replace these src values with your actual partner logos */}
            <img
              src="/images/partners/vsign_logo.png"
              alt="Certifying authority logo"
              className="h-5 w-auto object-contain"
            />
            <img
              src="/images/partners/aadhar.webp"
              alt="Aadhaar partner logo"
              className="h-5 w-auto object-contain"
            />
            <img
              src="/images/partners/cca.webp"
              alt="Ministry of IT logo"
              className="h-5 w-auto object-contain"
            />
          </div>
        </div>
      </section>
  )
}

export default ExploreServicesSection

