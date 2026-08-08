import { SupportPage } from "./SupportChannels";
import { useBrandSettings } from "../../../hooks/useBrandSettings";

const Main = () => {
  const { name: brandName } = useBrandSettings();
  return (
    <div className="p-6 space-y-8 bg-[#F5F2EE] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600">
            Get help with {brandName} API integration and troubleshooting
          </p>
        </div>
      </div>
      <SupportPage />
    </div>
  );
};

export default Main;
