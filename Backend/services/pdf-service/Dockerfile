FROM node:20

# Install qpdf, exiftool, ghostscript, and imagemagick for PDF processing functionality
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
    python3-pip \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app

# Copy requirements.txt first for better Docker layer caching
COPY services/pdf-service/requirements.txt ./services/pdf-service/

# Install Python dependencies
RUN pip3 install --break-system-packages -r ./services/pdf-service/requirements.txt
# Copy package.json and package-lock.json for local packages first
COPY packages/auth-lib/package*.json ./packages/auth-lib/
COPY packages/validators/package*.json ./packages/validators/

# Copy package.json and package-lock.json for service
COPY services/pdf-service/package*.json ./services/pdf-service/

# Copy all code after package.json (to leverage docker cache)
COPY packages/auth-lib ./packages/auth-lib
COPY packages/validators ./packages/validators
COPY services/pdf-service ./services/pdf-service

# Make Python scripts executable
RUN chmod +x ./services/pdf-service/scripts/*.py

# Install dependencies inside local packages
WORKDIR /app/packages/auth-lib
RUN npm install

WORKDIR /app/packages/validators
RUN npm install

# Install service dependencies (links local packages)
WORKDIR /app/services/pdf-service
RUN npm install --legacy-peer-deps && npm install -g nodemon

EXPOSE 2104

CMD ["npm", "run", "dev"]
