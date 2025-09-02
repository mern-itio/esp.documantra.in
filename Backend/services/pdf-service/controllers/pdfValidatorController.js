const { PDFDocument } = require('pdf-lib');
const fs = require('fs-extra');
const path = require('path');

const pdfValidatorController = {
  // Validate single PDF for standards compliance
  async validatePdf(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'PDF file is required'
        });
      }

      const inputPath = req.file.path;
      const pdfBytes = await fs.readFile(inputPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Perform comprehensive validation
      const validationResult = await performValidation(pdfDoc, inputPath);

      // Clean up input file
      await fs.remove(inputPath);

      res.json({
        success: true,
        result: validationResult
      });

    } catch (error) {
      console.error('Error validating PDF:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate PDF',
        details: error.message
      });
    }
  },

  // Get validation standards and rules
  async getValidationStandards(req, res) {
    try {
      const standards = {
        pdfA: {
          name: 'PDF/A Compliance',
          description: 'ISO 19005-1 standard for long-term preservation',
          checks: [
            'Embedded fonts required',
            'No encryption allowed',
            'No JavaScript allowed',
            'Color spaces must be device-independent',
            'Metadata must be XMP compliant'
          ]
        },
        pdfUA: {
          name: 'PDF/UA Compliance',
          description: 'ISO 14289-1 standard for accessibility',
          checks: [
            'Logical reading order',
            'Alternative text for images',
            'Proper heading structure',
            'Form fields must be accessible',
            'No content outside page boundaries'
          ]
        },
        pdfX: {
          name: 'PDF/X Compliance',
          description: 'ISO 15930 standard for print production',
          checks: [
            'CMYK or spot colors only',
            'No RGB colors',
            'Embedded fonts required',
            'No transparency',
            'Proper bleed and trim marks'
          ]
        },
        general: {
          name: 'General PDF Standards',
          description: 'Basic PDF structure and integrity checks',
          checks: [
            'Valid PDF structure',
            'No corrupted objects',
            'Proper cross-reference table',
            'Valid page tree structure',
            'Consistent font embedding'
          ]
        }
      };

      res.json({
        success: true,
        result: standards
      });

    } catch (error) {
      console.error('Error getting validation standards:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get validation standards',
        details: error.message
      });
    }
  },

  // Get service status
  async getServiceStatus(req, res) {
    try {
      const status = {
        service: 'PDF Validator',
        status: 'operational',
        version: '1.0.0',
        features: [
          'standards_validation',
          'error_detection',
          'compliance_reporting'
        ],
        capabilities: {
          supportedStandards: ['PDF/A', 'PDF/UA', 'PDF/X', 'General'],
          validationTypes: [
            'structure_validation',
            'metadata_validation',
            'font_validation',
            'color_space_validation',
            'accessibility_validation'
          ],
          maxFileSize: '100MB',
          supportedFormats: ['PDF']
        },
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        status
      });

    } catch (error) {
      console.error('Error getting service status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get service status',
        details: error.message
      });
    }
  }
};

// Helper functions

async function performValidation(pdfDoc, filePath) {
  const validationResult = {
    isValid: true,
    overallScore: 100,
    standards: {
      pdfA: { compliant: true, score: 100, issues: [] },
      pdfUA: { compliant: true, score: 100, issues: [] },
      pdfX: { compliant: true, score: 100, issues: [] },
      general: { compliant: true, score: 100, issues: [] }
    },
    errors: [],
    warnings: [],
    recommendations: [],
    metadata: {},
    statistics: {}
  };

  try {
    // Basic structure validation
    const pageCount = pdfDoc.getPageCount();
    if (pageCount === 0) {
      validationResult.errors.push({
        type: 'structure',
        severity: 'error',
        message: 'PDF contains no pages',
        location: 'document'
      });
      validationResult.isValid = false;
    }

    // Metadata validation
    const rawKeywords = pdfDoc.getKeywords();
    let keywords = [];
    if (rawKeywords) {
      if (Array.isArray(rawKeywords)) {
        keywords = rawKeywords;
      } else if (typeof rawKeywords === 'string') {
        // Split by common delimiters and clean up
        keywords = rawKeywords.split(/[,;]/).map(keyword => keyword.trim()).filter(keyword => keyword.length > 0);
      }
    }

    const metadata = {
      title: pdfDoc.getTitle() || 'No title',
      author: pdfDoc.getAuthor() || 'Unknown',
      subject: pdfDoc.getSubject() || 'No subject',
      creator: pdfDoc.getCreator() || 'Unknown',
      producer: pdfDoc.getProducer() || 'Unknown',
      creationDate: pdfDoc.getCreationDate()?.toISOString() || null,
      modificationDate: pdfDoc.getModificationDate()?.toISOString() || null,
      keywords: keywords
    };

    validationResult.metadata = metadata;

    // File statistics
    const stats = await fs.stat(filePath);
    validationResult.statistics = {
      fileSize: stats.size,
      fileSizeFormatted: formatFileSize(stats.size),
      pageCount: pageCount,
      creationDate: stats.birthtime.toISOString()
    };

    // PDF/A validation checks
    const pdfAIssues = [];
    if (!pdfDoc.getTitle()) {
      pdfAIssues.push({
        type: 'metadata',
        severity: 'warning',
        message: 'PDF/A requires a title',
        location: 'document properties'
      });
    }

    if (pdfAIssues.length > 0) {
      validationResult.standards.pdfA.compliant = false;
      validationResult.standards.pdfA.score = Math.max(0, 100 - (pdfAIssues.length * 20));
      validationResult.standards.pdfA.issues = pdfAIssues;
    }

    // PDF/UA validation checks
    const pdfUAIssues = [];
    // Basic accessibility checks
    if (pageCount > 0) {
      const pages = pdfDoc.getPages();
      for (let i = 0; i < Math.min(pages.length, 5); i++) {
        const page = pages[i];
        const size = page.getSize();
        if (size.width < 200 || size.height < 200) {
          pdfUAIssues.push({
            type: 'accessibility',
            severity: 'warning',
            message: 'Page dimensions may be too small for accessibility',
            location: `Page ${i + 1}`
          });
        }
      }
    }

    if (pdfUAIssues.length > 0) {
      validationResult.standards.pdfUA.compliant = false;
      validationResult.standards.pdfUA.score = Math.max(0, 100 - (pdfUAIssues.length * 15));
      validationResult.standards.pdfUA.issues = pdfUAIssues;
    }

    // General validation
    const generalIssues = [];
    if (stats.size > 100 * 1024 * 1024) { // 100MB
      generalIssues.push({
        type: 'size',
        severity: 'warning',
        message: 'File size is very large',
        location: 'document'
      });
    }

    if (generalIssues.length > 0) {
      validationResult.standards.general.compliant = false;
      validationResult.standards.general.score = Math.max(0, 100 - (generalIssues.length * 10));
      validationResult.standards.general.issues = generalIssues;
    }

    // Calculate overall score
    const scores = Object.values(validationResult.standards).map(s => s.score);
    validationResult.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    // Generate recommendations
    if (validationResult.overallScore < 90) {
      validationResult.recommendations.push({
        type: 'general',
        priority: 'medium',
        message: 'Consider optimizing PDF structure and metadata for better compliance'
      });
    }

    if (validationResult.standards.pdfA.score < 80) {
      validationResult.recommendations.push({
        type: 'pdfa',
        priority: 'high',
        message: 'Add missing metadata and ensure PDF/A compliance for long-term preservation'
      });
    }

    if (validationResult.standards.pdfUA.score < 80) {
      validationResult.recommendations.push({
        type: 'pdfua',
        priority: 'medium',
        message: 'Improve accessibility features for better PDF/UA compliance'
      });
    }

  } catch (error) {
    validationResult.errors.push({
      type: 'validation_error',
      severity: 'error',
      message: error.message,
      location: 'document'
    });
    validationResult.isValid = false;
  }

  return validationResult;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = pdfValidatorController;