import { Code2, Zap, BarChart2, User2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

type StatusType = "success" | "error" | "pending" | "draft";

const statusColors: Record<StatusType, string> = {
  success: "bg-green-500",
  error: "bg-red-500",
  pending: "bg-yellow-500",
  draft: "bg-gray-400",
};

interface Activity {
  status: StatusType;
  text: string;
  time: string;
}

const activeProjects = [
  {
    name: "HR Integration Project",
    apiKeys: 2,
    requests: "3,003",
  },
  {
    name: "Sales Contract Automation",
    apiKeys: 1,
    requests: "1,234",
  },
];

const activities: Activity[] = [
  {
    status: "success",
    text: "New envelope created via API",
    time: "2 minutes ago",
  },
  {
    status: "success",
    text: "Webhook delivery successful",
    time: "5 minutes ago",
  },
  {
    status: "error",
    text: "Rate limit exceeded for key_001",
    time: "12 minutes ago",
  },
  {
    status: "success",
    text: "Document uploaded successfully",
    time: "18 minutes ago",
  },
];

const quickActions = [
  { 
    label: "Generate API Key", 
    icon: <Code2 className="w-5 h-5 text-gray-500 mr-3" />,
    link: "/api-service/keys" 
  },
  { 
    label: "Configure Webhook", 
    icon: <Zap className="w-5 h-5 text-gray-500 mr-3" />,
    link: "/api-service/webhooks" 
  },
  { 
    label: "Test API Endpoint", 
    icon: <BarChart2 className="w-5 h-5 text-gray-500 mr-3" />,
    link: "/api-service/explorer"
  },
  { 
    label: "Get Support", 
    icon: <User2 className="w-5 h-5 text-gray-500 mr-3" />,
    link: "/api-service/support" 
  },
];

// RIGHT SIDE WIDGETS
const RightWidgets: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6">
      {/* Active Projects */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Projects</h2>
        <div className="space-y-4">
          {activeProjects.map((proj) => (
            <div
              key={proj.name}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
            >
              <div>
                <div className="font-semibold text-gray-900">{proj.name}</div>
                <div className="text-xs text-gray-500">{proj.apiKeys} API keys</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{proj.requests}</div>
                <div className="text-xs text-gray-400">requests</div>
              </div>
            </div>
          ))}
        </div>
        <a
          href="/api-service/projects"
          className="block mt-4 text-blue-600 hover:underline text-sm font-medium text-center"
        >
          View all projects &rarr;
        </a>
      </div>
      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <ul className="space-y-4">
          {activities.map((activity, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span
                className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${statusColors[activity.status] || "bg-gray-300"}`}
              ></span>
              <div>
                <div className="font-medium text-gray-800 text-sm">{activity.text}</div>
                <div className="text-xs text-gray-500">{activity.time}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <ul className="space-y-5">
          {quickActions.map((action, idx) => (
            <li
              key={idx}
              className="flex items-center text-gray-700 text-base cursor-pointer"
              onClick={() => navigate(action.link)}
              tabIndex={0}
              role="button"
              onKeyDown={e => (e.key === 'Enter' ? navigate(action.link) : undefined)}
            >
              {action.icon}
              <span>{action.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RightWidgets;
