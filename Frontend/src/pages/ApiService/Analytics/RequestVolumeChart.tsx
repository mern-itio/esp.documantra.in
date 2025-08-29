import { useEffect, useState } from "react";
import { Line, Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { apiServiceApi } from "../../../services/apiHelper";

const RequestVolumeChart = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await apiServiceApi.get('/api/api-service/request-volume');
        // API must return { chartData: [...] }
        if (response.status === 200 && response.data.chartData) {
          setChartData(response.data.chartData);
        }
      } catch (err) {
        console.error("Chart API error:", err);
      }
    };
    fetchChartData();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Volume</h2>
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
          <Tooltip />
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
    </div>
  );
};

export default RequestVolumeChart;
