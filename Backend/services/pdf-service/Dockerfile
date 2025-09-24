FROM node:20

# Install system packages + Python venv
RUN apt-get update && apt-get install -y \
    qpdf \
    exiftool \
    ghostscript \
    tesseract-ocr \
    imagemagick \
    pdftk \
    enscript \
    aspell aspell-en \
    poppler-utils \
    python3-full \
    python3-venv \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app

# Copy requirements first
COPY services/pdf-service/requirements.txt ./services/pdf-service/

# Create venv + install Python deps inside it
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir -r ./services/pdf-service/requirements.txt

# Add venv to PATH
ENV PATH="/opt/venv/bin:$PATH"

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

CMD ["npm", "run", "dev"]
