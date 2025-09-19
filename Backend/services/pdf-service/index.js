const express = require('express');
const verifyJWT  = require('@draftnsign/auth-lib');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const multer = require('multer');
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
const editMetadataRoutes = require('./routes/editMetadataRoute');
const spellCheckRoutes = require('./routes/spellCheckRoute');
const findReplaceRoutes = require('./routes/findReplaceRoute');
const redactRoutes = require('./routes/redactRoute');
const stampRoutes = require('./routes/stampRoute');
const commentRoutes = require('./routes/commentRoute');
const dbCommentRoutes = require('./routes/dbCommentRoute');
const highlightRoutes = require('./routes/highlightRoute');
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
const handwritingRecognitionRoutes = require('./routes/handwritingRecognitionRoute');
const createPdfFormRoutes = require('./routes/createPdfFormRoute');
const fillPdfFormRoutes = require('./routes/fillPdfFormRoute');
const formRecognitionRoutes = require('./routes/formRecognitionRoute');
const calculateFieldsRoutes = require('./routes/calculateFieldsRoute');
const pdfInfoRoutes = require('./routes/pdfInfoRoute');
const pdfValidatorRoutes = require('./routes/pdfValidatorRoute');
const pdfCompareRoutes = require('./routes/pdfCompareRoute');
const pdfRepairRoutes = require('./routes/pdfRepairRoute');
const pdfBookmarksRoutes = require('./routes/pdfBookmarksRoute');
const pdfStatisticsRoutes = require('./routes/pdfStatisticsRoute');
const advancedPdfEditorRoutes = require('./routes/advancedPdfEditorRoutes');
const analyticsRoutes = require('./routes/analyticsRoute');
const cloudConnectorRoutes = require('./routes/cloudConnectorRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const smartConversionRoutes = require('./routes/smartConversionRoute');
const documentTrackingController = require('./controllers/documentTrackingController');
const { trackPdfOperation, trackBatchOperation } = require('./middleware/operationTracking');
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

// Session middleware for OAuth state management
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Configure helmet with CSP that allows iframe embedding for outputs
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      frameSrc: ["'self'", "http://localhost:2104", "http://165.22.215.73:2104", "http://165.22.215.73:8081"],
      frameAncestors: ["'self'", "http://localhost:3000", "http://localhost:5173", "http://165.22.215.73:3000", "http://165.22.215.73:8081"],
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
  // Set CORS headers for PDF.js files
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.url.endsWith('.mjs')) {
    res.setHeader('Content-Type', 'application/javascript');
  }
  next();
}, express.static(path.join(__dirname, 'public')));

// Specific route for PDF.js files with better error handling
app.get('/pdfjs/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', filename);
  
  
  if (fs.existsSync(filePath)) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Set proper MIME type
    if (filename.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'PDF.js file not found' });
  }
});

// DB Connection
connectDB();

// Ensure outputs directory exists
const outputsDir = path.join(__dirname, 'outputs');
fs.ensureDirSync(outputsDir);

// Ensure epubs directory exists
const epubsDir = path.join(__dirname, 'epubs');
fs.ensureDirSync(epubsDir);

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
  
  // Set headers to allow iframe embedding for PDF files
  if (req.url.endsWith('.pdf')) {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:3000 http://localhost:5173 http://165.22.215.73:8081");
  }
  
  next();
});

// Serve converted files (outputs directory) - no auth required
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));

// Serve PDF repair outputs with API path
app.use('/api/pdf-service/outputs', express.static(path.join(__dirname, 'outputs')));

// Special handler for PDF files to allow iframe embedding
app.get('/outputs/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'outputs', req.params.filename);

  if (fs.existsSync(filePath)) {
    // Allow iframe embedding
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader(
      'Content-Security-Policy',
      "frame-ancestors 'self' http://localhost:3000 http://localhost:5173 http://165.22.215.73:8081"
    );
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.sendFile(filePath);
  } else {
    res.status(404).send('PDF file not found');
  }
});

