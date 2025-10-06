import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  Upload,
  Download,
  Undo,
  Redo,
  Eye,
  EyeOff,
  ArrowLeft,
  FileText,
  Edit3,
  Save,
  Settings
} from 'lucide-react';
import { Button } from '../DocumentService/ui/button';
import { Card } from '../DocumentService/ui/card';
import { useNavigate } from 'react-router-dom';
import { advancedPdfEditorService, type TextBlock, type PdfInfo } from '../../services/advancedPdfEditorService';
import type { EditOperation } from '../../types/advancedPdfEditor';
import { PDFViewer } from './PDFViewer';
import { Toolbar } from './Toolbar';
import { PageNavigator } from './PageNavigator';
import { ZoomControls } from './ZoomControls';
import { EditHistory } from './EditHistory';
import type { EditorState, EditorActions } from '../../types/advancedPdfEditor';
interface AdvancedPDFEditorProps {
  onBack?: () => void;
}
// Type declarations for PDF.js
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

const AdvancedPDFEditor: React.FC<AdvancedPDFEditorProps> = ({ onBack }) => {
  const navigate = useNavigate();
  
  // Detect navigation source and handle back navigation
  const handleBackNavigation = () => {
    // If onBack prop is provided, we're coming from sidebar
    if (onBack) {
      onBack();
      return;
    }
    
    // For header navigation, try to go back in history first
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to navigate to PDF tools if no history
      navigate('/pdf-tools');
    }
  };

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

  const [shapes, setShapes] = useState<any[]>([]);
  const [selectedShapeElement, setSelectedShapeElement] = useState<any>(null);

  const [selectedShape, setSelectedShape] = useState<string>('square');
  const [highlightColor, setHighlightColor] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTextBlocks, setShowTextBlocks] = useState(false);
  const [editHistory, setEditHistory] = useState<EditOperation[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadReady, setIsDownloadReady] = useState(false);
  const [downloadUrl, _setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string | null>(null);
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

        // Don't add drag operations to history or edits
        if (edit.isDragOperation) {
          return;
        }

        // Only add to history for undo/redo functionality if it's a new text block
        if (edit.isNewTextBlock) {
          const newHistory = editHistory.slice(0, historyIndex + 1);
          newHistory.push(edit);
          setEditHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
        }
        return;
      }


      // Handle updateAddTextPosition type
      if (edit.type === 'updateAddTextPosition') {
        // Update existing addText operation with new position
        setEditorState(prev => {
          const updatedEdits = prev.edits.map(existingEdit => {
            if (existingEdit.type === 'addText' && existingEdit.textBlockId === edit.textBlockId) {
              return {
                ...existingEdit,
                position: edit.position
              };
            }
            return existingEdit;
          });

          return { ...prev, edits: updatedEdits };
        });
        return;
      }

      // Handle switchTool type
      if (edit.type === 'switchTool') {
        setEditorState(prev => ({ ...prev, selectedTool: edit.tool as EditorState['selectedTool'] }));
        return;
      }

      // Handle addShape operations
      if (edit.type === 'addShape') {
        console.log('Adding shape:', edit.shapeType);

        // Don't add pen drawings to shapes array - they're handled differently
        if (edit.shapeType !== 'pen') {
          const shapeId = `shape-${Date.now()}`;
          const newShape = {
            id: shapeId,
            type: edit.shapeType,
            pageNumber: edit.pageNumber,
            position: edit.position,
            style: edit.style
          };
          setShapes(prev => [...prev, newShape]);

          // Add shapeId to the edit operation
          const editWithShapeId = {
            ...edit,
            shapeId: shapeId
          };

          setEditorState(prev => {
            const newEdits = [...prev.edits, editWithShapeId];
            // Add to history
            const newHistory = editHistory.slice(0, historyIndex + 1);
            newHistory.push(editWithShapeId);
            setEditHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
            return { ...prev, edits: newEdits };
          });
        } else {
          // For pen drawings, just add to edits without adding to shapes array
          setEditorState(prev => {
            const newEdits = [...prev.edits, edit];
            // Add to history
            const newHistory = editHistory.slice(0, historyIndex + 1);
            newHistory.push(edit);
            setEditHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
            return { ...prev, edits: newEdits };
          });
        }
        return;
      }

      // Handle updateShapes operations
      if (edit.type === 'updateShapes') {
        console.log('Updating shapes:', edit.shapes.length, 'shapes');
        setShapes(edit.shapes);

        // Also update the corresponding addShape operations in edits array
        setEditorState(prev => {
          const updatedEdits = prev.edits.map(existingEdit => {
            if (existingEdit.type === 'addShape' && existingEdit.shapeId) {
              // Find the corresponding shape in the updated shapes array
              const updatedShape = edit.shapes.find((shape: any) => shape.id === existingEdit.shapeId);

              if (updatedShape) {
                console.log('Updating edit for shape:', existingEdit.shapeId, 'new position:', updatedShape.position);
                return {
                  ...existingEdit,
                  position: updatedShape.position,
                  style: updatedShape.style
                };
              }
            }
            return existingEdit;
          });

          return { ...prev, edits: updatedEdits };
        });
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

  /**
 * Load text blocks for the current page and overlay pending edits
 * - Fetches original text layout from backend
 * - Applies replaceText edits to modified text blocks
 * - Adds new text blocks created by user
 * - Updates the preview to show changes before they're saved
 */
  const loadTextBlocks = useCallback(async (pageNumber: number) => {
  if (!editorState.fileName) return;

  try {
    const response = await advancedPdfEditorService.extractTextBlocks(editorState.fileName, pageNumber);
    if (response.success) {
      // Apply any pending text edits to the loaded blocks
      let textBlocks: TextBlock[] = (response.data.textBlocks as any[]).map((block: any): TextBlock => ({
        id: block.id,
        text: block.text ?? '',
        pageNumber: block.pageNumber,
        x: block.x,
        y: block.y,
        width: block.width,
        height: block.height,
        fontSize: block.fontSize ?? 12,
        fontFamily: block.fontFamily ?? 'Helvetica',
        color: block.color ?? '#000000',
        flags: block.flags ?? 0
      }));
      
      // Apply replaceText edits for this page
      const pageEdits = editorState.edits.filter(
        edit => edit.type === 'replaceText' && edit.pageNumber === pageNumber
      );
      
      textBlocks = textBlocks.map(block => {
        const edit = pageEdits.find(e => {
          // Match by position and old text
          return Math.abs(e.position.x - block.x) < 5 &&
                 Math.abs(e.position.y - block.y) < 5 &&
                 e.oldText === block.text;
        });
        

      if (edit) {
          return { ...block, text: edit.newText || '' }; 
        }
        return { ...block, text: block.text || '' };
      });
      
      // Add any new text blocks for this page
      const newTextBlocks = editorState.edits.filter(
        edit => edit.type === 'addText' && edit.pageNumber === pageNumber
      ).map(edit => ({
        id: edit.textBlockId || `new-text-${Date.now()}`,
        text: edit.text || '',
        pageNumber: edit.pageNumber,
        x: edit.position.x,
        y: edit.position.y,
        width: edit.position.width,
        height: edit.position.height,

        fontSize: edit.style?.fontSize || 12,
        fontFamily: edit.style?.fontFamily || 'helv',
        color: edit.style?.color || '#000000',

        flags: 0
      }));
      
      editorActions.setTextBlocks([...textBlocks, ...newTextBlocks]);
    }
  } catch (error) {
    console.error('Failed to load text blocks:', error);
    editorActions.setTextBlocks([]);
  }
  }, [editorState.fileName, editorState.edits, editorActions]);

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

      // Get the current state from history
      const currentEdit = editHistory[newIndex];

      if (currentEdit.type === 'updateTextBlocks') {
        setEditorState(prev => ({
          ...prev,
          textBlocks: currentEdit.textBlocks || []
        }));
      } else {
        setEditorState(prev => ({
          ...prev,
          edits: editHistory.slice(0, newIndex + 1)
        }));
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < editHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);

      // Get the current state from history
      const currentEdit = editHistory[newIndex];

      if (currentEdit.type === 'updateTextBlocks') {
        setEditorState(prev => ({
          ...prev,
          textBlocks: currentEdit.textBlocks || []
        }));
      } else {
        setEditorState(prev => ({
          ...prev,
          edits: editHistory.slice(0, newIndex + 1)
        }));
      }
    }
  };

  // Tool selection handlers
  const handleToolSelect = (tool: string) => {
    editorActions.setSelectedTool(tool as EditorState['selectedTool']);
  };

  // Shape selection handler
  const handleShapeSelect = (shape: string) => {
    setSelectedShape(shape);
  };

  // Shape element selection handler
  const handleShapeElementSelect = (shape: any) => {
    setSelectedShapeElement(shape);
  };

  // Shape color change handler
  const handleShapeColorChange = (color: string) => {
    if (selectedShapeElement) {
      // Update the shape's color in the shapes array
      const updatedShapes = shapes.map(shape =>
        shape.id === selectedShapeElement.id
          ? { ...shape, style: { ...shape.style, color } }
          : shape
      );
      setShapes(updatedShapes);

      // Update the corresponding addShape operation in edits array
      setEditorState(prev => {
        const updatedEdits = prev.edits.map(edit => {
          if (edit.type === 'addShape' && edit.shapeId === selectedShapeElement.id) {
            return {
              ...edit,
              style: { ...edit.style, color }
            };
          }
          return edit;
        });
        return { ...prev, edits: updatedEdits };
      });

      // Update the selected shape element
      setSelectedShapeElement({
        ...selectedShapeElement,
        style: { ...selectedShapeElement.style, color }
      });
    }
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
      console.log('Sending edits to backend:', editorState.edits);
      console.log('Number of edits:', editorState.edits.length);
      console.log('Edit types:', editorState.edits.map(edit => edit.type));

      const result = await advancedPdfEditorService.applyEdits(
        editorState.fileName,
        editorState.edits
      );

      if (result.success) {

        setDownloadFileName(result.data.fileName)
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
  const handleDownload = async () => {
    try {
      if (downloadFileName) {
        const blob = await advancedPdfEditorService.downloadPdf(downloadFileName);
        advancedPdfEditorService.createDownloadLink(blob, downloadFileName);
        return;
      }
      if (downloadUrl) {
        // Fallback: open URL if filename is unavailable
        window.open(downloadUrl);
      }
    } catch (e) {

      

      console.error('Download failed:', e);
    }
  };

  
  /**
  * Handle highlight color click
  * Handles immediate highlight application when user clicks a color button.
  * This enables the "Text First" workflow: user selects text → clicks color → highlights immediately.
  * Works in conjunction with the auto-highlight useEffect which handles the "Color First" workflow.
  */
  const handleHighlightApply = (color: string) => {
    // This will be called from Toolbar when user clicks a color
    // Pass it to PDFViewer through a ref or callback
    if (pdfViewerRef.current) {
      pdfViewerRef.current.applyHighlight(color);
  }};

  if (!editorState.pdfInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header with Back Button */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-4">
              <button
                onClick={handleBackNavigation}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Advanced PDF Editor</h1>
                <p className="text-sm text-gray-600">Professional PDF editing with advanced features</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Edit3 className="w-8 h-8 text-blue-600" />
              </div>

              <h6 className="text-xl font-bold text-gray-900 mb-4">Advanced PDF Editor</h6>
              <p className="text-sm text-gray-600 mb-8 max-w-2xl mx-auto">
                Upload a PDF file to start editing with our professional browser-based editor.
                Edit text, add annotations, and modify your documents with precision.
              </p>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <FileText className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 mb-1">Text Editing</h3>
                  <p className="text-sm text-gray-600">Edit and format text directly</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Settings className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 mb-1">Annotations</h3>
                  <p className="text-sm text-gray-600">Add highlights and comments</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Save className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 mb-1">Save & Download</h3>
                  <p className="text-sm text-gray-600">Export your edited PDF</p>
                </div>
              </div>

              {/* Upload Area */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-gray-400 transition-all duration-200 cursor-pointer group"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors">
                  <Upload className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Drop your PDF here or click to browse
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Maximum file size: 5MB • PDF files only
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 group-hover:bg-gray-200 transition-colors">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              {isLoading && (
                <div className="mt-8">
                  <div className="inline-flex items-center px-6 py-3 bg-blue-50 rounded-lg">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-blue-700 font-medium">Processing PDF...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleBackNavigation}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>

              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {editorState.pdfInfo.metadata.title || 'PDF Editor'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Page {editorState.currentPage} of {editorState.totalPages}
                  </p>
                </div>
              </div>

              {saveSuccess && (
                <div className="flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                  <Save className="w-4 h-4 mr-2" />
                  Edits saved successfully!
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="hover:bg-gray-50"
                >
                  <Undo className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRedo}
                  disabled={historyIndex >= editHistory.length - 1}
                  className="hover:bg-gray-50"
                >
                  <Redo className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTextBlocks(!showTextBlocks)}
                  className="hover:bg-gray-50"
                >
                  {showTextBlocks ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>

              <div className="h-6 w-px bg-gray-300"></div>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleSave}
                  disabled={editorState.edits.length === 0 || isSaving}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Edits
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={!isDownloadReady || !downloadFileName}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isDownloadReady ? 'Download PDF' : `Ready in ${countdown}s`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">

          {/* Toolbar */}
          <Toolbar
            selectedTool={editorState.selectedTool}
            onToolSelect={handleToolSelect}
            selectedShape={selectedShape}
            onShapeSelect={handleShapeSelect}
            selectedShapeElement={selectedShapeElement}
            onShapeColorChange={handleShapeColorChange}
            highlightColor={highlightColor}
            onHighlightColorChange={setHighlightColor}
            onHighlightApply={handleHighlightApply}
          />

          


          {/* Edit History */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Edit History</h3>
            <EditHistory
              edits={editorState.edits}
              onClear={editorActions.clearEdits}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* PDF Viewer Controls */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <PageNavigator
                  currentPage={editorState.currentPage}
                  totalPages={editorState.totalPages}
                  onPageChange={editorActions.setCurrentPage}
                />
              </div>

              <div className="flex items-center space-x-4">
                <ZoomControls
                  zoom={editorState.zoom}
                  onZoomChange={editorActions.setZoom}
                />
              </div>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-auto bg-gray-100">

            <PDFViewer
              ref={pdfViewerRef}
              fileName={editorState.fileName!}
              currentPage={editorState.currentPage}
              zoom={editorState.zoom}
              textBlocks={editorState.textBlocks}
              isEditingText={showTextBlocks}
              selectedElement={editorState.selectedElement}
              onElementSelect={editorActions.setSelectedElement}
              onAddEdit={editorActions.addEdit}
              selectedTool={editorState.selectedTool}
              selectedShape={selectedShape}
              shapes={shapes.filter(shape => shape.pageNumber === editorState.currentPage)}
              selectedShapeElement={selectedShapeElement}
              onShapeSelect={handleShapeElementSelect}
              edits={editorState.edits}
              highlightColor={highlightColor} 
            />

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedPDFEditor;
