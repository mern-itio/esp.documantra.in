const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

const execAsync = promisify(exec);

const editMetadataController = {
  async editMetadata(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Verify uploaded file exists
      if (!await fs.pathExists(req.file.path)) {
        throw new Error(`Uploaded file not found at path: ${req.file.path}`);
      }

      // Ensure uploads directory exists
      const uploadsDir = path.dirname(req.file.path);
      await fs.ensureDir(uploadsDir);

      // Parse metadata fields from request body
      const {
        title = '',
        author = '',
        subject = '',
        keywords = '',
        creator = '',
        producer = '',
        creationDate = '',
        modificationDate = '',
        trapped = '',
        customProperties = '{}'
      } = req.body;

      // Parse custom properties if provided
      let customProps = {};
      try {
        if (customProperties && customProperties !== '{}') {
          customProps = JSON.parse(customProperties);
        }
      } catch (error) {
        console.warn('Failed to parse custom properties:', error.message);
      }

      // Create output filename
      const outputFilename = `edited-metadata-${Date.now()}.pdf`;
      const outputPath = path.join(__dirname, '..', 'outputs', outputFilename);

      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));

      // First, copy the original file to output
      await fs.copy(req.file.path, outputPath);

      // Use exiftool to edit metadata
      try {
        let exifCommand = 'exiftool';
        let exifVersion = '';

        // Try to find exiftool
        try {
          const { stdout: version } = await execAsync('exiftool -ver');
          exifVersion = version.trim();
        } catch (error) {
          // Try alternative paths
          const possiblePaths = [
            './exiftool.exe',
            '../exiftool.exe',
            'exiftool.exe',
            'C:\\Program Files\\ExifTool\\exiftool.exe',
            'C:\\exiftool\\exiftool.exe'
          ];

          for (const path of possiblePaths) {
            try {
              const { stdout: version } = await execAsync(`"${path}" -ver`);
              exifCommand = `"${path}"`;
              exifVersion = version.trim();
              break;
            } catch (pathError) {
              // Continue to next path
            }
          }
        }

        if (!exifVersion) {
          throw new Error('ExifTool not found in any location');
        }

        // Build exiftool command with metadata fields
        let metadataCommand = exifCommand;

        // Add standard PDF metadata fields
        if (title) metadataCommand += ` -Title="${title}"`;
        if (author) metadataCommand += ` -Author="${author}"`;
        if (subject) metadataCommand += ` -Subject="${subject}"`;
        if (keywords) metadataCommand += ` -Keywords="${keywords}"`;
        if (creator) metadataCommand += ` -Creator="${creator}"`;
        if (producer) metadataCommand += ` -Producer="${producer}"`;
        if (creationDate) metadataCommand += ` -CreateDate="${creationDate}"`;
        if (modificationDate) metadataCommand += ` -ModifyDate="${modificationDate}"`;
        if (trapped) metadataCommand += ` -Trapped="${trapped}"`;

        // Add PDF-specific metadata fields
        if (title) metadataCommand += ` -PDF:Title="${title}"`;
        if (author) metadataCommand += ` -PDF:Author="${author}"`;
        if (subject) metadataCommand += ` -PDF:Subject="${subject}"`;
        if (keywords) metadataCommand += ` -PDF:Keywords="${keywords}"`;
        if (creator) metadataCommand += ` -PDF:Creator="${creator}"`;
        if (producer) metadataCommand += ` -PDF:Producer="${producer}"`;

        // Add custom properties
        Object.entries(customProps).forEach(([key, value]) => {
          if (key && value !== undefined && value !== '') {
            metadataCommand += ` -PDF:${key}="${value}"`;
          }
        });

        // Add the file path and overwrite flag
        metadataCommand += ` -overwrite_original "${outputPath}"`;

        // Execute the metadata editing command
        await execAsync(metadataCommand);

        // Use qpdf to optimize the file after metadata editing
        try {
          const finalOutputPath = path.join(__dirname, '..', 'outputs', `final-${outputFilename}`);
          await execAsync(`qpdf --linearize "${outputPath}" "${finalOutputPath}"`);
          await fs.move(finalOutputPath, outputPath, { overwrite: true });
        } catch (qpdfError) {
          console.warn('qpdf optimization failed:', qpdfError.message);
        }

        // Verify the metadata was applied
        try {
          const { stdout: verificationOutput } = await execAsync(`${exifCommand} -a -u -g1 "${outputPath}"`);
          console.log('Metadata verification completed');
        } catch (verificationError) {
          console.warn('Metadata verification failed:', verificationError.message);
        }

      } catch (exifError) {
        console.error('ExifTool metadata editing failed:', exifError.message);
        throw new Error(`Failed to edit metadata: ${exifError.message}`);
      }

      // Verify the output file was created
      if (!await fs.pathExists(outputPath)) {
        throw new Error(`Output file was not created at path: ${outputPath}`);
      }

      // Get file size
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;
      const originalStats = await fs.stat(req.file.path);
      const originalFileSize = originalStats.size;

      // Get page count using qpdf
      let pageCount = 0;
      try {
        const { stdout: pagesOutput } = await execAsync(`qpdf --show-pages "${outputPath}"`);
        const pageMatch = pagesOutput.match(/(\d+)\s+page/);
        if (pageMatch) {
          pageCount = parseInt(pageMatch[1]);
        }
      } catch (error) {
        console.warn('Could not determine page count:', error.message);
        pageCount = 'Unknown';
      }

      // Get updated metadata info
      let metadataInfo = {};
      try {
        const { stdout: updatedMetadata } = await execAsync(`exiftool -a -u -g1 "${outputPath}"`);
        metadataInfo.updatedMetadata = updatedMetadata;
      } catch (error) {
        metadataInfo.updatedMetadata = 'Could not read updated metadata';
      }

      // Clean up uploaded file
      await fs.remove(req.file.path);

      // Log document tracking event
      try {
        console.log('Attempting to log document tracking event...');
        const DocumentTracking = require('../models/documentTracking');
        console.log('DocumentTracking model loaded successfully');
        
        const documentId = crypto.randomBytes(16).toString('hex');
        const userId = req.user?.id || 'anonymous';
        
        console.log('Creating tracking record with:', {
          documentId,
          documentName: req.file.originalname,
          userId,
          action: 'metadata_edited'
        });
        
        const trackingRecord = new DocumentTracking({
          documentId,
          documentName: req.file.originalname,
          documentType: 'pdf',
          originalFilename: req.file.originalname,
          userId,
          action: 'metadata_edited',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          isTracked: true,
          trackingSource: 'automatic',
          metadata: {
            originalFileSize,
            editedFileSize: fileSize,
            metadataChanges: {
              title,
              author,
              subject,
              keywords,
              creator,
              producer,
              creationDate,
              modificationDate,
              trapped,
              customProperties: customProps
            },
            updatedMetadata: metadataInfo.updatedMetadata
          }
        });

        console.log('Tracking record created, attempting to save...');
        await trackingRecord.save();
        console.log('Document tracking event logged successfully for metadata editing');
      } catch (trackingError) {
        console.error('Failed to log document tracking event:', trackingError);
        // Don't fail the main operation if tracking fails
      }

      res.json({
        success: true,
        message: 'Metadata edited successfully',
        filename: outputFilename,
        downloadUrl: `/pdf-edit-metadata/download/${outputFilename}`,
        totalPages: pageCount,
        fileSize: fileSize,
        originalFileSize: originalFileSize,
        metadataInfo: metadataInfo,
        appliedMetadata: {
          title,
          author,
          subject,
          keywords,
          creator,
          producer,
          creationDate,
          modificationDate,
          trapped,
          customProperties: customProps
        }
      });

    } catch (error) {
      console.error('Error editing metadata:', error);

      res.status(500).json({
        error: 'Failed to edit PDF metadata',
        details: error.message
      });
    }
  },

  // Helper method to get current metadata
  async getCurrentMetadata(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      let metadataInfo = {};

      // Use exiftool for comprehensive metadata if available
      try {
        let exifCommand = 'exiftool';
        
        try {
          await execAsync('exiftool -ver');
        } catch (error) {
          // Try alternative paths
          const possiblePaths = [
            './exiftool.exe',
            '../exiftool.exe',
            'exiftool.exe',
            'C:\\Program Files\\ExifTool\\exiftool.exe',
            'C:\\exiftool\\exiftool.exe'
          ];

          for (const path of possiblePaths) {
            try {
              await execAsync(`"${path}" -ver`);
              exifCommand = `"${path}"`;
              break;
            } catch (pathError) {
              // Continue to next path
            }
          }
        }

        const { stdout: exifInfo } = await execAsync(`${exifCommand} -a -u -g1 "${req.file.path}"`);
        metadataInfo.exifInfo = exifInfo;

        // Extract specific metadata fields
        const { stdout: titleInfo } = await execAsync(`${exifCommand} -Title "${req.file.path}"`);
        const { stdout: authorInfo } = await execAsync(`${exifCommand} -Author "${req.file.path}"`);
        const { stdout: subjectInfo } = await execAsync(`${exifCommand} -Subject "${req.file.path}"`);
        const { stdout: keywordsInfo } = await execAsync(`${exifCommand} -Keywords "${req.file.path}"`);
        const { stdout: creatorInfo } = await execAsync(`${exifCommand} -Creator "${req.file.path}"`);
        const { stdout: producerInfo } = await execAsync(`${exifCommand} -Producer "${req.file.path}"`);
        const { stdout: createDateInfo } = await execAsync(`${exifCommand} -CreateDate "${req.file.path}"`);
        const { stdout: modifyDateInfo } = await execAsync(`${exifCommand} -ModifyDate "${req.file.path}"`);
        const { stdout: trappedInfo } = await execAsync(`${exifCommand} -Trapped "${req.file.path}"`);

        // Parse the metadata values
        metadataInfo.currentMetadata = {
          title: this.extractMetadataValue(titleInfo),
          author: this.extractMetadataValue(authorInfo),
          subject: this.extractMetadataValue(subjectInfo),
          keywords: this.extractMetadataValue(keywordsInfo),
          creator: this.extractMetadataValue(creatorInfo),
          producer: this.extractMetadataValue(producerInfo),
          creationDate: this.extractMetadataValue(createDateInfo),
          modificationDate: this.extractMetadataValue(modifyDateInfo),
          trapped: this.extractMetadataValue(trappedInfo)
        };

      } catch (error) {
        metadataInfo.exifInfo = 'ExifTool not available or failed to read metadata';
        metadataInfo.currentMetadata = {};
      }

      // Use qpdf to check basic PDF info
      try {
        const { stdout: qpdfInfo } = await execAsync(`qpdf --show-encryption "${req.file.path}"`);
        metadataInfo.qpdfInfo = qpdfInfo;
      } catch (error) {
        metadataInfo.qpdfInfo = 'Could not read PDF info with qpdf';
      }

      // Clean up uploaded file
      await fs.remove(req.file.path);

      res.json({
        success: true,
        metadataFound: true,
        metadataInfo: metadataInfo,
        message: 'Metadata analysis completed'
      });

    } catch (error) {
      console.error('Error getting current metadata:', error);
      res.status(500).json({
        error: 'Failed to get PDF metadata',
        details: error.message
      });
    }
  },

  // Helper method to extract metadata value from exiftool output
  extractMetadataValue(output) {
    if (!output || output.includes('not defined')) {
      return '';
    }
    
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes(':')) {
        const value = line.split(':').slice(1).join(':').trim();
        if (value && value !== 'not defined') {
          return value;
        }
      }
    }
    return '';
  },

  // Helper method to test tools installation
  async testToolsInstallation() {
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

    // Try to find exiftool in common locations
    let exifToolFound = false;
    let exifToolPath = '';
    let exifToolVersion = '';

    try {
      const { stdout: exifVersion } = await execAsync('exiftool -ver');
      exifToolFound = true;
      exifToolPath = 'exiftool';
      exifToolVersion = exifVersion.trim();
    } catch (error) {
      // Try alternative paths
      const possiblePaths = [
        './exiftool.exe',
        '../exiftool.exe',
        'exiftool.exe',
        'C:\\Program Files\\ExifTool\\exiftool.exe',
        'C:\\exiftool\\exiftool.exe'
      ];

      for (const path of possiblePaths) {
        try {
          const { stdout: version } = await execAsync(`"${path}" -ver`);
          exifToolFound = true;
          exifToolPath = path;
          exifToolVersion = version.trim();
          break;
        } catch (pathError) {
          // Continue to next path
        }
      }
    }

    if (exifToolFound) {
      tools.exiftool = {
        installed: true,
        version: exifToolVersion,
        path: exifToolPath,
        message: `ExifTool is properly installed and working at ${exifToolPath}`
      };
    } else {
      tools.exiftool = {
        installed: false,
        error: 'ExifTool not found in any location',
        message: 'ExifTool is not installed or not accessible. Please install ExifTool for metadata editing functionality.'
      };
    }

    return tools;
  }
};

module.exports = editMetadataController;