// Special handler for API path PDF files
app.get('/api/pdf-service/outputs/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'outputs', req.params.filename);

  if (fs.existsSync(filePath)) {
    // Set appropriate headers for PDF files
    if (path.extname(filePath).toLowerCase() === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + req.params.filename + '"');
    }
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

// Direct download route for edit metadata files - no auth required
app.get('/pdf-edit-metadata/download/:filename', async (req, res) => {
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

// Direct download route for spell check files - no auth required
app.get('/pdf-spell-check/download/:filename', async (req, res) => {
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

app.get('/pdf-spell-check/download/:filename', async (req, res) => {
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
app.get('/pdf-find-replace/download/:filename', async (req, res) => {
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

// Direct download route for redacted files - no auth required
app.get('/pdf-redact/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);


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
    console.error('Error serving redacted file:', error);
    res.status(500).json({ error: 'Failed to serve download file' });
  }
});

// Direct download route for stamped files - no auth required
app.get('/pdf-stamps/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

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
    console.error('Error serving stamped file:', error);
    res.status(500).json({ error: 'Failed to serve download file' });
  }
});

// Preview route for stamped files - inline display
app.get('/pdf-stamps/preview/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving preview file:', error);
    res.status(500).json({ error: 'Failed to serve preview file' });
  }
});

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
// Preview route for commented files - inline display
app.get('/pdf-comments/preview/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving preview file:', error);
    res.status(500).json({ error: 'Failed to serve preview file' });
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

// Direct download route for handwriting recognition files - no auth required
app.get('/pdf-handwriting-recognition/download/:filename', async (req, res) => {
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

    if (ext === '.txt') {
      contentType = 'text/plain';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.pdf') {
      contentType = 'application/pdf';
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
    console.error('Error serving Handwriting Recognition download file:', error);
    res.status(500).json({ error: 'Failed to serve download file' });
  }
});

// Direct download route for create PDF form files - no auth required
app.get('/pdf-create-form/download/:filename', async (req, res) => {
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
    } else if (ext === '.json') {
      contentType = 'application/json';
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
    console.error('Error serving Create PDF Form download file:', error);
    res.status(500).json({ error: 'Failed to serve download file' });
  }
});


// Serve download files from outputs directory
app.get('/downloads/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'outputs', filename);

    if (!fs.existsSync(filePath)) {
      console.warn(`PDF Service: Download file not found: ${filePath}`);
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    let contentDisposition = `attachment; filename="${filename}"`;

    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.json') {
      contentType = 'application/json';
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
    console.error('Error serving download file:', error);
    res.status(500).json({ error: 'Failed to serve download file' });
  }
});

app.use("/uploads", express.static("uploads"));
app.use("/images", express.static("images"));
app.use("/epubs", express.static("epubs")); // Serve EPUB files

// Serve PDF files from root directory - no auth required
app.get('/converted_*.pdf', (req, res, next) => {
  const pdfPath = path.join(__dirname, req.url);
  
  if (fs.existsSync(pdfPath)) {
    res.sendFile(pdfPath);
  } else {
    res.status(404).send('PDF file not found');
  }
});

// Note: Removed conflicting PDF route that was intercepting requests
// PDF files are now handled by specific routes in addPageNumbersRoutes
// Apply tracking middleware to all PDF routes
app.use('/pdf', trackPdfOperation, pdfRoutes);
app.use('/convert', trackPdfOperation, conversionRoutes);
app.use('/pdf-text-edit', trackPdfOperation, pdfTextEditRoutes);
app.use('/pdf-service', trackPdfOperation, mergePdfRoutes);
app.use('/pdf-split', trackPdfOperation, splitPdfRoutes);
app.use('/pdf-extract', trackPdfOperation, extractPdfRoutes);
app.use('/pdf-delete', trackPdfOperation, deletePdfPagesRoutes);
app.use('/pdf-reorder', trackPdfOperation, reorderPdfPagesRoutes);
app.use('/pdf-rotate', trackPdfOperation, rotatePdfPagesRoutes);
app.use('/pdf-crop', trackPdfOperation, cropPdfPagesRoutes);
app.use('/pdf-insert', trackPdfOperation, insertPdfPagesRoutes);
app.use('/pdf-page-numbers', trackPdfOperation, addPageNumbersRoutes);
app.use('/pdf-header-footer', trackPdfOperation, addHeaderFooterRoutes);
app.use('/pdf-password', trackPdfOperation, addPasswordRoutes);
app.use('/pdf-remove-password', trackPdfOperation, removePasswordRoutes);
app.use('/pdf-digital-signature', trackPdfOperation, digitalSignatureRoutes);
app.use('/pdf-permissions', trackPdfOperation, setPermissionsRoutes);
app.use('/pdf-watermark', trackPdfOperation, addWatermarkRoutes);
app.use('/pdf-remove-metadata', trackPdfOperation, removeMetadataRoutes);
app.use('/pdf-edit-metadata', trackPdfOperation, editMetadataRoutes);
app.use('/pdf-spell-check', trackPdfOperation, spellCheckRoutes);
app.use('/pdf-find-replace', trackPdfOperation, findReplaceRoutes);
app.use('/pdf-redact', trackPdfOperation, redactRoutes);
app.use('/pdf-stamps', trackPdfOperation, stampRoutes);
app.use('/pdf-comments', trackPdfOperation, commentRoutes);
app.use('/pdf-comments-db', trackPdfOperation, dbCommentRoutes);
app.use('/pdf-highlight', trackPdfOperation, highlightRoutes);
app.use('/pdf-compress', trackPdfOperation, compressPDFRoutes);
app.use('/pdf-optimize-image', trackPdfOperation, optimizeImageRoutes);
app.use('/pdf-optimize-font', trackPdfOperation, optimizeFontRoutes);
app.use('/pdf-remove-unused-objects', trackPdfOperation, removeUnusedObjectsRoutes);
app.use('/pdf-linearize', trackPdfOperation, linearizePDFRoutes);
app.use('/pdf-color-optimization', trackPdfOperation, colorOptimizationRoutes);
app.use('/pdf-quality-analysis', trackPdfOperation, qualityAnalysisRoutes);
app.use('/pdf-batch-optimization', trackBatchOperation, batchOptimizationRoutes);
app.use('/pdf-ocr', trackPdfOperation, ocrRoutes);
app.use('/pdf-make-searchable', trackPdfOperation, makeSearchableRoutes);
app.use('/pdf-extract-tables', trackPdfOperation, extractTablesRoutes);
app.use('/pdf-handwriting-recognition', trackPdfOperation, handwritingRecognitionRoutes);
app.use('/pdf-create-form', trackPdfOperation, createPdfFormRoutes);
app.use('/pdf-fill-form', trackPdfOperation, fillPdfFormRoutes);
app.use('/pdf-form-recognition', trackPdfOperation, formRecognitionRoutes);
app.use('/pdf-calculate-fields', trackPdfOperation, calculateFieldsRoutes);
app.use('/pdf-info', trackPdfOperation, pdfInfoRoutes);
app.use('/pdf-validator', trackPdfOperation, pdfValidatorRoutes);
app.use('/pdf-compare', trackPdfOperation, pdfCompareRoutes);
app.use('/pdf-repair', trackPdfOperation, pdfRepairRoutes);
app.use('/pdf-bookmarks', trackPdfOperation, pdfBookmarksRoutes);
app.use('/pdf-statistics', trackPdfOperation, pdfStatisticsRoutes);
app.use('/advanced-editor', trackPdfOperation, advancedPdfEditorRoutes);
app.use('/workflows', verifyJWT(process.env.ACCESS_TOKEN_SECRET), workflowRoutes);
app.use('/analytics', verifyJWT(process.env.ACCESS_TOKEN_SECRET), analyticsRoutes);
app.use('/smart-conversion', trackPdfOperation, smartConversionRoutes);

