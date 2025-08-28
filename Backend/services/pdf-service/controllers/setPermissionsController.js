const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const crypto = require('crypto');

const setPermissionsController = {
  async setPermissions(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'PDF file is required' });
      }

      const {
        allowPrint,
        allowCopy,
        allowModify,
        allowAnnotate,
        allowFillForms,
        allowExtractContent,
        allowAssemble,
        allowHighQualityPrint,
        password,
        ownerPassword
      } = req.body;

      const inputPath = req.file.path;
      const filename = `protected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.pdf`;
      const outputPath = path.join(__dirname, '..', 'outputs', filename);

      // Ensure outputs directory exists
      await fs.ensureDir(path.dirname(outputPath));

      // Build qpdf command with passwords + AES-256 encryption
      // Build qpdf command with passwords + AES-256 encryption
      let qpdfCommand = `qpdf --encrypt "${password || ''}" "${ownerPassword || password || ''}" 256`;

      // Add permission restrictions (must come BEFORE the `--` separator)
      qpdfCommand += ` --print=${allowPrint === 'true' ? 'full' : 'none'}`;
      qpdfCommand += ` --modify=${allowModify === 'true' ? 'all' : 'none'}`;
      qpdfCommand += ` --extract=${allowExtractContent === 'true' ? 'y' : 'n'}`;
      qpdfCommand += ` --annotate=${allowAnnotate === 'true' ? 'y' : 'n'}`;
      qpdfCommand += ` --form=${allowFillForms === 'true' ? 'y' : 'n'}`;
      qpdfCommand += ` --assemble=${allowAssemble === 'true' ? 'y' : 'n'}`;
      // 🚫 REMOVE this line (not valid):
      // qpdfCommand += ` --copy-content=n`;

      // Now add the separator and file paths
      qpdfCommand += ` -- "${inputPath}" "${outputPath}"`;


      console.log('Executing qpdf command:', qpdfCommand);

      const { stdout, stderr } = await execAsync(qpdfCommand);

      if (stderr && !stderr.includes('WARNING')) {
        console.error('QPDF stderr:', stderr);
      }

      // Generate secure viewing link instead of download link
      const secureToken = crypto.randomBytes(32).toString('hex');
      const secureLink = `/pdf-permissions/view/${secureToken}/${filename}`;

      // Store permission metadata for the secure link
      const permissionsData = {
        token: secureToken,
        filename: filename,
        originalFile: req.file.originalname,
        permissions: {
          allowPrint: allowPrint === 'true',
          allowCopy: allowCopy === 'true',
          allowModify: allowModify === 'true',
          allowAnnotate: allowAnnotate === 'true',
          allowFillForms: allowFillForms === 'true',
          allowExtractContent: allowExtractContent === 'true',
          allowAssemble: allowAssemble === 'true',
          allowHighQualityPrint: allowHighQualityPrint === 'true'
        },
        isPasswordProtected: !!password,
        isOwnerProtected: !!ownerPassword,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      // Save permissions metadata
      const permissionsPath = path.join(__dirname, 'permissions', `${secureToken}.json`);
      await fs.ensureDir(path.dirname(permissionsPath));
      await fs.writeJson(permissionsPath, permissionsData);

      // Get file size
      const stats = await fs.stat(outputPath);
      const fileSize = (stats.size / 1024 / 1024).toFixed(2);

      // Log document tracking event
      try {
        const DocumentTracking = require('../models/documentTracking');
        const documentId = crypto.randomBytes(16).toString('hex');
        const userId = req.user?.id || 'anonymous';
        
        const trackingRecord = new DocumentTracking({
          documentId,
          documentName: req.file.originalname,
          documentType: 'pdf',
          originalFilename: req.file.originalname,
          userId,
          action: 'permission_set',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          isTracked: true,
          trackingSource: 'automatic',
          metadata: {
            permissions: permissionsData.permissions,
            isPasswordProtected: permissionsData.isPasswordProtected,
            isOwnerProtected: permissionsData.isOwnerProtected,
            secureToken,
            secureLink
          }
        });

        await trackingRecord.save();
        console.log('Document tracking event logged for permission set');
      } catch (trackingError) {
        console.error('Failed to log document tracking event:', trackingError);
        // Don't fail the main operation if tracking fails
      }

      res.json({
        success: true,
        message: 'PDF permissions set successfully',
        filename: filename,
        secureViewLink: secureLink,
        fileSize: `${fileSize} MB`,
        permissions: {
          allowPrint: allowPrint === 'true',
          allowCopy: allowCopy === 'true',
          allowModify: allowModify === 'true',
          allowAnnotate: allowAnnotate === 'true',
          allowFillForms: allowFillForms === 'true',
          allowExtractContent: allowExtractContent === 'true',
          allowAssemble: allowAssemble === 'true',
          allowHighQualityPrint: allowHighQualityPrint === 'true',
          isPasswordProtected: !!password,
          isOwnerProtected: !!ownerPassword
        }
      });

      // Clean up input file
      await fs.remove(inputPath);

    } catch (error) {
      console.error('Error setting permissions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to set permissions',
        details: error.message
      });
    }
  },


  // New method: Serve PDF with enforced permissions
  async viewSecurePDF(req, res) {
    try {
      const { token, filename } = req.params;

      // Load permissions data
      const permissionsPath = path.join(__dirname, 'permissions', `${token}.json`);
      if (!await fs.pathExists(permissionsPath)) {
        return res.status(404).json({ error: 'Secure link not found or expired' });
      }

      const permissionsData = await fs.readJson(permissionsPath);

      // Check if link has expired
      if (new Date() > new Date(permissionsData.expiresAt)) {
        await fs.remove(permissionsPath);
        return res.status(410).json({ error: 'Secure link has expired' });
      }

      // Check if filename matches
      if (permissionsData.filename !== filename) {
        return res.status(403).json({ error: 'Invalid secure link' });
      }

      const filePath = path.join(__dirname, '..', 'outputs', filename);
      if (!await fs.pathExists(filePath)) {
        return res.status(404).json({ error: 'PDF file not found' });
      }

      // Instead of serving PDF directly, serve a custom HTML viewer with embedded PDF
      const htmlContent = setPermissionsController.generateSecurePDFViewer(permissionsData, token, filename);
      
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);

    } catch (error) {
      console.error('Error viewing secure PDF:', error);
      res.status(500).json({ error: 'Failed to view PDF' });
    }
  },

  // Method to revoke secure link
  async revokeSecureLink(req, res) {
    try {
      const { token } = req.params;

      const permissionsPath = path.join(__dirname, 'permissions', `${token}.json`);
      if (await fs.pathExists(permissionsPath)) {
        await fs.remove(permissionsPath);
        res.json({ success: true, message: 'Secure link revoked successfully' });
      } else {
        res.status(404).json({ error: 'Secure link not found' });
      }
    } catch (error) {
      console.error('Error revoking secure link:', error);
      res.status(500).json({ error: 'Failed to revoke secure link' });
    }
  },

  // Serve raw PDF for iframe (with restrictions)
  async serveRawPDF(req, res) {
    try {
      const { token, filename } = req.params;
      
      // Load permissions data
      const permissionsPath = path.join(__dirname, 'permissions', `${token}.json`);
      if (!await fs.pathExists(permissionsPath)) {
        return res.status(404).json({ error: 'Secure link not found or expired' });
      }

      const permissionsData = await fs.readJson(permissionsPath);
      
      // Check if link has expired
      if (new Date() > new Date(permissionsData.expiresAt)) {
        await fs.remove(permissionsPath);
        return res.status(410).json({ error: 'Secure link has expired' });
      }

      // Check if filename matches
      if (permissionsData.filename !== filename) {
        return res.status(403).json({ error: 'Invalid secure link' });
      }

      const filePath = path.join(__dirname, '..', 'outputs', filename);
      if (!await fs.pathExists(filePath)) {
        return res.status(404).json({ error: 'PDF file not found' });
      }

      // Set restrictive headers to prevent downloads and enforce permissions
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('X-PDF-Permissions', JSON.stringify(permissionsData.permissions));
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Additional security headers
      res.setHeader('X-Download-Options', 'noopen');
      res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

      // Stream the PDF file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('Error serving raw PDF:', error);
      res.status(500).json({ error: 'Failed to serve PDF' });
    }
  },

  async getCurrentPermissions(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'PDF file is required' });
      }

      const inputPath = req.file.path;

      // Use qpdf to analyze current permissions
      const qpdfCommand = `qpdf --show-encryption "${inputPath}"`;

      const { stdout, stderr } = await execAsync(qpdfCommand);

      if (stderr && !stderr.includes('WARNING')) {
        console.error('QPDF stderr:', stderr);
      }

      const permissions = parseQpdfPermissions(stdout);

      res.json({
        success: true,
        message: 'Current permissions retrieved successfully',
        permissions: permissions
      });

      // Clean up input file
      await fs.remove(inputPath);

    } catch (error) {
      console.error('Error getting current permissions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get current permissions',
        details: error.message
      });
    }
  },

  // Generate secure PDF viewer HTML with embedded PDF
  generateSecurePDFViewer(permissionsData, token, filename) {
    const restrictions = permissionsData.permissions;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure PDF Viewer - ${permissionsData.originalFile}</title>
    <script type="module">
        // Load PDF.js dynamically
        async function loadPDFJS() {
            try {
                const pdfjsLib = await import('/pdfjs/pdf.min.mjs');
                window.pdfjsLib = pdfjsLib;
                console.log('PDF.js loaded successfully:', pdfjsLib);
                
                // Start the PDF viewer once PDF.js is loaded
                initPDFViewer();
            } catch (error) {
                console.error('Failed to load PDF.js:', error);
                document.getElementById('error').style.display = 'block';
                document.getElementById('error').textContent = 'Failed to load PDF.js library: ' + error.message;
            }
        }
        
        // Start loading PDF.js
        loadPDFJS();
    </script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            overflow: hidden;
        }
        .header {
            background: #1f2937;
            color: white;
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header h1 {
            font-size: 1.2rem;
            font-weight: 500;
        }
        .restrictions {
            display: flex;
            gap: 1rem;
            font-size: 0.9rem;
        }
        .restriction {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            background: ${restrictions.allowPrint ? '#10b981' : '#ef4444'};
        }
        .main-content {
            height: calc(100vh - 80px);
            display: flex;
        }
        .pdf-container {
            flex: 1;
            background: white;
            margin: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: auto;
            position: relative;
        }
        .pdf-viewer {
            width: 100%;
            height: 100%;
            border: none;
        }
        .controls {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            display: flex;
            gap: 0.5rem;
        }
        .control-btn {
            padding: 0.75rem;
            border: none;
            border-radius: 50%;
            background: #3b82f6;
            color: white;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: all 0.2s;
        }
        .control-btn:hover { transform: translateY(-2px); }
        .control-btn:disabled { 
            background: #9ca3af; 
            cursor: not-allowed;
            transform: none;
        }
        .page-info {
            position: fixed;
            bottom: 2rem;
            left: 2rem;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
        }
        .warning {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            max-width: 400px;
            z-index: 1000;
        }
        .warning.hidden { display: none; }
        .pdf-embed {
            width: 100%;
            height: 100%;
            border: none;
        }
        .pdf-canvas {
            display: block;
            margin: 0 auto;
            max-width: 100%;
            height: auto;
        }
        .loading {
            text-align: center;
            padding: 2rem;
            color: #6b7280;
        }
        .error {
            text-align: center;
            padding: 2rem;
            color: #ef4444;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 Secure PDF Viewer - ${permissionsData.originalFile}</h1>
        <div class="restrictions">
            <span class="restriction">${restrictions.allowPrint ? '✅ Print Allowed' : '❌ Print Blocked'}</span>
            <span class="restriction">${restrictions.allowModify ? '✅ Modify Allowed' : '❌ Modify Blocked'}</span>
        </div>
    </div>

    <div class="main-content">
        <div class="pdf-container">
            <div id="loading" class="loading">Loading PDF...</div>
            <div id="error" class="error" style="display: none;"></div>
            <canvas id="pdf-canvas" class="pdf-canvas" style="display: none;"></canvas>
        </div>
    </div>

    <div class="controls">
        <button class="control-btn" id="prevBtn" title="Previous Page">◀</button>
        <button class="control-btn" id="nextBtn" title="Next Page">▶</button>
        <button class="control-btn" id="zoomInBtn" title="Zoom In">+</button>
        <button class="control-btn" id="zoomOutBtn" title="Zoom Out">-</button>
        ${restrictions.allowPrint ? '<button class="control-btn" id="printBtn" title="Print">🖨️</button>' : ''}
    </div>

    <div class="page-info">
        Page <span id="currentPage">1</span> of <span id="totalPages">?</span>
    </div>

    <div class="warning" id="copyWarning" style="display: none;">
        <strong>Action Restricted!</strong><br>
        <span id="warningMessage"></span>
    </div>

    <script>
        // Initialize PDF viewer
        function initPDFViewer() {
            // Check if required DOM elements exist
            const loadingEl = document.getElementById('loading');
            const errorEl = document.getElementById('error');
            const canvasEl = document.getElementById('pdf-canvas');
            
            if (!loadingEl || !errorEl || !canvasEl) {
                console.error('Required DOM elements not found');
                return;
            }
            
            // Set PDF.js worker
            const pdfjsLib = window.pdfjsLib;
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
                
                let pdfDoc = null;
                let pageNum = 1;
                let pageRendering = false;
                let pageNumPending = null;
                let scale = 1.5;
                
                // Load the PDF
                const pdfUrl = '/pdf-permissions/raw-pdf/${token}/${filename}';
                console.log('Loading PDF from:', pdfUrl);
                
                pdfjsLib.getDocument(pdfUrl).promise.then(function(pdf) {
            pdfDoc = pdf;
            document.getElementById('totalPages').textContent = pdf.numPages;
            document.getElementById('loading').style.display = 'none';
            document.getElementById('pdf-canvas').style.display = 'block';
            
            // Render the first page
            renderPage(pageNum);
        }).catch(function(error) {
            console.error('Error loading PDF:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').style.display = 'block';
            document.getElementById('error').textContent = 'Error loading PDF: ' + error.message;
        });
        
        function renderPage(num) {
            pageRendering = true;
            
            pdfDoc.getPage(num).then(function(page) {
                const viewport = page.getViewport({scale: scale});
                const canvas = document.getElementById('pdf-canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };
                
                const renderTask = page.render(renderContext);
                
                renderTask.promise.then(function() {
                    pageRendering = false;
                    if (pageNumPending !== null) {
                        renderPage(pageNumPending);
                        pageNumPending = null;
                    }
                });
            });
            
            document.getElementById('currentPage').textContent = num;
        }
        
        function queueRenderPage(num) {
            if (pageRendering) {
                pageNumPending = num;
            } else {
                renderPage(num);
            }
        }
        
        function previousPage() {
            console.log('Previous page clicked, current page:', pageNum);
            if (pageNum <= 1) {
                console.log('Already on first page');
                return;
            }
            pageNum--;
            console.log('Navigating to page:', pageNum);
            queueRenderPage(pageNum);
        }
        
        function nextPage() {
            console.log('Next page clicked, current page:', pageNum);
            if (pageNum >= pdfDoc.numPages) {
                console.log('Already on last page');
                return;
            }
            pageNum++;
            console.log('Navigating to page:', pageNum);
            queueRenderPage(pageNum);
        }
        
        function zoomIn() {
            scale *= 1.2;
            queueRenderPage(pageNum);
        }
        
        function zoomOut() {
            scale *= 0.8;
            queueRenderPage(pageNum);
        }
        
        function printPDF() {
            if (${restrictions.allowPrint}) {
                window.print();
            } else {
                showWarning('Printing is not allowed for this document.');
            }
        }
        
        // Disable right-click context menu
        document.addEventListener('contextmenu', e => e.preventDefault());
        
        // Disable keyboard shortcuts
        document.addEventListener('keydown', e => {
            const restrictedKeys = ['c', 'C', 'p', 'P', 's', 'S', 'a', 'A'];
            if ((e.ctrlKey || e.metaKey) && restrictedKeys.includes(e.key)) {
                e.preventDefault();
                if (e.key.toLowerCase() === 'c' && !${restrictions.allowCopy}) {
                    showWarning('Copying is not allowed for this document.');
                } else if (e.key.toLowerCase() === 'p' && !${restrictions.allowPrint}) {
                    showWarning('Printing is not allowed for this document.');
                } else {
                    showWarning('This action is not allowed due to document restrictions.');
                }
            }
        });
        
        // Disable text selection if copy is not allowed
        if (!${restrictions.allowCopy}) {
            document.addEventListener('selectstart', e => e.preventDefault());
            document.addEventListener('dragstart', e => e.preventDefault());
            document.addEventListener('copy', e => e.preventDefault());
            document.addEventListener('cut', e => e.preventDefault());
        }
        
        // Disable print if not allowed
        if (!${restrictions.allowPrint}) {
            window.addEventListener('beforeprint', e => e.preventDefault());
        }
        
        function showWarning(message) {
            const warning = document.getElementById('copyWarning');
            const warningMessage = document.getElementById('warningMessage');
            warningMessage.textContent = message;
            warning.style.display = 'block';
            setTimeout(() => warning.style.display = 'none', 3000);
        }
        
        // Show appropriate warning based on permissions
        if (!${restrictions.allowCopy}) {
            showWarning('Copying is not allowed for this document. Text selection and copying are disabled.');
        }
        
        // Add event listeners for buttons
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        
        if (prevBtn) prevBtn.addEventListener('click', previousPage);
        if (nextBtn) nextBtn.addEventListener('click', nextPage);
        if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
        
        ${restrictions.allowPrint ? `
        const printBtn = document.getElementById('printBtn');
        if (printBtn) printBtn.addEventListener('click', printPDF);
        ` : ''}
        
        console.log('Event listeners added successfully');
        }
    </script>
</body>
</html>`;
  }
};

function parseQpdfPermissions(qpdfOutput) {
  const lines = qpdfOutput.split('\n');
  const permissions = {
    isEncrypted: false,
    isPasswordProtected: false,
    isOwnerProtected: false,
    encryptionLevel: 'None',
    permissions: {
      allowPrint: true,
      allowCopy: true,
      allowModify: true,
      allowAnnotate: true,
      allowFillForms: true,
      allowExtractContent: true,
      allowAssemble: true,
      allowHighQualityPrint: true
    }
  };

  for (const line of lines) {
    if (line.includes('Encryption:') && !line.includes('None')) {
      permissions.isEncrypted = true;
      permissions.encryptionLevel = line.split(':')[1]?.trim() || 'Unknown';
    }

    if (line.includes('User password:')) {
      permissions.isPasswordProtected = true;
    }

    if (line.includes('Owner password:')) {
      permissions.isOwnerProtected = true;
    }

    // Parse permission bits if available
    if (line.includes('Permission bits:')) {
      const bits = line.split(':')[1]?.trim();
      if (bits) {
        const parsedBits = parsePermissionBits(bits);
        Object.assign(permissions.permissions, parsedBits);
      }
    }
  }

  return permissions;
}

function parsePermissionBits(bits) {
  // This is a simplified parser - qpdf output format may vary
  const permissions = {};

  if (bits.includes('print')) permissions.allowPrint = true;
  if (bits.includes('modify')) permissions.allowModify = true;
  if (bits.includes('extract')) permissions.allowExtractContent = true;
  if (bits.includes('annotate')) permissions.allowAnnotate = true;
  if (bits.includes('form')) permissions.allowFillForms = true;
  if (bits.includes('assemble')) permissions.allowAssemble = true;
  if (bits.includes('high-res-print')) permissions.allowHighQualityPrint = true;

  // Copy is usually allowed unless explicitly restricted
  permissions.allowCopy = !bits.includes('no-copy');

  return permissions;
}



module.exports = setPermissionsController;
