import React, { useState, useRef, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { aiAssistantApiService } from '../../services/aiAssistantService';
import type { SignatureField } from './SigningEditorStep';
import type { Recipient } from '../../types';
import toast from 'react-hot-toast';

interface AICoPilotProps {
  recipients: Recipient[];
  signatureFields: SignatureField[];
  documents: Array<{ id: string; name: string; pages?: number; url?: string; file?: File }>;
  currentPage: number;
  mode?: 'normal' | 'power';
  onFieldsAdded: (fields: SignatureField[]) => void;
  onRecipientsUpdated?: (recipients: Recipient[]) => void;
  onAnalyzePDF?: (documentId: string) => Promise<void>;
  onDismissWarnings?: () => void;
  onSuggestionsReceived?: (suggestions: any[], documentId: string) => void;
}

export const AICoPilot: React.FC<AICoPilotProps> = ({
  recipients,
  signatureFields,
  documents,
  mode = 'normal',
  onDismissWarnings,
  onSuggestionsReceived
}) => {
  const [constraints, setConstraints] = useState<any>(null);
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());
  const analyzedDocumentsRef = useRef<Set<string>>(new Set());
  const previousDocumentsLength = useRef<number>(0);

  // Auto-check constraints when fields or recipients change
  useEffect(() => {
    if (signatureFields.length > 0 || recipients.length > 0) {
      checkConstraints();
    }
  }, [signatureFields.length, recipients.length, recipients, signatureFields]);

  // Auto-analyze PDFs when documents are available (on mount or when documents change)
  useEffect(() => {
    if (documents.length > 0) {
      // Check each document and analyze if not already analyzed
      documents.forEach((document) => {
        if (!analyzedDocumentsRef.current.has(document.id)) {
          // Check if document has file or URL
          if (document.file && document.file.type === 'application/pdf') {
            autoAnalyzePDF(document);
          } else if (document.url) {
            // Document loaded from backend, fetch and analyze
            autoAnalyzePDF(document);
          }
        }
      });
    }
    previousDocumentsLength.current = documents.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents]); // Trigger when documents array changes or component mounts

  const checkConstraints = async () => {
    try {
      const context = {
        recipients,
        signatureFields,
        documents,
        mode,
        signingOrder: 'sequential' // You can get this from props if needed
      };

      const response = await aiAssistantApiService.checkConstraints(context);

      // The service already returns response.data, so we access it directly
      if (response && response.success) {
        setConstraints(response);
      } else if (response && response.error) {
        console.error('Constraint check error:', response.error);
      }
    } catch (error: any) {
      console.error('Error checking constraints:', error);
      // Don't show toast for constraint errors, just log them
    }
  };

  // Auto-analyze PDF when document is added
  const autoAnalyzePDF = async (document: { id: string; name: string; url?: string; file?: File }) => {
    if (!document.file && !document.url) return;
    
    // Skip if already analyzed
    if (analyzedDocumentsRef.current.has(document.id)) return;

    try {
      let file: File | null = null;

      if (document.file) {
        file = document.file;
      } else if (document.url) {
        // Fetch the PDF from URL
        const response = await fetch(document.url);
        const blob = await response.blob();
        file = new File([blob], document.name || 'document.pdf', { type: 'application/pdf' });
      }

      if (file) {
        console.log('Analyzing PDF:', document.name, document.id);
        const result = await aiAssistantApiService.analyzePDFForSuggestions(file);
        console.log('PDF analysis result:', result);
        
        if (result && result.success) {
          // Mark document as analyzed
          analyzedDocumentsRef.current.add(document.id);
          
          // Pass suggestions to parent component
          // Backend returns suggestions directly in result, not in result.data
          const suggestions = result.suggestions || result.data?.suggestions || [];
          console.log('Suggestions found:', suggestions.length, suggestions);
          
          if (suggestions.length > 0) {
            if (onSuggestionsReceived) {
              console.log('Calling onSuggestionsReceived with:', suggestions, document.id);
              onSuggestionsReceived(suggestions, document.id);
            } else {
              console.warn('onSuggestionsReceived callback not provided');
            }
            toast.success(`AI found ${suggestions.length} field suggestion(s)`, {
              duration: 5000,
              icon: '✨'
            });
          } else {
            console.log('No suggestions found in result');
          }
        } else {
          console.warn('PDF analysis failed or returned no data:', result);
        }
      }
    } catch (error: any) {
      console.error('Error auto-analyzing PDF:', error);
      // Silently fail - don't show error toast for auto-analysis
    }
  };

  // Show floating error banner if there are violations or non-dismissed warnings
  const hasErrors = constraints && (
    (constraints.violations && constraints.violations.length > 0) ||
    (constraints.warnings && constraints.warnings.some((w: any) => 
      !dismissedWarnings.has(w.type + '_' + (w.recipientId || w.fieldId || w.page || ''))
    ))
  );

  const handleDismissWarning = (warning: any) => {
    const key = warning.type + '_' + (warning.recipientId || warning.fieldId || warning.page || '');
    setDismissedWarnings(prev => new Set([...prev, key]));
    if (onDismissWarnings) {
      onDismissWarnings();
    }
  };

  const handleDismissAllWarnings = () => {
    if (constraints && constraints.warnings) {
      const allKeys = constraints.warnings.map((w: any) => 
        w.type + '_' + (w.recipientId || w.fieldId || w.page || '')
      );
      setDismissedWarnings(prev => new Set([...prev, ...allKeys]));
      if (onDismissWarnings) {
        onDismissWarnings();
      }
    }
  };

  return (
    <>
      {/* Floating Error Banner - Always visible when there are errors */}
      {hasErrors && (
        <div className="fixed top-4 right-4 z-50 w-96 bg-white rounded-lg shadow-2xl border-2 border-red-300 transition-all duration-300">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <h4 className="font-semibold text-gray-900">Configuration Issues</h4>
              </div>
              <button
                onClick={() => {
                  // Dismiss the banner by dismissing all warnings
                  if (constraints && constraints.violations && constraints.violations.length === 0) {
                    handleDismissAllWarnings();
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {constraints && constraints.violations && constraints.violations.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-red-600 mb-2">
                  Errors ({constraints.violations.length})
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {constraints.violations.slice(0, 3).map((v: any, idx: number) => (
                    <div key={idx} className="text-xs text-red-700 flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{v.message}</span>
                    </div>
                  ))}
                  {constraints.violations.length > 3 && (
                    <p className="text-xs text-red-600 italic">
                      +{constraints.violations.length - 3} more error(s)
                    </p>
                  )}
                </div>
              </div>
            )}

            {constraints && constraints.warnings && constraints.warnings.filter((w: any) => 
              !dismissedWarnings.has(w.type + '_' + (w.recipientId || w.fieldId || w.page || ''))
            ).length > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-amber-600">
                    Warnings ({constraints.warnings.filter((w: any) => 
                      !dismissedWarnings.has(w.type + '_' + (w.recipientId || w.fieldId || w.page || ''))
                    ).length})
                  </p>
                  <button
                    onClick={handleDismissAllWarnings}
                    className="text-xs text-amber-700 hover:text-amber-900 underline"
                  >
                    Dismiss All
                  </button>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {constraints.warnings.filter((w: any) => 
                    !dismissedWarnings.has(w.type + '_' + (w.recipientId || w.fieldId || w.page || ''))
                  ).slice(0, 2).map((w: any, idx: number) => (
                    <div key={idx} className="text-xs text-amber-700 flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="flex-1">{w.message}</span>
                      <button
                        onClick={() => handleDismissWarning(w)}
                        className="text-amber-600 hover:text-amber-800 text-xs underline ml-2"
                      >
                        Dismiss
                      </button>
                    </div>
                  ))}
                  {constraints.warnings.filter((w: any) => 
                    !dismissedWarnings.has(w.type + '_' + (w.recipientId || w.fieldId || w.page || ''))
                  ).length > 2 && (
                    <p className="text-xs text-amber-600 italic">
                      +{constraints.warnings.filter((w: any) => 
                        !dismissedWarnings.has(w.type + '_' + (w.recipientId || w.fieldId || w.page || ''))
                      ).length - 2} more warning(s)
                    </p>
                  )}
                </div>
              </div>
            )}

            {constraints && constraints.violations && constraints.violations.length === 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDismissAllWarnings}
                  className="flex-1 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 text-sm font-medium"
                >
                  Proceed Anyway
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

