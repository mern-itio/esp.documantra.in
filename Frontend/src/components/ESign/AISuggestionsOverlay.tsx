import React, { useState, useMemo } from 'react';
import { Check, X, Sparkles, Info, Eye, EyeOff } from 'lucide-react';

export interface AISuggestion {
  type: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
  reason?: string;
  context?: string;
  documentId?: string;
}

interface AISuggestionsOverlayProps {
  suggestions: AISuggestion[];
  currentPage: number;
  pageWidth: number; // Actual rendered width of the page
  pageHeight: number; // Actual rendered height of the page
  pdfWidth: number; // Original PDF width in points
  pdfHeight: number; // Original PDF height in points
  onAcceptSuggestion: (suggestion: AISuggestion) => void;
  onRejectSuggestion: (suggestion: AISuggestion) => void;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  showOverlay?: boolean;
  onToggleOverlay?: () => void;
}

export const AISuggestionsOverlay: React.FC<AISuggestionsOverlayProps> = ({
  suggestions,
  currentPage,
  pageWidth,
  pageHeight,
  pdfWidth,
  pdfHeight,
  onAcceptSuggestion,
  onRejectSuggestion,
  onAcceptAll,
  onRejectAll,
  showOverlay = true,
  onToggleOverlay
}) => {
  const [hoveredSuggestion, setHoveredSuggestion] = useState<AISuggestion | null>(null);

  // Filter suggestions for current page
  const pageSuggestions = useMemo(() => {
    return suggestions.filter(s => s.page === currentPage);
  }, [suggestions, currentPage]);

  // Convert PDF coordinates to screen coordinates
  const convertToScreenCoords = (pdfX: number, pdfY: number) => {
    const scaleX = pageWidth / pdfWidth;
    const scaleY = pageHeight / pdfHeight;
    return {
      x: pdfX * scaleX,
      y: pdfY * scaleY
    };
  };

  // Get field type color
  const getFieldTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      signature: 'bg-blue-500',
      date: 'bg-green-500',
      name: 'bg-purple-500',
      email: 'bg-orange-500',
      text: 'bg-gray-500',
      initial: 'bg-pink-500',
      company: 'bg-indigo-500',
      title: 'bg-teal-500',
      phone: 'bg-yellow-500'
    };
    return colors[type] || 'bg-blue-500';
  };

  // Get field type label
  const getFieldTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get confidence color
  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-600';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-orange-600';
  };

  if (!showOverlay || pageSuggestions.length === 0) {
    return null;
  }

  return (
    <>
      {/* Suggestions Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {pageSuggestions.map((suggestion, index) => {
          const screenCoords = convertToScreenCoords(suggestion.x, suggestion.y);
          const screenWidth = (suggestion.width / pdfWidth) * pageWidth;
          const screenHeight = (suggestion.height / pdfHeight) * pageHeight;
          const isHovered = hoveredSuggestion === suggestion;

          return (
            <div
              key={`${suggestion.page}-${suggestion.x}-${suggestion.y}-${index}`}
              className="absolute pointer-events-auto transition-all duration-200"
              style={{
                left: `${screenCoords.x}px`,
                top: `${screenCoords.y}px`,
                width: `${screenWidth}px`,
                height: `${screenHeight}px`,
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                zIndex: isHovered ? 20 : 10
              }}
              onMouseEnter={() => setHoveredSuggestion(suggestion)}
              onMouseLeave={() => setHoveredSuggestion(null)}
            >
              {/* Suggestion Box */}
              <div
                className={`relative w-full h-full border-2 rounded-lg shadow-lg transition-all ${
                  isHovered
                    ? 'border-indigo-500 bg-indigo-100/80'
                    : 'border-indigo-400 bg-indigo-50/60'
                }`}
              >
                {/* Field Type Badge */}
                <div
                  className={`absolute -top-3 left-2 px-2 py-0.5 rounded-full text-xs font-semibold text-white ${getFieldTypeColor(
                    suggestion.type
                  )} shadow-md`}
                >
                  {getFieldTypeLabel(suggestion.type)}
                </div>

                {/* Confidence Badge */}
                {suggestion.confidence && (
                  <div
                    className={`absolute -top-3 right-2 px-2 py-0.5 rounded-full text-xs font-medium bg-white border border-gray-300 ${getConfidenceColor(
                      suggestion.confidence
                    )}`}
                  >
                    {(suggestion.confidence * 100).toFixed(0)}%
                  </div>
                )}

                {/* Action Buttons - Show on hover */}
                {isHovered && (
                  <div className="absolute -right-2 -top-2 flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcceptSuggestion(suggestion);
                      }}
                      className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                      title="Accept suggestion"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRejectSuggestion(suggestion);
                      }}
                      className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                      title="Reject suggestion"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Info Icon - Show reason on click */}
                {suggestion.reason && (
                  <div className="absolute bottom-1 right-1">
                    <div className="group relative">
                      <Info className="w-3 h-3 text-indigo-600 cursor-help" />
                      <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                        <div className="font-semibold mb-1">Reason:</div>
                        <div>{suggestion.reason}</div>
                        {suggestion.context && (
                          <>
                            <div className="font-semibold mt-2 mb-1">Context:</div>
                            <div className="text-gray-300">{suggestion.context}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggestions Summary Panel */}
      {pageSuggestions.length > 0 && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-xl border-2 border-indigo-300 p-4 z-30 pointer-events-auto max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h4 className="font-semibold text-gray-900">
                AI Suggestions ({pageSuggestions.length})
              </h4>
            </div>
            {onToggleOverlay && (
              <button
                onClick={onToggleOverlay}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Toggle overlay"
              >
                {showOverlay ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
            {pageSuggestions.map((suggestion, index) => (
              <div
                key={`summary-${index}`}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${getFieldTypeColor(suggestion.type)}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {getFieldTypeLabel(suggestion.type)}
                    </div>
                    {suggestion.reason && (
                      <div className="text-xs text-gray-500 truncate">{suggestion.reason}</div>
                    )}
                  </div>
                  {suggestion.confidence && (
                    <div className={`text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                      {(suggestion.confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => onAcceptSuggestion(suggestion)}
                    className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded flex items-center justify-center transition-colors"
                    title="Accept"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onRejectSuggestion(suggestion)}
                    className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center transition-colors"
                    title="Reject"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {(onAcceptAll || onRejectAll) && (
            <div className="flex gap-2 pt-3 border-t border-gray-200">
              {onAcceptAll && (
                <button
                  onClick={onAcceptAll}
                  className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Accept All
                </button>
              )}
              {onRejectAll && (
                <button
                  onClick={onRejectAll}
                  className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Dismiss All
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

