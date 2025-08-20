import React, { useEffect, useMemo, useState } from "react";
import { FileText, UserCircle } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

// configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export type Doc = {
  id: string;
  name: string;
  size?: number;
  pages?: number;
  url?: string;
  type?: string;
  file?: File; // Optional: keep original file reference
};

export type Recipient = {
  id: string;
  name: string;
  email: string;
  role: "signer" | "approver" | "carbon_copy" | "in_person_signer";
};

export default function SigningEditorStep({
  documents,
  recipients,
}: {
  documents: Doc[];
  recipients: Recipient[];
}) {
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);

  useEffect(() => {
    if (documents?.length && !activeDocId) {
      setActiveDocId(documents[0].id);
    }
  }, [documents, activeDocId]);

  useEffect(() => {
    if (recipients?.length && !activeRecipientId) {
      setActiveRecipientId(recipients[0].id);
    }
  }, [recipients, activeRecipientId]);

  const activeDoc = useMemo(
    () => documents?.find((d) => d.id === activeDocId) || null,
    [activeDocId, documents]
  );

  const activeRecipient = useMemo(
    () => recipients?.find((r) => r.id === activeRecipientId) || null,
    [activeRecipientId, recipients]
  );

  const onDocLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] gap-4">
      {/* Top: Doc buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {documents?.map((doc, idx) => {
          const isActive = doc.id === activeDocId;
          const disabled = idx !== 0; // Only first is active; others disabled for now
          return (
            <button
              key={doc.id}
              disabled={disabled}
              onClick={() => !disabled && setActiveDocId(doc.id)}
              className={[
                "px-3 py-2 rounded-xl border text-sm flex items-center gap-2",
                isActive
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300",
                disabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-sm",
              ].join(" ")}
            >
              <FileText className="w-4 h-4" />
              <span className="truncate max-w-[180px]">{doc.name}</span>
              {typeof doc.pages === "number" && (
                <span className="text-xs opacity-80">· {doc.pages}p</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main stage */}
      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Canvas area */}
        <div className="col-span-12 lg:col-span-9 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
            <div className="text-sm text-gray-600">
              Viewing: <span className="font-medium text-gray-900">{activeDoc?.name ?? "—"}</span>
            </div>
            <div className="text-xs text-gray-500">Step 3: PDF Canvas Rendering</div>
          </div>

          <div className="relative h-full min-h-[480px] overflow-auto bg-gray-50">
            {activeDoc?.url && activeDoc.type === "application/pdf" ? (
              <Document
                file={activeDoc.file || activeDoc.url}
                onLoadSuccess={onDocLoadSuccess}
                loading={<div className="p-8 text-gray-500 text-center">Loading PDF…</div>}
                onLoadError={(err) => {
                  console.error("PDF load error:", err);
                }}
              >
                {Array.from(new Array(numPages), (_, index) => (
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    width={800}
                    className="mx-auto mb-4 shadow"
                  />
                ))}
              </Document>
            ) : (
              <div className="text-center p-8 text-gray-500">
                <p className="font-medium mb-2">Preview not available</p>
                <p className="text-sm">
                  Only PDF preview is supported for now. Other file types will show placeholder.
                </p>
              </div>
            )}

            {/* Overlay layer reserved for fields */}
            <div className="pointer-events-none absolute inset-0" />
          </div>
        </div>

        {/* Right sidebar: recipients list */}
        <div className="col-span-12 lg:col-span-3">
          <div className="h-full rounded-2xl border border-gray-200 shadow-sm bg-white flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 font-medium text-sm text-gray-700">
              Recipients
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {recipients.length === 0 && (
                <div className="p-4 text-sm text-gray-500">No recipients added.</div>
              )}
              {recipients.map((r) => {
                const isActive = r.id === activeRecipientId;
                return (
                  <button
                    key={r.id}
                    onClick={() => setActiveRecipientId(r.id)}
                    className={[
                      "w-full text-left px-4 py-3 flex items-center gap-3 text-sm",
                      isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "hover:bg-gray-50 text-gray-700",
                    ].join(" ")}
                  >
                    <UserCircle className="w-5 h-5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="truncate">{r.name || "Unnamed"}</span>
                      <span className="text-xs text-gray-500">{r.role}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {activeRecipient && (
              <div className="p-3 text-xs text-gray-500 border-t border-gray-200">
                Active: <span className="font-medium text-gray-700">{activeRecipient.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
