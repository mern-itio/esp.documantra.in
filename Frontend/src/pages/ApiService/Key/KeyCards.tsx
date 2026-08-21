import { useEffect, useState } from "react";
import { toast } from "react-hot-toast"; 
import { apiServiceApi } from "../../../services/apiHelper";
import { useAuth } from "../../../components/AuthService/AuthContext";

type ApiKeyCardsProps = {
  refresh?: number;
  onModesFound?: (modes: { hasSandbox: boolean; hasProduction: boolean }) => void;
};

export default function ApiKeyCards({ refresh = 0, onModesFound }: ApiKeyCardsProps) {
  const { isAuthenticated } = useAuth();
  const [visible, setVisible] = useState<boolean[]>([]);
  const [keys, setKeys] = useState<any[]>([]);

  // Fetch keys on mount (authenticated only)
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchKeys = async () => {
      try {
        const response = await apiServiceApi.get('/api/api-service/keys');
        if (response.status === 200 && response.data.apiKeys) {
          setKeys(response.data.apiKeys);
          setVisible(Array(response.data.apiKeys.length).fill(false));
          const sandbox = response.data.apiKeys.find(
            (key: { mode: string; isActive: boolean; apiKey?: string }) =>
              key.mode === 'sandbox' && key.isActive && key.apiKey,
          );
          if (sandbox?.apiKey) {
            try {
              sessionStorage.setItem('documantra_last_sandbox_key', sandbox.apiKey);
            } catch { /* ignore */ }
          }
           const hasSandbox = response.data.apiKeys.some(
            (key: any) => key.mode === "sandbox" && key.isActive
          );
          const hasProduction = response.data.apiKeys.some(
            (key: any) => key.mode === "production" && key.isActive
          );
          if (onModesFound) onModesFound({ hasSandbox, hasProduction });
        }
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 401 || status === 403) return;
        toast.error("Failed to fetch API keys. Please try again.", { id: "api-key-fetch-error" });
        console.error('Error fetching API keys:', error);
      }
    };
    
    fetchKeys();
  }, [refresh, isAuthenticated, onModesFound]);

  const handleToggle = (idx: number) => {
    setVisible(vis => vis.map((v, i) => (i === idx ? !v : v)));
  };

  const handleCopy = (fullKey: string) => {
    navigator.clipboard.writeText(fullKey);
    toast("API Key copied!");
  };

  // Get current year/month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return (
    <div className="w-full px-2 py-6 flex flex-col gap-7">
      {keys.length === 0 ? (
        <div className="w-full bg-[#F7F3EE] rounded-xl border shadow p-8 text-center text-gray-600 text-lg">
          🚫 No API keys found. Please generate a key.
        </div>
      ) : (
        keys.map((data, idx) => {
          // Find current month usage from usageLogs
          const thisMonthUsage =
            data.usageLogs?.find(
              (log: any) => log.year === currentYear && log.month === currentMonth
            )?.count ?? 0;

          return (
            <div key={data._id || idx} className="w-full bg-[#F7F3EE] rounded-xl border shadow p-6 sm:p-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                <span className="font-semibold text-lg">
                  {data.mode === "production" ? "Production Key" : "Sandbox Key"}
                </span>
                <span className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-semibold flex items-center">
                    <span className={`w-2 h-2 rounded-full ${data.isActive ? "bg-green-500" : "bg-gray-400"} inline-block mr-2`}></span>
                    {data.isActive ? "Active" : "Inactive"}
                  </span>
                </span>
              </div>
              {/* Key */}
              <div className="flex flex-wrap items-center gap-3 font-mono text-base text-gray-900 bg-gray-100 rounded px-4 py-2 mb-2 break-all">
               <span>
                  {visible[idx]
                    ? data.apiKey
                    : `${data.apiKey?.slice(0, 8) ?? ""}${"*".repeat((data.apiKey?.length ?? 12) - 12)}${data.apiKey?.slice(-4) ?? ""}`}
                </span>
                <button title={visible[idx] ? "Hide Key" : "Show Key"} onClick={() => handleToggle(idx)} className="hover:bg-gray-200 p-1 rounded">
                  {visible[idx] ? "🙈" : "👁️"}
                </button>
                <button title="Copy Key" onClick={() => handleCopy(data.apiKey)} className="hover:bg-gray-200 p-1 rounded">
                  📋
                </button>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-1">
                <div className="text-center">
                  <div className="font-semibold text-lg text-gray-900">
                    {typeof thisMonthUsage === "number" ? thisMonthUsage.toLocaleString() : "0"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">This Month</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg text-gray-900">
                    {typeof data.limit === "number" ? data.limit.toLocaleString() : (data.limit || "∞")}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Monthly Quota</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg text-gray-900">
                    {data.limit
                      ? ((thisMonthUsage * 100) / data.limit).toFixed(1)
                      : "0"}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Usage</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg text-gray-900">
                    {typeof data.limit === "number" ? data.limit.toLocaleString() : (data.limit || "∞")}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Rate Limit</div>
                </div>
              </div>

              {/* Usage Bar */}
              <div className="mt-3">
                <div className="w-full h-2 rounded-full bg-gray-200">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{
                      width: `${
                        data.limit
                          ? ((thisMonthUsage * 100) / data.limit)
                          : 0
                      }%`
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {`${thisMonthUsage} / ${typeof data.limit === "number" ? data.limit : (data.limit || "∞")}`}
                </div>
              </div>

               {data.usageLogs && data.usageLogs.length > 0 && (
              <div className="mt-4">
                <div className="font-semibold text-sm mb-2 text-gray-700">Usage Logs (Monthly)</div>
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-gray-600 bg-gray-100">
                      <th className="px-3 py-2">Month</th>
                      <th className="px-3 py-2">Year</th>
                      <th className="px-3 py-2">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.usageLogs
                      .sort((a:any, b:any) => b.year !== a.year ? b.year - a.year : b.month - a.month)
                      .map((log:any, i:any) => (
                        <tr key={log._id || i} className="text-gray-900 text-center">
                          <td className="px-3 py-2">
                            {log.month.toString().padStart(2, '0')}
                          </td>
                          <td className="px-3 py-2">{log.year}</td>
                          <td className="px-3 py-2">{typeof log.count === "number" ? log.count.toLocaleString() : "--"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
                )}
              {/* Dates */}
              <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
                <span>
                  🗓️ Created {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "-"}
                </span>
                <span>
                  🔄 Last used {data.lastUsedAt ? new Date(data.lastUsedAt).toLocaleDateString() : "-"}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
