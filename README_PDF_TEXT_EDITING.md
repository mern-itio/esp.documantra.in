# PDF Text Editing Feature

This feature allows users to upload PDFs, edit text content, and download the modified PDFs. It includes both backend API services and frontend integration.

## Features

- **PDF Upload**: Upload PDF files through the frontend interface
- **Text Extraction**: Automatically extract text content and positioning from PDFs
- **Text Editing**: Edit individual text blocks with real-time preview
- **PDF Generation**: Generate new PDFs with edited text content
- **Download**: Download the modified PDF files
- **Undo/Redo**: History management for text edits
- **Multi-page Support**: Support for multi-page PDFs

## Backend Setup

### Prerequisites

The backend service requires the following dependencies (already included in `package.json`):
- `pdf-lib`: For PDF manipulation and generation
- `pdfjs-dist`: For text extraction from PDFs
- `multer`: For file upload handling
- `fs-extra`: For file system operations

### API Endpoints

#### 1. Extract Text from PDF
```
POST /pdf-text-edit/extract-text
Content-Type: multipart/form-data

Body: FormData with 'pdf' field containing the PDF file
```

**Response:**
```json
{
  "success": true,
  "textBlocks": [
    {
      "id": "text_1_1",
      "pageNumber": 1,
      "x": 100,
      "y": 150,
      "width": 200,
      "height": 30,
      "originalText": "Sample text",
      "editedText": "Sample text",
      "fontSize": 12,
      "fontFamily": "Helvetica"
    }
  ],
  "originalFileName": "document.pdf",
  "message": "Text extracted successfully"
}
```

#### 2. Edit PDF Text
```
POST /pdf-text-edit/edit-text
Content-Type: application/json

Body: {
  "textEdits": [
    {
      "id": "text_1_1",
      "pageNumber": 1,
      "editedText": "Modified text"
    }
  ],
  "originalFileName": "document.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "editedFileName": "edited_1234567890.pdf",
  "message": "PDF edited successfully"
}
```

#### 3. Download Edited PDF
```
GET /pdf-text-edit/download/:fileName
```

**Response:** PDF file download

### File Structure

```
Backend/services/pdf-service/
├── controllers/
│   └── pdfTextEditController.js    # Main controller for text editing
├── routes/
│   └── pdfTextEditRoutes.js        # API routes
├── uploads/                         # Temporary file storage
└── index.js                         # Main service file (updated)
```

## Frontend Setup

### Prerequisites

The frontend requires:
- React with TypeScript
- Vite for development
- Tailwind CSS for styling

### Integration

#### 1. Service Layer
```typescript
// src/services/pdfTextEditService.ts
import { pdfTextEditService } from './pdfTextEditService';

// Upload and extract text
const response = await pdfTextEditService.extractText(pdfFile);

// Edit text
const editResponse = await pdfTextEditService.editText(textEdits, originalFileName);

// Download edited PDF
await pdfTextEditService.downloadEditedPDF(editedFileName);
```

#### 2. Component Usage
```typescript
// src/pages/PDFTools/EditPdfText.tsx
import { pdfTextEditService } from '../../services/pdfTextEditService';

// The component automatically integrates with the backend API
```

#### 3. Proxy Configuration
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api/pdf-text-edit': {
        target: 'http://localhost:2104',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pdf-text-edit/, '/pdf-text-edit')
      }
    }
  }
});
```

## Usage Workflow

1. **Upload PDF**: User selects and uploads a PDF file
2. **Text Extraction**: Backend extracts text content and positioning
3. **Text Editing**: User edits text blocks in the frontend interface
4. **Save Changes**: Frontend sends edited text to backend for PDF generation
5. **Download**: User downloads the modified PDF file

## Technical Details

### Text Extraction Process

1. **PDF Parsing**: Uses `pdfjs-dist` to parse PDF structure
2. **Text Content**: Extracts text items with positioning information
3. **Coordinate Conversion**: Converts PDF coordinates to screen coordinates
4. **Font Information**: Extracts font size and family details

### PDF Generation Process

1. **Original PDF Loading**: Loads original PDF using `pdf-lib`
2. **Text Overlay**: Adds edited text at original positions
3. **Font Embedding**: Embeds standard fonts for consistency
4. **File Output**: Generates new PDF with modifications

### Error Handling

- **Fallback Text Blocks**: Provides sample text if extraction fails
- **File Validation**: Ensures only PDF files are processed
- **Size Limits**: 10MB file size limit for uploads
- **Cleanup**: Automatic cleanup of temporary files after download

## Configuration

### Backend Environment Variables

```bash
# PDF Service
PORT=2104
ACCESS_TOKEN_SECRET=your_jwt_secret
```

### Frontend Environment Variables

```bash
# .env.local
REACT_APP_BACKEND_URL=http://localhost:2104
```

## Development

### Starting the Backend

```bash
cd Backend/services/pdf-service
npm install
npm run dev
```

### Starting the Frontend

```bash
cd Frontend
npm install
npm run dev
```

### Testing the API

```bash
# Test text extraction
curl -X POST -F "pdf=@test.pdf" http://localhost:2104/pdf-text-edit/extract-text

# Test text editing
curl -X POST -H "Content-Type: application/json" \
  -d '{"textEdits":[{"id":"text_1_1","pageNumber":1,"editedText":"New text"}],"originalFileName":"test.pdf"}' \
  http://localhost:2104/pdf-text-edit/edit-text
```

## Limitations and Future Improvements

### Current Limitations

- Text positioning may not be pixel-perfect for all PDFs
- Limited font support (currently only standard fonts)
- No support for complex text layouts or tables
- Single-page text editing in current implementation

### Future Improvements

- **Enhanced Text Positioning**: Better coordinate mapping for complex layouts
- **Font Support**: Support for custom fonts and font embedding
- **Multi-page Editing**: Full support for editing text across multiple pages
- **Text Formatting**: Support for bold, italic, and other text styles
- **Batch Processing**: Process multiple PDFs simultaneously
- **OCR Integration**: Extract text from scanned PDFs
- **Version Control**: Track changes and provide rollback functionality

## Troubleshooting

### Common Issues

1. **Text Not Extracting**: Ensure PDF contains actual text (not just images)
2. **Upload Failures**: Check file size limits and file type validation
3. **Download Errors**: Verify backend service is running and accessible
4. **Proxy Issues**: Ensure Vite proxy configuration matches backend port

### Debug Information

- Check browser console for frontend errors
- Check backend console for API errors
- Verify file permissions in uploads directory
- Check network tab for API request/response details

## Security Considerations

- File upload validation and sanitization
- Temporary file cleanup after download
- File size limits to prevent abuse
- CORS configuration for cross-origin requests
- Input validation for text content

## Performance Optimization

- Asynchronous text extraction
- Efficient PDF parsing with pdfjs-dist
- Memory management for large PDFs
- Temporary file cleanup
- Streaming file downloads
