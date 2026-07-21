import { useEffect, useMemo, useState } from "react";
import { apiServiceApi } from "../../../services/apiHelper";
import LoadingSpinner from "../../../components/ApiServices/Spinner";
import TopApiEndpointsChart from "../Analytics/TopApiChart";

type TrendPoint = {
  date?: string;
  requests: number;
  errors: number;
};

const CustomDashboardGraphs = () => {
  const [chartData, setChartData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchChartData = async () => {
        setLoading(true);
        try {
          const response = await apiServiceApi.get('/api/api-service/request-volume');
          if (response.status === 200 && response.data.chartData) {
            const mappedData = response.data.chartData.map((obj: any) => ({
              ...obj,
              requests: obj.totalRequests ?? 0,
              errors: obj.errorRate ?? 0,
            }));
            setChartData(mappedData);
          }
        } catch (err) {
          console.error("Chart API error:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchChartData();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const maxRequests = useMemo(
    () => Math.max(1, ...chartData.map((d) => Number(d.requests) || 0)),
    [chartData]
  );

  return (
    <div className="mt-2">
      <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 mb-8 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">API Usage Trends</h2>
          <a href="/api-service/analytics" className="text-blue-600 hover:underline text-sm font-medium transition-colors">
            View detailed analytics &rarr;
          </a>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No usage trend data yet.</p>
        ) : (
          <div className="space-y-3 max-h-[270px] overflow-y-auto pr-1">
            {chartData.map((entry, idx) => {
              const pct = Math.round((Number(entry.requests) / maxRequests) * 100);
              return (
                <div key={`${entry.date ?? idx}`} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="font-medium text-gray-800">{entry.date || `Day ${idx + 1}`}</span>
                    <span>
                      {Number(entry.requests).toLocaleString()} req · {Number(entry.errors).toLocaleString()} err
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/80">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <TopApiEndpointsChart />
    </div>
  );
};

export default CustomDashboardGraphs;
