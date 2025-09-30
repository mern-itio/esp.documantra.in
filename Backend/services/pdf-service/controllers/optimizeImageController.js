const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

const execAsync = promisify(exec);

const optimizeImageController = {
  async optimizeImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // console.log('File upload received:', {
      //   originalname: req.file.originalname,
      //   filename: req.file.filename,
      //   path: req.file.path,
      //   size: req.file.size,
      //   mimetype: req.file.mimetype
      // });

      // Ensure uploads and outputs directories exist
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      const outputsDir = path.join(__dirname, '..', 'outputs');
      
      await fs.ensureDir(uploadsDir);
      await fs.ensureDir(outputsDir);
      
      // console.log('Uploads directory ensured at:', uploadsDir);
      // console.log('Outputs directory ensured at:', outputsDir);

      // Check if input file exists
      if (!await fs.pathExists(req.file.path)) {
        return res.status(400).json({ error: 'Uploaded file not found' });
      }

      // Parse optimization options
      const {
        imageQuality = 85, // 1-100
        maxResolution = 300, // DPI
        compressionLevel = 'medium', // low, medium, high
        formatConversion = 'auto', // auto, jpeg, png, webp
        downscaleImages = true,
        removeMetadata = true,
        optimizeForWeb = false,
        customSettings = {}
      } = req.body;

      // console.log('Full req.body received:', req.body);
      // console.log('Processing image optimization with options:', {
      //   imageQuality,
      //   maxResolution,
      //   compressionLevel,
      //   formatConversion,
      //   downscaleImages,
      //   removeMetadata,
      //   optimizeForWeb,
      //   customSettings
      // });

      // Generate output filename
      const timestamp = Date.now();
      const outputFilename = `optimized-${timestamp}.pdf`;
      const outputPath = path.join(outputsDir, outputFilename);

      // Check if Ghostscript is available for advanced image processing
      let gsAvailable = false;
      try {
        const { stdout: gsVersion } = await execAsync('gs --version');
        // console.log('Ghostscript version:', gsVersion.trim());
        gsAvailable = true;
      } catch (gsError) {
        console.log('Ghostscript not available, using qpdf only');
      }

      // Check if ImageMagick is available for format conversion
      let imagemagickAvailable = false;
      try {
        const { stdout: convertVersion } = await execAsync('convert --version');
        // console.log('ImageMagick version:', convertVersion.split('\n')[0]);
        imagemagickAvailable = true;
      } catch (convertError) {
        console.log('ImageMagick not available');
      }

      // Build optimization command based on available tools
      let optimizationCommand = '';
      let useGhostscript = false;

      if (gsAvailable) {
        // Use Ghostscript for advanced image optimization
        useGhostscript = true;
        let gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/`;
        
        // Set PDF settings based on compression level
        switch (compressionLevel) {
          case 'low':
            gsCommand += 'printer'; // 300 DPI
            break;
          case 'medium':
            gsCommand += 'ebook'; // 150 DPI
            break;
          case 'high':
            gsCommand += 'screen'; // 72 DPI
            break;
          default:
            gsCommand += 'ebook';
        }

        // Add image optimization parameters
        gsCommand += ` -dColorImageDownsampleType=/Bicubic`;
        gsCommand += ` -dColorImageResolution=${maxResolution}`;
        gsCommand += ` -dGrayImageDownsampleType=/Bicubic`;
        gsCommand += ` -dGrayImageResolution=${maxResolution}`;
        gsCommand += ` -dMonoImageDownsampleType=/Bicubic`;
        gsCommand += ` -dMonoImageResolution=${maxResolution}`;
        
        if (downscaleImages) {
          gsCommand += ` -dDownsampleColorImages=true -dDownsampleGrayImages=true -dDownsampleMonoImages=true`;
        } else {
          gsCommand += ` -dDownsampleColorImages=false -dDownsampleGrayImages=false -dDownsampleMonoImages=false`;
        }

        if (removeMetadata) {
          gsCommand += ` -dPDFX -dUseCIEColor`;
        }

        if (optimizeForWeb) {
          gsCommand += ` -dOptimize=true -dEmbedAllFonts=false`;
        }

        gsCommand += ` -o "${outputPath}" "${req.file.path}"`;
        optimizationCommand = gsCommand;
      } else {
        // Fallback to qpdf for basic optimization
        // console.log('Using qpdf fallback for image optimization');
        let qpdfCommand = `qpdf "${req.file.path}" "${outputPath}"`;
        
        if (compressionLevel === 'high') {
          qpdfCommand += ' --linearize --object-streams=generate --compression-level=9';
        } else if (compressionLevel === 'low') {
          qpdfCommand += ' --linearize --object-streams=generate --compression-level=1';
        } else {
          qpdfCommand += ' --linearize --object-streams=generate --compression-level=5';
        }

        optimizationCommand = qpdfCommand;
      }

      // console.log('Executing optimization command:', optimizationCommand);

      // Execute the optimization command
      const { stdout, stderr } = await execAsync(optimizationCommand);
      
      if (stderr) {
        console.log('Command stderr:', stderr);
      }
      if (stdout) {
        console.log('Command stdout:', stdout);
      }

      // Check if output file was created
      if (!await fs.pathExists(outputPath)) {
        throw new Error('Output file was not created');
      }

      // Get file size
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;
      const originalStats = await fs.stat(req.file.path);
      const originalFileSize = originalStats.size;
      const sizeReduction = originalFileSize - fileSize;
      const optimizationRatio = ((sizeReduction / originalFileSize) * 100).toFixed(2);

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
          action: 'optimized',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          isTracked: true,
          trackingSource: 'automatic',
          metadata: {
            originalFileSize,
            optimizedFileSize: fileSize,
            sizeReduction,
            optimizationRatio: `${optimizationRatio}%`,
            imageCompression: imageCompression,
            resolutionAdjustment: resolutionAdjustment,
            formatConversion: formatConversion,
            quality: quality,
            maxWidth: maxWidth,
            maxHeight: maxHeight
          }
        });

        await trackingRecord.save();
        // console.log('Document tracking event logged for image optimization');
      } catch (trackingError) {
        console.error('Failed to log document tracking event:', trackingError);
        // Don't fail the main operation if tracking fails
      }

      // Get PDF info for the optimized file
      let totalPages = 'Unknown';
      try {
        const { stdout: pdfInfo } = await execAsync(`pdfinfo "${outputPath}" | grep "Pages:" | awk '{print $2}'`);
        totalPages = pdfInfo.trim() || 'Unknown';
      } catch (pdfInfoError) {
        console.log('Could not get page count:', pdfInfoError.message);
      }

      // Clean up uploaded file
      await fs.remove(req.file.path);

      // Send response
      res.json({
        success: true,
        message: 'Images optimized successfully',
        filename: outputFilename,
        downloadUrl: `http://localhost:2104/pdf-optimize-image/download/${outputFilename}`,
        totalPages: totalPages,
        fileSize: fileSize,
        originalFileSize: originalFileSize,
        sizeReduction: sizeReduction,
        optimizationRatio: optimizationRatio,
        optimizationSettings: {
          imageQuality: parseInt(imageQuality),
          maxResolution: parseInt(maxResolution),
          compressionLevel,
          formatConversion,
          downscaleImages: downscaleImages === 'true' || downscaleImages === true,
          removeMetadata: removeMetadata === 'true' || removeMetadata === true,
          optimizeForWeb: optimizeForWeb === 'true' || optimizeForWeb === true,
          toolsUsed: useGhostscript ? 'Ghostscript' : 'qpdf'
        }
      });

    } catch (error) {
      console.error('Error optimizing images:', error);
      
      // Clean up uploaded file on error
      if (req.file && req.file.path) {
        try {
          await fs.remove(req.file.path);
        } catch (cleanupError) {
          console.log('Error cleaning up uploaded file:', cleanupError.message);
        }
      }

      res.status(500).json({
        error: 'Failed to optimize images in PDF',
        details: error.message
      });
    }
  },

  async checkOptimizationTools() {
    try {
      const tools = {
        ghostscript: { installed: false, version: null },
        imagemagick: { installed: false, version: null },
        qpdf: { installed: false, version: null }
      };

      // Check Ghostscript
      try {
        const { stdout: gsVersion } = await execAsync('gs --version');
        tools.ghostscript.installed = true;
        tools.ghostscript.version = gsVersion.trim();
      } catch (error) {
        console.log('Ghostscript not available');
      }

      // Check ImageMagick
      try {
        const { stdout: convertVersion } = await execAsync('convert --version');
        tools.imagemagick.installed = true;
        tools.imagemagick.version = convertVersion.split('\n')[0];
      } catch (error) {
        console.log('ImageMagick not available');
      }

      // Check qpdf
      try {
        const { stdout: qpdfVersion } = await execAsync('qpdf --version');
        tools.qpdf.installed = true;
        tools.qpdf.version = qpdfVersion.split('\n')[0];
      } catch (error) {
        console.log('qpdf not available');
      }

      return {
        success: true,
        tools,
        recommendations: {
          ghostscript: 'Required for advanced image optimization and resolution adjustment',
          imagemagick: 'Optional for format conversion and advanced image processing',
          qpdf: 'Required for basic PDF optimization and structure manipulation'
        }
      };
    } catch (error) {
      console.error('Error checking optimization tools:', error);
      return {
        success: false,
        error: 'Failed to check optimization tools',
        details: error.message
      };
    }
  }
};

module.exports = optimizeImageController;
