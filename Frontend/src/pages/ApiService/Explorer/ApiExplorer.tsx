import Sidebar from './Sidebar';
import { useState } from "react";
import { apiList } from "./Sidebar";
import APIRequestForm from "./ApiRequestForm";
import APIResponseViewer from "./ApiResponseViewer";
import CurlPreview from "./CurlPreview";

export default function APIExplorer() {
  const [response, setResponse] = useState<unknown>(null);
  const [selectedApi, setSelectedApi] = useState(apiList[0]);
  const [sandboxKey, setSandboxKey] = useState<string>("");
  const [body, setBody] = useState<string>("{}");

  return (
     <div className="flex flex-col md:flex-row max-w-screen-lg w-full p-4 gap-5">
      {/* Sidebar */}
      <div className="w-full md:w-65 max-w-xs mx-auto min-w-0 bg-white border-r shadow-sm">
        <Sidebar onApiSelect={setSelectedApi} activeEndpoint={selectedApi.endpoint} selectedApi={selectedApi} />
      </div>
      {/* Main Pane */}
      <div className="flex-1 flex flex-col gap-2">
        {/* Top description block */}
        <div className="mb-2 p-4 rounded bg-gray-50 border shadow text-gray-800 text-sm w-full max-w-xl">
          <strong>{selectedApi.name}</strong>
          <div>{selectedApi.description}</div>
        </div>
         {/* CurlPreview just below description */}
        <CurlPreview api={selectedApi} sandboxKey={sandboxKey} authToken={localStorage.getItem("accessToken") || ""} body={body} />
        <APIRequestForm selectedApi={selectedApi} onResponse={setResponse} setSandboxKey={setSandboxKey}  setBody={setBody} />
        <APIResponseViewer response={response} />
      </div>
    </div>
  );
}

