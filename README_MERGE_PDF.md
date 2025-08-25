# Merge PDF Frontend Component

This document describes the new Merge PDF frontend component that provides a modern, user-friendly interface for combining multiple PDF documents.

## Features

### 🎯 Core Functionality
- **Drag & Drop Upload**: Intuitive file upload with drag and drop support
- **Document Reordering**: Drag and drop to reorder documents before merging
- **Real-time Validation**: Automatic PDF validation and page count detection
- **Progress Tracking**: Visual progress indicator during merge operations
- **Error Handling**: Comprehensive error reporting and validation

### 🎨 User Interface
- **Modern Design**: Clean, card-based layout matching the existing UI
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Visual Feedback**: Loading states, progress bars, and status indicators
- **Document Preview**: Thumbnail previews with file information

### 🔧 Technical Features
- **File Validation**: PDF format and size validation
- **Size Limits**: 100MB per file, 500MB total limit
- **Backend Integration**: Connects to the existing PDF service backend
- **TypeScript Support**: Fully typed with TypeScript interfaces

## Component Structure

### Files Created
1. **`Frontend/src/components/PDFService/MergePDF.tsx`** - Main merge PDF component
2. **`Frontend/src/pages/PDFTools/MergePDFPage.tsx`** - Page wrapper with success/error modals
3. **`Frontend/src/services/mergePDFService.ts`** - Service layer for API communication
4. **`Frontend/src/components/PDFService/index.ts`** - Export file for PDFService components

### Routes
- **`/pdf-tools/merge-pdf`** - Main merge PDF tool page

## Usage

### Basic Implementation
```tsx
import { MergePDF } from '../components/PDFService';

const MyPage = () => {
  const handleMergeComplete = (mergedFile: File) => {
    console.log('Merge completed:', mergedFile);
    // Handle the merged file (download, save, etc.)
  };

  return (
    <MergePDF onMergeComplete={handleMergeComplete} />
  );
};
```

### With Custom Options
```tsx
<MergePDF 
  onMergeComplete={handleMergeComplete}
  // Additional props can be added here
/>
```

## API Integration

### Backend Endpoints
The component integrates with these backend endpoints:
- **`POST /pdf-service/merge`** - Merge PDF files
- **`POST /pdf-service/info`** - Get PDF information
- **`POST /pdf-service/validate`** - Validate PDF files

### Request Format
```typescript
interface MergePDFRequest {
  files: File[];
  orderedFilenames: string[];
  options?: {
    addBookmarks?: boolean;
    optimizeSize?: boolean;
    pageRanges?: string[];
  };
}
```

### Response Format
```typescript
interface MergePDFResponse {
  success: boolean;
  mergedFile?: {
    filename: string;
    size: number;
    pages: number;
    downloadUrl: string;
  };
  error?: string;
}
```

## User Experience Flow

1. **Upload Phase**
   - User drags and drops PDF files or clicks to browse
   - Files are validated for format and size
   - Processing indicators show while analyzing PDFs

2. **Organization Phase**
   - Documents are displayed as cards with thumbnails
   - User can drag and drop to reorder documents
   - File information (size, pages) is displayed

3. **Merge Phase**
   - Merge button appears when 2+ valid documents are ready
   - Progress bar shows merge completion status
   - Success/error modal provides feedback

4. **Download Phase**
   - Merged PDF is automatically downloaded
   - User can close the success modal

## Styling and Theming

### Design System
- **Colors**: Uses existing Tailwind CSS color palette
- **Typography**: Consistent with the application's font hierarchy
- **Spacing**: Follows the established spacing scale
- **Components**: Integrates with existing UI components

### Responsive Breakpoints
- **Mobile**: Single column layout, optimized touch interactions
- **Tablet**: Two-column grid for document cards
- **Desktop**: Full-width layout with optimal spacing

## Error Handling

### Validation Errors
- **File Format**: Only PDF files are accepted
- **File Size**: Individual files must be under 100MB
- **Total Size**: Combined files must be under 500MB
- **Processing Errors**: Network or backend failures

### User Feedback
- **Visual Indicators**: Error states on individual documents
- **Error Summary**: Consolidated error display
- **Actionable Messages**: Clear instructions for resolution

## Performance Considerations

### File Processing
- **Asynchronous Processing**: Non-blocking file analysis
- **Batch Operations**: Efficient handling of multiple files
- **Memory Management**: Proper cleanup of file objects

### User Experience
- **Loading States**: Immediate feedback for user actions
- **Progress Indicators**: Real-time status updates
- **Optimistic Updates**: UI updates before backend confirmation

## Browser Compatibility

### Supported Browsers
- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+

### Required Features
- **File API**: For file handling
- **Drag & Drop API**: For drag and drop functionality
- **Fetch API**: For HTTP requests
- **Blob API**: For file downloads

## Testing

### Component Testing
- **Unit Tests**: Individual function testing
- **Integration Tests**: API service integration
- **User Acceptance Tests**: End-to-end workflow testing

### Test Scenarios
- File upload and validation
- Document reordering
- Merge operations
- Error handling
- Responsive design

## Future Enhancements

### Planned Features
- **Batch Processing**: Handle larger numbers of files
- **Advanced Options**: Custom merge settings
- **Preview Mode**: Show merged result before download
- **Template Support**: Save and reuse merge configurations

### Technical Improvements
- **Web Workers**: Background file processing
- **Service Workers**: Offline capability
- **Caching**: Optimize repeated operations
- **Analytics**: Usage tracking and optimization

## Troubleshooting

### Common Issues
1. **Files not uploading**: Check file format and size limits
2. **Merge failing**: Verify backend service is running
3. **Slow performance**: Check file sizes and network connection
4. **UI not responsive**: Ensure browser compatibility

### Debug Information
- Console logs for API calls
- Network tab for request/response details
- Component state inspection
- Error boundary integration

## Contributing

### Development Setup
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Navigate to `/pdf-tools/merge-pdf`

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Component Structure**: Functional components with hooks

### Testing
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing utilities
- **Coverage**: Minimum 80% test coverage

---

This component provides a robust, user-friendly solution for PDF merging that integrates seamlessly with the existing application architecture while maintaining high standards for code quality and user experience.
