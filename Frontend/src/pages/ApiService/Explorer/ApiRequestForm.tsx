import { useEffect, useState } from "react";
import { apiServiceApi } from "../../../services/apiHelper";

type ApiType = {
  name: string;
  endpoint: string;
  method: string;
  showFile: boolean;
  description: string;
};

type APIRequestFormProps = {
  selectedApi: ApiType;
  onResponse: (response: unknown) => void;
  setBody: (body: string) => void;
  setSandboxKey: (key: string) => void;
};

export default function APIRequestForm({ selectedApi, onResponse, setBody }: APIRequestFormProps) {
  const [body, setBodyLocal] = useState("{}");
  const isFileUpload = selectedApi.showFile;
  const [headers, setHeaders] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File | null>(null);
  const [sandboxKey, setSandboxKey] = useState<string>(""); 
  const [fileError, setFileError] = useState<string | null>(null);
    
   // File validate: type + size
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null;
    if (selected) {
      const isValidType = [".pdf", ".doc", ".docx"].some(ext =>
        selected.name.toLowerCase().endsWith(ext)
      );
      const isValidSize = selected.size <= 10 * 1024 * 1024; // 10MB

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
  
  // Inside handleRequest function:
async function handleRequest() {
  setLoading(true);
  try {
    // Annotate type:
    const customHeaders: { [key: string]: string } = {
      ...JSON.parse(headers || "{}"),
      "X-Sandbox-Api-Key": sandboxKey || "",
    };

    let res;
    if (isFileUpload && files) {
      const formData = new FormData();
      formData.append("files", files);

      res = await apiServiceApi.post(
        selectedApi.endpoint,
        formData,
        { headers: { ...customHeaders, "Content-Type": "multipart/form-data" } }
      );
    } else {
      res = await apiServiceApi({
        url: selectedApi.endpoint,
        method: selectedApi.method,
        headers: customHeaders,
        data: body ? JSON.parse(body) : undefined,
      });
    }
    onResponse(res.data);
  } catch (err: unknown) {
    let message = "Unknown error occurred";
    if (err instanceof Error) {
      message = err.message;
    }
    onResponse({ error: message });
  }
  setLoading(false);
}

   useEffect(() => {
    setHeaders("");
    setBody("{}");
    setFiles(null);
    setFileError(null);
  }, [selectedApi]);

  return (
   <div className="bg-white p-4 rounded mt-4 shadow flex flex-col gap-3 max-w-xl w-full">
          <label>Method:</label>
      <input
        className="border rounded p-2"
        value={selectedApi.method}
        readOnly
      />
      <label>Endpoint:</label>
      <input
        className="border rounded p-2"
        value={selectedApi.endpoint}
        readOnly
      />

      <label htmlFor="sandboxKey">Sandbox API Key:</label>
        <input
        id="sandboxKey"
        type="text"
        className="border rounded p-2 w-full"
        value={sandboxKey}
        onChange={e => setSandboxKey(e.target.value)}
        placeholder="Enter your sandbox API key"
        />
      {isFileUpload ? (
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
      ) : (
         <>
      <label htmlFor="body">Body JSON:</label>
      <textarea
        id="body"
        className="border rounded p-2 h-16"
        value={body}
        onChange={e => {setBodyLocal(e.target.value); setBody(e.target.value); }}
        placeholder='{}'
      />
       </>
      )}
      <button
        onClick={handleRequest}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-2 hover:bg-blue-700 transition"
         disabled={loading || (isFileUpload && !files)}
      >
        {loading ? "Loading..." : "Execute Request"}
      </button>
    </div>
  );
}
