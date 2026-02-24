import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  FileSignature,
  PenLine,
  Stamp,
  Calendar,
  User,
  Type,
  Building2,
  Briefcase,
  Hash,
  Check,
  Search,
  X,
  SaveAll,
} from "lucide-react";

// Static list of standard fields matching SigningEditorStep left panel (UI only)
export const STANDARD_FIELDS = [
  { type: "signature", label: "Signature", icon: FileSignature },
  { type: "initial", label: "Initial", icon: PenLine },
  { type: "stamp", label: "Stamp", icon: Stamp },
  { type: "date", label: "Date Signed", icon: Calendar },
  { type: "name", label: "Name", icon: User },
  { type: "email", label: "Email", icon: Type },
  { type: "company", label: "Company", icon: Building2 },
  { type: "title", label: "Title", icon: Briefcase },
  { type: "text", label: "Text", icon: Type },
  { type: "number", label: "Number", icon: Hash },
  { type: "checkbox", label: "Checkbox", icon: Check },
];

export type StandardFieldType = { type: string; label: string };

const ACTIVE_COLOR = "#2563eb";

type SignerEditorLayoutProps = {
  /** Center content (e.g. PDF viewer) */
  children: React.ReactNode;
  /** Document name for right panel */
  documentName?: string;
  /** Total pages for right panel */
  totalPages?: number;
  /** Current page (for highlighting thumbnail) */
  currentPage?: number;
  /** Thumbnail URLs or placeholder; index 0 = page 1 */
  thumbnailUrls?: (string | null)[];
  /** Called when a page thumbnail is clicked */
  onPageSelect?: (pageNum: number) => void;
  /** Show/hide right preview panel */
  showRightPanel?: boolean;
  /** Optional top bar (e.g. recipient switcher) - if not provided, minimal bar is shown */
  topBar?: React.ReactNode;
  /** When provided, standard fields become draggable; called when drag starts */
  onFieldDragStart?: (field: StandardFieldType) => void;
  /** Called when drag ends (drop or cancel) */
  onFieldDragEnd?: () => void;
};

export function SignerEditorLayout({
  children,
  documentName = "Document",
  totalPages = 1,
  currentPage = 1,
  thumbnailUrls = [],
  onPageSelect,
  showRightPanel = true,
  onFieldDragStart,
  onFieldDragEnd,
}: SignerEditorLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const isDraggable = Boolean(onFieldDragStart && onFieldDragEnd);
  const emptyDragImageRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isDraggable) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    emptyDragImageRef.current = canvas;
    return () => { emptyDragImageRef.current = null; };
  }, [isDraggable]);

  const filteredFields = STANDARD_FIELDS.filter((field) =>
    field.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="h-screen min-h-0 flex flex-col overflow-hidden bg-gray-100"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
    

      {/* Main three panels */}
      <div className="flex-1 flex overflow-hidden bg-gray-100">
        {/* Left panel - Standard fields (static) */}
        <div className="w-[300px] bg-white border-r border-gray-200 flex flex-shrink-0 h-full flex flex-col">
          <div className="border-b border-gray-200 flex-shrink-0">
            <div className="relative px-1.5 py-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Fields"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ fontSize: "14px", color: "#6b7280" }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-3">
              <h3
                className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide"
                style={{
                  fontSize: "12px",
                  color: "#374151",
                  fontWeight: "600",
                }}
              >
                Standard fields
              </h3>
              <div className="space-y-1">
                {filteredFields.map((field, index) => {
                  const Icon = field.icon;
                  const showSeparatorAfter =
                    (field.type === "date" && filteredFields[index + 1]) ||
                    (field.type === "title" && filteredFields[index + 1]);
                  return (
                    <React.Fragment key={field.type}>
                      <div
                        role={isDraggable ? "button" : undefined}
                        draggable={isDraggable}
                        onDragStart={
                          isDraggable
                            ? (e) => {
                                onFieldDragStart?.({ type: field.type, label: field.label });
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("text/plain", field.type);
                                const dragImage = emptyDragImageRef.current;
                                if (dragImage) e.dataTransfer.setDragImage(dragImage, 0, 0);
                              }
                            : undefined
                        }
                        onDragEnd={isDraggable ? onFieldDragEnd : undefined}
                        className={`w-full flex items-center gap-3 px-2 py-2 rounded text-left transition-colors ${
                          isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                        }`}
                        style={{ backgroundColor: "transparent" }}
                      >
                        <div
                          className="w-5 h-5 flex items-center justify-center border rounded flex-shrink-0"
                          style={{
                            backgroundColor: "rgba(37, 99, 235, 0.1)",
                            borderColor: ACTIVE_COLOR,
                            borderWidth: "2px",
                            color: ACTIVE_COLOR,
                          }}
                        >
                          <Icon
                            className="w-3.5 h-3.5"
                            style={{ color: ACTIVE_COLOR }}
                          />
                        </div>
                        <span
                          className="text-sm text-gray-800"
                          style={{ fontSize: "11px", color: "#301934" }}
                        >
                          {field.label}
                        </span>
                      </div>
                      {showSeparatorAfter && (
                        <div className="my-1 border-t border-gray-200" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Center - PDF / main content */}
        <div className="flex-1 overflow-auto bg-gray-100 h-full min-w-0">
          {children}
        </div>

        {/* Right panel - Preview (thumbnails) */}
        {showRightPanel && (
          <div className="w-[220px] bg-white border-l border-gray-200 flex flex-col flex-shrink-0 h-full min-h-0">
            <div className="px-3 pt-3 pb-2 border-b border-gray-200 flex-shrink-0">
              <p
                className="text-sm font-medium text-gray-800 truncate"
                style={{
                  fontSize: "13px",
                  color: "#301934",
                  fontWeight: "500",
                }}
              >
                {documentName.slice(0, 22)}
              </p>
              <p
                className="text-[11px] text-gray-500"
                style={{ color: "#6b7280" }}
              >
                Pages: {totalPages}
              </p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-3">
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNum = index + 1;
                const isCurrentPage = pageNum === currentPage;
                const thumbUrl = thumbnailUrls[index];

                return (
                  <div key={pageNum} className="mb-3">
                    <div
                      role="button"
                      tabIndex={0}
                      className={`overflow-hidden cursor-pointer transition-all rounded ${
                        isCurrentPage ? "ring-2 ring-blue-300" : ""
                      }`}
                      onClick={() => onPageSelect?.(pageNum)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onPageSelect?.(pageNum);
                        }
                      }}
                    >
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={`Page ${pageNum} thumbnail`}
                          className="block w-full bg-white"
                          style={{ border: "1px solid #e5e7eb" }}
                        />
                      ) : (
                        <div
                          className="w-full h-24 bg-white border border-gray-200 flex items-center justify-center rounded"
                          style={{ minHeight: "96px" }}
                        >
                          <span className="text-[11px] text-gray-400">
                            Page {pageNum}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center mt-1 px-1">
                      <p className="text-[11px] text-gray-600">{pageNum}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SignerEditorLayout;
