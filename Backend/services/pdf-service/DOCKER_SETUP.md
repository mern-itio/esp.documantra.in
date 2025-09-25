# Docker Setup for PDF Table Extraction

This guide explains how to set up the PDF table extraction functionality in Docker.

## 🐳 **Docker Configuration**

### Updated Dockerfile Features:

1. **Enhanced Python Support:**
   - Python 3 with virtual environment
   - All required system packages
   - Multiple Tesseract language packs
   - OpenCV dependencies

2. **Python Dependencies:**
   - pdfplumber for advanced table extraction
   - pandas for data processing
   - openpyxl for Excel file generation
   - numpy for numerical computing
   - opencv-python for image processing

3. **System Packages:**
   - Tesseract OCR with multiple languages
   - Ghostscript for PDF processing
   - ImageMagick for image manipulation
   - All required build tools

## 🚀 **Building the Docker Image**

### 1. Build the Image
```bash
# From the project root
docker build -t pdf-service -f Backend/services/pdf-service/Dockerfile .
```

### 2. Run the Container
```bash
# Run with volume mounts for development
docker run -p 2104:2104 -v $(pwd)/Backend/services/pdf-service:/app/services/pdf-service pdf-service

# Or run in detached mode
docker run -d -p 2104:2104 --name pdf-service pdf-service
```

### 3. Test the Installation
```bash
# Check if Python dependencies are working
docker exec pdf-service python scripts/test_python_deps.py

# Test table extraction script
docker exec pdf-service python scripts/extract_tables_pdfplumber.py --help
```

## 🔧 **Docker Compose Setup**

### docker-compose.yml
```yaml
version: '3.8'

services:
  pdf-service:
    build:
      context: .
      dockerfile: Backend/services/pdf-service/Dockerfile
    ports:
      - "2104:2104"
    volumes:
      - ./Backend/services/pdf-service/uploads:/app/services/pdf-service/uploads
      - ./Backend/services/pdf-service/outputs:/app/services/pdf-service/outputs
    environment:
      - NODE_ENV=development
      - DEBUG=pdf-extract-tables
    command: npm run dev
```

### Run with Docker Compose
```bash
# Start the service
docker-compose up pdf-service

# Run in detached mode
docker-compose up -d pdf-service

# View logs
docker-compose logs -f pdf-service
```

## 🧪 **Testing in Docker**

### 1. Test Python Dependencies
```bash
# Run inside container
docker exec pdf-service python scripts/test_python_deps.py

# Expected output:
# ✅ pdfplumber - OK
# ✅ pandas - OK
# ✅ openpyxl - OK
# ✅ numpy - OK
# ✅ PIL - OK
# ✅ cv2 - OK
```

### 2. Test Table Extraction
```bash
# Test with invalid file
docker exec pdf-service python scripts/extract_tables_pdfplumber.py nonexistent.pdf --json

# Expected output:
# {"success": false, "error": "PDF file not found: nonexistent.pdf", "tables_found": 0, "output_file": null}
```

### 3. Test API Endpoints
```bash
# Check tools
curl http://localhost:2104/pdf-extract-tables/tools

# Run diagnostic
curl http://localhost:2104/pdf-extract-tables/diagnose
```

## 🔍 **Troubleshooting Docker Issues**

### Common Issues:

#### 1. Python Dependencies Not Found
```bash
# Check if virtual environment is active
docker exec pdf-service which python
docker exec pdf-service python --version

# Reinstall dependencies
docker exec pdf-service pip install -r requirements.txt
```

#### 2. Script Execution Fails
```bash
# Check script permissions
docker exec pdf-service ls -la scripts/

# Make scripts executable
docker exec pdf-service chmod +x scripts/*.py
```

#### 3. Memory Issues
```bash
# Check container resources
docker stats pdf-service

# Increase memory limit
docker run -m 4g -p 2104:2104 pdf-service
```

### Debug Commands:

```bash
# Enter container shell
docker exec -it pdf-service bash

# Check Python environment
python -c "import sys; print(sys.path)"
python -c "import pdfplumber; print('pdfplumber OK')"

# Check file permissions
ls -la scripts/
```

## 📊 **Performance Optimization**

### 1. Resource Limits
```yaml
# In docker-compose.yml
services:
  pdf-service:
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2.0'
        reservations:
          memory: 2G
          cpus: '1.0'
```

### 2. Volume Optimization
```yaml
# Use named volumes for better performance
volumes:
  pdf-uploads:
  pdf-outputs:

services:
  pdf-service:
    volumes:
      - pdf-uploads:/app/services/pdf-service/uploads
      - pdf-outputs:/app/services/pdf-service/outputs
```

### 3. Multi-stage Build
```dockerfile
# Use multi-stage build to reduce image size
FROM node:20 as builder
# ... build steps ...

FROM node:20 as runtime
# ... runtime steps ...
```

## 🚀 **Production Deployment**

### 1. Production Dockerfile
```dockerfile
FROM node:20-alpine

# Install system packages
RUN apk add --no-cache \
    python3 \
    py3-pip \
    tesseract-ocr \
    ghostscript \
    imagemagick

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Set permissions
RUN chmod +x scripts/*.py

# Expose port
EXPOSE 2104

# Start application
CMD ["npm", "start"]
```

### 2. Health Checks
```yaml
# In docker-compose.yml
services:
  pdf-service:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:2104/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 📝 **Environment Variables**

### Required Environment Variables:
```bash
# Python environment
PYTHON_PATH=/opt/venv/bin/python

# Node.js environment
NODE_ENV=production
PORT=2104

# Debug mode
DEBUG=pdf-extract-tables
```

### Docker Environment:
```yaml
# In docker-compose.yml
environment:
  - PYTHON_PATH=/opt/venv/bin/python
  - NODE_ENV=production
  - DEBUG=pdf-extract-tables
```

## 🔧 **Development Workflow**

### 1. Local Development
```bash
# Build and run
docker-compose up --build pdf-service

# View logs
docker-compose logs -f pdf-service

# Restart service
docker-compose restart pdf-service
```

### 2. Testing Changes
```bash
# Rebuild after changes
docker-compose up --build pdf-service

# Test specific functionality
docker exec pdf-service python scripts/test_python_deps.py
```

### 3. Debugging
```bash
# Enter container
docker exec -it pdf-service bash

# Check logs
docker logs pdf-service

# Monitor resources
docker stats pdf-service
```

## ✅ **Verification Checklist**

- [ ] Docker image builds successfully
- [ ] Python dependencies are installed
- [ ] Python scripts are executable
- [ ] Node.js service starts correctly
- [ ] API endpoints respond
- [ ] Table extraction works
- [ ] Error handling works
- [ ] Logs are properly formatted

## 🎉 **Success Indicators**

You'll know the Docker setup is working when:

1. **Build Success:**
   ```
   Successfully built [image-id]
   Successfully tagged pdf-service:latest
   ```

2. **Python Dependencies:**
   ```
   ✅ All dependencies are available!
   🎉 All tests passed! Python environment is ready for table extraction.
   ```

3. **API Response:**
   ```json
   {
     "tesseract": { "installed": true },
     "ghostscript": { "installed": true },
     "python": { "installed": true },
     "pythonScript": { "available": true }
   }
   ```

4. **Table Extraction:**
   - Upload a PDF with tables
   - Get successful response
   - Download generated Excel/CSV file
