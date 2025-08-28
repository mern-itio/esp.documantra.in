# Remove Metadata Feature

## Overview

The Remove Metadata feature allows users to clean metadata and hidden information from PDF documents, enhancing privacy and security. This feature provides comprehensive metadata removal capabilities with multiple cleaning presets and custom options.

## Features

- **Metadata Cleaning**: Remove document properties, author information, creation dates, and more
- **Hidden Content Removal**: Eliminate embedded metadata, XMP data, and hidden streams
- **Privacy Audit**: Analyze PDFs for metadata before and after cleaning
- **Multiple Presets**: Pre-configured cleaning options for different use cases
- **Custom Configuration**: Granular control over what metadata to remove
- **File Size Optimization**: Often reduces file size while maintaining content quality

## Backend Implementation

### Controller: `removeMetadataController.js`

Located at: `Backend/services/pdf-service/controllers/removeMetadataController.js`

**Key Methods:**
- `removeMetadata()`: Main method for removing metadata from PDFs
- `checkMetadata()`: Analyze PDF for existing metadata
- `testToolsInstallation()`: Verify required tools are available

**Dependencies:**
- `qpdf`: PDF processing and optimization
- `exiftool`: Comprehensive metadata removal (optional)
- `pdfinfo`: PDF information extraction (optional)

### Route: `removeMetadataRoute.js`

Located at: `Backend/services/pdf-service/routes/removeMetadataRoute.js`

**Endpoints:**
- `POST /pdf-remove-metadata/check-metadata`: Analyze PDF metadata
- `POST /pdf-remove-metadata/remove-metadata`: Remove metadata from PDF
- `GET /pdf-remove-metadata/download/:filename`: Download cleaned PDF
- `GET /pdf-remove-metadata/test-tools`: Test tool installation

### Integration

The route is registered in the main PDF service:
```javascript
// Backend/services/pdf-service/index.js
const removeMetadataRoutes = require('./routes/removeMetadataRoute');
app.use('/pdf-remove-metadata', removeMetadataRoutes);
```

## Frontend Implementation

### Types: `removeMetadata.ts`

Located at: `Frontend/src/types/removeMetadata.ts`

**Key Interfaces:**
- `RemoveMetadataRequest`: Request payload with cleaning options
- `RemoveMetadataResponse`: Response with processing results
- `MetadataCheckResponse`: Metadata analysis results
- `MetadataCleaningPreset`: Predefined cleaning configurations

### Service: `removeMetadataService.ts`

Located at: `Frontend/src/services/removeMetadataService.ts`

**Key Methods:**
- `checkMetadata()`: Analyze PDF metadata
- `removeMetadata()`: Process metadata removal
- `downloadFile()`: Download cleaned PDF
- `getCleaningPresets()`: Get predefined cleaning options

### Component: `RemoveMetadata.tsx`

Located at: `Frontend/src/components/PDFService/RemoveMetadata.tsx`

**Features:**
- File upload with drag-and-drop support
- Metadata analysis and display
- Three configuration modes: Presets, Custom, Advanced
- Real-time processing feedback
- Results display with file size comparison

### Page Wrapper: `RemoveMetadataPage.tsx`

Located at: `Frontend/src/pages/PDFTools/RemoveMetadataPage.tsx`

## Cleaning Presets

### 1. Basic Cleaning
- Removes common document metadata
- Author, title, creation date, keywords, subject
- Safe for most use cases

### 2. Advanced Cleaning
- Includes XMP metadata removal
- Color profiles and output intents
- Viewer preferences and page settings

### 3. Comprehensive Cleaning
- Removes all possible metadata
- Structural information and streams
- Maximum privacy protection

### 4. Privacy Focused
- Targets identifying information
- Preserves document structure
- Balanced approach for sensitive documents

### 5. Minimal Cleaning
- Removes only essential metadata
- Preserves most document properties
- Lightweight cleaning option

## Configuration Options

### Document Information
- `removeDocumentInfo`: Remove document info dictionary
- `removeProducer`: Remove producer information
- `removeCreator`: Remove creator information
- `removeCreationDate`: Remove creation date
- `removeModificationDate`: Remove modification date
- `removeKeywords`: Remove keywords
- `removeSubject`: Remove subject
- `removeAuthor`: Remove author
- `removeTitle`: Remove title
- `removeTrapped`: Remove trapped flag

