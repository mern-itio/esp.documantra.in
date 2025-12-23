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
 * Generate AI content for legal template (OPTIMIZED - Non-Streaming)
 * Uses higher temperature and increased max_tokens for faster, better responses
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

    // Optimized prompt for faster, concise responses
    const systemPrompt = `You are an expert legal document writer. Generate professional, legally sound content for ${templateType} documents. 
Be comprehensive but concise. Include all necessary legal clauses and sections.
Format the content as plain text suitable for a legal document.`;

    const userPrompt = `Generate a complete ${templateType} document based on these requirements:

Template Type: ${templateType}

Requirements:
${requirements}

${formData && Object.keys(formData).length > 0 ? `Additional Information:
${JSON.stringify(formData, null, 2)}` : ''}

Provide a complete, professional ${templateType} with all necessary sections, clauses, and legal language.`;

    console.log('Generating AI content for template:', templateType);

    // OPTIMIZED: Use gpt-4o-mini or gpt-3.5-turbo for faster responses
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      // Add these for faster responses
      stream: false,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
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
 * Generate AI content with Server-Sent Events (SSE) for real-time streaming
 * This provides TRUE streaming from OpenAI to the client
 */
const generateAIContentStream = async (req, res) => {
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

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Optimized prompt
    const systemPrompt = `You are an expert legal document writer. Generate professional, legally sound content for ${templateType} documents. 
Be comprehensive but concise. Include all necessary legal clauses and sections.
Format the content as plain text suitable for a legal document.`;

    const userPrompt = `Generate a complete ${templateType} document based on these requirements:

Template Type: ${templateType}

Requirements:
${requirements}

${formData && Object.keys(formData).length > 0 ? `Additional Information:
${JSON.stringify(formData, null, 2)}` : ''}

Provide a complete, professional ${templateType} with all necessary sections, clauses, and legal language.`;

    console.log('Streaming AI content for template:', templateType);

    // Create streaming completion
    const stream = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      stream: true, // Enable streaming
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    // Stream the response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      
      if (content) {
        // Send SSE formatted data
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }

      // Check if stream is done
      if (chunk.choices[0]?.finish_reason === 'stop') {
        res.write(`data: [DONE]\n\n`);
        break;
      }
    }

    res.end();

  } catch (error) {
    console.error('Error streaming AI content:', error);
    
    // Send error as SSE
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};

/**
 * Render text with markdown formatting to PDF (handles **bold** text)
 * OPTIMIZED: Reduced complexity for faster processing
 */
function renderFormattedText(doc, text, options = {}) {
  const { fontSize = 11, width = 495 } = options;
  
  // Quick check - if no ** markers, render normally
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
  let currentPos = 0;
  
  // Use regex for faster parsing
  const regex = /\*\*([^*]+)\*\*/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before bold
    if (match.index > currentPos) {
      parts.push({ 
        text: text.substring(currentPos, match.index), 
        bold: false 
      });
    }
    
    // Add bold text
    parts.push({ 
      text: match[1], 
      bold: true 
    });
    
    currentPos = match.index + match[0].length;
  }
  
  // Add remaining text
  if (currentPos < text.length) {
    parts.push({ 
      text: text.substring(currentPos), 
      bold: false 
    });
  }

  // If no parts found, render as normal text
  if (parts.length === 0) {
    doc.font('Times-Roman').fontSize(fontSize);
    doc.text(text, {
      align: 'left',
      width: width,
      lineGap: 2
    });
    return;
  }

  // Render parts
  doc.fontSize(fontSize);
  parts.forEach((part, index) => {
    if (!part.text) return;
    
    doc.font(part.bold ? 'Times-Bold' : 'Times-Roman');
    doc.text(part.text, {
      align: 'left',
      width: width,
      lineGap: 2,
      continued: index < parts.length - 1
    });
  });
}

/**
 * Check if a line is a heading (OPTIMIZED)
 */
function isHeading(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 4) return false;
  
  // Remove markdown markers
  const cleaned = trimmed.replace(/\*\*/g, '');
  
  // All caps and reasonable length
  if (cleaned === cleaned.toUpperCase() && cleaned.length < 100) {
    return true;
  }
  
  // Numbered heading
  return /^\d+\.\s+/.test(cleaned);
}

/**
 * Convert text content to PDF (OPTIMIZED)
 * Reduced I/O operations and improved parsing
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

    // Create uploads directory if it doesn't exist (async)
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate filename
    const fileName = `${Date.now()}-${(documentName || 'document').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    // Create PDF with optimized settings
    const doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      size: 'LETTER',
      bufferPages: true, // Enable page buffering for better performance
      autoFirstPage: true
    });

    const stream = fsSync.createWriteStream(filePath);
    doc.pipe(stream);

    // OPTIMIZED: Parse content more efficiently
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
          
          // Render heading
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

    // Wait for PDF to be written
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // Read PDF file
    const pdfBuffer = await fs.readFile(filePath);
    const base64 = pdfBuffer.toString('base64');

    // Send response immediately
    res.json({
      success: true,
      message: 'PDF generated successfully',
      data: {
        fileName,
        filePath,
        fileSize: pdfBuffer.length,
        base64
      }
    });

    // Clean up file in background (optional - remove if you want to keep files)
    // fs.unlink(filePath).catch(err => console.error('Error deleting temp file:', err));

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
 * Store document for unauthorized user (OPTIMIZED)
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

    // Use lean() for faster saves and create session ID inline
    const pendingDoc = await PendingDocument.create({
      documentName: documentName || `Generated ${templateType}`,
      content,
      templateType,
      templateData: templateData || {},
      sessionId: sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

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
 * Get pending document by ID or session ID (OPTIMIZED)
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
    
    // Use lean() for faster query (returns plain JS object)
    const pendingDoc = await PendingDocument.findOne(query).lean();

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
 * Delete pending document (OPTIMIZED)
 */
const deletePendingDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    // Use deleteOne for better performance
    await PendingDocument.deleteOne({ _id: documentId });

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
  generateAIContentStream, // NEW: For real streaming
  convertTextToPDF,
  storePendingDocument,
  getPendingDocument,
  deletePendingDocument
};