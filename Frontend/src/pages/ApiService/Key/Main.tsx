import { useState } from "react";
import { Plus } from "lucide-react";
import ApiKeyCards from "./KeyCards";
import { toast } from "react-hot-toast";
import Modal from "../../../components/common/types/Modal"; 
import { apiServiceApi } from "../../../services/apiHelper"; 


const Main = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState(""); 
  const [refresh, setRefresh] = useState(0);  
  const [hasSandbox, setHasSandbox] = useState(false);
  const [hasProduction, setHasProduction] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const response = await apiServiceApi.post('/api/api-service/generate', { mode });
      if (response.status === 201) {
        toast.success("API Key created!");
        setModalOpen(false);
        setRefresh(r => r + 1); // for reloading keys
      } else {
        toast.error(response.data?.error || "Failed to create API Key");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Error creating key");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 space-y-8 bg-[#F5F2EE] min-h-screen">
      {/* Header & Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-600">
            Manage API keys for secure access to the DraftnSign API.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {!hasSandbox || !hasProduction ? (
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-100 transition-colors cursor-pointer"  onClick={() => { if (!hasSandbox) setMode('sandbox'); else if (!hasProduction) setMode('production'); setModalOpen(true);}}>
            <Plus className="w-4 h-4" />
            Create API Key
          </button>
           ) : null}
        </div>
      </div>
      {/* Keys List */}
      <ApiKeyCards refresh={refresh} onModesFound={({ hasSandbox, hasProduction }) => { setHasSandbox(hasSandbox); setHasProduction(hasProduction) }} />

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create API Key" disableBackdropClose={creating} >
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Type</label>
          <select value={mode} onChange={e => setMode(e.target.value)} className="border rounded-lg px-3 py-2 w-full" disabled={creating}>
           {!hasSandbox && <option value="sandbox">Sandbox</option>}
          {!hasProduction && <option value="production">Production</option>}
          </select>
        </div>
        <button onClick={handleCreate} disabled={creating} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-70">
          {creating ? "Creating..." : "Create"}
        </button>
      </Modal>
    </div>
  );
};

export default Main;
