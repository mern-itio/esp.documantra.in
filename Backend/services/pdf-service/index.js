const express = require('express');
const verifyJWT  = require('@draftnsign/auth-lib');
const cors = require('cors');
const dotenv = require('dotenv');
const pdfRoutes = require('./routes/pdfRoutes');
const conversionRoutes = require('./routes/pdftoImage');
const pdfTextEditRoutes = require('./routes/pdfTextEditRoutes');
const mergePdfRoutes = require('./routes/mergePdfRoutes');
const splitPdfRoutes = require('./routes/pdfSplitRoutes');
const extractPdfRoutes = require('./routes/pdfExtractRoutes');
const deletePdfPagesRoutes = require('./routes/deletePdfPagesRoute');
const reorderPdfPagesRoutes = require('./routes/reorderPdfPagesRoute');
const rotatePdfPagesRoutes = require('./routes/rotatePdfPagesRoute');
const cropPdfPagesRoutes = require('./routes/cropPdfPagesRoute');
const insertPdfPagesRoutes = require('./routes/insertPdfPagesRoute');
const addPageNumbersRoutes = require('./routes/addPageNumbersRoute');
const addHeaderFooterRoutes = require('./routes/addHeaderFooterRoute');
const addPasswordRoutes = require('./routes/addPasswordRoute');
const removePasswordRoutes = require('./routes/removePasswordRoute');
const digitalSignatureRoutes = require('./routes/digitalSignatureRoute');
const setPermissionsRoutes = require('./routes/setPermissionsRoute');
const addWatermarkRoutes = require('./routes/addWatermarkRoute');
const removeMetadataRoutes = require('./routes/removeMetadataRoute');
const compressPDFRoutes = require('./routes/compressPDFRoute');
const optimizeImageRoutes = require('./routes/optimizeImageRoute');
const optimizeFontRoutes = require('./routes/optimizeFontRoute');
const removeUnusedObjectsRoutes = require('./routes/removeUnusedObjectsRoute');
const linearizePDFRoutes = require('./routes/linearizePDFRoute');
const colorOptimizationRoutes = require('./routes/colorOptimizationRoute');
const qualityAnalysisRoutes = require('./routes/qualityAnalysisRoute');
const documentTrackingRoutes = require('./routes/documentTrackingRoute');
const batchOptimizationRoutes = require('./routes/batchOptimizationRoute');
const ocrRoutes = require('./routes/ocrRoute');
const makeSearchableRoutes = require('./routes/makeSearchableRoute');
const extractTablesRoutes = require('./routes/extractTablesRoute');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs-extra');
const helmet = require('helmet');


dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: "*"
}));

// Configure helmet with CSP that allows iframe embedding for outputs
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      frameSrc: ["'self'", "http://localhost:2104", "http://165.22.215.73:2104"],
      frameAncestors: ["'self'", "http://localhost:3000", "http://localhost:5173", "http://165.22.215.73:3000"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      formAction: ["'self'"]
    }
  }
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve PDF.js library files with proper MIME types for ES modules
app.use('/pdfjs', (req, res, next) => {
  if (req.url.endsWith('.mjs')) {
    res.setHeader('Content-Type', 'application/javascript');
  }
  next();
}, express.static(path.join(__dirname, 'public')));

// DB Connection
connectDB();

// Ensure outputs directory exists
const outputsDir = path.join(__dirname, 'outputs');
fs.ensureDirSync(outputsDir);
console.log(`PDF Service: Outputs directory ensured at: ${outputsDir}`);

// Ensure epubs directory exists
const epubsDir = path.join(__dirname, 'epubs');
fs.ensureDirSync(epubsDir);
console.log(`PDF Service: EPUBs directory ensured at: ${epubsDir}`);

