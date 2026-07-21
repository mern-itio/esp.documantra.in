import { useEffect, useState } from "react";
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
        if (response.status === 200 && response.data.codes) {
          const formatted = response.data.codes.map((c: any) => ({
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

  const total = Math.max(1, statusData.reduce((sum, d) => sum + d.value, 0));

  return (
    <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Codes</h2>
      <div className="flex flex-col gap-3">
        {statusData.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No status code data yet.</p>
        ) : (
          statusData.map((entry) => {
            const pct = Math.round((entry.value / total) * 100);
            return (
              <div key={entry.code} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm text-gray-700">
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                    <span>{entry.code}</span>
                    <span className="ml-2 text-gray-500">({STATUS_MEANINGS[String(entry.code)] || "Unknown"})</span>
                  </div>
                  <span>
                    {entry.value.toLocaleString()} ({((entry.value / total) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/80">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(4, pct)}%`, backgroundColor: entry.color }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StatusCodesChart;
