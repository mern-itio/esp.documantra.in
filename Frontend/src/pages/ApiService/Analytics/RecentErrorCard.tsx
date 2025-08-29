import { useEffect, useState } from "react";
import { apiServiceApi } from "../../../services/apiHelper";

type RecentError = {
  endpoint: string;
  message: string;
  user: string;
  time: string;
};

const RecentErrorsCard = () => {
  const [recentErrors, setRecentErrors] = useState<RecentError[]>([]);

  const formatTime = (isoString: any) => {
    if (!isoString) return "";
    const dt = new Date(isoString);
    return dt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  };

  useEffect(() => {
    const fetchRecentErrors = async () => {
      try {
        const res = await apiServiceApi.get('/api/api-service/recent-errors');
        if (res.status === 200 && res.data.recentErrors) {
          setRecentErrors(
            res.data.recentErrors.map((err: any) => ({
              endpoint: err.endpoint,
              message: err.message || err.error,
              user: err.userId,
              time: formatTime(err.timestamp),
            }))
          );
        }
      } catch (e) {
        console.error("Recent Errors API error", e);
      }
    };
    fetchRecentErrors();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Errors</h2>
      {/* Overflow container with max height and scroll */}
      <div className="flex flex-col gap-4 max-h-80 overflow-y-auto">
        {recentErrors.map((err, idx) => (
          <div
            key={idx}
            className="bg-red-100 border border-red-300 rounded-lg p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center"
            style={{ overflowWrap: "anywhere", wordBreak: "break-word" }} // For long text wrapping
          >
            <div>
              <div className="font-medium text-sm text-gray-900" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
                {err.endpoint}
              </div>
              <div className="text-sm text-gray-700" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
                {err.message}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{`User: ${err.user}`}</div>
            </div>
            <div
              className="text-xs text-gray-500 font-semibold mt-2 sm:mt-0 sm:ml-4 sm:text-right"
            >
              {err.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentErrorsCard;
