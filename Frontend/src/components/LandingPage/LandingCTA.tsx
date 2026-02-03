import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const LandingCTA = () => {
  return (
    <section className="section-padding bg-[#001039] text-white">
      <div className="container-max text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          E-sign, verify &amp; manage PDFs—all in one place
        </h2>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
          Start free. No credit card required. Get 10 envelopes and full access to PDF tools.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-semibold px-6 py-3.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Start free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 border-2 border-slate-500 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>
    </section>
  )
}

export default LandingCTA
