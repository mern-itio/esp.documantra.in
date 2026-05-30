import { Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const FeatureComparison = () => {
  const competitors = [
    { name: 'DraftnSign', color: 'bg-[#260559]' },
    { name: 'DocuSign', color: 'bg-gray-400' },
    { name: 'HelloSign', color: 'bg-gray-400' },
    { name: 'Adobe Sign', color: 'bg-gray-400' }
  ]

  const features = [
    { name: 'Free PDF Tools', docusigner: true, docusign: false, hellosign: false, adobe: false },
    { name: 'Legal Templates', docusigner: true, docusign: false, hellosign: false, adobe: false },
    { name: 'API Access', docusigner: true, docusign: true, hellosign: true, adobe: true },
    { name: 'Free Forever Plan', docusigner: true, docusign: false, hellosign: false, adobe: false },
    { name: 'AI-Powered Features', docusigner: true, docusign: false, hellosign: false, adobe: false },
    { name: 'Global Compliance', docusigner: true, docusign: true, hellosign: true, adobe: true },
    { name: 'White-label Option', docusigner: true, docusign: true, hellosign: false, adobe: true }
  ]

  return (
    <section className="py-16 bg-[#F5F2EE]">
      <div className="container-max">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Choose DraftnSign?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how {BRAND.name} compares to other document management platforms
          </p>
        </div>

        <div className="bg-[#F7F3EE] rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-6 font-semibold text-gray-900">Features</th>
                  {competitors.map((competitor, index) => (
                    <th key={index} className="text-center p-6">
                      <div className={`inline-block px-4 py-2 rounded-lg text-white font-semibold ${competitor.color}`}>
                        {competitor.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-[#F5F2EE]">
                    <td className="p-6 font-medium text-gray-900">{feature.name}</td>
                    <td className="p-6 text-center">
                      {feature.docusigner ? (
                        <Check className="h-6 w-6 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-6 w-6 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="p-6 text-center">
                      {feature.docusign ? (
                        <Check className="h-6 w-6 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-6 w-6 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="p-6 text-center">
                      {feature.hellosign ? (
                        <Check className="h-6 w-6 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-6 w-6 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="p-6 text-center">
                      {feature.adobe ? (
                        <Check className="h-6 w-6 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-6 w-6 text-red-400 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link to="/feature-comparison">
            <button className="bg-[#260559] text-white text-lg px-8 py-4 rounded-md">
              See Full Comparison
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default FeatureComparison