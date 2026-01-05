const { ChatOpenAI } = require('@langchain/openai');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { z } = require('zod');
// Import pdfjs-dist for PDF analysis
// Note: For Node.js, we need to use the legacy build or canvas
let pdfjsLib;
try {
  // Try the standard import first (works in newer versions)
  pdfjsLib = require('pdfjs-dist');
} catch (error) {
  // Fallback to legacy build for Node.js compatibility
  try {
    pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
  } catch (legacyError) {
    console.warn('pdfjs-dist not available, PDF analysis will be limited. Please install: npm install pdfjs-dist');
    pdfjsLib = null;
  }
}

/**
 * AI Co-Pilot Service for Envelope & Form Builders
 * Provides:
 * 1. Natural language to field placement
 * 2. PDF analysis for smart field suggestions
 * 3. Constraint checking
 */
class CoPilotService {
  constructor() {
    this.model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.3,
      openAIApiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Parse natural language command to field placements
   * @param {string} command - User's natural language command
   * @param {Object} context - Current state (recipients, documents, existing fields)
   * @returns {Promise<Object>} - Parsed field placements
   */
  async parseFieldCommand(command, context = {}) {
    const {
      recipients = [],
      documents = [],
      existingFields = [],
      currentPage = 1,
      mode = 'normal' // 'normal' or 'power'
    } = context;

    const FieldPlacementSchema = z.object({
      fields: z.array(z.object({
        type: z.enum(['signature', 'text', 'email', 'name', 'date', 'initial', 'company', 'title', 'phone', 'checkbox', 'dropdown']),
        recipientId: z.string().nullable().optional(),
        slotId: z.string().nullable().optional(),
        page: z.number().int().positive(),
        position: z.enum(['top-left', 'top-center', 'top-right', 'middle-left', 'middle-center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right', 'custom']),
        x: z.number().optional(), // Custom x coordinate (0-1 normalized)
        y: z.number().optional(), // Custom y coordinate (0-1 normalized)
        width: z.number().optional(), // Field width in pixels
        height: z.number().optional(), // Field height in pixels
        label: z.string().optional(),
        required: z.boolean().optional()
      })),
      recipientActions: z.array(z.object({
        action: z.enum(['add', 'update']),
        recipientId: z.string().optional(),
        name: z.string().optional(),
        email: z.string().optional(),
        role: z.string().optional()
      })).optional()
    });

    const parser = StructuredOutputParser.fromZodSchema(FieldPlacementSchema);

    // Format recipients and fields as plain text to avoid template variable conflicts
    const recipientsText = recipients.map((r, idx) => 
      `${idx + 1}. ${r.name || 'Unnamed'} (${r.email || 'no email'}) - ${r.role || 'signer'} [ID: ${r.id}]`
    ).join('\n  ');
    
    const fieldsText = existingFields.map((f, idx) => 
      `${idx + 1}. ${f.type || 'unknown'} on page ${f.page || 1}${f.recipientId ? ` for recipient ${f.recipientId}` : ''}`
    ).join('\n  ');

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are an AI assistant that helps users place form fields on PDF documents using natural language commands.

CONTEXT:
- Current recipients:
  ${recipientsText || 'None'}
- Existing fields:
  ${fieldsText || 'None'}
- Current page: ${currentPage}
- Mode: ${mode}
- Available document pages: ${documents.map(d => d.pages || 1).join(', ')}

FIELD TYPES:
- signature: Signature field
- text: Text input
- email: Email input
- name: Name field
- date: Date field
- initial: Initial field
- company: Company name
- title: Title/position
- phone: Phone number
- checkbox: Checkbox
- dropdown: Dropdown/select

POSITION KEYWORDS (MUST use exact enum values):
- "top", "top-left", "top-center", "top-right" → use position: "top-left", "top-center", or "top-right"
- "middle", "center", "middle-left", "middle-center", "middle-right" → use position: "middle-left", "middle-center", or "middle-right"
- "bottom", "bottom-left", "bottom-center", "bottom-right" → use position: "bottom-left", "bottom-center", or "bottom-right"
- "near [text]", "below [text]", "above [text]", "left of [text]", "right of [text]" → MUST use position: "custom" with x and y coordinates
- IMPORTANT: If user says "left of", "right of", "above", "below", "near" - you MUST set position: "custom" and provide x, y coordinates

PAGE DETECTION:
- "page 1", "first page" → page: 1
- "page 2", "second page" → page: 2
- "last page" → last page number
- If not specified, use current page: ${currentPage}

RECIPIENT MATCHING:
- Match recipient by name, email, or role mentioned in command
- If recipient doesn't exist but is mentioned, create a recipientAction to add them
- If mode is "power", use slotId instead of recipientId

EXAMPLES:
- "Add a signature on page 2 at the bottom" → {{fields: [{{type: "signature", page: 2, position: "bottom-right"}}]}}
- "Add name, email, and signature for John near the bottom of page 1" → {{fields: [{{type: "name", page: 1, position: "bottom-left"}}, {{type: "email", page: 1, position: "bottom-center"}}, {{type: "signature", page: 1, position: "bottom-right", recipientId: "john_id"}}]}}
- "Add 3 signature fields on page 1, one for each signer" → {{fields: [3 signatures, one per recipient]}}
- "Add a date field below the signature" → {{fields: [{{type: "date", page: currentPage, position: "custom", y: calculated_below_signature}}]}}

Parse the user's command and return structured field placements.`],
      ['human', 'Command: {command}\n\n{format_instructions}']
    ]);

