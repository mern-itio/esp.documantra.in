
import { useEffect, useState } from 'react';
import FirstSection from '../Analytics/FirstSection'
import CustomDashboardGraphs from './SecondSection'
import { apiServiceApi } from '../../../services/apiHelper';
import LoadingSpinner from '../../../components/ApiServices/Spinner';

const main = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRequests: 0, errorRate: 0, avgLatency: 0, apiUptime: 0 });
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await apiServiceApi.get('/api/api-service/total-requests');
        if (response.status === 200 && response.data) {
          setStats({
            totalRequests: response.data.totalRequests,
            errorRate: response.data.errorRate,
            avgLatency: response.data.avgLatency,
            apiUptime: response.data.apiUptime
          });
        }
      } catch (err) {
        console.error("Error fetching analytics stats:", err);
      }finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
     <div className="p-6 space-y-8 bg-[#F5F2EE] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Developer Dashboard</h1>
          <p className="text-gray-600">
            Monitor your API usage, performance, and integration health
          </p>
        </div>
      </div>
       {loading ? <LoadingSpinner /> : <FirstSection {...stats} />}
      <CustomDashboardGraphs/>
      </div>
  )
}

export default main