const { ChatOpenAI } = require('@langchain/openai');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { z } = require('zod');


const SUPPORTED_FIELD_TYPES = new Set([
  'signature',
  'text',
  'email',
  'number',
  'id',
  'dropdown',
  'input',
  'checkbox',
  'phone',
  'stamp',
  'name',
  'company',
  'title',
  'date',
  'initial'
]);

function normalizeFieldType(type) {
  if (!type || typeof type !== 'string') return 'text';
  const lower = type.toLowerCase();
  return SUPPORTED_FIELD_TYPES.has(lower) ? lower : 'text';
}
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
      mode = 'normal', 
      fieldTypes = [] 
    } = context;

    const isFormBuilder = !documents || documents.length === 0;
    
    const PDFFieldPlacementSchema = z.object({
      fields: z.array(z.object({
        type: z.enum(['signature', 'text', 'email', 'name', 'date', 'initial', 'company', 'title', 'phone', 'checkbox', 'dropdown']),
        recipientId: z.string().nullable().optional(),
        slotId: z.string().nullable().optional(),
        page: z.number().int().positive(),
        position: z.enum(['top-left', 'top-center', 'top-right', 'middle-left', 'middle-center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right', 'custom']),
        x: z.number().optional(), 
        y: z.number().optional(),
        width: z.number().optional(), 
        height: z.number().optional(), 
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

      if (isFormBuilder) {
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

    if (usePythonAnalyzer) {
      try {
        const pythonResult = await this.analyzePDFWithPython(pdfBuffer, options);
        if (pythonResult && pythonResult.success && pythonResult.suggestions?.length > 0) {
          console.log(`Python analyzer found ${pythonResult.suggestions.length} field suggestions`);
          return pythonResult;
        }
        console.log('Python analyzer returned no results, falling back to Node.js');
      } catch (pythonError) {
        console.warn('Python analyzer failed, falling back to Node.js:', pythonError.message);
      }
    }

    try {
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

      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const allSuggestions = [];
      const pageTexts = [];

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        
        const textContent = await page.getTextContent();
        const textItems = textContent.items;
        
        const pageText = textItems.map(item => item.str).join(' ');
        pageTexts.push({
          pageNum,
          text: pageText,
          textItems,
          viewport
        });
      }

      let aiSuggestions = [];
      try {
        aiSuggestions = await this.analyzePDFWithAI(pageTexts, fieldTypes);
      } catch (aiError) {
        console.warn('AI analysis failed, falling back to heuristics:', aiError.message);
      }
      
      for (const pageData of pageTexts) {
        const { pageNum, textItems, viewport } = pageData;
        
        const signatureAreas = this.findSignatureAreas(textItems, viewport, pageNum);
        const dateAreas = this.findDateAreas(textItems, viewport, pageNum);
        const nameAreas = this.findNameAreas(textItems, viewport, pageNum);
        const blankLineAreas = this.findBlankLineAreas(textItems, viewport, pageNum);
        const underlineAreas = this.findUnderlineAreas(textItems, viewport, pageNum);

        const heuristicSuggestions = [
          ...signatureAreas,
          ...dateAreas,
          ...nameAreas,
          ...blankLineAreas,
          ...underlineAreas
        ];

        const mergedSuggestions = this.mergeAndDeduplicateSuggestions(
          aiSuggestions.filter(s => s.page === pageNum),
          heuristicSuggestions,
          viewport
        );

        allSuggestions.push(...mergedSuggestions);
      }

      const finalSuggestions = this.deduplicateSuggestions(allSuggestions, minConfidence)
        .map(s => ({
          ...s,
          type: normalizeFieldType(s.type)
        }));
      
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

    const pagesContext = pageTexts.map((p, idx) => 
      `Page ${p.pageNum}:\n${p.text.substring(0, 2000)}${p.text.length > 2000 ? '...' : ''}`
    ).join('\n\n---\n\n');

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are an expert at analyzing PDF documents to identify where form fields should be placed.

Your task is to analyze the PDF text and suggest form fields based on document content, labels, blank spaces, and underlines.

IMPORTANT RULES:
1. Look for field labels like "Signature:", "Date:", "Name:", "Email:", etc.
2. Detect blank lines and empty spaces that indicate where fields should be placed
3. Identify underlines (lines of underscores, dashes) that mark field areas
4. Look for patterns like "Signature: ___________" or "Date: _____"
5. If you see a label followed by blank space or underline, suggest a field there
6. For signature fields, look for "signature", "sign here", "signature line", or blank lines near the bottom
7. For date fields, look for "date", "dated", or blank spaces after date labels
8. For name/email fields, look for corresponding labels with blank spaces or underlines
9. Suggest text fields for blank lines that don't have specific labels
10. Position fields accurately based on where labels and underlines appear

FIELD TYPES TO LOOK FOR:
- signature: Where "signature", "sign here", "signature line" appears, or blank lines at bottom
- date: Where "date", "dated", "date signed" appears with blank space/underline
- name: Where "name", "printed name", "full name" appears with blank space/underline
- email: Where "email", "email address" appears with blank space/underline
- text: Blank lines or empty spaces without specific labels

Return suggestions with:
- Normalized coordinates (0-1) for x and y based on actual label/underline positions
- Confidence score (0.6-1.0) - higher for labels with underlines, lower for blank lines alone
- A clear reason explaining why this field was suggested (e.g., "Found signature label with underline")
- Context showing the surrounding text that led to this suggestion

Be thorough - detect all fields including those with blank lines and underlines.`],
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
      
      return parsed.suggestions.map(suggestion => {
        const pageData = pageTexts.find(p => p.pageNum === suggestion.page);
        const viewport = pageData?.viewport || { width: 612, height: 792 };
        
        return {
          page: suggestion.page,
          x: suggestion.x * viewport.width,
          y: suggestion.y * viewport.height,
          width: suggestion.width || 150,
          height: suggestion.height || 50,
          type: normalizeFieldType(suggestion.type),
          confidence: suggestion.confidence,
          reason: suggestion.reason,
          context: suggestion.context
        };
      });
    } catch (error) {
      console.error('Error in AI analysis, falling back to heuristics:', error);
      return []; 
    }
  }

  mergeAndDeduplicateSuggestions(aiSuggestions, heuristicSuggestions, viewport) {
    const merged = [...aiSuggestions];
    
    for (const heuristic of heuristicSuggestions) {
      const isDuplicate = aiSuggestions.some(ai => 
        this.areSuggestionsClose(ai, heuristic, viewport)
      );
      
      if (!isDuplicate) {
        merged.push({
          ...heuristic,
          confidence: heuristic.confidence * 0.8
        });
      }
    }
    
    return merged;
  }

  areSuggestionsClose(s1, s2, viewport) {
    if (s1.page !== s2.page || s1.type !== s2.type) return false;
    
    const distance = Math.sqrt(
      Math.pow(s1.x - s2.x, 2) + Math.pow(s1.y - s2.y, 2)
    );
    
    return distance < 100; 
  }

  deduplicateSuggestions(suggestions, minConfidence) {
    const filtered = suggestions.filter(s => s.confidence >= minConfidence);
    const deduplicated = [];
    const processed = new Set();
    
   
    filtered.sort((a, b) => b.confidence - a.confidence);
    
    for (let i = 0; i < filtered.length; i++) {
      if (processed.has(i)) continue;
      
      const current = filtered[i];
      deduplicated.push(current);
      processed.add(i);
      
      for (let j = i + 1; j < filtered.length; j++) {
        if (processed.has(j)) continue;
        
        const other = filtered[j];
        if (current.page === other.page && current.type === other.type) {
          const distance = Math.sqrt(
            Math.pow(current.x - other.x, 2) + Math.pow(current.y - other.y, 2)
          );
          
          if (distance < 100) {
            processed.add(j);
          }
        }
      }
    }
    
    return deduplicated;
  }

  findSignatureAreas(textItems, viewport, pageNum) {
    const areas = [];
    const signatureKeywords = [
      'signature:', 'sign here', 'signature line', 'signature of',
      'signature block', 'signature field', 'signature required',
      'signature', 'sign', 'signed by', 'signer'
    ];
    
    const foundPositions = new Set();
    const MIN_DISTANCE = 150; 
    
    textItems.forEach((item, index) => {
      const text = item.str.toLowerCase().trim();
      const hasSignatureKeyword = signatureKeywords.some(keyword => 
        text === keyword || text.startsWith(keyword + ' ') || text.endsWith(' ' + keyword) ||
        text.includes(keyword)
      );
      
      if (hasSignatureKeyword) {
        const x = item.transform[4];
        const y = item.transform[5];
        const itemWidth = item.width || 0;
        
        // Look for underline or blank space after the label
        const fieldPosition = this.findFieldPositionAfterLabel(textItems, index, x, y, itemWidth, viewport);
        
        const isTooClose = Array.from(foundPositions).some(pos => {
          const [px, py] = pos.split(',').map(Number);
          const distance = Math.sqrt(Math.pow(fieldPosition.x - px, 2) + Math.pow(fieldPosition.y - py, 2));
          return distance < MIN_DISTANCE;
        });
        
        if (!isTooClose) {
          const isInReasonableArea = fieldPosition.y > 50 && fieldPosition.y < viewport.height - 50;
          
          if (isInReasonableArea) {
            foundPositions.add(`${fieldPosition.x},${fieldPosition.y}`);
            areas.push({
              page: pageNum,
              x: fieldPosition.x,
              y: fieldPosition.y, 
              width: fieldPosition.width || 150,
              height: fieldPosition.height || 50,
              type: 'signature',
              confidence: fieldPosition.confidence || 0.8,
              reason: `Found signature keyword: "${item.str}"${fieldPosition.hasUnderline ? ' with underline' : ''}`
            });
          }
        }
      }
    });

    return areas;
  }

  findDateAreas(textItems, viewport, pageNum) {
    const areas = [];
    const dateKeywords = [
      'date:', 'date signed', 'signature date', 'execution date',
      'dated:', 'date of signature', 'date'
    ];
    
    const foundPositions = new Set();
    const MIN_DISTANCE = 100;
    
    textItems.forEach((item, index) => {
      const text = item.str.toLowerCase().trim();
      const hasDateKeyword = dateKeywords.some(keyword => 
        text === keyword || text.startsWith(keyword + ' ') || text.endsWith(' ' + keyword) ||
        text.includes(keyword)
      );
      
      if (hasDateKeyword) {
        const x = item.transform[4];
        const y = item.transform[5];
        const itemWidth = item.width || 0;
        
        // Look for underline or blank space after the label
        const fieldPosition = this.findFieldPositionAfterLabel(textItems, index, x, y, itemWidth, viewport);
        
        const isTooClose = Array.from(foundPositions).some(pos => {
          const [px, py] = pos.split(',').map(Number);
          const distance = Math.sqrt(Math.pow(fieldPosition.x - px, 2) + Math.pow(fieldPosition.y - py, 2));
          return distance < MIN_DISTANCE;
        });
        
        if (!isTooClose) {
          const isInReasonableArea = fieldPosition.y > 50 && fieldPosition.y < viewport.height - 50;
          
          if (isInReasonableArea) {
            foundPositions.add(`${fieldPosition.x},${fieldPosition.y}`);
            areas.push({
              page: pageNum,
              x: fieldPosition.x,
              y: fieldPosition.y,
              width: fieldPosition.width || 120,
              height: fieldPosition.height || 40,
              type: 'date',
              confidence: fieldPosition.confidence || 0.75,
              reason: `Found date keyword: "${item.str}"${fieldPosition.hasUnderline ? ' with underline' : ''}`
            });
          }
        }
      }
    });

    return areas;
  }

  findNameAreas(textItems, viewport, pageNum) {
    const areas = [];
    const nameKeywords = [
      'name:', 'full name', 'printed name', 'name of signer',
      'signer name', 'your name', 'signer\'s name', 'name'
    ];
    const emailKeywords = [
      'email:', 'e-mail:', 'email address', 'e-mail address',
      'your email', 'email address:', 'email'
    ];
    
    const foundPositions = new Set();
    const MIN_DISTANCE = 100;
    
    textItems.forEach((item, index) => {
      const text = item.str.toLowerCase().trim();
      const hasNameKeyword = nameKeywords.some(keyword => 
        text === keyword || text.startsWith(keyword + ' ') || text.endsWith(' ' + keyword) ||
        text.includes(keyword)
      );
      const hasEmailKeyword = emailKeywords.some(keyword => 
        text === keyword || text.startsWith(keyword + ' ') || text.endsWith(' ' + keyword) ||
        text.includes(keyword)
      );
      
      if (hasNameKeyword) {
        const x = item.transform[4];
        const y = item.transform[5];
        const itemWidth = item.width || 0;
        
        // Look for underline or blank space after the label
        const fieldPosition = this.findFieldPositionAfterLabel(textItems, index, x, y, itemWidth, viewport);
        
        const isTooClose = Array.from(foundPositions).some(pos => {
          const [px, py] = pos.split(',').map(Number);
          const distance = Math.sqrt(Math.pow(fieldPosition.x - px, 2) + Math.pow(fieldPosition.y - py, 2));
          return distance < MIN_DISTANCE;
        });
        
        if (!isTooClose) {
          const isInReasonableArea = fieldPosition.y > 50 && fieldPosition.y < viewport.height - 50;
          
          if (isInReasonableArea) {
            foundPositions.add(`${fieldPosition.x},${fieldPosition.y}`);
            areas.push({
              page: pageNum,
              x: fieldPosition.x,
              y: fieldPosition.y,
              width: fieldPosition.width || 200,
              height: fieldPosition.height || 40,
              type: 'name',
              confidence: fieldPosition.confidence || 0.7,
              reason: `Found name keyword: "${item.str}"${fieldPosition.hasUnderline ? ' with underline' : ''}`
            });
          }
        }
      }
      
      if (hasEmailKeyword) {
        const x = item.transform[4];
        const y = item.transform[5];
        const itemWidth = item.width || 0;
        
        // Look for underline or blank space after the label
        const fieldPosition = this.findFieldPositionAfterLabel(textItems, index, x, y, itemWidth, viewport);
        
        const isTooClose = Array.from(foundPositions).some(pos => {
          const [px, py] = pos.split(',').map(Number);
          const distance = Math.sqrt(Math.pow(fieldPosition.x - px, 2) + Math.pow(fieldPosition.y - py, 2));
          return distance < MIN_DISTANCE;
        });
        
        if (!isTooClose) {
          const isInReasonableArea = fieldPosition.y > 50 && fieldPosition.y < viewport.height - 50;
          
          if (isInReasonableArea) {
            foundPositions.add(`${fieldPosition.x},${fieldPosition.y}`);
            areas.push({
              page: pageNum,
              x: fieldPosition.x,
              y: fieldPosition.y,
              width: fieldPosition.width || 250,
              height: fieldPosition.height || 40,
              type: 'email',
              confidence: fieldPosition.confidence || 0.7,
              reason: `Found email keyword: "${item.str}"${fieldPosition.hasUnderline ? ' with underline' : ''}`
            });
          }
        }
      }
    });

    return areas;
  }

  /**
   * Find field position after a label by looking for underlines or blank spaces
   */
  findFieldPositionAfterLabel(textItems, labelIndex, labelX, labelY, labelWidth, viewport) {
    const result = {
      x: labelX + labelWidth + 10,
      y: labelY + 5,
      width: 150,
      height: 40,
      confidence: 0.7,
      hasUnderline: false
    };

    // Look for items after the label (within reasonable distance)
    for (let i = labelIndex + 1; i < Math.min(labelIndex + 20, textItems.length); i++) {
      const item = textItems[i];
      const itemX = item.transform[4];
      const itemY = item.transform[5];
      const itemText = item.str.trim();
      
      // Check if item is on the same line (within 15 pixels vertically)
      if (Math.abs(itemY - labelY) < 15) {
        // Check if it's to the right of the label
        if (itemX > labelX + labelWidth) {
          // Check if it's an underline (underscores, dashes, dots)
          if (itemText.length > 3 && /^[_\-\s\.]+$/.test(itemText)) {
            result.x = itemX;
            result.y = itemY;
            result.width = Math.min(item.width || 150, 300);
            result.height = 40;
            result.confidence = 0.85;
            result.hasUnderline = true;
            return result;
          }
          
          // If there's a gap (blank space), use that position
          const gap = itemX - (labelX + labelWidth);
          if (gap > 20 && gap < 100) {
            result.x = labelX + labelWidth + 10;
            result.y = labelY + 5;
            result.width = Math.min(gap - 10, 200);
            result.confidence = 0.75;
            return result;
          }
        }
      }
      
      // Check if item is below the label (potential field area)
      if (itemY > labelY + 10 && itemY < labelY + 50 && Math.abs(itemX - labelX) < 50) {
        // If it's blank or just underscores, this might be the field
        if (itemText.length === 0 || /^[_\-\s]+$/.test(itemText)) {
          result.x = labelX;
          result.y = itemY;
          result.width = 200;
          result.height = 40;
          result.confidence = 0.8;
          result.hasUnderline = itemText.length > 0;
          return result;
        }
      }
    }
    
    // Default: position to the right of label
    return result;
  }

  /**
   * Find blank lines and empty spaces that could be text fields
   */
  findBlankLineAreas(textItems, viewport, pageNum) {
    const areas = [];
    const foundPositions = new Set();
    const MIN_DISTANCE = 100;
    const BLANK_LINE_THRESHOLD = 30; // Minimum gap to consider it a blank line
    
    // Sort text items by Y position
    const sortedItems = [...textItems].sort((a, b) => {
      const yA = a.transform[5];
      const yB = b.transform[5];
      if (Math.abs(yA - yB) < 10) {
        // Same line, sort by X
        return a.transform[4] - b.transform[4];
      }
      return yA - yB;
    });
    
    // Look for gaps between text items that suggest blank lines
    for (let i = 0; i < sortedItems.length - 1; i++) {
      const current = sortedItems[i];
      const next = sortedItems[i + 1];
      
      const currentY = current.transform[5];
      const nextY = next.transform[5];
      const currentX = current.transform[4];
      const nextX = next.transform[4];
      
      // Check for vertical gap (blank line)
      const verticalGap = nextY - currentY;
      if (verticalGap > BLANK_LINE_THRESHOLD && verticalGap < 100) {
        // Check if items are in similar X position (same column)
        if (Math.abs(currentX - nextX) < 50) {
          const blankY = currentY + (verticalGap / 2);
          const blankX = currentX;
          
          // Check if this area is reasonable and not too close to other fields
          const isTooClose = Array.from(foundPositions).some(pos => {
            const [px, py] = pos.split(',').map(Number);
            const distance = Math.sqrt(Math.pow(blankX - px, 2) + Math.pow(blankY - py, 2));
            return distance < MIN_DISTANCE;
          });
          
          if (!isTooClose && blankY > 50 && blankY < viewport.height - 50) {
            foundPositions.add(`${blankX},${blankY}`);
            areas.push({
              page: pageNum,
              x: blankX,
              y: blankY,
              width: 200,
              height: 30,
              type: 'text',
              confidence: 0.65,
              reason: 'Found blank line/empty space'
            });
          }
        }
      }
      
      // Check for horizontal gap (blank space on same line)
      if (Math.abs(currentY - nextY) < 10) {
        const horizontalGap = nextX - (currentX + (current.width || 0));
        if (horizontalGap > 50 && horizontalGap < 300) {
          const blankX = currentX + (current.width || 0) + 5;
          const blankY = currentY;
          
          const isTooClose = Array.from(foundPositions).some(pos => {
            const [px, py] = pos.split(',').map(Number);
            const distance = Math.sqrt(Math.pow(blankX - px, 2) + Math.pow(blankY - py, 2));
            return distance < MIN_DISTANCE;
          });
          
          if (!isTooClose && blankY > 50 && blankY < viewport.height - 50) {
            foundPositions.add(`${blankX},${blankY}`);
            areas.push({
              page: pageNum,
              x: blankX,
              y: blankY,
              width: Math.min(horizontalGap - 10, 250),
              height: 30,
              type: 'text',
              confidence: 0.6,
              reason: 'Found blank space on line'
            });
          }
        }
      }
    }
    
    return areas;
  }

  /**
   * Find underlines (lines of underscores, dashes) that indicate field areas
   */
  findUnderlineAreas(textItems, viewport, pageNum) {
    const areas = [];
    const foundPositions = new Set();
    const MIN_DISTANCE = 100;
    
    textItems.forEach((item, index) => {
      const text = item.str.trim();
      
      // Check if item is an underline (underscores, dashes, dots)
      if (text.length > 5 && /^[_\-\s\.]+$/.test(text)) {
        const x = item.transform[4];
        const y = item.transform[5];
        const width = item.width || 150;
        
        // Look for label before this underline
        let fieldType = 'text';
        let labelFound = false;
        
        // Check previous items for labels
        for (let i = Math.max(0, index - 10); i < index; i++) {
          const prevItem = textItems[i];
          const prevText = prevItem.str.toLowerCase().trim();
          const prevY = prevItem.transform[5];
          
          // Check if previous item is on same line or slightly above
          if (Math.abs(prevY - y) < 20 && prevItem.transform[4] < x) {
            if (prevText.includes('signature') || prevText.includes('sign')) {
              fieldType = 'signature';
              labelFound = true;
              break;
            } else if (prevText.includes('date') || prevText.includes('dated')) {
              fieldType = 'date';
              labelFound = true;
              break;
            } else if (prevText.includes('name')) {
              fieldType = 'name';
              labelFound = true;
              break;
            } else if (prevText.includes('email')) {
              fieldType = 'email';
              labelFound = true;
              break;
            }
          }
        }
        
        const isTooClose = Array.from(foundPositions).some(pos => {
          const [px, py] = pos.split(',').map(Number);
          const distance = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));
          return distance < MIN_DISTANCE;
        });
        
        if (!isTooClose && y > 50 && y < viewport.height - 50) {
          foundPositions.add(`${x},${y}`);
          areas.push({
            page: pageNum,
            x: x,
            y: y,
            width: Math.max(width, 150),
            height: 40,
            type: fieldType,
            confidence: labelFound ? 0.85 : 0.7,
            reason: labelFound ? `Found underline with ${fieldType} label` : 'Found underline/field indicator'
          });
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

  positionToCoordinates(position, page) {
    const defaultWidth = 612;
    const defaultHeight = 792; 

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

  inferCoordinatesFromPosition(positionString, page) {
    const defaultWidth = 612;
    const defaultHeight = 792;
    
    const lower = positionString.toLowerCase();
    
    if (lower.includes('left')) {
      if (lower.includes('top')) return { x: 50, y: 50 };
      if (lower.includes('bottom')) return { x: 50, y: defaultHeight - 100 };
      if (lower.includes('middle') || lower.includes('center')) return { x: 50, y: defaultHeight / 2 };
      return { x: 50, y: defaultHeight - 100 };
    }
    if (lower.includes('right')) {
      if (lower.includes('top')) return { x: defaultWidth - 200, y: 50 };
      if (lower.includes('bottom')) return { x: defaultWidth - 200, y: defaultHeight - 100 };
      if (lower.includes('middle') || lower.includes('center')) return { x: defaultWidth - 200, y: defaultHeight / 2 };
      return { x: defaultWidth - 200, y: defaultHeight - 100 };
    }
    if (lower.includes('center') || lower.includes('middle')) {
      if (lower.includes('top')) return { x: defaultWidth / 2 - 75, y: 50 };
      if (lower.includes('bottom')) return { x: defaultWidth / 2 - 75, y: defaultHeight - 100 };
      return { x: defaultWidth / 2 - 75, y: defaultHeight / 2 }; 
    }
    if (lower.includes('top')) {
      return { x: defaultWidth / 2 - 75, y: 50 };
    }
    if (lower.includes('bottom')) {
      return { x: defaultWidth / 2 - 75, y: defaultHeight - 100 }; 
    }
    
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
      const tempDir = os.tmpdir();
      const tempPdfPath = path.join(tempDir, `pdf_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`);
      const tempJsonPath = path.join(tempDir, `result_${Date.now()}_${Math.random().toString(36).substring(7)}.json`);

      await fs.writeFile(tempPdfPath, pdfBuffer);

      let scriptPath = path.join(__dirname, '..', 'scripts', 'pdf_field_detector.py');
      try {
        await fs.access(scriptPath);
      } catch (error) {
        scriptPath = path.join(__dirname, '..', 'scripts', 'pdf_analyzer.py');
      }

      try {
        await fs.access(scriptPath);
      } catch (error) {
        throw new Error(`Python script not found at ${scriptPath}`);
      }

      return new Promise((resolve, reject) => {
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
        const pythonProcess = spawn(pythonCmd, [
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
            try {
              await fs.unlink(tempPdfPath);
            } catch (e) {
            }

            if (code !== 0) {
              try {
                await fs.unlink(tempJsonPath);
              } catch (e) {
              }
              reject(new Error(`Python script exited with code ${code}: ${stderr}`));
              return;
            }

            try {
              const resultJson = await fs.readFile(tempJsonPath, 'utf8');
              const result = JSON.parse(resultJson);

              await fs.unlink(tempJsonPath);

              if (result.success && result.suggestions) {
                const normalizedSuggestions = result.suggestions.map((s) => ({
                  ...s,
                  type: normalizeFieldType(s.type)
                }));

                const heatmapData = normalizedSuggestions.map((suggestion) => {
               
                  const defaultWidth = 612;
                  const defaultHeight = 792;

                  return {
                    page: suggestion.page,
                    x: suggestion.x / defaultWidth,
                    y: suggestion.y / defaultHeight,
                    width: (suggestion.width || 150) / defaultWidth,
                    height: (suggestion.height || 50) / defaultHeight,
                    type: suggestion.type,
                    confidence: suggestion.confidence || 0.7,
                    reason: suggestion.reason
                  };
                });

                resolve({
                  success: true,
                  suggestions: normalizedSuggestions,
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
              try {
                await fs.unlink(tempJsonPath);
              } catch (e) {
              }
              reject(new Error(`Failed to parse Python script output: ${parseError.message}`));
            }
          } catch (error) {
            reject(error);
          }
        });

        pythonProcess.on('error', async (error) => {
         
          try {
            await fs.unlink(tempPdfPath);
            await fs.unlink(tempJsonPath);
          } catch (e) {
            
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

