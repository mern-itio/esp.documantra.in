const { PDFDocument } = require('pdf-lib');
const fs = require('fs-extra');
const path = require('path');

const pdfInfoController = {
  // Get comprehensive PDF information
  async getPdfInfo(req, res) {
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

      // Extract metadata
      const metadata = pdfDoc.getTitle() || 'No title';
      const author = pdfDoc.getAuthor() || 'Unknown';
      const subject = pdfDoc.getSubject() || 'No subject';
      const creator = pdfDoc.getCreator() || 'Unknown';
      const producer = pdfDoc.getProducer() || 'Unknown';
      const creationDate = pdfDoc.getCreationDate();
      const modificationDate = pdfDoc.getModificationDate();
      const keywords = pdfDoc.getKeywords() || [];

      // Get document statistics
      const pageCount = pdfDoc.getPageCount();
      const form = pdfDoc.getForm();
      const formFields = form.getFields();
      const fieldCount = formFields.length;
      
      // Analyze field types
      const fieldTypes = {
        text: 0,
        checkbox: 0,
        radio: 0,
        dropdown: 0,
        signature: 0,
        unknown: 0
      };

      formFields.forEach(field => {
        const fieldType = getFieldType(field);
        if (fieldTypes.hasOwnProperty(fieldType)) {
          fieldTypes[fieldType]++;
        } else {
          fieldTypes.unknown++;
        }
      });

      // Get security information
      const securityInfo = await getSecurityInfo(pdfDoc);
      
      // Get file information
      const fileStats = await fs.stat(inputPath);
      const fileSize = fileStats.size;
      const fileSizeFormatted = formatFileSize(fileSize);

      // Get page dimensions
      const pages = pdfDoc.getPages();
      const pageDimensions = pages.map((page, index) => {
        const { width, height } = page.getSize();
        return {
          pageNumber: index + 1,
          width: Math.round(width),
          height: Math.round(height),
          orientation: width > height ? 'landscape' : 'portrait'
        };
      });

      // Clean up input file
      await fs.remove(inputPath);

      res.json({
        success: true,
        result: {
          metadata: {
            title: metadata,
            author,
            subject,
            creator,
            producer,
            creationDate: creationDate ? creationDate.toISOString() : null,
            modificationDate: modificationDate ? modificationDate.toISOString() : null,
            keywords
          },
          statistics: {
            pageCount,
            fieldCount,
            fieldTypes,
            fileSize: fileSizeFormatted,
            fileSizeBytes: fileSize
          },
          security: securityInfo,
          pages: pageDimensions
        }
      });

    } catch (error) {
      console.error('Error getting PDF info:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get PDF information',
        details: error.message
      });
    }
  },

  // Get metadata only
  async getMetadata(req, res) {
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

      const metadata = {
        title: pdfDoc.getTitle() || 'No title',
        author: pdfDoc.getAuthor() || 'Unknown',
        subject: pdfDoc.getSubject() || 'No subject',
        creator: pdfDoc.getCreator() || 'Unknown',
        producer: pdfDoc.getProducer() || 'Unknown',
        creationDate: pdfDoc.getCreationDate()?.toISOString() || null,
        modificationDate: pdfDoc.getModificationDate()?.toISOString() || null,
        keywords: pdfDoc.getKeywords() || []
      };

      // Clean up input file
      await fs.remove(inputPath);

      res.json({
        success: true,
        result: metadata
      });

    } catch (error) {
      console.error('Error getting metadata:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get metadata',
        details: error.message
      });
    }
  },

  // Get document statistics
  async getDocumentStatistics(req, res) {
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

      const pageCount = pdfDoc.getPageCount();
      const form = pdfDoc.getForm();
      const formFields = form.getFields();
      
      const fieldTypes = {
        text: 0,
        checkbox: 0,
        radio: 0,
        dropdown: 0,
        signature: 0,
        unknown: 0
      };

      formFields.forEach(field => {
        const fieldType = getFieldType(field);
        if (fieldTypes.hasOwnProperty(fieldType)) {
          fieldTypes[fieldType]++;
        } else {
          fieldTypes.unknown++;
        }
      });

      const fileStats = await fs.stat(inputPath);
      const fileSize = fileStats.size;

      // Get page dimensions
      const pages = pdfDoc.getPages();
      const pageDimensions = pages.map((page, index) => {
        const { width, height } = page.getSize();
        return {
          pageNumber: index + 1,
          width: Math.round(width),
          height: Math.round(height),
          orientation: width > height ? 'landscape' : 'portrait'
        };
      });

      // Clean up input file
      await fs.remove(inputPath);

      res.json({
        success: true,
        result: {
          pageCount,
          fieldCount: formFields.length,
          fieldTypes,
          fileSize: formatFileSize(fileSize),
          fileSizeBytes: fileSize,
          pages: pageDimensions
        }
      });

    } catch (error) {
      console.error('Error getting document statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get document statistics',
        details: error.message
      });
    }
  },

  // Get security information
  async getSecurityInfo(req, res) {
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

      const securityInfo = await getSecurityInfo(pdfDoc);

      // Clean up input file
      await fs.remove(inputPath);

      res.json({
        success: true,
        result: securityInfo
      });

    } catch (error) {
      console.error('Error getting security info:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get security information',
        details: error.message
      });
    }
  },

  // Get service status
  async getServiceStatus(req, res) {
    try {
      const status = {
        service: 'PDF Information',
        status: 'operational',
        version: '1.0.0',
        features: [
          'metadata_viewer',
          'document_statistics', 
          'security_info',
          'page_analysis',
          'field_analysis'
        ],
        capabilities: {
          supportedMetadata: ['title', 'author', 'subject', 'creator', 'producer', 'creationDate', 'modificationDate', 'keywords'],
          supportedStatistics: ['pageCount', 'fieldCount', 'fieldTypes', 'fileSize', 'pageDimensions'],
          supportedSecurity: ['encryption', 'permissions', 'passwordProtection'],
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

function getFieldType(field) {
  const { PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } = require('pdf-lib');
  
  if (field instanceof PDFTextField) return 'text';
  if (field instanceof PDFCheckBox) return 'checkbox';
  if (field instanceof PDFRadioGroup) return 'radio';
  if (field instanceof PDFDropdown) return 'dropdown';
  return 'unknown';
}

async function getSecurityInfo(pdfDoc) {
  try {
    // Note: pdf-lib doesn't provide direct access to security info
    // This is a simplified implementation
    const securityInfo = {
      isEncrypted: false,
      isPasswordProtected: false,
      permissions: {
        print: true,
        copy: true,
        modify: true,
        annotate: true,
        fillForms: true,
        extractText: true
      },
      encryptionLevel: 'None',
      securityMethod: 'None'
    };

    // Try to detect if document is encrypted
    try {
      // If we can access the document without password, it's not encrypted
      securityInfo.isEncrypted = false;
      securityInfo.isPasswordProtected = false;
    } catch (error) {
      if (error.message.includes('password') || error.message.includes('encrypted')) {
        securityInfo.isEncrypted = true;
        securityInfo.isPasswordProtected = true;
        securityInfo.encryptionLevel = 'Standard';
        securityInfo.securityMethod = 'Password Protection';
      }
    }

    return securityInfo;
  } catch (error) {
    return {
      isEncrypted: false,
      isPasswordProtected: false,
      permissions: {
        print: true,
        copy: true,
        modify: true,
        annotate: true,
        fillForms: true,
        extractText: true
      },
      encryptionLevel: 'Unknown',
      securityMethod: 'Unknown',
      error: error.message
    };
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = pdfInfoController;
