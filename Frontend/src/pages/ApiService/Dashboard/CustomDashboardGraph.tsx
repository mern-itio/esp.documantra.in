import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

// Sample data (replace as needed)
const usageData = [
  { date: "Jun 24", success: 1200, error: 0 },
  { date: "Jun 25", success: 1450, error: 10 },
  { date: "Jun 26", success: 1700, error: 12 },
  { date: "Jun 27", success: 1350, error: 40 },
  { date: "Jun 28", success: 1600, error: 5 },
  { date: "Jun 29", success: 1820, error: 50},
  { date: "Jun 30", success: 1900, error: 8 },
  { date: "Jul 1", success: 1950, error: 0 },
];

const endpointsData = [
  { endpoint: "/api/v1/envelopes", requests: 16000 },
  { endpoint: "/api/v1/documents", requests: 12000 },
  { endpoint: "/api/v1/users", requests: 8000 },
  { endpoint: "/api/v1/templates", requests: 5000 },
  { endpoint: "/api/v1/webhooks", requests: 3000 },
];

const CustomDashboardGraphs = () => (
  <div className=" mt-2">
    {/* API Usage Trends (Line Chart) */}
    <div className=" bg-white rounded-xl shadow-sm border border-gray-200 mb-8 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">API Usage Trends</h2>
        <a href="/api-service/analytics" className="text-blue-600 hover:underline text-sm font-medium transition-colors">
          View detailed analytics &rarr;
        </a>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={usageData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#f3f4f6" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="success" stroke="#2563eb" strokeWidth={3} dot />
          <Line type="monotone" dataKey="error" stroke="#ef4444" strokeWidth={3} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
    {/* Top API Endpoints (Bar Chart) */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Top API Endpoints</h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={endpointsData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#f3f4f6" />
          <XAxis dataKey="endpoint" angle={-30} textAnchor="end" interval={0} height={70} tick={{ fontSize: 12 }}  />
          <YAxis />
          <Tooltip />
          <Bar dataKey="requests" fill="#2563eb" barSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default CustomDashboardGraphs;
    