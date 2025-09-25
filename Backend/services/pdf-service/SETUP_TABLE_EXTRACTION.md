# PDF Table Extraction Setup Guide

This guide will help you set up the advanced PDF table extraction functionality using pdfplumber, pandas, and openpyxl.

## Prerequisites

- Python 3.7 or higher
- Node.js 14 or higher
- pip (Python package manager)

## Quick Setup

### 1. Install Python Dependencies

**Windows:**
```cmd
# Navigate to the pdf-service directory
cd Backend/services/pdf-service

# Run the installation script
install_python_deps.bat
```

**Linux/macOS:**
```bash
# Navigate to the pdf-service directory
cd Backend/services/pdf-service

# Make the script executable and run it
chmod +x install_python_deps.sh
./install_python_deps.sh
```

**Manual Installation:**
```bash
# Install dependencies manually
pip install -r requirements.txt
```

### 2. Test the Installation

```bash
# Test Python dependencies
python scripts/test_python_deps.py

# Test table extraction (creates a sample PDF if needed)
python scripts/test_table_extraction.py
```

### 3. Start the Service

```bash
# Start the Node.js service
npm start

# Or for development
npm run dev
```

## Detailed Setup

### Step 1: Verify Python Installation

```bash
# Check Python version (should be 3.7+)
python --version

# Check pip
pip --version
```

### Step 2: Install Python Dependencies

The following packages will be installed:

- **pdfplumber**: Advanced PDF table extraction
- **pandas**: Data manipulation and analysis
- **openpyxl**: Excel file generation
- **numpy**: Numerical computing
- **Pillow**: Image processing
- **opencv-python**: Computer vision

```bash
pip install pdfplumber==0.10.3
pip install pandas==2.1.4
pip install openpyxl==3.1.2
pip install numpy==1.24.3
pip install Pillow==10.1.0
pip install opencv-python==4.8.1.78
```

### Step 3: Test Dependencies

```bash
# Test all dependencies
python scripts/test_python_deps.py
```

Expected output:
```
🧪 Testing Python dependencies for PDF table extraction...
==============================================================
✅ pdfplumber - OK
✅ pandas - OK
✅ openpyxl - OK
✅ numpy - OK
✅ PIL - OK
✅ cv2 - OK

✅ All dependencies are available!

🔍 Testing pdfplumber...
✅ pdfplumber imported successfully
✅ pdfplumber is ready for table extraction

🔍 Testing pandas...
✅ pandas DataFrame creation works
✅ pandas is ready for data processing

🔍 Testing openpyxl...
✅ openpyxl workbook creation works
✅ openpyxl is ready for Excel file generation

🎉 All tests passed! Python environment is ready for table extraction.
```

### Step 4: Test Table Extraction

```bash
# Test table extraction functionality
python scripts/test_table_extraction.py
```

This will:
1. Create a sample PDF with tables (if needed)
2. Test table extraction with different methods
3. Generate output files
4. Show extraction statistics

### Step 5: Start the Service

```bash
# Install Node.js dependencies (if not already done)
npm install

# Start the service
npm start
```

## Troubleshooting

### Common Issues

#### 1. Python Not Found
```
❌ Python is not installed. Please install Python 3 first.
```

**Solution:**
- Install Python 3.7+ from [python.org](https://python.org)
- Ensure Python is added to PATH
- Restart terminal/command prompt

#### 2. pip Not Found
```
❌ pip is not installed. Please install pip first.
```

**Solution:**
- Install pip: `python -m ensurepip --upgrade`
- Or download get-pip.py and run: `python get-pip.py`

#### 3. Dependencies Installation Failed
```
❌ Failed to install dependencies
```

**Solutions:**
- Update pip: `pip install --upgrade pip`
- Use virtual environment: `python -m venv venv && venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Linux/macOS)
- Install dependencies one by one to identify the problematic package

#### 4. Import Errors
```
❌ pdfplumber - FAILED: No module named 'pdfplumber'
```

**Solution:**
- Reinstall the specific package: `pip install pdfplumber`
- Check Python path and virtual environment
- Try installing with `--user` flag: `pip install --user pdfplumber`

#### 5. Permission Errors
```
❌ Permission denied
```

**Solutions:**
- Use `--user` flag: `pip install --user -r requirements.txt`
- Run as administrator (Windows) or with sudo (Linux/macOS)
- Use virtual environment

### Advanced Troubleshooting

#### Check Python Environment
```bash
# Check Python path
python -c "import sys; print(sys.path)"

# Check installed packages
pip list

# Check specific package
python -c "import pdfplumber; print(pdfplumber.__version__)"
```

#### Virtual Environment Setup
```bash
# Create virtual environment
python -m venv pdf_extraction_env

# Activate (Windows)
pdf_extraction_env\Scripts\activate

# Activate (Linux/macOS)
source pdf_extraction_env/bin/activate

# Install dependencies
pip install -r requirements.txt

# Test
python scripts/test_python_deps.py
```

#### Manual Package Installation
```bash
# Install packages individually
pip install pdfplumber
pip install pandas
pip install openpyxl
pip install numpy
pip install Pillow
pip install opencv-python
```

## Configuration

### Environment Variables

Set these environment variables for custom configuration:

```bash
# Python path (if not in system PATH)
export PYTHON_PATH=/path/to/python

# Debug mode
export DEBUG=pdf-extract-tables

# Log level
export LOG_LEVEL=INFO
```

### Custom Settings

Edit `extract_tables_pdfplumber.py` to customize:

- Table detection settings
- Output format options
- Processing parameters
- Error handling

## Performance Optimization

### 1. System Requirements

**Minimum:**
- RAM: 4GB
- CPU: 2 cores
- Storage: 1GB free space

**Recommended:**
- RAM: 8GB+
- CPU: 4+ cores
- Storage: 5GB+ free space

### 2. Performance Tips

- Use SSD storage for faster I/O
- Increase RAM for large PDFs
- Use page range to process only needed pages
- Choose appropriate output format (CSV is faster than Excel)

### 3. Memory Management

For large PDFs:
- Process pages in batches
- Use streaming for large files
- Monitor memory usage
- Clean up temporary files

## API Usage

### Basic Request

```javascript
const formData = new FormData();
formData.append('files', pdfFile);
formData.append('detectionMethod', 'auto');
formData.append('outputFormat', 'xlsx');

fetch('/pdf-extract-tables', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

### Advanced Options

```javascript
const options = {
  detectionMethod: 'auto',     // 'auto', 'manual', 'all'
  outputFormat: 'xlsx',        // 'xlsx', 'csv', 'xls'
  preserveFormatting: true,    // boolean
  extractHeaders: true,         // boolean
  mergeTables: false,          // boolean
  pageRange: '1-5,10,15-20',   // string
  language: 'eng'              // string
};
```

## Support

### Getting Help

1. Check the troubleshooting section above
2. Review the README_TABLE_EXTRACTION.md for detailed documentation
3. Test with the provided test scripts
4. Check logs for error messages

### Reporting Issues

When reporting issues, include:
- Python version: `python --version`
- Operating system and version
- Error messages and logs
- Steps to reproduce the issue
- Sample PDF file (if possible)

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
