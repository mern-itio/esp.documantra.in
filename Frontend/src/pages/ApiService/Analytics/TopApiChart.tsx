import { useEffect, useState } from "react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { apiServiceApi } from "../../../services/apiHelper";

type EndpointDatum = {
  endpoint: string;
  requests: number;
};

function formatEndpoint(endpoint: string) {
  // Replace MongoDB ObjectIds and similar tokens with :id
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Top API Endpoints</h2>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={endpointsData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#f3f4f6" />
          <XAxis dataKey="endpoint" angle={-45} textAnchor="end" interval={0} height={120} tick={{ fontSize: 8 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="requests" fill="#2563eb" barSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopApiEndpointsChart;
