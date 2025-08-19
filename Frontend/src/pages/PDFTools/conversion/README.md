# PDF Tool Page Template

This directory contains a template for creating new PDF tool pages. The `PDFToolTemplate.tsx` file provides a complete, standalone component that you can copy and modify for each individual PDF tool.

## How to Use

### 1. Copy the Template
Copy `PDFToolTemplate.tsx` and rename it to match your tool (e.g., `MergePDF.tsx`, `CompressPDF.tsx`).

### 2. Update the Tool Configuration
Modify the `TOOL_CONFIG` constant at the top of the file:

```typescript
const TOOL_CONFIG = {
  name: 'Merge PDF', // Your tool name
  description: 'Combine multiple PDF files into one document', // Tool description
  icon: FileTextIcon, // Import appropriate icon from lucide-react
  premium: false, // Set to true for premium features
  badge: 'Popular', // Optional badge, remove if not needed
  complexity: 'easy' as const, // 'easy', 'medium', or 'hard'
  popularity: 90, // Percentage 0-100
  avgProcessingTime: '5-10 seconds', // Estimated processing time
  inputFormats: ['pdf'], // Supported input formats
  outputFormats: ['pdf'], // Supported output formats
  features: [
    'Merge multiple PDFs',
    'Maintain page order',
    'Preserve quality',
    'Batch processing',
    'Drag and drop support'
  ]
};
```

### 3. Import Appropriate Icons
Replace `FileTextIcon` with the appropriate icon from `lucide-react`:

```typescript
import { 
  FileText, 
  Scissors, 
  Compress, 
  Merge, 
  // ... other icons
} from 'lucide-react';

// Then in TOOL_CONFIG:
icon: Merge, // or Scissors, Compress, etc.
```

### 4. Update the Route
Add your new tool page to the routes in `Frontend/src/routes/index.tsx`:

```typescript
{ path: '/pdf-tools/merge-pdf', element: <MergePDF />},
```

### 5. Import the Component
Add the import at the top of `Frontend/src/routes/index.tsx`:

```typescript
import { MergePDF } from '../pages/PDFTools/conversion/MergePDF';
```

## Features Included

The template includes:
- ✅ File upload with drag & drop
- ✅ File management (add/remove files)
- ✅ Processing simulation with progress bar
- ✅ Results display with success/error states
- ✅ Download functionality
- ✅ Tool information sidebar
- ✅ Settings panel
- ✅ Responsive design
- ✅ Navigation back to PDF tools grid
- ✅ TypeScript support
- ✅ No external dependencies

## Customization

### Adding Tool-Specific Logic
Replace the `processFiles` function with your actual API calls:

```typescript
const processFiles = async () => {
  if (uploadedFiles.length === 0) return;

  setIsProcessing(true);
  setProcessingProgress(0);
  
  try {
    // Your actual API call here
    const response = await yourAPI.mergePDFs(uploadedFiles);
    
    setResults([{
      name: 'merged-document.pdf',
      status: 'success'
    }]);
  } catch (error) {
    setResults([{
      name: 'Error',
      status: 'error',
      message: error.message
    }]);
  } finally {
    setIsProcessing(false);
  }
};
```

### Modifying the UI
The template uses a clean, modern design that you can customize:
- Change colors in the `className` attributes
- Modify the layout by adjusting the grid structure
- Add new sections or remove existing ones
- Customize the settings panel for tool-specific options

## File Structure

```
Frontend/src/pages/PDFTools/
├── conversion/
│   ├── PDFToolTemplate.tsx  # Template file
│   ├── README.md            # This file
│   └── [YourTool].tsx       # Your custom tool pages
├── PDFtoDoc.tsx             # PDF to Word tool (example)
└── [Other tools...]
```

## Example: Creating a Merge PDF Tool

1. Copy `PDFToolTemplate.tsx` to `MergePDF.tsx`
2. Update `TOOL_CONFIG`:
   ```typescript
   const TOOL_CONFIG = {
     name: 'Merge PDF',
     description: 'Combine multiple PDF files into one document',
     icon: Merge,
     // ... other properties
   };
   ```
3. Import the `Merge` icon from `lucide-react`
4. Add the route in `index.tsx`
5. Customize the processing logic for merging PDFs

## Notes

- Each tool page is completely standalone
- No props or external dependencies required
- Easy to copy and modify for new tools
- Consistent UI/UX across all tool pages
- Ready for API integration
