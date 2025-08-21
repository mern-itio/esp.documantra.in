import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Sample data
const endpointsData = [
  { endpoint: "/api/v1/envelopes", requests: 16000 },
  { endpoint: "/api/v1/documents", requests: 12000 },
  { endpoint: "/api/v1/users", requests: 8000 },
  { endpoint: "/api/v1/templates", requests: 5000 },
  { endpoint: "/api/v1/webhooks", requests: 3000 },
];

const TopApiEndpointsChart = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Top API Endpoints</h2>
    <ResponsiveContainer width="100%" height={270}>
      <BarChart data={endpointsData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#f3f4f6" />
       <XAxis dataKey="endpoint" angle={-30} textAnchor="end" interval={0} height={70} tick={{ fontSize: 12 }}  />
        <YAxis />
        <Tooltip />
        <Bar dataKey="requests" fill="#2563eb" barSize={36} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default TopApiEndpointsChart;
