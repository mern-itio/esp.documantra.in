import { useEffect, useMemo, useState } from "react";
import { apiServiceApi } from "../../../services/apiHelper";

type EndpointDatum = {
  endpoint: string;
  requests: number;
};

function formatEndpoint(endpoint: string) {
  return endpoint.replace(/([a-f\d]{24,})/gi, ':id');
}

const TopApiEndpointsChart = () => {
  const [endpointsData, setEndpointsData] = useState<EndpointDatum[]>([]);

  useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        const res = await apiServiceApi.get('/api/api-service/top-endpoints');
        if (res.status === 200 && res.data.endpoints) {
          setEndpointsData(
            res.data.endpoints.map((item: any) => ({
              endpoint: formatEndpoint(item.endpoint),
              requests: item.count
            }))
          );
        }
      } catch (e) {
        console.error("Top Endpoints API error", e);
      }
    };
    fetchEndpoints();
  }, []);

  const maxRequests = useMemo(
    () => Math.max(1, ...endpointsData.map((d) => Number(d.requests) || 0)),
    [endpointsData]
  );

  return (
    <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Top API Endpoints</h2>
      {endpointsData.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">No endpoint data yet.</p>
      ) : (
        <div className="space-y-3">
          {endpointsData.map((entry) => {
            const pct = Math.round((Number(entry.requests) / maxRequests) * 100);
            return (
              <div key={entry.endpoint} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-gray-800 truncate" title={entry.endpoint}>
                    {entry.endpoint}
                  </span>
                  <span className="tabular-nums text-gray-500 shrink-0">
                    {Number(entry.requests).toLocaleString()}
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
  );
};

export default TopApiEndpointsChart;
