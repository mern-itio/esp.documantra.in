import { useEffect, useState } from "react";
import { apiServiceApi } from "../../../services/apiHelper";
import LoadingSpinner from "../../../components/ApiServices/Spinner";

type ErrorTypeDatum = {
  label: string;
  count: number;
};

const ErrorTypesCard = () => {
  const [errorTypes, setErrorTypes] = useState<ErrorTypeDatum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchErrorTypes = async () => {
      setLoading(true);
      try {
        const response = await apiServiceApi.get('/api/api-service/error-types');
        // Response: { chartData: [{ type, count }, ...] }
        if (response.status === 200 && response.data.chartData) {
          // Format for UI
          setErrorTypes(
            response.data.chartData.map((item: any) => ({
              label: item.type,
              count: item.count
            }))
          );
        }
      } catch (err) {
        console.error("Error Types API error:", err);
      }
       finally {
      setLoading(false); // Done loading
    }
    };
    fetchErrorTypes();
  }, []);

  // Maximum error count for bar width calculation (avoid divide by 0)
  const maxError = errorTypes.length ? Math.max(...errorTypes.map(e => e.count)) : 1;

  return (
    <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Error Types</h2>
      {loading ? (
      <LoadingSpinner />
    ) : (
      <div className="flex flex-col gap-3">
        {errorTypes.map((err) => (
          <div key={err.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-700 font-medium">{err.label}</span>
              <span className="text-xs text-gray-600">{err.count}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-400 h-2 rounded-full"
                style={{ width: `${maxError ? (err.count / maxError) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    )}
    </div>
  );
};

export default ErrorTypesCard;
