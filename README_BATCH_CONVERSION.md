# Batch Conversion Tool

## Overview
The Batch Conversion tool allows users to convert multiple files (up to 5) to different output formats simultaneously. This is a powerful feature for bulk document processing workflows.

## Features

### ✅ **File Upload**
- **Maximum files**: 5 files per batch
- **Supported input formats**:
  - PDF (.pdf)
  - Word documents (.doc, .docx)
  - Excel spreadsheets (.xls, .xlsx)
  - PowerPoint presentations (.ppt, .pptx)
  - Text files (.txt)
  - HTML files (.html)

### ✅ **Output Format Selection**
- **Individual format selection**: Each file can have its own output format
- **Supported output formats**:
  - PDF (.pdf)
  - Word (.docx)
  - Excel (.xlsx)
  - PowerPoint (.pptx)
  - Text (.txt)
  - HTML (.html)
  - EPUB (.epub)

### ✅ **Conversion Process**
- **Batch processing**: All files converted simultaneously
- **Progress tracking**: Real-time conversion progress
- **Error handling**: Individual file error reporting
- **Status feedback**: Success/error status for each file

### ✅ **Download Options**
- **Individual downloads**: Download each converted file separately
- **Bulk download**: Download all successful conversions at once
- **ZIP creation**: Automatic ZIP file generation for multiple files

## Backend API

### Endpoint
```
POST /convert/batch-convert
```

### Request Format
```javascript
// FormData with:
files: [File1, File2, File3, ...] // Up to 5 files
outputFormats: ["pdf", "docx", "xlsx", ...] // Array matching files
```

### Response Format
```javascript
{
  "message": "Batch conversion completed",
  "results": [
    {
      "fileName": "document1.pdf",
      "inputFormat": "pdf",
      "outputFormat": "docx",
      "status": "success",
      "downloadUrl": "/outputs/converted_123.docx",
      "message": "Conversion successful"
    }
  ],
  "zipUrl": "/outputs/batch_conversion_123.zip",
  "totalFiles": 3,
  "successfulConversions": 3
}
```

## Frontend Usage

### 1. **Upload Files**
- Drag & drop files or click "Choose Files"
- Maximum 5 files allowed
- Files are automatically validated for supported formats

### 2. **Select Output Formats**
- Each file has its own dropdown for output format selection
- Default format is PDF
- Supported formats are filtered based on input file type

### 3. **Start Conversion**
- Click "Start Conversion" button
- Progress bar shows conversion status
- Real-time feedback for each file

### 4. **Download Results**
- **Individual downloads**: Click download button for each file
- **Bulk download**: Use "Download All" button for ZIP file

## Technical Implementation

### Backend Components
- **Controller**: `batchConvert` function in `pdfToImage.js`
- **Route**: `/convert/batch-convert` in `pdfToImage.js`
- **Middleware**: File upload handling with Multer
- **Dependencies**: `archiver` for ZIP file creation

### Frontend Components
- **Component**: `BatchConversion.tsx`
- **Service**: `pdfService.batchConvert()`
- **State Management**: React hooks for files, formats, and results
- **UI**: Beautiful, responsive design with Tailwind CSS

### File Storage
- **Input files**: Stored temporarily in `uploads/` directory
- **Output files**: Stored in `outputs/` directory
- **ZIP files**: Generated on-demand in `outputs/` directory
- **Cleanup**: Automatic cleanup after 24 hours

## Error Handling

### File Validation
- File type validation
- File size limits
- Maximum file count enforcement

### Conversion Errors
- Individual file error reporting
- Graceful fallback for failed conversions
- Detailed error messages

### Network Issues
- Timeout handling (10 minutes for batch)
- Retry mechanisms
- User-friendly error messages

## Performance Considerations

### Timeouts
- **Individual conversions**: 5 minutes
- **Batch conversions**: 10 minutes
- **File uploads**: 50MB limit per file

### Scalability
- Concurrent file processing
- Memory-efficient file handling
- Background ZIP creation

## Future Enhancements

### Planned Features
- **Real-time progress**: Individual file progress tracking
- **Conversion presets**: Save common format combinations
- **Batch scheduling**: Queue conversions for later processing
- **Advanced options**: Quality settings, compression options

### Integration Possibilities
- **Cloud storage**: Direct upload to cloud services
- **Webhook support**: Notify external systems on completion
- **API rate limiting**: Prevent abuse and ensure fair usage

## Troubleshooting

### Common Issues
1. **File upload fails**: Check file size and format
2. **Conversion timeout**: Large files may take longer
3. **Download errors**: Check file permissions and storage space
4. **ZIP creation fails**: Ensure sufficient disk space

### Debug Information
- Backend console logs show conversion progress
- Frontend console shows API calls and responses
- File paths and URLs are logged for debugging

## Security Considerations

### File Validation
- File type verification
- File size limits
- Malicious file detection

### Access Control
- JWT authentication required
- File access restrictions
- Temporary file cleanup

## Testing

### Test Scenarios
1. **Single file conversion**: Basic functionality
2. **Multiple file conversion**: Batch processing
3. **Format validation**: Input/output format compatibility
4. **Error handling**: Invalid files, network issues
5. **Download functionality**: Individual and bulk downloads

### Test Files
- Use various file formats and sizes
- Test edge cases (very large files, unusual formats)
- Verify error handling with corrupted files

---

## Quick Start

1. **Navigate** to the Batch Conversion tool
2. **Upload** up to 5 files
3. **Select** desired output formats for each file
4. **Click** "Start Conversion"
5. **Wait** for processing to complete
6. **Download** individual files or use "Download All"

The tool is designed to be intuitive and user-friendly while providing powerful batch processing capabilities for document conversion workflows.
