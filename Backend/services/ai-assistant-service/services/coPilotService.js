const { ChatOpenAI } = require('@langchain/openai');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { z } = require('zod');
let pdfjsLib;
try {
  pdfjsLib = require('pdfjs-dist');
} catch (error) {
  try {
    pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
  } catch (legacyError) {
    console.warn('pdfjs-dist not available, PDF analysis will be limited. Please install: npm install pdfjs-dist');
    pdfjsLib = null;
  }
}
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
      mode = 'normal', // 'normal' or 'power'
      fieldTypes = [] // For form builder context
    } = context;

    // Detect if this is a form builder context (no documents/pages needed)
    const isFormBuilder = !documents || documents.length === 0;
    
    // Different schemas for PDF placement vs Form Builder
    const PDFFieldPlacementSchema = z.object({
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

    const FormBuilderSchema = z.object({
      fields: z.array(z.object({
        type: z.enum(['text', 'email', 'phone', 'date', 'checkbox', 'radio', 'select', 'dropdown', 'textarea', 'number', 'name', 'company', 'title']),
        label: z.string().optional(),
        placeholder: z.string().optional(),
        required: z.boolean().optional(),
        options: z.array(z.string()).optional() 
      }))
    });

    const schema = isFormBuilder ? FormBuilderSchema : PDFFieldPlacementSchema;
    const FieldPlacementSchema = schema;
    const parser = StructuredOutputParser.fromZodSchema(FieldPlacementSchema);
    const recipientsText = recipients.map((r, idx) => 
      `${idx + 1}. ${r.name || 'Unnamed'} (${r.email || 'no email'}) - ${r.role || 'signer'} [ID: ${r.id}]`
    ).join('\n  ');    
    const fieldsText = isFormBuilder 
      ? existingFields.map((f, idx) => 
          `${idx + 1}. ${f.type || 'unknown'} - ${f.label || 'No label'}${f.required ? ' (required)' : ''}`
        ).join('\n  ')
      : existingFields.map((f, idx) => 
          `${idx + 1}. ${f.type || 'unknown'} on page ${f.page || 1}${f.recipientId ? ` for recipient ${f.recipientId}` : ''}`
        ).join('\n  ');

    const systemPrompt = isFormBuilder
      ? `You are an AI assistant that helps users add form fields to a form builder using natural language commands.

CONTEXT:
- Existing fields:
  ${fieldsText || 'None'}
- Available field types: ${fieldTypes.length > 0 ? fieldTypes.join(', ') : 'text, email, phone, date, checkbox, radio, select, dropdown, textarea, number, name, company, title'}

FIELD TYPES:
- text: Text input field
- email: Email input field
- phone: Phone number field
- date: Date picker field
- checkbox: Checkbox field (for yes/no, agree/disagree, etc.)
- radio: Radio button group (requires options)
- select: Dropdown/select field (requires options)
- dropdown: Same as select
- textarea: Multi-line text area
- number: Number input field
- name: Name field
- company: Company name field
- title: Title/position field

IMPORTANT RULES:
1. Extract the field type from the command (e.g., "add checkbox" → type: "checkbox")
2. Extract or infer a meaningful label from the command (e.g., "add checkbox for terms" → label: "Terms and Conditions")
3. If the command mentions "required" or "mandatory", set required: true
4. For checkbox fields, common labels include: "I agree", "Terms and Conditions", "Accept", etc.
5. For radio/select/dropdown, if options are mentioned, include them in the options array
6. If no label is specified, create a sensible default based on the field type

EXAMPLES:
- "add checkbox field" → {{fields: [{{type: "checkbox", label: "Checkbox"}}]}}
- "add checkbox for terms" → {{fields: [{{type: "checkbox", label: "Terms and Conditions", required: true}}]}}
- "add email field" → {{fields: [{{type: "email", label: "Email"}}]}}
- "add date picker" → {{fields: [{{type: "date", label: "Date"}}]}}
- "add phone number field" → {{fields: [{{type: "phone", label: "Phone Number"}}]}}
- "add required checkbox for agreement" → {{fields: [{{type: "checkbox", label: "Agreement", required: true}}]}}

Parse the user's command and return structured field definitions.`
      : `You are an AI assistant that helps users place form fields on PDF documents using natural language commands.

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

Parse the user's command and return structured field placements.`;

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      ['human', 'Command: {command}\n\n{format_instructions}']
    ]);

    try {
      const formattedPrompt = await prompt.format({
        command,
        format_instructions: parser.getFormatInstructions()
      });

      const response = await this.model.invoke(formattedPrompt);
      
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
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const rawJson = JSON.parse(jsonMatch[0]);
          if (rawJson.fields && Array.isArray(rawJson.fields)) {
            if (!isFormBuilder) {
              // PDF placement: fix positions
              rawJson.fields = rawJson.fields.map(field => {
                const validPositions = ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right', 'custom'];
                if (field.position && !validPositions.includes(field.position)) {
                  const originalPosition = field.position;
                  field.position = 'custom';
                  const coords = this.inferCoordinatesFromPosition(originalPosition, field.page || currentPage);
                  field.x = field.x || coords.x;
                  field.y = field.y || coords.y;
                }
                return field;
              });
            }
          }
          parsed = await parser.parse(JSON.stringify(rawJson));
        } else {
          throw parseError;
        }
      }

      // Process fields differently for form builder vs PDF placement
      if (isFormBuilder) {
        // Form builder: just return fields as-is (no coordinates needed)
        return {
          success: true,
          data: {
            fields: parsed.fields.map(field => ({
              type: field.type,
              label: field.label || `${field.type.charAt(0).toUpperCase() + field.type.slice(1)} Field`,
              placeholder: field.placeholder,
              required: field.required || false,
              options: field.options || []
            }))
          }
        };
      } else {
        // PDF placement: add coordinates
        const fieldsWithCoords = await Promise.all(
          parsed.fields.map(async (field) => {
            if (field.position === 'custom' && field.x !== undefined && field.y !== undefined) {
              return field;
            }
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
          data: {
            fields: fieldsWithCoords,
            recipientActions: parsed.recipientActions || []
          }
        };
      }
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
   * Analyze PDF and suggest field placements using AI
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} - Suggested field placements with heatmap data
   */
  async analyzePDFForFieldSuggestions(pdfBuffer, options = {}) {
    const {
      fieldTypes = ['signature', 'date', 'name'],
      minConfidence = 0.7, // Increased from 0.6
      usePythonAnalyzer = process.env.USE_PYTHON_ANALYZER === 'true'
    } = options;

    // Try Python analyzer first if enabled
    if (usePythonAnalyzer) {
      try {
        const pythonResult = await this.analyzePDFWithPython(pdfBuffer, options);
        if (pythonResult && pythonResult.success && pythonResult.suggestions?.length > 0) {
          return pythonResult;
        }
        // Fall back to Node.js if Python fails or returns no results
        console.log('Python analyzer returned no results, falling back to Node.js');
      } catch (pythonError) {
        console.warn('Python analyzer failed, falling back to Node.js:', pythonError.message);
      }
    }

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

      let pdfData = pdfBuffer;
      if (Buffer.isBuffer(pdfBuffer)) {
        pdfData = new Uint8Array(pdfBuffer);
      } else if (pdfBuffer instanceof Uint8Array) {
        pdfData = pdfBuffer;
      } else if (Array.isArray(pdfBuffer)) {
        pdfData = new Uint8Array(pdfBuffer);
      } else {
        pdfData = new Uint8Array(Object.values(pdfBuffer));
      }

      // Load PDF
      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const allSuggestions = [];
      const pageTexts = [];

      // Extract text from each page and analyze with AI
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        
        // Get text content
        const textContent = await page.getTextContent();
        const textItems = textContent.items;
        
        // Build full page text for AI analysis
        const pageText = textItems.map(item => item.str).join(' ');
        pageTexts.push({
          pageNum,
          text: pageText,
          textItems,
          viewport
        });
      }

      // Try AI analysis first
      let aiSuggestions = [];
      try {
        aiSuggestions = await this.analyzePDFWithAI(pageTexts, fieldTypes);
      } catch (aiError) {
        console.warn('AI analysis failed, falling back to heuristics:', aiError.message);
      }
      
      // Also use heuristic-based detection for additional context
      for (const pageData of pageTexts) {
        const { pageNum, textItems, viewport } = pageData;
        
        // Get heuristic-based suggestions (more conservative now)
        const signatureAreas = this.findSignatureAreas(textItems, viewport, pageNum);
        const dateAreas = this.findDateAreas(textItems, viewport, pageNum);
        const nameAreas = this.findNameAreas(textItems, viewport, pageNum);

        // Combine heuristic suggestions
        const heuristicSuggestions = [
          ...signatureAreas,
          ...dateAreas,
          ...nameAreas
        ];

        // Merge AI and heuristic suggestions, prioritizing AI
        const mergedSuggestions = this.mergeAndDeduplicateSuggestions(
          aiSuggestions.filter(s => s.page === pageNum),
          heuristicSuggestions,
          viewport
        );

        allSuggestions.push(...mergedSuggestions);
      }

      // Final deduplication across all pages
      const finalSuggestions = this.deduplicateSuggestions(allSuggestions, minConfidence);
      
      // Generate heatmap data
      const heatmapData = finalSuggestions.map(suggestion => {
        const pageData = pageTexts.find(p => p.pageNum === suggestion.page);
        const viewport = pageData?.viewport || { width: 612, height: 792 };
        return {
          page: suggestion.page,
          x: suggestion.x / viewport.width,
          y: suggestion.y / viewport.height,
          width: suggestion.width / viewport.width,
          height: suggestion.height / viewport.height,
          type: suggestion.type,
          confidence: suggestion.confidence,
          reason: suggestion.reason
        };
      });

      return {
        success: true,
        suggestions: finalSuggestions,
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
   * Use AI to intelligently analyze PDF text and suggest fields
   */
  async analyzePDFWithAI(pageTexts, fieldTypes) {
    const FieldSuggestionSchema = z.object({
      suggestions: z.array(z.object({
        type: z.enum(['signature', 'text', 'email', 'name', 'date', 'initial', 'company', 'title', 'phone', 'checkbox', 'dropdown']),
        page: z.number().int().positive(),
        x: z.number().min(0).max(1).describe('Normalized x coordinate (0-1)'),
        y: z.number().min(0).max(1).describe('Normalized y coordinate (0-1)'),
        width: z.number().optional(),
        height: z.number().optional(),
        confidence: z.number().min(0).max(1),
        reason: z.string().describe('Why this field was suggested'),
        context: z.string().optional().describe('Surrounding text context')
      }))
    });

    const parser = StructuredOutputParser.fromZodSchema(FieldSuggestionSchema);

    // Build context for AI
    const pagesContext = pageTexts.map((p, idx) => 
      `Page ${p.pageNum}:\n${p.text.substring(0, 2000)}${p.text.length > 2000 ? '...' : ''}`
    ).join('\n\n---\n\n');

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are an expert at analyzing PDF documents to identify where form fields should be placed.

Your task is to carefully analyze the PDF text and suggest ONLY the fields that are actually needed based on the document content.

IMPORTANT RULES:
1. Be CONSERVATIVE - only suggest fields where there is clear evidence they are needed
2. Do NOT suggest multiple signature fields on the same page unless the document explicitly requires multiple signers
3. Look for actual field labels like "Signature:", "Date:", "Name:", etc. in the text
4. Consider the document context - a contract typically needs 1-2 signatures, not 10
5. Only suggest fields where there is space and context indicating a field is needed
6. Avoid suggesting fields in headers, footers, or document metadata areas
7. For signature fields, prefer suggesting them near the bottom of pages where signatures typically appear
8. Do NOT add default/fallback fields - only suggest fields based on actual document content

FIELD TYPES TO LOOK FOR:
- signature: Where "signature", "sign here", "signature line" appears
- date: Where "date", "dated", "date signed" appears
- name: Where "name", "printed name", "full name" appears
- email: Where "email", "email address" appears

Return suggestions with:
- Normalized coordinates (0-1) for x and y
- Confidence score (0.7-1.0) based on how certain you are
- A clear reason explaining why this field was suggested
- Context showing the surrounding text that led to this suggestion

Be selective and accurate. Quality over quantity.`],
      ['human', `Analyze this PDF document and suggest form fields:

${pagesContext}

Total pages: ${pageTexts.length}

{format_instructions}`]
    ]);

    try {
      const formattedPrompt = await prompt.format({
        format_instructions: parser.getFormatInstructions()
      });

      const response = await this.model.invoke(formattedPrompt);
      
      let cleanedContent = response.content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/```\n?/g, '').trim();
      }

      const parsed = await parser.parse(cleanedContent);
      
      // Convert normalized coordinates to pixel coordinates
      return parsed.suggestions.map(suggestion => {
        const pageData = pageTexts.find(p => p.pageNum === suggestion.page);
        const viewport = pageData?.viewport || { width: 612, height: 792 };
        
        return {
          page: suggestion.page,
          x: suggestion.x * viewport.width,
          y: suggestion.y * viewport.height,
          width: suggestion.width || 150,
          height: suggestion.height || 50,
          type: suggestion.type,
          confidence: suggestion.confidence,
          reason: suggestion.reason,
          context: suggestion.context
        };
      });
    } catch (error) {
      console.error('Error in AI analysis, falling back to heuristics:', error);
      return []; // Fall back to heuristic-based analysis
    }
  }

  /**
   * Merge AI and heuristic suggestions, removing duplicates
   */
  mergeAndDeduplicateSuggestions(aiSuggestions, heuristicSuggestions, viewport) {
    const merged = [...aiSuggestions];
    
    // Add heuristic suggestions that don't overlap with AI suggestions
    for (const heuristic of heuristicSuggestions) {
      const isDuplicate = aiSuggestions.some(ai => 
        this.areSuggestionsClose(ai, heuristic, viewport)
      );
      
      if (!isDuplicate) {
        // Lower confidence for heuristic-only suggestions
        merged.push({
          ...heuristic,
          confidence: heuristic.confidence * 0.8
        });
      }
    }
    
    return merged;
  }

  /**
   * Check if two suggestions are too close (within 100 pixels)
   */
  areSuggestionsClose(s1, s2, viewport) {
    if (s1.page !== s2.page || s1.type !== s2.type) return false;
    
    const distance = Math.sqrt(
      Math.pow(s1.x - s2.x, 2) + Math.pow(s1.y - s2.y, 2)
    );
    
    return distance < 100; // 100 pixels threshold
  }

  /**
   * Final deduplication pass to remove close suggestions
   */
  deduplicateSuggestions(suggestions, minConfidence) {
    const filtered = suggestions.filter(s => s.confidence >= minConfidence);
    const deduplicated = [];
    const processed = new Set();
    
    // Sort by confidence (highest first)
    filtered.sort((a, b) => b.confidence - a.confidence);
    
    for (let i = 0; i < filtered.length; i++) {
      if (processed.has(i)) continue;
      
      const current = filtered[i];
      deduplicated.push(current);
      processed.add(i);
      
      // Mark nearby suggestions as processed
      for (let j = i + 1; j < filtered.length; j++) {
        if (processed.has(j)) continue;
        
        const other = filtered[j];
        if (current.page === other.page && current.type === other.type) {
          const distance = Math.sqrt(
            Math.pow(current.x - other.x, 2) + Math.pow(current.y - other.y, 2)
          );
          
          // If within 100 pixels and same type, mark as duplicate
          if (distance < 100) {
            processed.add(j);
          }
        }
      }
    }
    
    return deduplicated;
  }

  /**
   * Find signature areas in PDF text (conservative approach)
   */
  findSignatureAreas(textItems, viewport, pageNum) {
    const areas = [];
    // More specific keywords to reduce false positives
    const signatureKeywords = [
      'signature:', 'sign here', 'signature line', 'signature of',
      'signature block', 'signature field', 'signature required'
    ];
    
    // Track found keywords to avoid duplicates
    const foundPositions = new Set();
    const MIN_DISTANCE = 150; // Minimum distance between signature fields
    
    textItems.forEach((item, index) => {
      const text = item.str.toLowerCase().trim();
      const hasSignatureKeyword = signatureKeywords.some(keyword => 
        text === keyword || text.startsWith(keyword + ' ') || text.endsWith(' ' + keyword)
      );
      
      if (hasSignatureKeyword) {
        const x = item.transform[4];
        const y = item.transform[5];
        
        // Check if this position is too close to an already found signature
        const isTooClose = Array.from(foundPositions).some(pos => {
          const [px, py] = pos.split(',').map(Number);
          const distance = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));
          return distance < MIN_DISTANCE;
        });
        
        if (!isTooClose) {
          // Check if there's space below for signature field
          const nextItem = textItems[index + 1];
          const hasSpaceBelow = !nextItem || (nextItem.transform[5] - item.transform[5] > 30);
          
          // Only suggest if there's space and it's in a reasonable location (not in header/footer)
          const isInReasonableArea = y > 50 && y < viewport.height - 50;
          
          if (hasSpaceBelow && isInReasonableArea) {
            foundPositions.add(`${x},${y}`);
            areas.push({
              page: pageNum,
              x: x,
              y: y + 20, // y coordinate (below text)
              width: 150,
              height: 50,
              confidence: 0.8,
              reason: `Found signature keyword: "${item.str}"`
            });
          }
        }
      }
    });

    // REMOVED: Automatic bottom-right signature field
    // This was causing too many false positives

    return areas;
  }

  /**
   * Find date areas in PDF text (conservative approach)
   */
  findDateAreas(textItems, viewport, pageNum) {
    const areas = [];
    // More specific keywords
    const dateKeywords = [
      'date:', 'date signed', 'signature date', 'execution date',
      'dated:', 'date of signature'
    ];
    
    const foundPositions = new Set();
    const MIN_DISTANCE = 100;
    
    textItems.forEach((item, index) => {
      const text = item.str.toLowerCase().trim();
      const hasDateKeyword = dateKeywords.some(keyword => 
        text === keyword || text.startsWith(keyword + ' ') || text.endsWith(' ' + keyword)
      );
      
      if (hasDateKeyword) {
        const x = item.transform[4];
        const y = item.transform[5];
        
        // Check proximity
        const isTooClose = Array.from(foundPositions).some(pos => {
          const [px, py] = pos.split(',').map(Number);
          const distance = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));
          return distance < MIN_DISTANCE;
        });
        
        if (!isTooClose) {
          const isInReasonableArea = y > 50 && y < viewport.height - 50;
          
          if (isInReasonableArea) {
            foundPositions.add(`${x},${y}`);
            areas.push({
              page: pageNum,
              x: x,
              y: y + 20,
              width: 120,
              height: 40,
              confidence: 0.75,
              reason: `Found date keyword: "${item.str}"`
            });
          }
        }
      }
    });

    return areas;
  }

  /**
   * Find name/email areas in PDF text (conservative approach)
   */
  findNameAreas(textItems, viewport, pageNum) {
    const areas = [];
    // More specific keywords to avoid false positives
    const nameKeywords = [
      'name:', 'full name', 'printed name', 'name of signer',
      'signer name', 'your name', 'signer\'s name'
    ];
    const emailKeywords = [
      'email:', 'e-mail:', 'email address', 'e-mail address',
      'your email', 'email address:'
    ];
    
    const foundPositions = new Set();
    const MIN_DISTANCE = 100;
    
    textItems.forEach((item, index) => {
      const text = item.str.toLowerCase().trim();
      const hasNameKeyword = nameKeywords.some(keyword => 
        text === keyword || text.startsWith(keyword + ' ') || text.endsWith(' ' + keyword)
      );
      const hasEmailKeyword = emailKeywords.some(keyword => 
        text === keyword || text.startsWith(keyword + ' ') || text.endsWith(' ' + keyword)
      );
      
      if (hasNameKeyword) {
        const x = item.transform[4];
        const y = item.transform[5];
        
        const isTooClose = Array.from(foundPositions).some(pos => {
          const [px, py] = pos.split(',').map(Number);
          const distance = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));
          return distance < MIN_DISTANCE;
        });
        
        if (!isTooClose) {
          const isInReasonableArea = y > 50 && y < viewport.height - 50;
          
          if (isInReasonableArea) {
            foundPositions.add(`${x},${y}`);
            areas.push({
              page: pageNum,
              x: x,
              y: y + 20,
              width: 200,
              height: 40,
              confidence: 0.7,
              reason: `Found name keyword: "${item.str}"`,
              fieldType: 'name'
            });
          }
        }
      }
      
      if (hasEmailKeyword) {
        const x = item.transform[4];
        const y = item.transform[5];
        
        const isTooClose = Array.from(foundPositions).some(pos => {
          const [px, py] = pos.split(',').map(Number);
          const distance = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));
          return distance < MIN_DISTANCE;
        });
        
        if (!isTooClose) {
          const isInReasonableArea = y > 50 && y < viewport.height - 50;
          
          if (isInReasonableArea) {
            foundPositions.add(`${x},${y}`);
            areas.push({
              page: pageNum,
              x: x,
              y: y + 20,
              width: 250,
              height: 40,
              confidence: 0.7,
              reason: `Found email keyword: "${item.str}"`,
              fieldType: 'email'
            });
          }
        }
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

  /**
   * Analyze PDF using Python script (optional fallback/alternative)
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} - Suggested field placements
   */
  async analyzePDFWithPython(pdfBuffer, options = {}) {
    const { spawn } = require('child_process');
    const fs = require('fs').promises;
    const path = require('path');
    const os = require('os');

    try {
      // Create temporary file for PDF
      const tempDir = os.tmpdir();
      const tempPdfPath = path.join(tempDir, `pdf_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`);
      const tempJsonPath = path.join(tempDir, `result_${Date.now()}_${Math.random().toString(36).substring(7)}.json`);

      // Write PDF buffer to temp file
      await fs.writeFile(tempPdfPath, pdfBuffer);

      // Get Python script path
      const scriptPath = path.join(__dirname, '..', 'scripts', 'pdf_analyzer.py');

      // Check if Python script exists
      try {
        await fs.access(scriptPath);
      } catch (error) {
        throw new Error(`Python script not found at ${scriptPath}`);
      }

      return new Promise((resolve, reject) => {
        // Spawn Python process
        const pythonProcess = spawn('python3', [
          scriptPath,
          tempPdfPath,
          '--output',
          tempJsonPath,
          ...(process.env.OPENAI_API_KEY ? [] : ['--no-ai'])
        ], {
          env: {
            ...process.env,
            OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
            OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini'
          }
        });

        let stderr = '';

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pythonProcess.on('close', async (code) => {
          try {
            // Clean up temp PDF file
            try {
              await fs.unlink(tempPdfPath);
            } catch (e) {
              // Ignore cleanup errors
            }

            if (code !== 0) {
              // Clean up temp JSON file if it exists
              try {
                await fs.unlink(tempJsonPath);
              } catch (e) {
                // Ignore cleanup errors
              }
              reject(new Error(`Python script exited with code ${code}: ${stderr}`));
              return;
            }

            // Read result JSON
            try {
              const resultJson = await fs.readFile(tempJsonPath, 'utf8');
              const result = JSON.parse(resultJson);

              // Clean up temp JSON file
              await fs.unlink(tempJsonPath);

              // Convert Python result format to Node.js format
              if (result.success && result.suggestions) {
                // Generate heatmap data
                const heatmapData = result.suggestions.map((suggestion) => {
                  // Find page data to get viewport dimensions
                  // We'll need to estimate or use default dimensions
                  const defaultWidth = 612;
                  const defaultHeight = 792;

                  return {
                    page: suggestion.page,
                    x: suggestion.x / defaultWidth, // Normalize to 0-1
                    y: suggestion.y / defaultHeight, // Normalize to 0-1
                    width: (suggestion.width || 150) / defaultWidth,
                    height: (suggestion.height || 50) / defaultHeight,
                    type: suggestion.type,
                    confidence: suggestion.confidence || 0.7,
                    reason: suggestion.reason
                  };
                });

                resolve({
                  success: true,
                  suggestions: result.suggestions,
                  heatmapData,
                  totalPages: result.totalPages || 1
                });
              } else {
                resolve({
                  success: false,
                  error: result.error || 'Unknown error from Python script',
                  suggestions: [],
                  heatmapData: []
                });
              }
            } catch (parseError) {
              // Clean up temp JSON file
              try {
                await fs.unlink(tempJsonPath);
              } catch (e) {
                // Ignore cleanup errors
              }
              reject(new Error(`Failed to parse Python script output: ${parseError.message}`));
            }
          } catch (error) {
            reject(error);
          }
        });

        pythonProcess.on('error', async (error) => {
          // Clean up temp files
          try {
            await fs.unlink(tempPdfPath);
            await fs.unlink(tempJsonPath);
          } catch (e) {
            // Ignore cleanup errors
          }
          reject(new Error(`Failed to spawn Python process: ${error.message}. Make sure Python 3 is installed and pdf_analyzer.py dependencies are installed.`));
        });
      });
    } catch (error) {
      throw new Error(`Python analyzer error: ${error.message}`);
    }
  }
}

module.exports = new CoPilotService();

