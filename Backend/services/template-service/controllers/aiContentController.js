const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Initialize OpenAI (only if API key is available)
let OpenAI;
let openai;
try {
  OpenAI = require('openai');
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
} catch (error) {
  console.warn('OpenAI package not installed. AI content generation will not work.');
}

// Schema for storing documents for unauthorized users
const pendingDocumentSchema = new mongoose.Schema({
  documentName: String,
  content: String,
  templateType: String,
  templateData: mongoose.Schema.Types.Mixed,
  sessionId: String,
  createdAt: { type: Date, default: Date.now, expires: 86400 } // Expires after 24 hours
}, { timestamps: true });

let PendingDocument;
try {
  PendingDocument = mongoose.models.PendingDocument || mongoose.model('PendingDocument', pendingDocumentSchema);
} catch (e) {
  PendingDocument = mongoose.model('PendingDocument', pendingDocumentSchema);
}

/**
 * Generate AI content for legal template
 */
const generateAIContent = async (req, res) => {
  try {
    const { templateType, requirements, formData } = req.body;

    if (!templateType || !requirements) {
      return res.status(400).json({
        success: false,
        message: 'Template type and requirements are required'
      });
    }

    if (!openai || !process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured. Please set OPENAI_API_KEY in environment variables.',
        error: 'OpenAI API key not configured'
      });
    }

    // Build prompt based on template type
    const systemPrompt = `You are an expert legal document writer. Generate professional, legally sound content for ${templateType} documents. 
    Ensure the content is comprehensive, well-structured, and includes all necessary legal clauses and sections.
    The content should be formatted as plain text, suitable for a legal document.`;

    const userPrompt = `Please generate a complete ${templateType} document based on the following requirements:
    
Template Type: ${templateType}

Requirements:
${requirements}

${formData ? `Additional Information:
${JSON.stringify(formData, null, 2)}` : ''}

Generate a complete, professional ${templateType} document with all necessary sections, clauses, and legal language. 
Make sure it's comprehensive and ready to use.`;

    console.log('Generating AI content for template:', templateType);

    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    const generatedContent = response.choices[0].message.content.trim();

    res.json({
      success: true,
      message: 'Content generated successfully',
      data: {
        content: generatedContent,
        templateType,
        tokensUsed: response.usage?.total_tokens || 0
      }
    });
  } catch (error) {
    console.error('Error generating AI content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate content',
      error: error.message
    });
  }
};

/**
 * Render text with markdown formatting to PDF (handles **bold** text)
 * Processes text and renders with proper bold formatting
 */
function renderFormattedText(doc, text, options = {}) {
  const { fontSize = 11, width = 495 } = options;
  
  // If no ** markers, render normally
  if (!text.includes('**')) {
    doc.font('Times-Roman').fontSize(fontSize);
    doc.text(text, {
      align: 'left',
      width: width,
      lineGap: 2
    });
    return;
  }

  // Parse text into parts with bold formatting
  const parts = [];
  let remaining = text;

  while (remaining.length > 0) {
    const boldStart = remaining.indexOf('**');
    
    if (boldStart === -1) {
      // No more bold markers
      if (remaining.trim()) {
        parts.push({ text: remaining, bold: false });
      }
      break;
    }

    // Text before bold marker
    if (boldStart > 0) {
      parts.push({ text: remaining.substring(0, boldStart), bold: false });
    }

    // Find closing **
    const boldEnd = remaining.indexOf('**', boldStart + 2);
    if (boldEnd === -1) {
      // No closing marker, treat rest as normal
      parts.push({ text: remaining.substring(boldStart), bold: false });
      break;
    }

    // Extract bold text (remove ** markers)
    const boldText = remaining.substring(boldStart + 2, boldEnd);
    if (boldText) {
      parts.push({ text: boldText, bold: true });
    }

    remaining = remaining.substring(boldEnd + 2);
  }

  if (parts.length === 0) {
    parts.push({ text: text, bold: false });
  }

  // Render parts sequentially - PDFKit will handle wrapping
  doc.fontSize(fontSize);
  
  // For simple case (one part), render directly
  if (parts.length === 1) {
    doc.font(parts[0].bold ? 'Times-Bold' : 'Times-Roman');
    doc.text(parts[0].text, {
      align: 'left',
      width: width,
      lineGap: 2
    });
    return;
  }

  // Multiple parts - render with continued option
  parts.forEach((part, index) => {
    doc.font(part.bold ? 'Times-Bold' : 'Times-Roman');
    
    const textOptions = {
      align: 'left',
      width: width,
      lineGap: 2,
      continued: index < parts.length - 1
    };

    doc.text(part.text, textOptions);
  });
}