    try {
      const formattedPrompt = await prompt.format({
        command,
        format_instructions: parser.getFormatInstructions()
      });

      const response = await this.model.invoke(formattedPrompt);
      
      // Clean the response content (remove markdown code blocks if present)
      let cleanedContent = response.content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/```\n?/g, '').trim();
      }

      let parsed;
      try {
        parsed = await parser.parse(cleanedContent);
      } catch (parseError) {
        // If parsing fails, try to fix invalid position values
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const rawJson = JSON.parse(jsonMatch[0]);
          // Fix invalid position values
          if (rawJson.fields && Array.isArray(rawJson.fields)) {
            rawJson.fields = rawJson.fields.map(field => {
              // Check if position is a valid enum value
              const validPositions = ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right', 'custom'];
              if (field.position && !validPositions.includes(field.position)) {
                // Save the original invalid position string
                const originalPosition = field.position;
                // Convert invalid position to "custom"
                field.position = 'custom';
                // Try to infer coordinates from the original invalid position string
                const coords = this.inferCoordinatesFromPosition(originalPosition, field.page);
                field.x = field.x || coords.x;
                field.y = field.y || coords.y;
              }
              return field;
            });
          }
          parsed = await parser.parse(JSON.stringify(rawJson));
        } else {
          throw parseError;
        }
      }

      // Convert position to coordinates if needed
      const fieldsWithCoords = await Promise.all(
        parsed.fields.map(async (field) => {
          if (field.position === 'custom' && field.x !== undefined && field.y !== undefined) {
            return field;
          }
          
          // Convert position keywords to approximate coordinates
          const coords = this.positionToCoordinates(field.position, field.page);
          return {
            ...field,
            x: field.x || coords.x,
            y: field.y || coords.y,
            width: field.width || 150,
            height: field.height || 50
          };
        })
      );

      return {
        success: true,
        fields: fieldsWithCoords,
        recipientActions: parsed.recipientActions || []
      };
    } catch (error) {
      console.error('Error parsing field command:', error);
      return {
        success: false,
        error: error.message,
        fields: [],
        recipientActions: []
      };
    }
  }

  /**
   * Analyze PDF and suggest field placements
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} - Suggested field placements with heatmap data
   */
  async analyzePDFForFieldSuggestions(pdfBuffer, options = {}) {
    const {
      fieldTypes = ['signature', 'date', 'name'],
      minConfidence = 0.6
    } = options;

    try {
      // Check if pdfjsLib is available
      if (!pdfjsLib) {
        return {
          success: false,
          error: 'PDF.js library is not available. Please install pdfjs-dist package.',
          suggestions: [],
          heatmapData: []
        };
      }

      // Convert Buffer to Uint8Array if needed (PDF.js requires Uint8Array, not Buffer)
      let pdfData = pdfBuffer;
      if (Buffer.isBuffer(pdfBuffer)) {
        pdfData = new Uint8Array(pdfBuffer);
      } else if (pdfBuffer instanceof Uint8Array) {
        pdfData = pdfBuffer;
      } else if (Array.isArray(pdfBuffer)) {
        pdfData = new Uint8Array(pdfBuffer);
      } else {
        // Try to convert to Uint8Array
        pdfData = new Uint8Array(Object.values(pdfBuffer));
      }

      // Load PDF
      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const suggestions = [];
      const heatmapData = [];

      // Analyze each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        
        // Get text content
        const textContent = await page.getTextContent();
        const textItems = textContent.items;

        // Analyze text for signature areas
        const signatureAreas = this.findSignatureAreas(textItems, viewport, pageNum);
        
        // Analyze text for date areas
        const dateAreas = this.findDateAreas(textItems, viewport, pageNum);
        
        // Analyze text for name/email areas
        const nameAreas = this.findNameAreas(textItems, viewport, pageNum);

        // Combine suggestions
        const pageSuggestions = [
          ...signatureAreas.map(area => ({
            ...area,
            type: 'signature',
            confidence: area.confidence
          })),
          ...dateAreas.map(area => ({
            ...area,
            type: 'date',
            confidence: area.confidence
          })),
          ...nameAreas.map(area => ({
            ...area,
            type: 'name',
            confidence: area.confidence
          }))
        ].filter(s => s.confidence >= minConfidence);

        suggestions.push(...pageSuggestions);

        // Generate heatmap data for visualization
        pageSuggestions.forEach(suggestion => {
          heatmapData.push({
            page: pageNum,
            x: suggestion.x / viewport.width, // Normalize to 0-1
            y: suggestion.y / viewport.height, // Normalize to 0-1
            width: suggestion.width / viewport.width,
            height: suggestion.height / viewport.height,
            type: suggestion.type,
            confidence: suggestion.confidence,
            reason: suggestion.reason
          });
        });
      }

      return {
        success: true,
        suggestions,
        heatmapData,
        totalPages: numPages
      };
    } catch (error) {
      console.error('Error analyzing PDF:', error);
      return {
        success: false,
        error: error.message,
        suggestions: [],
        heatmapData: []
      };
    }
  }

  /**
   * Find signature areas in PDF text
   */
  findSignatureAreas(textItems, viewport, pageNum) {
    const areas = [];
    const signatureKeywords = ['signature', 'sign', 'sign here', 'signature line', 'signed', 'signature block', 'signature:', 'signature of'];
    
    textItems.forEach((item, index) => {
      const text = item.str.toLowerCase();
      const hasSignatureKeyword = signatureKeywords.some(keyword => text.includes(keyword));
      
      if (hasSignatureKeyword) {
        // Check if there's space below for signature field
        const nextItem = textItems[index + 1];
        const hasSpaceBelow = !nextItem || (nextItem.transform[5] - item.transform[5] > 30);
        
        areas.push({
          page: pageNum,
          x: item.transform[4], // x coordinate
          y: item.transform[5] + 20, // y coordinate (below text)
          width: 150,
          height: 50,
          confidence: 0.85,
          reason: `Found signature keyword: "${item.str}"`
        });
      }
    });

    // Also check bottom of page (common signature location)
    areas.push({
      page: pageNum,
      x: viewport.width - 200, // Right side
      y: viewport.height - 100, // Near bottom
      width: 150,
      height: 50,
      confidence: 0.7,
      reason: 'Common signature location (bottom-right)'
    });

    return areas;
  }

  /**
   * Find date areas in PDF text
   */
  findDateAreas(textItems, viewport, pageNum) {
    const areas = [];
    const dateKeywords = ['date', 'dated', 'date:', 'date signed', 'signature date', 'execution date'];
    
    textItems.forEach((item, index) => {
      const text = item.str.toLowerCase();
      const hasDateKeyword = dateKeywords.some(keyword => text.includes(keyword));
      
      if (hasDateKeyword) {
        areas.push({
          page: pageNum,
          x: item.transform[4],
          y: item.transform[5] + 20,
          width: 120,
          height: 40,
          confidence: 0.8,
          reason: `Found date keyword: "${item.str}"`
        });
      }
    });

    return areas;
  }

  /**
   * Find name/email areas in PDF text
   */
  findNameAreas(textItems, viewport, pageNum) {
    const areas = [];
    const nameKeywords = ['name', 'name:', 'full name', 'printed name', 'name of signer', 'signer name'];
    const emailKeywords = ['email', 'email:', 'e-mail', 'email address'];
    
    textItems.forEach((item, index) => {
      const text = item.str.toLowerCase();
      const hasNameKeyword = nameKeywords.some(keyword => text.includes(keyword));
      const hasEmailKeyword = emailKeywords.some(keyword => text.includes(keyword));
      
      if (hasNameKeyword) {
        areas.push({
          page: pageNum,
          x: item.transform[4],
          y: item.transform[5] + 20,
          width: 200,
          height: 40,
          confidence: 0.75,
          reason: `Found name keyword: "${item.str}"`,
          fieldType: 'name'
        });
      }
      
      if (hasEmailKeyword) {
        areas.push({
          page: pageNum,
          x: item.transform[4],
          y: item.transform[5] + 20,
          width: 250,
          height: 40,
          confidence: 0.75,
          reason: `Found email keyword: "${item.str}"`,
          fieldType: 'email'
        });
      }
    });

    return areas;
  }

  /**
   * Check constraints and validate field configuration
   * @param {Object} context - Current state
   * @returns {Promise<Object>} - Constraint violations and warnings
   */
  async checkConstraints(context) {
    const {
      recipients = [],
      signatureFields = [],
      documents = [],
      mode = 'normal'
    } = context;

    const violations = [];
    const warnings = [];

    // Check 1: Recipients without signature fields
    recipients.forEach(recipient => {
      if (recipient.role === 'signer' || recipient.role === 'approver') {
        const hasSignatureField = signatureFields.some(field => 
          (mode === 'normal' && field.recipientId === recipient.id) ||
          (mode === 'power' && field.slotId === recipient.id)
        );
        
        if (!hasSignatureField) {
          violations.push({
            type: 'missing_signature_field',
            severity: 'error',
            message: `${recipient.name || recipient.email} (${recipient.role}) has no signature field assigned`,
            recipientId: recipient.id,
            recipientName: recipient.name || recipient.email
          });
        }
      }
    });

    // Check 2: Recipients without email
    recipients.forEach(recipient => {
      if (!recipient.email || recipient.email.trim() === '') {
        violations.push({
          type: 'missing_email',
          severity: 'error',
          message: `${recipient.name || 'Recipient'} has no email address`,
          recipientId: recipient.id,
          recipientName: recipient.name
        });
      }
    });

    // Check 3: Signature fields without recipients
    signatureFields.forEach(field => {
      if (field.type === 'signature' || field.type === 'initial') {
        const hasRecipient = mode === 'normal'
          ? recipients.some(r => r.id === field.recipientId)
          : recipients.some(r => r.id === field.slotId);
        
        if (!hasRecipient) {
          warnings.push({
            type: 'orphaned_field',
            severity: 'warning',
            message: `Signature field on page ${field.page} has no assigned recipient`,
            fieldId: field.id,
            page: field.page
          });
        }
      }
    });

    // Check 4: Multiple signatures for same recipient on same page
    recipients.forEach(recipient => {
      const recipientFields = signatureFields.filter(field =>
        (mode === 'normal' && field.recipientId === recipient.id) ||
        (mode === 'power' && field.slotId === recipient.id)
      );
      
      const fieldsByPage = {};
      recipientFields.forEach(field => {
        if (!fieldsByPage[field.page]) {
          fieldsByPage[field.page] = [];
        }
        fieldsByPage[field.page].push(field);
      });

      Object.keys(fieldsByPage).forEach(page => {
        if (fieldsByPage[page].length > 1) {
          warnings.push({
            type: 'multiple_signatures_same_page',
            severity: 'warning',
            message: `${recipient.name || recipient.email} has ${fieldsByPage[page].length} signature fields on page ${page}`,
            recipientId: recipient.id,
            page: parseInt(page)
          });
        }
      });
    });

    // Check 5: Fields on non-existent pages
    const maxPages = Math.max(...documents.map(d => d.pages || 1), 1);
    signatureFields.forEach(field => {
      if (field.page > maxPages) {
        violations.push({
          type: 'invalid_page',
          severity: 'error',
          message: `Field on page ${field.page} but document only has ${maxPages} page(s)`,
          fieldId: field.id,
          page: field.page,
          maxPages
        });
      }
    });

    // Check 6: Sequential signing order validation
    if (context.signingOrder === 'sequential') {
      const recipientsWithOrder = recipients
        .filter(r => r.order !== undefined && r.order !== null)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      if (recipientsWithOrder.length > 0) {
        const hasGaps = recipientsWithOrder.some((r, index) => r.order !== index + 1);
        if (hasGaps) {
          warnings.push({
            type: 'signing_order_gaps',
            severity: 'warning',
            message: 'Signing order has gaps. Recipients should be numbered sequentially (1, 2, 3...)',
            recipients: recipientsWithOrder.map(r => ({ id: r.id, name: r.name, order: r.order }))
          });
        }
      }
    }

    return {
      success: true,
      violations,
      warnings,
      summary: {
        totalViolations: violations.length,
        totalWarnings: warnings.length,
        canProceed: violations.length === 0
      }
    };
  }

  /**
   * Convert position keyword to normalized coordinates
   */
  positionToCoordinates(position, page) {
    // Default page dimensions (will be adjusted based on actual PDF)
    const defaultWidth = 612; // Letter size width in points
    const defaultHeight = 792; // Letter size height in points

    const positions = {
      'top-left': { x: 50, y: 50 },
      'top-center': { x: defaultWidth / 2 - 75, y: 50 },
      'top-right': { x: defaultWidth - 200, y: 50 },
      'middle-left': { x: 50, y: defaultHeight / 2 },
      'middle-center': { x: defaultWidth / 2 - 75, y: defaultHeight / 2 },
      'middle-right': { x: defaultWidth - 200, y: defaultHeight / 2 },
      'bottom-left': { x: 50, y: defaultHeight - 100 },
      'bottom-center': { x: defaultWidth / 2 - 75, y: defaultHeight - 100 },
      'bottom-right': { x: defaultWidth - 200, y: defaultHeight - 100 }
    };

    return positions[position] || positions['bottom-right'];
  }

  /**
   * Infer coordinates from invalid position string
   */
  inferCoordinatesFromPosition(positionString, page) {
    const defaultWidth = 612;
    const defaultHeight = 792;
    
    const lower = positionString.toLowerCase();
    
    // Try to infer from keywords
    if (lower.includes('left')) {
      if (lower.includes('top')) return { x: 50, y: 50 };
      if (lower.includes('bottom')) return { x: 50, y: defaultHeight - 100 };
      if (lower.includes('middle') || lower.includes('center')) return { x: 50, y: defaultHeight / 2 };
      return { x: 50, y: defaultHeight - 100 }; // Default to bottom-left
    }
    if (lower.includes('right')) {
      if (lower.includes('top')) return { x: defaultWidth - 200, y: 50 };
      if (lower.includes('bottom')) return { x: defaultWidth - 200, y: defaultHeight - 100 };
      if (lower.includes('middle') || lower.includes('center')) return { x: defaultWidth - 200, y: defaultHeight / 2 };
      return { x: defaultWidth - 200, y: defaultHeight - 100 }; // Default to bottom-right
    }
    if (lower.includes('center') || lower.includes('middle')) {
      if (lower.includes('top')) return { x: defaultWidth / 2 - 75, y: 50 };
      if (lower.includes('bottom')) return { x: defaultWidth / 2 - 75, y: defaultHeight - 100 };
      return { x: defaultWidth / 2 - 75, y: defaultHeight / 2 }; // Default to middle-center
    }
    if (lower.includes('top')) {
      return { x: defaultWidth / 2 - 75, y: 50 }; // Default to top-center
    }
    if (lower.includes('bottom')) {
      return { x: defaultWidth / 2 - 75, y: defaultHeight - 100 }; // Default to bottom-center
    }
    
    // Default to bottom-right
    return { x: defaultWidth - 200, y: defaultHeight - 100 };
  }
}

module.exports = new CoPilotService();

