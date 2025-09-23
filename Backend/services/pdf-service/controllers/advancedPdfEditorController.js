const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const multer = require('multer');

const execAsync = promisify(exec);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1 // Only allow one file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

const advancedPdfEditorController = {
  // Upload PDF and get basic info
  async uploadPdf(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded' });
      }

      const filePath = req.file.path;
      const fileName = req.file.filename;
      const originalName = req.file.originalname;

      // Verify the uploaded file is valid
      const stats = await fs.stat(filePath);

      if (stats.size === 0) {
        return res.status(400).json({ error: 'Uploaded file is empty' });
      }

      // Check PDF header
      const buffer = await fs.readFile(filePath, { start: 0, end: 4 });
      const header = buffer.toString();

      if (!header.startsWith('%PDF')) {
        console.error('Invalid PDF header:', header);
        return res.status(400).json({ error: 'Invalid PDF file format' });
      }

      // Get PDF info using Python script
      const scriptPath = path.join(__dirname, '..', 'scripts', 'get_pdf_info.py');
      const { stdout } = await execAsync(`python "${scriptPath}" "${filePath}"`);
      
      const pdfInfo = JSON.parse(stdout);
      console.log('PDF info:', pdfInfo);

      res.json({
        success: true,
        data: {
          fileName,
          originalName,
          filePath,
          ...pdfInfo
        }
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload PDF',
        details: error.message
      });
    }
  },

  // Extract text blocks with precise positions for a specific page
  async extractTextBlocks(req, res) {
    try {
      const { fileName, pageNumber } = req.params;
      const pageNum = parseInt(pageNumber) || 1;

      if (!fileName) {
        return res.status(400).json({ error: 'File name is required' });
      }

      const filePath = path.join(__dirname, '..', 'uploads', fileName);
      
      if (!await fs.pathExists(filePath)) {
        return res.status(404).json({ error: 'PDF file not found' });
      }

      // Use Python script to extract text blocks
      const scriptPath = path.join(__dirname, '..', 'scripts', 'extract_text_blocks.py');
      const { stdout } = await execAsync(`python "${scriptPath}" "${filePath}" ${pageNum}`);
      
      const result = JSON.parse(stdout);

      if (result.success) {
        res.json({
          success: true,
          data: result
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }

    } catch (error) {
      console.error('Text extraction error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to extract text blocks',
        details: error.message
      });
    }
  },

  // Apply edits to PDF
  async applyEdits(req, res) {
    let tempEditsFile = null;
    console.log('=== APPLY EDITS START ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    try {
      const { fileName, edits } = req.body;
      console.log('Extracted fileName:', fileName);
      console.log('Extracted edits count:', edits ? edits.length : 'undefined');

      if (!fileName || !edits || !Array.isArray(edits)) {
        return res.status(400).json({ 
          error: 'File name and edits array are required' 
        });
      }

      // Deduplicate and optimize edits - only keep the final version of each text block
      console.log('Starting edit optimization...');
      const optimizedEdits = [];
      const editMap = new Map();
      
      for (const edit of edits) {
        console.log('Processing edit:', JSON.stringify(edit, null, 2));
        if (edit.type === 'replaceText') {
          const key = `${edit.pageNumber}-${edit.position.x}-${edit.position.y}`;
          editMap.set(key, edit); // Keep only the latest edit for each position
        } else {
          if (edit.type === 'addShape') {
            console.log('Found addShape operation:', edit.shapeType);
          }
          optimizedEdits.push(edit); // Keep non-text edits as-is
        }
      }
      
      // Add the final versions of text edits
      optimizedEdits.push(...editMap.values());
      
      console.log(`Optimized ${edits.length} edits to ${optimizedEdits.length} edits`);
      console.log('Optimized edits:', JSON.stringify(optimizedEdits, null, 2));

      const inputPath = path.join(__dirname, '..', 'uploads', fileName);
      const outputFileName = `edited-${Date.now()}-${fileName}`;
      const outputPath = path.join(__dirname, '..', 'outputs', outputFileName);

      console.log('File paths:', { inputPath, outputPath, outputFileName });

      // Ensure output directory exists
      console.log('Ensuring output directory exists...');
      await fs.ensureDir(path.dirname(outputPath));

      console.log('Checking if input file exists...');
      if (!await fs.pathExists(inputPath)) {
        console.log('Input file not found:', inputPath);
        return res.status(404).json({ error: 'PDF file not found' });
      }
      console.log('Input file exists:', inputPath);

      // Use enhanced PDF editor script that supports shapes
      const scriptPath = path.join(__dirname, '..', 'scripts', 'enhanced_pdf_editor.py');
      
      console.log('Checking if Python script exists...');
      // Check if script exists
      if (!await fs.pathExists(scriptPath)) {
        console.log('Python script not found:', scriptPath);
        return res.status(500).json({ error: 'Python script not found' });
      }
      console.log('Python script exists:', scriptPath);
      
      // Write edits to a temporary file to avoid command line argument issues
      const tempDir = os.tmpdir();
      const tempEditsFile = path.join(tempDir, `pdf-edits-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.json`);
      console.log('Creating temporary edits file:', tempEditsFile);
      await fs.writeFile(tempEditsFile, JSON.stringify(optimizedEdits, null, 2));
      console.log('Temporary edits file created successfully');
      
      let stdout, result;
      try {
        console.log('Executing Python script...');
        const command = `python "${scriptPath}" "${inputPath}" "${tempEditsFile}" "${outputPath}"`;
        console.log('Command:', command);
        
        // Add timeout to prevent hanging
        const execResult = await Promise.race([
          execAsync(command),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Python script timeout after 30 seconds')), 30000)
          )
        ]);
        stdout = execResult.stdout;
        console.log('Python script stdout:', stdout);
        
        // Clean up temporary file
        console.log('Cleaning up temporary file...');
        await fs.remove(tempEditsFile);
        console.log('Temporary file cleaned up');
        
        // Parse JSON output
        console.log('Parsing JSON output...');
        try {
          result = JSON.parse(stdout);
          console.log('JSON parsed successfully:', result);
        } catch (parseError) {
          console.error('Failed to parse Python script output:', parseError);
          console.error('Raw output:', stdout);
          throw new Error(`Invalid JSON output from Python script: ${parseError.message}`);
        }
      } catch (execError) {
        console.error('Python script execution error:', execError);
        // Clean up temporary file even if execution fails
        try {
          if (tempEditsFile) {
            await fs.remove(tempEditsFile);
            console.log('Temporary file cleaned up after error');
          }
        } catch (cleanupError) {
          console.warn('Failed to clean up temp file:', cleanupError.message);
        }
        
        throw new Error(`Python script failed: ${execError.message}`);
      }

      console.log('Processing result...');
      if (result.success) {
        console.log('Success! Sending response...');
        const response = {
          success: true,
          data: {
            fileName: outputFileName,
            downloadUrl: `/api/pdf-service/advanced-editor/download/${outputFileName}`,
            fileSize: result.fileSize
          }
        };
        console.log('Response:', response);
        res.json(response);
        console.log('Response sent successfully');
      } else {
        console.log('Failed result:', result);
        res.status(500).json({
          success: false,
          error: result.error
        });
      }

    } catch (error) {
      console.error('=== APPLY EDITS ERROR ===');
      console.error('Edit application error:', error);
      console.error('Error stack:', error.stack);
      
      // Clean up temporary file if it exists
      if (tempEditsFile && await fs.pathExists(tempEditsFile)) {
        try {
          console.log('Cleaning up temporary file in error handler...');
          await fs.remove(tempEditsFile);
          console.log('Temporary file cleaned up in error handler');
        } catch (cleanupError) {
          console.warn('Failed to clean up temp file in error handler:', cleanupError.message);
        }
      }
      
      
      // Ensure response is sent even if there's an error
      if (!res.headersSent) {
        console.log('Sending error response...');
        res.status(500).json({
          success: false,
          error: 'Failed to apply edits',
          details: error.message
        });
        console.log('Error response sent');
      } else {
        console.log('Headers already sent, cannot send error response');
      }
    }
    console.log('=== APPLY EDITS END ===');
  },

  // Download edited PDF
  async downloadPdf(req, res) {
    try {
      const { fileName } = req.params;
      const filePath = path.join(__dirname, '..', 'outputs', fileName);

      if (!await fs.pathExists(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).json({ error: 'Download failed' });
        } else {
          // Clean up file after download
          setTimeout(() => {
            fs.remove(filePath).catch(console.error);
          }, 5000);
        }
      });

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({
        success: false,
        error: 'Download failed',
        details: error.message
      });
    }
  },

  // Get PDF page as image for preview
  async getPagePreview(req, res) {
    try {
      const { fileName, pageNumber = 1 } = req.query;

      if (!fileName) {
        return res.status(400).json({ error: 'File name is required' });
      }

      const filePath = path.join(__dirname, '..', 'uploads', fileName);
      
      if (!await fs.pathExists(filePath)) {
        return res.status(404).json({ error: 'PDF file not found' });
      }

      // Use Python script to convert page to image
      const scriptPath = path.join(__dirname, '..', 'scripts', 'pdf_page_to_image.py');
      const outputDir = path.join(__dirname, '..', 'temp-images');
      await fs.ensureDir(outputDir);
      
      const outputFileName = `preview-${Date.now()}-${pageNumber}.png`;
      const outputPath = path.join(outputDir, outputFileName);

      const { stdout } = await execAsync(
        `python "${scriptPath}" "${filePath}" ${pageNumber} "${outputPath}"`
      );
      
      const result = JSON.parse(stdout);

      if (result.success) {
        // Send image file
        res.sendFile(outputPath, (err) => {
          if (err) {
            console.error('Preview error:', err);
            res.status(500).json({ error: 'Failed to generate preview' });
          } else {
            // Clean up image file after sending
            setTimeout(() => {
              fs.remove(outputPath).catch(console.error);
            }, 1000);
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }

    } catch (error) {
      console.error('Preview error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate preview',
        details: error.message
      });
    }
  },

  // Serve uploaded PDF files
  async servePdfFile(req, res) {
    try {
      const { fileName } = req.params;
      const filePath = path.join(__dirname, '..', 'uploads', fileName);
      
      console.log('Serving file:', fileName);
      console.log('File path:', filePath);

      if (!await fs.pathExists(filePath)) {
        return res.status(404).json({ error: 'PDF file not found' });
      }

      // Check file size and first few bytes to verify it's a valid PDF
      const stats = await fs.stat(filePath);

      if (stats.size === 0) {
        return res.status(400).json({ error: 'PDF file is empty' });
      }

      // Read first few bytes to check PDF signature
      const buffer = await fs.readFile(filePath, { start: 0, end: 4 });
      const header = buffer.toString();

      if (!header.startsWith('%PDF')) {
        console.error('Invalid PDF header when serving:', header);
        return res.status(400).json({ error: 'Invalid PDF file format' });
      }

      // Set appropriate headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Stream the file
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('Error serving PDF file:', err);
          res.status(500).json({ error: 'Failed to serve PDF file' });
        }
      });

    } catch (error) {
      console.error('Serve PDF error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to serve PDF file',
        details: error.message
      });
    }
  },

  // Test endpoint to verify file upload
  async testFileUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const filePath = req.file.path;
      const fileName = req.file.filename;
      const originalName = req.file.originalname;

      // Verify the uploaded file is valid
      const stats = await fs.stat(filePath);

      if (stats.size === 0) {
        return res.status(400).json({ error: 'Uploaded file is empty' });
      }

      // Check PDF header
      const buffer = await fs.readFile(filePath, { start: 0, end: 10 });
      const header = buffer.toString();

      if (!header.startsWith('%PDF')) {
        console.error('Test upload - Invalid PDF header:', header);
        return res.status(400).json({ error: 'Invalid PDF file format' });
      }

      res.json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          fileName,
          originalName,
          filePath,
          fileSize: stats.size,
          mimeType: req.file.mimetype,
          header: header
        }
      });

    } catch (error) {
      console.error('Test upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test upload',
        details: error.message
      });
    }
  }
};

module.exports = {
  advancedPdfEditorController,
  upload
};
