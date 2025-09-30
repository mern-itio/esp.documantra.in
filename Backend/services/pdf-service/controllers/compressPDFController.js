const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

const execAsync = promisify(exec);

const compressPDFController = {
  async compressPDF(req, res) {
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

      // Verify uploaded file exists
      if (!await fs.pathExists(req.file.path)) {
        throw new Error(`Uploaded file not found at path: ${req.file.path}`);
      }

      // Ensure uploads directory exists
      const uploadsDir = path.dirname(req.file.path);
      await fs.ensureDir(uploadsDir);
      // console.log('Uploads directory ensured at:', uploadsDir);

      // Parse compression options
      const {
        compressionLevel = 'medium', // low, medium, high, custom
        imageQuality = 85, // 1-100
        downscaleImages = true,
        maxImageResolution = 150, // DPI
        removeMetadata = true,
        linearize = true,
        objectStreams = 'generate', // disable, preserve, generate
        compressionMethod = 'auto', // auto, jpeg, flate
        customSettings = {}
      } = req.body;

      // console.log('Compression options:', {
      //   compressionLevel,
      //   imageQuality,
      //   downscaleImages,
      //   maxImageResolution,
      //   removeMetadata,
      //   linearize,
      //   objectStreams,
      //   compressionMethod
      // });

      // Create output filename
      const outputFilename = `compressed-${Date.now()}.pdf`;
      const outputPath = path.join(__dirname, '..', 'outputs', outputFilename);

      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));

      // Build qpdf command based on compression level
      let qpdfCommand = `qpdf "${req.file.path}" "${outputPath}"`;

      // Add compression options based on level
      switch (compressionLevel) {
        case 'low':
          qpdfCommand += ' --linearize --object-streams=generate --compression-level=1 --optimize-images';
          break;
        case 'medium':
          qpdfCommand += ' --linearize --object-streams=generate --compression-level=5 --optimize-images';
          break;
        case 'high':
          qpdfCommand += ' --linearize --object-streams=generate --compression-level=9 --optimize-images';
          break;
        case 'custom':
          // Use custom settings
          qpdfCommand += ' --linearize --object-streams=generate --optimize-images';
          if (customSettings.compressionLevel) {
            qpdfCommand += ` --compression-level=${customSettings.compressionLevel}`;
          }
          if (customSettings.objectStreams) {
            qpdfCommand += ` --object-streams=${customSettings.objectStreams}`;
          }
          break;
        default:
          qpdfCommand += ' --linearize --object-streams=generate --compression-level=5 --optimize-images';
      }

      // Add object streams option
      if (objectStreams !== 'auto') {
        qpdfCommand += ` --object-streams=${objectStreams}`;
      }

      // Add linearization
      if (linearize) {
        qpdfCommand += ' --linearize';
      }

      // console.log('Executing qpdf compression command:', qpdfCommand);

      try {
        const { stdout, stderr } = await execAsync(qpdfCommand);
        if (stderr) {
          console.log('qpdf stderr:', stderr);
        }
        if (stdout) {
          console.log('qpdf stdout:', stdout);
        }
      } catch (qpdfError) {
        console.error('qpdf command failed:', qpdfError);
        throw new Error(`qpdf command failed: ${qpdfError.message}`);
      }

      // Verify the output file was created
      if (!await fs.pathExists(outputPath)) {
        throw new Error('Output file was not created by qpdf');
      }

      // Get original file size for comparison
      const originalStats = await fs.stat(req.file.path);
      const originalFileSize = originalStats.size;

      // Use Ghostscript for advanced image compression if available
      try {
        const { stdout: gsVersion } = await execAsync('gs --version');
        // console.log('Ghostscript version:', gsVersion.trim());

        // Create Ghostscript command for advanced compression
        const gsOutputPath = path.join(__dirname, '..', 'outputs', `gs-${outputFilename}`);
        
        let gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/`;
        
        // Set PDF settings based on compression level
        switch (compressionLevel) {
          case 'low':
            gsCommand += 'screen'; // 72 DPI
            break;
          case 'medium':
            gsCommand += 'ebook'; // 150 DPI
            break;
          case 'high':
            gsCommand += 'printer'; // 300 DPI
            break;
          case 'custom':
            gsCommand += 'ebook'; // Default to ebook for custom
            break;
          default:
            gsCommand += 'ebook';
        }

        // Add custom image quality settings
        if (compressionLevel === 'custom' && customSettings.imageQuality) {
          gsCommand += ` -dJPEGQUALITY=${customSettings.imageQuality}`;
        } else {
          gsCommand += ` -dJPEGQUALITY=${imageQuality}`;
        }

        // Add downscaling options
        if (downscaleImages) {
          gsCommand += ` -dDownsampleColorImages=true -dDownsampleGrayImages=true -dDownsampleMonoImages=true`;
          gsCommand += ` -dColorImageResolution=${maxImageResolution}`;
          gsCommand += ` -dGrayImageResolution=${maxImageResolution}`;
          gsCommand += ` -dMonoImageResolution=${maxImageResolution}`;
        }

        // Add metadata removal
        if (removeMetadata) {
          gsCommand += ' -dPDFACompatibilityPolicy=1';
        }

        gsCommand += ` -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${gsOutputPath}" "${req.file.path}"`;

        // console.log('Executing Ghostscript command:', gsCommand);
        const gsResult = await execAsync(gsCommand);
        // console.log('Ghostscript execution result:', {
        //   stdout: gsResult.stdout,
        //   stderr: gsResult.stderr
        // });

        // Check if Ghostscript output was created and compare sizes
        if (await fs.pathExists(gsOutputPath)) {
          const gsStats = await fs.stat(gsOutputPath);
          const qpdfStats = await fs.stat(outputPath);
          
          // console.log('File size comparison:', {
          //   original: originalFileSize,
          //   qpdf: qpdfStats.size,
          //   ghostscript: gsStats.size
          // });
          
          // Use the smaller file
          if (gsStats.size < qpdfStats.size) {
            await fs.move(gsOutputPath, outputPath, { overwrite: true });
            // console.log('Using Ghostscript output (smaller file)');
          } else {
            await fs.unlink(gsOutputPath);
            // console.log('Using qpdf output (smaller file)');
          }
        }

      } catch (gsError) {
        console.log('Ghostscript error:', gsError.message);
        console.log('Ghostscript stderr:', gsError.stderr);
        console.log('Ghostscript stdout:', gsError.stdout);
        console.log('Using qpdf only - Ghostscript failed');
      }

      // Verify the final output file was created
      if (!await fs.pathExists(outputPath)) {
        throw new Error(`Output file was not created at path: ${outputPath}`);
      }

      // console.log(`Output file created successfully at: ${outputPath}`);

      // Get file size
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;
      const sizeReduction = originalFileSize - fileSize;
      const compressionRatio = ((sizeReduction / originalFileSize) * 100).toFixed(2);

      // console.log('File size calculation:', {
      //   originalFileSize,
      //   compressedFileSize: fileSize,
      //   sizeReduction,
      //   compressionRatio: `${compressionRatio}%`
      // });

      // console.log('Compression settings applied:', {
      //   compressionLevel,
      //   imageQuality,
      //   maxImageResolution,
      //   downscaleImages,
      //   removeMetadata,
      //   linearize,
      //   objectStreams,
      //   compressionMethod
      // });

      // Check if compression actually reduced file size
      if (fileSize >= originalFileSize) {
        console.warn('Compression increased file size, this might indicate the file is already well-compressed');
        // For very small files, this is normal due to PDF structure overhead
        if (originalFileSize < 10240) { // Less than 10KB
          console.log('Small file detected - size increase is normal due to PDF structure overhead');
        }
      }

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
          action: 'compressed',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          isTracked: true,
          trackingSource: 'automatic',
          metadata: {
            originalFileSize,
            compressedFileSize: fileSize,
            sizeReduction,
            compressionRatio: `${compressionRatio}%`,
            compressionPreset: compressionLevel,
            imageQuality: imageQuality,
            maxImageResolution: maxImageResolution,
            removeMetadata: removeMetadata,
            downscaleImages: downscaleImages,
            linearize: linearize,
            objectStreams: objectStreams,
            compressionMethod: compressionMethod,
            customSettings: customSettings
          }
        });

        await trackingRecord.save();
        // console.log('Document tracking event logged for PDF compression');
      } catch (trackingError) {
        console.error('Failed to log document tracking event:', trackingError);
        // Don't fail the main operation if tracking fails
      }

      res.json({
        success: true,
        message: 'PDF compressed successfully',
        filename: outputFilename,
        downloadUrl: `/pdf-compress/download/${outputFilename}`,
        originalFileSize: originalFileSize,
        compressedFileSize: fileSize,
        sizeReduction: sizeReduction,
        compressionRatio: `${compressionRatio}%`,
        compressionPreset: compressionLevel,
        imageQuality: imageQuality,
        maxImageResolution: maxImageResolution,
        removeMetadata: removeMetadata,
        downscaleImages: downscaleImages,
        linearize: linearize,
        objectStreams: objectStreams,
        compressionMethod: compressionMethod,
        customSettings: customSettings
      });

    } catch (error) {
      console.error('Error compressing PDF:', error);
      
      res.status(500).json({
        error: 'Failed to compress PDF',
        details: error.message
      });
    }
  },

  // Helper method to check compression tools
  async checkCompressionTools() {
    const tools = {};
    
    try {
      const { stdout: qpdfVersion } = await execAsync('qpdf --version');
      tools.qpdf = {
        installed: true,
        version: qpdfVersion.trim(),
        message: 'qpdf is properly installed and working'
      };
    } catch (error) {
      tools.qpdf = {
        installed: false,
        error: error.message,
        message: 'qpdf is not installed or not accessible'
      };
    }

    try {
      const { stdout: gsVersion } = await execAsync('gs --version');
      tools.ghostscript = {
        installed: true,
        version: gsVersion.trim(),
        message: 'Ghostscript is properly installed and working'
      };
    } catch (error) {
      tools.ghostscript = {
        installed: false,
        error: error.message,
        message: 'Ghostscript is not installed or not accessible. Advanced image compression will not be available.'
      };
    }

    return tools;
  }
};

module.exports = compressPDFController;
