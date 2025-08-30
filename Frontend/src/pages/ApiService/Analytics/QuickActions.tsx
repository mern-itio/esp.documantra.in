import { Code2, AlertTriangle } from "lucide-react";

const quickActions = [
  { 
    label: "View Detailed Reports", 
    icon: <Code2 className="w-5 h-5 text-gray-500 mr-3" /> 
  },
  { 
    label: "Set Up Alerts", 
    icon: <AlertTriangle className="w-5 h-5 text-gray-500 mr-3" /> 
  },
];
const QuickActions = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
    <ul className="space-y-5">
      {quickActions.map((action, idx) => (
        <li key={idx} className="flex items-center text-gray-700 text-base">
          {action.icon}
          <span>{action.label}</span>
        </li>
      ))}
    </ul>
  </div>
  )
}

export default QuickActions