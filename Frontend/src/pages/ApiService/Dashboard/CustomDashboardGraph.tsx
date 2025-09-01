import { useEffect, useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer} from "recharts";
import { apiServiceApi } from "../../../services/apiHelper";
import LoadingSpinner from "../../../components/ApiServices/Spinner";
import TopApiEndpointsChart from "../Analytics/TopApiChart";
import { CustomTooltip } from "../../../components/ApiServices/tooltip";

// Component body with curly braces
const CustomDashboardGraphs = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
   const timer = setTimeout(() => {
  const fetchChartData = async () => {
    setLoading(true);
    try {
      const response = await apiServiceApi.get('/api/api-service/request-volume');
      if (response.status === 200 && response.data.chartData) {
        // Map keys: requests, errors for recharts!
        const mappedData = response.data.chartData.map((obj:any) => ({
          ...obj,
          requests: obj.totalRequests ?? 0,
          errors: obj.errorRate ?? 0,
        }));
        setChartData(mappedData);
      }
    } catch (err) {
      console.error("Chart API error:", err);
    }finally {
        setLoading(false);
      }
  };
  fetchChartData();
  },  2500); // 2500 ms = 2.5 second delay before API call

  return () => clearTimeout(timer);
}, []);

  return (
    <div className="mt-2">
      {/* API Usage Trends (Line Chart) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">API Usage Trends</h2>
          <a href="/api-service/analytics" className="text-blue-600 hover:underline text-sm font-medium transition-colors">
            View detailed analytics &rarr;
          </a>
        </div>
        {loading ? (
      <LoadingSpinner />
    ) : (
        <ResponsiveContainer width="100%" height={270}>
        <LineChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#f3f4f6" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} /> 
          <Line
            type="monotone"
            dataKey="requests"
            stroke="#2563eb"
            strokeWidth={3}
            dot 
          />
          <Line
            type="monotone"
            dataKey="errors"
            stroke="#ef4444"
            strokeWidth={3}
            dot 
          />
        </LineChart>
      </ResponsiveContainer>
      )}
        </div>
        {/* Top API Endpoints (Bar Chart) */}
        <TopApiEndpointsChart/>
        </div>
    );
  };

export default CustomDashboardGraphs;
