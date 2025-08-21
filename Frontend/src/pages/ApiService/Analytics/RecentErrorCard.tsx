const recentErrors = [
  {
    endpoint: "/api/v1/envelopes",
    message: "Invalid recipient email format",
    user: "user_456",
    time: "9:00:00 PM",
  },
  {
    endpoint: "/api/v1/documents",
    message: "File size exceeds limit",
    user: "user_789",
    time: "8:55:00 PM",
  },
];

const RecentErrorsCard = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Errors</h2>
    <div className="flex flex-col gap-4">
      {recentErrors.map((err, idx) => (
        <div
          key={idx}
          className="bg-red-100 border border-red-300 rounded-lg p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center"
        >
          <div>
            <div className="font-medium text-sm text-gray-900">{err.endpoint}</div>
            <div className="text-sm text-gray-700">{err.message}</div>
            <div className="text-xs text-gray-500 mt-0.5">User: {err.user}</div>
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


export default RecentErrorsCard;