/**
 * Check if a line is a heading
 */
function isHeading(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  
  // Remove markdown markers for checking
  const cleaned = trimmed.replace(/\*\*/g, '');
  
  // All caps and reasonably short
  if (cleaned === cleaned.toUpperCase() && cleaned.length < 100 && cleaned.length > 3) {
    return true;
  }
  
  // Numbered heading
  if (/^\d+\.\s+/.test(cleaned)) {
    return true;
  }
  
  return false;
}

/**
 * Convert text content to PDF
 */
const convertTextToPDF = async (req, res) => {
  try {
    const { content, documentName } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate filename
    const fileName = `${Date.now()}-${(documentName || 'document').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    // Create PDF
    const doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      size: 'LETTER'
    });

    const stream = fsSync.createWriteStream(filePath);
    doc.pipe(stream);

    // Split content into paragraphs (double newlines)
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
    
    paragraphs.forEach((paragraph, index) => {
      if (index > 0) {
        doc.moveDown(0.5);
      }

      const lines = paragraph.split('\n').filter(l => l.trim());
      
      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // Check if this is a heading
        if (isHeading(trimmedLine)) {
          if (lineIndex > 0 || index > 0) {
            doc.moveDown(0.5);
          }
          
          // Render heading in bold (remove ** markers)
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
          // Regular text with markdown formatting
          if (lineIndex > 0 || index > 0) {
            doc.moveDown(0.3);
          }
          
          // Use the formatted text renderer
          renderFormattedText(doc, trimmedLine, {
            fontSize: 11,
            width: 495
          });
        }
      });
    });

    doc.end();

    // Wait for PDF to be written
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // Read PDF file
    const pdfBuffer = await fs.readFile(filePath);

    res.json({
      success: true,
      message: 'PDF generated successfully',
      data: {
        fileName,
        filePath,
        fileSize: pdfBuffer.length,
        base64: pdfBuffer.toString('base64')
      }
    });
  } catch (error) {
    console.error('Error converting to PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert to PDF',
      error: error.message
    });
  }
};

/**
 * Store document for unauthorized user
 */
const storePendingDocument = async (req, res) => {
  try {
    const { documentName, content, templateType, templateData, sessionId } = req.body;

    if (!content || !templateType) {
      return res.status(400).json({
        success: false,
        message: 'Content and template type are required'
      });
    }

    const pendingDoc = new PendingDocument({
      documentName: documentName || `Generated ${templateType}`,
      content,
      templateType,
      templateData: templateData || {},
      sessionId: sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    await pendingDoc.save();

    res.json({
      success: true,
      message: 'Document stored successfully',
      data: {
        documentId: pendingDoc._id.toString(),
        sessionId: pendingDoc.sessionId
      }
    });
  } catch (error) {
    console.error('Error storing pending document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store document',
      error: error.message
    });
  }
};

/**
 * Get pending document by ID or session ID
 */
const getPendingDocument = async (req, res) => {
  try {
    const { documentId, sessionId } = req.query;

    if (!documentId && !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID or session ID is required'
      });
    }

    const query = documentId ? { _id: documentId } : { sessionId };
    const pendingDoc = await PendingDocument.findOne(query);

    if (!pendingDoc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: {
        documentId: pendingDoc._id.toString(),
        documentName: pendingDoc.documentName,
        content: pendingDoc.content,
        templateType: pendingDoc.templateType,
        templateData: pendingDoc.templateData,
        sessionId: pendingDoc.sessionId,
        createdAt: pendingDoc.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching pending document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document',
      error: error.message
    });
  }
};

/**
 * Delete pending document
 */
const deletePendingDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    await PendingDocument.findByIdAndDelete(documentId);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pending document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
};

module.exports = {
  generateAIContent,
  convertTextToPDF,
  storePendingDocument,
  getPendingDocument,
  deletePendingDocument
};

