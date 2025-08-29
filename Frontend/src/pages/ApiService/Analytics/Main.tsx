import { Download } from "lucide-react";
import FirstSection from "./FirstSection";
import SecondSection from "./SecondSection";
import { useEffect, useState } from "react";
import { apiServiceApi } from "../../../services/apiHelper";

const dateRanges = [
  "Last 24 Hours",
  "Last 7 Days",
  "Last 30 Days",
  "Last 90 Days"
];

const Main = () => {
   const [stats, setStats] = useState({ totalRequests: 0, errorRate: 0, avgLatency: 0, apiUptime: 0 });

   // Fetch on mount
useEffect(() => {
  const fetchStats = async () => {
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
    }
  };
  fetchStats();
}, []);

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  <div>
    <h1 className="text-3xl font-bold text-gray-900">API Analytics</h1>
    <p className="text-gray-600">
      Monitor your API usage, performance, and error patterns
    </p>
  </div>
  {/* Right Side Controls */}
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
    <select
      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      defaultValue={dateRanges[2]}
    >
      {dateRanges.map(range => (
        <option key={range} value={range}>{range}</option>
      ))}
    </select>
    <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-100 transition-colors">
      <Download className="w-4 h-4" />
      Export
    </button>
  </div>
</div>
      <FirstSection {...stats}/>
      <SecondSection/>
    </div>
  );
};

export default Main;
