# Advanced PDF Editor Module

## Overview

The Advanced PDF Editor is a comprehensive PDF editing solution that provides click-to-edit text functionality, rich annotation tools, and advanced PDF manipulation capabilities. It combines a React frontend with a Node.js/Express backend and Python scripts for precise PDF operations.

## Features

### Text Editing
- **Click-to-Edit Text**: Click on any text in the PDF to edit it directly
- **Add New Text**: Add text anywhere on the PDF with custom positioning
- **Font Customization**: Change font size, family, color, weight, and style
- **Text Alignment**: Left, center, and right alignment options
- **Text Decoration**: Underline, strikethrough, and other text effects

### Rich Editing Features
- **Highlight Text**: Highlight important text with customizable colors
- **Add Comments**: Add sticky note-style comments anywhere on the PDF
- **Redact Text**: Securely remove sensitive information
- **Find and Replace**: Search and replace text throughout the document

### Drawing and Shapes
- **Freehand Drawing**: Draw with pen tool for annotations
- **Geometric Shapes**: Add rectangles, circles, lines, and arrows
- **Customizable Styles**: Change border thickness, fill color, and opacity
- **Resize and Move**: Interactive shape manipulation

### Images
- **Insert Images**: Add images at any position in the PDF
- **Resize and Move**: Interactive image manipulation
- **Format Support**: Support for PNG, JPG, and other common formats

### Toolbar
- **Comprehensive Tools**: Select, text, highlight, pen, eraser, shape, stamp, comment, and image tools
- **Undo/Redo**: Full history support for all operations
- **Zoom Controls**: Zoom in/out with percentage display
- **Page Navigation**: Navigate between pages with thumbnails

### Save and Export
- **Real-time Saving**: Save changes as you work
- **Export Options**: Download edited PDF with all changes applied
- **File Optimization**: Remove unused objects and compress images
- **Metadata Preservation**: Maintain original PDF structure

## Architecture

### Backend (Node.js/Express)
- **Main Controller**: `pdfEditorController.js` - Handles all PDF editing operations
- **Routes**: `pdfEditorRoute.js` - API endpoints for frontend communication
- **Python Integration**: Spawns Python scripts for advanced PDF operations

### Python Scripts
- **Text Extraction**: `extract_text_positions.py` - Extract text with precise coordinates
- **Text Editing**: `edit_pdf_text.py` - Edit existing text in PDFs
- **Text Addition**: `add_text_to_pdf.py` - Add new text to PDFs
- **Image Addition**: `add_image_to_pdf.py` - Insert images into PDFs
- **Shape Addition**: `add_shape_to_pdf.py` - Add geometric shapes
- **Annotation Addition**: `add_annotation_to_pdf.py` - Add highlights, comments, stamps
- **Text Redaction**: `redact_pdf_text.py` - Securely remove text
- **PDF Optimization**: `optimize_pdf.py` - Optimize file size and performance

### Frontend (React/TypeScript)
- **Main Component**: `AdvancedPDFEditor.tsx` - Main editor interface
- **Service Layer**: `pdfEditorService.ts` - API communication
- **Type Definitions**: `pdfEditor.ts` - TypeScript interfaces

## Installation

### Backend Dependencies
```bash
cd Backend/services/pdf-service
npm install
```

### Python Dependencies
```bash
pip install -r requirements.txt
```

### Frontend Dependencies
```bash
cd Frontend
npm install
```

## API Endpoints

### PDF Upload and Info
- `POST /api/pdf-service/pdf-editor/upload` - Upload PDF file
- `GET /api/pdf-service/pdf-editor/info/:fileName` - Get PDF information

### Text Operations
- `POST /api/pdf-service/pdf-editor/extract-text-blocks` - Extract text blocks
- `POST /api/pdf-service/pdf-editor/extract-text` - Extract text with positions
- `POST /api/pdf-service/pdf-editor/edit-text` - Edit existing text
- `POST /api/pdf-service/pdf-editor/add-text` - Add new text
- `POST /api/pdf-service/pdf-editor/update-text-block` - Update text block
- `POST /api/pdf-service/pdf-editor/delete-text-block` - Delete text block

### Image Operations
- `POST /api/pdf-service/pdf-editor/add-image` - Add image to PDF

### Shape and Drawing Operations
- `POST /api/pdf-service/pdf-editor/add-shape` - Add geometric shapes
- `POST /api/pdf-service/pdf-editor/add-drawing` - Add freehand drawings

### Annotation Operations
- `POST /api/pdf-service/pdf-editor/add-annotation` - Add general annotations
- `POST /api/pdf-service/pdf-editor/add-highlight` - Add text highlights
- `POST /api/pdf-service/pdf-editor/add-comment` - Add comments
- `POST /api/pdf-service/pdf-editor/add-stamp` - Add stamps

### Redaction
- `POST /api/pdf-service/pdf-editor/redact-text` - Redact sensitive text

### Save and Download
- `POST /api/pdf-service/pdf-editor/save` - Save edited PDF
- `GET /api/pdf-service/pdf-editor/download/:fileName` - Download PDF

### Optimization
- `POST /api/pdf-service/pdf-editor/optimize` - Optimize PDF file

## Usage

### Basic Text Editing
1. Upload a PDF file using the upload button
2. Click on any text to edit it directly
3. Use the text tool to add new text anywhere
4. Save your changes

### Adding Annotations
1. Select the highlight tool to highlight text
2. Use the comment tool to add sticky notes
3. Use the stamp tool to add approval stamps
4. Use the pen tool for freehand annotations

### Adding Shapes and Images
1. Select the shape tool and choose a shape type
2. Draw the shape on the PDF
3. Use the image tool to insert images
4. Resize and position as needed

### Saving and Exporting
1. Click the Save button to save changes
2. Use the Download button to export the edited PDF
3. The exported PDF will include all your changes

## Configuration

### Environment Variables
```env
# PDF Service Configuration
PORT=2104
MONGODB_URI=mongodb://localhost:27017/pdf-service

# Python Configuration
PYTHON_PATH=python3
```

### Python Script Configuration
The Python scripts can be configured by modifying the script files in the `scripts/` directory. Each script accepts command-line arguments for customization.

## Error Handling

The system includes comprehensive error handling:
- File upload validation
- PDF processing error recovery
- User-friendly error messages
- Logging for debugging

## Performance Optimization

- **Lazy Loading**: Text blocks are loaded on demand
- **Caching**: Frequently accessed data is cached
- **Compression**: Images are automatically compressed
- **Cleanup**: Temporary files are automatically removed

## Security Features

- **File Validation**: Only PDF files are accepted
- **Size Limits**: File size limits prevent abuse
- **Secure Redaction**: Text redaction is permanent and secure
- **Input Sanitization**: All user inputs are sanitized

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Common Issues

1. **Python Scripts Not Found**
   - Ensure Python is installed and in PATH
   - Install required Python packages
   - Check file permissions

2. **PDF Upload Fails**
   - Check file size limits
   - Ensure file is a valid PDF
   - Check network connectivity

3. **Text Editing Not Working**
   - Ensure PDF has selectable text
   - Check if PDF is password protected
   - Verify Python scripts are working

### Debug Mode
Enable debug mode by setting `NODE_ENV=development` in your environment variables.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

## Changelog

### Version 1.0.0
- Initial release
- Basic text editing functionality
- Annotation tools
- Shape and image support
- Save and export features
