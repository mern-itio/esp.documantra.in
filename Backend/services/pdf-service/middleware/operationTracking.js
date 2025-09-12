const PdfOperationTracking = require('../models/pdfOperationTracking');

const operationMap = {
  '/pdf/doc-to-pdf': { operation: 'Word to PDF', toolName: 'Word to PDF', category: 'Conversion' },
  '/pdf/pdf-to-doc': { operation: 'PDF to Word', toolName: 'PDF to Word', category: 'Conversion' },
  '/pdf/pdf-to-excel': { operation: 'PDF to Excel', toolName: 'PDF to Excel', category: 'Conversion' },
  '/pdf/excel-to-pdf': { operation: 'Excel to PDF', toolName: 'Excel to PDF', category: 'Conversion' },
  '/pdf/pdf-to-ppt': { operation: 'PDF to PowerPoint', toolName: 'PDF to PowerPoint', category: 'Conversion' },
  '/pdf/ppt-to-pdf': { operation: 'PowerPoint to PDF', toolName: 'PowerPoint to PDF', category: 'Conversion' },
  '/pdf/ppt-to-pdf-basic': { operation: 'PowerPoint to PDF (Basic)', toolName: 'PowerPoint to PDF (Basic)', category: 'Conversion' },
  '/pdf/pdf-to-txt': { operation: 'PDF to Text', toolName: 'PDF to Text', category: 'Conversion' },
  '/pdf/txt-to-pdf': { operation: 'Text to PDF', toolName: 'Text to PDF', category: 'Conversion' },
  '/pdf/pdf-to-html': { operation: 'PDF to HTML', toolName: 'PDF to HTML', category: 'Conversion' },
  '/pdf/html-to-pdf': { operation: 'HTML to PDF', toolName: 'HTML to PDF', category: 'Conversion' },
  '/pdf/test-pptx-extraction': { operation: 'Test PPTX Extraction', toolName: 'Test PPTX Extraction', category: 'Conversion' },
  '/pdf/test-html-to-pdf': { operation: 'Test HTML to PDF', toolName: 'Test HTML to PDF', category: 'Conversion' },

  // Conversion operations - Convert routes
  '/convert/pdf-to-image': { operation: 'PDF to Image', toolName: 'PDF to Image', category: 'Conversion' },
  '/convert/image-to-pdf': { operation: 'Image to PDF', toolName: 'Image to PDF', category: 'Conversion' },
  '/convert/pdf-to-word': { operation: 'PDF to Word', toolName: 'PDF to Word', category: 'Conversion' },
  '/convert/word-to-pdf': { operation: 'Word to PDF', toolName: 'Word to PDF', category: 'Conversion' },
  '/convert/pdf-to-epub': { operation: 'PDF to EPUB', toolName: 'PDF to EPUB', category: 'Conversion' },

  // Page operations
  '/pdf-service/merge': { operation: 'Merge PDF', toolName: 'Merge PDF', category: 'Pages' },
  '/pdf-split/split': { operation: 'Split PDF', toolName: 'Split PDF', category: 'Pages' },
  '/pdf-extract/extract': { operation: 'Extract Pages', toolName: 'Extract Pages', category: 'Pages' },
  '/pdf-delete/delete': { operation: 'Delete Pages', toolName: 'Delete Pages', category: 'Pages' },
  '/pdf-reorder/reorder-pages': { operation: 'Reorder Pages', toolName: 'Reorder Pages', category: 'Pages' },
  '/pdf-rotate/rotate-pages': { operation: 'Rotate Pages', toolName: 'Rotate Pages', category: 'Pages' },
  '/pdf-crop/crop-pages': { operation: 'Crop Pages', toolName: 'Crop Pages', category: 'Pages' },
  '/pdf-insert/insert-pages': { operation: 'Insert Pages', toolName: 'Insert Pages', category: 'Pages' },

  // Editing operations
  '/pdf-text-edit/edit': { operation: 'Edit PDF Text', toolName: 'Edit PDF Text', category: 'Editing' },
  '/pdf-page-numbers/add-page-numbers': { operation: 'Add Page Numbers', toolName: 'Add Page Numbers', category: 'Editing' },
  '/pdf-header-footer/add-header-footer': { operation: 'Add Header Footer', toolName: 'Add Header Footer', category: 'Editing' },
  '/pdf-watermark/text': { operation: 'Add Watermark', toolName: 'Add Watermark', category: 'Editing' },
  '/pdf-watermark/image': { operation: 'Add Watermark', toolName: 'Add Watermark', category: 'Editing' },
  '/pdf-edit-metadata/get-metadata': { operation: 'Get Metadata', toolName: 'Get Metadata', category: 'Editing' },
  '/pdf-edit-metadata/edit-metadata': { operation: 'Edit Metadata', toolName: 'Edit Metadata', category: 'Editing' },
  '/pdf-find-replace/find-replace': { operation: 'Find and Replace', toolName: 'Find and Replace', category: 'Editing' },
  '/pdf-redact/redact': { operation: 'Redact Content', toolName: 'Redact Content', category: 'Editing' },
  '/pdf-stamps/add-stamps': { operation: 'Add Stamps', toolName: 'Add Stamps', category: 'Editing' },
  '/pdf-comments/add-comments': { operation: 'Add Comments', toolName: 'Add Comments', category: 'Editing' },
  '/pdf-highlight/highlight-text': { operation: 'Highlight Text', toolName: 'Highlight Text', category: 'Editing' },

  // Security operations
  '/pdf-password/add-password': { operation: 'Add Password', toolName: 'Add Password', category: 'Security' },
  '/pdf-remove-password/remove-password': { operation: 'Remove Password', toolName: 'Remove Password', category: 'Security' },
  '/pdf-digital-signature/add-signature': { operation: 'Digital Signature', toolName: 'Digital Signature', category: 'Security' },
  '/pdf-permissions/set-permissions': { operation: 'Set Permissions', toolName: 'Set Permissions', category: 'Security' },
  '/pdf-remove-metadata/remove-metadata': { operation: 'Remove Metadata', toolName: 'Remove Metadata', category: 'Security' },

  // Optimization operations
  '/pdf-compress/compress': { operation: 'Compress PDF', toolName: 'Compress PDF', category: 'Optimization' },
  '/pdf-optimize-image/optimize': { operation: 'Optimize Images', toolName: 'Optimize Images', category: 'Optimization' },
  '/pdf-optimize-font/optimize-font': { operation: 'Optimize Fonts', toolName: 'Optimize Fonts', category: 'Optimization' },
  '/pdf-remove-unused-objects/remove-unused-objects': { operation: 'Remove Unused Objects', toolName: 'Remove Unused Objects', category: 'Optimization' },
  '/pdf-linearize/linearize': { operation: 'Linearize PDF', toolName: 'Linearize PDF', category: 'Optimization' },
  '/pdf-color-optimization/optimize': { operation: 'Color Optimization', toolName: 'Color Optimization', category: 'Optimization' },
  '/pdf-batch-optimization/optimize': { operation: 'Batch Optimization', toolName: 'Batch Optimization', category: 'Optimization' },

  // OCR operations
  '/pdf-ocr/process': { operation: 'OCR Processing', toolName: 'OCR Processing', category: 'OCR' },
  '/pdf-make-searchable/process': { operation: 'Make Searchable', toolName: 'Make Searchable', category: 'OCR' },
  '/pdf-extract-tables/process': { operation: 'Extract Tables', toolName: 'Extract Tables', category: 'OCR' },
  '/pdf-handwriting-recognition/recognize': { operation: 'Handwriting Recognition', toolName: 'Handwriting Recognition', category: 'OCR' },

  // Form operations
  '/pdf-create-form/create': { operation: 'Create PDF Form', toolName: 'Create PDF Form', category: 'Forms' },
  '/pdf-fill-form/fill': { operation: 'Fill PDF Form', toolName: 'Fill PDF Form', category: 'Forms' },
  '/pdf-form-recognition/convert': { operation: 'Form Recognition', toolName: 'Form Recognition', category: 'Forms' },
  '/pdf-calculate-fields/add-calculations': { operation: 'Calculate Fields', toolName: 'Calculate Fields', category: 'Forms' },

 
  // Other operations
  '/pdf-info/get-info': { operation: 'PDF Info', toolName: 'PDF Info', category: 'Other' },
  '/pdf-validator/validate': { operation: 'PDF Validator', toolName: 'PDF Validator', category: 'Other' },
  '/pdf-compare/compare': { operation: 'PDF Compare', toolName: 'PDF Compare', category: 'Other' },
  '/pdf-repair/repair': { operation: 'PDF Repair', toolName: 'PDF Repair', category: 'Other' },
  '/pdf-bookmarks/create-custom': { operation: 'PDF Bookmarks', toolName: 'PDF Bookmarks', category: 'Other' },
  '/pdf-statistics/analyze': { operation: 'PDF Statistics', toolName: 'PDF Statistics', category: 'Other' },
  '/pdf-quality-analysis/analyze': { operation: 'Quality Analysis', toolName: 'Quality Analysis', category: 'Other' },
  '/pdf-spell-check/spell-check': { operation: 'Spell Check', toolName: 'Spell Check', category: 'Other' },
  '/pdf-edit-metadata/test-tools': { operation: 'Test Metadata Tools', toolName: 'Test Metadata Tools', category: 'Other' }
};

