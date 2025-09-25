# PDF Table Extraction with pdfplumber, pandas, and openpyxl

This implementation provides advanced PDF table extraction using Python libraries for better accuracy and reliability compared to OCR-based methods.

## Features

- **Multiple Detection Methods**: Auto-detect, manual selection, or extract all content
- **Advanced Table Recognition**: Uses pdfplumber's sophisticated table detection algorithms
- **Multiple Output Formats**: Excel (.xlsx), CSV (.csv), and legacy Excel (.xls)
- **Format Preservation**: Maintains original table structure and formatting
- **Page Range Support**: Process specific pages or entire document
- **Multi-language Support**: OCR support for various languages
- **Fallback Mechanism**: Falls back to OCR if Python method fails

## Dependencies

### Python Dependencies
- `pdfplumber==0.10.3` - Advanced PDF table extraction
- `pandas==2.1.4` - Data manipulation and analysis
- `openpyxl==3.1.2` - Excel file generation
- `numpy==1.24.3` - Numerical computing
- `Pillow==10.1.0` - Image processing
- `opencv-python==4.8.1.78` - Computer vision

### Node.js Dependencies
- `xlsx` - Excel file handling (fallback)
- `fs-extra` - File system operations
- `child_process` - Python script execution

## Installation

### 1. Install Python Dependencies

**Windows:**
```bash
# Run the installation script
install_python_deps.bat

# Or manually install
pip install -r requirements.txt
```

**Linux/macOS:**
```bash
# Run the installation script
chmod +x install_python_deps.sh
./install_python_deps.sh

# Or manually install
pip3 install -r requirements.txt
```

### 2. Test Installation

```bash
# Test Python dependencies
python scripts/test_python_deps.py

# Or on Linux/macOS
python3 scripts/test_python_deps.py
```

## Usage

### API Endpoint

```
POST /pdf-extract-tables
```

### Request Parameters

- `files`: PDF files to process (multipart/form-data)
- `detectionMethod`: 'auto', 'manual', or 'all'
- `outputFormat`: 'xlsx', 'csv', or 'xls'
- `preserveFormatting`: boolean (default: true)
- `extractHeaders`: boolean (default: true)
- `mergeTables`: boolean (default: false)
- `pageRange`: string (e.g., '1-5,10,15-20')
- `language`: string (default: 'eng')

### Example Request

```javascript
const formData = new FormData();
formData.append('files', pdfFile);
formData.append('detectionMethod', 'auto');
formData.append('outputFormat', 'xlsx');
formData.append('preserveFormatting', 'true');
formData.append('extractHeaders', 'true');
formData.append('mergeTables', 'false');
formData.append('pageRange', '1-5');
formData.append('language', 'eng');

fetch('/pdf-extract-tables', {
  method: 'POST',
  body: formData
});
```

### Response Format

```json
{
  "success": true,
  "results": [
    {
      "filename": "document.pdf",
      "outputFilename": "tables_document_1234567890.xlsx",
      "downloadUrl": "/pdf-extract-tables/download/tables_document_1234567890.xlsx",
      "originalSize": 1024000,
      "processedSize": 512000,
      "tablesDetected": 3,
      "totalRows": 45,
      "totalColumns": 5,
      "pagesProcessed": 5,
      "detectionMethod": "auto",
      "outputFormat": "xlsx",
      "preserveFormatting": true,
      "extractHeaders": true,
      "mergeTables": false,
      "processingTime": 2500,
      "language": "eng",
      "confidence": 0.85
    }
  ],
  "errors": [],
  "summary": {
    "totalFiles": 1,
    "successfulFiles": 1,
    "failedFiles": 0,
    "detectionMethod": "auto",
    "outputFormat": "xlsx",
    "preserveFormatting": true,
    "extractHeaders": true,
    "mergeTables": false
  }
}
```

## How It Works

### 1. Primary Method (Python + pdfplumber)

