const { ChatOpenAI } = require('@langchain/openai');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const { z } = require('zod');
const fs = require('fs');
const path = require('path');
const { ActionResponseSchema } = require('../schemas/actionSchemas');

class LLMServiceLangChain {
  constructor() {
    this.model = new ChatOpenAI({
      modelName: process.env.AI_MODEL || 'gpt-4o-mini',
      temperature: 0.3,
      openAIApiKey: process.env.OPENAI_API_KEY
    });
    
    this.knowledgeBase = this.loadKnowledgeBase();
    this.parser = StructuredOutputParser.fromZodSchema(ActionResponseSchema);
    this.prompt = this.buildPrompt();
    this.chain = this.buildChain();
  }

  loadKnowledgeBase() {
    try {
      const possiblePaths = [
        path.join(__dirname, '../../../knowledge-base.json'),
        path.join(__dirname, '../../knowledge-base.json'),
        path.join(process.cwd(), 'knowledge-base.json'),
        '/app/knowledge-base.json'
      ];
      
      for (const kbPath of possiblePaths) {
        try {
          if (fs.existsSync(kbPath)) {
            const kbData = fs.readFileSync(kbPath, 'utf8');
            return JSON.parse(kbData);
          }
        } catch (err) {
          continue;
        }
      }
      
      console.warn('Knowledge base file not found. Using empty knowledge base.');
      return {};
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      return {};
    }
  }