// Cleanup old files every hour (files older than 24 hours)
setInterval(async () => {
  try {
    const files = await fs.readdir(outputsDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    for (const file of files) {
      const filePath = path.join(outputsDir, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.remove(filePath);
        console.log(`Cleaned up old file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}, 60 * 60 * 1000); // Run every hour

// Health check route (no auth required)
app.get('/health', (req, res) => {
  res.send(`PDF service is running ${req.user?.data?.fullname || ''}`);
});

// Add debugging middleware for /outputs requests
app.use('/outputs', (req, res, next) => {
  console.log(`PDF Service: Static file request for: ${req.url}`);
  console.log(`PDF Service: Full path: ${path.join(__dirname, 'outputs', req.url)}`);
  
  // Set headers to allow iframe embedding for PDF files
  if (req.url.endsWith('.pdf')) {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:3000 http://localhost:5173 http://165.22.215.73:3000");
  }
  
  next();
});

// Serve converted files (outputs directory) - no auth required
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));

// Special handler for PDF files to allow iframe embedding
app.get('/outputs/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'outputs', req.params.filename);

  if (fs.existsSync(filePath)) {
    // Allow iframe embedding
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader(
      'Content-Security-Policy',
      "frame-ancestors 'self' http://localhost:3000 http://localhost:5173 http://165.22.215.73:3000"
    );
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.sendFile(filePath);
  } else {
    res.status(404).send('PDF file not found');
  }
});

// Direct download route for remove metadata files - no auth required
app.get('/pdf-remove-metadata/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'outputs', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving download file:', error);
    res.status(500).json({ error: 'Failed to serve download file' });
  }
});

// Direct download route for compressed PDF files - no auth required
app.get('/pdf-compress/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'outputs', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving download file:', error);
    res.status(500).json({ error: 'Failed to serve download file' });
  }
});

// Direct download route for optimized image PDF files - no auth required
app.get('/pdf-optimize-image/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'outputs', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving download file:', error);
    res.status(500).json({ error: 'Failed to serve download file' });
  }
});

// Direct download route for optimized font PDF files - no auth required
app.get('/pdf-optimize-font/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'outputs', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving download file:', error);
    res.status(500).json({ error: 'Failed to serve download file' });
  }
});

// Direct download route for remove unused objects PDF files - no auth required
app.get('/pdf-remove-unused-objects/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'outputs', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving download file:', error);
    res.status(500).json({ error: 'Failed to serve download file' });
  }
});

// Direct download route for linearized PDF files - no auth required
app.get('/pdf-linearize/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'outputs', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving download file:', error);
    res.status(500).json({ error: 'Failed to serve download file' });
  }
});

// Direct download route for color optimized PDF files - no auth required
app.get('/pdf-color-optimization/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'outputs', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving download file:', error);
    res.status(500).json({ error: 'Failed to serve download file' });
  }
});

// Direct download route for batch optimization files - no auth required
app.get('/pdf-batch-optimization/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'outputs', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    let contentDisposition = `attachment; filename="${filename}"`;

    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.zip') {
      contentType = 'application/zip';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving batch optimization download file:', error);
    res.status(500).json({ error: 'Failed to serve download file' });
  }
});

app.get('/pdf-ocr/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'outputs', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    let contentDisposition = `attachment; filename="${filename}"`;

    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.txt') {
      contentType = 'text/plain';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving OCR download file:', error);
    res.status(500).json({ error: 'Failed to serve download file' });
  }
});

app.get('/pdf-make-searchable/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'outputs', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    let contentDisposition = `attachment; filename="${filename}"`;

    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.txt') {
      contentType = 'text/plain';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving Make Searchable download file:', error);
    res.status(500).json({ error: 'Failed to serve download file' });
  }
});

app.get('/pdf-extract-tables/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'outputs', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    let contentDisposition = `attachment; filename="${filename}"`;

    if (ext === '.xlsx') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (ext === '.csv') {
      contentType = 'text/csv';
    } else if (ext === '.xls') {
      contentType = 'application/vnd.ms-excel';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving Extract Tables download file:', error);
    res.status(500).json({ error: 'Failed to serve download file' });
  }
});


app.use("/uploads", express.static("uploads"));
app.use("/images", express.static("images"));
app.use("/epubs", express.static("epubs")); // Serve EPUB files

// Serve PDF files from root directory - no auth required
app.get('/converted_*.pdf', (req, res, next) => {
  console.log(`PDF Service: Converted PDF file request for: ${req.url}`);
  const pdfPath = path.join(__dirname, req.url);
  console.log(`PDF Service: Full PDF path: ${pdfPath}`);
  
  if (fs.existsSync(pdfPath)) {
    console.log(`PDF Service: PDF file found, serving: ${pdfPath}`);
    res.sendFile(pdfPath);
  } else {
    console.log(`PDF Service: PDF file not found: ${pdfPath}`);
    res.status(404).send('PDF file not found');
  }
});

// Note: Removed conflicting PDF route that was intercepting requests
// PDF files are now handled by specific routes in addPageNumbersRoutes
app.use('/pdf', pdfRoutes);
app.use('/convert', conversionRoutes);
app.use('/pdf-text-edit', pdfTextEditRoutes);
app.use('/pdf-service', mergePdfRoutes);
app.use('/pdf-split', splitPdfRoutes);
app.use('/pdf-extract', extractPdfRoutes);
app.use('/pdf-delete', deletePdfPagesRoutes);
app.use('/pdf-reorder', reorderPdfPagesRoutes);
app.use('/pdf-rotate', rotatePdfPagesRoutes);
app.use('/pdf-crop', cropPdfPagesRoutes);
app.use('/pdf-insert', insertPdfPagesRoutes);
app.use('/pdf-page-numbers', addPageNumbersRoutes);
app.use('/pdf-header-footer', addHeaderFooterRoutes);
app.use('/pdf-password', addPasswordRoutes);
app.use('/pdf-remove-password', removePasswordRoutes);
app.use('/pdf-digital-signature', digitalSignatureRoutes);
app.use('/pdf-permissions', setPermissionsRoutes);
app.use('/pdf-watermark', addWatermarkRoutes);
app.use('/pdf-remove-metadata', removeMetadataRoutes);
app.use('/pdf-compress', compressPDFRoutes);
app.use('/pdf-optimize-image', optimizeImageRoutes);
app.use('/pdf', optimizeFontRoutes);
app.use('/pdf-remove-unused-objects', removeUnusedObjectsRoutes);
app.use('/pdf-linearize', linearizePDFRoutes);
app.use('/pdf-color-optimization', colorOptimizationRoutes);
app.use('/pdf-quality-analysis', qualityAnalysisRoutes);
app.use('/pdf-batch-optimization', batchOptimizationRoutes);
app.use('/pdf-ocr', ocrRoutes);
app.use('/pdf-make-searchable', makeSearchableRoutes);
app.use('/pdf-extract-tables', extractTablesRoutes);
   
   // Protected routes that require authentication
   app.use('/document-tracking', verifyJWT(process.env.ACCESS_TOKEN_SECRET), documentTrackingRoutes);

// Add debugging for route matching
app.use((req, res, next) => {
  console.log(`PDF Service: Route not matched: ${req.method} ${req.url}`);
  next();
});

// Conversion routes


// Start server
const PORT = process.env.PORT || 2104;
app.listen(PORT, () => console.log(`PDF Service running on ${PORT}/`));