// Middleware to track PDF operations
function trackPdfOperation(req, res, next) {
  // Prevent multiple tracking for the same request
  if (req._trackingStarted) {
    console.log('⚠️ Tracking already started for this request, skipping...');
    return next();
  }
  req._trackingStarted = true;
  
  const startTime = Date.now();
  const originalSend = res.send;
  const originalJson = res.json;

  // Get operation details from the route
  const route = req.baseUrl + req.path;
  const originalUrl = req.originalUrl;
  
  // Try multiple route matching strategies
  let operationDetails = operationMap[route] || operationMap[originalUrl];
 
  
  // If no exact match, try pattern matching
  if (!operationDetails) {
    if (route.includes('pdf-to-word') || route.includes('pdf-to-doc')) {
      operationDetails = { operation: 'PDF to Word', toolName: 'PDF to Word', category: 'Conversion' };
    } else if (route.includes('pdf-to-image')) {
      operationDetails = { operation: 'PDF to Image', toolName: 'PDF to Image', category: 'Conversion' };
    } else if (route.includes('image-to-pdf')) {
      operationDetails = { operation: 'Image to PDF', toolName: 'Image to PDF', category: 'Conversion' };
    } else if (route.includes('merge')) {
      operationDetails = { operation: 'Merge PDF', toolName: 'Merge PDF', category: 'Pages' };
    } else if (route.includes('split')) {
      operationDetails = { operation: 'Split PDF', toolName: 'Split PDF', category: 'Pages' };
    } else if (route.includes('compress')) {
      operationDetails = { operation: 'Compress PDF', toolName: 'Compress PDF', category: 'Optimization' };
    } else {
      operationDetails = {
        operation: 'Unknown Operation',
        toolName: 'Unknown Tool',
        category: 'Other'
      };
    }
    
  }

  // Extract file information if available
  const file = req.file;
  const fileSize = file ? file.size : 0;
  const inputFormat = file ? file.mimetype : null;
  
  // Determine output format from request body or query
  let outputFormat = null;
  if (req.body && req.body.outputFormat) {
    outputFormat = req.body.outputFormat;
  } else if (req.query && req.query.outputFormat) {
    outputFormat = req.query.outputFormat;
  }

  // Get user ID from JWT token
  let userId = 'anonymous';
  if (req.user) {
    userId = req.user.data?.id || req.user.id || req.user.userId || 'anonymous';
  }

  // Create tracking record
  const trackingData = {
    userId,
    operation: operationDetails.operation,
    toolName: operationDetails.toolName,
    category: operationDetails.category,
    inputFormat,
    outputFormat,
    fileSize,
    processingTime: 0, // Will be updated when response is sent
    status: 'processing',
    timestamp: new Date(),
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    metadata: {
      route,
      method: req.method,
      query: req.query,
      bodyKeys: Object.keys(req.body || {})
    }
  };

  // Flag to prevent duplicate saves
  let trackingSaved = false;


  // Override res.send to track completion
  res.send = function(data) {
    
    const processingTime = Date.now() - startTime;
    trackingData.processingTime = processingTime;
    trackingData.status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'error';
    
    if (res.statusCode >= 400) {
      trackingData.errorMessage = typeof data === 'string' ? data : 'Request failed';
    }

    // Only save if not already saved by another response method
    if (!trackingSaved) {
      trackingSaved = true;
      
      PdfOperationTracking.create(trackingData).then(() => {
        console.log('✅ PDF Operation Tracked (send):', trackingData.operation, 'by user:', trackingData.userId);
      }).catch(err => {
        console.error('❌ Error saving PDF operation tracking (send):', err);
      });
    } else {
      console.log('🔍 Skipping duplicate save (send) - already saved by another response method');
    }

    return originalSend.call(this, data);
  };

  // Override res.download to track completion
  const originalDownload = res.download;
  res.download = function(file, filename, callback) {
    
    const processingTime = Date.now() - startTime;
    trackingData.processingTime = processingTime;
    trackingData.status = 'success';
    trackingData.details = {
      success: true,
      fileDownloaded: true,
      filename: filename || 'unknown'
    };

    // Only save if not already saved by another response method
    if (!trackingSaved) {
      trackingSaved = true;
     
      
      PdfOperationTracking.create(trackingData).then(() => {
        console.log('✅ PDF Operation Tracked (download):', trackingData.operation, 'by user:', trackingData.userId);
      }).catch(err => {
        console.error('❌ Error saving PDF operation tracking (download):', err);
      });
    } else {
      console.log('🔍 Skipping duplicate save (download) - already saved by another response method');
    }

    // Call original download method
    return originalDownload.call(this, file, filename, callback);
  };

  // Override res.sendFile to track completion
  const originalSendFile = res.sendFile;
  res.sendFile = function(file, options, callback) {
    
    const processingTime = Date.now() - startTime;
    trackingData.processingTime = processingTime;
    trackingData.status = 'success';
    trackingData.details = {
      success: true,
      fileSent: true,
      filename: file
    };

    // Only save if not already saved by another response method
    if (!trackingSaved) {
      trackingSaved = true;
      
      PdfOperationTracking.create(trackingData).then(() => {
        console.log('✅ PDF Operation Tracked (sendFile):', trackingData.operation, 'by user:', trackingData.userId);
      }).catch(err => {
        console.error('❌ Error saving PDF operation tracking (sendFile):', err);
      });
    } else {
      console.log('🔍 Skipping duplicate save (sendFile) - already saved by another response method');
    }

    // Call original sendFile method
    return originalSendFile.call(this, file, options, callback);
  };

  // Override res.json to track completion
  res.json = function(data) {
    const processingTime = Date.now() - startTime;
    trackingData.processingTime = processingTime;
    trackingData.status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'error';
    
    if (res.statusCode >= 400) {
      trackingData.errorMessage = data?.error || data?.message || 'Request failed';
    }

    // Only save if not already saved by another response method
    if (!trackingSaved) {
      trackingSaved = true;
     
      
      PdfOperationTracking.create(trackingData).then(() => {
        console.log('✅ PDF Operation Tracked (json):', trackingData.operation, 'by user:', trackingData.userId);
      }).catch(err => {
        console.error('❌ Error saving PDF operation tracking (json):', err);
      });
    } else {
      console.log('🔍 Skipping duplicate save (json) - already saved by another response method');
    }

    return originalJson.call(this, data);
  };

  next();
}

