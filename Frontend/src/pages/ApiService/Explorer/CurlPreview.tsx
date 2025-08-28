import type { ApiType } from "./types";

function getCurlCommand(api: ApiType, sandboxKey: string, authToken: string, body?: string): string {
  let cmd = `curl -X ${api.method} "${api.endpoint}"`;
  if (authToken) cmd += ` -H "Authorization: Bearer ${authToken}"`;
  if (sandboxKey) cmd += ` -H "X-Sandbox-Api-Key: ${sandboxKey}"`;
  if (api.method === "POST" && body) cmd += ` -H "Content-Type: application/json" -d '${body}'`;
  return cmd;
}

type CurlPreviewProps = {
  api: ApiType;
  sandboxKey: string;
  authToken: string;
  body?: string;
};

import { useState } from "react";

export default function CurlPreview({ api, sandboxKey, authToken, body }: CurlPreviewProps) {
  const curlCmd = getCurlCommand(api, sandboxKey, authToken, body);
  const [showToast, setShowToast] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(curlCmd);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1800); // auto hide toast in 1.8s
  };

  return (
    <div className="mb-3 w-full max-w-xl">
      <div className="font-semibold mb-1 text-gray-800">cURL Command</div>
      <div
        className="
          bg-gray-900 text-green-200 rounded-lg px-3 py-2 font-mono text-xs whitespace-pre overflow-x-auto
          border border-gray-300 shadow-sm w-full relative
        "
        style={{ minHeight: "44px" }}
      >
        <span>{curlCmd}</span>
        <button
          onClick={handleCopy}
          className="ml-3 float-right text-gray-400 hover:text-gray-200 px-2"
          title="Copy"
          style={{ cursor: "pointer" }}
        >
          Copy
        </button>
        {showToast && (
          <div className="absolute top-2 right-24 bg-green-700 text-white rounded px-2 py-1 shadow text-xs z-30 animate-fade">
            Copied!
          </div>
        )}
      </div>
    </div>
  );
}
