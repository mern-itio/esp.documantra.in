import { Line, Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Sample data
const data = [
  { date: "Jun 24", requests: 1200, errors: 5 },
  { date: "Jun 25", requests: 1450, errors: 8 },
  { date: "Jun 26", requests: 1678, errors: 15 },
  { date: "Jun 27", requests: 1100, errors: 3 },
  { date: "Jun 28", requests: 1400, errors: 7 },
  { date: "Jun 29", requests: 1820, errors: 1 },
  { date: "Jun 30", requests: 1950, errors: 0 },
  { date: "Jul 1", requests: 2000, errors: 2 },
];

const RequestVolumeChart = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Volume</h2>
    <ResponsiveContainer width="100%" height={270}>
      <AreaChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="35%" stopColor="#2563eb" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#f3f4f6" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Area 
          type="monotone" 
          dataKey="requests" 
          stroke="#2563eb" 
          fillOpacity={1} 
          fill="url(#colorReq)" 
          dot 
        />
        <Line 
          type="monotone" 
          dataKey="errors" 
          stroke="#ef4444" 
          dot 
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export default RequestVolumeChart;
