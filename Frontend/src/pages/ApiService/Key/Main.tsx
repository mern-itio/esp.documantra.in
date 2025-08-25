import {Plus } from "lucide-react";
import ApiKeyCards from "./KeyCards";

const Main = () => {
  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
        <p className="text-gray-600">
          Manage API keys for secure access to the DraftnSign API.
        </p>
      </div>
      {/* Right Side Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-100 transition-colors">
          <Plus className="w-4 h-4" />
          Create API Key
        </button>
      </div>
    </div>
    <ApiKeyCards/>
    </div>
  );
};

export default Main;
