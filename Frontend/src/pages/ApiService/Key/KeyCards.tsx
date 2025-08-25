import { useState } from "react";

// Dummy API Key Data
const apiKeys = [
  {
    type: "Production Key",
    status: "Active",
    key: "ds_live_****************cdef",
    fullKey: "ds_live_abcd1234cdef",
    permissions: [
      { name: "user:read", color: "bg-green-100 text-green-800" },
      { name: "document:write", color: "bg-red-100 text-red-800" },
      { name: "envelope:send", color: "bg-blue-100 text-blue-800" },
    ],
    usage: 2547,
    quota: 10000,
    rateLimit: 10000,
    usagePercent: 25.5,
    created: "6/15/2024",
    lastUsed: "7/1/2024"
  },
  {
    type: "Development Key",
    status: "Active",
    key: "ds_test_****************7890",
    fullKey: "ds_test_abcd12347890",
    permissions: [
      { name: "user:read", color: "bg-green-100 text-green-800" },
      { name: "document:read", color: "bg-green-100 text-green-800" },
    ],
    usage: 450,
    quota: 1000,
    rateLimit: 1000,
    usagePercent: 45.0,
    created: "6/15/2024",
    lastUsed: "7/1/2024"
  }
];

export default function ApiKeyCards() {
  const [visible, setVisible] = useState(apiKeys.map(() => false));

  const handleToggle = (idx:any) => {
    setVisible(vis => vis.map((v, i) => (i === idx ? !v : v)));
  };

  const handleCopy = (fullKey:any) => {
    navigator.clipboard.writeText(fullKey);
    alert("API Key copied!");
  };

  return (
    <div className="w-full px-2 py-6 flex flex-col gap-7">
      {apiKeys.map((data, idx) => (
        <div
          key={idx}
          className="w-full bg-white rounded-xl border shadow p-6 sm:p-8"
        >
           {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
            <span className="font-semibold text-lg">{data.type}</span>
            <span className="flex items-center gap-2">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-semibold flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span>
                {data.status}
              </span>
            </span>
          </div>
          {/* Key */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-base text-gray-900 bg-gray-100 rounded px-4 py-2 mb-2 break-all">
            <span>{visible[idx] ? data.fullKey : data.key}</span>
            <button title={visible[idx] ? "Hide Key" : "Show Key"} onClick={() => handleToggle(idx)} className="hover:bg-gray-200 p-1 rounded">
              {visible[idx] ? "🙈" : "👁️"}
            </button>
            <button title="Copy Key" onClick={() => handleCopy(data.fullKey)} className="hover:bg-gray-200 p-1 rounded">
              📋
            </button>
          </div>
          {/* Permissions */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {data.permissions.map((perm, i) => (
              <span key={i} className={`mt-1 px-3 py-1 rounded text-xs font-medium ${perm.color}`}>
                {perm.name}
              </span>
            ))}
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-1">
            <div className="text-center">
              <div className="font-semibold text-lg text-gray-900">{data.usage.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">This Month</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-gray-900">{data.quota.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Monthly Quota</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-gray-900">{data.usagePercent}%</div>
              <div className="text-xs text-gray-500 mt-1">Usage</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-gray-900">{data.rateLimit.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Rate Limit</div>
            </div>
          </div>
          {/* Usage Bar */}
          <div className="mt-3">
            <div className="w-full h-2 rounded-full bg-gray-200">
              <div
                className="h-2 bg-green-500 rounded-full"
                style={{ width: `${data.usagePercent}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">{`${data.usage} / ${data.quota}`}</div>
          </div>
          {/* Dates */}
          <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
            <span>🗓️ Created {data.created}</span>
            <span>🔄 Last used {data.lastUsed}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
