import { useEffect, useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { apiServiceApi } from "../../../services/apiHelper";
import LoadingSpinner from "../../../components/ApiServices/Spinner";

const ResponseTimePercentilesChart = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const response = await apiServiceApi.get("/api/api-service/response-percentiles");
        if (response.status === 200 && response.data.chartData) {
          setChartData(response.data.chartData);
        }
      } catch (err) {
        console.error("Percentiles API error:", err);
      }
       finally {
        setLoading(false); // Loading false jab fetch ho jaye
      }
    };
    fetchData();
  }, []);

  // Tick formatting function (extract time part)
  const formatTimeTick = (val:any) => {
    // Input: "2025-08-29 08:00", Output: "08:00"
    if (val && val.includes(" ")) {
      return val.split(" ")[1];
    }
    return val;
  };

  return (
    <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Response Time Percentiles</h2>
       {loading ? (
      <LoadingSpinner />
    ) : (
      <ResponsiveContainer width="100%" height={270}>
        <LineChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#f3f4f6" />
          <XAxis dataKey="time" tickFormatter={formatTimeTick} />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="p50" stroke="#22c55e" dot />
          <Line type="monotone" dataKey="p95" stroke="#eab308" dot />
          <Line type="monotone" dataKey="p99" stroke="#ef4444" dot />
        </LineChart>
      </ResponsiveContainer>
    )}
    </div>
  );
};

export default ResponseTimePercentilesChart;