// Cloud connector routes - separate public and protected routes
// Public routes (no authentication required)
app.get('/cloud-connector/callback', (req, res, next) => {
  // Import the controller directly for the callback route
  const cloudConnectorController = require('./controllers/cloudConnectorController');
  cloudConnectorController.connectService(req, res, next);
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Protected routes (authentication required)
// Special route for file upload with multer middleware
app.post('/cloud-connector/upload', verifyJWT(process.env.ACCESS_TOKEN_SECRET), upload.single('fileData'), (req, res, next) => {
  const cloudConnectorController = require('./controllers/cloudConnectorController');
  cloudConnectorController.uploadFile(req, res, next);
});

// Other cloud connector routes
app.use('/cloud-connector', verifyJWT(process.env.ACCESS_TOKEN_SECRET), cloudConnectorRoutes);

// Public routes for shared document access (no authentication required)
app.get('/shared-document/:linkToken', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/shared-document/${req.params.linkToken}`);
});

app.post('/shared-document/:linkToken', documentTrackingController.accessSharedDocument);
app.get('/shared-download/:linkToken', documentTrackingController.downloadSharedDocument);
    
// Protected routes that require authentication
app.use('/document-tracking', verifyJWT(process.env.ACCESS_TOKEN_SECRET), documentTrackingRoutes);

// Add debugging for route matching
app.use((req, res, next) => {
  console.log(`PDF Service: Route not matched: ${req.method} ${req.url}`);
  next();
});

// Conversion routes


// Global error handler to prevent server crashes
process.on('uncaughtException', (error) => {
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error('Error:', error);
  console.error('Stack:', error.stack);
  console.error('=== END UNCAUGHT EXCEPTION ===');
  // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('=== UNHANDLED REJECTION ===');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  console.error('=== END UNHANDLED REJECTION ===');
  // Don't exit the process, just log the error
});

process.on('exit', (code) => {
  console.error('=== PROCESS EXIT ===');
  console.error('Exit code:', code);
  console.error('=== END PROCESS EXIT ===');
});

process.on('SIGTERM', () => {
  console.error('=== SIGTERM RECEIVED ===');
  console.error('=== END SIGTERM ===');
});

process.on('SIGINT', () => {
  console.error('=== SIGINT RECEIVED ===');
  console.error('=== END SIGINT ===');
});

// Global error middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 2104;
app.listen(PORT, () => console.log(`PDF Service running on ${PORT}/`));
