import { ArrowRight, Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const FeatureComparisonPage = () => {
  const competitors = [
    { key: 'docusigner', name: 'Draft&Sign', color: 'text-primary-600' },
    { key: 'docusign', name: 'DocuSign', color: 'text-gray-700' },
    { key: 'hellosign', name: 'HelloSign', color: 'text-gray-700' },
    { key: 'adobesign', name: 'Adobe Sign', color: 'text-gray-700' },
    { key: 'pandadoc', name: 'PandaDoc', color: 'text-gray-700' }
  ] as const

  // Consolidated feature matrix (pulled from existing comparison pages)
  const featureMatrix = [
    { name: 'Electronic Signatures', docusigner: true, docusign: true, hellosign: true, adobesign: true, pandadoc: true },
    { name: 'Free Forever Plan', docusigner: true, docusign: false, hellosign: false, adobesign: false, pandadoc: true },
    { name: '30+ Free PDF Tools', docusigner: true, docusign: false, hellosign: false, adobesign: false, pandadoc: false },
    { name: 'Legal Templates Library', docusigner: '45+ templates', docusign: 'Limited', hellosign: 'None', adobesign: 'Limited', pandadoc: 'Limited' },
    { name: 'AI-Powered Document Generation', docusigner: true, docusign: 'Limited', hellosign: false, adobesign: 'Limited', pandadoc: 'Limited' },
    { name: 'Document Analytics', docusigner: true, docusign: 'Premium', hellosign: 'Basic', adobesign: 'Premium', pandadoc: true },
    { name: 'Workflow Automation', docusigner: true, docusign: true, hellosign: true, adobesign: true, pandadoc: true },
    { name: 'API Access', docusigner: 'Free tier', docusign: 'Premium', hellosign: true, adobesign: true, pandadoc: 'Business+' },
    { name: 'Bulk Send', docusigner: true, docusign: 'Premium', hellosign: 'Business', adobesign: 'Premium', pandadoc: 'Business' },
    { name: 'OCR Technology', docusigner: true, docusign: 'Premium', hellosign: false, adobesign: 'Acrobat', pandadoc: false },
    { name: 'Court-Admissible Evidence', docusigner: true, docusign: true, hellosign: true, adobesign: true, pandadoc: true },
    { name: 'Global Compliance (eIDAS/ESIGN/UETA)', docusigner: true, docusign: true, hellosign: true, adobesign: true, pandadoc: true },
  ]

  const pricingOverview = [
    { plan: 'Free', docusigner: '$0', docusign: 'No plan', hellosign: 'No plan', adobesign: 'No plan', pandadoc: '$0 (limited)' },
    { plan: 'Starter', docusigner: '$10/mo', docusign: '$25/mo', hellosign: '$20/mo', adobesign: '$29.99/mo', pandadoc: '$19/mo' },
    { plan: 'Business', docusigner: '$30/mo', docusign: '$45/mo', hellosign: '$40/mo', adobesign: '$49.99/mo', pandadoc: '$49/mo' },
    { plan: 'Enterprise', docusigner: 'Custom', docusign: 'Custom', hellosign: 'Custom', adobesign: 'Custom', pandadoc: 'Custom' }
  ]

  const renderCell = (val: unknown) => {
    if (typeof val === 'boolean') {
      return val ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-400 mx-auto" />
    }
    return <span className="text-gray-700">{String(val)}</span>
  }

  return (
    <div className="min-h-screen bg-white pt-24">
      {/* Hero */}
      <section className="py-16 bg-gradient-to-br from-[#260559]/10 to-white">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Detailed Feature Comparison</h1>
            <p className="text-xl text-gray-600">
              See how Draft&Sign compares to DocuSign, HelloSign, Adobe Sign, and PandaDoc across features and pricing.
            </p>
            <div className="flex gap-3 justify-center mt-8 flex-wrap">
              <Link to="/draft-n-sign-vs-docusign" className="btn-secondary" style={{borderColor: '#260559', color: '#260559'}}>Draft&Sign vs DocuSign</Link>
              <Link to="/draft-n-sign-vs-hellosign" className="btn-secondary" style={{borderColor: '#260559', color: '#260559'}}>Draft&Sign vs HelloSign</Link>
              <Link to="/draft-n-sign-vs-adobesign" className="btn-secondary" style={{borderColor: '#260559', color: '#260559'}}>Draft&Sign vs Adobe Sign</Link>
              <Link to="/draft-n-sign-vs-pandadoc" className="btn-secondary" style={{borderColor: '#260559', color: '#260559'}}>Draft&Sign vs PandaDoc</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Matrix */}
      <section className="py-12">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-4 w-1/3 font-semibold text-gray-900">Feature</th>
                    {competitors.map((c) => (
                      <th key={c.key} className="text-center p-4 w-1/6">
                        <span className={`font-semibold ${c.color}`}>{c.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureMatrix.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-4 font-medium text-gray-900">{row.name}</td>
                      <td className="p-4 text-center">{renderCell(row.docusigner)}</td>
                      <td className="p-4 text-center">{renderCell(row.docusign)}</td>
                      <td className="p-4 text-center">{renderCell((row as any).hellosign)}</td>
                      <td className="p-4 text-center">{renderCell((row as any).adobesign)}</td>
                      <td className="p-4 text-center">{renderCell((row as any).pandadoc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Overview */}
      <section className="py-12">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Pricing Overview</h2>
              <p className="text-gray-600 mt-1">High-level comparison of entry pricing across platforms</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-4">Plan</th>
                    {competitors.map((c) => (
                      <th key={c.key} className="text-center p-4">
                        <span className={`font-semibold ${c.color}`}>{c.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pricingOverview.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-4 font-medium text-gray-900">{row.plan}</td>
                      <td className="p-4 text-center">{row.docusigner}</td>
                      <td className="p-4 text-center">{row.docusign}</td>
                      <td className="p-4 text-center">{row.hellosign}</td>
                      <td className="p-4 text-center">{row.adobesign}</td>
                      <td className="p-4 text-center">{row.pandadoc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#260559]/90 to-[#260559]/80 rounded-2xl shadow-lg p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-primary-100 max-w-3xl mx-auto mb-6">
              Start free, explore all features, and see why teams switch to Draft&Sign.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="bg-white text-[#260559] hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl text-lg">
                Start Free <ArrowRight className="ml-2 h-5 w-5 inline" />
              </Link>
              <Link to="/contact-sales" className="border-2 border-white text-white hover:bg-white hover:text-[#260559] font-semibold py-3 px-8 rounded-lg transition-colors text-lg">
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default FeatureComparisonPage


