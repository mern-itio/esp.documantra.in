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
      const kbPath = path.join(__dirname, '../../../knowledge-base.json');
      const kbData = fs.readFileSync(kbPath, 'utf8');
      return JSON.parse(kbData);
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

RESPONSE FORMAT:
You must always respond with a JSON object containing:
{
  "action": "search_document" | "send_document" | "prepare_document" | "create_and_send_envelope" | null,
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
   Extract: documentId, recipients, signature fields, subject, message
   Parameters:
   {
     "documentId": "string (required)",
     "recipients": [
       {
         "name": "string",
         "email": "string (required)"
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
         "recipientEmail": "string or null (if specific recipient)"
       }
     ],
     "subject": "string or null",
     "message": "string or null"
   }

CLARIFICATION RULES:
- If documentId is missing for send_document, prepare_document, or create_and_send_envelope, ask: "Which document would you like to [action]?"
- If recipient email is missing for send_document or create_and_send_envelope, ask: "What is the recipient's email address?"
- If signature fields are mentioned but no position specified, use default positions (bottom-right for signature fields)
- If the command mentions both sending and signature fields, use create_and_send_envelope action
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

