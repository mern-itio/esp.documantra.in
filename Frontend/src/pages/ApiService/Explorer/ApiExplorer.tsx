import Sidebar from './Sidebar';
import { useState } from "react";
import { apiList } from "./Sidebar";
import CurlPreview from "./CurlPreview";
import UseCaseBlock from "./UseCaseBlock";
import APIRequestForm from "./ApiRequestForm";
import APIResponseViewer from "./ApiResponseViewer";

export default function APIExplorer() {
  const [selectedApi, setSelectedApi] = useState(apiList[0]);
  const [sandboxKey, setSandboxKey] = useState<string>("");
  const [body, setBody] = useState<string>("{}");
  const [responseMap, setResponseMap] = useState<{[key: string]: unknown}>({});

  return (
     <div className="flex flex-col md:flex-row gap-8 w-full  bg-[#F5F2EE]">
      {/* Sidebar */}
      <div className="w-full md:w-65 max-w-xs mx-auto min-w-0 bg-[#F7F3EE] border-r shadow-sm">
        <Sidebar onApiSelect={setSelectedApi} activeEndpoint={selectedApi.endpoint} selectedApi={selectedApi} />
      </div>
      {/* Main Pane */}
      <div className="flex flex-col gap-2 w-full max-w-xl">
        {/* Top description block */}
        <div className="mb-2 p-4 rounded bg-[#F5F2EE] border shadow text-gray-800 text-sm w-full max-w-xl">
          <strong>{selectedApi.name}</strong>
          <div>{selectedApi.description}</div>
        </div>
         {/* CurlPreview just below description */}
        <CurlPreview api={selectedApi} sandboxKey={sandboxKey} authToken="" body={body} />
        
         <APIRequestForm selectedApi={selectedApi} onResponse={(endpoint, resp) => setResponseMap(prev => ({ ...prev, [endpoint]: resp }))} setSandboxKey={setSandboxKey}  setBody={setBody} />
        <APIResponseViewer response={responseMap[selectedApi.endpoint]} />
      </div>
      {/* RIGHT PANE: Use Cases */}
    <div className="flex flex-col w-[340px] min-w-[280px] max-w-xs p-4 rounded-lg bg-[#F5F2EE] border shadow text-gray-700 text-sm h-fit mt-2">
      <div className="font-bold text-base mb-2">Use Cases</div>
      {/* Dynamically show use case for selected API */}
      <UseCaseBlock selectedApi={selectedApi} />
    </div>
  </div>
  );
}