### Extended Metadata
- `removeXMPMetadata`: Remove XMP metadata
- `removeICCProfiles`: Remove ICC color profiles
- `removeColorProfiles`: Remove color profiles
- `removeOutputIntents`: Remove output intents
- `removePageLayout`: Remove page layout
- `removePageMode`: Remove page mode
- `removeViewerPreferences`: Remove viewer preferences
- `removeOpenAction`: Remove open actions

### Structural Elements
- `removeAdditionalStreams`: Remove additional streams
- `removeStructureTree`: Remove structure tree
- `removeMarkInfo`: Remove mark information
- `removeLang`: Remove language information
- `removeSpiderInfo`: Remove spider information
- `removeCollection`: Remove collection
- `removeNeedsRendering`: Remove rendering flags
- `removePieceInfo`: Remove piece information

## Usage

### 1. Upload PDF
- Select a PDF file (max 50MB)
- File is automatically analyzed for metadata

### 2. Choose Cleaning Method
- **Presets**: Select from predefined cleaning configurations
- **Custom**: Manually select what to remove
- **Advanced**: Configure granular options

### 3. Process Document
- Click "Remove Metadata" to start processing
- Monitor progress with real-time feedback

### 4. Download Result
- Download the cleaned PDF
- View file size reduction and processing details

## Technical Details

### Backend Processing
1. **File Upload**: PDF uploaded via multer middleware
2. **Metadata Analysis**: Use qpdf and exiftool to analyze content
3. **Cleaning Process**: Apply selected removal options
4. **Optimization**: Re-optimize PDF with qpdf
5. **File Delivery**: Provide download link for cleaned PDF

### Frontend Features
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Live feedback during processing
- **Error Handling**: Comprehensive error messages and validation
- **Accessibility**: Keyboard navigation and screen reader support

### Security Considerations
- **File Validation**: Only PDF files accepted
- **Size Limits**: 50MB maximum file size
- **Temporary Storage**: Files cleaned up after processing
- **No Data Retention**: Processed files not stored permanently

## Dependencies

### Backend
- `qpdf`: PDF processing and optimization
- `exiftool`: Metadata extraction and removal
- `pdfinfo`: PDF information analysis
- `multer`: File upload handling
- `fs-extra`: File system operations

### Frontend
- `axios`: HTTP client for API calls
- `react`: UI framework
- `lucide-react`: Icon library
- `tailwindcss`: Styling framework

## Installation

### Backend Setup
1. Ensure qpdf is installed: `qpdf --version`
2. Optional: Install exiftool for enhanced metadata removal
3. Optional: Install pdfinfo for detailed PDF analysis

### Frontend Setup
1. Install dependencies: `npm install`
2. Configure environment variables
3. Build and serve the application

## Testing

### Backend Testing
```bash
# Test tool installation
curl http://localhost:2104/pdf-remove-metadata/test-tools

# Test metadata check
curl -X POST -F "file=@test.pdf" http://localhost:2104/pdf-remove-metadata/check-metadata

# Test metadata removal
curl -X POST -F "file=@test.pdf" -F "removeDocumentInfo=true" http://localhost:2104/pdf-remove-metadata/remove-metadata
```

### Frontend Testing
1. Navigate to `/pdf-tools/remove-metadata`
2. Upload a test PDF file
3. Test different cleaning presets
4. Verify download functionality

## Troubleshooting

### Common Issues
1. **File Upload Errors**: Check file size and format
2. **Processing Failures**: Verify tool installation
3. **Download Issues**: Check file permissions and storage

### Debug Information
- Backend logs show processing details
- Frontend console displays API responses
- Network tab shows request/response flow

## Future Enhancements

### Planned Features
- **Batch Processing**: Handle multiple files
- **Template Saving**: Save custom cleaning configurations
- **Progress Tracking**: Detailed processing progress
- **Metadata Preview**: Show what will be removed before processing

### Performance Improvements
- **Streaming Processing**: Handle large files more efficiently
- **Caching**: Cache common cleaning operations
- **Parallel Processing**: Process multiple files simultaneously

## Contributing

### Development Setup
1. Clone the repository
2. Install dependencies
3. Set up development environment
4. Run tests and linting

### Code Standards
- Follow existing code style
- Add comprehensive error handling
- Include unit tests for new features
- Update documentation for changes

## License

This feature is part of the Final Draft and Sign project. Please refer to the main project license for details.
