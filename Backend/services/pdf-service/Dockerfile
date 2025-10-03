FROM node:20

# Install system packages + Python venv + LibreOffice
RUN apt-get update && apt-get install -y \
    qpdf \
    exiftool \
    libimage-exiftool-perl \
    ghostscript \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-fra \
    tesseract-ocr-deu \
    tesseract-ocr-spa \
    tesseract-ocr-ita \
    tesseract-ocr-por \
    tesseract-ocr-rus \
    tesseract-ocr-jpn \
    tesseract-ocr-kor \
    tesseract-ocr-chi-sim \
    tesseract-ocr-chi-tra \
    tesseract-ocr-ara \
    imagemagick \
    pdftk \
    enscript \
    aspell aspell-en \
    poppler-utils \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    libreoffice-draw \
    libreoffice-math \
    python3-full \
    python3-venv \
    python3-pip \
    python3-dev \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    xvfb \
    fonts-dejavu \
    fonts-liberation \
    fonts-noto-core \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app

# Copy requirements first
COPY services/pdf-service/requirements.txt ./services/pdf-service/

# Create venv + install Python deps inside it
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && /opt/venv/bin/pip install --no-cache-dir -r ./services/pdf-service/requirements.txt \
    && /opt/venv/bin/pip install --upgrade PyMuPDF==1.23.16

# Add venv to PATH
ENV PATH="/opt/venv/bin:$PATH"

# Test Python installation
RUN python -c "import pdfplumber, pandas, openpyxl, numpy, cv2; print('Python dependencies installed successfully')"

# Copy Node package manifests
COPY packages/auth-lib/package*.json ./packages/auth-lib/
COPY packages/validators/package*.json ./packages/validators/
COPY services/pdf-service/package*.json ./services/pdf-service/

# Copy code
COPY packages/auth-lib ./packages/auth-lib
COPY packages/validators ./packages/validators
COPY services/pdf-service ./services/pdf-service

# Make Python scripts executable
RUN chmod +x ./services/pdf-service/scripts/*.py


# Install local Node deps
WORKDIR /app/packages/auth-lib
RUN npm install

WORKDIR /app/packages/validators
RUN npm install

WORKDIR /app/services/pdf-service
RUN npm install --legacy-peer-deps && npm install -g nodemon

EXPOSE 2104

CMD ["node", "--expose-gc", "node_modules/nodemon/bin/nodemon.js", "index.js"]
