import { useEffect, useMemo, useState } from "react";
import { apiServiceApi } from "../../../services/apiHelper";
import LoadingSpinner from "../../../components/ApiServices/Spinner";

type PercentilePoint = {
  time?: string;
  p50?: number;
  p95?: number;
  p99?: number;
};

const ResponseTimePercentilesChart = () => {
  const [chartData, setChartData] = useState<PercentilePoint[]>([]);
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
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatTimeTick = (val: any) => {
    if (val && typeof val === 'string' && val.includes(" ")) {
      return val.split(" ")[1];
    }
    return val ?? '';
  };

  const maxValue = useMemo(
    () =>
      Math.max(
        1,
        ...chartData.flatMap((d) => [Number(d.p50) || 0, Number(d.p95) || 0, Number(d.p99) || 0]),
      ),
    [chartData]
  );

  return (
    <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Response Time Percentiles</h2>
      {loading ? (
        <LoadingSpinner />
      ) : chartData.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">No percentile data yet.</p>
      ) : (
        <div className="space-y-3 max-h-[270px] overflow-y-auto pr-1">
          {chartData.map((entry, idx) => (
            <div key={`${entry.time ?? idx}`} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="font-medium text-gray-800">{formatTimeTick(entry.time) || `Point ${idx + 1}`}</span>
                <span>
                  p50 {Number(entry.p50) || 0} · p95 {Number(entry.p95) || 0} · p99 {Number(entry.p99) || 0}
                </span>
              </div>
              <div className="space-y-1">
                {[
                  { key: 'p50', color: '#22c55e', value: Number(entry.p50) || 0 },
                  { key: 'p95', color: '#eab308', value: Number(entry.p95) || 0 },
                  { key: 'p99', color: '#ef4444', value: Number(entry.p99) || 0 },
                ].map((row) => (
                  <div key={row.key} className="h-1.5 overflow-hidden rounded-full bg-white/80">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(row.value ? 4 : 0, Math.round((row.value / maxValue) * 100))}%`,
                        backgroundColor: row.color,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResponseTimePercentilesChart;