// Middleware to track batch operations
function trackBatchOperation(req, res, next) {
  const startTime = Date.now();
  const originalSend = res.send;
  const originalJson = res.json;

  const userId = req.user?.data?.id || 'anonymous';
  const fileCount = req.files ? req.files.length : (req.file ? 1 : 0);

  // Override res.send to track batch completion
  res.send = function(data) {
    const processingTime = Date.now() - startTime;
    
    // Create tracking record for each file in batch
    for (let i = 0; i < fileCount; i++) {
      const file = req.files ? req.files[i] : req.file;
      const trackingData = {
        userId,
        operation: 'Batch Processing',
        toolName: 'Batch Processing',
        category: 'Other',
        inputFormat: file ? file.mimetype : null,
        fileSize: file ? file.size : 0,
        processingTime: processingTime / fileCount, // Average processing time per file
        status: res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'error',
        timestamp: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        metadata: {
          batchSize: fileCount,
          batchIndex: i + 1,
          route: req.baseUrl + req.path
        }
      };

      if (res.statusCode >= 400) {
        trackingData.errorMessage = typeof data === 'string' ? data : 'Batch processing failed';
      }

      PdfOperationTracking.create(trackingData).catch(err => {
        console.error('Error saving batch operation tracking:', err);
      });
    }

    return originalSend.call(this, data);
  };

  // Override res.json to track batch completion
  res.json = function(data) {
    const processingTime = Date.now() - startTime;
    
    // Create tracking record for each file in batch
    for (let i = 0; i < fileCount; i++) {
      const file = req.files ? req.files[i] : req.file;
      const trackingData = {
        userId,
        operation: 'Batch Processing',
        toolName: 'Batch Processing',
        category: 'Other',
        inputFormat: file ? file.mimetype : null,
        fileSize: file ? file.size : 0,
        processingTime: processingTime / fileCount,
        status: res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'error',
        timestamp: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        metadata: {
          batchSize: fileCount,
          batchIndex: i + 1,
          route: req.baseUrl + req.path
        }
      };

      if (res.statusCode >= 400) {
        trackingData.errorMessage = data?.error || data?.message || 'Batch processing failed';
      }

      PdfOperationTracking.create(trackingData).catch(err => {
        console.error('Error saving batch operation tracking:', err);
      });
    }

    return originalJson.call(this, data);
  };

  next();
}

module.exports = {
  trackPdfOperation,
  trackBatchOperation
};
