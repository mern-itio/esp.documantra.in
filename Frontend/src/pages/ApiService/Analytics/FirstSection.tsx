
import { Activity, AlertTriangle, Clock, CheckCircle } from "lucide-react";

const stats = [
  {
    name: "Total Requests",
    value: "45,678",
    change: "+12.5%",
    changeType: "increase",
    changeText: "from last period",
    icon: <Activity className="w-8 h-8 text-blue-500" />,
  },
  {
    name: "Error Rate",
    value: "0.51%",
    change: "-0.3%",
    changeType: "decrease",
    changeText: "from last period",
    icon: <AlertTriangle className="w-8 h-8 text-blue-500" />,
  },
  {
    name: "Avg Latency",
    value: "156ms",
    change: "-5.2%",
    changeType: "decrease",
    changeText: "from last period",
    icon: <Clock className="w-8 h-8 text-blue-500" />,
  },
  {
    name: "API Uptime",
    value: "99.97%",
    change: "+0.1%",
    changeType: "increase",
    changeText: "from last period",
    icon: <CheckCircle className="w-8 h-8 text-blue-500" />,
  },
];

const FirstSection = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
            </div>
            <div className="bg-indigo-50 p-2 rounded-lg flex items-center justify-center">
              {stat.icon}
            </div>
          </div>
          <div
            className={`text-sm font-medium flex items-center ${
              stat.changeType === "increase" ? "text-green-600" : "text-red-600"
            }`}
          >
            <span className="mr-1">{stat.changeType === "increase" ? "↑" : "↓"}</span>
            {stat.change}
            <span className="ml-1 text-gray-500 font-normal">{stat.changeText}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FirstSection;
