import { useState } from "react";
import { Edit, Trash2, Folder } from "lucide-react";
import Modal from "../../../components/common/types/Modal";
import QuickActions from "../Analytics/QuickActions";

// Static Data (extra fields for details demo)
const projects = [
  {
    name: "HR Integration Project",
    created: "6/15/2024",
    description: "Integrate DraftnSign with HR systems for employee onboarding",
    apiKeys: 2,
    requests: 3003,
    avgLatency: 156,
    webhooks: 1,
    status: "Active",
    success: "99.8%",
    updated: "7/1/2024",
    endpoints: [
      { name: "/api/v1/envelopes", requests: 1234, latency: 245, error: 0.2 },
      { name: "/api/v1/documents", requests: 987, latency: 123, error: 0.1 },
      { name: "/api/v1/users", requests: 543, latency: 89, error: 0.0 },
    ],
  },
  {
    name: "Sales Contract Automation",
    created: "5/20/2024",
    description: "Automate sales contract generation and signing process",
    apiKeys: 1,
    requests: 1234,
    avgLatency: 189,
    webhooks: 0,
    status: "Active",
    success: "99.8%",
    updated: "6/25/2024",
    endpoints: [
      { name: "/api/v1/templates", requests: 456, latency: 167, error: 0.1 },
      { name: "/api/v1/envelopes", requests: 389, latency: 234, error: 0.3 },
      { name: "/api/v1/documents", requests: 234, latency: 145, error: 0.0 },
    ],
  },
];

export default function ProjectCards() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = projects[selectedIdx];
  const [modalOpen, setModalOpen] = useState(false);
  

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {projects.map((proj, idx) => (
          <button
            key={proj.name}
            onClick={() => setSelectedIdx(idx)}
            className={`
              bg-white rounded-xl border shadow px-6 py-4 text-left transition
              ${
                selectedIdx === idx
                  ? "border-blue-400 shadow-lg ring-2 ring-blue-200"
                  : "border-gray-200 hover:shadow-md"
              }
              focus:outline-none
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Folder className="w-6 h-6 text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {proj.name}
                </h2>
              </div>
              <div className="flex gap-2 text-gray-400 ">
                <button onClick={() => setModalOpen(true)}>
                  <Edit className="w-4 h-4 cursor-pointer" />
                </button>
                <Trash2 className="w-4 h-4 cursor-pointer" />
              </div>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              Created {proj.created}
            </div>
            <div className="text-gray-700 mb-4 text-sm">{proj.description}</div>
            <div className="flex gap-4 mb-4">
              <div>
                <div className="text-center text-2xl font-bold text-blue-600">
                  {proj.apiKeys}
                </div>
                <div className="text-center text-xs text-gray-500">
                  API Keys
                </div>
              </div>
              <div>
                <div className="text-center text-2xl font-bold text-gray-900">
                  {proj.requests.toLocaleString()}
                </div>
                <div className="text-center text-xs text-gray-500">
                  Requests
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1 text-gray-600">
                <span className="text-lg">↗</span>
                {proj.success} success
              </span>
              {selectedIdx === idx && (
                <span
                  className={`flex items-center gap-1 ${
                    proj.status === "Active"
                      ? "text-green-500"
                      : "text-gray-500"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full mr-1"
                    style={{
                      background:
                        proj.status === "Active" ? "#22c55e" : "#878787",
                    }}
                  ></span>
                  {proj.status}
                </span>
              )}
            </div>
            <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
              <span>Last updated {proj.updated}</span>
              {proj.webhooks > 0 && (
                <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                  {proj.webhooks} webhook
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-2/3">
          {/* Details Card (updated for stat blocks & endpoints) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow py-8 px-8 mt-6">
            <h2 className="text-2xl font-bold mb-3">{selected.name}</h2>
            <div className="text-gray-600 mb-6">{selected.description}</div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="rounded-lg bg-blue-50 py-4 text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {selected.apiKeys}
                </div>
                <div className="text-xs text-gray-500 mt-1">API Keys</div>
              </div>
              <div className="rounded-lg bg-green-50 py-4 text-center">
                <div className="text-lg font-semibold text-green-600">
                  {selected.requests.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">Total Requests</div>
              </div>
              <div className="rounded-lg bg-yellow-50 py-4 text-center">
                <div className="text-lg font-semibold text-yellow-600">
                  {selected.avgLatency}ms
                </div>
                <div className="text-xs text-gray-500 mt-1">Avg Latency</div>
              </div>
              <div className="rounded-lg bg-purple-50 py-4 text-center">
                <div className="text-lg font-semibold text-purple-600">
                  {selected.webhooks}
                </div>
                <div className="text-xs text-gray-500 mt-1">Webhooks</div>
              </div>
            </div>

            {/* Endpoints List */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Top Endpoints</h3>
              <div className="flex flex-col gap-2">
                {selected.endpoints.map((ep) => (
                  <div
                    key={ep.name}
                    className="rounded-lg bg-gray-50 px-2 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-mono font-medium">{ep.name}</div>
                      <div className="text-xs text-gray-500">
                        {ep.requests} requests &bull; {ep.latency}ms avg
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-gray-700 mt-2 sm:mt-0 sm:text-right">
                      {ep.error.toFixed(1)}%
                      <span className="ml-1 text-xs text-gray-400 font-normal">
                        error rate
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Side Box (right) */}
        <div className="w-full lg:w-1/3">
          <QuickActions/>
        </div>
      </div>

      <Modal open={modalOpen} disableBackdropClose={true} onClose={() => setModalOpen(false)} title="Edit Project"  >
        {/* Example content, form etc */}
        <form>
          <label className="block mb-2 font-medium">Project Name</label>
          <input
            className="border rounded-lg w-full mb-4 p-2"
            defaultValue={selected.name}
          />
          <label className="block mb-2 font-medium">Description</label>
          <textarea
            className="border rounded-lg w-full mb-4 p-2"
            rows={3}
            defaultValue={selected.description}
          />
          <div className="flex gap-3 mt-1 justify-end">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="border px-3 py-1.5 rounded-md cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-1.5 rounded-md font-semibold hover:bg-blue-700 cursor-pointer"
            >
              Update Project
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
