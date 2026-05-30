import { useEffect, useState } from "react";
import { apiServiceApi } from "../../../services/apiHelper";
import type { ApiType } from "./types";

type APIRequestFormProps = {
  selectedApi: ApiType;
  onResponse: (endpoint: string, response: unknown) => void;
  setBody: (body: string) => void;
  setSandboxKey: (key: string) => void;
};

export default function APIRequestForm({
  selectedApi,
  onResponse,
  setBody,
}: APIRequestFormProps) {

  const [body, setBodyLocal] = useState(selectedApi.bodyTemplate || "{}");
  const isFileUpload = selectedApi.showFile;
  const [headers, setHeaders] = useState("");
  const [loading, setLoading] = useState(false);
  const [envelopeId, setEnvelopeId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [files, setFiles] = useState<File | null>(null);
  const [sandboxKey , setSandboxKey] = useState("");
  // Use sandboxKey from props
  const [fileError, setFileError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null;
    if (selected) {
      const isValidType = [".pdf", ".doc", ".docx"].some(ext =>
        selected.name.toLowerCase().endsWith(ext)
      );
      const isValidSize = selected.size <= 10 * 1024 * 1024;
      if (!isValidType) {
        setFileError("Only PDF, DOC, and DOCX files are allowed.");
        setFiles(null);
        return;
      }
      if (!isValidSize) {
        setFileError("File size cannot exceed 10MB.");
        setFiles(null);
        return;
      }
      setFileError(null);
      setFiles(selected);
    } else {
      setFiles(null);
      setFileError(null);
    }
  }

  async function handleRequest() {
    setLoading(true);
    try {
      // Handle :id for envelope APIs
      let endpoint = selectedApi.endpoint;
      if (selectedApi.showEnvelopeId && envelopeId) {
        endpoint = endpoint.replace(":id", envelopeId);
      }
      if (selectedApi.showDocumentId && documentId) {
        endpoint = endpoint.replace(":id", documentId);
      }

      const customHeaders: { [key: string]: string } = {
        ...JSON.parse(headers || "{}"),
        "X-Sandbox-Api-Key": sandboxKey || "",
      };

      let res;
      if (isFileUpload && files) {
        const formData = new FormData();
        formData.append("files", files);
        res = await apiServiceApi.post(
          endpoint,
          formData,
          { headers: { ...customHeaders, "Content-Type": "multipart/form-data" } }
        );
      } else {
        res = await apiServiceApi({
          url: endpoint,
          method: selectedApi.method,
          headers: customHeaders,
          data: selectedApi.showBody ? JSON.parse(body) : undefined,
        });
      }
      onResponse(selectedApi.endpoint, {
        status: res.status,
        statusText: res.statusText,
        data: res.data,
      });
    } catch (err: any) {
    const isAxiosError = !!err.response;
    onResponse(selectedApi.endpoint, {
      status: isAxiosError ? err.response.status : null,
      statusText: isAxiosError ? err.response.statusText : null,
      data: isAxiosError ? err.response.data : null,
    });
    }
    setLoading(false);
  }

  useEffect(() => {
    setHeaders("");
    setBody(selectedApi.bodyTemplate || "{}");
    setBodyLocal(selectedApi.bodyTemplate || "{}");
    setFiles(null);
    setFileError(null);
    setEnvelopeId("");
    setDocumentId("");
    setSandboxKey("");
  }, [selectedApi, setBody, setSandboxKey]);

  return (
    <div className="bg-[#F7F3EE] p-4 rounded mt-4 shadow flex flex-col gap-3 max-w-xl w-full">
      <label>Method:</label>
      <input className="border rounded p-2" value={selectedApi.method} readOnly />
      <label>Endpoint:</label>
      <input className="border rounded p-2" value={selectedApi.endpoint} readOnly />
      {/* Always show sandbox key */}
      <label htmlFor="sandboxKey">Sandbox API Key:</label>
      <input
        id="sandboxKey"
        type="text"
        className="border rounded p-2 w-full"
        value={sandboxKey}
        onChange={e => { setSandboxKey(e.target.value); setSandboxKey(e.target.value); }}
        placeholder="Enter your sandbox API key"
      />
      {/* Show envelopeId for those APIs that require */}
      {selectedApi.showEnvelopeId && (
        <>
          <label htmlFor="envelopeId">Envelope ID:</label>
          <input
            id="envelopeId"
            type="text"
            className="border rounded p-2 w-full"
            value={envelopeId}
            onChange={e => setEnvelopeId(e.target.value)}
            placeholder="Enter Envelope ID"
          />
        </>
      )}
      {/* File upload for designated APIs */}
      {selectedApi.showFile && (
        <div>
          <label htmlFor="file">Upload File:</label>
          <input
            id="file"
            type="file"
            className="border rounded p-2 w-full"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            required
          />
          <div className="text-xs text-gray-500 mt-1">
            <strong>Note:</strong> Only PDF, DOC, DOCX files up to 10MB each are supported.
          </div>
          {fileError && <div className="text-xs text-red-600 mt-1">{fileError}</div>}
        </div>
      )}
      {selectedApi.showDocumentId && (
        <>
          <label htmlFor="documentId">Document ID:</label>
          <input
            id="documentId"
            type="text"
            className="border rounded p-2 w-full"
            value={documentId}
            onChange={e => setDocumentId(e.target.value)}
            placeholder="Enter Document ID"
          />
        </>
      )}
      {/* Dynamic body input (JSON) */}
      {selectedApi.showBody && (
        <>
         <label htmlFor="body">Expected Body JSON:</label>
          <textarea
            id="body"
            className="bg-[#1a1a1a] text-green-200 font-mono rounded p-2 h-60 overflow-auto resize-none border-none"
            value={body}
            onChange={e => { setBodyLocal(e.target.value); setBody(e.target.value); }}
            placeholder={selectedApi.bodyTemplate || '{}'}
            style={{ maxHeight: "180px" }}
          />
        </>
      )}
      <button onClick={handleRequest} className="bg-blue-600 text-white px-4 py-2 rounded mt-2 hover:bg-blue-700 transition cursor-pointer" disabled={loading || (isFileUpload && !files)}>
        {loading ? "Loading..." : "Execute Request"}
      </button>
    </div>
  );
}

// import { useEffect, useState } from "react";
// import { apiServiceApi } from "../../../services/apiHelper";

// type ApiType = {
//   name: string;
//   endpoint: string;
//   method: string;
//   showFile: boolean;
//   description: string;
// };

// type APIRequestFormProps = {
//   selectedApi: ApiType;
//   onResponse: (response: unknown) => void;
//   setBody: (body: string) => void;
//   setSandboxKey: (key: string) => void;
// };

// export default function APIRequestForm({ selectedApi, onResponse, setBody }: APIRequestFormProps) {
//   const [body, setBodyLocal] = useState("{}");
//   const isFileUpload = selectedApi.showFile;
//   const [headers, setHeaders] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [envelopeId, setEnvelopeId] = useState("");
//   const [files, setFiles] = useState<File | null>(null);
//   const [sandboxKey, setSandboxKey] = useState<string>(""); 
//   const [fileError, setFileError] = useState<string | null>(null);
    
//    // File validate: type + size
//   function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
//     const selected = e.target.files?.[0] || null;
//     if (selected) {
//       const isValidType = [".pdf", ".doc", ".docx"].some(ext =>
//         selected.name.toLowerCase().endsWith(ext)
//       );
//       const isValidSize = selected.size <= 10 * 1024 * 1024; // 10MB

//       if (!isValidType) {
//         setFileError("Only PDF, DOC, and DOCX files are allowed.");
//         setFiles(null);
//         return;
//       }
//       if (!isValidSize) {
//         setFileError("File size cannot exceed 10MB.");
//         setFiles(null);
//         return;
//       }
//       setFileError(null);
//       setFiles(selected);
//     } else {
//       setFiles(null);
//       setFileError(null);
//     }
//   }
  
//   // Inside handleRequest function:
// async function handleRequest() {
//   setLoading(true);
//   try {
//     let endpoint = selectedApi.endpoint;
//     if (selectedApi.name === "Fetch Envelope Details" && envelopeId) {
//       endpoint = endpoint.replace(":id", envelopeId);
//     }
//     // Annotate type:
//     const customHeaders: { [key: string]: string } = {
//       ...JSON.parse(headers || "{}"),
//       "X-Sandbox-Api-Key": sandboxKey || "",
//     };

//     let res;
//     if (isFileUpload && files) {
//       const formData = new FormData();
//       formData.append("files", files);

//       res = await apiServiceApi.post(
//         endpoint,
//         formData,
//         { headers: { ...customHeaders, "Content-Type": "multipart/form-data" } }
//       );
//     } else {
//       res = await apiServiceApi({
//         url: endpoint,
//         method: selectedApi.method,
//         headers: customHeaders,
//         data: body ? JSON.parse(body) : undefined,
//       });
//     }
//     onResponse(res.data);
//   } catch (err: unknown) {
//     let message = "Unknown error occurred";
//     if (err instanceof Error) {
//       message = err.message;
//     }
//     onResponse({ error: message });
//   }
//   setLoading(false);
// }

//    useEffect(() => {
//     setHeaders("");
//     setBody("{}");
//     setFiles(null);
//     setFileError(null);
//   }, [selectedApi]);

//   return (
//    <div className="bg-[#F7F3EE] p-4 rounded mt-4 shadow flex flex-col gap-3 max-w-xl w-full">
//           <label>Method:</label>
//       <input
//         className="border rounded p-2"
//         value={selectedApi.method}
//         readOnly
//       />
//       <label>Endpoint:</label>
//       <input
//         className="border rounded p-2"
//         value={selectedApi.endpoint}
//         readOnly
//       />

//       <label htmlFor="sandboxKey">Sandbox API Key:</label>
//         <input
//         id="sandboxKey"
//         type="text"
//         className="border rounded p-2 w-full"
//         value={sandboxKey}
//         onChange={e => setSandboxKey(e.target.value)}
//         placeholder="Enter your sandbox API key"
//         />
//         <label htmlFor="envelopeId">Envelope ID:</label>
//         <input
//           id="envelopeId"
//           type="text"
//           className="border rounded p-2 w-full"
//           value={envelopeId}
//           onChange={e => setEnvelopeId(e.target.value)}
//           placeholder="Enter Envelope ID"
//         />
//       {isFileUpload ? (
//         <div>
//           <label htmlFor="file">Upload File:</label>
//           <input
//             id="file"
//             type="file"
//             className="border rounded p-2 w-full"
//             accept=".pdf,.doc,.docx"
//             onChange={handleFileChange}
//             required
//           />
//           <div className="text-xs text-gray-500 mt-1">
//             <strong>Note:</strong> Only PDF, DOC, DOCX files up to 10MB each are supported.
//           </div>
//           {fileError && <div className="text-xs text-red-600 mt-1">{fileError}</div>}
//         </div>
//       ) : (
//          <>
//       <label htmlFor="body">Body JSON:</label>
//       <textarea
//         id="body"
//         className="border rounded p-2 h-"
//         value={body}
//         onChange={e => {setBodyLocal(e.target.value); setBody(e.target.value); }}
//         placeholder='{}'
//       />
//        </>
//       )}
//       <button
//         onClick={handleRequest}
//         className="bg-blue-600 text-white px-4 py-2 rounded mt-2 hover:bg-blue-700 transition cursor-pointer"
//          disabled={loading || (isFileUpload && !files)}
//       >
//         {loading ? "Loading..." : "Execute Request"}
//       </button>
//     </div>
//   );
// }