  buildPrompt(learnedExamples = [], recipientMappings = []) {
    const kb = this.knowledgeBase;
    let formatInstructions;
    try {
      formatInstructions = this.parser.getFormatInstructions();
    } catch (error) {
      console.warn('Could not get format instructions, using default:', error.message);
      formatInstructions = 'You must respond with valid JSON matching the action schema.';
    }
    
    // Escape any curly braces in formatInstructions and knowledge base to avoid template conflicts
    const escapedFormatInstructions = formatInstructions.replace(/\{/g, '{{').replace(/\}/g, '}}');
    const kbString = JSON.stringify(kb, null, 2).replace(/\{/g, '{{').replace(/\}/g, '}}');
    
    // Build learned examples section if available
    let learnedExamplesSection = '';
    if (learnedExamples && learnedExamples.length > 0) {
      learnedExamplesSection = `\n\nLEARNED PATTERNS FROM USER CORRECTIONS (Use these as examples when similar commands appear):\n`;
      learnedExamples.forEach((example, idx) => {
        learnedExamplesSection += `\nExample ${idx + 1}:\n`;
        learnedExamplesSection += `User Command: "${example.userCommand}"\n`;
        learnedExamplesSection += `AI Attempted: action="${example.aiAction}", parameters=${JSON.stringify(example.aiParameters)}\n`;
        learnedExamplesSection += `Error: ${example.error}\n`;
        learnedExamplesSection += `Correct Approach: action="${example.correctAction}", parameters=${JSON.stringify(example.correctParameters)}\n`;
        if (example.description) {
          learnedExamplesSection += `User's Description: "${example.description}"\n`;
        }
      });
      learnedExamplesSection += `\nWhen you see similar commands, use the "Correct Approach" from these examples instead of making the same mistake.\n`;
    }
    
    // Build recipient mappings section if available
    let recipientMappingsSection = '';
    if (recipientMappings && recipientMappings.length > 0) {
      recipientMappingsSection = `\n\nRECIPIENT NAME-TO-EMAIL MAPPINGS (Use these when user mentions a name without email):\n`;
      recipientMappings.forEach((mapping, idx) => {
        recipientMappingsSection += `- "${mapping.name}" → "${mapping.email}"\n`;
      });
      recipientMappingsSection += `\nIf user mentions a name from the above list (e.g., "send to ${recipientMappings[0]?.name || 'name'}"), use the corresponding email address in the recipients array.\n`;
    }
    
    const systemPrompt = `You are an AI assistant for Documantra, a comprehensive document management and e-signature platform.

Your main job is to understand natural language commands from users and convert them into structured JSON actions that the backend can execute.

AVAILABLE ACTIONS:
1. search_document - Search for documents using vector search and metadata filters
2. send_document - Send a document to recipients via email (simple sharing)
3. prepare_document - Prepare a document with signature fields and other form fields
4. create_and_send_envelope - Create an e-sign envelope, add signature fields, and send to recipients (all-in-one)
   **SCHEDULING SUPPORT**: This action supports scheduling envelopes for future delivery. If user mentions scheduling words like "schedule", "schedule for", "send later", "send on", "send at", "delay", "tomorrow", "next week", etc., extract scheduling information:
   - Set isScheduled: true when scheduling is mentioned
   - Extract date from phrases like "schedule for December 15, 2025" → scheduledDate: "2025-12-15", "tomorrow" → tomorrow's date in YYYY-MM-DD, "on 15/12/2025" → "2025-12-15"
   - Extract time from phrases like "at 2:30 PM" → scheduledTime: "14:30", "at 14:30" → "14:30", "at 2 PM" → "14:00", "in the morning" → "09:00", "in the afternoon" → "14:00", "in the evening" → "18:00"
   - Always convert dates to YYYY-MM-DD format and times to HH:MM format (24-hour)
   - If only date is mentioned without time, set scheduledTime to null
   - Example: "send this document to john@example.com with signature field, schedule for tomorrow at 2 PM" → {{"action": "create_and_send_envelope", "parameters": {{"documentId": null, "recipients": [{{"email": "john@example.com"}}], "signatureFields": [{{"type": "signature", "position": "bottom-right"}}], "isScheduled": true, "scheduledDate": "2025-12-16", "scheduledTime": "14:00"}}, "clarification": null}}
5. list_auth_providers - List available authentication providers (auth methods) for the current user's subscription plan
6. generate_document - Generate a new document using AI (e.g., NDA, contract, agreement) by asking for required details.
   IMPORTANT: When user provides details after being asked (e.g., "two party involved sneha and kiara, effective date 19/12/2025, period 5 months"), 
   you MUST use generate_document action with category and requirements extracted from their message. Extract ALL information provided:
   - Parties: names, entity types, addresses, signatory details
   - Dates: effective dates, signing dates, periods (convert to proper format)
   - Terms: duration, confidentiality period, obligations, exclusions
   - Any other details mentioned
   Put ALL extracted information in the "requirements" field as structured text. If some details are missing, still proceed with generate_document 
   and the system will ask for remaining details.
   SPECIAL CASE: If user says "generate [document] and send it to [email]" or "generate [document]... send to [email]" in a single command,
   extract the email address and set it in the "recipientEmail" parameter. The system will automatically send the document after generation.
   Example: User says "generate NDA for Party A and Party B and send it to john@example.com"
   → {{"action": "generate_document", "parameters": {{"category": "NDA", "requirements": "Party A and Party B details...", "recipientEmail": "john@example.com"}}, "clarification": null}}
7. list_documents_by_category - List documents filtered by category/tags (e.g., only NDA documents)
8. list_shared_documents - List shared documents OR drafted documents. If user says "documents I shared" or "my shared documents", use current user (no recipientEmail needed). If user says "documents shared to [email]", use that email. If user says "drafted documents", "draft envelopes", "documents I drafted", etc., set status: "draft" and recipientEmail: null. Optional date filter (e.g., "today", "yesterday", "2025-11-18"). If user mentions "e-sign", "esign", "e sign", or "envelope", set serviceType to "e-sign". If user mentions "document service" or "documents", set serviceType to "document".
9. list_signed_documents - List documents signed by a specific user on a specific date
10. select_document - Select a document from a previous list by number (e.g., "choose 3rd document")

${escapedFormatInstructions}

CRITICAL JSON FORMAT RULES:
- **YOU MUST ALWAYS RETURN VALID JSON** - Never return plain text, explanations, or markdown.
- **NEVER** return text like "The requirements for..." or "I need..." - Always use the JSON structure.
- If clarification is needed, return: {{"action": null, "parameters": {{}}, "clarification": "Your question here"}}
- If action is identified, return: {{"action": "action_name", "parameters": {{...}}, "clarification": null}}
- **DO NOT** provide explanations outside the JSON structure. Everything must be inside the JSON object.
- If NO file is attached and documentId is missing for send_document, prepare_document, or create_and_send_envelope, set action to null and clarification: "Which document would you like to [action]?"
- If a file IS attached and the user refers to "this document", "this file", set documentId to null and proceed
- If recipient email is missing for send_document or create_and_send_envelope, set action to null and clarification: "What is the recipient's email address?"
- If signature fields are mentioned but no position specified, use default positions (bottom-right for signature fields)
- **CRITICAL FOR CLARIFICATION RESPONSES**: If the previous assistant message asked "where to place the signature field" or "signature field is required", 
  AND the user responds with just position words (e.g., "bottom", "top", "left", "right", "center", "bottom-left", "bottom-right", etc.),
  you MUST interpret this as the user providing signature field placement information. Extract the position and create signatureFields array.
  Examples:
  - User says "bottom" after clarification → {{"action": "create_and_send_envelope", "parameters": {{"signatureFields": [{{"type": "signature", "position": "bottom-right", "page": 1}}]}}, "clarification": null}}
  - User says "bottom left" after clarification → {{"action": "create_and_send_envelope", "parameters": {{"signatureFields": [{{"type": "signature", "position": "bottom-left", "page": 1}}]}}, "clarification": null}}
  - User says "top right page 2" after clarification → {{"action": "create_and_send_envelope", "parameters": {{"signatureFields": [{{"type": "signature", "position": "top-right", "page": 2}}]}}, "clarification": null}}
  Always extract page number if mentioned, default to page 1 if not mentioned.
- When user says "generate [category] file", set action to null and clarification: "Do you want to create a new [category] document or choose from existing [category] documents?"
- If user says "choose existing", use list_documents_by_category action
- If user says "create new one", use generate_document action with category and empty requirements (system will ask for details)
- **IMPORTANT**: If the previous assistant message says "document generated successfully" or "Would you like to send this document", 
  AND the user says "yes send" or "send the generated document" or "send to [email]", 
  you MUST use create_and_send_envelope action (NOT generate_document). The document was already generated and is available.
- **CRITICAL FOR DOCUMENT GENERATION**: 
  * If the previous assistant message was asking for document details (contains "Please provide" or "required details" or "GENERATE DOCUMENT") 
    AND the current user message contains ANY document information (parties, dates, addresses, terms, etc.), 
    you MUST use generate_document action with the category from context and ALL user-provided details in the "requirements" field.
  * DO NOT ask for clarification again if the user has provided ANY details. Extract what they provided and proceed.
  * Examples of details that indicate document generation:
    - "first party is sneha living in noida second party is kiara living in Singapore" → extract parties and addresses
    - "effective date is 26/01/2025" → extract date: 2025-01-26
    - "period 5 months" → extract duration: 5 months
    - Any mention of parties, addresses, dates, periods, terms, etc.
  * If category is not explicitly stated but previous context mentions NDA/Contract/Agreement, use that category.
  * Put ALL extracted information in the "requirements" field as-is (natural language is fine).
- When user selects a document by number, use select_document action
- For list_shared_documents: 
  * **CRITICAL - STATUS EXTRACTION**: If the user query contains ANY of these words/phrases, you MUST set status: "draft":
    - "drafted" (e.g., "documents I drafted", "check documents I drafted")
    - "draft" (e.g., "draft documents", "draft envelopes", "show my draft documents")
    - "drafting" (e.g., "documents I was drafting")
  * If user says "documents I shared", "my shared documents", "how many documents I shared", etc., set recipientEmail to null/omit it (system will use current user). Do NOT set status (defaults to excluding drafts).
  * If user says "drafted documents", "draft envelopes", "documents I drafted", "envelopes I drafted", "check how many documents i drafted", etc., you MUST set status: "draft" and recipientEmail: null (to get current user's drafts).
  * If user mentions a specific recipient email, use that. Do NOT set status unless user specifically asks for drafts.
  * **IMPORTANT DATE EXTRACTION**: You MUST extract ANY date mentioned in the command and include it in the date field. Examples:
    - "today" → date: "today"
    - "yesterday" → date: "yesterday"
    - "18th november 2025" or "18 november 2025" → date: "2025-11-18" (NOT "2025-11" - must include the day!)
    - "november 18, 2025" → date: "2025-11-18"
    - "2025-11-18" → date: "2025-11-18"
    - "on 18th" → extract as "2025-11-18" (assuming current year/month)
  Always convert dates to YYYY-MM-DD format (full date with day, not just month/year). 
  * **SERVICE TYPE**: If user mentions "e-sign", "esign", "e sign", "envelope", or "envelopes", set serviceType to "e-sign" to only return e-sign documents. If user mentions "document service" or just "documents" (without e-sign), set serviceType to "document" to only return document-service documents.
  * **EXAMPLE**: User says "check how many documents i drafted on 18 november 2025" → 
    {{"action": "list_shared_documents", "parameters": {{"recipientEmail": null, "date": "2025-11-18", "status": "draft"}}, "clarification": null}}
- For list_signed_documents, only return documents that are completed/signed on the specified date

PLATFORM CONTEXT:
${kbString}
${learnedExamplesSection}
${recipientMappingsSection}

Always return valid JSON matching the schema. Extract as much information as possible from the user's command.`;

    return ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      new MessagesPlaceholder('history'),
      ['human', '{input}']
    ]);
  }

  buildChain(customPrompt = null) {
    const promptToUse = customPrompt || this.prompt;
    return RunnableSequence.from([
      {
        input: (x) => x.input,
        history: (x) => x.history || []
      },
      promptToUse,
      this.model,
      async (response) => {
        try {
          const parsed = await this.parser.parse(response.content);
          return parsed;
        } catch (error) {
          console.warn('⚠️ LLM returned non-JSON response, converting to structured format');
          console.warn('LLM output (first 200 chars):', response.content.substring(0, 200));
          
          // Remove markdown code blocks if present
          let cleanedContent = response.content;
          cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          
          // Try to extract JSON from response
          try {
            const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              console.log('✅ Successfully extracted JSON from response');
              return parsed;
            }
          } catch (e) {
            // If no JSON found, treat as clarification
            console.log('🔄 Converting plain text to clarification JSON');
            return {
              action: null,
              parameters: {},
              clarification: cleanedContent
            };
          }
          
          // Final fallback: treat entire response as clarification
          return {
            action: null,
            parameters: {},
            clarification: cleanedContent
          };
        }
      }
    ]);
  }

  async processCommand(userCommand, context = {}) {
    try {
      // Get learned examples from context
      const learnedExamples = context.learnedExamples || [];
      // Get recipient mappings from context
      const recipientMappings = context.recipientMappings || [];
      
      // Build history from previous messages
      const history = (context.previousMessages || []).slice(-4).map(msg => {
        if (msg.role === 'user') {
          return ['human', msg.content];
        } else if (msg.role === 'assistant') {
          return ['ai', msg.content];
        }
        return null;
      }).filter(Boolean);

      // Build user message with file info if available
      let userMessage = userCommand;
      if (context.hasFile && context.fileName) {
        userMessage = `[File attached: ${context.fileName} (${context.fileType})]\n\n${userCommand}`;
      }
      
      // If a document was already generated and user provides email, they want to send it, not generate again
      if (context.selectedDocument && context.selectedDocument.envelopeId) {
        const emailPattern = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/;
        const hasEmail = emailPattern.test(userCommand);
        const lowerCommand = userCommand.toLowerCase();
        const hasGenerate = lowerCommand.includes('generate') || lowerCommand.includes('create');
        
        // If user provides email and doesn't explicitly say "generate", they want to send the existing document
        if (hasEmail && !hasGenerate) {
          userMessage = `[User wants to send the already-generated document "${context.selectedDocument.name}" (envelope ID: ${context.selectedDocument.envelopeId}) to recipient. Use create_and_send_envelope action, NOT generate_document.]\n${userMessage}`;
        } else if (hasGenerate) {
          // If user explicitly says "generate", warn that document already exists
          userMessage = `[WARNING: A document "${context.selectedDocument.name}" (envelope ID: ${context.selectedDocument.envelopeId}) was already generated in this conversation. If user wants to send it, use create_and_send_envelope. Only use generate_document if user explicitly wants to create a NEW document.]\n${userMessage}`;
        }
      }
      
      // If in document generation flow, enhance the user command context
      if (context.isInDocumentGenerationFlow && userCommand) {
        // Check if the command contains document details - be more lenient
        const hasDetails = /party|parties|first|second|date|period|duration|effective|confidential|term|obligation|exclusion|signatory|address|entity|living|receiver|sender|name|sneha|kiara|noida|singapore/i.test(userCommand.toLowerCase());
        if (hasDetails) {
          // Prepend context hint to help LLM understand this is document generation details
          userMessage = `[User is providing details for document generation - extract all information and use generate_document action]\n${userMessage}`;
        }
      }
      
      // Also check conversation history for document generation context (fallback)
      const lastAssistantMsg = history.length > 0 && history[history.length - 1]?.[0] === 'ai' 
        ? history[history.length - 1][1] 
        : '';
      const isAskingForDetails = lastAssistantMsg && (
        lastAssistantMsg.includes('Please provide') || 
        lastAssistantMsg.includes('required details') ||
        lastAssistantMsg.includes('GENERATE DOCUMENT')
      );
      
      if (isAskingForDetails && userCommand) {
        const hasDetails = /party|parties|first|second|date|period|duration|effective|confidential|term|obligation|exclusion|signatory|address|entity|living|receiver|sender|name/i.test(userCommand.toLowerCase());
        if (hasDetails) {
          userMessage = `[User is providing details for document generation - extract all information and use generate_document action]\n${userMessage}`;
        }
      }

      // Rebuild chain with learned examples or recipient mappings if available
      let chainToUse = this.chain;
      if (learnedExamples.length > 0 || recipientMappings.length > 0) {
        const promptWithExamples = this.buildPrompt(learnedExamples, recipientMappings);
        chainToUse = this.buildChain(promptWithExamples);
      }
      
      const result = await chainToUse.invoke({
        input: userMessage,
        history: history
      });

      console.log('🤖 LLM result:', JSON.stringify(result, null, 2));
      
      // Ensure date is extracted if mentioned in command
      if (result.action === 'list_shared_documents' && result.parameters) {
        const lowerCommand = userCommand.toLowerCase();
        let extractedDate = null;
        
        if (lowerCommand.includes('today') && !result.parameters.date) {
          extractedDate = 'today';
        } else if (lowerCommand.includes('yesterday') && !result.parameters.date) {
          extractedDate = 'yesterday';
        } else if (!result.parameters.date) {
          // Try to match month/year patterns first (e.g., "month of november", "november 2025", "nov 2025")
          const monthYearPatterns = [
            /month\s+of\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?/i,
            /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
            /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/i
          ];
          
          for (const pattern of monthYearPatterns) {
            const match = userCommand.match(pattern);
            if (match) {
              try {
                const monthName = match[1].toLowerCase();
                const year = match[2] ? parseInt(match[2]) : new Date().getFullYear();
                const monthMap = {
                  'january': 0, 'jan': 0,
                  'february': 1, 'feb': 1,
                  'march': 2, 'mar': 2,
                  'april': 3, 'apr': 3,
                  'may': 4,
                  'june': 5, 'jun': 5,
                  'july': 6, 'jul': 6,
                  'august': 7, 'aug': 7,
                  'september': 8, 'sep': 8,
                  'october': 9, 'oct': 9,
                  'november': 10, 'nov': 10,
                  'december': 11, 'dec': 11
                };
                const monthIndex = monthMap[monthName];
                if (monthIndex !== undefined) {
                  // Format as "YYYY-MM" for month range
                  extractedDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
                  console.log(`📅 Extracted month/year from command: "${match[0]}" -> ${extractedDate}`);
                  break;
                }
              } catch (e) {
                // Continue to next pattern
              }
            }
          }
          
          // If no month/year match, try specific date patterns
          if (!extractedDate) {
            const datePatterns = [
              /(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
              /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
              /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i,
              /(\d{4})-(\d{1,2})-(\d{1,2})/,
              /(\d{1,2})\/(\d{1,2})\/(\d{4})/
            ];
            
            for (const pattern of datePatterns) {
              const match = userCommand.match(pattern);
              if (match) {
                try {
                  let dateStr = match[0];
                  // Convert "16th december 2025" to "16 december 2025"
                  dateStr = dateStr.replace(/(\d+)(st|nd|rd|th)/i, '$1');
                  // Try to parse
                  const parsed = new Date(dateStr);
                  if (!isNaN(parsed.getTime())) {
                    // Convert to YYYY-MM-DD format
                    const year = parsed.getFullYear();
                    const month = String(parsed.getMonth() + 1).padStart(2, '0');
                    const day = String(parsed.getDate()).padStart(2, '0');
                    extractedDate = `${year}-${month}-${day}`;
                    console.log(`📅 Extracted date from command: "${match[0]}" -> ${extractedDate}`);
                    break;
                  }
                } catch (e) {
                  // Continue to next pattern
                }
              }
            }
          }
        }
        
        if (extractedDate) {
          result.parameters.date = extractedDate;
          console.log(`📅 Added missing date: ${extractedDate}`);
        }
      }

      return result;
    } catch (error) {
      console.error('Error processing command with LangChain:', error);
      
      // Handle quota/rate limit errors
      if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
        console.error('OpenAI API quota/rate limit exceeded. Using fallback parser.');
        const fallback = this.fallbackParser(userCommand, context);
        if (fallback.clarification) {
          fallback.clarification = '⚠️ Note: AI processing is temporarily limited. ' + fallback.clarification;
        }
        return fallback;
      }
      
      // Fallback: try to parse basic commands
      return this.fallbackParser(userCommand, context);
    }
  }

  fallbackParser(command, context = {}) {
    // If command looks like a question about requirements, return clarification from context
    if (/what.*require|what.*need|what.*detail|what.*information/i.test(command)) {
      // Check if we're in document generation flow
      if (context.isInDocumentGenerationFlow || context.previousMessages?.some(m => 
        m.role === 'assistant' && (m.content?.includes('Please provide') || m.content?.includes('GENERATE DOCUMENT'))
      )) {
        // Return the previous clarification or a helpful message
        const lastAssistantMsg = context.previousMessages?.filter(m => m.role === 'assistant').pop();
        if (lastAssistantMsg?.content) {
          return {
            action: null,
            parameters: {},
            clarification: lastAssistantMsg.content
          };
        }
      }
    }
    
    const lowerCommand = command.toLowerCase();
    
    // Handle "documents I shared" or "my shared documents"
    if (
      (lowerCommand.includes('shared') || lowerCommand.includes('share')) &&
      (lowerCommand.includes('i ') || lowerCommand.includes('my ') || lowerCommand.includes('how many'))
    ) {
      // Extract date from command - look for "today", "yesterday", or date patterns
      let extractedDate = null;
      if (lowerCommand.includes('today')) {
        extractedDate = 'today';
      } else if (lowerCommand.includes('yesterday')) {
        extractedDate = 'yesterday';
      } else {
        // Try to match date patterns like "2024-01-15" or "Jan 15, 2024"
        const dateMatch = command.match(/(\d{4}-\d{2}-\d{2})|(\d{1,2}\/\d{1,2}\/\d{4})/i);
        if (dateMatch) {
          extractedDate = dateMatch[1] || dateMatch[2];
        }
      }
      
      console.log('📅 Fallback parser extracted date:', extractedDate);
      
      return {
        action: 'list_shared_documents',
        parameters: {
          recipientEmail: undefined, // Will use current user
          date: extractedDate || undefined,
          limit: 100
        },
        clarification: null
      };
    }
    
    // Simple keyword-based fallback
    if (
      lowerCommand.includes('auth provider') ||
      lowerCommand.includes('authentication provider') ||
      lowerCommand.includes('auth providers') ||
      lowerCommand.includes('authentication methods') ||
      lowerCommand.includes('auth methods')
    ) {
      return {
        action: 'list_auth_providers',
        parameters: {},
        clarification: null
      };
    }

    // Search documents
    if (lowerCommand.includes('search') || lowerCommand.includes('find') || lowerCommand.includes('look')) {
      return {
        action: 'search_document',
        parameters: {
          query: command
        },
        clarification: null
      };
    }
    
    // Send document
    if (lowerCommand.includes('send') || lowerCommand.includes('email')) {
      const emailPattern = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;
      const emails = command.match(emailPattern) || [];
      const documentIdMatch = command.match(/\b([a-f0-9]{24})\b/i);
      
      const recipients = emails.map((email, index) => ({
        email: email,
        name: email.split('@')[0]
      }));
      
      return {
        action: 'send_document',
        parameters: {
          documentId: documentIdMatch ? documentIdMatch[1] : null,
          recipients: recipients
        },
        clarification: recipients.length === 0 
          ? 'Who should receive this document? Please provide recipient email address(es).'
          : (documentIdMatch ? null : 'Which document would you like to send? Please provide the document ID or attach a file.')
      };
    }

    // If in document generation flow and user is asking about requirements, return helpful clarification
    if (context.isInDocumentGenerationFlow || context.previousMessages?.some(m => 
      m.role === 'assistant' && (m.content?.includes('Please provide') || m.content?.includes('GENERATE DOCUMENT'))
    )) {
      const lastAssistantMsg = context.previousMessages?.filter(m => m.role === 'assistant').pop();
      if (lastAssistantMsg?.content && (lastAssistantMsg.content.includes('Please provide') || lastAssistantMsg.content.includes('GENERATE DOCUMENT'))) {
        return {
          action: null,
          parameters: {},
          clarification: lastAssistantMsg.content
        };
      }
    }
    
    // If in document generation flow and user is asking about requirements, return helpful clarification
    if (context.isInDocumentGenerationFlow || context.previousMessages?.some(m => 
      m.role === 'assistant' && (m.content?.includes('Please provide') || m.content?.includes('GENERATE DOCUMENT'))
    )) {
      const lastAssistantMsg = context.previousMessages?.filter(m => m.role === 'assistant').pop();
      if (lastAssistantMsg?.content && (lastAssistantMsg.content.includes('Please provide') || lastAssistantMsg.content.includes('GENERATE DOCUMENT'))) {
        return {
          action: null,
          parameters: {},
          clarification: lastAssistantMsg.content
        };
      }
    }
    
    return {
      action: null,
      parameters: {},
      clarification: 'I didn\'t understand that command. Please try again.'
    };
  }
}

module.exports = new LLMServiceLangChain();

