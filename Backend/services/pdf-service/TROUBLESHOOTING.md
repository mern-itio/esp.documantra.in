# PDF Table Extraction Troubleshooting Guide

This guide helps you diagnose and fix common issues with the PDF table extraction functionality.

## Quick Diagnostic

### 1. Check System Status

Visit these endpoints to check your system:

```bash
# Check tool availability
GET /pdf-extract-tables/tools

# Run full diagnostic
GET /pdf-extract-tables/diagnose
```

### 2. Common Error Patterns

#### Python Not Found
```
Error: Python not found. Please install Python 3.7+
```

**Solution:**
- Install Python 3.7+ from [python.org](https://python.org)
- Ensure Python is added to PATH
- Restart your terminal/command prompt

#### Dependencies Missing
```
Error: ModuleNotFoundError: No module named 'pdfplumber'
```

**Solution:**
```bash
# Install dependencies
pip install -r requirements.txt

# Or install individually
pip install pdfplumber pandas openpyxl numpy Pillow opencv-python
```

#### Script Not Found
```
Error: Python script not found
```

**Solution:**
- Ensure `extract_tables_pdfplumber.py` exists in `scripts/` directory
- Check file permissions
- Verify the script is executable

#### Permission Errors
```
Error: Permission denied
```

**Solution:**
- Run as administrator (Windows) or with sudo (Linux/macOS)
- Use virtual environment
- Check file permissions

## Detailed Troubleshooting

### Step 1: Check Python Installation

```bash
# Check Python version
python --version
python3 --version

# Should show Python 3.7 or higher
```

### Step 2: Check Dependencies

```bash
# Test Python dependencies
python scripts/test_python_deps.py

# Expected output:
# ✅ pdfplumber - OK
# ✅ pandas - OK
# ✅ openpyxl - OK
# ✅ numpy - OK
# ✅ PIL - OK
# ✅ cv2 - OK
```

### Step 3: Test Table Extraction

```bash
# Test table extraction
python scripts/test_table_extraction.py

# This will create a sample PDF and test extraction
```

### Step 4: Check Node.js Integration

```bash
# Check if routes are properly configured
curl http://localhost:3000/pdf-extract-tables/tools

# Expected response:
# {
#   "tesseract": { "installed": true, ... },
#   "ghostscript": { "installed": true, ... },
#   "python": { "installed": true, ... },
#   "pythonScript": { "available": true, ... }
# }
```

## Common Issues and Solutions

### Issue 1: Python Script Execution Fails

**Symptoms:**
- Error: "Python script failed"
- Empty output from Python script
- Timeout errors

**Solutions:**
1. **Check Python Path:**
   ```bash
   which python3
   which python
   ```

2. **Test Script Manually:**
   ```bash
   python3 scripts/extract_tables_pdfplumber.py --help
   ```

3. **Check Dependencies:**
   ```bash
   python3 -c "import pdfplumber; print('pdfplumber OK')"
   python3 -c "import pandas; print('pandas OK')"
   python3 -c "import openpyxl; print('openpyxl OK')"
   ```

### Issue 2: PDF Processing Fails

**Symptoms:**
- Error: "Invalid PDF file"
- Error: "PDF has no pages"
- Empty tables detected

**Solutions:**
1. **Check PDF File:**
   - Ensure PDF is not corrupted
   - Verify PDF contains actual tables
   - Check if PDF is password-protected

2. **Test with Sample PDF:**
   ```bash
   python3 scripts/test_table_extraction.py
   ```

3. **Try Different Detection Methods:**
   - Use 'auto' detection method
   - Try 'all' content extraction
   - Test with different page ranges

### Issue 3: Output File Generation Fails

**Symptoms:**
- Error: "Python script did not create output file"
- Empty output files
- Permission denied errors

**Solutions:**
1. **Check Output Directory:**
   ```bash
   ls -la Backend/services/pdf-service/outputs/
   ```

2. **Check Permissions:**
   ```bash
   chmod 755 Backend/services/pdf-service/outputs/
   ```

3. **Test File Creation:**
   ```bash
   touch Backend/services/pdf-service/outputs/test.txt
   rm Backend/services/pdf-service/outputs/test.txt
   ```

### Issue 4: Memory Issues

**Symptoms:**
- Out of memory errors
- Process killed
- Slow performance

**Solutions:**
1. **Reduce File Size:**
   - Process smaller PDFs
   - Use page range to limit processing
   - Split large PDFs

2. **Increase Memory:**
   - Add more RAM
   - Use swap space
   - Process files in batches

3. **Optimize Settings:**
   - Use CSV output instead of Excel
   - Disable formatting preservation
   - Use simpler detection methods

## Advanced Troubleshooting

### Enable Debug Logging

Set environment variable:
```bash
export DEBUG=pdf-extract-tables
```

### Check System Resources

```bash
# Check memory usage
free -h

# Check disk space
df -h

# Check CPU usage
top
```

### Test with Different PDFs

1. **Simple PDF with tables**
2. **Complex PDF with multiple tables**
3. **PDF with merged cells**
4. **PDF with images and tables**

### Monitor Logs

```bash
# Check Node.js logs
tail -f logs/app.log

# Check Python script output
python3 scripts/extract_tables_pdfplumber.py input.pdf --json
```

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

### 2. Optimization Tips

- Use SSD storage for faster I/O
- Increase RAM for large PDFs
- Use page range to process only needed pages
- Choose appropriate output format (CSV is faster than Excel)
- Process files in batches for large datasets

### 3. Memory Management

For large PDFs:
- Process pages in batches
- Use streaming for large files
- Monitor memory usage
- Clean up temporary files

## Getting Help

### 1. Check Logs

Look for these log patterns:
- `Python script failed: [error message]`
- `ModuleNotFoundError: No module named '[module]'`
- `Permission denied`
- `Timeout error`

### 2. Run Diagnostics

```bash
# Full system diagnostic
python3 scripts/diagnose_errors.py

# Test specific components
python3 scripts/test_python_deps.py
python3 scripts/test_table_extraction.py
```

### 3. Test API Endpoints

```bash
# Check tools
curl http://localhost:3000/pdf-extract-tables/tools

# Run diagnostic
curl http://localhost:3000/pdf-extract-tables/diagnose
```

### 4. Report Issues

When reporting issues, include:
- Python version: `python --version`
- Operating system and version
- Error messages and logs
- Steps to reproduce the issue
- Sample PDF file (if possible)

## Quick Fixes

### Reset Environment

```bash
# Remove and reinstall dependencies
pip uninstall pdfplumber pandas openpyxl numpy Pillow opencv-python
pip install -r requirements.txt

# Clear temporary files
rm -rf Backend/services/pdf-service/outputs/*
rm -rf Backend/services/pdf-service/uploads/*
```

### Use Fallback Method

If Python method fails, the system automatically falls back to OCR-based extraction. This is less accurate but more reliable.

### Manual Installation

```bash
# Install packages individually
pip install pdfplumber==0.10.3
pip install pandas==2.1.4
pip install openpyxl==3.1.2
pip install numpy==1.24.3
pip install Pillow==10.1.0
pip install opencv-python==4.8.1.78
```

## Success Indicators

You'll know the system is working when:

1. **Dependencies Check:**
   ```bash
   python3 scripts/test_python_deps.py
   # Shows: ✅ All dependencies are available!
   ```

2. **Tool Check:**
   ```bash
   curl http://localhost:3000/pdf-extract-tables/tools
   # Shows: "python": { "installed": true, ... }
   ```

3. **Test Extraction:**
   ```bash
   python3 scripts/test_table_extraction.py
   # Shows: 🎉 Table extraction test completed successfully!
   ```

4. **API Test:**
   - Upload a PDF with tables
   - Get successful response with extracted tables
   - Download generated Excel/CSV file

## Still Having Issues?

1. Check the detailed error logs in your console
2. Run the diagnostic endpoint: `GET /pdf-extract-tables/diagnose`
3. Test with a simple PDF containing basic tables
4. Verify all dependencies are correctly installed
5. Check file permissions and system resources
