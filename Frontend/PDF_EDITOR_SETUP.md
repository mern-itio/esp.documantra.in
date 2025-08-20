# PDF Editor Setup Guide

## Overview
This document explains the setup of the PDF Editor component and how to resolve common CORS issues with PDF.js.

## Component Location
- **File**: `Frontend/src/pages/PDFTools/PDFEditorAdvanced.tsx`
- **Route**: `/pdf-tools/pdf-editor`

## Features Implemented
- PDF upload and rendering
- Text editing and addition
- Image upload and manipulation
- Drag and drop functionality
- Undo/Redo support
- Zoom controls
- Dark/Light mode toggle
- Properties panel for selected elements

## CORS Issue Resolution

### Problem
The PDF Editor was experiencing CORS errors when trying to load the PDF.js worker from external CDNs:
```
Access to script at 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/...' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

### Solution
1. **Install the exact pdfjs-dist version that react-pdf expects**:
   ```bash
   npm install pdfjs-dist@5.3.93
   ```
   **Important**: The version must match exactly. Check `npm list react-pdf` to see which version it expects.

2. **Copy worker file to public folder**:
   ```bash
   copy "node_modules\pdfjs-dist\build\pdf.worker.min.mjs" "public\pdf.worker.min.mjs"
   ```

3. **Update worker configuration** in the component:
   ```typescript
   // Use the local worker file from public folder to avoid CORS issues
   pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
   ```

### Why This Works
- Files in the `public` folder are served directly by the development server
- No CORS restrictions when loading from the same origin
- More reliable than external CDNs
- Faster loading times

## Dependencies
- `react-pdf`: PDF rendering and manipulation
- `lucide-react`: Icons
- `pdfjs-dist`: PDF.js core library (installed locally)

## Usage
1. Navigate to `/pdf-tools/pdf-editor`
2. Upload a PDF file using the "Upload PDF" button
3. Use the left sidebar tools to edit the PDF:
   - **Select**: Click and drag elements
   - **Edit Text**: Double-click existing text to edit
   - **Add Text**: Click anywhere to add new text
   - **Add Image**: Upload and place images
   - **Highlight**: Highlight text (placeholder)
4. Use the right sidebar to modify properties of selected elements
5. Use the top toolbar for zoom, undo/redo, and download

## Future Enhancements
- Implement actual PDF modification and saving
- Add highlighting functionality
- Implement page thumbnails
- Add more text formatting options
- Support for multiple pages editing

## Troubleshooting

### Version Mismatch Error
If you see this error:
```
Warning: UnknownErrorException: The API version "5.3.93" does not match the Worker version "5.4.54"
```

**Solution**: Install the exact version that `react-pdf` expects:
```bash
npm install pdfjs-dist@5.3.93
```

### PDF Not Loading
- Check browser console for CORS errors
- Verify `pdf.worker.min.mjs` exists in `public` folder
- Ensure `pdfjs-dist` package is installed with the correct version

### Performance Issues
- The component uses a local PDF.js worker for better performance
- Large PDFs may take time to render
- Consider implementing lazy loading for multi-page PDFs

### Browser Compatibility
- Requires modern browsers with ES6+ support
- PDF.js worker requires Web Workers support
- Tested on Chrome, Firefox, Safari, and Edge
