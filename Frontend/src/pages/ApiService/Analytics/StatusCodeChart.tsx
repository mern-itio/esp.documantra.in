import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { apiServiceApi } from "../../../services/apiHelper";

type StatusCodeDatum = {
  code: string | number;
  value: number;
  color: string;
};

const STATUS_COLORS: { [key: string]: string } = {
  "200": "#10b981",
  "400": "#ef4444",
  "401": "#f59e42",
  "404": "#ef4444",
  "500": "#ef4444",
};
const STATUS_MEANINGS: { [key: string]: string } = {
  "200": "Success",
  "400": "Bad Request",
  "401": "Unauthorized",
  "404": "Not Found",
  "500": "Server Error",
};

const StatusCodesChart = () => {
  const [statusData, setStatusData] = useState<StatusCodeDatum[]>([]);

  useEffect(() => {
    const fetchStatusData = async () => {
      try {
        const response = await apiServiceApi.get('/api/api-service/status-codes');
        // API expects { codes: [{ code, count, percent }], total }
        if (response.status === 200 && response.data.codes) {
          // Map API data to chart format with colors
          const formatted = response.data.codes.map((c : any) => ({
          code: c.code,
          value: c.count,
          color: STATUS_COLORS[String(c.code)] || "#94a3b8"
        }));
          setStatusData(formatted);
        }
      } catch (err) {
        console.error("Status code API error:", err);
      }
    };
    fetchStatusData();
  }, []);

  const total = statusData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Codes</h2>
      <div className="flex flex-col items-center">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={statusData}
              dataKey="value"
              nameKey="code"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              startAngle={90}
              endAngle={450}
            >
              {statusData.map((entry) => (
                <Cell key={entry.code} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="w-full mt-4 flex flex-col gap-2">
          {statusData.map(entry => (
            <div key={entry.code} className="flex items-center justify-between text-gray-700 text-sm">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                <span>{entry.code}</span>
                <span className="ml-2 text-gray-500">({STATUS_MEANINGS[String(entry.code)] || "Unknown"})</span>
              </div>
              <span>
                {entry.value.toLocaleString()} ({((entry.value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatusCodesChart;
