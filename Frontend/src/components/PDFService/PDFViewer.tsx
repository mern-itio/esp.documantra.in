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
  selectedShape?: string;
  shapes?: any[];
  selectedShapeElement?: any;
  onShapeSelect?: (shape: any) => void;
  edits?: any[];
  isEditingText?: boolean;
  highlightColor?: string;
}

const PDFViewer = forwardRef<any, PDFViewerProps>(({
  fileName,
  currentPage,
  zoom,
  textBlocks,
  selectedElement,
  onElementSelect,
  onAddEdit,
  selectedTool,
  selectedShape,
  shapes = [],
  selectedShapeElement,
  onShapeSelect,
  edits = [],
  isEditingText = false,
  highlightColor
},ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Text selection state for highlighting
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionRange, setSelectionRange] = useState<{startX: number, startY: number, endX: number, endY: number} | null>(null);
  
  // Image state
  const [images, setImages] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [sentImageEdits, setSentImageEdits] = useState<Set<string>>(new Set());
  
  // Pen drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawingPoints, setCurrentDrawingPoints] = useState<{x: number, y: number}[]>([]);
  const [renderTimeout, setRenderTimeout] = useState<NodeJS.Timeout | null>(null);
  const [textBlocksLoaded, setTextBlocksLoaded] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const onAddEditRef = useRef(onAddEdit);
  const debounceTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const textBoxRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const createdAddTextOperations = useRef<Set<string>>(new Set());

  /**
 * Merge original text blocks with pending edits for display
 * Applies replaceText edits to existing blocks and includes addText blocks
 * This ensures the preview shows all changes in real-time before saving
 */
  const getDisplayTextBlocks = useCallback(() => {
  let displayBlocks = [...textBlocks];
  
  // Apply replaceText edits for current page
  edits
    .filter(edit => edit.type === 'replaceText' && edit.pageNumber === currentPage)
    .forEach(edit => {
      displayBlocks = displayBlocks.map(block => {
        // Match by position
        if (Math.abs(edit.position.x - block.x) < 5 &&
            Math.abs(edit.position.y - block.y) < 5) {
          return { ...block, text: edit.newText };
        }
        return block;
      });
    });
  
  // Add new text blocks for current page
  const newTextBlocks = edits
    .filter(edit => edit.type === 'addText' && edit.pageNumber === currentPage)
    .map(edit => ({
      id: edit.textBlockId || `new-text-${Date.now()}`,
      text: edit.text,
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
  
  return [...displayBlocks, ...newTextBlocks];
  }, [textBlocks, edits, currentPage]);

  // Keep the ref updated
  useEffect(() => {
    onAddEditRef.current = onAddEdit;
  }, [onAddEdit]);

  // Handle pending image edits when tool changes
  useEffect(() => {
    if (selectedImage && !sentImageEdits.has(selectedImage.id)) {
      handleImageFinalize(selectedImage.id);
    }
  }, [selectedTool]);


  // Add text selection listeners - only when highlight tool is active
  useEffect(() => {
    const handleSelectionChange = () => {
    // Only handle selection when highlight tool is selected
    if (selectedTool === 'highlight') {
      handleTextSelection();
    }
  };

    const handleClickOutside = (event: MouseEvent) => {
  // Clear selection if clicking outside while in highlight mode
  if (selectedTool === 'highlight' && selectedText) {
    const target = event.target as Element;
    if (!target.closest('canvas')) {
      setSelectedText('');
      setSelectionRange(null);
      window.getSelection()?.removeAllRanges();
    }
  }
};

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [zoom,selectedTool,selectedText]);

  // Apply highlight with selected color (called from parent)
  const applyHighlight = useCallback((color: string) => {
  // Check if a color is actually selected
  if (!color) {
    return;
  }
  if (selectedText && selectionRange) {
    onAddEdit({
      type: 'highlight',
      pageNumber: currentPage,
      position: {
        x: selectionRange.startX,
        y: selectionRange.startY,
        width: selectionRange.endX - selectionRange.startX,
        height: selectionRange.endY - selectionRange.startY
      },
      style: { color, opacity: 0.3 },
      content: selectedText
    });
    
    // Clear selection after highlighting
    setSelectedText('');
    setSelectionRange(null);
    window.getSelection()?.removeAllRanges();
  }
}, [selectedText, selectionRange, currentPage, onAddEdit]);


// Auto-apply highlight when text is selected and color is already chosen
useEffect(() => {
  // Only auto-highlight when:
  // 1. Highlight tool is active
  // 2. A color is selected
  // 3. Text is selected
  if (selectedTool === 'highlight' && highlightColor && selectedText && selectionRange) {
    // Small delay to ensure selection is stable
    const timer = setTimeout(() => {
      applyHighlight(highlightColor);
    }, 100);
    
    return () => clearTimeout(timer);
  }
}, [selectedText, selectionRange, selectedTool, highlightColor, applyHighlight]);

// Expose methods to parent component
// This hook allows the parent component to call the applyHighlight method
// directly on the PDFViewer component instance via a ref.
// The parent can trigger highlighting programmatically (e.g., when a color
// button is clicked) without needing to pass the action through props.
React.useImperativeHandle(ref, () => ({
  applyHighlight
}));

  // Handle image tool selection - open file browser immediately
  useEffect(() => {
    if (selectedTool === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            // Get center position of canvas for image placement
            const canvas = canvasRef.current;
            if (canvas) {
              const rect = canvas.getBoundingClientRect();
              const centerX = rect.width / 2 / zoom;
              const centerY = rect.height / 2 / zoom;
              
              handleImageAdd(
                e.target?.result as string,
                { x: centerX - 50, y: centerY - 50, width: 100, height: 100 }
              );
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  }, [selectedTool, zoom]);

  // Handle immediate editing when a text box is selected
  useEffect(() => {
    if (selectedElement && textBoxRefs.current.has(selectedElement.id)) {
      const textBox = textBoxRefs.current.get(selectedElement.id);
      if (textBox) {
        // Set text content if empty
        if (!textBox.textContent || textBox.textContent.trim() === '') {
          textBox.textContent = selectedElement.text;
        }
        
        // Focus and select text for immediate editing
        setTimeout(() => {
          textBox.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(textBox);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }, 50);
      }
    }
  }, [selectedElement]);

  // Cleanup: Clear text selection state when switching away from highlight tool
  useEffect(() => {
    if (selectedTool !== 'highlight') {
      setSelectedText('');
      setSelectionRange(null);
      window.getSelection()?.removeAllRanges();
    }
  }, [selectedTool]);

  // Handle shape resizing
  const handleResize = (e: React.MouseEvent, direction: string, shape: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosition = { ...(shape.position || { x: 0, y: 0, width: 50, height: 50 }) };
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - startX) / zoom;
      const deltaY = (e.clientY - startY) / zoom;
      
      let newPosition = { ...startPosition };
      
      switch (direction) {
        case 'nw':
          newPosition.x = startPosition.x + deltaX;
          newPosition.y = startPosition.y + deltaY;
          newPosition.width = Math.max(10, startPosition.width - deltaX);
          newPosition.height = Math.max(10, startPosition.height - deltaY);
          break;
        case 'ne':
          newPosition.y = startPosition.y + deltaY;
          newPosition.width = Math.max(10, startPosition.width + deltaX);
          newPosition.height = Math.max(10, startPosition.height - deltaY);
          break;
        case 'se':
          newPosition.width = Math.max(10, startPosition.width + deltaX);
          newPosition.height = Math.max(10, startPosition.height + deltaY);
          break;
        case 'sw':
          newPosition.x = startPosition.x + deltaX;
          newPosition.width = Math.max(10, startPosition.width - deltaX);
          newPosition.height = Math.max(10, startPosition.height + deltaY);
          break;
        case 'n':
          newPosition.y = startPosition.y + deltaY;
          newPosition.height = Math.max(10, startPosition.height - deltaY);
          break;
        case 's':
          newPosition.height = Math.max(10, startPosition.height + deltaY);
          break;
        case 'w':
          newPosition.x = startPosition.x + deltaX;
          newPosition.width = Math.max(10, startPosition.width - deltaX);
          break;
        case 'e':
          newPosition.width = Math.max(10, startPosition.width + deltaX);
          break;
      }
      
      // Update shape position
      const updatedShape = {
        ...shape,
        position: newPosition
      };
      
      // Update the shapes array
      onAddEdit({
        type: 'updateShapes',
        shapes: shapes.map(s => s.id === shape.id ? updatedShape : s)
      });
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

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
        // For new text blocks, don't create any save operations during typing
        if (textBlock.id.startsWith('new-text-')) {
          console.log('Debounced text change for new text block:', textBlock.id);
        } else {
          // For existing text blocks, use replaceText
          const validX = Math.max(0, Math.round(textBlock.x));
          const validY = Math.max(0, Math.round(textBlock.y));
          const validWidth = Math.max(10, Math.round(textBlock.width));
          const validHeight = Math.max(10, Math.round(textBlock.height));
          
        onAddEditRef.current({
          type: 'replaceText',
          pageNumber: textBlock.pageNumber,
          position: {
              x: validX,
              y: validY,
              width: validWidth,
              height: validHeight
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
        const baseUrl = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
        const response = await fetch(`${baseUrl}/advanced-editor/file/${fileName}`);
        
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
        const baseUrl = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104';
        const textResponse = await fetch(`${baseUrl}/advanced-editor/extract-text-blocks/${fileName}/${currentPage}`);
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

  // Handle global keydown events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === 'Escape') {
        // Clear shape selection when Enter or Escape is pressed
        if (onShapeSelect) {
          onShapeSelect(null);
        }
        // Also clear text element selection
        onElementSelect(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onShapeSelect, onElementSelect]);

  // Handle text selection - only when highlight tool is active
  const handleTextSelection = () => {
    // Only process selection if highlight tool is active
    if (selectedTool !== 'highlight') {
      return;
    }
  
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim();
      setSelectedText(selectedText);
      
      // Get selection coordinates
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const canvas = canvasRef.current;
      if (canvas) {
        const canvasRect = canvas.getBoundingClientRect();
        const startX = (rect.left - canvasRect.left) / zoom;
        const startY = (rect.top - canvasRect.top) / zoom;
        const endX = (rect.right - canvasRect.left) / zoom;
        const endY = (rect.bottom - canvasRect.top) / zoom;
        
        setSelectionRange({
          startX,
          startY,
          endX,
          endY
        });
        // DON'T show toolbar - user will click color button instead
      }
    } else {
      setSelectedText('');
      setSelectionRange(null);
    }
  };
  
  // Handle image operations
  const handleImageAdd = (imageData: string, position: {x: number, y: number, width: number, height: number}) => {
    const imageId = `image-${Date.now()}`;
    const newImage = {
      id: imageId,
      type: 'image',
      pageNumber: currentPage,
      position,
      imageData,
      style: { opacity: 1 }
    };
    
    setImages(prev => [...prev, newImage]);
    
    // Don't send edit immediately - wait for user interaction
    // Edit will be sent when user drags/resizes or clicks elsewhere
  };

  // Handle image selection
  const handleImageSelect = (image: any) => {
    setSelectedImage(image);
    // Clear other selections
    onElementSelect(null);
    if (onShapeSelect) {
      onShapeSelect(null);
    }
  };

  // Handle image updates (drag, resize)
  const handleImageUpdate = (imageId: string, updates: any) => {
    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, ...updates } : img
    ));
    
    // Don't send edit updates during drag/resize - only update local state
    // The final position will be sent when user stops interacting
  };

  // Send final image position to backend
  const handleImageFinalize = (imageId: string, finalPosition?: any) => {
    const image = images.find(img => img.id === imageId);
    if (image && !sentImageEdits.has(imageId)) {
      // Use finalPosition if provided, otherwise use current image position
      const position = finalPosition || image.position;
      
      onAddEdit({
        type: 'image',
        pageNumber: currentPage,
        position: position,
        content: image.imageData,
        imageId: imageId
      });
      // Mark this image edit as sent
      setSentImageEdits(prev => new Set([...prev, imageId]));
      // Clear image selection to remove blue border
      setSelectedImage(null);
    }
  };

  // Send final text position to backend
  const handleTextFinalize = (textBlockId: string) => {
    const textBlock = textBlocks.find(block => block.id === textBlockId);
    if (textBlock && textBlock.id.startsWith('new-text-') && createdAddTextOperations.current.has(textBlock.id)) {
      onAddEdit({
        type: 'updateAddTextPosition',
        textBlockId: textBlock.id,
        position: {
          x: textBlock.x,
          y: textBlock.y,
          width: textBlock.width,
          height: textBlock.height
        }
      });
    }
  };

  // Handle pen drawing start
  const handlePenStart = (x: number, y: number) => {
    setIsDrawing(true);
    setCurrentDrawingPoints([{ x, y }]);
  };

  // Handle pen drawing move
  const handlePenMove = (x: number, y: number) => {
    if (isDrawing) {
      setCurrentDrawingPoints(prev => [...prev, { x, y }]);
    }
  };

  // Handle pen drawing end
  const handlePenEnd = () => {
    if (isDrawing && currentDrawingPoints.length > 1) {
      // Create the pen drawing edit - no position needed for freehand paths
      onAddEdit({
        type: 'addShape',
        pageNumber: currentPage,
        shapeType: 'pen',
        points: currentDrawingPoints,
        style: { strokeWidth: 2, color: '#000000' }
      });
    }
    
    // Reset drawing state
    setIsDrawing(false);
    setCurrentDrawingPoints([]);
  };

  // Canvas mouse event handlers for pen drawing
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'pen') {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      
      handlePenStart(x, y);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'pen' && isDrawing) {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      
      handlePenMove(x, y);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'pen' && isDrawing) {
      e.preventDefault();
      handlePenEnd();
    }
  };

  // Handle image resize
  const handleImageResize = (e: React.MouseEvent, direction: string, image: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = image.position?.width || 100;
    const startHeight = image.position?.height || 100;
    const startLeft = image.position?.x || 0;
    const startTop = image.position?.y || 0;
    
    let finalPosition: {x: number, y: number, width: number, height: number} | null = null;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - startX) / zoom;
      const deltaY = (e.clientY - startY) / zoom;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startLeft;
      let newY = startTop;
      
      switch (direction) {
        case 'se': // Bottom-right
          newWidth = Math.max(20, startWidth + deltaX);
          newHeight = Math.max(20, startHeight + deltaY);
          break;
        case 'sw': // Bottom-left
          newWidth = Math.max(20, startWidth - deltaX);
          newHeight = Math.max(20, startHeight + deltaY);
          newX = startLeft + (startWidth - newWidth);
          break;
        case 'ne': // Top-right
          newWidth = Math.max(20, startWidth + deltaX);
          newHeight = Math.max(20, startHeight - deltaY);
          newY = startTop + (startHeight - newHeight);
          break;
        case 'nw': // Top-left
          newWidth = Math.max(20, startWidth - deltaX);
          newHeight = Math.max(20, startHeight - deltaY);
          newX = startLeft + (startWidth - newWidth);
          newY = startTop + (startHeight - newHeight);
          break;
      }
      
      // Store the final position
      finalPosition = {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      };
      
      handleImageUpdate(image.id, {
        position: finalPosition
      });
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Send final position to backend with the calculated position
      if (finalPosition) {
        handleImageFinalize(image.id, finalPosition);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle canvas click for adding new elements
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Don't handle clicks for pen tool - use mouse events instead
    if (selectedTool === 'pen') {
      return;
    }

    // Check if there's still selected text and show toolbar
    const selection = window.getSelection();
    if (selection && selection.toString().trim() && !showContextToolbar) {
      handleTextSelection();
      return;
    }

    if (selectedTool === 'select') {
      onElementSelect(null);
      // Also clear shape selection when clicking on canvas
      if (onShapeSelect) {
        onShapeSelect(null);
      }
      // Clear image selection and send any pending image edits
      if (selectedImage && !sentImageEdits.has(selectedImage.id)) {
        handleImageFinalize(selectedImage.id);
      }
      setSelectedImage(null);
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
        // Create a new text block with unique ID
        // Ensure coordinates are within valid bounds
        const textX = Math.max(0, x - 50); // Ensure x is not negative
        const textY = Math.max(0, y - 10); // Ensure y is not negative
        const textWidth = 100;
        const textHeight = 20;
        
        const newTextBlock: TextBlock = {
          id: `new-text-${Date.now()}`,
          text: 'New Text',
          pageNumber: currentPage,
          x: textX,
          y: textY,
          width: textWidth,
          height: textHeight,
          fontSize: 12,
          fontFamily: 'helv',
          color: '#000000',
          flags: 0
        };
        
        // Add the new text block to the existing text blocks
        onAddEdit({
          type: 'updateTextBlocks',
          textBlocks: [...textBlocks, newTextBlock],
          isNewTextBlock: true
        });
        
        // Don't create any save operations yet - wait until user finishes editing
        
        // Select the new text block for immediate editing
        onElementSelect(newTextBlock);
        
        // Switch to select tool immediately after creating text
        onAddEdit({
          type: 'switchTool',
          tool: 'select'
        });
        break;
      case 'pen':
        // Pen drawing is handled by mouse events, not clicks
        break;
      case 'shape':
        // Add shape based on selected shape type
        const shapeSize = 50; // Default size for shapes
        onAddEdit({
          type: 'addShape',
          pageNumber: currentPage,
          position: { x, y, width: shapeSize, height: shapeSize },
          shapeType: selectedShape || 'square',
          style: { strokeWidth: 2, color: '#000000' }
        });
        
        // Switch to select tool immediately after creating shape
        onAddEdit({
          type: 'switchTool',
          tool: 'select'
        });
        break;
      case 'image':
        // Image upload is now handled in useEffect when tool is selected
        break;
      case 'highlight':
        // Highlight tool now works through context toolbar
        // Just show a message to select text
        //alert('Select text to see highlight options');
        if (!selectedText) {
        alert('Please select text to highlight it');
        }
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
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            style={{ 
              maxWidth: '100%', 
              height: 'auto',
              cursor: selectedTool === 'select' ? 'default' : 
                      selectedTool === 'highlight' ? 'text' : 
                      selectedTool === 'pen' ? 'crosshair' : 'crosshair'
            }}
          />

          {/* Highlight Overlays */}
          {edits
            .filter(edit => edit.type === 'highlight' && edit.pageNumber === currentPage)
            .map((highlight, index) => (
              <div
                key={`highlight-${index}`}
                className="absolute pointer-events-none"
                style={{
                  left: (highlight.position?.x || 0) * zoom,
                  top: (highlight.position?.y || 0) * zoom,
                  width: (highlight.position?.width || 100) * zoom,
                  height: (highlight.position?.height || 20) * zoom,
                  backgroundColor: highlight.style?.color || '#ffff00',
                  opacity: highlight.style?.opacity || 0.3,
                  zIndex: 10,
                  pointerEvents: 'none'
                }}
              />
            ))}

          {/* Pen Drawing Overlays */}
          {edits
            .filter(edit => edit.type === 'addShape' && edit.shapeType === 'pen' && edit.pageNumber === currentPage)
            .map((penEdit, index) => (
              <svg
                key={`pen-${index}`}
                className="absolute pointer-events-none"
                style={{
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 12,
                  pointerEvents: 'none'
                }}
              >
                <path
                  d={penEdit.points && penEdit.points.length > 1 
                    ? `M ${penEdit.points[0].x * zoom} ${penEdit.points[0].y * zoom} ${penEdit.points.slice(1).map((p: {x: number, y: number}) => `L ${p.x * zoom} ${p.y * zoom}`).join(' ')}`
                    : ''
                  }
                  stroke={penEdit.style?.color || '#000000'}
                  strokeWidth={(penEdit.style?.strokeWidth || 2) * zoom}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ))}

          {/* Text Selection Overlay */}
          {selectedText && selectionRange && (
            <div
              className="absolute pointer-events-none border-2 border-blue-500 bg-blue-100 bg-opacity-30"
              style={{
                left: selectionRange.startX * zoom,
                top: selectionRange.startY * zoom,
                width: (selectionRange.endX - selectionRange.startX) * zoom,
                height: (selectionRange.endY - selectionRange.startY) * zoom,
                zIndex: 15,
                pointerEvents: 'none'
              }}
            />
          )}


          {/* Shape Overlays - Render before text blocks */}
          {(shapes || []).filter(shape => shape && shape.id).map((shape) => {
            const isSelected = selectedShapeElement && selectedShapeElement.id === shape.id;
            return (
              <div
                key={shape.id}
                className={`absolute border-2 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-400 bg-transparent'} cursor-move`}
                style={{
                  left: (shape.position?.x || 0) * zoom,
                  top: (shape.position?.y || 0) * zoom,
                  width: (shape.position?.width || 50) * zoom,
                  height: (shape.position?.height || 50) * zoom,
                  borderColor: isSelected ? '#3b82f6' : (shape.style?.color || '#000000'),
                  borderWidth: `${shape.style?.strokeWidth || 2}px`,
                  zIndex: isSelected ? 20 : 15,
                  pointerEvents: 'auto'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onShapeSelect) {
                    onShapeSelect(shape);
                  }
                }}
                onMouseDown={(e) => {
                  if (isSelected) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Start dragging
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startLeft = shape.position?.x || 0;
                    const startTop = shape.position?.y || 0;
                    
                    const handleMouseMove = (e: MouseEvent) => {
                      const deltaX = (e.clientX - startX) / zoom;
                      const deltaY = (e.clientY - startY) / zoom;
                      
                      const newX = startLeft + deltaX;
                      const newY = startTop + deltaY;
                      
                      // Update shape position
                      const updatedShape = {
                        ...shape,
                        position: {
                          ...(shape.position || { x: 0, y: 0, width: 50, height: 50 }),
                          x: newX,
                          y: newY
                        }
                      };
                      
                      // Update the shapes array
                      onAddEdit({
                        type: 'updateShapes',
                        shapes: shapes.map(s => s.id === shape.id ? updatedShape : s)
                      });
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }
                }}
              >
                {/* Shape content based on type */}
                {shape.type === 'square' && (
                  <div className="w-full h-full border-2 border-current" />
                )}
                {shape.type === 'rectangle' && (
                  <div className="w-full h-full border-2 border-current" />
                )}
                {shape.type === 'circle' && (
                  <div className="w-full h-full border-2 border-current rounded-full" />
                )}
                {shape.type === 'line' && (
                  <div className="w-full h-0.5 bg-current" style={{ marginTop: '50%' }} />
                )}
                
                {/* Resize handles for selected shapes */}
                {isSelected && (
                  <>
                    {/* Corner resize handles */}
                    <div
                      className="absolute w-2 h-2 bg-blue-500 border border-white cursor-nw-resize"
                      style={{ top: -4, left: -4 }}
                      onMouseDown={(e) => handleResize(e, 'nw', shape)}
                    />
                    <div
                      className="absolute w-2 h-2 bg-blue-500 border border-white cursor-ne-resize"
                      style={{ top: -4, right: -4 }}
                      onMouseDown={(e) => handleResize(e, 'ne', shape)}
                    />
                    <div
                      className="absolute w-2 h-2 bg-blue-500 border border-white cursor-se-resize"
                      style={{ bottom: -4, right: -4 }}
                      onMouseDown={(e) => handleResize(e, 'se', shape)}
                    />
                    <div
                      className="absolute w-2 h-2 bg-blue-500 border border-white cursor-sw-resize"
                      style={{ bottom: -4, left: -4 }}
                      onMouseDown={(e) => handleResize(e, 'sw', shape)}
                    />
                    
                    {/* Edge resize handles */}
                    <div
                      className="absolute w-2 h-2 bg-blue-500 border border-white cursor-n-resize"
                      style={{ top: -4, left: '50%', transform: 'translateX(-50%)' }}
                      onMouseDown={(e) => handleResize(e, 'n', shape)}
                    />
                    <div
                      className="absolute w-2 h-2 bg-blue-500 border border-white cursor-s-resize"
                      style={{ bottom: -4, left: '50%', transform: 'translateX(-50%)' }}
                      onMouseDown={(e) => handleResize(e, 's', shape)}
                    />
                    <div
                      className="absolute w-2 h-2 bg-blue-500 border border-white cursor-w-resize"
                      style={{ top: '50%', left: -4, transform: 'translateY(-50%)' }}
                      onMouseDown={(e) => handleResize(e, 'w', shape)}
                    />
                    <div
                      className="absolute w-2 h-2 bg-blue-500 border border-white cursor-e-resize"
                      style={{ top: '50%', right: -4, transform: 'translateY(-50%)' }}
                      onMouseDown={(e) => handleResize(e, 'e', shape)}
                    />
                  </>
                )}
              </div>
            );
          })}

          {/* Image Overlays */}
          {images
            .filter(image => image.pageNumber === currentPage)
            .map((image) => {
              const isSelected = selectedImage && selectedImage.id === image.id;
              return (
                <div
                  key={image.id}
                  className={`absolute ${isSelected ? 'border-2 border-blue-500' : 'border border-gray-300'} cursor-move`}
                  style={{
                    left: (image.position?.x || 0) * zoom,
                    top: (image.position?.y || 0) * zoom,
                    width: (image.position?.width || 100) * zoom,
                    height: (image.position?.height || 100) * zoom,
                    zIndex: isSelected ? 20 : 15,
                    pointerEvents: 'auto'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageSelect(image);
                  }}
                  onMouseDown={(e) => {
                    if (isSelected) {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Start dragging
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startLeft = image.position?.x || 0;
                      const startTop = image.position?.y || 0;
                      
                      let finalPosition: {x: number, y: number, width: number, height: number} | null = null;
                      
                      const handleMouseMove = (e: MouseEvent) => {
                        const deltaX = (e.clientX - startX) / zoom;
                        const deltaY = (e.clientY - startY) / zoom;
                        
                        const newX = startLeft + deltaX;
                        const newY = startTop + deltaY;
                        
                        // Store the final position
                        finalPosition = {
                          ...image.position,
                          x: newX,
                          y: newY
                        };
                        
                        handleImageUpdate(image.id, {
                          position: finalPosition
                        });
                      };
                      
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                        // Send final position to backend with the calculated position
                        if (finalPosition) {
                          handleImageFinalize(image.id, finalPosition);
                        }
                      };
                      
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }
                  }}
                >
                  <img
                    src={image.imageData}
                    alt="Uploaded"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  
                  {/* Resize handles for selected image */}
                  {isSelected && (
                    <>
                      {/* Corner resize handles */}
                      <div
                        className="absolute w-2 h-2 bg-blue-500 border border-white cursor-nw-resize"
                        style={{ top: -4, left: -4 }}
                        onMouseDown={(e) => handleImageResize(e, 'nw', image)}
                      />
                      <div
                        className="absolute w-2 h-2 bg-blue-500 border border-white cursor-ne-resize"
                        style={{ top: -4, right: -4 }}
                        onMouseDown={(e) => handleImageResize(e, 'ne', image)}
                      />
                      <div
                        className="absolute w-2 h-2 bg-blue-500 border border-white cursor-se-resize"
                        style={{ bottom: -4, right: -4 }}
                        onMouseDown={(e) => handleImageResize(e, 'se', image)}
                      />
                      <div
                        className="absolute w-2 h-2 bg-blue-500 border border-white cursor-sw-resize"
                        style={{ bottom: -4, left: -4 }}
                        onMouseDown={(e) => handleImageResize(e, 'sw', image)}
                      />
                    </>
                  )}
                </div>
              );
            })}

          {/* Pen Drawing Overlay - Real-time visual feedback */}
          {isDrawing && currentDrawingPoints.length > 0 && (
            <svg
              className="absolute pointer-events-none"
              style={{
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                zIndex: 30
              }}
            >
              <path
                d={`M ${currentDrawingPoints.map((point) => 
                  `${point.x * zoom} ${point.y * zoom}`
                ).join(' L ')}`}
                stroke="#000000"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {/* Text Block Background Covers - Hide original text */}
          {getDisplayTextBlocks().map((textBlock) => (
            <div
              key={`bg-${textBlock.id}`}
              className={`absolute transition-all duration-200 ${
              selectedElement?.id === textBlock.id
             ? 'border-2 border-blue-500'
             : isEditingText 
             ? 'border border-transparent hover:border-blue-300 hover:bg-blue-50'
             : 'border-none'
               }`}
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
          {getDisplayTextBlocks().map((textBlock) => (
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
                cursor: selectedElement?.id === textBlock.id ? 'move' : 'text',
                display: 'flex',
                alignItems: 'center',
                padding: '2px 4px',
                minWidth: '50px',
                minHeight: '20px',
                backgroundColor: selectedElement?.id === textBlock.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                borderRadius: '3px',
                zIndex: 25,
                boxShadow: selectedElement?.id === textBlock.id ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
              ref={(el) => {
                if (el) {
                  textBoxRefs.current.set(textBlock.id, el);
                  // Ensure the text content is set
                  if (!el.textContent || el.textContent.trim() === '') {
                    el.textContent = textBlock.text;
                  }
                } else {
                  textBoxRefs.current.delete(textBlock.id);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleTextBlockClick(textBlock);
              }}
              onMouseDown={(e) => {
                if (selectedElement?.id === textBlock.id) {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Start dragging
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startLeft = textBlock.x;
                  const startTop = textBlock.y;
                  
                  const handleMouseMove = (e: MouseEvent) => {
                    const deltaX = (e.clientX - startX) / zoom;
                    const deltaY = (e.clientY - startY) / zoom;
                    
                    const newX = startLeft + deltaX;
                    const newY = startTop + deltaY;
                    
                    // Update text block position
                    const updatedTextBlock = {
                      ...textBlock,
                      x: newX,
                      y: newY
                    };
                    
                    // Update the text blocks array
                    const updatedTextBlocks = textBlocks.map(block => 
                      block.id === textBlock.id ? updatedTextBlock : block
                    );
                    
                    // Only update the text blocks array, don't create new text entries
                    // Don't add to history or create save operations for drag
                    onAddEdit({
                      type: 'updateTextBlocks',
                      textBlocks: updatedTextBlocks,
                      isNewTextBlock: false,
                      isDragOperation: true
                    });
                    
                    // Don't send position updates during drag - only update local state
                    // Final position will be sent on mouse release
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                    // Send final position to backend
                    handleTextFinalize(textBlock.id);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }
              }}
              contentEditable={true}
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
                  // Validate coordinates before sending
                  const validX = Math.max(0, Math.round(textBlock.x));
                  const validY = Math.max(0, Math.round(textBlock.y));
                  const validWidth = Math.max(10, Math.round(textBlock.width));
                  const validHeight = Math.max(10, Math.round(textBlock.height));
                  
                  // For new text blocks, don't create any save operations during editing
                  if (textBlock.id.startsWith('new-text-')) {
                    // Just update the text block in the UI, no save operation
                    console.log('Text updated for new text block:', textBlock.id);
                  } else {
                    // For existing text blocks, use replaceText
                  onAddEdit({
                    type: 'replaceText',
                    pageNumber: textBlock.pageNumber,
                    position: {
                        x: validX,
                        y: validY,
                        width: validWidth,
                        height: validHeight
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
                }
                
                // For new text blocks, create the addText operation only once when finishing editing
                if (textBlock.id.startsWith('new-text-')) {
                  // Check if we've already created an addText operation for this text block
                  if (!createdAddTextOperations.current.has(textBlock.id)) {
                    // Validate coordinates before sending
                    const validX = Math.max(0, Math.round(textBlock.x));
                    const validY = Math.max(0, Math.round(textBlock.y));
                    const validWidth = Math.max(10, Math.round(textBlock.width));
                    const validHeight = Math.max(10, Math.round(textBlock.height));
                    
                    // Create the addText operation with final position and text
                    onAddEdit({
                      type: 'addText',
                      pageNumber: textBlock.pageNumber,
                      position: {
                        x: validX,
                        y: validY,
                        width: validWidth,
                        height: validHeight
                      },
                      text: newText,
                      style: {
                        fontSize: textBlock.fontSize,
                        fontFamily: textBlock.fontFamily,
                        color: textBlock.color
                      },
                      textBlockId: textBlock.id
                    });
                    
                    // Mark this text block as having an addText operation
                    createdAddTextOperations.current.add(textBlock.id);
                  } else {
                    console.log('AddText operation already exists for text block:', textBlock.id);
                  }
                }
                
                // Switch back to select tool after editing is complete
                if (selectedTool === 'text') {
                  onAddEdit({
                    type: 'switchTool',
                    tool: 'select'
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
                  const handleMouseMove = () => {
                    // Don't send resize updates during resize - only update local state
                    // Final position will be sent on mouse release
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                    // Send final position to backend
                    handleTextFinalize(selectedElement.id);
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
                  const handleMouseMove = () => {
                    // Don't send resize updates during resize - only update local state
                    // Final position will be sent on mouse release
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                    // Send final position to backend
                    handleTextFinalize(selectedElement.id);
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
