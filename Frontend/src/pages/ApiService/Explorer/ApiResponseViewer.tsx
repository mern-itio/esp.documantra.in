import { useRef, useState } from "react";

type APIResponseViewerProps = {
  response: unknown;
};

export default function APIResponseViewer({ response }: APIResponseViewerProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const [showToast, setShowToast] = useState(false);
  const handleCopy = () => {
    const text =
      typeof response === "object"
        ? JSON.stringify(response, null, 2)
        : String(response);
    navigator.clipboard.writeText(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1800);
  };

  if (!response) return <div>No response</div>;

  return (
    <div className="bg-[#1a1a1a] p-4 rounded mt-4 shadow max-w-xl w-full relative">
      {/* COPY Button Top Right */}
      <button
        onClick={handleCopy}
        className="absolute top-4 right-10 bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600 text-xs cursor-pointer"
      >
        Copy
      </button>
      {showToast && (
        <div className="absolute top-2 right-24 bg-green-700 text-white rounded px-2 py-1 shadow text-xs z-30 animate-fade">
          Copied!
        </div>
      )}
      {/* Status Dot Row */}
      {typeof response === "object" && response !== null && "status" in response && (
        <div className="flex items-center gap-2 mb-3">
          <span
          style={{
            display: "inline-block",
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: (response as any).status === 200 ? "green" : "red",
            marginRight: "8px"
          }}
        />
          <span className="text-white font-mono text-xs">
            Status: {(response as { status: number })["status"]}
          </span>
        </div>
      )}
      <pre
        ref={preRef}
        className="text-green-200 text-sm font-mono overflow-auto"
        style={{ maxHeight: "350px",color:
      typeof response === "object" && response !== null && "status" in response
        ? (response as any).status === 200
          ? "#22c55e" // Tailwind green-500
          : "#ef4444" // Tailwind red-500
        : "#22c55e", // Default green for non-object response
         }}
      >
        {typeof response === "object"
          ? JSON.stringify(response, null, 2)
          : String(response)}
      </pre>
    </div>
  );
}
