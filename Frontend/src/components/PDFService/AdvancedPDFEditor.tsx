import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  Upload,
  Download,
  Undo,
  Redo,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '../DocumentService/ui/button';
import { Card } from '../DocumentService/ui/card';
import { advancedPdfEditorService, type TextBlock, type PdfInfo } from '../../services/advancedPdfEditorService';
import type { EditOperation } from '../../types/advancedPdfEditor';
import { PDFViewer } from './PDFViewer';
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
      let textBlocks = response.data.textBlocks;
      
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
          return { ...block, text: edit.newText };
        }
        return block;
      });
      
      // Add any new text blocks for this page
      const newTextBlocks = editorState.edits.filter(
        edit => edit.type === 'addText' && edit.pageNumber === pageNumber
      ).map(edit => ({
        id: edit.textBlockId || `new-text-${Date.now()}`,
        text: edit.text,
        pageNumber: edit.pageNumber,
        x: edit.position.x,
        y: edit.position.y,
        width: edit.position.width,
        height: edit.position.height,
        fontSize: edit.style.fontSize,
        fontFamily: edit.style.fontFamily,
        color: edit.style.color,
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
      window.open(downloadUrl);
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
