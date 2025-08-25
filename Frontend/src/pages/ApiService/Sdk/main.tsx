import { AvailableSdk } from "./AvailableSdk";

const Main = () => {
  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">SDKs & Libraries</h1>
        <p className="text-gray-600">
         Official SDKs and libraries to integrate DraftnSign into your applications
        </p>
      </div>
    </div>
    <AvailableSdk/>
    </div>
  );
};

export default Main;
