# Add Page Numbers to PDF - Complete Solution

This document describes the complete implementation of the "Add Page Numbers to PDF" functionality, including both backend API and frontend interface.

## Features

### Backend API
- **Add Page Numbers**: Add page numbers to PDF documents with custom formatting
- **Preview Generation**: Generate preview of page numbers before applying
- **Customizable Options**:
  - Position control (9 different positions: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right, middle-left, middle-right, center)
  - Font size (8-72px)
  - Font color (hex color picker)
  - Page range selection (start page, end page)
  - Custom text prefix
  - Margin control
  - Multiple format options
  - Exclude specific pages

### Frontend Interface
- **User-friendly Design**: Clean, intuitive interface without complexity
- **Real-time Preview**: See how page numbers will look before applying
- **Responsive Layout**: Works on all device sizes
- **Drag & Drop**: Easy file upload
- **Progress Indicators**: Clear feedback during processing

## Technical Implementation

### Backend Structure

#### Controller
- **File**: `Backend/services/pdf-service/controllers/addPageNumbersController.js`
- **Functions**:
  - `addPageNumbers()`: Main function to add page numbers
  - `getPageNumberPreview()`: Generate preview for first page

#### Routes
- **File**: `Backend/services/pdf-service/routes/addPageNumbersRoute.js`
- **Endpoints**:
  - `POST /pdf-page-numbers/add-page-numbers`: Add page numbers
  - `POST /pdf-page-numbers/preview-page-numbers`: Generate preview

#### Integration
- **File**: `Backend/services/pdf-service/index.js`
- **Route**: `/pdf-page-numbers/*`

### Frontend Structure

#### Types
- **File**: `Frontend/src/types/addPageNumbers.ts`
- **Interfaces**: Request/response types for API communication

#### Service
- **File**: `Frontend/src/services/addPageNumbersService.ts`
- **Functions**: API calls and file download handling

#### Component
- **File**: `Frontend/src/components/PDFService/AddPageNumbers.tsx`
- **Features**: Complete UI with form controls and preview

#### Page
- **File**: `Frontend/src/pages/PDFTools/AddPageNumbersPage.tsx`
- **Route**: `/pdf-tools/add-page-numbers`

## API Endpoints

### Add Page Numbers
```
POST /pdf-page-numbers/add-page-numbers
Content-Type: multipart/form-data

Parameters:
- file: PDF file
- position: string (position option)
- fontSize: number
- fontColor: string (hex color)
- startPage: number
- endPage: number (optional)
- format: string
- margin: number
- customText: string (optional)
- excludePages: string (comma-separated, optional)
```

### Preview Page Numbers
```
POST /pdf-page-numbers/preview-page-numbers
Content-Type: multipart/form-data

Parameters:
- file: PDF file
- position: string
- fontSize: number
- fontColor: string
- format: string
- margin: number
```

## Usage Examples

### Basic Page Numbers
1. Upload PDF file
2. Select position (e.g., bottom-center)
3. Choose format (e.g., "Page {page} of {total}")
4. Set font size and color
5. Click "Add Page Numbers"

### Advanced Configuration
1. Set custom page range (e.g., start: 3, end: 10)
2. Add custom text prefix (e.g., "Document:")
3. Exclude specific pages (e.g., "1,3,5")
4. Adjust margin for precise positioning
5. Generate preview to verify appearance

## Position Options

| Position | Description | Use Case |
|----------|-------------|----------|
| top-left | Top left corner | Headers, formal documents |
| top-center | Top center | Standard page numbering |
| top-right | Top right corner | Professional documents |
| bottom-left | Bottom left corner | Alternative positioning |
| bottom-center | Bottom center | **Most common** |
| bottom-right | Bottom right corner | Business documents |
| middle-left | Left side middle | Side margins |
| middle-right | Right side middle | Side margins |
| center | Page center | Watermark-style |

## Format Options

| Format | Example | Description |
|--------|---------|-------------|
| `Page {page}` | Page 1, Page 2 | Simple numbering |
| `Page {page} of {total}` | Page 1 of 5 | With total count |
| `{page}` | 1, 2, 3 | Numbers only |
| `Page {page} - {total}` | Page 1 - 5 | Dash format |
| `P.{page}` | P.1, P.2 | Abbreviated |

## Error Handling

### Backend
- File validation (PDF only)
- File size limits (50MB)
- Input validation
- Graceful error responses

### Frontend
- User-friendly error messages
- Input validation
- Loading states
- Progress indicators

## Security Features

- JWT authentication required
- File type validation
- File size limits
- Secure file handling
- Automatic cleanup of temporary files

## Performance Optimizations

- Async processing
- File cleanup (24-hour TTL)
- Efficient PDF manipulation with pdf-lib
- Minimal memory usage
- Background processing

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Progressive enhancement
- Fallback for older browsers

## Dependencies

### Backend
- `pdf-lib`: PDF manipulation
- `multer`: File upload handling
- `fs-extra`: File system operations
- `express`: Web framework

### Frontend
- `React`: UI framework
- `TypeScript`: Type safety
- `Tailwind CSS`: Styling
- Custom UI components

## Installation & Setup

### Backend
1. Ensure `pdf-lib` is installed
2. Add the new controller and routes
3. Update main index.js
4. Restart the service

### Frontend
1. Add new types and service
2. Create component and page
3. Update routing
4. Test functionality

## Testing

### Backend Testing
- Test with various PDF sizes
- Verify position calculations
- Check format replacements
- Validate error handling

### Frontend Testing
- Test file upload
- Verify form validation
- Check preview functionality
- Test responsive design

## Future Enhancements

- Batch processing
- Template presets
- Advanced formatting options
- Custom font support
- Multiple language support
- Export/import configurations

## Troubleshooting

### Common Issues
1. **File not uploading**: Check file size and type
2. **Position not correct**: Verify margin settings
3. **Preview not working**: Check file format
4. **Download fails**: Verify file permissions

### Debug Steps
1. Check browser console for errors
2. Verify backend logs
3. Test with simple PDF first
4. Check file permissions

## Support

For technical support or feature requests, please refer to the project documentation or contact the development team.
