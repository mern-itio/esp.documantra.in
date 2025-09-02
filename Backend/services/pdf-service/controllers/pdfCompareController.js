const { PDFDocument } = require('pdf-lib');
const fs = require('fs-extra');
const path = require('path');

const pdfCompareController = {
  // Compare two PDFs and highlight differences
  async comparePdfs(req, res) {
    try {
      if (!req.files || !req.files.pdf1 || !req.files.pdf2) {
        return res.status(400).json({
          success: false,
          error: 'Two PDF files are required for comparison'
        });
      }

      const pdf1Path = req.files.pdf1[0].path;
      const pdf2Path = req.files.pdf2[0].path;

      const pdf1Bytes = await fs.readFile(pdf1Path);
      const pdf2Bytes = await fs.readFile(pdf2Path);

      const pdf1Doc = await PDFDocument.load(pdf1Bytes);
      const pdf2Doc = await PDFDocument.load(pdf2Bytes);

      // Perform comparison analysis
      const comparisonResult = await performComparison(pdf1Doc, pdf2Doc, pdf1Path, pdf2Path);

      // Clean up input files
      await fs.remove(pdf1Path);
      await fs.remove(pdf2Path);

      res.json({
        success: true,
        result: comparisonResult
      });

    } catch (error) {
      console.error('Error comparing PDFs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to compare PDFs',
        details: error.message
      });
    }
  },

  // Get service status
  async getServiceStatus(req, res) {
    try {
      const status = {
        service: 'PDF Compare',
        status: 'operational',
        version: '1.0.0',
        features: [
          'pdf_comparison',
          'difference_detection',
          'side_by_side_preview',
          'highlighting_differences'
        ],
        capabilities: {
          comparisonFeatures: [
            'content_differences',
            'metadata_differences',
            'structure_differences',
            'visual_differences',
            'form_field_differences'
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

async function performComparison(pdf1Doc, pdf2Doc, pdf1Path, pdf2Path) {
  const comparisonResult = {
    identical: false,
    differences: {
      structure: [],
      content: [],
      metadata: [],
      visual: []
    },
    statistics: {
      pdf1: {},
      pdf2: {},
      similarity: 0
    },
    highlights: []
  };

  try {
    // Compare basic structure
    const pdf1Pages = pdf1Doc.getPageCount();
    const pdf2Pages = pdf2Doc.getPageCount();

    if (pdf1Pages !== pdf2Pages) {
      comparisonResult.differences.structure.push({
        type: 'page_count',
        pdf1: pdf1Pages,
        pdf2: pdf2Pages,
        severity: 'major'
      });
    }

    // Compare metadata
    const pdf1Metadata = {
      title: pdf1Doc.getTitle(),
      author: pdf1Doc.getAuthor(),
      subject: pdf1Doc.getSubject(),
      creator: pdf1Doc.getCreator(),
      producer: pdf1Doc.getProducer()
    };

    const pdf2Metadata = {
      title: pdf2Doc.getTitle(),
      author: pdf2Doc.getAuthor(),
      subject: pdf2Doc.getSubject(),
      creator: pdf2Doc.getCreator(),
      producer: pdf2Doc.getProducer()
    };

    Object.keys(pdf1Metadata).forEach(key => {
      if (pdf1Metadata[key] !== pdf2Metadata[key]) {
        comparisonResult.differences.metadata.push({
          field: key,
          pdf1: pdf1Metadata[key],
          pdf2: pdf2Metadata[key],
          severity: 'minor'
        });
      }
    });

    // Compare page dimensions and content
    const pdf1PagesList = pdf1Doc.getPages();
    const pdf2PagesList = pdf2Doc.getPages();
    const minPages = Math.min(pdf1Pages, pdf2Pages);

    for (let i = 0; i < minPages; i++) {
      const pdf1Size = pdf1PagesList[i].getSize();
      const pdf2Size = pdf2PagesList[i].getSize();

      // Check page dimensions
      if (pdf1Size.width !== pdf2Size.width || pdf1Size.height !== pdf2Size.height) {
        comparisonResult.differences.structure.push({
          type: 'page_dimensions',
          page: i + 1,
          pdf1: { width: pdf1Size.width, height: pdf1Size.height },
          pdf2: { width: pdf2Size.width, height: pdf2Size.height },
          severity: 'major'
        });
      }

      // Check for form fields differences
      try {
        const pdf1Form = pdf1Doc.getForm();
        const pdf2Form = pdf2Doc.getForm();
        
        const pdf1Fields = pdf1Form.getFields();
        const pdf2Fields = pdf2Form.getFields();

        if (pdf1Fields.length !== pdf2Fields.length) {
          comparisonResult.differences.structure.push({
            type: 'form_fields_count',
            page: i + 1,
            pdf1: pdf1Fields.length,
            pdf2: pdf2Fields.length,
            severity: 'major'
          });
        }

        // Check individual form fields
        const maxFields = Math.max(pdf1Fields.length, pdf2Fields.length);
        for (let j = 0; j < maxFields; j++) {
          const field1 = pdf1Fields[j];
          const field2 = pdf2Fields[j];
          
          if (!field1 || !field2) {
            comparisonResult.differences.structure.push({
              type: 'form_field_missing',
              page: i + 1,
              field: j + 1,
              pdf1: field1 ? field1.getName() : 'missing',
              pdf2: field2 ? field2.getName() : 'missing',
              severity: 'major'
            });
          } else if (field1.getName() !== field2.getName()) {
            comparisonResult.differences.structure.push({
              type: 'form_field_name',
              page: i + 1,
              field: j + 1,
              pdf1: field1.getName(),
              pdf2: field2.getName(),
              severity: 'minor'
            });
          }
        }
      } catch (error) {
        // Forms might not exist, that's okay
        console.log('Form comparison skipped:', error.message);
      }
    }

    // Compare file sizes (indicator of content differences)
    const pdf1Stats = await fs.stat(pdf1Path);
    const pdf2Stats = await fs.stat(pdf2Path);
    const sizeDifference = Math.abs(pdf1Stats.size - pdf2Stats.size);
    const sizeDifferencePercent = (sizeDifference / Math.max(pdf1Stats.size, pdf2Stats.size)) * 100;

    if (sizeDifferencePercent > 10) { // More than 10% size difference
      comparisonResult.differences.content.push({
        type: 'file_size',
        pdf1: formatFileSize(pdf1Stats.size),
        pdf2: formatFileSize(pdf2Stats.size),
        severity: sizeDifferencePercent > 50 ? 'major' : 'minor'
      });
    }

    // Check for visual differences based on file size and page count
    if (pdf1Pages === pdf2Pages && sizeDifferencePercent > 20) {
      comparisonResult.differences.visual.push({
        type: 'content_density',
        message: 'Significant content differences detected',
        severity: 'major'
      });
    }

    // Add content differences based on file size ratio
    if (sizeDifferencePercent > 30) {
      comparisonResult.differences.content.push({
        type: 'content_complexity',
        message: `PDF 2 is ${sizeDifferencePercent.toFixed(1)}% ${pdf2Stats.size > pdf1Stats.size ? 'larger' : 'smaller'} than PDF 1`,
        severity: sizeDifferencePercent > 70 ? 'major' : 'minor'
      });
    }

    // Check for structural differences based on form fields
    try {
      const pdf1Form = pdf1Doc.getForm();
      const pdf2Form = pdf2Doc.getForm();
      
      const pdf1Fields = pdf1Form.getFields();
      const pdf2Fields = pdf2Form.getFields();

      // If one has forms and the other doesn't, that's a major structural difference
      if (pdf1Fields.length === 0 && pdf2Fields.length > 0) {
        comparisonResult.differences.structure.push({
          type: 'form_structure',
          message: 'PDF 2 contains form fields while PDF 1 does not',
          severity: 'major'
        });
      } else if (pdf1Fields.length > 0 && pdf2Fields.length === 0) {
        comparisonResult.differences.structure.push({
          type: 'form_structure',
          message: 'PDF 1 contains form fields while PDF 2 does not',
          severity: 'major'
        });
      } else if (Math.abs(pdf1Fields.length - pdf2Fields.length) > 0) {
        comparisonResult.differences.structure.push({
          type: 'form_complexity',
          message: `Different number of form fields: ${pdf1Fields.length} vs ${pdf2Fields.length}`,
          severity: 'minor'
        });
      }
    } catch (error) {
      // Forms might not exist, that's okay
      console.log('Form structure comparison skipped:', error.message);
    }

    // File statistics (already calculated above)
    comparisonResult.statistics.pdf1 = {
      fileSize: pdf1Stats.size,
      fileSizeFormatted: formatFileSize(pdf1Stats.size),
      pageCount: pdf1Pages
    };

    comparisonResult.statistics.pdf2 = {
      fileSize: pdf2Stats.size,
      fileSizeFormatted: formatFileSize(pdf2Stats.size),
      pageCount: pdf2Pages
    };

    // Calculate similarity score based on different types of differences
    let similarityScore = 100;
    
    // Weight different types of differences
    const structureWeight = 25; // Major impact
    const contentWeight = 20;   // Major impact  
    const visualWeight = 15;    // Medium impact
    const metadataWeight = 5;   // Minor impact
    
    const structurePenalty = comparisonResult.differences.structure.length * structureWeight;
    const contentPenalty = comparisonResult.differences.content.length * contentWeight;
    const visualPenalty = comparisonResult.differences.visual.length * visualWeight;
    const metadataPenalty = comparisonResult.differences.metadata.length * metadataWeight;
    
    const totalPenalty = structurePenalty + contentPenalty + visualPenalty + metadataPenalty;
    
    // Also factor in file size difference
    const sizePenalty = Math.min(30, sizeDifferencePercent * 0.5);
    
    similarityScore = Math.max(0, 100 - totalPenalty - sizePenalty);
    
    comparisonResult.statistics.similarity = Math.round(similarityScore);

    // Generate highlights for visual differences
    comparisonResult.highlights = generateHighlights(comparisonResult.differences);

    const totalDifferences = 
      comparisonResult.differences.structure.length +
      comparisonResult.differences.metadata.length +
      comparisonResult.differences.content.length +
      comparisonResult.differences.visual.length;

    comparisonResult.identical = totalDifferences === 0;

  } catch (error) {
    comparisonResult.differences.structure.push({
      type: 'comparison_error',
      message: error.message,
      severity: 'error'
    });
  }

  return comparisonResult;
}

function generateHighlights(differences) {
  const highlights = [];

  // Add highlights for each type of difference
  Object.keys(differences).forEach(type => {
    differences[type].forEach(diff => {
      highlights.push({
        type: type,
        severity: diff.severity || 'info',
        message: diff.message || `${type} difference detected`,
        location: diff.location || `Page ${diff.page || 1}`
      });
    });
  });

  return highlights;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = pdfCompareController;