1. **PDF Analysis**: Uses pdfplumber to analyze PDF structure
2. **Table Detection**: Multiple detection strategies:
   - Built-in table detection with various settings
   - Text-based pattern recognition
   - Line and shape analysis
3. **Data Extraction**: Extracts table data with proper formatting
4. **Output Generation**: Creates Excel/CSV files using pandas and openpyxl

### 2. Fallback Method (OCR + Tesseract)

If Python method fails:
1. **PDF to Images**: Converts PDF pages to high-resolution images
2. **OCR Processing**: Uses Tesseract for text extraction
3. **Table Parsing**: Analyzes text structure to identify tables
4. **Data Cleaning**: Cleans and normalizes extracted data
5. **Output Generation**: Creates output files using Node.js libraries

## Detection Methods

### Auto Detection
- Uses pdfplumber's intelligent table detection
- Combines multiple detection strategies
- Best for most PDF types

### Manual Selection
- Allows user to specify table boundaries
- Useful for complex layouts
- Requires more user input

### Extract All Content
- Processes all structured data
- Good for documents with mixed content
- May extract non-table data

## Output Formats

### Excel (.xlsx)
- Modern Excel format
- Full formatting support
- Multiple sheets for multiple tables

### CSV (.csv)
- Simple text format
- Good for data analysis
- Single file with all tables

### Legacy Excel (.xls)
- Compatible with older Excel versions
- Limited formatting support

## Configuration Options

### Table Settings
- **Preserve Formatting**: Maintains original table structure
- **Extract Headers**: Uses first row as column headers
- **Merge Tables**: Combines all tables into one file

### Processing Options
- **Page Range**: Process specific pages
- **Language**: OCR language for better accuracy
- **Detection Method**: Choose extraction strategy

## Troubleshooting

### Common Issues

1. **Python not found**
   - Install Python 3.7 or higher
   - Ensure Python is in PATH

2. **Dependencies not installed**
   - Run `pip install -r requirements.txt`
   - Check Python version compatibility

3. **No tables detected**
   - Try different detection methods
   - Check if PDF contains actual tables
   - Verify PDF is not image-based

4. **Poor extraction quality**
   - Use higher resolution settings
   - Try different language settings
   - Check PDF quality

### Debug Mode

Enable debug logging by setting environment variable:
```bash
export DEBUG=pdf-extract-tables
```

## Performance Tips

1. **File Size**: Smaller files process faster
2. **Page Range**: Process only needed pages
3. **Detection Method**: 'auto' is usually fastest
4. **Output Format**: CSV is faster than Excel

## API Integration

### Frontend Integration

```typescript
// Example service call
const extractTables = async (files: File[], options: ExtractTablesOptions) => {
  const formData = new FormData();
  
  files.forEach(file => formData.append('files', file));
  Object.entries(options).forEach(([key, value]) => {
    formData.append(key, value.toString());
  });
  
  const response = await fetch('/pdf-extract-tables', {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};
```

### Error Handling

```typescript
try {
  const result = await extractTables(files, options);
  
  if (result.success) {
    // Process successful results
    result.results.forEach(table => {
      console.log(`Table: ${table.tablesDetected} tables found`);
    });
  } else {
    // Handle errors
    console.error('Extraction failed:', result.error);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

## Advanced Usage

### Custom Table Settings

```python
# Custom pdfplumber settings
table_settings = {
    "vertical_strategy": "lines",
    "horizontal_strategy": "lines",
    "explicit_vertical_lines": [],
    "explicit_horizontal_lines": [],
    "snap_tolerance": 3,
    "join_tolerance": 3,
    "edge_min_length": 3,
    "min_words_vertical": 3,
    "min_words_horizontal": 1,
    "intersection_tolerance": 3,
    "text_tolerance": 3,
    "text_x_tolerance": 3,
    "text_y_tolerance": 3
}
```

### Batch Processing

```javascript
// Process multiple files
const processBatch = async (files) => {
  const results = [];
  
  for (const file of files) {
    try {
      const result = await extractTables([file], options);
      results.push(result);
    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error);
    }
  }
  
  return results;
};
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
