import Sidebar from './Sidebar';
import { useState } from "react";
import { apiList } from "./Sidebar";
import APIRequestForm from "./ApiRequestForm";
import APIResponseViewer from "./ApiResponseViewer";
import CurlPreview from "./CurlPreview";
import UseCaseBlock from "./UseCaseBlock";

export default function APIExplorer() {
  const [response, setResponse] = useState<unknown>(null);
  const [selectedApi, setSelectedApi] = useState(apiList[0]);
  const [sandboxKey, setSandboxKey] = useState<string>("");
  const [body, setBody] = useState<string>("{}");

  return (
     <div className="flex flex-col md:flex-row gap-8 w-full">
      {/* Sidebar */}
      <div className="w-full md:w-65 max-w-xs mx-auto min-w-0 bg-white border-r shadow-sm">
        <Sidebar onApiSelect={setSelectedApi} activeEndpoint={selectedApi.endpoint} selectedApi={selectedApi} />
      </div>
      {/* Main Pane */}
      <div className="flex flex-col gap-2 w-full max-w-xl">
        {/* Top description block */}
        <div className="mb-2 p-4 rounded bg-gray-50 border shadow text-gray-800 text-sm w-full max-w-xl">
          <strong>{selectedApi.name}</strong>
          <div>{selectedApi.description}</div>
        </div>
         {/* CurlPreview just below description */}
        <CurlPreview api={selectedApi} sandboxKey={sandboxKey} authToken={localStorage.getItem("accessToken") || ""} body={body} />
         <APIRequestForm
          selectedApi={{
            ...selectedApi,
            showEnvelopeId: selectedApi.showEnvelopeId ?? false,
            showDocumentId: selectedApi.showDocumentId ?? false,
          }}
          onResponse={setResponse}
          setSandboxKey={setSandboxKey}
          setBody={setBody}
          sandboxKey={sandboxKey}
        />

        <APIResponseViewer response={response} />
      </div>
      {/* RIGHT PANE: Use Cases */}
    <div className="flex flex-col w-[340px] min-w-[280px] max-w-xs p-4 rounded-lg bg-gray-50 border shadow text-gray-700 text-sm h-fit mt-2">
      <div className="font-bold text-base mb-2">Use Cases</div>
      {/* Dynamically show use case for selected API */}
      <UseCaseBlock selectedApi={selectedApi} />
    </div>
  </div>
  );
}

