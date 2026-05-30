import { Globe, Database, Server, Shield, CheckCircle, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const DataResidencyPage = () => {
  const dataRegions = [
    {
      name: "United States",
      flag: "🇺🇸",
      locations: ["Virginia", "Oregon", "Ohio"],
      certifications: ["SOC 2 Type II", "ISO 27001", "HIPAA"],
      available: true
    },
    {
      name: "European Union",
      flag: "🇪🇺",
      locations: ["Frankfurt", "Dublin", "Paris"],
      certifications: ["ISO 27001", "GDPR Compliant", "C5:2020"],
      available: true
    },
    {
      name: "United Kingdom",
      flag: "🇬🇧",
      locations: ["London"],
      certifications: ["ISO 27001", "Cyber Essentials Plus"],
      available: true
    },
    {
      name: "Canada",
      flag: "🇨🇦",
      locations: ["Montreal", "Toronto"],
      certifications: ["ISO 27001", "PIPEDA Compliant"],
      available: true
    },
    {
      name: "Australia",
      flag: "🇦🇺",
      locations: ["Sydney"],
      certifications: ["ISO 27001", "IRAP Assessed"],
      available: true
    },
    {
      name: "Japan",
      flag: "🇯🇵",
      locations: ["Tokyo"],
      certifications: ["ISO 27001", "APPI Compliant"],
      available: true
    },
    {
      name: "Singapore",
      flag: "🇸🇬",
      locations: ["Singapore"],
      certifications: ["ISO 27001", "MTCS Level 3"],
      available: true
    },
    {
      name: "Brazil",
      flag: "🇧🇷",
      locations: ["São Paulo"],
      certifications: ["ISO 27001", "LGPD Compliant"],
      available: false,
      comingSoon: true
    },
    {
      name: "India",
      flag: "🇮🇳",
      locations: ["Mumbai"],
      certifications: ["ISO 27001"],
      available: false,
      comingSoon: true
    }
  ];

  const dataResidencyFeatures = [
    {
      icon: Globe,
      title: "Global Data Center Network",
      description: "Store your data in multiple geographic regions to meet compliance requirements and optimize for performance."
    },
    {
      icon: Database,
      title: "Regional Data Isolation",
      description: "Keep your data within specific geographic boundaries to comply with data sovereignty laws and regulations."
    },
    {
      icon: Shield,
      title: "Compliance Certifications",
      description: "Each data center maintains rigorous compliance certifications relevant to its region, including ISO 27001, SOC 2, and more."
    },
    {
      icon: Server,
      title: "Data Replication",
      description: "Optional cross-region replication for disaster recovery while maintaining primary data storage in your chosen region."
    }
  ];

  const complianceRequirements = [
    {
      region: "European Union",
      regulations: ["GDPR", "Schrems II Decision"],
      description: "EU data protection laws require certain data to remain within EU borders or countries with adequate protection levels."
    },
    {
      region: "United States",
      regulations: ["HIPAA", "CCPA/CPRA", "FedRAMP"],
      description: "Healthcare data, California resident data, and federal information may have specific storage requirements."
    },
    {
      region: "Canada",
      regulations: ["PIPEDA", "Provincial Privacy Laws"],
      description: "Canadian privacy laws often require personal data to be stored within Canadian borders, especially for public sector."
    },
    {
      region: "Australia",
      regulations: ["Privacy Act", "Critical Infrastructure Act"],
      description: "Certain sensitive and government data must be stored within Australian territory."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F2EE] pt-24 pb-16">
      <div className="container-max">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#260559]/100 to-[#260559]/90 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-2/3">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Data Residency</h1>
              <p className="text-xl text-primary-100 mb-6">
                Control where your data is stored with DocuSigner's global data center network. Meet compliance requirements and optimize performance with flexible data residency options.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-[#F7F3EE]/20 px-4 py-2 rounded-full">
                  <Globe className="h-5 w-5" />
                  <span className="font-medium">7 Active Regions</span>
                </div>
                <div className="flex items-center gap-2 bg-[#F7F3EE]/20 px-4 py-2 rounded-full">
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Regional Compliance</span>
                </div>
                <div className="flex items-center gap-2 bg-[#F7F3EE]/20 px-4 py-2 rounded-full">
                  <Database className="h-5 w-5" />
                  <span className="font-medium">Data Sovereignty</span>
                </div>
              </div>
            </div>
            <div className="md:w-1/3 flex justify-center">
              <div className="w-48 h-48 bg-[#F7F3EE]/10 rounded-full flex items-center justify-center">
                <MapPin className="h-24 w-24 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Data Residency Features */}
        <div className="bg-[#F7F3EE] rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Residency Features</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {dataResidencyFeatures.map((feature, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Available Regions */}
        <div className="bg-[#F7F3EE] rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Data Regions</h2>
          <p className="text-gray-600 mb-8 max-w-3xl">
            DocuSigner offers data storage in multiple geographic regions to help you meet your compliance requirements and optimize for performance. Select the region that best meets your needs during account setup.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataRegions.map((region, index) => (
              <div 
                key={index} 
                className={`border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow ${
                  !region.available ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{region.flag}</span>
                    <h3 className="text-lg font-semibold text-gray-900">{region.name}</h3>
                  </div>
                  {region.available ? (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                      Available
                    </span>
                  ) : region.comingSoon ? (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                      Coming Soon
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">
                      Unavailable
                    </span>
                  )}
                </div>
                
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-1">Data Center Locations:</div>
                  <div className="flex flex-wrap gap-2">
                    {region.locations.map((location, locIndex) => (
                      <span key={locIndex} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                        {location}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Certifications:</div>
                  <div className="flex flex-wrap gap-2">
                    {region.certifications.map((cert, certIndex) => (
                      <span key={certIndex} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Requirements */}
        <div className="bg-[#F7F3EE] rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Regional Compliance Requirements</h2>
          <p className="text-gray-600 mb-8 max-w-3xl">
            Many countries and regions have specific requirements regarding where data can be stored and processed. Our data residency options help you meet these requirements.
          </p>
          
          <div className="space-y-6">
            {complianceRequirements.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.region}</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {item.regulations.map((reg, regIndex) => (
                    <span key={regIndex} className="bg-[#DCFCE7] text-purple-800 text-sm px-3 py-1 rounded-full">
                      {reg}
                    </span>
                  ))}
                </div>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-[#F7F3EE] rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How Data Residency Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 font-bold text-xl">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Your Region</h3>
              <p className="text-gray-600">
                Choose your preferred data storage region during account setup or contact support to change your region.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 font-bold text-xl">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Storage</h3>
              <p className="text-gray-600">
                Your documents, signatures, and account data are stored exclusively in your selected region's data centers.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 font-bold text-xl">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Compliance & Reporting</h3>
              <p className="text-gray-600">
                Access data residency reports and compliance documentation for audits and regulatory requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Enterprise Options */}
        <div className="bg-gradient-to-r from-[#260559]/100 to-[#260559]/90 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4">Enterprise Data Residency Options</h2>
              <p className="text-emerald-100 mb-6">
                Enterprise customers have access to additional data residency features and customization options to meet specific compliance and operational requirements.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-200 mt-0.5" />
                  <span>Custom data residency agreements</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-200 mt-0.5" />
                  <span>Multi-region data replication options</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-200 mt-0.5" />
                  <span>Dedicated infrastructure options</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-200 mt-0.5" />
                  <span>Advanced compliance reporting</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-200 mt-0.5" />
                  <span>Data residency consultation services</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-[#F7F3EE]/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Enterprise Data Residency Consultation</h3>
              <p className="text-emerald-100 mb-6">
                Our compliance and data governance experts can help you design a data residency strategy that meets your specific regulatory requirements and business needs.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-[#F7F3EE]/20 rounded-lg">
                  <MapPin className="h-5 w-5 text-white" />
                  <div>
                    <div className="font-medium">Custom Region Selection</div>
                    <div className="text-xs text-emerald-100">Tailored to your compliance needs</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#F7F3EE]/20 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                  <div>
                    <div className="font-medium">Compliance Documentation</div>
                    <div className="text-xs text-emerald-100">Comprehensive reporting for audits</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#F7F3EE]/20 rounded-lg">
                  <Server className="h-5 w-5 text-white" />
                  <div>
                    <div className="font-medium">Dedicated Infrastructure</div>
                    <div className="text-xs text-emerald-100">For highest security requirements</div>
                  </div>
                </div>
              </div>
              <button className="mt-6 w-full bg-[#F7F3EE] text-emerald-600 hover:bg-emerald-50 font-semibold py-3 px-4 rounded-lg transition-colors">
                Contact Enterprise Sales
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-[#F7F3EE] rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-[#F5F2EE]">
                <h3 className="font-semibold text-gray-900">Can I change my data region after setting up my account?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  Yes, you can change your data region, but it requires a migration process. Contact our support team to initiate a data region change. Note that this process may take 24-48 hours depending on the amount of data, and there may be a brief period of service interruption during the migration.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-[#F5F2EE]">
                <h3 className="font-semibold text-gray-900">How does data residency affect performance?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  Selecting a data region closer to your primary user base can improve performance by reducing latency. Our global content delivery network (CDN) ensures fast access to static resources regardless of your data region, but API calls and dynamic content will be served from your selected region.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-[#F5F2EE]">
                <h3 className="font-semibold text-gray-900">What happens if my preferred region is not available?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  If your preferred region is not available, you can select the next closest region that meets your compliance requirements. Enterprise customers can contact our sales team to discuss custom region deployment options for regions not currently on our standard list.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-[#F5F2EE]">
                <h3 className="font-semibold text-gray-900">How do you ensure data stays within my selected region?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  We implement strict technical and organizational measures to ensure data remains in your selected region. This includes physical data center isolation, logical data segregation, and regular compliance audits. Our systems are designed to prevent unauthorized data transfers across regional boundaries.
                </p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-[#F5F2EE]">
                <h3 className="font-semibold text-gray-900">Do you offer multi-region data replication?</h3>
              </div>
              <div className="p-4">
                <p className="text-gray-700">
                  Yes, enterprise customers can opt for multi-region data replication for disaster recovery purposes. This allows data to be replicated to a secondary region while maintaining primary storage and processing in the main selected region. This feature is subject to compliance with applicable data transfer regulations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#260559]/100 to-[#260559]/90 rounded-2xl shadow-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Control Your Data Residency?</h2>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
            Join thousands of organizations that trust DocuSigner for secure, compliant document management with flexible data residency options.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="bg-[#F7F3EE] text-[#260559] hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl text-lg">
              Start Free Trial
            </Link>
            <Link to="/contact" className="border-2 border-white text-white hover:bg-[#F7F3EE] hover:text-[#260559] font-semibold py-3 px-8 rounded-lg transition-colors text-lg">
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataResidencyPage;