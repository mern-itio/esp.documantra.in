const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { PDFDocument } = require('pdf-lib');

// Import all conversion functions from pdfController
const {
  convertDocToPdf,
  convertPdfToDoc,
  convertPdfToExcel,
  convertExcelToPdf,
  convertExcelToDoc,
  convertDocToExcel,
  convertPdfToPpt,
  convertPptToPdf,
  convertPdfToTxt,
  convertTxtToPdf,
  convertPdfToHtml,
  convertHtmlToPdf,
  cleanupOldFiles
} = require('./pdfController');

// Import PDF to image conversion function from pdfToImage controller
const { convertSinglePageToImage } = require('./pdfToImage');

const execAsync = promisify(exec);

const smartConversionController = {
  // AI-powered format detection
  async detectFormat(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('Format detection request received:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      const filePath = req.file.path;
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      const mimeType = req.file.mimetype;

      // Enhanced format detection with AI-like analysis
      const formatAnalysis = await analyzeFileFormat(filePath, fileExtension, mimeType);
      
      // Determine optimal conversion settings
      const conversionRecommendations = generateConversionRecommendations(formatAnalysis);

      res.json({
        success: true,
        analysis: formatAnalysis,
        recommendations: conversionRecommendations,
        message: 'Format analysis completed successfully'
      });

    } catch (error) {
      console.error('Format detection error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze file format',
        message: error.message
      });
    }
  },

  // Smart conversion with quality optimization
  async smartConvert(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('Smart conversion request received:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      const {
        targetFormat = 'pdf',
        qualityLevel = 'auto', // auto, high, medium, low
        preserveLayout = true,
        optimizeForWeb = false,
        customSettings = {}
      } = req.body;

      const filePath = req.file.path;
      const originalName = req.file.originalname;
      const baseName = path.parse(originalName).name;

      // Analyze source format
      const sourceAnalysis = await analyzeFileFormat(filePath, path.extname(originalName), req.file.mimetype);
      
      // Generate optimal conversion settings
      const conversionSettings = generateOptimalSettings(sourceAnalysis, targetFormat, qualityLevel, {
        preserveLayout,
        optimizeForWeb,
        customSettings
      });

      // Perform conversion
      const conversionResult = await performSmartConversion(filePath, targetFormat, conversionSettings, baseName);

      // Quality analysis of converted file
      const qualityAnalysis = await analyzeConversionQuality(conversionResult.outputPath, targetFormat);

      res.json({
        success: true,
        conversion: {
          sourceFormat: sourceAnalysis.detectedFormat,
          targetFormat: targetFormat,
          outputFilename: conversionResult.filename,
          downloadUrl: `/smart-conversion/download/${conversionResult.filename}`,
          originalSize: req.file.size,
          convertedSize: conversionResult.size,
          sizeChange: conversionResult.size - req.file.size,
          sizeChangePercent: ((conversionResult.size - req.file.size) / req.file.size * 100).toFixed(2)
        },
        quality: qualityAnalysis,
        settings: conversionSettings,
        message: 'Smart conversion completed successfully'
      });

    } catch (error) {
      console.error('Smart conversion error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform smart conversion',
        message: error.message
      });
    }
  },

  // Batch smart conversion
  async batchSmartConvert(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      console.log('Batch smart conversion request received:', {
        fileCount: req.files.length,
        files: req.files.map(f => ({ name: f.originalname, size: f.size }))
      });

      const {
        targetFormat = 'pdf',
        qualityLevel = 'auto',
        preserveLayout = true,
        optimizeForWeb = false,
        customSettings = {}
      } = req.body;

      const results = [];
      const errors = [];

      for (const file of req.files) {
        try {
          const sourceAnalysis = await analyzeFileFormat(file.path, path.extname(file.originalname), file.mimetype);
          const conversionSettings = generateOptimalSettings(sourceAnalysis, targetFormat, qualityLevel, {
            preserveLayout,
            optimizeForWeb,
            customSettings
          });

          const conversionResult = await performSmartConversion(file.path, targetFormat, conversionSettings, path.parse(file.originalname).name);
          const qualityAnalysis = await analyzeConversionQuality(conversionResult.outputPath, targetFormat);

          results.push({
            originalName: file.originalname,
            outputFilename: conversionResult.filename,
            downloadUrl: `/smart-conversion/download/${conversionResult.filename}`,
            originalSize: file.size,
            convertedSize: conversionResult.size,
            sizeChange: conversionResult.size - file.size,
            sizeChangePercent: ((conversionResult.size - file.size) / file.size * 100).toFixed(2),
            quality: qualityAnalysis
          });
        } catch (error) {
          errors.push({
            filename: file.originalname,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        results,
        errors,
        summary: {
          totalFiles: req.files.length,
          successful: results.length,
          failed: errors.length
        },
        message: `Batch conversion completed: ${results.length} successful, ${errors.length} failed`
      });

    } catch (error) {
      console.error('Batch smart conversion error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform batch smart conversion',
        message: error.message
      });
    }
  },

  // Download converted file
  async downloadConvertedFile(req, res) {
    try {
      const { filename } = req.params;
      const filePath = path.join(__dirname, '../outputs', filename);

      if (!await fs.pathExists(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.download(filePath, filename, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).json({ error: 'Failed to download file' });
        }
      });

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Failed to download file' });
    }
  },

  // Get conversion presets
  async getConversionPresets(req, res) {
    try {
      const presets = {
        webOptimized: {
          name: 'Web Optimized',
          description: 'Optimized for web viewing and sharing',
          targetFormat: 'pdf',
          qualityLevel: 'medium',
          optimizeForWeb: true,
          preserveLayout: true,
          customSettings: {
            compressionLevel: 'high',
            imageQuality: 75,
            removeMetadata: true,
            linearize: true
          }
        },
        printQuality: {
          name: 'Print Quality',
          description: 'High quality for professional printing',
          targetFormat: 'pdf',
          qualityLevel: 'high',
          optimizeForWeb: false,
          preserveLayout: true,
          customSettings: {
            compressionLevel: 'low',
            imageQuality: 95,
            removeMetadata: false,
            linearize: false
          }
        },
        archive: {
          name: 'Archive',
          description: 'Long-term storage with maximum compression',
          targetFormat: 'pdf',
          qualityLevel: 'medium',
          optimizeForWeb: false,
          preserveLayout: true,
          customSettings: {
            compressionLevel: 'high',
            imageQuality: 85,
            removeMetadata: true,
            linearize: true,
            objectStreams: 'generate'
          }
        },
        mobile: {
          name: 'Mobile Friendly',
          description: 'Optimized for mobile devices',
          targetFormat: 'pdf',
          qualityLevel: 'medium',
          optimizeForWeb: true,
          preserveLayout: true,
          customSettings: {
            compressionLevel: 'high',
            imageQuality: 70,
            removeMetadata: true,
            linearize: true,
            maxImageResolution: 150
          }
        }
      };

      res.json({
        success: true,
        presets,
        message: 'Conversion presets retrieved successfully'
      });

    } catch (error) {
      console.error('Get presets error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve conversion presets',
        message: error.message
      });
    }
  },

  // Clean up old converted files
  async cleanupOldFiles(req, res) {
    try {
      const outputsDir = path.join(__dirname, '../outputs');
      await cleanupOldFiles(outputsDir, 24); // Clean files older than 24 hours

      res.json({
        success: true,
        message: 'Old files cleaned up successfully'
      });

    } catch (error) {
      console.error('Cleanup error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup old files',
        message: error.message
      });
    }
  }
};

// Helper function to analyze file format with AI-like detection
async function analyzeFileFormat(filePath, fileExtension, mimeType) {
  const analysis = {
    detectedFormat: 'unknown',
    confidence: 0,
    fileType: 'unknown',
    characteristics: [],
    metadata: {},
    quality: 'unknown',
    complexity: 'unknown'
  };

  try {
    // Basic format detection
    const formatMap = {
      '.pdf': 'pdf',
      '.doc': 'word',
      '.docx': 'word',
      '.xls': 'excel',
      '.xlsx': 'excel',
      '.ppt': 'powerpoint',
      '.pptx': 'powerpoint',
      '.txt': 'text',
      '.rtf': 'text',
      '.odt': 'word',
      '.ods': 'excel',
      '.odp': 'powerpoint',
      '.html': 'html',
      '.htm': 'html',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.png': 'image',
      '.gif': 'image',
      '.bmp': 'image',
      '.tiff': 'image',
      '.svg': 'image',
      '.eps': 'image',
      '.ai': 'image'
    };

    analysis.detectedFormat = formatMap[fileExtension] || 'unknown';
    analysis.confidence = formatMap[fileExtension] ? 0.9 : 0.3;

    // Get file metadata
    const stats = await fs.stat(filePath);
    analysis.metadata = {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      extension: fileExtension,
      mimeType: mimeType
    };

    // Analyze file characteristics based on format
    if (analysis.detectedFormat === 'pdf') {
      await analyzePDFCharacteristics(filePath, analysis);
    } else if (analysis.detectedFormat === 'image') {
      await analyzeImageCharacteristics(filePath, analysis);
    } else if (analysis.detectedFormat === 'word') {
      await analyzeWordCharacteristics(filePath, analysis);
    }

    // Determine quality and complexity
    analysis.quality = determineQuality(analysis);
    analysis.complexity = determineComplexity(analysis);

  } catch (error) {
    console.error('Format analysis error:', error);
    analysis.confidence = 0.1;
  }

  return analysis;
}

// Analyze PDF characteristics
async function analyzePDFCharacteristics(filePath, analysis) {
  try {
    const fileBytes = await fs.readFile(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes);
    
    analysis.characteristics.push('pdf_document');
    analysis.metadata.pageCount = pdfDoc.getPageCount();
    analysis.metadata.hasImages = false;
    analysis.metadata.hasText = false;
    analysis.metadata.hasForms = false;
    
    // Basic analysis of PDF content
    const pages = pdfDoc.getPages();
    if (pages.length > 0) {
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      analysis.metadata.pageSize = { width, height };
      
      // Check for text content (simplified)
      if (width > 0 && height > 0) {
        analysis.metadata.hasText = true;
        analysis.characteristics.push('contains_text');
      }
    }

    // Determine complexity based on page count and characteristics
    if (analysis.metadata.pageCount > 50) {
      analysis.characteristics.push('large_document');
    }
    if (analysis.metadata.pageCount > 100) {
      analysis.characteristics.push('very_large_document');
    }

  } catch (error) {
    console.error('PDF analysis error:', error);
    analysis.characteristics.push('corrupted_or_invalid');
  }
}

// Analyze image characteristics
async function analyzeImageCharacteristics(filePath, analysis) {
  try {
    const stats = await fs.stat(filePath);
    analysis.characteristics.push('image_file');
    
    // Basic image analysis
    if (stats.size > 5 * 1024 * 1024) { // 5MB
      analysis.characteristics.push('large_image');
    }
    if (stats.size > 20 * 1024 * 1024) { // 20MB
      analysis.characteristics.push('very_large_image');
    }

    // Determine image type characteristics
    const ext = path.extname(filePath).toLowerCase();
    if (['.jpg', '.jpeg'].includes(ext)) {
      analysis.characteristics.push('jpeg_compressed');
    } else if (ext === '.png') {
      analysis.characteristics.push('png_format');
    } else if (ext === '.gif') {
      analysis.characteristics.push('gif_format');
    }

  } catch (error) {
    console.error('Image analysis error:', error);
  }
}

// Analyze Word document characteristics
async function analyzeWordCharacteristics(filePath, analysis) {
  try {
    const stats = await fs.stat(filePath);
    analysis.characteristics.push('word_document');
    
    if (stats.size > 10 * 1024 * 1024) { // 10MB
      analysis.characteristics.push('large_document');
    }
    
    // Check if it's a newer format
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.docx') {
      analysis.characteristics.push('modern_format');
    } else if (ext === '.doc') {
      analysis.characteristics.push('legacy_format');
    }

  } catch (error) {
    console.error('Word analysis error:', error);
  }
}

// Determine quality level
function determineQuality(analysis) {
  if (analysis.characteristics.includes('corrupted_or_invalid')) {
    return 'poor';
  }
  if (analysis.characteristics.includes('very_large_document') || analysis.characteristics.includes('very_large_image')) {
    return 'high';
  }
  if (analysis.characteristics.includes('large_document') || analysis.characteristics.includes('large_image')) {
    return 'good';
  }
  return 'medium';
}

// Determine complexity level
function determineComplexity(analysis) {
  if (analysis.characteristics.includes('very_large_document') || analysis.characteristics.includes('very_large_image')) {
    return 'high';
  }
  if (analysis.characteristics.includes('large_document') || analysis.characteristics.includes('large_image')) {
    return 'medium';
  }
  return 'low';
}

// Generate conversion recommendations based on available conversion functions
function generateConversionRecommendations(analysis) {
  const recommendations = {
    targetFormats: [],
    qualitySettings: {},
    optimizationTips: [],
    warnings: []
  };

  // Recommend target formats based on source and available conversions
  switch (analysis.detectedFormat) {
    case 'word':
      recommendations.targetFormats = ['pdf', 'excel', 'html', 'txt'];
      break;
    case 'excel':
      recommendations.targetFormats = ['pdf', 'word', 'html'];
      break;
    case 'powerpoint':
      recommendations.targetFormats = ['pdf', 'html'];
      break;
    case 'pdf':
      recommendations.targetFormats = ['word', 'excel', 'powerpoint', 'html', 'txt', 'image'];
      break;
    case 'text':
      recommendations.targetFormats = ['pdf', 'word', 'html'];
      break;
    case 'html':
      recommendations.targetFormats = ['pdf', 'word', 'txt'];
      break;
    case 'image':
      recommendations.targetFormats = ['pdf'];
      recommendations.warnings.push('Image to PDF conversion is supported');
      break;
    default:
      recommendations.targetFormats = ['pdf'];
      recommendations.warnings.push('Limited conversion options available for this format');
  }

  // Quality settings based on analysis
  if (analysis.quality === 'high') {
    recommendations.qualitySettings = {
      compressionLevel: 'low',
      imageQuality: 95,
      preserveMetadata: true
    };
  } else if (analysis.quality === 'good') {
    recommendations.qualitySettings = {
      compressionLevel: 'medium',
      imageQuality: 85,
      preserveMetadata: true
    };
  } else {
    recommendations.qualitySettings = {
      compressionLevel: 'high',
      imageQuality: 75,
      preserveMetadata: false
    };
  }

  // Optimization tips based on format characteristics
  if (analysis.characteristics.includes('large_document')) {
    recommendations.optimizationTips.push('Consider compressing images to reduce file size');
  }
  if (analysis.characteristics.includes('legacy_format')) {
    recommendations.optimizationTips.push('Converting from legacy format may improve compatibility');
  }
  if (analysis.characteristics.includes('very_large_document')) {
    recommendations.warnings.push('Large documents may take longer to process');
  }
  if (analysis.characteristics.includes('contains_text')) {
    recommendations.optimizationTips.push('Text content will be preserved during conversion');
  }
  if (analysis.characteristics.includes('modern_format')) {
    recommendations.optimizationTips.push('Modern format ensures better conversion quality');
  }

  return recommendations;
}

// Generate optimal conversion settings
function generateOptimalSettings(sourceAnalysis, targetFormat, qualityLevel, options) {
  const settings = {
    targetFormat,
    qualityLevel,
    preserveLayout: options.preserveLayout,
    optimizeForWeb: options.optimizeForWeb,
    customSettings: { ...options.customSettings }
  };

  // Auto-adjust quality based on source analysis
  if (qualityLevel === 'auto') {
    if (sourceAnalysis.quality === 'high') {
      settings.qualityLevel = 'high';
    } else if (sourceAnalysis.quality === 'good') {
      settings.qualityLevel = 'medium';
    } else {
      settings.qualityLevel = 'medium';
    }
  }

  // Apply format-specific optimizations
  if (targetFormat === 'pdf') {
    if (settings.optimizeForWeb) {
      settings.customSettings.compressionLevel = 'high';
      settings.customSettings.imageQuality = 75;
      settings.customSettings.linearize = true;
      settings.customSettings.removeMetadata = true;
    } else if (settings.qualityLevel === 'high') {
      settings.customSettings.compressionLevel = 'low';
      settings.customSettings.imageQuality = 95;
      settings.customSettings.linearize = false;
      settings.customSettings.removeMetadata = false;
    } else {
      settings.customSettings.compressionLevel = 'medium';
      settings.customSettings.imageQuality = 85;
      settings.customSettings.linearize = true;
      settings.customSettings.removeMetadata = true;
    }
  }

  return settings;
}

// Perform the actual conversion using real conversion functions
async function performSmartConversion(filePath, targetFormat, settings, baseName) {
  const outputsDir = path.join(__dirname, '../outputs');
  await fs.ensureDir(outputsDir);

  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1E9);
  // Map target formats to correct file extensions
  const getFileExtension = (format) => {
    switch (format) {
      case 'excel': return 'xlsx';
      case 'word': return 'docx';
      case 'powerpoint': return 'pptx';
      case 'image': return 'png';
      case 'html': return 'html';
      case 'txt': return 'txt';
      case 'pdf': return 'pdf';
      default: return format;
    }
  };
  
  const fileExtension = getFileExtension(targetFormat);
  // console.log('🔍 Smart Conversion Debug:');
  // console.log('  targetFormat:', targetFormat);
  // console.log('  fileExtension:', fileExtension);
  // console.log('  baseName:', baseName);
  
  const outputFilename = `${baseName}_converted_${timestamp}_${randomSuffix}.${fileExtension}`;
  const outputPath = path.join(outputsDir, outputFilename);

  try {
    const sourceExtension = path.extname(filePath).toLowerCase();
    let conversionResult;

    // Determine conversion based on source and target formats
    if (targetFormat === 'pdf') {
      // Convert to PDF
      if (sourceExtension === '.pdf') {
        // If source is already PDF, just copy with optimizations
        await optimizePDF(filePath, outputPath, settings.customSettings);
      } else if (['.doc', '.docx'].includes(sourceExtension)) {
        conversionResult = await convertDocToPdf(filePath, outputPath);
      } else if (['.xls', '.xlsx'].includes(sourceExtension)) {
        conversionResult = await convertExcelToPdf(filePath, outputPath);
      } else if (['.ppt', '.pptx'].includes(sourceExtension)) {
        conversionResult = await convertPptToPdf(filePath, outputPath);
      } else if (['.txt'].includes(sourceExtension)) {
        conversionResult = await convertTxtToPdf(filePath, outputPath);
      } else if (['.html', '.htm'].includes(sourceExtension)) {
        conversionResult = await convertHtmlToPdf(filePath, outputPath);
      } else {
        throw new Error(`Conversion from ${sourceExtension} to PDF not supported`);
      }
    } else if (sourceExtension === '.pdf') {
      // Convert from PDF
      if (targetFormat === 'word' || targetFormat === 'docx') {
        conversionResult = await convertPdfToDoc(filePath, outputPath);
      } else if (targetFormat === 'excel' || targetFormat === 'xlsx') {
        conversionResult = await convertPdfToExcel(filePath, outputPath);
      } else if (targetFormat === 'powerpoint' || targetFormat === 'pptx') {
        conversionResult = await convertPdfToPpt(filePath, outputPath);
      } else if (targetFormat === 'txt') {
        conversionResult = await convertPdfToTxt(filePath, outputPath);
      } else if (targetFormat === 'html') {
        conversionResult = await convertPdfToHtml(filePath, outputPath);
      } else if (targetFormat === 'image' || targetFormat === 'png') {
        // Convert PDF to image (PNG format)
        const success = await convertSinglePageToImage(filePath, 0, outputPath);
        if (success) {
          conversionResult = { success: true, message: 'PDF converted to image successfully' };
        } else {
          throw new Error('Failed to convert PDF to image');
        }
      } else {
        throw new Error(`Conversion from PDF to ${targetFormat} not supported`);
      }
    } else if (['.doc', '.docx'].includes(sourceExtension)) {
      // Convert from Word
      if (targetFormat === 'excel' || targetFormat === 'xlsx') {
        conversionResult = await convertDocToExcel(filePath, outputPath);
      } else {
        throw new Error(`Conversion from Word to ${targetFormat} not supported`);
      }
    } else if (['.xls', '.xlsx'].includes(sourceExtension)) {
      // Convert from Excel
      if (targetFormat === 'word' || targetFormat === 'docx') {
        conversionResult = await convertExcelToDoc(filePath, outputPath);
      } else {
        throw new Error(`Conversion from Excel to ${targetFormat} not supported`);
      }
    } else {
      throw new Error(`Conversion from ${sourceExtension} to ${targetFormat} not supported`);
    }

    const stats = await fs.stat(outputPath);
    
    return {
      filename: outputFilename,
      outputPath,
      size: stats.size,
      conversionResult: conversionResult || { success: true }
    };

  } catch (error) {
    console.error('Conversion error:', error);
    throw new Error(`Failed to convert file: ${error.message}`);
  }
}

// Optimize PDF with custom settings
async function optimizePDF(inputPath, outputPath, settings) {
  try {
    const fileBytes = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(fileBytes);
    
    // Apply optimizations based on settings
    if (settings.removeMetadata) {
      // Remove metadata (simplified)
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');
    }

    const pdfBytes = await pdfDoc.save({
      useObjectStreams: settings.objectStreams === 'generate',
      addDefaultPage: false
    });

    await fs.writeFile(outputPath, pdfBytes);
  } catch (error) {
    console.error('PDF optimization error:', error);
    // Fallback: just copy the file
    await fs.copy(inputPath, outputPath);
  }
}


// Analyze conversion quality
async function analyzeConversionQuality(filePath, targetFormat) {
  const analysis = {
    quality: 'good',
    fileSize: 0,
    characteristics: [],
    recommendations: []
  };

  try {
    const stats = await fs.stat(filePath);
    analysis.fileSize = stats.size;

    if (targetFormat === 'pdf') {
      // Analyze PDF quality
      const fileBytes = await fs.readFile(filePath);
      const pdfDoc = await PDFDocument.load(fileBytes);
      
      analysis.characteristics.push('valid_pdf');
      analysis.characteristics.push(`${pdfDoc.getPageCount()}_pages`);
      
      if (stats.size < 1024 * 1024) { // < 1MB
        analysis.characteristics.push('small_file');
        analysis.quality = 'excellent';
      } else if (stats.size < 5 * 1024 * 1024) { // < 5MB
        analysis.characteristics.push('medium_file');
        analysis.quality = 'good';
      } else {
        analysis.characteristics.push('large_file');
        analysis.quality = 'acceptable';
        analysis.recommendations.push('Consider further compression for web use');
      }
    } else if (targetFormat === 'image' || targetFormat === 'png') {
      // Analyze image quality
      analysis.characteristics.push('valid_image');
      analysis.characteristics.push('png_format');
      
      if (stats.size < 500 * 1024) { // < 500KB
        analysis.characteristics.push('small_image');
        analysis.quality = 'excellent';
      } else if (stats.size < 2 * 1024 * 1024) { // < 2MB
        analysis.characteristics.push('medium_image');
        analysis.quality = 'good';
      } else {
        analysis.characteristics.push('large_image');
        analysis.quality = 'acceptable';
        analysis.recommendations.push('Consider image compression for web use');
      }
    }

  } catch (error) {
    console.error('Quality analysis error:', error);
    analysis.quality = 'poor';
    analysis.characteristics.push('analysis_failed');
  }

  return analysis;
}

module.exports = smartConversionController;
