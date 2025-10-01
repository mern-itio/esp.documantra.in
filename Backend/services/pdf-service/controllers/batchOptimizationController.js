const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');

const execAsync = promisify(exec);

const batchOptimizationController = {
  // Get available optimization presets
  async getOptimizationPresets(req, res) {
    try {
      const presets = [
        {
          id: 'web_optimized',
          name: 'Web Optimized',
          description: 'Optimized for fast web loading and streaming',
          settings: {
            compressionLevel: 'high',
            imageQuality: 72,
            downscaleImages: true,
            maxImageResolution: 150,
            removeMetadata: true,
            linearize: true,
            objectStreams: 'generate',
            compressionMethod: 'auto',
            webOptimization: true,
            fastLoading: true
          },
          estimatedReduction: '40-70%',
          useCase: 'Web publishing, online sharing'
        },
        {
          id: 'print_optimized',
          name: 'Print Optimized',
          description: 'Maintains high quality for professional printing',
          settings: {
            compressionLevel: 'medium',
            imageQuality: 300,
            downscaleImages: false,
            maxImageResolution: 300,
            removeMetadata: false,
            linearize: false,
            objectStreams: 'preserve',
            compressionMethod: 'auto',
            printOptimization: true,
            highQuality: true
          },
          estimatedReduction: '20-40%',
          useCase: 'Professional printing, publishing'
        },
        {
          id: 'mobile_optimized',
          name: 'Mobile Optimized',
          description: 'Smallest file size for mobile devices',
          settings: {
            compressionLevel: 'high',
            imageQuality: 150,
            downscaleImages: true,
            maxImageResolution: 200,
            removeMetadata: true,
            linearize: true,
            objectStreams: 'generate',
            compressionMethod: 'jpeg',
            mobileOptimization: true,
            smallSize: true
          },
          estimatedReduction: '50-80%',
          useCase: 'Mobile apps, email attachments'
        },
        {
          id: 'archive_optimized',
          name: 'Archive Optimized',
          description: 'Balanced optimization for long-term storage',
          settings: {
            compressionLevel: 'medium',
            imageQuality: 200,
            downscaleImages: true,
            maxImageResolution: 200,
            removeMetadata: true,
            linearize: true,
            objectStreams: 'generate',
            compressionMethod: 'auto',
            archiveOptimization: true,
            balanced: true
          },
          estimatedReduction: '30-60%',
          useCase: 'Document archiving, storage'
        }
      ];

      res.json({
        success: true,
        presets: presets
      });
    } catch (error) {
      console.error('Error getting optimization presets:', error);
      res.status(500).json({
        error: 'Failed to get optimization presets',
        message: error.message
      });
    }
  },

  // Batch optimize multiple PDFs
  async batchOptimize(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const {
        preset = 'web_optimized',
        customSettings = {},
        optimizationProfile = 'balanced'
      } = req.body;

      // console.log('Batch optimization request received:', {
      //   files: req.files.length,
      //   preset,
      //   optimizationProfile,
      //   customSettings
      // });

      // Get preset settings
      const presets = await batchOptimizationController.getOptimizationPresetsInternal();
      const selectedPreset = presets.find(p => p.id === preset) || presets[0];
      const settings = { ...selectedPreset.settings, ...customSettings };

      const results = [];
      const errors = [];
      const totalFiles = req.files.length;

      // Process files sequentially to avoid overwhelming the system
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        
        try {
          // console.log(`Processing file ${i + 1}/${totalFiles}: ${file.originalname}`);
          
          // Create output filename
          const outputFilename = `batch-optimized-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`;
          const outputPath = path.join(__dirname, '..', 'outputs', outputFilename);
          
          // Ensure output directory exists
          await fs.ensureDir(path.dirname(outputPath));
          
          // Build optimization command based on settings
          let optimizeCommand = `qpdf "${file.path}" "${outputPath}"`;
          
          // Add compression options
          if (settings.compressionLevel === 'high') {
            optimizeCommand += ' --compression-level=9';
          } else if (settings.compressionLevel === 'low') {
            optimizeCommand += ' --compression-level=1';
          } else {
            optimizeCommand += ' --compression-level=5';
          }
          
          // Add object streams
          if (settings.objectStreams !== 'auto') {
            optimizeCommand += ` --object-streams=${settings.objectStreams}`;
          }
          
          // Add linearization for web optimization
          if (settings.linearize) {
            optimizeCommand += ' --linearize';
          }
          
          // Execute optimization
          await execAsync(optimizeCommand);
          
          // Get file stats
          const originalStats = await fs.stat(file.path);
          const outputStats = await fs.stat(outputPath);
          
          const sizeChange = outputStats.size - originalStats.size;
          const sizeChangePercent = ((sizeChange / originalStats.size) * 100).toFixed(2);
          const sizeReduction = originalStats.size - outputStats.size;
          const compressionRatio = ((sizeReduction / originalStats.size) * 100).toFixed(2);

          results.push({
            filename: file.originalname,
            outputFilename: outputFilename,
            downloadUrl: `/outputs/${outputFilename}`,
            originalSize: originalStats.size,
            optimizedSize: outputStats.size,
            sizeChange: sizeChange,
            sizeChangePercent: sizeChangePercent,
            sizeReduction: sizeReduction,
            compressionRatio: compressionRatio,
            success: true,
            preset: preset,
            settings: settings
          });

        } catch (error) {
          console.error(`Batch optimization error for ${file.originalname}:`, error);
          errors.push({
            filename: file.originalname,
            error: error.message,
            success: false
          });
        }
      }

      const successfulFiles = results.length;
      const failedFiles = errors.length;

      // Create ZIP file for batch download if multiple files
      let batchDownloadUrl = null;
      if (results.length > 1) {
        try {
          const zipFilename = `batch_optimization_${Date.now()}.zip`;
          const zipPath = path.join(__dirname, '..', 'outputs', zipFilename);
          
          const output = fs.createWriteStream(zipPath);
          const archive = archiver('zip', { zlib: { level: 9 } });
          
          output.on('close', () => {
            console.log('Batch optimization ZIP created:', archive.pointer() + ' total bytes');
          });
          
          archive.pipe(output);
          
          // Add all successful files to ZIP
          for (const result of results) {
            const filePath = path.join(__dirname, '..', 'outputs', result.outputFilename);
            if (await fs.pathExists(filePath)) {
              archive.file(filePath, { name: result.outputFilename });
            }
          }
          
          await archive.finalize();
          batchDownloadUrl = `/outputs/${zipFilename}`;
        } catch (zipError) {
          console.error('Error creating batch download ZIP:', zipError);
        }
      }

      res.json({
        success: true,
        message: `Batch optimization completed: ${successfulFiles}/${totalFiles} files processed successfully`,
        results: results,
        errors: errors,
        summary: {
          totalFiles,
          successfulFiles,
          failedFiles,
          totalOriginalSize: results.reduce((sum, r) => sum + r.originalSize, 0),
          totalOptimizedSize: results.reduce((sum, r) => sum + r.optimizedSize, 0),
          averageCompressionRatio: results.length > 0 ? 
            (results.reduce((sum, r) => sum + parseFloat(r.compressionRatio), 0) / results.length).toFixed(2) : '0'
        },
        batchDownloadUrl,
        preset: preset,
        settings: settings
      });

    } catch (error) {
      console.error('Batch optimization error:', error);
      res.status(500).json({
        error: 'Batch optimization failed',
        message: error.message
      });
    }
  },

  // Get optimization presets internally (for controller use)
  async getOptimizationPresetsInternal() {
    return [
      {
        id: 'web_optimized',
        name: 'Web Optimized',
        description: 'Optimized for fast web loading and streaming',
        settings: {
          compressionLevel: 'high',
          imageQuality: 72,
          downscaleImages: true,
          maxImageResolution: 150,
          removeMetadata: true,
          linearize: true,
          objectStreams: 'generate',
          compressionMethod: 'auto',
          webOptimization: true,
          fastLoading: true
        },
        estimatedReduction: '40-70%',
        useCase: 'Web publishing, online sharing'
      },
      {
        id: 'print_optimized',
        name: 'Print Optimized',
        description: 'Maintains high quality for professional printing',
        settings: {
          compressionLevel: 'medium',
          imageQuality: 300,
          downscaleImages: false,
          maxImageResolution: 300,
          removeMetadata: false,
          linearize: false,
          objectStreams: 'preserve',
          compressionMethod: 'auto',
          printOptimization: true,
          highQuality: true
        },
        estimatedReduction: '20-40%',
        useCase: 'Professional printing, publishing'
      },
      {
        id: 'mobile_optimized',
        name: 'Mobile Optimized',
        description: 'Smallest file size for mobile devices',
        settings: {
          compressionLevel: 'high',
          imageQuality: 150,
          downscaleImages: true,
          maxImageResolution: 200,
          removeMetadata: true,
          linearize: true,
          objectStreams: 'generate',
          compressionMethod: 'jpeg',
          mobileOptimization: true,
          smallSize: true
        },
        estimatedReduction: '50-80%',
        useCase: 'Mobile apps, email attachments'
      },
      {
        id: 'archive_optimized',
        name: 'Archive Optimized',
        description: 'Balanced optimization for long-term storage',
        settings: {
          compressionLevel: 'medium',
          imageQuality: 200,
          downscaleImages: true,
          maxImageResolution: 200,
          removeMetadata: true,
          linearize: true,
          objectStreams: 'generate',
          compressionMethod: 'auto',
          archiveOptimization: true,
          balanced: true
        },
        estimatedReduction: '30-60%',
        useCase: 'Document archiving, storage'
      }
    ];
  },

  // Check optimization tools availability
  async checkOptimizationTools(req, res) {
    try {
      const tools = {};
      
      // Check qpdf
      try {
        const { stdout: qpdfVersion } = await execAsync('qpdf --version');
        tools.qpdf = {
          installed: true,
          version: qpdfVersion.trim().split('\n')[0],
          message: 'QPDF is available for PDF optimization'
        };
      } catch (error) {
        tools.qpdf = {
          installed: false,
          message: 'QPDF is not installed or not accessible',
          error: error.message
        };
      }
      
      // Check ghostscript
      try {
        const { stdout: gsVersion } = await execAsync('gs --version');
        tools.ghostscript = {
          installed: true,
          version: gsVersion.trim(),
          message: 'Ghostscript is available for advanced optimization'
        };
      } catch (error) {
        tools.ghostscript = {
          installed: false,
          message: 'Ghostscript is not installed or not accessible',
          error: error.message
        };
      }

      res.json({
        success: true,
        tools: tools
      });
    } catch (error) {
      console.error('Error checking optimization tools:', error);
      res.status(500).json({
        error: 'Failed to check optimization tools',
        message: error.message
      });
    }
  }
};

module.exports = batchOptimizationController;
