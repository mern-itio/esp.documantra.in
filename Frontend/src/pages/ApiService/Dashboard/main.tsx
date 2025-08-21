
import FirstSection from './FirstSection'
import CustomDashboardGraphs from './SecondSection'

const main = () => {
  return (
     <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Developer Dashboard</h1>
          <p className="text-gray-600">
            Monitor your API usage, performance, and integration health
          </p>
        </div>
      </div>
      <FirstSection/>
      <CustomDashboardGraphs/>
      </div>
  )
}

export default main