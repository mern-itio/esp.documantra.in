// templateController.js
const Template = require("../models/template");
const Form = require("../models/formBuilder");
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Helper function to render formatted text
function renderFormattedText(doc, text, options = {}) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  parts.forEach((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      doc.font('Times-Bold').text(part.replace(/\*\*/g, ''), options);
    } else {
      doc.font('Times-Roman').text(part, options);
    }
  });
}

function isHeading(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 4) return false;
  const cleaned = trimmed.replace(/\*\*/g, '');
  if (cleaned === cleaned.toUpperCase() && cleaned.length < 100) {
    return true;
  }
  return /^\d+\.\s+/.test(cleaned);
}

// Convert text content to PDF and return base64
const convertContentToPDF = async (content, documentName) => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  const fileName = `${Date.now()}-${(documentName || 'document').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  const filePath = path.join(uploadsDir, fileName);
  
  const doc = new PDFDocument({
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    size: 'LETTER',
    bufferPages: true,
    autoFirstPage: true
  });
  
  const stream = fsSync.createWriteStream(filePath);
  doc.pipe(stream);
  
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
  paragraphs.forEach((paragraph, index) => {
    if (index > 0) {
      doc.moveDown(0.5);
    }
    const lines = paragraph.split('\n').filter(l => l.trim());
    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      if (isHeading(trimmedLine)) {
        if (lineIndex > 0 || index > 0) {
          doc.moveDown(0.5);
        }
        const cleanedLine = trimmedLine.replace(/\*\*/g, '');
        doc.font('Times-Bold')
          .fontSize(13)
          .text(cleanedLine, {
            align: 'left',
            width: 495,
            lineGap: 2
          });
        doc.moveDown(0.3);
      } else {
        if (lineIndex > 0 || index > 0) {
          doc.moveDown(0.3);
        }
        renderFormattedText(doc, trimmedLine, {
          fontSize: 11,
          width: 495
        });
      }
    });
  });
  
  doc.end();
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
  
  const pdfBuffer = await fs.readFile(filePath);
  const base64 = pdfBuffer.toString('base64');
  
  // Clean up temporary file
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.warn('Failed to delete temporary PDF file:', err);
  }
  
  return base64;
};

// Create or Update a template
const saveUpdateTemplate = async (req, res) => {
  try {
    const { id, title, elements, status } = req.body;

    let template;
    if (id) {
      // Update existing template
      template = await Template.findByIdAndUpdate(
        id,
        { title, elements, status },
        { new: true, runValidators: true }
      );
    } else {
      // Create new template
      template = new Template({
        title,
        elements,
        status,
      });
      await template.save();
    }

    return res.status(200).json({
      success: true,
      message: id ? "Template updated successfully" : "Template created successfully",
      data: template,
    });
  } catch (error) {
    console.error("Error saving/updating template:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while saving template",
      error: error.message,
    });
  }
};

// Save AI-generated template as a Form with PDF
const saveAITemplate = async (req, res) => {
  try {
    const { title, content, description } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required"
      });
    }

    // Convert content to PDF
    let pdfBase64 = null;
    try {
      pdfBase64 = await convertContentToPDF(content, title);
    } catch (pdfError) {
      console.error("Error converting to PDF:", pdfError);
      return res.status(500).json({
        success: false,
        message: "Failed to convert content to PDF",
        error: pdfError.message,
      });
    }

    // Extract owner information from authenticated user
    const ownerId = req.user?.data?.id || req.user?.id || req.user?._id || null;
    const owner = req.user?.data?.fullname || req.user?.fullname || null;

    const form = new Form({
      title,
      description: description || '',
      content,
      pdfBase64,
      isAIGenerated: true,
      ownerId,
      owner
    });

    await form.save();

    return res.status(200).json({
      success: true,
      message: "AI template saved successfully",
      data: form
    });
  } catch (error) {
    console.error("Error saving AI template:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while saving AI template",
      error: error.message,
    });
  }
};

module.exports = {
  saveUpdateTemplate,
  saveAITemplate,
};
