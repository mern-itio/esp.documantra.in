# PDF Service Integration Setup

This document explains how to set up and use the PDF to DOC conversion functionality using the existing API helper pattern.

## Backend Setup

### 1. Start the PDF Service
The PDF service runs on port 2104 by default. Make sure it's running:

```bash
cd Backend/services/pdf-service
npm install
npm start
```

### 2. Environment Variables
Create a `.env` file in the PDF service directory:

```env
PORT=2104
ACCESS_TOKEN_SECRET=your_jwt_secret_here
```

### 3. Service Health
The service includes a health check endpoint at `/health` to verify it's running.

## Frontend Setup

### 1. Environment Configuration
Create a `.env` file in the Frontend directory:

```env
# PDF Service URL for PDF conversion tools
VITE_PDF_SERVICE_URL=http://localhost:2104

# Other existing variables...
VITE_API_BASE_URL=http://localhost:4000
VITE_DOCUMENT_SERVICE_URL=http://localhost:2102
```

### 2. Authentication
Make sure you have a valid JWT token in localStorage (`accessToken`) before using the conversion tool.

## API Structure

The PDF service follows the existing API helper pattern used in the project:

### 1. API Helper (`apiHelper.tsx`)
- Creates a PDF service API instance with proper interceptors
- Handles authentication tokens automatically
- Provides logging and error handling

### 2. PDF Service (`pdfService.ts`)
- Contains all PDF conversion functions
- Uses the API helper instance
- Provides clean, reusable functions for each conversion type

### 3. Component Usage
- Components import and use `pdfService` functions
- No inline API calls or fetch logic
- Consistent error handling and logging

## Available API Functions

### Core Functions
- `pdfService.checkHealth()` - Check service availability
- `pdfService.convertPdfToDoc(file)` - Convert PDF to DOCX
- `pdfService.convertPdfToExcel(file)` - Convert PDF to Excel
- `pdfService.convertPdfToPpt(file)` - Convert PDF to PowerPoint
- `pdfService.convertPdfToTxt(file)` - Convert PDF to TXT
- `pdfService.convertPdfToHtml(file)` - Convert PDF to HTML

### Reverse Conversions
- `pdfService.convertDocToPdf(file)` - Convert DOC/DOCX to PDF
- `pdfService.convertExcelToPdf(file)` - Convert Excel to PDF
- `pdfService.convertPptToPdf(file)` - Convert PowerPoint to PDF
- `pdfService.convertTxtToPdf(file)` - Convert TXT to PDF
- `pdfService.convertHtmlToPdf(file)` - Convert HTML to PDF

### Utility Functions
- `pdfService.downloadFile(downloadUrl, filename)` - Download converted files
- `pdfService.getSupportedFormats()` - Get list of supported formats

## How It Works

### 1. File Upload
- Users can drag & drop or select PDF files
- Only PDF files are accepted
- Multiple files can be uploaded simultaneously

### 2. Conversion Process
- Files are sent to the backend PDF service via `pdfService`
- The service converts PDF to DOCX using pdf-parse and docx libraries
- Progress is shown for each file
- Results include success/error status and download links

### 3. File Download
- Converted files are stored in the backend `outputs` directory
- Files are served statically via `/outputs` endpoint
- Automatic cleanup removes files older than 24 hours

## API Endpoints

### POST `/pdf/pdf-to-doc`
Converts a PDF file to DOCX format.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: FormData with 'document' field containing the PDF file
- Headers: Authorization Bearer token (handled automatically)

**Response:**
```json
{
  "success": true,
  "message": "Document converted successfully",
  "originalFile": "input.pdf",
  "outputFile": "input.docx",
  "downloadUrl": "/outputs/input.docx",
  "fileSize": 12345
}
```

### GET `/outputs/:filename`
Downloads a converted file.

**Request:**
- Method: GET
- Headers: Authorization Bearer token (handled automatically)

**Response:**
- File content as blob

## Error Handling

The API helper provides comprehensive error handling:
- **Request Interceptor**: Automatically adds authentication tokens
- **Response Interceptor**: Logs all API requests and responses
- **Error Logging**: Detailed error information for debugging
- **Automatic Retry**: Built-in retry logic for failed requests

## File Management

- Uploaded files are automatically cleaned up after conversion
- Converted files are stored temporarily (24 hours max)
- File size limit: 50MB per file
- Supported formats: PDF input, DOCX output

## Usage Example

```typescript
import { pdfService } from '../services/pdfService';

// Convert a PDF file
try {
  const result = await pdfService.convertPdfToDoc(pdfFile);
  console.log('Conversion successful:', result);
  
  // Download the converted file
  await pdfService.downloadFile(result.downloadUrl, result.outputFile);
} catch (error) {
  console.error('Conversion failed:', error);
}
```

## Troubleshooting

### Common Issues

1. **"Backend service is not available"**
   - Check if PDF service is running on port 2104
   - Verify the service URL in environment variables

2. **"Authentication token not found"**
   - Make sure you're logged in
   - Check if `accessToken` exists in localStorage

3. **"Conversion failed"**
   - Check backend logs for detailed error messages
   - Verify the PDF file is not corrupted
   - Ensure the file size is under 50MB

4. **Download fails**
   - Check if the converted file exists in backend outputs directory
   - Verify file permissions
   - Check network connectivity

### Debug Mode

The API helper automatically logs all requests and responses:
- Request details (method, URL, headers)
- Response data and status
- Error details with full context
- Network timing information

## Performance Notes

- Files are processed sequentially to avoid overwhelming the backend
- Progress updates every 500ms for smooth UI experience
- Large files may take longer to convert
- Multiple files are processed one by one for better error handling
- API helper includes request/response logging for debugging

## Benefits of the New Structure

1. **Consistency**: Follows the same pattern as other services in the project
2. **Reusability**: PDF service functions can be used across multiple components
3. **Maintainability**: Centralized API logic, easier to update and debug
4. **Error Handling**: Consistent error handling and logging across all PDF operations
5. **Authentication**: Automatic token management via interceptors
6. **Logging**: Comprehensive request/response logging for debugging
