import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Sample data
const percentilesData = [
  { time: "05:30 AM", p50: 120, p95: 450, p99: 890 },
  { time: "06:30 AM", p50: 122, p95: 470, p99: 900 },
  { time: "07:30 AM", p50: 119, p95: 455, p99: 980 },
  { time: "08:30 AM", p50: 115, p95: 430, p99: 870 },
];

const ResponseTimePercentilesChart = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Response Time Percentiles</h2>
    <ResponsiveContainer width="100%" height={270}>
      <LineChart data={percentilesData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#f3f4f6" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="p50" stroke="#22c55e" dot />
        <Line type="monotone" dataKey="p95" stroke="#eab308" dot />
        <Line type="monotone" dataKey="p99" stroke="#ef4444" dot />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default ResponseTimePercentilesChart;
