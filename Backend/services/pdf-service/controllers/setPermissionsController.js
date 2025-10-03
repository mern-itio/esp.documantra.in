const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const crypto = require('crypto');
const memoryMonitor = require('../utils/memoryMonitor');

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

      let stdout = '';
      let stderr = '';

      try {
        const result = await execAsync(qpdfCommand);
        stdout = result.stdout;
        stderr = result.stderr;

        // Log warnings but don't treat them as errors
        if (stderr) {
          if (stderr.includes('WARNING')) {
            console.log('QPDF warnings (non-critical):', stderr);
          } else {
            console.error('QPDF stderr:', stderr);
          }
        }
      } catch (error) {
        // Check if it's just warnings (qpdf returns code 3 for warnings)
        if (error.code === 3 && error.stderr && error.stderr.includes('operation succeeded with warnings')) {
          console.log('QPDF completed with warnings (non-critical):', error.stderr);
          stdout = error.stdout || '';
          stderr = error.stderr;
          // Continue processing - the file was created successfully
        } else {
          // Real error - rethrow
          throw error;
        }
      }

      // Verify the output file was created
      if (!await fs.pathExists(outputPath)) {
        throw new Error('Failed to create protected PDF file');
      }

      console.log('Protected PDF created successfully:', outputPath);

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

      // Log document tracking event (async, non-blocking)
      setImmediate(async () => {
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
      });

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

      // Clean up input file (async, non-blocking)
      setImmediate(async () => {
        try {
          await fs.remove(inputPath);
          console.log('Input file cleaned up:', inputPath);
        } catch (cleanupError) {
          console.error('Failed to clean up input file:', cleanupError);
        }
      });

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

      // Check if user wants simple PDF view (for debugging)
      const simpleView = req.query.simple === 'true';
      
      if (simpleView) {
        // Serve PDF directly for debugging
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
      } else {
        // Try to convert PDF to images for secure viewing (prevents bypass)
        try {
          console.log('Attempting to convert PDF to images for secure viewing...');
          const imageUrls = await setPermissionsController.convertPDFToImagesForViewing(filePath, token);
          const htmlContent = setPermissionsController.generateSecurePDFViewer(permissionsData, token, filename, imageUrls);
          
          // Set CSP headers for secure image viewer
          res.setHeader('Content-Type', 'text/html');
          res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline'; img-src 'self';");
          res.send(htmlContent);
        } catch (conversionError) {
          console.error('Error converting PDF to images, falling back to simple PDF view:', conversionError);
          
          // Fallback: Serve PDF directly with basic restrictions
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Download-Options', 'noopen');
          res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
          
          const fileStream = fs.createReadStream(filePath);
          fileStream.pipe(res);
        }
      }

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
        
        // Also clean up associated images
        const imageDir = path.join(__dirname, '..', 'temp-images', token);
        if (await fs.pathExists(imageDir)) {
          await fs.remove(imageDir);
          console.log('Cleaned up images for token:', token);
        }
        
        res.json({ success: true, message: 'Secure link revoked successfully' });
      } else {
        res.status(404).json({ error: 'Secure link not found' });
      }
    } catch (error) {
      console.error('Error revoking secure link:', error);
      res.status(500).json({ error: 'Failed to revoke secure link' });
    }
  },

  // Cleanup expired tokens and their images (call this periodically)
  async cleanupExpiredTokens() {
    try {
      const permissionsDir = path.join(__dirname, 'permissions');
      const tempImagesDir = path.join(__dirname, '..', 'temp-images');
      
      if (!await fs.pathExists(permissionsDir)) return;
      
      // Check available memory before starting cleanup
      memoryMonitor.logMemoryStatus();
      
      // If memory usage is high, skip cleanup to prevent ENOMEM
      if (!memoryMonitor.isSafeToProceed()) {
        console.log('High memory usage detected, skipping cleanup to prevent ENOMEM');
        return;
      }
      
      const files = await fs.readdir(permissionsDir);
      const now = new Date();
      let cleanedCount = 0;
      
      // Process files in smaller batches to prevent memory issues
      const batchSize = 5; // Reduced from 10 to 5
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        
        // Process files sequentially instead of in parallel to reduce memory pressure
        for (const file of batch) {
          if (file.endsWith('.json')) {
            const token = file.replace('.json', '');
            const permissionsPath = path.join(permissionsDir, file);
            
            try {
              const permissionsData = await fs.readJson(permissionsPath);
              
              if (new Date(permissionsData.expiresAt) < now) {
                // Remove expired permission file
                await fs.remove(permissionsPath);
                
                // Remove associated images
                const imageDir = path.join(tempImagesDir, token);
                if (await fs.pathExists(imageDir)) {
                  await fs.remove(imageDir);
                }
                
                cleanedCount++;
                console.log('Cleaned up expired token:', token);
              }
            } catch (error) {
              console.error('Error processing token file:', file, error);
              // Remove corrupted file
              try {
                await fs.remove(permissionsPath);
                cleanedCount++;
              } catch (removeError) {
                console.error('Failed to remove corrupted file:', removeError);
              }
            }
          }
        }
        
        // Longer delay between batches to allow garbage collection
        if (i + batchSize < files.length) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Increased to 1 second
        }
        
        // Force garbage collection if available and safe to do so
        memoryMonitor.forceGarbageCollection();
      }
      
      if (cleanedCount > 0) {
        console.log(`Cleanup completed: removed ${cleanedCount} expired tokens`);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      
      // If it's a memory error, try to free up memory
      if (error.code === 'ENOMEM') {
        console.log('Memory error during cleanup, attempting to free memory...');
        memoryMonitor.forceGarbageCollection();
        memoryMonitor.logMemoryStatus();
      }
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

      // Set headers for PDF serving
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('X-Content-Type-Options', 'nosniff');
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

  // Direct PDF download (for testing)
  async downloadPDF(req, res) {
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

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${permissionsData.originalFile}"`);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Stream the PDF file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('Error downloading PDF:', error);
      res.status(500).json({ error: 'Failed to download PDF' });
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

      let stdout = '';
      let stderr = '';

      try {
        const result = await execAsync(qpdfCommand);
        stdout = result.stdout;
        stderr = result.stderr;

        // Log warnings but don't treat them as errors
        if (stderr) {
          if (stderr.includes('WARNING')) {
            console.log('QPDF warnings (non-critical):', stderr);
          } else {
            console.error('QPDF stderr:', stderr);
          }
        }
      } catch (error) {
        // Check if it's just warnings (qpdf returns code 3 for warnings)
        if (error.code === 3 && error.stderr && error.stderr.includes('operation succeeded with warnings')) {
          console.log('QPDF completed with warnings (non-critical):', error.stderr);
          stdout = error.stdout || '';
          stderr = error.stderr;
          // Continue processing - the analysis was successful
        } else {
          // Real error - rethrow
          throw error;
        }
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

  // Convert PDF to images for secure viewing (prevents copy/print bypass)
  async convertPDFToImagesForViewing(filePath, token) {
    try {
      const outputDir = path.join(__dirname, '..', 'temp-images', token);
      await fs.ensureDir(outputDir);
      
      // Use pdftoppm to convert PDF to images
      const command = `pdftoppm -png -r 150 "${filePath}" "${path.join(outputDir, 'page')}"`;
      console.log('Converting PDF to images:', command);
      
      let stdout = '';
      let stderr = '';

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('PDF conversion timeout after 30 seconds')), 60000);
      });

      try {
        const result = await Promise.race([
          execAsync(command),
          timeoutPromise
        ]);
        stdout = result.stdout;
        stderr = result.stderr;
      } catch (error) {
        // Handle pdftoppm warnings (similar to qpdf)
        if (error.code === 3 && error.stderr && error.stderr.includes('WARNING')) {
          console.log('pdftoppm completed with warnings (non-critical):', error.stderr);
          stdout = error.stdout || '';
          stderr = error.stderr;
        } else {
          throw error;
        }
      }
      
      if (stderr && !stderr.includes('WARNING')) {
        console.error('pdftoppm stderr:', stderr);
      }
      
      // Get list of generated images
      const files = await fs.readdir(outputDir);
      const imageFiles = files.filter(file => file.endsWith('.png')).sort();
      
      if (imageFiles.length === 0) {
        throw new Error('No images were generated from PDF');
      }
      
      console.log('Generated images:', imageFiles);
      return imageFiles.map(file => `/pdf-permissions/image/${token}/${file}`);
      
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      throw error;
    }
  },

  // Serve individual image for secure viewing
  async serveSecureImage(req, res) {
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

      const imagePath = path.join(__dirname, '..', 'temp-images', token, filename);
      if (!await fs.pathExists(imagePath)) {
        return res.status(404).json({ error: 'Image not found' });
      }

      // Set headers for image serving
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Additional security headers
      res.setHeader('X-Download-Options', 'noopen');
      res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // Stream the image file
      const fileStream = fs.createReadStream(imagePath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('Error serving secure image:', error);
      res.status(500).json({ error: 'Failed to serve image' });
    }
  },

  // Generate secure PDF viewer HTML with image-based viewing
  generateSecurePDFViewer(permissionsData, token, filename, imageUrls) {
    const restrictions = permissionsData.permissions;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure PDF Viewer - ${permissionsData.originalFile}</title>
    <script>
        // Image-based PDF viewer - completely secure, no PDF content accessible
        let currentPage = 1;
        let totalPages = ${imageUrls.length};
        let scale = 1.0;
        
        function initImagePDFViewer() {
            console.log('Initializing secure image-based PDF viewer...');
            
            // Hide loading
            document.getElementById('loading').style.display = 'none';
            
            // Show image container
            const imageContainer = document.getElementById('image-container');
            if (imageContainer) {
                imageContainer.style.display = 'block';
                console.log('Image container displayed');
            }
            
            // Update page info
            updatePageInfo();
            
            // Initialize controls
            initControls();
            
            console.log('Secure PDF viewer initialized with', totalPages, 'pages');
        }
        
        function updatePageInfo() {
            document.getElementById('currentPage').textContent = currentPage;
            document.getElementById('totalPages').textContent = totalPages;
        }
        
        function showPage(pageNum) {
            // Hide all pages
            for (let i = 1; i <= totalPages; i++) {
                const page = document.getElementById('page-' + i);
                if (page) {
                    page.style.display = 'none';
                }
            }
            
            // Show current page
            const currentPageEl = document.getElementById('page-' + pageNum);
            if (currentPageEl) {
                currentPageEl.style.display = 'block';
                currentPageEl.style.transform = 'scale(' + scale + ')';
                currentPageEl.style.transformOrigin = 'top center';
            }
        }
        
        function previousPage() {
            if (currentPage > 1) {
                currentPage--;
                showPage(currentPage);
                updatePageInfo();
            }
        }
        
        function nextPage() {
            if (currentPage < totalPages) {
                currentPage++;
                showPage(currentPage);
                updatePageInfo();
            }
        }
        
        function zoomIn() {
            scale = Math.min(scale * 1.2, 3.0);
            showPage(currentPage);
        }
        
        function zoomOut() {
            scale = Math.max(scale / 1.2, 0.5);
            showPage(currentPage);
        }
        
        function printPDF() {
            if (${restrictions.allowPrint}) {
                // Print only the current page
                const printWindow = window.open('', '_blank');
                const currentPageEl = document.getElementById('page-' + currentPage);
                if (currentPageEl) {
                    printWindow.document.write(\`
                        <html>
                            <head><title>Print Page \${currentPage}</title></head>
                            <body style="margin:0; padding:0;">
                                <img src="\${currentPageEl.src}" style="max-width:100%; height:auto;">
                            </body>
                        </html>
                    \`);
                    printWindow.document.close();
                    printWindow.print();
                }
            } else {
                showWarning('Printing is not allowed for this document.');
            }
        }
        
        // Initialize viewer controls
        function initControls() {
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            const zoomInBtn = document.getElementById('zoomInBtn');
            const zoomOutBtn = document.getElementById('zoomOutBtn');
            const printBtn = document.getElementById('printBtn');
            
            if (prevBtn) prevBtn.addEventListener('click', previousPage);
            if (nextBtn) nextBtn.addEventListener('click', nextPage);
            if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
            if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
            if (printBtn) printBtn.addEventListener('click', printPDF);
            
            console.log('Controls initialized');
        }
        
        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', initImagePDFViewer);
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
            background: white;
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
                <div id="image-container" style="display: none;">
                    ${imageUrls.map((url, index) => `
                        <img id="page-${index + 1}" class="pdf-page" src="${url}" style="display: ${index === 0 ? 'block' : 'none'}; max-width: 100%; height: auto; margin: 0 auto; display: block;">
                    `).join('')}
                </div>
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
            setTimeout(() => warning.style.display = 'none', 2000);
        }
        
        // Show appropriate warning based on permissions
        if (!${restrictions.allowCopy}) {
            showWarning('Copying is not allowed for this document. Text selection and copying are disabled.');
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



// Add global error handlers to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process
});

// Initialize cleanup on startup (async to prevent blocking)
setTimeout(() => {
  setPermissionsController.cleanupExpiredTokens().catch(error => {
    console.error('Startup cleanup error:', error);
  });
}, 10000); // Wait 10 seconds after startup

// Run cleanup every 2 hours to reduce memory pressure
setInterval(() => {
  setPermissionsController.cleanupExpiredTokens().catch(error => {
    console.error('Periodic cleanup error:', error);
  });
}, 2 * 60 * 60 * 1000); // Changed from 1 hour to 2 hours

module.exports = setPermissionsController;
