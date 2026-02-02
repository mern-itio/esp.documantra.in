import { Merge, FileText, Lock, Scan, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const tools = [
  {
    icon: Merge,
    title: 'Merge & split',
    description: 'Combine or split PDFs in seconds.',
    color: 'bg-violet-500',
  },
  {
    icon: FileText,
    title: 'Convert',
    description: 'PDF to Word, Excel, image and back.',
    color: 'bg-blue-500',
  },
  {
    icon: Lock,
    title: 'Secure',
    description: 'Password protect, encrypt, redact.',
    color: 'bg-emerald-500',
  },
  {
    icon: Scan,
    title: 'OCR & forms',
    description: 'Make PDFs searchable, fill forms.',
    color: 'bg-amber-500',
  },
]

const PDFToolsShowcaseSection = () => {
  return (
    <section id="pdf-tools" className="section-padding bg-white">
      <div className="container-max">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 mb-4">
            30+ tools · Free to use
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            PDF tools for every workflow
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Convert, merge, split, secure, and sign PDFs—all in one place. No installs, no subscriptions.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {tools.map((item, index) => {
            const Icon = item.icon
            return (
              <Link
                key={index}
                to="/login"
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:border-[#260559]/30 hover:shadow-lg transition-all"
              >
                <div className={`${item.color} w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-[#260559] transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">{item.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#260559] opacity-0 group-hover:opacity-100 transition-opacity">
                  Try it
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            )
          })}
        </div>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-[#260559] text-[#260559] font-semibold px-6 py-3 hover:bg-[#260559]/5 transition-colors"
          >
            Browse all PDF tools
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default PDFToolsShowcaseSection
