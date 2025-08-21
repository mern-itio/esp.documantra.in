import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const statusData = [
  { code: "200", value: 42345, color: "#2563eb" },
  { code: "400", value: 1234,  color: "#ef4444" },
  { code: "401", value: 890,   color: "#f59e42" },
  { code: "404", value: 567,   color: "#10b981" },
  { code: "500", value: 234,   color: "#a78bfa" },
  { code: "429", value: 408,   color: "#f59e42" },
];

const total = statusData.reduce((sum, d) => sum + d.value, 0);

const StatusCodesChart = () => (
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

export default StatusCodesChart;
