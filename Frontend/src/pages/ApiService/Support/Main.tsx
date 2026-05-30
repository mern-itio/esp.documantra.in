import { SupportPage } from "./SupportChannels";

const Main = () => {
  return (
    <div className="p-6 space-y-8 bg-[#F5F2EE] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600">
            Get help with DraftnSign API integration and troubleshooting
          </p>
        </div>
      </div>
      <SupportPage />
    </div>
  );
};

export default Main;
