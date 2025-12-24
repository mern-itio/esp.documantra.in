const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const mongoose = require('mongoose');
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
const pendingDocumentSchema = new mongoose.Schema({
  documentName: String,
  content: String,
  templateType: String,
  templateData: mongoose.Schema.Types.Mixed,
  sessionId: String,
  createdAt: { type: Date, default: Date.now, expires: 86400 }
}, { timestamps: true });
let PendingDocument;
try {
  PendingDocument = mongoose.models.PendingDocument || mongoose.model('PendingDocument', pendingDocumentSchema);
} catch (e) {
  PendingDocument = mongoose.model('PendingDocument', pendingDocumentSchema);
}

// AI Feedback Schema
const aiFeedbackSchema = new mongoose.Schema({
  messageId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  feedbackType: { type: String, enum: ['like', 'dislike'], required: true },
  feedbackComment: { type: String, default: null },
  templateType: { type: String, default: null },
  userMessage: { type: String, default: null },
  aiResponse: { type: String, default: null },
  categories: [{ type: String }],
  metadata: {
    userAgent: String,
    ipAddress: String,
    responseLength: Number,
    tokensUsed: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound index for unique feedback per message per session
aiFeedbackSchema.index({ messageId: 1, sessionId: 1 }, { unique: true });

let AIFeedback;
try {
  AIFeedback = mongoose.models.AIFeedback || mongoose.model('AIFeedback', aiFeedbackSchema);
} catch (e) {
  AIFeedback = mongoose.model('AIFeedback', aiFeedbackSchema);
}

// Feedback Categories Schema
const feedbackCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  feedbackType: { type: String, enum: ['like', 'dislike', 'both'], default: 'both' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

let FeedbackCategory;
try {
  FeedbackCategory = mongoose.models.FeedbackCategory || mongoose.model('FeedbackCategory', feedbackCategorySchema);
} catch (e) {
  FeedbackCategory = mongoose.model('FeedbackCategory', feedbackCategorySchema);
}

// Initialize default feedback categories
const initializeFeedbackCategories = async () => {
  try {
    const count = await FeedbackCategory.countDocuments();
    if (count === 0) {
      await FeedbackCategory.insertMany([
        {
          name: 'Inaccurate Information',
          description: 'The response contains incorrect or misleading information',
          feedbackType: 'dislike',
          order: 1
        },
        {
          name: 'Incomplete Response',
          description: 'The response is missing important details',
          feedbackType: 'dislike',
          order: 2
        },
        {
          name: 'Formatting Issues',
          description: 'The document formatting is poor or incorrect',
          feedbackType: 'dislike',
          order: 3
        },
        {
          name: 'Tone/Style Issues',
          description: 'The tone or writing style is inappropriate',
          feedbackType: 'dislike',
          order: 4
        },
        {
          name: 'Too Generic',
          description: 'The response is too generic and lacks specificity',
          feedbackType: 'dislike',
          order: 5
        },
        {
          name: 'Helpful',
          description: 'The response was helpful and accurate',
          feedbackType: 'like',
          order: 6
        },
        {
          name: 'Well Formatted',
          description: 'The document is well-structured and professional',
          feedbackType: 'like',
          order: 7
        },
        {
          name: 'Clear and Concise',
          description: 'The response was clear and easy to understand',
          feedbackType: 'like',
          order: 8
        },
        {
          name: 'Other',
          description: 'Other feedback not covered by categories',
          feedbackType: 'both',
          order: 9
        }
      ]);
      console.log('Feedback categories initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing feedback categories:', error);
  }
};

// Initialize categories on startup
initializeFeedbackCategories();

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
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_completion_tokens: 4000,
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
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); 
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
    const stream = await openai.chat.completions.create({
      model: process.env.AI_MODEL ,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_completion_tokens: 4000,
      stream: true, 
      // presence_penalty: 0.1,
      // frequency_penalty: 0.1
    });
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      if (chunk.choices[0]?.finish_reason === 'stop') {
        res.write(`data: [DONE]\n\n`);
        break;
      }
    }
    res.end();
  } catch (error) {
    console.error('Error streaming AI content:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};
function renderFormattedText(doc, text, options = {}) {
  const { fontSize = 11, width = 495 } = options;
  if (!text.includes('**')) {
    doc.font('Times-Roman').fontSize(fontSize);
    doc.text(text, {
      align: 'left',
      width: width,
      lineGap: 2
    });
    return;
  }
  const parts = [];
  let currentPos = 0;
  const regex = /\*\*([^*]+)\*\*/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > currentPos) {
      parts.push({
        text: text.substring(currentPos, match.index),
        bold: false
      });
    }
    parts.push({
      text: match[1],
      bold: true
    });
    currentPos = match.index + match[0].length;
  }
  if (currentPos < text.length) {
    parts.push({
      text: text.substring(currentPos),
      bold: false
    });
  }
  if (parts.length === 0) {
    doc.font('Times-Roman').fontSize(fontSize);
    doc.text(text, {
      align: 'left',
      width: width,
      lineGap: 2
    });
    return;
  }
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
function isHeading(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 4) return false;
  const cleaned = trimmed.replace(/\*\*/g, '');
  if (cleaned === cleaned.toUpperCase() && cleaned.length < 100) {
    return true;
  }
  return /^\d+\.\s+/.test(cleaned);
}
const convertTextToPDF = async (req, res) => {
  try {
    const { content, documentName } = req.body;
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }
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
  } catch (error) {
    console.error('Error converting to PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert to PDF',
      error: error.message
    });
  }
};
const storePendingDocument = async (req, res) => {
  try {
    const { documentName, content, templateType, templateData, sessionId } = req.body;
    if (!content || !templateType) {
      return res.status(400).json({
        success: false,
        message: 'Content and template type are required'
      });
    }
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
const deletePendingDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
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

const submitFeedback = async (req, res) => {
  try {
    const {
      messageId,
      sessionId,
      feedbackType,
      feedbackComment,
      templateType,
      userMessage,
      aiResponse,
      categories
    } = req.body;

    // Validate required fields
    if (!messageId || !sessionId || !feedbackType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: messageId, sessionId, and feedbackType are required'
      });
    }

    if (!['like', 'dislike'].includes(feedbackType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback type. Must be "like" or "dislike"'
      });
    }

    // Get user ID if authenticated
    const userId = req.user?.id || null;

    // Get metadata
    const metadata = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
      responseLength: aiResponse?.length || 0
    };

    // Check if feedback already exists
    const existingFeedback = await AIFeedback.findOne({ messageId, sessionId });

    let feedback;
    if (existingFeedback) {
      // Update existing feedback
      existingFeedback.feedbackType = feedbackType;
      existingFeedback.feedbackComment = feedbackComment || null;
      existingFeedback.categories = categories || [];
      existingFeedback.userId = userId;
      existingFeedback.templateType = templateType || existingFeedback.templateType;
      existingFeedback.metadata = metadata;
      existingFeedback.updatedAt = new Date();
      
      feedback = await existingFeedback.save();
    } else {
      // Create new feedback
      feedback = await AIFeedback.create({
        messageId,
        sessionId,
        userId,
        feedbackType,
        feedbackComment: feedbackComment || null,
        templateType: templateType || null,
        userMessage: userMessage || null,
        aiResponse: aiResponse || null,
        categories: categories || [],
        metadata
      });
    }

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        feedbackId: feedback._id.toString(),
        feedbackType: feedback.feedbackType
      }
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Feedback already exists for this message. Please try again.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
};
module.exports = {
  generateAIContent,
  generateAIContentStream, 
  convertTextToPDF,
  storePendingDocument,
  getPendingDocument,
  deletePendingDocument,
  submitFeedback
};