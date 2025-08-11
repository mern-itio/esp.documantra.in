

const CompanyLogos = () => {
  const companies = [
    { name: 'TechCorp', logo: 'TC' },
    { name: 'StartupXYZ', logo: 'SX' },
    { name: 'Global Solutions', logo: 'GS' },
    { name: 'Innovation Co', logo: 'IC' },
    { name: 'Future Ltd', logo: 'FL' },
    { name: 'Digital Inc', logo: 'DI' }
  ]

  return (
    <section className="py-12 bg-gray-50 border-t border-b border-gray-200">
      <div className="container-max">
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 font-medium">
            Trusted by 50,000+ organizations worldwide
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
          {companies.map((company, index) => (
            <div
              key={index}
              className="flex items-center justify-center w-24 h-12 bg-white rounded-lg shadow-sm border border-gray-100 opacity-60 hover:opacity-100 transition-opacity duration-200"
            >
              <div className="text-gray-400 font-bold text-sm">
                {company.logo}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CompanyLogos