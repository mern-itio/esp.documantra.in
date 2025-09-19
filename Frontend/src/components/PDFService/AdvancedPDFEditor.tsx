import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  Upload,
  Download,
  Undo,
  Redo,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../DocumentService/ui/button';
import { Card } from '../DocumentService/ui/card';
import { advancedPdfEditorService, type TextBlock, type PdfInfo } from '../../services/advancedPdfEditorService';
import type { EditOperation } from '../../types/advancedPdfEditor';
import { PDFViewer } from './PDFViewer';
import { TextEditor } from './TextEditor';
import { DrawingTool } from './DrawingTool';
import { ImageUploader } from './ImageUploader';
import { HighlightTool } from './HighlightTool';
import { Toolbar } from './Toolbar';
import { PageNavigator } from './PageNavigator';
import { ZoomControls } from './ZoomControls';
import { EditHistory } from './EditHistory';
import type { EditorState, EditorActions } from '../../types/advancedPdfEditor';

// Type declarations for PDF.js
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

const AdvancedPDFEditor: React.FC = () => {
  // State management
  const [editorState, setEditorState] = useState<EditorState>({
    currentPage: 1,
    totalPages: 0,
    zoom: 1,
    selectedTool: 'select',
    selectedElement: null,
    isEditing: false,
    edits: [],
    textBlocks: [],
    pdfInfo: null,
    fileName: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTextBlocks, setShowTextBlocks] = useState(false);
  const [editHistory, setEditHistory] = useState<EditOperation[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadReady, setIsDownloadReady] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfViewerRef = useRef<any>(null);

  // Editor actions
  const editorActions: EditorActions = useMemo(() => ({
    setCurrentPage: (page: number) => {
      setEditorState(prev => ({ ...prev, currentPage: page }));
      loadTextBlocks(page);
    },
    setZoom: (zoom: number) => {
      setEditorState(prev => ({ ...prev, zoom: Math.max(0.5, Math.min(3, zoom)) }));
    },
    setSelectedTool: (tool: EditorState['selectedTool']) => {
      setEditorState(prev => ({ ...prev, selectedTool: tool, selectedElement: null }));
    },
    setSelectedElement: (element: TextBlock | null) => {
      setEditorState(prev => ({ ...prev, selectedElement: element }));
    },
    setIsEditing: (editing: boolean) => {
      setEditorState(prev => ({ ...prev, isEditing: editing }));
    },
    addEdit: (edit: EditOperation | any) => {
      // Handle special updateTextBlocks type
      if (edit.type === 'updateTextBlocks') {
        console.log('Updating text blocks:', edit.textBlocks.length, 'blocks');
        setEditorState(prev => ({ ...prev, textBlocks: edit.textBlocks }));
        return;
      }

      // Handle text replacement edits
      if (edit.type === 'replaceText') {
        console.log('Text edit:', edit.oldText, '->', edit.newText);
        setEditorState(prev => {
          const newEdits = [...prev.edits, edit];
          // Add to history
          const newHistory = editHistory.slice(0, historyIndex + 1);
          newHistory.push(edit);
          setEditHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
          return { ...prev, edits: newEdits };
        });
        return;
      }

      setEditorState(prev => {
        const newEdits = [...prev.edits, edit];
        // Add to history
        const newHistory = editHistory.slice(0, historyIndex + 1);
        newHistory.push(edit);
        setEditHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        return { ...prev, edits: newEdits };
      });
    },
    clearEdits: () => {
      setEditorState(prev => ({ ...prev, edits: [] }));
      setEditHistory([]);
      setHistoryIndex(-1);
    },
    setTextBlocks: (blocks: TextBlock[]) => {
      setEditorState(prev => ({ ...prev, textBlocks: blocks }));
    },
    setPdfInfo: (info: PdfInfo | null) => {
      setEditorState(prev => ({ ...prev, pdfInfo: info, totalPages: info?.pageCount || 0 }));
    },
    setFileName: (name: string | null) => {
      setEditorState(prev => ({ ...prev, fileName: name }));
    }
  }), [editHistory, historyIndex]);

  // Load text blocks for current page
  const loadTextBlocks = useCallback(async (pageNumber: number) => {
    if (!editorState.fileName) return;

    try {
      const response = await advancedPdfEditorService.extractTextBlocks(editorState.fileName, pageNumber);
      if (response.success) {
        editorActions.setTextBlocks(response.data.textBlocks);
      }
    } catch (error) {
      console.error('Failed to load text blocks:', error);
      // Clear text blocks if extraction fails
      editorActions.setTextBlocks([]);
    }
  }, [editorState.fileName]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await advancedPdfEditorService.uploadPdf(file);
      if (response.success) {
        editorActions.setPdfInfo(response.data);
        editorActions.setFileName(response.data.fileName);
        editorActions.setCurrentPage(1);
        await loadTextBlocks(1);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle drag and drop
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      const fakeEvent = {
        target: { files: [file] }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(fakeEvent);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);


  // Undo/Redo functionality
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setEditorState(prev => ({
        ...prev,
        edits: editHistory.slice(0, newIndex + 1)
      }));
    }
  };

  const handleRedo = () => {
    if (historyIndex < editHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setEditorState(prev => ({
        ...prev,
        edits: editHistory.slice(0, newIndex + 1)
      }));
    }
  };

  // Tool selection handlers
  const handleToolSelect = (tool: string) => {
    editorActions.setSelectedTool(tool as EditorState['selectedTool']);
  };

  // Save function
  const handleSave = async () => {
    if (!editorState.fileName || editorState.edits.length === 0) {
      setError('No edits to save');
      return;
    }

    setIsSaving(true);
    setError(null);
    setIsDownloadReady(false);

    try {
      const result = await advancedPdfEditorService.applyEdits(
        editorState.fileName,
        editorState.edits
      );

      if (result.success) {
        setDownloadUrl(result.data.downloadUrl);
        setSaveSuccess(true);

        // Start countdown
        setCountdown(7);
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              setIsDownloadReady(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Clear edits after successful save
        editorActions.clearEdits();

        // Hide success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        setError('Failed to save edits');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      setError(error.message || 'Failed to save edits');
    } finally {
      setIsSaving(false);
    }
  };

  // Download function
  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  // Render tool content
  const renderToolContent = () => {
    switch (editorState.selectedTool) {
      case 'text':
        return (
          <TextEditor
            currentPage={editorState.currentPage}
            onAddEdit={editorActions.addEdit}
            selectedElement={editorState.selectedElement}
            onElementSelect={editorActions.setSelectedElement}
          />
        );
      case 'pen':
      case 'shape':
        return (
          <DrawingTool
            currentPage={editorState.currentPage}
            tool={editorState.selectedTool}
            onAddEdit={editorActions.addEdit}
          />
        );
      case 'image':
        return (
          <ImageUploader
            currentPage={editorState.currentPage}
            onAddEdit={editorActions.addEdit}
          />
        );
      case 'highlight':
        return (
          <HighlightTool
            currentPage={editorState.currentPage}
            onAddEdit={editorActions.addEdit}
          />
        );
      default:
        return null;
    }
  };

  if (!editorState.pdfInfo) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 w-full mx-4">
          <div className="text-center">
            <Upload className="w-10 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-2">PDF Editor</h2>
            <p className="text-gray-600 mb-6">
              Upload a PDF file to start editing with our advanced browser-based editor
            </p>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">Features:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Click and drag text blocks to move them</li>
                <li>• Double-click text to edit inline</li>
                <li>• Use resize handles to adjust text size</li>
                <li>• Add new text, images, and shapes</li>
                <li>• Highlight and annotate content</li>
              </ul>
            </div>

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                Drop your PDF here or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Maximum file size: 5MB
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />

            {isLoading && (
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Processing PDF...</p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">
              {editorState.pdfInfo.metadata.title || 'PDF Editor'}
            </h1>
            <span className="text-sm text-gray-500">
              {editorState.currentPage} of {editorState.totalPages} pages
            </span>
            {saveSuccess && (
              <span className="text-sm text-green-600 font-medium">
                ✓ Edits saved successfully!
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= editHistory.length - 1}
            >
              <Redo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTextBlocks(!showTextBlocks)}
            >
              {showTextBlocks ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              onClick={handleSave}
              disabled={editorState.edits.length === 0 || isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Save Edits
                </>
              )}
            </Button>
            <Button
              onClick={handleDownload}
              disabled={!isDownloadReady || !downloadUrl}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloadReady ? 'Download PDF' : `Download Ready in ${countdown}s`}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Text Blocks Toggle */}
          <div className="p-4 border-b border-gray-200">
            <Button
              variant={showTextBlocks ? "default" : "outline"}
              size="sm"
              onClick={() => setShowTextBlocks(!showTextBlocks)}
              className="w-full"
              style={{ cursor: showTextBlocks ? "not-allowed" : "pointer" }}
            >
              {showTextBlocks ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2 text-gray-500" />
                  Editing...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Edit Text
                </>
              )}
            </Button>

          </div>

          {/* Toolbar */}
          <Toolbar
            selectedTool={editorState.selectedTool}
            onToolSelect={handleToolSelect}
          />

          {/* Tool Content */}
          <div className="flex-1 p-4">
            {renderToolContent()}
          </div>

          {/* Edit History */}
          <div className="border-t border-gray-200 p-4">
            <EditHistory
              edits={editorState.edits}
              onClear={editorActions.clearEdits}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* PDF Viewer Controls */}
          <div className="bg-white border-b border-gray-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <PageNavigator
                currentPage={editorState.currentPage}
                totalPages={editorState.totalPages}
                onPageChange={editorActions.setCurrentPage}
              />

              <ZoomControls
                zoom={editorState.zoom}
                onZoomChange={editorActions.setZoom}
              />
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-auto bg-gray-100">
            <PDFViewer
              ref={pdfViewerRef}
              fileName={editorState.fileName!}
              currentPage={editorState.currentPage}
              zoom={editorState.zoom}
              textBlocks={showTextBlocks ? editorState.textBlocks : []}
              selectedElement={editorState.selectedElement}
              onElementSelect={editorActions.setSelectedElement}
              onAddEdit={editorActions.addEdit}
              selectedTool={editorState.selectedTool}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedPDFEditor;
