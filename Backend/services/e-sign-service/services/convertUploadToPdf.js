const fs = require('fs');
const path = require('path');
const axios = require('axios');
const PDFDocument = require('pdfkit');

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp']);
const DOC_EXTENSIONS = new Set(['doc', 'docx', 'rtf']);
const TEXT_EXTENSIONS = new Set(['txt']);

function getExtension(filename) {
  return path.extname(String(filename || '')).toLowerCase().replace(/^\./, '');
}

function isPdfFile(file) {
  const ext = getExtension(file.originalname || file.filename);
  return ext === 'pdf' || String(file.mimetype || '').toLowerCase() === 'application/pdf';
}

function getPdfServiceBaseUrl() {
  return String(process.env.PDF_SERVICE_URL || 'http://pdf-service:2104').replace(/\/$/, '');
}

function imageToPdfLocal(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    try {
      const image = doc.openImage(inputPath);
      doc.addPage({ size: [image.width, image.height] });
      doc.image(inputPath, 0, 0);
      doc.end();
    } catch (err) {
      stream.destroy();
      reject(err);
      return;
    }

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

async function fetchConvertedPdfBuffer(downloadPath) {
  const baseUrl = getPdfServiceBaseUrl();
  const url = downloadPath.startsWith('http')
    ? downloadPath
    : `${baseUrl}${downloadPath.startsWith('/') ? '' : '/'}${downloadPath}`;
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 120000,
    maxContentLength: 100 * 1024 * 1024,
  });
  return Buffer.from(response.data);
}

async function convertViaPdfService(filePath, originalName, mimeType) {
  const FormData = require('form-data');
  const ext = getExtension(originalName);
  const baseUrl = getPdfServiceBaseUrl();
  const form = new FormData();

  let endpoint;
  let fieldName;

  if (IMAGE_EXTENSIONS.has(ext)) {
    endpoint = `${baseUrl}/convert/images-to-pdf`;
    fieldName = 'images';
  } else if (DOC_EXTENSIONS.has(ext)) {
    endpoint = `${baseUrl}/pdf/doc-to-pdf`;
    fieldName = 'document';
  } else if (TEXT_EXTENSIONS.has(ext)) {
    endpoint = `${baseUrl}/pdf/txt-to-pdf`;
    fieldName = 'document';
  } else {
    throw new Error(`Unsupported file type for signing: .${ext || 'unknown'}`);
  }

  form.append(fieldName, fs.createReadStream(filePath), {
    filename: originalName,
    contentType: mimeType || 'application/octet-stream',
  });

  const response = await axios.post(endpoint, form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 180000,
  });

  if (endpoint.includes('images-to-pdf')) {
    const downloadPath = response.data?.pdf || response.data?.downloadUrl;
    if (!downloadPath) {
      throw new Error('Image conversion did not return a PDF path');
    }
    return fetchConvertedPdfBuffer(downloadPath);
  }

  const downloadPath = response.data?.downloadUrl;
  if (!downloadPath) {
    throw new Error('Document conversion did not return a PDF path');
  }
  return fetchConvertedPdfBuffer(downloadPath);
}

async function normalizeUploadToPdf(file) {
  if (!file?.path) {
    throw new Error('Uploaded file path is missing');
  }

  if (isPdfFile(file)) {
    return {
      filePath: file.path,
      fileName: file.filename,
      mimeType: 'application/pdf',
      converted: false,
      originalName: file.originalname,
      size: file.size,
    };
  }

  const ext = getExtension(file.originalname || file.filename);
  const outputName = `${path.basename(file.filename, path.extname(file.filename))}.pdf`;
  const outputPath = path.join(path.dirname(file.path), outputName);

  try {
    if (IMAGE_EXTENSIONS.has(ext)) {
      try {
        await imageToPdfLocal(file.path, outputPath);
      } catch (localErr) {
        console.warn('Local image-to-PDF failed, trying pdf-service:', localErr.message);
        const buffer = await convertViaPdfService(file.path, file.originalname, file.mimetype);
        fs.writeFileSync(outputPath, buffer);
      }
    } else {
      const buffer = await convertViaPdfService(file.path, file.originalname, file.mimetype);
      fs.writeFileSync(outputPath, buffer);
    }
  } finally {
    if (file.path !== outputPath && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }

  const stats = fs.statSync(outputPath);

  return {
    filePath: outputPath,
    fileName: outputName,
    mimeType: 'application/pdf',
    converted: true,
    originalName: file.originalname,
    size: stats.size,
  };
}

module.exports = {
  normalizeUploadToPdf,
  isPdfFile,
  IMAGE_EXTENSIONS,
  DOC_EXTENSIONS,
  TEXT_EXTENSIONS,
};
