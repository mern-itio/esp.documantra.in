import { useEffect, useState } from "react";
import { Line, Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { apiServiceApi } from "../../../services/apiHelper";
import LoadingSpinner from "../../../components/ApiServices/Spinner";
import { CustomTooltip } from "../../../components/ApiServices/tooltip";

const RequestVolumeChart = () => {
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Volume</h2>
       {loading ? (
      <LoadingSpinner />
    ) : (
      <ResponsiveContainer width="100%" height={270}>
        <AreaChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="35%" stopColor="#2563eb" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f3f4f6" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} /> 
          <Area
            type="monotone"
            dataKey="requests"
            stroke="#2563eb"
            fillOpacity={1}
            fill="url(#colorReq)"
            dot
          />
          <Line
            type="monotone"
            dataKey="errors"
            stroke="#ef4444"
            dot
          />
        </AreaChart>
      </ResponsiveContainer>
    )}
    </div>
  );
};

export default RequestVolumeChart;
