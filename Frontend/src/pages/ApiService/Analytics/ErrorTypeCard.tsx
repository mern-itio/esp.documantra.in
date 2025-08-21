const errorTypes = [
  { label: "Authentication Error", count: 89 },
  { label: "Rate Limit Exceeded", count: 67 },
  { label: "Validation Error", count: 45 },
  { label: "Server Error", count: 23 },
  { label: "Not Found", count: 10 },
];

const maxError = Math.max(...errorTypes.map(e => e.count));

const ErrorTypesCard = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Error Types</h2>
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
              style={{ width: `${(err.count / maxError) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ErrorTypesCard;
