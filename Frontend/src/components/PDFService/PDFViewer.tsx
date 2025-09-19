import React, { forwardRef, useRef, useEffect, useState, useCallback } from 'react';
import type { TextBlock } from '../../types/advancedPdfEditor';

// Type declarations for PDF.js
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface PDFViewerProps {
  fileName: string;
  currentPage: number;
  zoom: number;
  textBlocks: TextBlock[];
  selectedElement: TextBlock | null;
  onElementSelect: (element: TextBlock | null) => void;
  onAddEdit: (edit: any) => void;
  selectedTool: string;
}

const PDFViewer = forwardRef<any, PDFViewerProps>(({
  fileName,
  currentPage,
  zoom,
  textBlocks,
  selectedElement,
  onElementSelect,
  onAddEdit,
  selectedTool
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderTimeout, setRenderTimeout] = useState<NodeJS.Timeout | null>(null);
  const [textBlocksLoaded, setTextBlocksLoaded] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const onAddEditRef = useRef(onAddEdit);
  const debounceTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Keep the ref updated
  useEffect(() => {
    onAddEditRef.current = onAddEdit;
  }, [onAddEdit]);

  // Debounced function to handle text changes
  const debouncedTextChange = useCallback((textBlock: TextBlock, newText: string) => {
    const timeoutKey = textBlock.id;
    
    // Clear existing timeout for this text block
    const existingTimeout = debounceTimeouts.current.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      if (newText !== textBlock.text && newText.trim() !== '') {
        onAddEditRef.current({
          type: 'replaceText',
          pageNumber: textBlock.pageNumber,
          position: {
            x: textBlock.x,
            y: textBlock.y,
            width: textBlock.width,
            height: textBlock.height
          },
          oldText: textBlock.text,
          newText: newText,
          style: {
            fontSize: textBlock.fontSize,
            fontFamily: textBlock.fontFamily,
            color: textBlock.color
          }
        });
      }
      debounceTimeouts.current.delete(timeoutKey);
    }, 1000); // 1 second debounce
    
    debounceTimeouts.current.set(timeoutKey, timeout);
  }, []);

  // Load PDF.js
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Point to the worker file in your public folder
        if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          console.log("PDF.js worker set to local file: /pdf.worker.min.mjs");
        }
      } catch (err) {
        console.warn("Failed to set PDF.js worker:", err);
      }
    }
  }, []);

  // Load PDF.js dynamically
  const loadPDFJS = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && !window.pdfjsLib) {
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker path to local file
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          console.log("PDF.js worker set to local file: /pdf.worker.min.mjs");
        } catch (error) {
          console.warn("Failed to set PDF.js worker:", error);
          pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        }
        
        // Assign to window
        window.pdfjsLib = pdfjsLib;
      }
      
      return window.pdfjsLib;
    } catch (error) {
      console.error('Error loading PDF.js:', error);
      throw error;
    }
  }, []);

  // Load PDF document
  useEffect(() => {
    if (!fileName) return;

    const loadPDF = async () => {
      setIsLoading(true);
      setError(null);
      setTextBlocksLoaded(false);

      try {
        const pdfjsLib = await loadPDFJS();
        if (!pdfjsLib) {
          throw new Error('PDF.js not available');
        }

        // Load the PDF file directly from the backend
        const response = await fetch(`/api/pdf-service/advanced-editor/file/${fileName}`);
        
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          
          // Check first few bytes
          const uint8Array = new Uint8Array(arrayBuffer.slice(0, 4));
          const header = String.fromCharCode(...uint8Array);
          
          if (!header.startsWith('%PDF')) {
            console.error('Invalid PDF header received:', header);
            throw new Error('Invalid PDF format received from server');
          }
          
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          setPdfDocument(pdf);
          
        } else {
          const errorText = await response.text();
          console.error('Server error:', errorText);
          throw new Error(`PDF file not found: ${response.status} ${response.statusText}`);
        }
        
      } catch (error: any) {
        console.error('PDF loading error:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [fileName, loadPDFJS]);

  // Reset text blocks loaded when page changes
  useEffect(() => {
    setTextBlocksLoaded(false);
  }, [currentPage]);

  // Extract text blocks separately
  useEffect(() => {
    if (!fileName || !pdfDocument || textBlocksLoaded) return;

    const extractTextBlocks = async () => {
      try {
        const textResponse = await fetch(`/api/pdf-service/advanced-editor/extract-text-blocks/${fileName}/${currentPage}`);
        if (textResponse.ok) {
          const textData = await textResponse.json();
          console.log('Text extraction result:', textData);
          if (textData.success && textData.data && textData.data.textBlocks) {
            console.log(`Found ${textData.data.textBlocks.length} text blocks`);
            // Update text blocks in parent component
            onAddEditRef.current({
              type: 'updateTextBlocks',
              textBlocks: textData.data.textBlocks
            });
            setTextBlocksLoaded(true);
          } else {
            console.log('No text blocks found or extraction failed');
            setTextBlocksLoaded(true);
          }
        } else {
          console.error('Text extraction failed:', textResponse.status, textResponse.statusText);
          setTextBlocksLoaded(true);
        }
      } catch (textError) {
        console.warn('Failed to extract text blocks:', textError);
        setTextBlocksLoaded(true);
      }
    };

    extractTextBlocks();
  }, [fileName, currentPage, pdfDocument, textBlocksLoaded]);

  // Render PDF page
  const renderPage = useCallback(async () => {
    if (!pdfDocument || !canvasRef.current || isRendering) return;

    setIsRendering(true);
    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      // Get the current page (convert to 0-based index)
      const page = await pdfDocument.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoom });

      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Clear the canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      // Cancel any existing render task only if it's still running
      if ((canvas as any)._renderTask) {
        try {
          (canvas as any)._renderTask.cancel();
        } catch (cancelError) {
          // Ignore cancellation errors
        }
        (canvas as any)._renderTask = null;
      }

      // Create new render task
      const renderTask = page.render(renderContext);
      (canvas as any)._renderTask = renderTask;

      await renderTask.promise;
      
      // Clear the render task reference
      (canvas as any)._renderTask = null;
    } catch (error: any) {
      // Don't set error for cancellation exceptions
      if (error.name === 'RenderingCancelledException') {
        console.log('Rendering was cancelled, this is normal');
        return;
      }
      console.error('Error rendering PDF page:', error);
      setError('Failed to render PDF page');
    } finally {
      setIsRendering(false);
    }
  }, [pdfDocument, currentPage, zoom, isRendering]);

  // Render page when dependencies change (with debouncing)
  useEffect(() => {
    // Clear any existing timeout
    if (renderTimeout) {
      clearTimeout(renderTimeout);
    }

    // Set a new timeout to debounce rapid changes
    const timeout = setTimeout(() => {
      renderPage();
    }, 200);

    setRenderTimeout(timeout);

      // Cleanup timeout on unmount or dependency change
      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }, [renderPage]);

    // Cleanup debounce timeouts on unmount
    useEffect(() => {
      return () => {
        debounceTimeouts.current.forEach((timeout) => {
          clearTimeout(timeout);
        });
        debounceTimeouts.current.clear();
      };
    }, []);

  // Cleanup render tasks and timeouts on unmount
  useEffect(() => {
    return () => {
      if (canvasRef.current && (canvasRef.current as any)._renderTask) {
        (canvasRef.current as any)._renderTask.cancel();
      }
      if (renderTimeout) {
        clearTimeout(renderTimeout);
      }
    };
  }, [renderTimeout]);

  // Handle text block click
  const handleTextBlockClick = (textBlock: TextBlock) => {
    if (selectedTool === 'select' || selectedTool === 'text') {
      onElementSelect(textBlock);
    }
  };

  // Handle canvas click for adding new elements
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'select') {
      onElementSelect(null);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    // Add new element based on selected tool
    switch (selectedTool) {
      case 'text':
        onAddEdit({
          type: 'addText',
          pageNumber: currentPage,
          position: { x, y, width: 100, height: 20 },
          text: 'New Text',
          style: { fontSize: 12, fontFamily: 'helv', color: '#000000' }
        });
        break;
      case 'pen':
        // Start drawing path
        onAddEdit({
          type: 'addShape',
          pageNumber: currentPage,
          position: { x, y, width: 50, height: 50 },
          shapeType: 'pen',
          points: [{ x, y }],
          style: { strokeWidth: 2, color: '#000000' }
        });
        break;
      case 'shape':
        // Add rectangle shape
        onAddEdit({
          type: 'addShape',
          pageNumber: currentPage,
          position: { x, y, width: 100, height: 50 },
          shapeType: 'rectangle',
          style: { strokeWidth: 2, color: '#000000' }
        });
        break;
      case 'image':
        // Trigger image upload
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              onAddEdit({
                type: 'addImage',
                pageNumber: currentPage,
                position: { x, y, width: 100, height: 100 },
                imageData: e.target?.result as string
              });
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        break;
      case 'highlight':
        // Add highlight
        onAddEdit({
          type: 'highlight',
          pageNumber: currentPage,
          position: { x, y, width: 100, height: 20 },
          style: { color: '#ffff00' }
        });
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-auto bg-gray-100">
     
     
      
      <div className="flex justify-center p-4">
        <div className="relative">
          {/* PDF Canvas */}
          <canvas
            ref={canvasRef}
            className="shadow-lg bg-white cursor-pointer"
            onClick={handleCanvasClick}
            style={{ 
              maxWidth: '100%', 
              height: 'auto',
              cursor: selectedTool === 'select' ? 'default' : 'crosshair'
            }}
          />

          {/* Text Block Background Covers - Hide original text */}
          {textBlocks.map((textBlock) => (
            <div
              key={`bg-${textBlock.id}`}
              className="absolute"
              style={{
                left: textBlock.x * zoom,
                top: textBlock.y * zoom,
                width: Math.max(textBlock.width * zoom, 50),
                height: Math.max(textBlock.height * zoom, 20),
                backgroundColor: 'white',
                zIndex: 5
              }}
            />
          ))}

          {/* Editable Text Overlays */}
          {textBlocks.map((textBlock) => (
            <div
              key={textBlock.id}
              className={`absolute transition-all duration-200 ${
                selectedElement?.id === textBlock.id
                  ? 'border-2 border-blue-500'
                  : 'border border-transparent hover:border-blue-300 hover:bg-blue-50'
              }`}
              style={{
                left: textBlock.x * zoom,
                top: textBlock.y * zoom,
                width: Math.max(textBlock.width * zoom, 50),
                height: Math.max(textBlock.height * zoom, 20),
                fontSize: textBlock.fontSize * zoom,
                fontFamily: textBlock.fontFamily,
                color: textBlock.color,
                cursor: 'text',
                display: 'flex',
                alignItems: 'center',
                padding: '1px',
                minWidth: '50px',
                minHeight: '20px',
                backgroundColor: selectedElement?.id === textBlock.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                borderRadius: '2px',
                zIndex: 10
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleTextBlockClick(textBlock);
              }}
              contentEditable
              suppressContentEditableWarning={true}
              onInput={(e) => {
                const newText = e.currentTarget.textContent || '';
                debouncedTextChange(textBlock, newText);
              }}
              onBlur={(e) => {
                const newText = e.currentTarget.textContent || '';
                
                // Clear any pending debounced changes for this text block
                const timeoutKey = textBlock.id;
                const existingTimeout = debounceTimeouts.current.get(timeoutKey);
                if (existingTimeout) {
                  clearTimeout(existingTimeout);
                  debounceTimeouts.current.delete(timeoutKey);
                }
                
                // Save immediately on blur if text has changed
                if (newText !== textBlock.text && newText.trim() !== '') {
                  onAddEdit({
                    type: 'replaceText',
                    pageNumber: textBlock.pageNumber,
                    position: {
                      x: textBlock.x,
                      y: textBlock.y,
                      width: textBlock.width,
                      height: textBlock.height
                    },
                    oldText: textBlock.text,
                    newText: newText,
                    style: {
                      fontSize: textBlock.fontSize,
                      fontFamily: textBlock.fontFamily,
                      color: textBlock.color
                    }
                  });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
            >
              {textBlock.text}
            </div>
          ))}

          {/* Selection Indicator with Resize Handles */}
          {selectedElement && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-50"
              style={{
                left: selectedElement.x * zoom,
                top: selectedElement.y * zoom,
                width: selectedElement.width * zoom,
                height: selectedElement.height * zoom,
                pointerEvents: 'none'
              }}
            >
              <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                {selectedElement.text.substring(0, 20)}...
              </div>
              
              {/* Resize handles */}
              <div
                className="absolute w-2 h-2 bg-blue-500 border border-white cursor-nw-resize"
                style={{ top: -4, left: -4, pointerEvents: 'auto' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  // Handle resize from top-left
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startWidth = selectedElement.width;
                  const startHeight = selectedElement.height;
                  const startLeft = selectedElement.x;
                  const startTop = selectedElement.y;
                  
                  const handleMouseMove = (e: MouseEvent) => {
                    const deltaX = (e.clientX - startX) / zoom;
                    const deltaY = (e.clientY - startY) / zoom;
                    
                    onAddEdit({
                      type: 'replaceText',
                      pageNumber: selectedElement.pageNumber,
                      position: {
                        x: startLeft + deltaX,
                        y: startTop + deltaY,
                        width: startWidth - deltaX,
                        height: startHeight - deltaY
                      },
                      oldText: selectedElement.text,
                      newText: selectedElement.text,
                      style: {
                        fontSize: selectedElement.fontSize,
                        fontFamily: selectedElement.fontFamily,
                        color: selectedElement.color
                      }
                    });
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
              
              <div
                className="absolute w-2 h-2 bg-blue-500 border border-white cursor-se-resize"
                style={{ bottom: -4, right: -4, pointerEvents: 'auto' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  // Handle resize from bottom-right
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startWidth = selectedElement.width;
                  const startHeight = selectedElement.height;
                  
                  const handleMouseMove = (e: MouseEvent) => {
                    const deltaX = (e.clientX - startX) / zoom;
                    const deltaY = (e.clientY - startY) / zoom;
                    
                    onAddEdit({
                      type: 'replaceText',
                      pageNumber: selectedElement.pageNumber,
                      position: {
                        x: selectedElement.x,
                        y: selectedElement.y,
                        width: startWidth + deltaX,
                        height: startHeight + deltaY
                      },
                      oldText: selectedElement.text,
                      newText: selectedElement.text,
                      style: {
                        fontSize: selectedElement.fontSize,
                        fontFamily: selectedElement.fontFamily,
                        color: selectedElement.color
                      }
                    });
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

PDFViewer.displayName = 'PDFViewer';

export { PDFViewer };
