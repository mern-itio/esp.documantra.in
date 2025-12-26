const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

class LLMService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.knowledgeBase = this.loadKnowledgeBase();
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
          // Continue to next path
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

  buildSystemPrompt() {
    const kb = this.knowledgeBase;
    return `You are an AI assistant for Draft and Sign, a comprehensive document management and e-signature platform.

Your main job is to understand natural language commands from users and convert them into structured JSON actions that the backend can execute.

AVAILABLE ACTIONS:
1. search_document - Search for documents using vector search and metadata filters
2. send_document - Send a document to recipients via email (simple sharing)
3. prepare_document - Prepare a document with signature fields and other form fields
4. create_and_send_envelope - Create an e-sign envelope, add signature fields, and send to recipients (all-in-one)
5. list_auth_providers - List available authentication providers (auth methods) for the current user's subscription plan
6. generate_document - Generate a new document using AI (e.g., NDA, contract, agreement) by asking for required details
7. list_documents_by_category - List documents filtered by category/tags (e.g., only NDA documents)
8. list_shared_documents - List documents shared to a specific user (only shared documents, not drafted)
9. list_signed_documents - List documents signed by a specific user on a specific date
10. select_document - Select a document from a previous list by number (e.g., "choose 3rd document")

RESPONSE FORMAT:
You must always respond with a JSON object containing:
{
  "action": "search_document" | "send_document" | "prepare_document" | "create_and_send_envelope" | "list_auth_providers" | "generate_document" | "list_documents_by_category" | "list_shared_documents" | "list_signed_documents" | "select_document" | null,
  "parameters": {
    // Action-specific parameters
  },
  "clarification": null | "Short question if information is missing"
}

ACTION SPECIFICATIONS:

1. search_document:
   Extract: recipient name, document title, keywords, category, tags, folder, date range
   Parameters:
   {
     "query": "search text",
     "recipientName": "string or null",
     "recipientEmail": "string or null",
     "documentTitle": "string or null",
     "keywords": ["string"],
     "category": "string or null",
     "tags": ["string"],
     "folderId": "string or null",
     "dateFrom": "ISO date string or null",
     "dateTo": "ISO date string or null"
   }

2. send_document:
   Extract: documentId, recipient name, email, subject, category, message
   Parameters:
   {
     "documentId": "string (required)",
     "recipients": [
       {
         "name": "string",
         "email": "string (required)"
       }
     ],
     "subject": "string",
     "category": "string or null",
     "message": "string or null"
   }

3. prepare_document:
   Extract: documentId, required fields (signature, name, date, text, etc.)
   Parameters:
   {
     "documentId": "string (required)",
     "fields": [
       {
         "type": "signature" | "name" | "date" | "text" | "initial",
         "page": "number",
         "x": "number",
         "y": "number",
         "width": "number",
         "height": "number",
         "recipientId": "string or null"
       }
     ]
   }

4. create_and_send_envelope:
   Use this action when user wants to send a document WITH signature fields in one command.
   This creates an e-sign envelope, adds signature fields, and sends it automatically.
   Extract: documentId, recipients, signature fields, subject, message, scheduling information
   Parameters:
   {
     "documentId": "string (required)",
     "recipients": [
       {
         "name": "string",
         "email": "string (required)",
         "authMethods": ["optional list of authentication method names requested by the user, e.g. \"Email OTP\", \"SMS OTP\""]
       }
     ],
     "signatureFields": [
       {
         "type": "signature" | "name" | "date" | "text" | "initial",
         "page": "number (default: 1)",
         "x": "number (position from left)",
         "y": "number (position from top)",
         "width": "number (default: 150)",
         "height": "number (default: 40)",
         "position": "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center" | null,
         "recipientEmail": "string or null (if specific recipient)",
         "documentIndex": "number (optional, 1-based index of the document within the envelope when multiple documents are attached)"
       }
     ],
     "subject": "string or null",
     "message": "string or null",
     "isScheduled": "boolean (optional, true if user wants to schedule the envelope)",
     "scheduledDate": "string or null (optional, ISO date string or date in YYYY-MM-DD format, e.g., '2025-12-15')",
     "scheduledTime": "string or null (optional, time in HH:MM format, e.g., '14:30' or '02:30 PM')"
   }
   
   SCHEDULING DETECTION:
   - If user mentions scheduling words like "schedule", "schedule for", "send later", "send on", "send at", "delay", "tomorrow", "next week", etc., set isScheduled: true
   - Extract date from phrases like:
     * "schedule for December 15, 2025" → scheduledDate: "2025-12-15"
     * "send on 15th December" → scheduledDate: "2025-12-15" (use current year if not specified)
     * "tomorrow" → scheduledDate: tomorrow's date in YYYY-MM-DD format
     * "next Monday" → scheduledDate: next Monday's date
     * "on 15/12/2025" or "15-12-2025" → scheduledDate: "2025-12-15"
   - Extract time from phrases like:
     * "at 2:30 PM" → scheduledTime: "14:30"
     * "at 14:30" → scheduledTime: "14:30"
     * "at 2 PM" → scheduledTime: "14:00"
     * "in the morning" → scheduledTime: "09:00" (default morning time)
     * "in the afternoon" → scheduledTime: "14:00" (default afternoon time)
     * "in the evening" → scheduledTime: "18:00" (default evening time)
   - If only date is mentioned without time, set scheduledTime to null (system will use default time)
   - If only time is mentioned without date, ask for clarification or use today's date if context suggests it
   - Always convert dates to YYYY-MM-DD format and times to HH:MM format (24-hour)

5. list_auth_providers:
   Use this action when the user asks about available authentication / auth providers or methods, or asks how many auth providers the system has.
   Examples of such queries: "list auth providers", "what authentication methods do you have", "how many auth providers are available", "show me all auth providers".
   Parameters:
   {
     // No required parameters; always use an empty object unless future filters are added
   }

6. generate_document:
   Use this action when user wants to generate a new document (e.g., "generate NDA file", "create a contract", "make an agreement").
   When user says "generate [category] file", first ask if they want to create new or choose existing.
   If they say "create new one", use this action to start the generation process.
   Parameters:
   {
     "category": "string (e.g., 'NDA', 'Contract', 'Agreement')",
     "requirements": "string (user's requirements for the document)",
     "formData": {} // Optional additional data
   }

7. list_documents_by_category:
   Use this action when user wants to see documents of a specific category (e.g., "show me NDA documents", "list all contracts").
   This should ONLY return documents matching that category/tag, not all documents.
   Parameters:
   {
     "category": "string (required, e.g., 'NDA', 'Contract')",
     "limit": "number (optional, default: 20)"
   }

8. list_shared_documents:
   Use this action when user asks for documents shared to a specific user (e.g., "show documents shared to john@example.com").
   Also use this action when user asks for drafted documents/envelopes (e.g., "show documents I drafted", "list draft envelopes").
   This returns documents that are shared (not drafted) by default, OR drafted documents if status="draft" is specified.
   Parameters:
   {
     "recipientEmail": "string (optional, email of the recipient. If not provided, returns documents created BY current user)",
     "date": "string (optional, filter by date e.g., 'today', 'yesterday', 'YYYY-MM-DD')",
     "serviceType": "string (optional, 'e-sign' or 'document' to filter by service type)",
     "status": "string (optional, 'draft' to include drafted documents, or other status like 'sent', 'completed' to filter by status)",
     "limit": "number (optional, default: 20)"
   }

9. list_signed_documents:
   Use this action when user asks for documents signed by a specific user on a specific date (e.g., "show documents signed by john today", "list documents signed by rahul on 2024-01-15").
   Parameters:
   {
     "recipientEmail": "string (required, email of the signer)",
     "date": "ISO date string (required, e.g., '2024-01-15' or 'today')",
     "limit": "number (optional, default: 20)"
   }

10. select_document:
    Use this action when user selects a document from a previous list by number (e.g., "choose 3rd document", "use number 2", "select the first one").
    The system will automatically use the document from the most recent list result.
    Parameters:
    {
      "documentIndex": "number (required, 1-based index from the previous list)",
      "previousAction": "string (optional, the action that generated the list, e.g., 'list_documents_by_category')"
    }

  CLARIFICATION RULES:
  - If NO file is attached (the user message does NOT start with "[File attached:") and documentId is missing for send_document, prepare_document, or create_and_send_envelope, ask: "Which document would you like to [action]?"
  - If a file IS attached (the system will prefix the user message with "[File attached: <fileName> (<fileType>) ]") and the user refers to "this document", "this file", or otherwise clearly means the attached file, then:
    - Set "documentId": null
    - DO NOT ask for a document ID or clarification about the document
    - Proceed with the requested action using the attached file as the document source.
  - If MULTIPLE files are attached (the system will prefix the user message with e.g. "[File attached: file1.pdf, file2.pdf (...)]") and the user says "first document", "second document", "both documents", "each document", or similar:
    - Use "documentIndex" on each signature field to indicate which attached document it belongs to (1-based index in the order the files were attached).
    - Example: "add signature for Sneha on the first document and for Rahul on the second document" should yield two signatureFields where the first has "documentIndex": 1 and the second has "documentIndex": 2.
    - If the user clearly wants the same field on ALL attached documents (e.g. "add a signature for Sneha on every document"), create one signature field per document with the appropriate "documentIndex" values.
  - On follow‑up clarification turns where a file is still attached and the user confirms the same document (e.g. "yes this is the correct document", "use this doc", "send this attached file"), keep using the attached file and DO NOT ask again for a document ID.
  - If recipient email is missing for send_document or create_and_send_envelope, ask: "What is the recipient's email address?"
  - If signature fields are mentioned but no position specified, use default positions (bottom-right for signature fields)
  - If the command mentions both sending and signature fields, use create_and_send_envelope action
  - If the user asks to apply authentication / auth provider / verification methods (e.g. "use Email OTP", "apply Aadhaar KYC"), add an "authMethods" array on each affected recipient with the method names as spoken by the user. If the user says "same auth for all recipients", copy the same authMethods array to all recipients.
  - Do NOT invent auth methods; only use ones explicitly requested in the command.
  - When user says "generate [category] file" (e.g., "generate NDA file"), first ask: "Do you want to create a new [category] document or choose from existing [category] documents?"
  - If user says "choose existing" or "choose from existing", use list_documents_by_category action with the category.
  - If user says "create new one" or "create new", use generate_document action and ask for required details.
  - When user selects a document by number (e.g., "choose 3rd", "select number 2"), use select_document action. The system will automatically use the document from the most recent list.
  - After selecting a document by number, proceed with the intended action (e.g., sending) without asking for document ID again.
  - For list_shared_documents: 
    * If user asks for "drafted documents", "draft envelopes", "documents I drafted", etc., set status: "draft" and recipientEmail: null (to get current user's drafts)
    * If user asks for "documents I shared" or "my shared documents", set recipientEmail: null (no status needed, will exclude drafts by default)
    * If user asks for "documents shared to [email]", set recipientEmail to that email (no status needed)
    * Extract dates from queries like "on 18 november 2025" → date: "2025-11-18"
    * If user mentions "e-sign", "esign", "e sign", or "envelope", set serviceType: "e-sign"
  - For list_signed_documents, only return documents that are completed/signed on the specified date.
  - If the command is unclear, ask a short, specific question

PLATFORM CONTEXT:
${JSON.stringify(kb, null, 2)}

EXAMPLES:

User: "search the document sent to Rahul"
Response: {
  "action": "search_document",
  "parameters": {
    "query": "document sent to Rahul",
    "recipientName": "Rahul"
  },
  "clarification": null
}

User: "send this document to Priya"
Response: {
  "action": "send_document",
  "parameters": {
    "documentId": null,
    "recipients": [{"name": "Priya", "email": null}]
  },
  "clarification": "Which document would you like to send? Also, what is Priya's email address?"
}

User: "find the NDA sent to Karan"
Response: {
  "action": "search_document",
  "parameters": {
    "query": "NDA sent to Karan",
    "documentTitle": "NDA",
    "recipientName": "Karan"
  },
  "clarification": null
}

User: "add signature and name fields then send"
Response: {
  "action": "create_and_send_envelope",
  "parameters": {
    "documentId": null,
    "recipients": [],
    "signatureFields": [
      {"type": "signature", "page": 1, "position": "bottom-right", "width": 150, "height": 40},
      {"type": "name", "page": 1, "position": "bottom-right", "width": 150, "height": 30}
    ]
  },
  "clarification": "Which document would you like to send? Also, who should receive it?"
}

User: "send Employment Contract.pdf to sneha tiwari at snehat@itio.in and add a signature field in bottom right corner"
Response: {
  "action": "create_and_send_envelope",
  "parameters": {
    "documentId": null,
    "recipients": [{"name": "sneha tiwari", "email": "snehat@itio.in"}],
    "signatureFields": [
      {"type": "signature", "page": 1, "position": "bottom-right", "width": 150, "height": 40}
    ],
    "subject": "Employment Contract"
  },
  "clarification": "Which document is 'Employment Contract.pdf'? Please provide the document ID, search for it first, or attach the file."
}

User: "how many auth providers do you have?"
Response: {
  "action": "list_auth_providers",
  "parameters": {},
  "clarification": null
}

User: [File attached: contract.pdf] "send this to john@example.com with a signature field"
Response: {
  "action": "create_and_send_envelope",
  "parameters": {
    "documentId": null,
    "recipients": [{"name": "john", "email": "john@example.com"}],
    "signatureFields": [
      {"type": "signature", "page": 1, "position": "bottom-right", "width": 150, "height": 40}
    ],
    "subject": "contract.pdf"
  },
  "clarification": null
}

User: "generate NDA file"
Response: {
  "action": null,
  "parameters": {},
  "clarification": "Do you want to create a new NDA document or choose from existing NDA documents?"
}

User: "choose existing"
Response: {
  "action": "list_documents_by_category",
  "parameters": {
    "category": "NDA"
  },
  "clarification": null
}

User: "choose 3rd document"
Response: {
  "action": "select_document",
  "parameters": {
    "documentIndex": 3
  },
  "clarification": null
}

User: "create new one"
Response: {
  "action": "generate_document",
  "parameters": {
    "category": "NDA",
    "requirements": ""
  },
  "clarification": "Please provide the required details for the NDA document. For example: parties involved, effective date, confidentiality period, etc."
}

User: "show documents shared to john@example.com"
Response: {
  "action": "list_shared_documents",
  "parameters": {
    "recipientEmail": "john@example.com"
  },
  "clarification": null
}

User: "list documents signed by rahul today"
Response: {
  "action": "list_signed_documents",
  "parameters": {
    "recipientEmail": "rahul",
    "date": "today"
  },
  "clarification": "What is Rahul's email address?"
}

IMPORTANT:
- Always return valid JSON
- Never return free-text unless clarification is required
- Extract as much information as possible from the user's command
- Use null for missing optional parameters
- Return clarification string if critical information is missing`;
  }

  async processCommand(userCommand, context = {}) {
    try {
      const systemPrompt = this.buildSystemPrompt();
      
      // Build user message with file info if available
      let userMessage = userCommand;
      if (context.hasFile && context.fileName) {
        userMessage = `[File attached: ${context.fileName} (${context.fileType})]\n\n${userCommand}`;
      }
      
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ];

      // Add conversation context if available
      if (context.previousMessages && context.previousMessages.length > 0) {
        // Add last few messages for context
        const recentMessages = context.previousMessages.slice(-4);
        messages.splice(1, 0, ...recentMessages);
      }

      // Use AI_MODEL from env or default to gpt-4o-mini
      const model = process.env.AI_MODEL || 'gpt-4o-mini';

      const response = await this.openai.chat.completions.create({
        model: model,
        messages: messages,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        max_tokens: 1000
      });

      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content);

      return parsed;
    } catch (error) {
      console.error('Error processing command with LLM:', error);
      
      // Handle quota/rate limit errors
      if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
        console.error('OpenAI API quota/rate limit exceeded. Using fallback parser.');
        // Return fallback with a note about quota
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
    const lowerCommand = command.toLowerCase();
    
    // Simple keyword-based fallback
    // 0. List auth providers / auth methods
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

    // 1. Search documents
    if (lowerCommand.includes('search') || lowerCommand.includes('find') || lowerCommand.includes('look')) {
      return {
        action: 'search_document',
        parameters: {
          query: command
        },
        clarification: null
      };
    }
    
    if (lowerCommand.includes('send') || lowerCommand.includes('email')) {
      // Try to extract document ID and recipient info using regex patterns
      const documentIdMatch = command.match(/\b([a-f0-9]{24})\b/i); // MongoDB ObjectId pattern
      const emailPattern = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;
      const emails = command.match(emailPattern) || [];
      
      // Try to extract names (words before "to" or before email, but stop at "mail id", "email", "at", etc.)
      const namePattern = /(?:send|email).*?to\s+([a-zA-Z\s]+?)(?:\s+(?:mail\s*id|email|at|@)|$)/i;
      const nameMatch = command.match(namePattern);
      let names = nameMatch ? [nameMatch[1].trim()] : [];
      
      // Clean up names - remove common phrases like "mail id is", "email is", etc.
      names = names.map(name => {
        return name
          .replace(/\s+mail\s*id\s+is\s+/i, ' ')
          .replace(/\s+email\s+is\s+/i, ' ')
          .replace(/\s+at\s+/i, ' ')
          .trim();
      });
      
      const recipients = emails.map((email, index) => ({
        email: email,
        name: names[index] || email.split('@')[0]
      }));
      
      const documentId = documentIdMatch ? documentIdMatch[1] : null;
      
      // Check if file is attached and command mentions signature fields
      const hasFile = context.hasFile || false;
      const hasSignatureField = lowerCommand.includes('signature') || lowerCommand.includes('sign');
      const hasPosition = lowerCommand.includes('bottom') || lowerCommand.includes('top') || lowerCommand.includes('right') || lowerCommand.includes('left') || lowerCommand.includes('center');
      
      // If file is attached and recipients exist, use create_and_send_envelope
      if (hasFile && recipients.length > 0) {
        const signatureFields = [];
        if (hasSignatureField) {
          // Extract position
          let position = 'bottom-right'; // default
          if (lowerCommand.includes('bottom-right') || (lowerCommand.includes('bottom') && lowerCommand.includes('right'))) {
            position = 'bottom-right';
          } else if (lowerCommand.includes('bottom-left') || (lowerCommand.includes('bottom') && lowerCommand.includes('left'))) {
            position = 'bottom-left';
          } else if (lowerCommand.includes('top-right') || (lowerCommand.includes('top') && lowerCommand.includes('right'))) {
            position = 'top-right';
          } else if (lowerCommand.includes('top-left') || (lowerCommand.includes('top') && lowerCommand.includes('left'))) {
            position = 'top-left';
          } else if (lowerCommand.includes('center')) {
            position = 'center';
          } else if (lowerCommand.includes('bottom')) {
            position = 'bottom-right';
          }
          
          signatureFields.push({
            type: 'signature',
            page: 1,
            position: position,
            width: 150,
            height: 40
          });
        }
        
        return {
          action: 'create_and_send_envelope',
          parameters: {
            documentId: null, // File is attached, so no documentId needed
            recipients: recipients,
            signatureFields: signatureFields,
            subject: context.fileName ? context.fileName.replace(/\.[^/.]+$/, '') : null,
            message: null
          },
          clarification: null
        };
      }
      
      // If we have both documentId and at least one recipient, we can proceed
      if (documentId && recipients.length > 0) {
        // Check if signature fields are mentioned
        if (hasSignatureField) {
          let position = 'bottom-right';
          if (lowerCommand.includes('bottom-right') || (lowerCommand.includes('bottom') && lowerCommand.includes('right'))) {
            position = 'bottom-right';
          } else if (lowerCommand.includes('bottom-left') || (lowerCommand.includes('bottom') && lowerCommand.includes('left'))) {
            position = 'bottom-left';
          } else if (lowerCommand.includes('top-right') || (lowerCommand.includes('top') && lowerCommand.includes('right'))) {
            position = 'top-right';
          } else if (lowerCommand.includes('top-left') || (lowerCommand.includes('top') && lowerCommand.includes('left'))) {
            position = 'top-left';
          } else if (lowerCommand.includes('center')) {
            position = 'center';
          }
          
          return {
            action: 'create_and_send_envelope',
            parameters: {
              documentId: documentId,
              recipients: recipients,
              signatureFields: [{
                type: 'signature',
                page: 1,
                position: position,
                width: 150,
                height: 40
              }],
              subject: null,
              message: null
            },
            clarification: null
          };
        }
        
        return {
          action: 'send_document',
          parameters: {
            documentId: documentId,
            recipients: recipients,
            subject: null,
            message: null
          },
          clarification: null
        };
      }
      
      // If we have recipients but no documentId and no file, ask for document
      if (recipients.length > 0 && !documentId && !hasFile) {
        return {
          action: 'send_document',
          parameters: {
            documentId: null,
            recipients: recipients
          },
          clarification: 'Which document would you like to send? Please provide the document ID or attach a file.'
        };
      }
      
      // If we have documentId but no recipients, ask for recipients
      if (documentId && recipients.length === 0) {
        return {
          action: 'send_document',
          parameters: {
            documentId: documentId,
            recipients: []
          },
          clarification: 'Who should receive this document? Please provide recipient email address(es).'
        };
      }
      
      // No information extracted
      return {
        action: 'send_document',
        parameters: {
          documentId: null,
          recipients: []
        },
        clarification: 'Which document would you like to send? Please provide the document ID or attach a file, and recipient email address.'
      };
    }
    
    if (lowerCommand.includes('prepare') || lowerCommand.includes('add field') || lowerCommand.includes('signature')) {
      // Try to extract document ID
      const documentIdMatch = command.match(/\b([a-f0-9]{24})\b/i);
      const documentId = documentIdMatch ? documentIdMatch[1] : null;
      
      return {
        action: 'prepare_document',
        parameters: {
          documentId: documentId,
          fields: []
        },
        clarification: documentId 
          ? 'What fields do you need to add to the document? (e.g., signature, name, date)'
          : 'Which document would you like to prepare? Please specify the document ID and what fields you need.'
      };
    }

    return {
      action: null,
      parameters: {},
      clarification: 'I didn\'t understand that command. Please try: "search documents", "send document", or "prepare document".'
    };
  }
}

module.exports = new LLMService();

