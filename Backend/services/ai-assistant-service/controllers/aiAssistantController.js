// Use LangChain services if available, fallback to original services
let llmService, ragService;
try {
  // Try simplified version first (more natural, ChatGPT-like)
  try {
    llmService = require('../services/llmServiceLangChain');
    console.log('✅ Using Simplified LangChain services (ChatGPT-like)');
  } catch (e) {
    // Fallback to original LangChain service
    llmService = require('../services/llmServiceLangChain');
    console.log('✅ Using LangChain services');
  }
  ragService = require('../services/ragServiceLangChain');
} catch (error) {
  console.warn('⚠️ LangChain services not available, using original services:', error.message);
  llmService = require('../services/llmService');
  ragService = require('../services/ragService');
}

const Conversation = require('../models/Conversation');
const axios = require('axios');
const { ActionResponseSchema } = require('../schemas/actionSchemas');

class AIAssistantController {
  // Process user command
  async processCommand(req, res) {
    try {
      const userId = req.user.data.id;
      const token = req.headers.authorization?.replace('Bearer ', '') || null;
      const command = req.body.command || req.body.command;
      const context = req.body.context ? (typeof req.body.context === 'string' ? JSON.parse(req.body.context) : req.body.context) : null;
      const uploadedFiles = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []); // Files from multer

      if (!command || typeof command !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Command is required'
        });
      }

      // If file(s) are uploaded, add them to context
      let enhancedContext = context || {};
      if (uploadedFiles.length > 0) {
        enhancedContext.uploadedFiles = uploadedFiles.map(f => ({
          filename: f.filename,
          originalname: f.originalname,
          path: f.path,
          mimetype: f.mimetype,
          size: f.size
        }));
        // console.log('Files uploaded:', uploadedFiles.map(f => `${f.originalname} (${f.size})`).join(', '));
      }

      // Get or create conversation
      const conversationId = req.body.conversationId || null;
      let conversation = null;
      
      if (conversationId) {
        // Load specific conversation
        conversation = await Conversation.findOne({ _id: conversationId, userId });
        if (!conversation) {
          return res.status(404).json({
            success: false,
            message: 'Conversation not found'
          });
        }
      } else {
        // Create new conversation or use the most recent active one
        conversation = await Conversation.findOne({ userId, isActive: true })
          .sort({ updatedAt: -1 });
        
        if (!conversation) {
          // Create new conversation
          conversation = new Conversation({
            userId,
            title: command.substring(0, 50) || 'New Chat', // Use first 50 chars of command as title
            isActive: true,
            messages: []
          });
          await conversation.save();
        }
      }

      const previousMessages = conversation?.messages.slice(-10) || [];
      
      // Auto-update title from first user message if it's still "New Chat"
      if (conversation.messages.length === 0 && conversation.title === 'New Chat') {
        conversation.title = command.substring(0, 50) || 'New Chat';
      }

      // Check if we're in a document generation flow
      const lastAssistantMessage = previousMessages.filter(m => m.role === 'assistant').pop();
      const isInDocumentGenerationFlow = lastAssistantMessage?.content?.includes('Please provide') || 
                                         lastAssistantMessage?.content?.includes('required details') ||
                                         lastAssistantMessage?.content?.includes('GENERATE DOCUMENT') ||
                                         lastAssistantMessage?.action === 'generate_document';

      // Process command with LLM (include file info if uploaded)
      const llmContext = {
        previousMessages: previousMessages.map(m => ({
          role: m.role,
          content: m.content,
          action: m.action
        })),
        hasFile: uploadedFiles.length > 0,
        fileName: uploadedFiles[0]?.originalname,
        fileType: uploadedFiles[0]?.mimetype,
        isInDocumentGenerationFlow: isInDocumentGenerationFlow,
        selectedDocument: conversation?.selectedDocument ? {
          id: conversation.selectedDocument.id,
          envelopeId: conversation.selectedDocument.envelopeId,
          name: conversation.selectedDocument.name,
          category: conversation.selectedDocument.category
        } : null
      };
      
      let result = await llmService.processCommand(command, llmContext);
      
      console.log('📥 Raw result from LLM service:', JSON.stringify(result, null, 2));

      // Pre-process: If user wants to generate AND send in one command, extract and store email
      // Check if command contains both "generate" and an email address
      const lowerCommand = command.toLowerCase();
      const emailPattern = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/;
      const hasEmail = emailPattern.test(command);
      const hasGenerate = lowerCommand.includes('generate') || lowerCommand.includes('create');
      const hasSend = lowerCommand.includes('send') || lowerCommand.includes('email');
      
      // If user says "generate X and send it to Y", extract email and store it for auto-send
      if (result.action === 'generate_document' && hasEmail && (hasSend || result.parameters?.recipientEmail)) {
        console.log('🔄 Pre-processing: Detected "generate and send" in single command');
        
        // Ensure parameters object exists
        if (!result.parameters) {
          result.parameters = {};
        }
        
        // Extract email from command or parameters
        let extractedEmail = null;
        if (result.parameters.recipientEmail) {
          extractedEmail = result.parameters.recipientEmail;
          console.log('📧 Email already in parameters:', extractedEmail);
        } else {
          const emailMatch = command.match(emailPattern);
          if (emailMatch && emailMatch[1]) {
            extractedEmail = emailMatch[1];
            result.parameters.recipientEmail = extractedEmail; // Store for auto-send
            console.log('📧 Extracted email from command and stored in parameters:', extractedEmail);
          }
        }
        
        // Remove email from requirements if it's there (clean up requirements text)
        if (result.parameters.requirements && extractedEmail) {
          // Remove email and "send it to" phrases from requirements
          result.parameters.requirements = result.parameters.requirements
            .replace(new RegExp(`\\s*(?:and\\s+)?(?:send\\s+it\\s+to|send\\s+to)\\s+${extractedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi'), '')
            .replace(new RegExp(extractedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '')
            .trim();
          console.log('🧹 Cleaned requirements text (removed email references)');
        }
      }

      // Post-process: If generate_document action but requirements are missing, add them
      if (result.action === 'generate_document' && result.parameters) {
        // Check if requirements are missing or empty
        if (!result.parameters.requirements || result.parameters.requirements.trim() === '') {
          // Check if command contains document details
          const hasDetails = /party|parties|first|second|date|period|duration|effective|confidential|term|obligation|exclusion|signatory|address|entity|living|receiver|sender|name/i.test(command.toLowerCase());
          if (hasDetails) {
            console.log('🔄 Post-processing: Adding user-provided details to requirements field');
            result.parameters.requirements = command; // Use the full command as requirements
          }
        }
      }
      
      // Post-process: If in document generation flow and user provided details but LLM didn't recognize it
      // BUT ONLY if user didn't provide an email (which means they want to send, not generate)
      // AND the user is NOT clearly asking to search/find/list documents
      const lastAssistantMsg = conversation?.messages?.filter(m => m.role === 'assistant').pop();
      
      // Check if command is clearly a search/list/find command (don't override these)
      const isSearchCommand = /search|find|look\s+for|list|show|get|fetch|retrieve/i.test(command.toLowerCase());
      const isSearchAction = result.action === 'search_document' || 
                            result.action === 'list_shared_documents' || 
                            result.action === 'list_documents_by_category' ||
                            result.action === 'list_signed_documents';
      
      if (isInDocumentGenerationFlow && 
          result.action !== 'generate_document' && 
          !result.clarification && 
          !hasEmail &&
          !isSearchCommand &&
          !isSearchAction) {
        // Check if command contains document details
        const hasDetails = /party|parties|first|second|date|period|duration|effective|confidential|term|obligation|exclusion|signatory|address|entity|living|receiver|sender|name/i.test(command.toLowerCase());
        if (hasDetails) {
          // Extract category from previous messages
          const categoryMatch = lastAssistantMessage?.content?.match(/(?:NDA|Contract|Agreement)/i);
          const category = categoryMatch ? categoryMatch[0] : 'NDA'; // Default to NDA if not found
          
          console.log('🔄 Post-processing: Detected document generation details, forcing generate_document action');
          result = {
            action: 'generate_document',
            parameters: {
              category: category,
              requirements: command // Use the full command as requirements
            },
            clarification: null
          };
        }
      }

      // Post-process: If user just provided an email after document generation, convert to send action
      // This must happen AFTER the document generation details check to avoid being overridden
      if (lastAssistantMsg?.action === 'generate_document' && conversation?.selectedDocument) {
        // If user provides email and action is generate_document or missing, convert to send
        if (hasEmail && (result.action === 'generate_document' || !result.action)) {
          console.log('🔄 Post-processing: Detected email after document generation, converting to create_and_send_envelope');
          result.action = 'create_and_send_envelope';
          result.parameters = result.parameters || {};
          
          // Extract email from command (reuse emailPattern from above)
          const emailMatch = command.match(emailPattern);
          if (emailMatch && emailMatch[1]) {
            result.parameters.recipients = [{
              email: emailMatch[1],
              name: emailMatch[1].split('@')[0] // Use email prefix as name
            }];
            console.log('📧 Extracted recipient email:', emailMatch[1]);
          }
          
          // Use the generated document
          if (conversation.selectedDocument.envelopeId) {
            result.parameters.documentId = conversation.selectedDocument.envelopeId;
            console.log('💾 Using generated envelope (e-sign service):', conversation.selectedDocument.envelopeId);
          } else if (conversation.selectedDocument.id) {
            result.parameters.documentId = conversation.selectedDocument.id;
            console.log('💾 Using generated document:', conversation.selectedDocument.id);
          }
          
          // Add default signature field if not specified
          if (!result.parameters.signatureFields || result.parameters.signatureFields.length === 0) {
            result.parameters.signatureFields = [{
              type: 'signature',
              page: 1,
              position: 'bottom-right'
            }];
            console.log('📝 Added default signature field');
          }
          
          result.clarification = null;
        }
      }

      // Post-process: Ensure date is extracted if mentioned in command (double-check)
      if (result.action === 'list_shared_documents' && result.parameters) {
        const lowerCommand = command.toLowerCase();
        if (lowerCommand.includes('today') && !result.parameters.date) {
          result.parameters.date = 'today';
          console.log('📅 Controller: Added missing date: today');
        } else if (lowerCommand.includes('yesterday') && !result.parameters.date) {
          result.parameters.date = 'yesterday';
          console.log('📅 Controller: Added missing date: yesterday');
        }
      }

      // Validate result with Zod schema (if using LangChain, it's already validated)
      // Preserve requirements field before validation (Zod union might strip it)
      const preservedRequirements = result.action === 'generate_document' && result.parameters?.requirements 
        ? result.parameters.requirements 
        : null;
      
      try {
        result = ActionResponseSchema.parse(result);
        
        // Restore requirements field if it was present before validation
        if (preservedRequirements && result.action === 'generate_document' && result.parameters) {
          result.parameters.requirements = preservedRequirements;
        }
        
        console.log('✅ After Zod validation:', JSON.stringify(result, null, 2));
      } catch (validationError) {
        console.warn('LLM response validation failed, using as-is:', validationError.message);
        // Continue with unvalidated result but log warning
      }

      // Post-process: If user references a document by number/position (e.g., "first document", "second document")
      // and there's a lastDocumentList, automatically select that document
      const commandLower = command.toLowerCase();
      const documentPositionPatterns = [
        /(?:first|1st|1)\s+(?:document|doc|envelope|file)/i,
        /(?:second|2nd|2)\s+(?:document|doc|envelope|file)/i,
        /(?:third|3rd|3)\s+(?:document|doc|envelope|file)/i,
        /(?:fourth|4th|4)\s+(?:document|doc|envelope|file)/i,
        /(?:fifth|5th|5)\s+(?:document|doc|envelope|file)/i,
        /(?:sixth|6th|6)\s+(?:document|doc|envelope|file)/i,
        /(?:seventh|7th|7)\s+(?:document|doc|envelope|file)/i,
        /(?:eighth|8th|8)\s+(?:document|doc|envelope|file)/i,
        /(?:ninth|9th|9)\s+(?:document|doc|envelope|file)/i,
        /(?:tenth|10th|10)\s+(?:document|doc|envelope|file)/i,
        /document\s+(?:number|#)?\s*(\d+)/i,
        /(?:the|send|share|use)\s+(?:first|1st|1)\s+(?:one|document|doc|envelope)/i
      ];
      
      let documentIndex = null;
      for (const pattern of documentPositionPatterns) {
        const match = command.match(pattern);
        if (match) {
          if (match[1]) {
            // Pattern with capture group (e.g., "document 1")
            documentIndex = parseInt(match[1], 10);
          } else {
            // Pattern without capture group (e.g., "first document")
            if (commandLower.includes('first') || commandLower.includes('1st') || (commandLower.match(/\b1\b/) && commandLower.includes('document'))) {
              documentIndex = 1;
            } else if (commandLower.includes('second') || commandLower.includes('2nd') || (commandLower.match(/\b2\b/) && commandLower.includes('document'))) {
              documentIndex = 2;
            } else if (commandLower.includes('third') || commandLower.includes('3rd') || (commandLower.match(/\b3\b/) && commandLower.includes('document'))) {
              documentIndex = 3;
            } else if (commandLower.includes('fourth') || commandLower.includes('4th') || (commandLower.match(/\b4\b/) && commandLower.includes('document'))) {
              documentIndex = 4;
            } else if (commandLower.includes('fifth') || commandLower.includes('5th') || (commandLower.match(/\b5\b/) && commandLower.includes('document'))) {
              documentIndex = 5;
            } else if (commandLower.includes('sixth') || commandLower.includes('6th') || (commandLower.match(/\b6\b/) && commandLower.includes('document'))) {
              documentIndex = 6;
            } else if (commandLower.includes('seventh') || commandLower.includes('7th') || (commandLower.match(/\b7\b/) && commandLower.includes('document'))) {
              documentIndex = 7;
            } else if (commandLower.includes('eighth') || commandLower.includes('8th') || (commandLower.match(/\b8\b/) && commandLower.includes('document'))) {
              documentIndex = 8;
            } else if (commandLower.includes('ninth') || commandLower.includes('9th') || (commandLower.match(/\b9\b/) && commandLower.includes('document'))) {
              documentIndex = 9;
            } else if (commandLower.includes('tenth') || commandLower.includes('10th') || (commandLower.match(/\b10\b/) && commandLower.includes('document'))) {
              documentIndex = 10;
            }
          }
          if (documentIndex) break;
        }
      }
      
      // If document position is detected and there's a lastDocumentList, select that document
      // This should override any previously selected document (including drafts)
      if (documentIndex && conversation?.lastDocumentList && conversation.lastDocumentList.length > 0) {
        const idx = Math.min(conversation.lastDocumentList.length, Math.max(1, documentIndex)) - 1;
        const selectedDoc = conversation.lastDocumentList[idx];
        if (selectedDoc) {
          console.log(`🔄 Auto-selecting document #${documentIndex} from last list (overriding previous selection):`, selectedDoc);
          conversation.selectedDocument = {
            id: selectedDoc.id,
            name: selectedDoc.name,
            category: selectedDoc.category,
            serviceType: selectedDoc.serviceType || 'document-service',
            docType: selectedDoc.docType || 'document'
          };
          // If it's an e-sign envelope, also set envelopeId
          if (selectedDoc.serviceType === 'e-sign-service' || selectedDoc.serviceType === 'envelope') {
            conversation.selectedDocument.envelopeId = selectedDoc.id;
            conversation.selectedDocument.serviceType = 'e-sign-service';
            conversation.selectedDocument.docType = 'envelope';
          }
          // Clear any draft-related selection when explicitly selecting from list
          console.log('✅ Overriding selectedDocument with document from list:', conversation.selectedDocument);
          
          // If user said "share" or "send" with document position, ensure action is set correctly
          if ((commandLower.includes('share') || commandLower.includes('send')) && 
              (!result.action || result.action === 'generate_document')) {
            result.action = 'create_and_send_envelope';
            result.parameters = result.parameters || {};
            console.log('🔄 Auto-setting action to create_and_send_envelope for document position reference');
          }
        }
      }

      // Check if there's a selected document from previous conversation
      if (conversation?.selectedDocument && conversation.selectedDocument.id) {
        // If user says "send the generated document" or similar, and action is not set or is wrong, fix it
        const mentionsGeneratedDoc = commandLower.includes('generated document') || 
                                     commandLower.includes('the document') ||
                                     commandLower.includes('this document') ||
                                     (commandLower.includes('send') && !result.action);
        
        if (mentionsGeneratedDoc && (!result.action || result.action === 'generate_document')) {
          // User wants to send the generated document, not generate a new one
          if (commandLower.includes('send') || commandLower.includes('email')) {
            result.action = 'create_and_send_envelope';
            result.parameters = result.parameters || {};
            result.parameters.documentId = conversation.selectedDocument.id;
            console.log('🔄 Auto-corrected: Using generated document for send action');
          }
        }
        
        // If action needs documentId but it's missing, use the selected document
        // BUT: If user explicitly mentioned a document position (first, second, etc.), 
        // that selection should have already happened above and overridden any draft
        const needsDocumentId = ['send_document', 'prepare_document', 'create_and_send_envelope'].includes(result.action);
        if (needsDocumentId && (!result.parameters || !result.parameters.documentId)) {
          result.parameters = result.parameters || {};
          // Only use selectedDocument if it exists and wasn't just overridden by position selection
          if (conversation.selectedDocument?.id) {
            // Prioritize envelopeId (e-sign service) over documentId (document service)
            if (conversation.selectedDocument.envelopeId) {
              result.parameters.documentId = conversation.selectedDocument.envelopeId;
              console.log('💾 Using selected envelope (e-sign service):', conversation.selectedDocument.envelopeId);
            } else {
              result.parameters.documentId = conversation.selectedDocument.id;
              console.log('💾 Using selected document:', conversation.selectedDocument.id);
            }
          } else {
            console.warn('⚠️ Action needs documentId but no selected document found');
          }
        }
        
        // Don't clear selectedDocument yet - keep it available for multiple operations
        // Only clear it when explicitly replaced or after successful send
      }

      // If user just generated a document and now wants to send it, ensure we use the generated document
      if (result.action === 'create_and_send_envelope' && !result.parameters?.documentId) {
        // Check if last message was about document generation
        const lastAssistantMsg = conversation?.messages?.filter(m => m.role === 'assistant').pop();
        if (lastAssistantMsg?.action === 'generate_document' && conversation?.selectedDocument) {
          result.parameters = result.parameters || {};
          // Prioritize envelopeId (e-sign service) over documentId (document service)
          if (conversation.selectedDocument.envelopeId) {
            result.parameters.documentId = conversation.selectedDocument.envelopeId;
            console.log('🔄 Auto-using generated envelope (e-sign service) for send action:', conversation.selectedDocument.envelopeId);
          } else if (conversation.selectedDocument.id) {
            result.parameters.documentId = conversation.selectedDocument.id;
            console.log('🔄 Auto-using generated document for send action:', conversation.selectedDocument.id);
          }
        }
      }
      
      // Post-process: Extract recipient email from command if LLM missed it
      if (result.action === 'create_and_send_envelope' && result.parameters) {
        const emailPattern = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;
        let emails = command.match(emailPattern) || [];
        
        // Check if recipients are missing or invalid
        const hasValidRecipients = result.parameters.recipients && 
                                   Array.isArray(result.parameters.recipients) && 
                                   result.parameters.recipients.length > 0 &&
                                   result.parameters.recipients.some(r => r.email);
        
        // If no email in current command, check conversation history
        if (emails.length === 0 && conversation?.messages) {
          // Look through recent user messages for email addresses
          const recentUserMessages = conversation.messages
            .filter(m => m.role === 'user')
            .slice(-5) // Check last 5 user messages
            .map(m => m.content);
          
          for (const msg of recentUserMessages) {
            const msgEmails = msg.match(emailPattern) || [];
            if (msgEmails.length > 0) {
              emails = msgEmails;
              console.log('📧 Found email in conversation history:', emails);
              break;
            }
          }
        }
        
        // If recipients array is missing, empty, or invalid, but email is found, extract it
        if (!hasValidRecipients && emails.length > 0) {
          result.parameters.recipients = emails.map(email => {
            // Try to extract name from context (e.g., "to sneha at email" or "recipient sneha")
            // Check both current command and conversation history
            const searchText = command + ' ' + (conversation?.messages?.filter(m => m.role === 'user').slice(-3).map(m => m.content).join(' ') || '');
            const emailIndex = searchText.toLowerCase().indexOf(email.toLowerCase());
            const beforeEmail = searchText.substring(Math.max(0, emailIndex - 50), emailIndex).toLowerCase();
            let name = email.split('@')[0]; // Default to email username
            
            // Look for name patterns before email
            const namePatterns = [
              /(?:to|recipient|send\s+to)\s+([a-z\s]+?)\s+(?:at|@|email)/i,
              /(?:to|recipient)\s+([a-z\s]+?)\s*$/i
            ];
            
            for (const pattern of namePatterns) {
              const match = beforeEmail.match(pattern);
              if (match && match[1]) {
                name = match[1].trim();
                break;
              }
            }
            
            return {
              email: email,
              name: name
            };
          });
          
          console.log('✅ Post-processed: Extracted recipients from command/history:', result.parameters.recipients);
        } else if (!hasValidRecipients) {
          console.warn('⚠️ No recipients found and no email in command/history:', {
            hasRecipients: !!result.parameters.recipients,
            recipientsLength: result.parameters.recipients?.length || 0,
            emailsInCommand: emails,
            checkedHistory: true
          });
        }
      }

      // Normalize action/parameters based on actual context
      // If a file is attached but the model chose send_document without a documentId,
      // treat this as create_and_send_envelope so the file-based envelope flow is used
      if (
        uploadedFiles.length > 0 &&
        result.action === 'send_document' &&
        (!result.parameters || !result.parameters.documentId)
      ) {
        const originalParams = result.parameters || {};
        result.action = 'create_and_send_envelope';
        result.parameters = {
          documentId: null,
          recipients: originalParams.recipients || [],
          signatureFields: originalParams.signatureFields || [],
          subject: originalParams.subject || uploadedFiles[0].originalname,
          message: originalParams.message || null
        };
      }

      // Save conversation
      if (!conversation) {
        conversation = new Conversation({ userId, messages: [] });
      }

      conversation.messages.push({
        role: 'user',
        content: command
      });

      // If a non-PDF file is attached for a sending action, block and ask user to convert to PDF first
      const isSendOrEnvelopeAction =
        result.action === 'create_and_send_envelope' ||
        result.action === 'send_document';

      if (uploadedFiles.length > 0 && isSendOrEnvelopeAction) {
        const primaryFile = uploadedFiles[0];
        const originalName = primaryFile.originalname || '';
        const mimeType = primaryFile.mimetype || '';
        const lowerName = originalName.toLowerCase();
        const isPdf =
          mimeType === 'application/pdf' ||
          lowerName.endsWith('.pdf');

        if (!isPdf) {
          const clarificationText = this.buildNonPdfSendClarificationMessage(primaryFile);

          conversation.messages.push({
            role: 'assistant',
            content: clarificationText,
            action: null,
            parameters: {}
          });
          conversation.updatedAt = new Date();
          await conversation.save();

          return res.json({
            success: true,
            action: null,
            parameters: {},
            clarification: clarificationText,
            message: clarificationText
          });
        }
      }

      // Enforce mandatory signature field for envelopes and surface auth providers before sending
      if (result.action === 'create_and_send_envelope') {
        const signatureFields = Array.isArray(result.parameters?.signatureFields)
          ? result.parameters.signatureFields
          : [];
        let hasSignatureFields = signatureFields && signatureFields.length > 0;

        // Post-process: Extract signature field from command if user mentioned it but LLM didn't create it
        if (!hasSignatureFields) {
          const lowerCommand = command.toLowerCase();
          const hasSignatureMention = lowerCommand.includes('signature') || lowerCommand.includes('sign');
          const hasPosition = lowerCommand.includes('bottom-right') || lowerCommand.includes('bottom right') || 
                             lowerCommand.includes('bottom-left') || lowerCommand.includes('bottom left') ||
                             lowerCommand.includes('top-right') || lowerCommand.includes('top right') ||
                             lowerCommand.includes('top-left') || lowerCommand.includes('top left') ||
                             lowerCommand.includes('center');
          
          if (hasSignatureMention && hasPosition) {
            // Extract page number if mentioned
            const pageMatch = command.match(/page\s+(\d+)/i);
            const pageNumber = pageMatch ? parseInt(pageMatch[1]) : 1;
            
            // Determine position
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
            }
            
            result.parameters.signatureFields = [{
              type: 'signature',
              page: pageNumber,
              position: position,
              width: 150,
              height: 40
            }];
            
            hasSignatureFields = true;
            console.log('✅ Controller: Extracted signature field from command:', { page: pageNumber, position });
          }
        }

        if (!hasSignatureFields) {
          // Build clarification that asks for signature field details and shows available auth providers
          const clarificationText = await this.buildSignatureAndAuthClarificationMessage(token);

          conversation.messages.push({
            role: 'assistant',
            content: clarificationText,
            action: null,
            parameters: {}
          });
          conversation.updatedAt = new Date();
          await conversation.save();

          return res.json({
            success: true,
            action: null,
            parameters: {},
            clarification: clarificationText,
            message: clarificationText
          });
        }
      }

      // If clarification is needed, save it and return
      if (result.clarification) {
        conversation.messages.push({
          role: 'assistant',
          content: result.clarification,
          action: null,
          parameters: {}
        });
        conversation.updatedAt = new Date();
        await conversation.save();

        return res.json({
          success: true,
          action: null,
          parameters: {},
          clarification: result.clarification,
          message: result.clarification
        });
      }

      // Execute action if available
      if (result.action) {
        let executionResult = null;
        
        try {
          switch (result.action) {
            case 'search_document':
              executionResult = await this.executeSearchDocument(result.parameters, userId, token);
              break;
            case 'send_document':
              executionResult = await this.executeSendDocument(result.parameters, userId, token);
              break;
            case 'prepare_document':
              executionResult = await this.executePrepareDocument(result.parameters, userId, token);
              break;
            case 'list_auth_providers':
              executionResult = await this.executeListAuthProviders(userId, token);
              break;
            case 'create_and_send_envelope':
              // Log parameters before execution to debug recipient extraction
              console.log('🚀 Executing create_and_send_envelope with parameters:', JSON.stringify(result.parameters, null, 2));
              console.log('📧 Recipients check:', {
                hasRecipients: !!result.parameters?.recipients,
                recipientsType: Array.isArray(result.parameters?.recipients) ? 'array' : typeof result.parameters?.recipients,
                recipientsLength: result.parameters?.recipients?.length || 0,
                recipients: result.parameters?.recipients
              });
              // Merge scheduling parameters from context if available (from UI)
              if (enhancedContext?.isScheduled) {
                result.parameters = {
                  ...result.parameters,
                  isScheduled: enhancedContext.isScheduled,
                  scheduledDate: enhancedContext.scheduledDate,
                  scheduledTime: enhancedContext.scheduledTime || null
                };
              }
              // Also check if LLM extracted scheduling from user prompt
              if (result.parameters?.isScheduled || result.parameters?.scheduledDate) {
                // LLM already extracted scheduling, use it
                if (!result.parameters.isScheduled && result.parameters.scheduledDate) {
                  result.parameters.isScheduled = true;
                }
              }
              executionResult = await this.executeCreateAndSendEnvelope(result.parameters, userId, token, uploadedFiles, conversation);
              break;
            case 'generate_document':
              executionResult = await this.executeGenerateDocument(result.parameters, userId, token, conversation);
              break;
            case 'list_documents_by_category':
              executionResult = await this.executeListDocumentsByCategory(result.parameters, userId, token, conversation);
              break;
            case 'list_shared_documents':
              // Ensure date and serviceType are preserved - fix if missing
              const lowerCommand = command.toLowerCase();
              
              // Extract status from command if user mentions "drafted" or "draft"
              if (!result.parameters.status) {
                if (lowerCommand.includes('drafted') || 
                    (lowerCommand.includes('draft') && (lowerCommand.includes('document') || lowerCommand.includes('envelope'))) ||
                    lowerCommand.includes('i drafted') ||
                    lowerCommand.includes('documents i drafted') ||
                    lowerCommand.includes('envelopes i drafted')) {
                  result.parameters.status = 'draft';
                  console.log('📋 Controller execution: Detected "drafted" in command, added status: draft');
                }
              }
              
              if (!result.parameters.date) {
                let extractedDate = null;
                
                if (lowerCommand.includes('today')) {
                  extractedDate = 'today';
                } else if (lowerCommand.includes('yesterday')) {
                  extractedDate = 'yesterday';
                } else {
                  // Try specific date patterns FIRST (before month/year)
                  // This ensures "18 november 2025" is extracted as "2025-11-18" not just "2025-11"
                  const datePatterns = [
                    /(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
                    /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
                    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i,
                    /(\d{4})-(\d{1,2})-(\d{1,2})/,
                    /(\d{1,2})\/(\d{1,2})\/(\d{4})/
                  ];
                  
                  for (const pattern of datePatterns) {
                    const match = command.match(pattern);
                    if (match) {
                      try {
                        let dateStr = match[0];
                        // Convert "18th november 2025" to "18 november 2025"
                        dateStr = dateStr.replace(/(\d+)(st|nd|rd|th)/i, '$1');
                        
                        // Try to extract components directly to avoid timezone issues
                        let year, month, day;
                        
                        // Pattern: "18 november 2025" or "18th november 2025"
                        if (match[1] && match[2] && match[3]) {
                          day = parseInt(match[1], 10);
                          const monthName = match[2].toLowerCase();
                          year = parseInt(match[3], 10);
                          const monthMap = {
                            'january': 1, 'jan': 1, 'february': 2, 'feb': 2,
                            'march': 3, 'mar': 3, 'april': 4, 'apr': 4,
                            'may': 5, 'june': 6, 'jun': 6, 'july': 7, 'jul': 7,
                            'august': 8, 'aug': 8, 'september': 9, 'sep': 9,
                            'october': 10, 'oct': 10, 'november': 11, 'nov': 11,
                            'december': 12, 'dec': 12
                          };
                          month = monthMap[monthName];
                          if (month) {
                            extractedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            console.log(`📅 Controller: Extracted specific date from command: "${match[0]}" -> ${extractedDate}`);
                            break;
                          }
                        }
                        
                        // Pattern: "november 18, 2025" or "november 18th, 2025"
                        if (match[1] && match[2] && match[3] && !day) {
                          const monthName = match[1].toLowerCase();
                          day = parseInt(match[2].replace(/(st|nd|rd|th)/i, ''), 10);
                          year = parseInt(match[3], 10);
                          const monthMap = {
                            'january': 1, 'jan': 1, 'february': 2, 'feb': 2,
                            'march': 3, 'mar': 3, 'april': 4, 'apr': 4,
                            'may': 5, 'june': 6, 'jun': 6, 'july': 7, 'jul': 7,
                            'august': 8, 'aug': 8, 'september': 9, 'sep': 9,
                            'october': 10, 'oct': 10, 'november': 11, 'nov': 11,
                            'december': 12, 'dec': 12
                          };
                          month = monthMap[monthName];
                          if (month) {
                            extractedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            console.log(`📅 Controller: Extracted specific date from command: "${match[0]}" -> ${extractedDate}`);
                            break;
                          }
                        }
                        
                        // Pattern: "2025-11-18" (ISO format)
                        if (match[1] && match[2] && match[3] && !day) {
                          year = parseInt(match[1], 10);
                          month = parseInt(match[2], 10);
                          day = parseInt(match[3], 10);
                          if (year && month && day) {
                            extractedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            console.log(`📅 Controller: Extracted specific date from command: "${match[0]}" -> ${extractedDate}`);
                            break;
                          }
                        }
                        
                        // Pattern: "11/18/2025" (MM/DD/YYYY)
                        if (match[1] && match[2] && match[3] && !day) {
                          month = parseInt(match[1], 10);
                          day = parseInt(match[2], 10);
                          year = parseInt(match[3], 10);
                          if (year && month && day) {
                            extractedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            console.log(`📅 Controller: Extracted specific date from command: "${match[0]}" -> ${extractedDate}`);
                            break;
                          }
                        }
                        
                        // Fallback: Try to parse with Date constructor
                        const parsed = new Date(dateStr);
                        if (!isNaN(parsed.getTime())) {
                          // Use UTC to avoid timezone issues
                          const year = parsed.getUTCFullYear();
                          const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
                          const day = String(parsed.getUTCDate()).padStart(2, '0');
                          extractedDate = `${year}-${month}-${day}`;
                          console.log(`📅 Controller: Extracted specific date from command (fallback): "${match[0]}" -> ${extractedDate}`);
                          break;
                        }
                      } catch (e) {
                        // Continue to next pattern
                      }
                    }
                  }
                  
                  // Only if no specific date found, try month/year patterns (e.g., "month of november", "november 2025", "nov 2025")
                  if (!extractedDate) {
                    // Try to match month/year patterns (e.g., "month of november", "november 2025", "nov 2025")
                    const monthYearPatterns = [
                    /month\s+of\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?/i,
                    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
                    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/i
                  ];
                  
                  for (const pattern of monthYearPatterns) {
                    const match = command.match(pattern);
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
                          console.log(`📅 Controller: Extracted month/year from command: "${match[0]}" -> ${extractedDate}`);
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
                  console.log(`📅 Controller execution: Added date: ${extractedDate}`);
                }
              }
              // Extract service type from command
              if (!result.parameters.serviceType) {
                if (lowerCommand.includes('e-sign') || lowerCommand.includes('esign') || lowerCommand.includes('e sign') || lowerCommand.includes('envelope')) {
                  result.parameters.serviceType = 'e-sign';
                  console.log('📋 Controller execution: Added serviceType: e-sign');
                } else if (lowerCommand.includes('document service')) {
                  result.parameters.serviceType = 'document';
                  console.log('📋 Controller execution: Added serviceType: document');
                }
              }
              console.log('🚀 Calling executeListSharedDocuments with parameters:', JSON.stringify(result.parameters, null, 2));
              executionResult = await this.executeListSharedDocuments(result.parameters, userId, token);
              break;
            case 'list_signed_documents':
              executionResult = await this.executeListSignedDocuments(result.parameters, userId, token);
              break;
            case 'select_document':
              executionResult = await this.executeSelectDocument(result.parameters, userId, token, conversation);
              break;
          }
        } catch (execError) {
          console.error('Error executing action:', execError);
          // Save error message to conversation
          conversation.messages.push({
            role: 'assistant',
            content: `Error: ${execError.message}`,
            action: result.action,
            parameters: result.parameters
          });
          conversation.updatedAt = new Date();
          await conversation.save();

          return res.status(500).json({
            success: false,
            message: `Error executing ${result.action}: ${execError.message}`,
            action: result.action,
            parameters: result.parameters
          });
        }

        // Store document list for list actions (so user can reference "first document", "second document", etc.)
        if (result.action === 'list_shared_documents' && executionResult?.documents) {
          conversation.lastDocumentList = executionResult.documents.map((doc, idx) => {
            // Normalize serviceType: if it's 'envelope', convert to 'e-sign-service'
            let serviceType = doc.serviceType || doc.source || 'document-service';
            if (serviceType === 'envelope') {
              serviceType = 'e-sign-service';
            }
            return {
              index: idx + 1,
              id: doc.id || doc._id,
              name: doc.name,
              category: doc.category || null,
              source: doc.source,
              serviceType: serviceType,
              docType: doc.type || 'document'
            };
          });
          console.log('💾 Stored document list in lastDocumentList:', conversation.lastDocumentList.length, 'documents');
        } else if (result.action === 'list_documents_by_category' && executionResult?.documents) {
          // Already stored in executeListDocumentsByCategory, but ensure it's there
          if (!conversation.lastDocumentList || conversation.lastDocumentList.length === 0) {
            conversation.lastDocumentList = executionResult.documents.map((doc, idx) => ({
              index: idx + 1,
              id: doc.id || doc._id,
              name: doc.name,
              category: doc.category || result.parameters?.category || null,
              source: doc.source,
              serviceType: doc.serviceType,
              docType: doc.type || 'document'
            }));
          }
        } else if (result.action === 'search_document' && executionResult?.documents) {
          conversation.lastDocumentList = executionResult.documents.map((doc, idx) => ({
            index: idx + 1,
            id: doc.documentId || doc.id || doc._id,
            name: doc.documentName || doc.name,
            category: doc.category || null,
            source: doc.source,
            serviceType: doc.serviceType || doc.source || 'document-service',
            docType: doc.documentType || doc.type || 'document'
          }));
          console.log('💾 Stored search results in lastDocumentList:', conversation.lastDocumentList.length, 'documents');
        }

        // If document was generated, store it in selectedDocument for future use
        // Generated documents are created ONLY in e-sign service, so envelopeId is the primary ID
        if (result.action === 'generate_document') {
          // Check if executionResult has envelopeId (primary case) or if the ID looks like an envelope ID
          const hasEnvelopeId = !!executionResult?.envelopeId;
          const resultId = executionResult?.envelopeId || executionResult?.documentId;
          const looksLikeEnvelopeId = resultId && /^[a-f0-9]{24}$/i.test(resultId);
          
          // Generated documents are ALWAYS in e-sign service
          if (hasEnvelopeId || looksLikeEnvelopeId || executionResult?.serviceType === 'e-sign-service') {
            conversation.selectedDocument = {
              id: executionResult.envelopeId || resultId, // Primary ID - document is in e-sign service
              name: executionResult.documentName || 'Generated Document',
              category: result.parameters?.category || 'document',
              serviceType: 'e-sign-service', // ALWAYS e-sign-service for generated documents
              docType: 'envelope',
              envelopeId: executionResult.envelopeId || resultId,
              documentId: executionResult.documentId || null // Document ID from e-sign service if available
            };
            console.log('💾 Stored generated document in selectedDocument (e-sign service):', conversation.selectedDocument);
          } else if (executionResult?.documentId) {
            // Fallback: if somehow documentId exists but envelopeId doesn't (shouldn't happen with new flow)
            // But even in fallback, if ID looks like envelope ID, treat as e-sign service
            const isEnvelopeId = /^[a-f0-9]{24}$/i.test(executionResult.documentId);
            conversation.selectedDocument = {
              id: executionResult.documentId,
              name: executionResult.documentName || 'Generated Document',
              category: result.parameters?.category || 'document',
              serviceType: isEnvelopeId ? 'e-sign-service' : 'document-service',
              docType: isEnvelopeId ? 'envelope' : 'document',
              envelopeId: isEnvelopeId ? executionResult.documentId : null,
              documentId: executionResult.documentId
            };
            console.log(`⚠️ Stored generated document in selectedDocument (${isEnvelopeId ? 'e-sign-service' : 'document-service'} - fallback):`, conversation.selectedDocument);
          }
        }

        // Auto-send: If user provided email in the original command, automatically send the document
        if (result.action === 'generate_document' && executionResult?.envelopeId && !executionResult?.needsDetails) {
          const recipientEmail = result.parameters?.recipientEmail;
          if (recipientEmail) {
            console.log('📧 Auto-sending generated document to:', recipientEmail);
            try {
              // Extract scheduling information from requirements or command
              let extractedScheduling = this.extractSchedulingFromText(result.parameters?.requirements || command);
              
              // Prepare send parameters
              const sendParameters = {
                documentId: executionResult.envelopeId,
                recipients: [{
                  email: recipientEmail,
                  name: recipientEmail.split('@')[0] // Use email prefix as name
                }],
                signatureFields: [{
                  type: 'signature',
                  page: 1,
                  position: 'bottom-right'
                }]
              };

              // Merge scheduling parameters - prioritize extracted from text, then context
              if (extractedScheduling.isScheduled) {
                sendParameters.isScheduled = true;
                sendParameters.scheduledDate = extractedScheduling.scheduledDate;
                sendParameters.scheduledTime = extractedScheduling.scheduledTime;
                console.log('📅 Extracted scheduling from requirements:', extractedScheduling);
              } else if (enhancedContext?.isScheduled) {
                sendParameters.isScheduled = enhancedContext.isScheduled;
                sendParameters.scheduledDate = enhancedContext.scheduledDate;
                sendParameters.scheduledTime = enhancedContext.scheduledTime || null;
                console.log('📅 Using scheduling from context:', enhancedContext);
              }
              
              const sendResult = await this.executeCreateAndSendEnvelope(sendParameters, userId, token, null, conversation);
              
              // Update execution result to include send information
              executionResult = {
                ...executionResult,
                autoSent: true,
                autoScheduled: sendParameters.isScheduled === true, // Track if it was scheduled
                sendResult: sendResult
              };
              
              if (sendParameters.isScheduled) {
                console.log('✅ Successfully scheduled generated document');
              } else {
                console.log('✅ Successfully auto-sent generated document');
              }
            } catch (sendError) {
              console.error('❌ Failed to auto-send document:', sendError.message);
              // Don't fail the entire request, just log the error
              executionResult.autoSendError = sendError.message;
            }
          }
        }

        // Format the result for storage
        const formattedContent = this.formatResultForStorage(result.action, executionResult, result.parameters);

        // Save formatted result to conversation (not raw JSON)
        conversation.messages.push({
          role: 'assistant',
          content: formattedContent,
          action: result.action,
          parameters: {
            ...result.parameters,
            // Store result data for frontend to reconstruct search results
            _resultData: executionResult
          }
        });
        conversation.updatedAt = new Date();
        conversation.isActive = true; // Mark as active
        // Save conversation (this will also save selectedDocument if it was set)
        await conversation.save();

        return res.json({
          success: true,
          action: result.action,
          parameters: result.parameters,
          clarification: null,
          message: formattedContent, // Include formatted message for frontend
          result: executionResult,
          conversationId: conversation._id.toString() // Return conversation ID
        });
      }

      // No action identified
      conversation.messages.push({
        role: 'assistant',
        content: result.clarification || 'I didn\'t understand that command. Please try again.',
        action: null,
        parameters: {}
      });
      conversation.updatedAt = new Date();
      conversation.isActive = true; // Mark as active
      await conversation.save();

      return res.json({
        success: true,
        action: null,
        parameters: {},
        clarification: result.clarification || 'I didn\'t understand that command. Please try again.',
        message: result.clarification || 'I didn\'t understand that command. Please try again.',
        conversationId: conversation._id.toString() // Return conversation ID
      });

    } catch (error) {
      console.error('Error processing AI command:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }

  // Execute search_document action
  async executeSearchDocument(parameters, userId, token) {
    try {
      // Extract document name from query if it looks like a specific name search
      let documentTitle = parameters.documentTitle || null;
      const query = parameters.query || '';
      
      // If query contains patterns like "envelope name X" or "document named X", extract the name
      if (!documentTitle && query) {
        const namePatterns = [
          /(?:envelope|document|file)\s+(?:name|named|called|titled)\s+["']?([^"']+)["']?/i,
          /(?:envelope|document|file)\s+["']?([^"']+)["']?/i,
          /search\s+(?:for\s+)?(?:envelope|document|file)\s+(?:name|named|called|titled)?\s*["']?([^"']+)["']?/i,
          /(?:is\s+there|find|show)\s+(?:any\s+)?(?:envelope|document|file)\s+(?:name|named|called|titled)?\s*["']?([^"']+)["']?/i
        ];
        
        for (const pattern of namePatterns) {
          const match = query.match(pattern);
          if (match && match[1]) {
            documentTitle = match[1].trim();
            console.log('📝 Extracted document name from query:', documentTitle);
            break;
          }
        }
        
        // If no pattern matched but query is short and doesn't look like a general search, use it as name
        if (!documentTitle && query.trim().length > 0 && query.trim().length < 50 && !/^(search|find|list|show|get|documents?|envelopes?|files?)$/i.test(query.trim())) {
          documentTitle = query.trim();
          console.log('📝 Using query as document name:', documentTitle);
        }
      }
      
      const searchResults = await ragService.hybridSearch({
        ...parameters,
        documentTitle: documentTitle,
        token: token
      }, userId);

      return {
        documents: searchResults,
        count: searchResults.length
      };
    } catch (error) {
      console.error('Error executing search document:', error);
      throw error;
    }
  }

  // Execute send_document action
  async executeSendDocument(parameters, userId, token) {
    try {
      const { documentId, recipients, subject, category, message } = parameters;

      if (!documentId) {
        throw new Error('Document ID is required');
      }

      if (!recipients || recipients.length === 0) {
        throw new Error('At least one recipient is required');
      }

      // Validate recipients have email
      const invalidRecipients = recipients.filter(r => !r.email);
      if (invalidRecipients.length > 0) {
        throw new Error('All recipients must have an email address');
      }

      const documentServiceUrl = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:2102';
      const eSignServiceUrl = process.env.ESIGN_SERVICE_URL || 'http://localhost:2103';

      // Try document-service first
      try {
        // Verify document exists in document-service
        await axios.get(
          `${documentServiceUrl}/api/documents/${documentId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        // Call document service to share/send document
        const shareResponse = await axios.post(
          `${documentServiceUrl}/api/documents/${documentId}/share`,
          {
            recipients: recipients.map(r => ({
              email: r.email,
              name: r.name || r.email.split('@')[0],
              permission: 'view'
            })),
            subject: subject || `Document: ${documentId}`,
            message: message || ''
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        return {
          success: true,
          message: 'Document sent successfully',
          shareId: shareResponse.data?.data?.shareId
        };
      } catch (docServiceError) {
        // If document not found in document-service, check e-sign service
        if (docServiceError.response?.status === 404 || docServiceError.response?.status === 400) {
          // console.log(`Document ${documentId} not found in document-service, checking e-sign service...`);
          
          try {
            // Check if it's an envelope ID in e-sign service
            // console.log(`Attempting to fetch envelope from e-sign service: ${documentId}`);
            const envelopeResponse = await axios.get(
              `${eSignServiceUrl}/api/e-sign/envelope/${documentId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 300000 // 10 seconds
              }
            );

            // console.log('Envelope API response:', {
            //   status: envelopeResponse.status,
            //   statusText: envelopeResponse.statusText,
            //   responseKeys: Object.keys(envelopeResponse.data || {}),
            //   hasData: !!envelopeResponse.data?.data
            // });

            // Handle different response structures
            // Response might be: { status: 'success', data: {...} } or just the envelope object directly
            const envelope = envelopeResponse.data?.data || envelopeResponse.data;
            
            // console.log('Parsed envelope:', {
            //   hasEnvelope: !!envelope,
            //   envelopeId: envelope?.id || envelope?._id,
            //   envelopeStatus: envelope?.status,
            //   hasRecipients: !!(envelope?.recipients),
            //   recipientsCount: envelope?.recipients?.length || 0
            // });
            
            if (envelope && (envelope.id || envelope._id)) {
              if (envelope.status === 'completed') {
                const existingRecipients = envelope.recipients || [];
                const existingEmails = existingRecipients.map(r => (r.email || '').toLowerCase()).filter(Boolean);
                const newRecipients = recipients.filter(r => !existingEmails.includes(r.email.toLowerCase()));

                if (newRecipients.length > 0) {
                  try {
                    await axios.post(
                      `${eSignServiceUrl}/api/e-sign/add-recipients`,
                      {
                        envelopeId: documentId,
                        recipients: newRecipients.map(r => ({
                          name: r.name || r.email.split('@')[0],
                          email: r.email,
                          role: 'signer',
                          order: 1
                        }))
                      },
                      {
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 60000 // 1 minute (increased from 30 seconds)
                      }
                    );
                    
                    // Don't try to resend - send-envelope only works for 'draft' status
                    // Completed envelopes cannot be resent and the endpoint may hang
                  } catch (addError) {
                    console.warn('Could not add recipients to completed envelope:', addError.message);
                  }
                }

                return {
                  success: true,
                  message: `This envelope is already completed. ${newRecipients.length > 0 ? 'Attempted to add new recipients.' : 'All recipients have already been notified.'}`,
                  envelopeId: documentId,
                  recipients: recipients.length,
                  status: 'completed',
                  note: 'Completed envelopes cannot be resent. If you need to send to new recipients, please create a new envelope.'
                };
              } else if (envelope.status === 'in-progress' || envelope.status === 'sent') {
                // Envelope is in progress or sent, try to add recipients and resend
                const existingRecipients = envelope.recipients || [];
                const existingEmails = existingRecipients.map(r => (r.email || '').toLowerCase()).filter(Boolean);
                const newRecipients = recipients.filter(r => !existingEmails.includes(r.email.toLowerCase()));

                if (newRecipients.length > 0) {
                  // Add new recipients
                  await axios.post(
                    `${eSignServiceUrl}/api/e-sign/add-recipients`,
                    {
                      envelopeId: documentId,
                      recipients: newRecipients.map(r => ({
                        name: r.name || r.email.split('@')[0],
                        email: r.email,
                        role: 'signer',
                        order: 1
                      }))
                    },
                    {
                      headers: { Authorization: `Bearer ${token}` },
                      timeout: 60000 // 1 minute (increased from 30 seconds)
                    }
                  );
                }

                // Don't try to resend - send-envelope only works for 'draft' status
                // In-progress/sent envelopes cannot be resent via this endpoint
                return {
                  success: true,
                  message: `Envelope is ${envelope.status}. ${newRecipients.length > 0 ? `Added ${newRecipients.length} new recipient(s).` : 'All recipients already exist.'} Note: Only draft envelopes can be sent.`,
                  envelopeId: documentId,
                  recipients: recipients.length,
                  status: envelope.status
                };
              } else if (envelope.status === 'draft') {
                // Envelope is in draft, add recipients and send
                await axios.post(
                  `${eSignServiceUrl}/api/e-sign/add-recipients`,
                  {
                    envelopeId: documentId,
                    recipients: recipients.map(r => ({
                      name: r.name || r.email.split('@')[0],
                      email: r.email,
                      role: 'signer',
                      order: 1
                    }))
                  },
                  {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 300000 // 5MIN
                  }
                );

                // Send the envelope
                await axios.post(
                  `${eSignServiceUrl}/api/e-sign/send-envelope/${documentId}`,
                  {},
                  {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 300000// 5 minute
                  }
                );

                return {
                  success: true,
                  message: 'Envelope sent successfully',
                  envelopeId: documentId,
                  recipients: recipients.length
                };
              }
            } else {
              console.error('Envelope response validation failed:', {
                hasEnvelope: !!envelope,
                envelopeType: typeof envelope,
                envelopeKeys: envelope ? Object.keys(envelope) : null,
                hasId: !!(envelope?.id || envelope?._id),
                responseData: envelopeResponse.data
              });
              throw new Error('Envelope not found or invalid response structure from e-sign service');
            }
          } catch (eSignError) {
            console.error('Error with e-sign service:', eSignError);
            console.error('E-sign error details:', {
              status: eSignError.response?.status,
              statusText: eSignError.response?.statusText,
              data: eSignError.response?.data,
              message: eSignError.message,
              url: eSignError.config?.url
            });
            
            // If it's a 404, the envelope doesn't exist or user doesn't have access
            if (eSignError.response?.status === 404) {
              throw new Error(`Envelope not found or you don't have access to it. Document ID: ${documentId}`);
            }
            
            // If it's a 403, user doesn't have permission
            if (eSignError.response?.status === 403) {
              throw new Error(`You don't have permission to access this envelope. Document ID: ${documentId}`);
            }
            
            // If both fail, throw a clear error
            throw new Error(`Document not found in document-service or e-sign service. Document ID: ${documentId}. Error: ${eSignError.message || eSignError.response?.data?.message || 'Unknown error'}`);
          }
        } else {
          // Re-throw other errors
          throw docServiceError;
        }
      }
    } catch (error) {
      console.error('Error executing send document:', error);
      throw error;
    }
  }

  // Execute prepare_document action
  async executePrepareDocument(parameters, userId, token) {
    try {
      const { documentId, fields } = parameters;

      if (!documentId) {
        throw new Error('Document ID is required');
      }

      if (!fields || fields.length === 0) {
        throw new Error('At least one field is required');
      }

      // This would typically call the e-sign service to prepare the document
      // For now, return a structured response
      return {
        success: true,
        message: 'Document preparation initiated',
        documentId,
        fields: fields.length,
        nextSteps: [
          'Document fields have been identified',
          'Please review and adjust field positions if needed',
          'Send the document to recipients when ready'
        ]
      };
    } catch (error) {
      console.error('Error executing prepare document:', error);
      throw error;
    }
  }

  // Build clarification message for missing signature fields and optional auth providers
  async buildSignatureAndAuthClarificationMessage(token) {
    let authProvidersText = 'Authentication providers are optional. You can choose to apply one or multiple methods for extra verification.';

    try {
      if (token) {
        const subscriptionServiceUrl = process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:2110';
        const resp = await axios.get(
          `${subscriptionServiceUrl}/user/available/auth/methods`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 30000
          }
        );

        const methods = resp.data?.data?.methods || [];
        if (methods.length > 0) {
          const lines = methods.map((m, index) => {
            const cost = Number(m.cost ?? m.defaultCredits ?? 0);
            const costPart = Number.isFinite(cost) && cost > 0 ? ` (~${cost} credits)` : '';
            return `${index + 1}. ${m.name}${costPart}`;
          });

          authProvidersText =
            'Here are the authentication providers available in your plan:\n' +
            lines.join('\n') +
            '\n\nYou can reply with the names of the methods you want to apply (for example: "Email Verification and SMS Verification"), or say "no authentication".';
        }
      }
    } catch (error) {
      console.error('Error fetching auth providers for clarification:', error);
      // Fallback text if subscription-service is not reachable
      authProvidersText =
        'I could not retrieve the list of authentication providers right now, but you can still say things like "apply email verification", "apply SMS verification", or "no authentication".';
    }

    const clarification =
      'To send a document for signing, at least one signature field is required.\n\n' +
      'Please reply with where to place the signature field(s). For example:\n' +
      '- "Add a signature at the bottom-right of page 1"\n' +
      '- "Add signature fields for each recipient on page 1 at the bottom"\n\n' +
      authProvidersText;

    return clarification;
  }

  // Build clarification message when a non-PDF file is attached for sending
  buildNonPdfSendClarificationMessage(uploadedFile) {
    const originalName = uploadedFile?.originalname || 'your file';
    const mimeType = uploadedFile?.mimetype || '';
    const lowerName = originalName.toLowerCase();

    let toolPath = '/pdf-tools';
    let fileDescription = 'this file';

    const extMatch = lowerName.match(/\.([a-z0-9]+)$/);
    const ext = extMatch ? extMatch[1] : '';

    const isWord =
      mimeType.includes('msword') ||
      mimeType.includes('wordprocessingml') ||
      ext === 'doc' ||
      ext === 'docx';

    const isExcel =
      mimeType.includes('ms-excel') ||
      mimeType.includes('spreadsheet') ||
      ext === 'xls' ||
      ext === 'xlsx' ||
      ext === 'csv';

    const isPowerPoint =
      mimeType.includes('powerpoint') ||
      mimeType.includes('presentation') ||
      ext === 'ppt' ||
      ext === 'pptx';

    const isImage =
      mimeType.startsWith('image/') ||
      ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);

    const isText =
      mimeType.startsWith('text/plain') ||
      ext === 'txt';

    const isHtml =
      mimeType.includes('html') ||
      ext === 'html' ||
      ext === 'htm';

    if (isWord) {
      toolPath = '/pdf-tools/word-to-pdf';
      fileDescription = 'a Word document';
    } else if (isExcel) {
      toolPath = '/pdf-tools/excel-to-pdf';
      fileDescription = 'an Excel spreadsheet';
    } else if (isPowerPoint) {
      toolPath = '/pdf-tools/powerpoint-to-pdf';
      fileDescription = 'a PowerPoint presentation';
    } else if (isImage) {
      toolPath = '/pdf-tools/img-to-pdf';
      fileDescription = 'an image file';
    } else if (isText) {
      toolPath = '/pdf-tools/text-to-pdf';
      fileDescription = 'a text file';
    } else if (isHtml) {
      toolPath = '/pdf-tools/html-to-pdf';
      fileDescription = 'an HTML file';
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const conversionUrl = `${baseUrl}${toolPath}`;

    const clarification =
      `Only PDF files can be sent for e-signing.\n\n` +
      `You uploaded ${fileDescription} named "${originalName}".\n\n` +
      `Please convert this file to PDF first using our PDF tools:\n` +
      `${conversionUrl}\n\n` +
      `After converting, upload the new PDF here and then I can help you place signature fields and send it for signing.`;

    return clarification;
  }

  // Execute list_auth_providers action
  async executeListAuthProviders(userId, token) {
    try {
      if (!token) {
        throw new Error('Authentication token is required to list auth providers');
      }

      const subscriptionServiceUrl = process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:2110';
      // console.log('AI Assistant fetching auth providers from:', subscriptionServiceUrl);

      const resp = await axios.get(
        `${subscriptionServiceUrl}/user/available/auth/methods`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );

      const methods = resp.data?.data?.methods || [];

      const providers = methods.map(m => ({
        id: String(m.id || m._id),
        name: m.name,
        description: m.description || null,
        cost: Number(m.cost ?? m.defaultCredits ?? 0),
        securityLevel: m.uiSchema?.securityLevel || null,
        estimatedTime: m.uiSchema?.estimatedTime || null,
        compliance: m.uiSchema?.compliance || [],
        isRecommended: !!m.isRecommended
      }));

      return {
        success: true,
        count: providers.length,
        providers
      };
    } catch (error) {
      console.error('Error executing list_auth_providers:', error);
      throw error;
    }
  }

  // Execute create_and_send_envelope action - Complete envelope creation and sending
  async executeCreateAndSendEnvelope(parameters, userId, token, uploadedFile = null, conversation = null) {
    try {
      let { documentId, recipients, signatureFields, subject, message, scheduledDate, scheduledTime, isScheduled } = parameters;
      
      // Normalize and parse scheduling parameters
      // If scheduledDate exists but isScheduled is not explicitly set, set it to true
      if (scheduledDate && scheduledDate.trim() !== '' && isScheduled !== true) {
        isScheduled = true;
        console.log('📅 Auto-setting isScheduled=true because scheduledDate is provided');
      }
      
      // Parse "today" to actual date if needed
      if (scheduledDate && typeof scheduledDate === 'string') {
        const lowerDate = scheduledDate.toLowerCase().trim();
        if (lowerDate === 'today') {
          const today = new Date();
          scheduledDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
          console.log('📅 Converted "today" to:', scheduledDate);
        }
      }
      
      // Normalize time format (convert PM/AM to 24-hour if needed)
      if (scheduledTime && typeof scheduledTime === 'string') {
        const timeStr = scheduledTime.trim().toUpperCase();
        // Check if it's in 12-hour format with AM/PM
        const pmMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*PM/i);
        const amMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*AM/i);
        
        if (pmMatch) {
          let hours = parseInt(pmMatch[1]);
          const minutes = pmMatch[2];
          if (hours !== 12) hours += 12; // Convert PM to 24-hour (except 12 PM)
          scheduledTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
          console.log('📅 Converted PM time to 24-hour:', scheduledTime);
        } else if (amMatch) {
          let hours = parseInt(amMatch[1]);
          const minutes = amMatch[2];
          if (hours === 12) hours = 0; // 12 AM = 00:xx
          scheduledTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
          console.log('📅 Converted AM time to 24-hour:', scheduledTime);
        }
      }
      
      // Debug logging for scheduling
      console.log('📅 Scheduling check:', {
        isScheduled,
        scheduledDate,
        scheduledTime,
        hasScheduledDate: !!scheduledDate,
        hasScheduledTime: !!scheduledTime,
        parameters: JSON.stringify({ isScheduled, scheduledDate, scheduledTime })
      });
      
      // Safety check: If recipients are missing or invalid, try to extract from parameters or throw clear error
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0 || !recipients.some(r => r.email)) {
        console.warn('⚠️ Recipients missing or invalid in executeCreateAndSendEnvelope:', {
          recipients,
          parameters: JSON.stringify(parameters, null, 2)
        });
        throw new Error('At least one recipient with a valid email address is required. Please provide recipient email address(es).');
      }

      // Normalise uploadedFile to an array so we can support multiple uploads
      const uploadedFilesArray = Array.isArray(uploadedFile) ? uploadedFile : (uploadedFile ? [uploadedFile] : []);

      // Debug logging
      // console.log(
      //   'executeCreateAndSendEnvelope - uploadedFiles:',
      //   uploadedFilesArray.length
      //     ? uploadedFilesArray.map(f => ({
      //         originalname: f.originalname,
      //         path: f.path,
      //         size: f.size,
      //         exists: f.path ? require('fs').existsSync(f.path) : false
      //       }))
      //     : 'none'
      // );
      // console.log('executeCreateAndSendEnvelope - documentId:', documentId);
      // console.log('executeCreateAndSendEnvelope - parameters:', JSON.stringify(parameters, null, 2));

      const hasValidUploadedFile =
        uploadedFilesArray.length > 0 &&
        uploadedFilesArray.some(f => (f.path || f.buffer) && f.originalname);

      // If file is uploaded, documentId is not required
      if (!documentId && !hasValidUploadedFile) {
        console.error('Error: Neither documentId nor valid uploadedFile provided');
        console.error('documentId:', documentId);
        console.error('uploadedFile:', uploadedFile);
        console.error('uploadedFile type:', typeof uploadedFile);
        console.error('uploadedFile keys:', uploadedFile ? Object.keys(uploadedFile) : 'null');
        throw new Error('Document ID or file attachment is required');
      }

      if (!recipients || recipients.length === 0) {
        throw new Error('At least one recipient is required');
      }

      // Validate recipients have email
      const invalidRecipients = recipients.filter(r => !r.email);
      if (invalidRecipients.length > 0) {
        throw new Error('All recipients must have an email address');
      }

      const documentServiceUrl = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:2102';
      const eSignServiceUrl = process.env.ESIGN_SERVICE_URL || 'http://localhost:2103';
      // IMPORTANT: default to localhost like the frontend; production should override via SUBSCRIPTION_SERVICE_URL env.
      const subscriptionServiceUrl = process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:2110';
      // console.log('AI Assistant subscriptionServiceUrl:', subscriptionServiceUrl);

      // --- Resolve authentication methods for recipients (auth providers) and estimate credits ---
      // Map of recipientEmail(lowercase) -> { providerIds: string[], methods: any[], credits: number }
      const recipientsAuthInfo = new Map();
      let availableAuthMethods = [];

      const hasAuthRequested = Array.isArray(recipients) && recipients.some(r =>
        (Array.isArray(r?.authMethods) && r.authMethods.length > 0) ||
        (typeof r?.authentication === 'string' && r.authentication.trim().length > 0)
      );

      if (hasAuthRequested && token) {
        try {
          const authResp = await axios.get(
            `${subscriptionServiceUrl}/user/available/auth/methods`,
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 30000
            }
          );

          availableAuthMethods = authResp.data?.data?.methods || [];
          // console.log(
          //   'AI Assistant availableAuthMethods:',
          //   availableAuthMethods.map(m => ({
          //     id: String(m.id || m._id),
          //     name: m.name,
          //     cost: m.cost ?? m.defaultCredits ?? 0
          //   }))
          // );

          const costById = {};
          const methodById = {};
          const methodsByLowerName = {};

          for (const m of availableAuthMethods) {
            const id = String(m.id || m._id);
            const cost = Number(m.cost ?? m.defaultCredits ?? 0);
            costById[id] = Number.isFinite(cost) ? cost : 0;
            methodById[id] = m;
            if (typeof m.name === 'string') {
              methodsByLowerName[m.name.toLowerCase()] = m;
            }
          }

          const parseAuthenticationString = (authValue) => {
            if (!authValue || typeof authValue !== 'string') return [];
            try {
              const parsed = JSON.parse(authValue);
              if (Array.isArray(parsed)) return parsed.map(v => String(v));
              return [String(authValue)];
            } catch {
              return [String(authValue)];
            }
          };

          const looksLikeObjectId = (val) =>
            typeof val === 'string' && /^[a-f0-9]{24}$/i.test(val.trim());

          const matchMethodLabelToId = (label) => {
            if (!label || typeof label !== 'string') return null;
            const trimmed = label.trim();
            if (!trimmed) return null;

            // If it already looks like an ObjectId, trust it
            if (looksLikeObjectId(trimmed) && methodById[trimmed]) {
              return trimmed;
            }

            const lower = trimmed.toLowerCase();

            // Exact name match first
            const exact = methodsByLowerName[lower];
            if (exact) return String(exact.id || exact._id);

            // Special-case mapping for common phrases used in AI prompts
            // "Email OTP" -> provider whose name contains "email"
            if (lower.includes('email') && lower.includes('otp')) {
              const emailMethod = availableAuthMethods.find(m => {
                const n = (m.name || '').toString().toLowerCase();
                return n.includes('email');
              });
              if (emailMethod) return String(emailMethod.id || emailMethod._id);
            }

            // "SMS OTP" -> provider whose name contains "sms"
            if ((lower.includes('sms') || lower.includes('text')) && lower.includes('otp')) {
              const smsMethod = availableAuthMethods.find(m => {
                const n = (m.name || '').toString().toLowerCase();
                return n.includes('sms');
              });
              if (smsMethod) return String(smsMethod.id || smsMethod._id);
            }

            // Fuzzy 1: contains / contained-in match on raw strings
            const fuzzy1 = availableAuthMethods.find(m => {
              const n = (m.name || '').toString().toLowerCase();
              return n && (n.includes(lower) || lower.includes(n));
            });
            if (fuzzy1) return String(fuzzy1.id || fuzzy1._id);

            // Fuzzy 2: token-based match (handles phrases like "Email OTP" vs "Email Authentication (OTP)")
            const labelTokens = lower.split(/[^a-z0-9]+/).filter(Boolean);
            const bestTokenMatch = availableAuthMethods.find(m => {
              const n = (m.name || '').toString().toLowerCase();
              if (!n) return false;
              const nameTokens = n.split(/[^a-z0-9]+/).filter(Boolean);
              if (nameTokens.length === 0) return false;
              // Require all label tokens to appear somewhere in the method name tokens
              return labelTokens.every(t => nameTokens.includes(t));
            });
            if (bestTokenMatch) return String(bestTokenMatch.id || bestTokenMatch._id);

            console.warn('AI Assistant could not map auth label to providerId:', {
              label,
              availableNames: availableAuthMethods.map(m => m.name)
            });

            return null;
          };

          for (const r of recipients) {
            if (!r || !r.email) continue;
            const emailKey = r.email.toLowerCase();
            const authIds = new Set();

            // 1) Existing "authentication" field from caller (could be JSON string of ids)
            if (typeof r.authentication === 'string' && r.authentication.trim().length > 0) {
              const rawAuthItems = parseAuthenticationString(r.authentication);
              for (const raw of rawAuthItems) {
                const id = matchMethodLabelToId(raw);
                if (id) authIds.add(id);
              }
            }

            // 2) New "authMethods" names coming from LLM (array of strings)
            if (Array.isArray(r.authMethods)) {
              for (const label of r.authMethods) {
                const id = matchMethodLabelToId(label);
                if (id) authIds.add(id);
              }
            }

            const providerIds = Array.from(authIds);
            if (providerIds.length > 0) {
              const methods = providerIds
                .map(id => methodById[id])
                .filter(Boolean);
              const credits = providerIds.reduce(
                (sum, id) => sum + (costById[id] || 0),
                0
              );

              recipientsAuthInfo.set(emailKey, {
                providerIds,
                methods,
                credits
              });
            }
          }

          // console.log(
          //   'AI Assistant resolved auth providers for recipients:',
          //   Array.from(recipientsAuthInfo.entries()).map(([email, info]) => ({
          //     email,
          //     providerIds: info.providerIds,
          //     credits: info.credits
          //   }))
          // );
        } catch (authErr) {
          console.error('Error resolving auth providers for AI envelope:', {
            message: authErr.message,
            status: authErr.response?.status,
            data: authErr.response?.data
          });
          // If auth provider resolution fails, continue without auth / credits
        }
      }

      let document = null;
      let fileBuffer = null;
      let documentName = 'document.pdf';
      let isFromESign = false;
      let isUploadedFile = false;

      // Step 0: Check if file was uploaded
      if (hasValidUploadedFile) {
        // Use the first uploaded file directly (for backward-compatible single-file flow)
        const fs = require('fs');
        const primaryFile = uploadedFilesArray[0];
        if (primaryFile.buffer) {
          // File is in memory (buffer)
          fileBuffer = primaryFile.buffer;
        } else if (primaryFile.path) {
          // File is on disk
          fileBuffer = fs.readFileSync(primaryFile.path);
        } else {
          throw new Error('Uploaded file has no path or buffer');
        }
        documentName = primaryFile.originalname;
        isUploadedFile = true;
        // console.log('Using uploaded file (for metadata & preview):', documentName);
      } else if (documentId) {
        // Check if this is a generated document (from conversation context) or looks like an envelope ID
        // Generated documents are ONLY in e-sign service, never in document service
        // Check if this is a generated document
        // It's a generated document if:
        // 1. The selectedDocument has envelopeId matching documentId
        // 2. The selectedDocument has serviceType === 'e-sign-service' and id matches documentId
        // 3. The documentId matches the selectedDocument.id and it's from e-sign service
        // 4. The documentId matches selectedDocument.id AND documentId looks like an envelope ID (MongoDB ObjectId)
        //    AND there's a selectedDocument (meaning it was just generated)
        const selectedDoc = conversation?.selectedDocument;
        const docIdMatches = selectedDoc?.id === documentId;
        const looksLikeEnvelopeId = /^[a-f0-9]{24}$/i.test(documentId);
        
        // If documentId looks like a MongoDB ObjectId (24 hex chars), it's from e-sign service
        // This is the primary indicator - MongoDB ObjectIds are used by e-sign service
        const isFromESignService = looksLikeEnvelopeId;
        
        const isGeneratedDocument = (selectedDoc?.envelopeId === documentId) || 
                                    (docIdMatches && selectedDoc?.serviceType === 'e-sign-service') ||
                                    (docIdMatches && selectedDoc?.docType === 'envelope') ||
                                    (docIdMatches && looksLikeEnvelopeId && selectedDoc) || // If ID matches and looks like envelope ID, assume it's generated
                                    (looksLikeEnvelopeId); // If it looks like envelope ID, it's from e-sign service
        
        // Always check e-sign service if it looks like an envelope ID (MongoDB ObjectId)
        const shouldOnlyCheckESign = isGeneratedDocument || looksLikeEnvelopeId || isFromESignService;
        
        console.log('🔍 Document lookup:', {
          documentId,
          isGeneratedDocument,
          looksLikeEnvelopeId,
          isFromESignService,
          shouldOnlyCheckESign,
          selectedDocument: conversation?.selectedDocument,
          selectedDocServiceType: conversation?.selectedDocument?.serviceType,
          selectedDocDocType: conversation?.selectedDocument?.docType
        });
        
        // Step 1: Try e-sign service first if it's a generated document or looks like an envelope ID
        if (shouldOnlyCheckESign) {
          // Fix selectedDocument serviceType if it's wrong (should be e-sign-service for envelope IDs)
          if (looksLikeEnvelopeId && conversation?.selectedDocument && conversation.selectedDocument.serviceType !== 'e-sign-service') {
            console.log('🔧 Fixing selectedDocument serviceType from', conversation.selectedDocument.serviceType, 'to e-sign-service');
            conversation.selectedDocument.serviceType = 'e-sign-service';
            conversation.selectedDocument.docType = 'envelope';
            conversation.selectedDocument.envelopeId = documentId;
            // Save the fix
            await conversation.save().catch(err => console.warn('Failed to save conversation after fixing serviceType:', err));
          }
          
          // For generated documents, we can use the existing envelope directly without downloading/re-uploading
          if ((isGeneratedDocument || looksLikeEnvelopeId) && !hasValidUploadedFile) {
            console.log('✅ Using existing generated envelope directly, skipping file download/upload');
            // Set fileBuffer to null - we'll skip the upload step and use the existing envelope
            fileBuffer = null;
            documentName = conversation?.selectedDocument?.name || 'document.pdf';
            isFromESign = true;
          } else {
            // For non-generated documents or when file is uploaded, fetch envelope and download file
            try {
              const envelopeResponse = await axios.get(
                `${eSignServiceUrl}/api/e-sign/envelope/${documentId}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                  timeout: 30000 // Increased timeout
                }
              );

              const envelope = envelopeResponse.data?.data || envelopeResponse.data;
              
              console.log('📋 Envelope response structure:', {
                hasEnvelope: !!envelope,
                hasId: !!(envelope?.id || envelope?._id),
                hasDocuments: !!(envelope?.documents && envelope.documents.length > 0),
                documentsCount: envelope?.documents?.length || 0,
                documentIdsCount: envelope?.documentIds?.length || 0,
                firstDocument: envelope?.documents?.[0] ? {
                  id: envelope.documents[0]._id || envelope.documents[0].id,
                  name: envelope.documents[0].name || envelope.documents[0].fileName,
                  filePath: envelope.documents[0].filePath,
                  allKeys: Object.keys(envelope.documents[0])
                } : null,
                envelopeKeys: envelope ? Object.keys(envelope) : []
              });
              
              if (envelope && (envelope.id || envelope._id)) {
                // Check if envelope has documents array
                if (envelope.documents && envelope.documents.length > 0) {
                  const eSignDoc = envelope.documents[0];
                  documentName = eSignDoc.name || eSignDoc.fileName || envelope.subject || 'document.pdf';
                  isFromESign = true;
                  
                  // Get document file from e-sign service
                  const fs = require('fs');
                  const path = require('path');
                  
                  // Try multiple methods to get the document
                  let fileFound = false;
                  
                  // Method 1: Try download endpoint with document ID
                  // Use documentId from selectedDocument if available, otherwise use from envelope
                  const docId = conversation?.selectedDocument?.documentId || eSignDoc._id || eSignDoc.id;
                  console.log('🔍 Attempting to get document with ID:', docId, 'from envelope:', documentId);
                  console.log('📋 Document info:', {
                    fromSelectedDocument: !!conversation?.selectedDocument?.documentId,
                    fromEnvelope: !!(eSignDoc._id || eSignDoc.id),
                    eSignDocKeys: Object.keys(eSignDoc)
                  });
                  
                  if (docId) {
                    // Try multiple download endpoint variations
                    const downloadEndpoints = [
                      `${eSignServiceUrl}/api/e-sign/signatures/download/${docId}`,
                      `${eSignServiceUrl}/api/e-sign/document/${docId}/download`,
                      `${eSignServiceUrl}/api/e-sign/documents/${docId}/download`,
                      `${eSignServiceUrl}/api/e-sign/envelope/${documentId}/document/${docId}/download`
                    ];
                    
                    for (const endpoint of downloadEndpoints) {
                      try {
                        console.log(`📥 Trying download endpoint: ${endpoint}`);
                        const downloadResponse = await axios.get(
                          endpoint,
                          {
                            headers: { Authorization: `Bearer ${token}` },
                            responseType: 'arraybuffer',
                            timeout: 120000
                          }
                        );
                        fileBuffer = downloadResponse.data;
                        fileFound = true;
                        console.log(`✅ Got document via download endpoint: ${endpoint}`);
                        break;
                      } catch (downloadError) {
                        const status = downloadError.response?.status;
                        const message = downloadError.response?.data?.message || downloadError.message;
                        console.log(`⚠️ Download endpoint ${endpoint} failed:`, status || message);
                      }
                    }
                    
                    if (!fileFound) {
                      console.log('⚠️ All download endpoints failed, trying file path');
                    }
                  } else {
                    console.log('⚠️ No document ID available to download');
                  }
                  
                  // Method 2: Try reading from filePath if available
                  if (!fileFound && eSignDoc.filePath) {
                    const possiblePaths = [
                      eSignDoc.filePath,
                      path.join(__dirname, '../../../e-sign-service/uploads', eSignDoc.filePath),
                      path.join(__dirname, '../../e-sign-service/uploads', eSignDoc.filePath),
                      path.join(process.cwd(), 'Backend/services/e-sign-service/uploads', eSignDoc.filePath),
                      path.join(process.cwd(), 'uploads', eSignDoc.filePath)
                    ];

                    for (const filePath of possiblePaths) {
                      try {
                        if (fs.existsSync(filePath)) {
                          fileBuffer = fs.readFileSync(filePath);
                          fileFound = true;
                          console.log('✅ Got document from file path:', filePath);
                          break;
                        }
                      } catch (e) {
                        // Continue to next path
                      }
                    }
                  }
                  
                  // Method 3: Try envelope download endpoint as fallback
                  if (!fileFound) {
                    try {
                      const envelopeDownloadResponse = await axios.get(
                        `${eSignServiceUrl}/api/e-sign/envelope/${documentId}/download`,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                          responseType: 'arraybuffer',
                          timeout: 120000
                        }
                      );
                      fileBuffer = envelopeDownloadResponse.data;
                      fileFound = true;
                      console.log('✅ Got document via envelope download endpoint');
                    } catch (envelopeDownloadError) {
                      console.log('⚠️ Envelope download endpoint also failed:', envelopeDownloadError.message);
                    }
                  }
                  
                  // Method 4: Try document download endpoint with envelope ID
                  if (!fileFound && docId) {
                    try {
                      const docDownloadResponse = await axios.get(
                        `${eSignServiceUrl}/api/e-sign/document/${docId}/download`,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                          responseType: 'arraybuffer',
                          timeout: 120000
                        }
                      );
                      fileBuffer = docDownloadResponse.data;
                      fileFound = true;
                      console.log('✅ Got document via document download endpoint');
                    } catch (docDownloadError) {
                      console.log('⚠️ Document download endpoint also failed:', docDownloadError.message);
                    }
                  }
                  
                  // Removed regeneration fallback - it causes duplicate envelopes and file path issues
                  
                  if (!fileFound) {
                    const errorMsg = eSignDoc.filePath 
                      ? `Cannot access document file. File path: ${eSignDoc.filePath}. Please ensure the file is accessible.`
                      : 'Document file path not found in e-sign service. The document may not have been properly saved.';
                    throw new Error(errorMsg);
                  }
                } else {
                  // Envelope exists but has no documents - this might be a newly created envelope
                  // For generated documents, the document should exist, so this is an error
                  throw new Error(`Envelope found but has no documents. Envelope ID: ${documentId}. The document may not have been properly uploaded.`);
                }
                
                // Successfully got document from e-sign service, skip document service
              } else {
                throw new Error(`Envelope not found. Envelope ID: ${documentId}`);
              }
            } catch (eSignError) {
              // For generated documents or envelope IDs, ONLY check e-sign service - never fall back to document service
              console.error(`❌ Error fetching from e-sign service:`, {
                documentId,
                isGeneratedDocument,
                looksLikeEnvelopeId,
                status: eSignError.response?.status,
                message: eSignError.message,
                data: eSignError.response?.data
              });
              
              // Always throw error for generated documents/envelope IDs - don't try document service
              if (eSignError.response?.status === 404) {
                throw new Error(`Envelope not found in e-sign service. Document ID: ${documentId}. Please verify the envelope exists.`);
              }
              
              // For other errors, also throw (don't fall back to document service for envelope IDs)
              const errorMessage = eSignError.response?.data?.message || eSignError.message || 'Unknown error';
              throw new Error(`Failed to fetch envelope from e-sign service. Document ID: ${documentId}. Error: ${errorMessage}`);
            }
          }
        }
        
        // Step 2: If not a generated document/envelope ID, try document-service
        if (!fileBuffer && !shouldOnlyCheckESign) {
          try {
            const docResponse = await axios.get(
              `${documentServiceUrl}/api/documents/${documentId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000
              }
            );

            document = docResponse.data?.data;
            if (document) {
              documentName = document.name || document.title || 'document.pdf';
              
              const fileResponse = await axios.get(
                `${documentServiceUrl}/api/documents/${documentId}/download`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                  responseType: 'arraybuffer',
                  timeout: 120000
                }
              );
              fileBuffer = fileResponse.data;
            }
          } catch (docServiceError) {
            // If document not found in document-service and we haven't tried e-sign service yet, try it
            if (docServiceError.response?.status === 404 && !looksLikeEnvelopeId) {
              try {
                const envelopeResponse = await axios.get(
                  `${eSignServiceUrl}/api/e-sign/envelope/${documentId}`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 10000
                  }
                );

                const envelope = envelopeResponse.data?.data || envelopeResponse.data;
                
                if (envelope && (envelope.id || envelope._id) && envelope.documents && envelope.documents.length > 0) {
                  const eSignDoc = envelope.documents[0];
                  documentName = eSignDoc.name || eSignDoc.fileName || envelope.subject || 'document.pdf';
                  isFromESign = true;
                  
                  const fs = require('fs');
                  const path = require('path');
                  
                  try {
                    const downloadResponse = await axios.get(
                      `${eSignServiceUrl}/api/e-sign/signatures/download/${eSignDoc._id || eSignDoc.id}`,
                      {
                        headers: { Authorization: `Bearer ${token}` },
                        responseType: 'arraybuffer',
                        timeout: 120000
                      }
                    );
                    fileBuffer = downloadResponse.data;
                  } catch (downloadError) {
                    if (eSignDoc.filePath) {
                      const possiblePaths = [
                        eSignDoc.filePath,
                        path.join(__dirname, '../../../e-sign-service/uploads', eSignDoc.filePath),
                        path.join(__dirname, '../../e-sign-service/uploads', eSignDoc.filePath),
                        path.join(process.cwd(), 'Backend/services/e-sign-service/uploads', eSignDoc.filePath)
                      ];

                      let fileFound = false;
                      for (const filePath of possiblePaths) {
                        try {
                          if (fs.existsSync(filePath)) {
                            fileBuffer = fs.readFileSync(filePath);
                            fileFound = true;
                            break;
                          }
                        } catch (e) {
                          // Continue to next path
                        }
                      }

                      if (!fileFound) {
                        throw new Error(`Cannot access document file. File path: ${eSignDoc.filePath}. Please ensure the file is accessible.`);
                      }
                    } else {
                      throw new Error('Document file path not found in e-sign service');
                    }
                  }
                } else {
                  throw new Error(`Envelope found but has no documents. Envelope ID: ${documentId}`);
                }
              } catch (eSignError) {
                console.error('Error fetching from e-sign service (create_and_send):', eSignError);
                console.error('E-sign error details:', {
                  status: eSignError.response?.status,
                  statusText: eSignError.response?.statusText,
                  data: eSignError.response?.data,
                  message: eSignError.message,
                  url: eSignError.config?.url,
                  stack: eSignError.stack
                });
                
                if (eSignError.response?.status === 404) {
                  throw new Error(`Envelope not found or you don't have access to it. Document ID: ${documentId}. Please verify you have access to this envelope.`);
                }
                
                if (eSignError.response?.status === 403) {
                  throw new Error(`You don't have permission to access this envelope. Document ID: ${documentId}`);
                }
                
                if (eSignError.response?.status === 401) {
                  throw new Error(`Authentication failed. Please check your access token.`);
                }
                
                const errorMessage = eSignError.response?.data?.message || eSignError.message || 'Unknown error';
                throw new Error(`Document not found in document-service or e-sign service. Document ID: ${documentId}. Error: ${errorMessage}`);
              }
            } else {
              throw docServiceError;
            }
          }
        } // Close the else if (documentId) block
      } else {
        // No documentId and no uploaded file
        throw new Error('No document provided. Please attach a file or provide a document ID.');
      }

      // Step 2: Create envelope in e-sign service OR use existing envelope for generated documents
      // For generated documents or documents that look like envelope IDs, use documentId as envelopeId
      // MongoDB ObjectId format (24 hex chars) indicates it's from e-sign service
      const looksLikeEnvelopeId = /^[0-9a-fA-F]{24}$/.test(documentId);
      const isFromESignService = looksLikeEnvelopeId || 
                                  (conversation?.selectedDocument?.serviceType === 'e-sign-service') ||
                                  (conversation?.selectedDocument?.docType === 'envelope') ||
                                  (conversation?.selectedDocument?.envelopeId === documentId);
      
      let envelopeId = isFromESignService ? documentId : null; // Use documentId as envelopeId if it's from e-sign service
      
      console.log('📦 Envelope ID determination:', {
        documentId,
        looksLikeEnvelopeId,
        isFromESignService,
        envelopeId,
        selectedDocServiceType: conversation?.selectedDocument?.serviceType,
        selectedDocDocType: conversation?.selectedDocument?.docType
      });
      
      // Only upload/create envelope if we have a file to upload
      if (fileBuffer || hasValidUploadedFile) {
        if (!fileBuffer && !hasValidUploadedFile) {
          throw new Error('Could not retrieve document file');
        }

        const FormData = require('form-data');
        const fs = require('fs');
        const path = require('path');
        const os = require('os');

        const formData = new FormData();

        // If the user uploaded multiple files via AI, stream all of them.
        // Otherwise, fall back to the single-file buffer flow.
        if (hasValidUploadedFile && Array.isArray(uploadedFilesArray) && uploadedFilesArray.length > 0) {
          const tempDir = path.join(__dirname, '..', 'uploads', 'temp-ai-multi');
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }

          uploadedFilesArray.forEach((file) => {
            const docName = file.originalname || 'document.pdf';
            const tempFilePath = path.join(tempDir, `${Date.now()}-${docName}`);
            fs.copyFileSync(file.path, tempFilePath);
            formData.append('files', fs.createReadStream(tempFilePath), docName);
          });
        } else {
          // Existing behaviour: single file buffer / downloaded document
          let tempFilePath;
          let shouldDeleteTempFile = false;
          
          if (isUploadedFile && uploadedFile && uploadedFile.path) {
            // Use the uploaded file path directly
            tempFilePath = uploadedFile.path;
          } else {
            // Create temp file for downloaded documents
            const tempDir = os.tmpdir();
            tempFilePath = path.join(tempDir, `${Date.now()}-${documentName}`);
            fs.writeFileSync(tempFilePath, fileBuffer);
            shouldDeleteTempFile = true;
          }

          formData.append('files', fs.createReadStream(tempFilePath), documentName);

          // Clean up temp file (only if we created it, not if it was uploaded)
          if (shouldDeleteTempFile) {
            try {
              fs.unlinkSync(tempFilePath);
            } catch (e) {
              console.warn('Failed to delete temp file:', e);
            }
          }
        }

        if (subject) formData.append('subject', subject);
        if (message) formData.append('message', message);

        const uploadResponse = await axios.post(
          `${eSignServiceUrl}/api/e-sign/upload`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              Authorization: `Bearer ${token}`
            },
            timeout: 180000, // 3 minutes for file upload
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          }
        );

        envelopeId = uploadResponse.data?.data?.envelopeId || uploadResponse.data?.data?._id || uploadResponse.data?.data?.id;
        if (!envelopeId) {
          throw new Error('Failed to create envelope');
        }
      } else if (!envelopeId) {
        throw new Error('No envelope ID provided and no file to upload');
      }

      // Step 4: Add recipients (include authentication providers if any)
      // First, get current envelope to check existing recipients
      let existingRecipients = [];
      try {
        const currentEnvelopeResponse = await axios.get(
          `${eSignServiceUrl}/api/e-sign/envelope/${envelopeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 60000
          }
        );
        existingRecipients = currentEnvelopeResponse.data?.data?.recipients || [];
      } catch (err) {
        console.warn('Could not fetch current envelope recipients, proceeding with add:', err.message);
      }

      // Filter out recipients that already exist
      const existingEmails = existingRecipients.map(r => (r.email || '').toLowerCase()).filter(Boolean);
      const newRecipients = recipients.filter(r => !existingEmails.includes(r.email.toLowerCase()));
      
      if (newRecipients.length === 0 && existingRecipients.length > 0) {
        console.log('ℹ️ All recipients already exist in the envelope. Proceeding with send/resend.');
      } else if (newRecipients.length > 0) {
        console.log(`📧 Adding ${newRecipients.length} new recipient(s) to envelope`);
      }

      const recipientsPayload = recipients.map(r => {
        const emailKey = (r.email || '').toLowerCase();
        const authInfo = recipientsAuthInfo.get(emailKey);

        const baseRecipient = {
          name: r.name || r.email.split('@')[0],
          email: r.email,
          role: r.role || 'signer',
          order: r.order || 1
        };

        if (authInfo && Array.isArray(authInfo.providerIds) && authInfo.providerIds.length > 0) {
          baseRecipient.authentication = JSON.stringify(authInfo.providerIds);
        }

        return baseRecipient;
      });

      // Add recipients (will add only new ones if some already exist)
      await axios.post(
        `${eSignServiceUrl}/api/e-sign/add-recipients`,
        {
          envelopeId,
          recipients: recipientsPayload
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 60000 // 1 minute (increased from 30 seconds)
        }
      );

      // Step 5: Get recipient IDs for signature field assignment
      const envelopeDetailResponse = await axios.get(
        `${eSignServiceUrl}/api/e-sign/envelope/${envelopeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 60000 // 1 minute (increased from 30 seconds)
        }
      );

      const envelopeData = envelopeDetailResponse.data?.data;
      const recipientMap = new Map();
      if (envelopeData?.recipients) {
        envelopeData.recipients.forEach(r => {
          recipientMap.set(r.email.toLowerCase(), r._id || r.id);
        });
      }

      // Step 6: Add signature fields if provided
      if (signatureFields && signatureFields.length > 0) {
        // Work with all documents in the envelope (can be multiple)
        const documents = Array.isArray(envelopeData?.documents) ? envelopeData.documents : [];
        
        if (documents && documents.length > 0) {
          const pageWidth = 595; // A4 width in points
          const pageHeight = 842; // A4 height in points

          // Track how many fields share the same logical position so we can offset them
          const positionCounters = new Map();
          
          const processedFields = signatureFields.map((field, index) => {
            // Resolve target document for this field
            let targetDoc = documents[0];
            if (field.documentIndex && Number.isFinite(Number(field.documentIndex))) {
              const idx = Math.min(documents.length, Math.max(1, Number(field.documentIndex))) - 1;
              targetDoc = documents[idx] || documents[0];
            } else if (field.documentName) {
              const byName = documents.find(d => {
                const name = (d.name || d.fileName || '').toString().toLowerCase();
                return name && field.documentName && name === field.documentName.toString().toLowerCase();
              });
              if (byName) targetDoc = byName;
            }

            const envelopeDocId = targetDoc?._id || targetDoc?.id;
            if (!envelopeDocId) {
              return null; // skip invalid
            }

            const page = field.page || 1;
            const fieldWidth = field.width || 150;
            const fieldHeight = field.height || 40;
            const position = field.position || 'bottom-right';

            // Base positions for known keywords
            let baseX;
            let baseY;

            switch (position) {
              case 'bottom-left':
                baseX = 50;
                baseY = pageHeight - fieldHeight - 50;
                break;
              case 'top-right':
                baseX = pageWidth - fieldWidth - 50;
                baseY = 50;
                break;
              case 'top-left':
                baseX = 50;
                baseY = 50;
                break;
              case 'center':
                baseX = (pageWidth - fieldWidth) / 2;
                baseY = (pageHeight - fieldHeight) / 2;
                break;
              case 'bottom-right':
              default:
                baseX = pageWidth - fieldWidth - 50;
                baseY = pageHeight - fieldHeight - 50;
                break;
            }

            // Find recipient ID if recipientEmail is specified
            let recipientId = null;
            if (field.recipientEmail) {
              recipientId = recipientMap.get(field.recipientEmail.toLowerCase());
            } else if (recipients.length === 1) {
              // If only one recipient, assign to them
              recipientId = recipientMap.get(recipients[0].email.toLowerCase());
            }

            // If user did not specify explicit x/y, auto-offset fields so they don't overlap
            let x = field.x;
            let y = field.y;

            if (x == null && y == null) {
              // Group by document + page + position so multiple recipients in the same
              // logical area are automatically stacked instead of overlapping.
              const positionKey = `${envelopeDocId}:${page}:${position || 'default'}`;
              const currentCount = (positionCounters.get(positionKey) || 0) + 1;
              positionCounters.set(positionKey, currentCount);

              const gap = 10;
              const offset = (currentCount - 1) * (fieldHeight + gap);

              let offsetX = 0;
              let offsetY = 0;

              if (position.startsWith('bottom')) {
                // Stack upwards from the bottom
                offsetY = -offset;
              } else if (position.startsWith('top')) {
                // Stack downwards from the top
                offsetY = offset;
              } else if (position === 'center') {
                // Stack vertically below the center
                offsetY = offset;
              } else {
                // Fallback: slight diagonal offset
                offsetX = offset * 0.3;
                offsetY = -offset * 0.7;
              }

              x = baseX + offsetX;
              y = baseY + offsetY;
            }

            return {
              envelopeId,
              documentId: envelopeDocId,
              recipientId,
              type: field.type || 'signature',
              page,
              x: x ?? baseX,
              y: y ?? baseY,
              width: fieldWidth,
              height: fieldHeight,
              order: index + 1,
              status: 'pending'
            };
          }).filter(Boolean);

          try {
            await axios.post(
              `${eSignServiceUrl}/api/e-sign/save-signature-fields`,
              {
                envelopeId,
                signatureFields: processedFields
              },
              {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 120000 // 2 minutes (increased from 1 minute)
              }
            );
            console.log('✅ Signature fields saved successfully');
          } catch (sigFieldError) {
            console.error('❌ Error saving signature fields:', {
              message: sigFieldError.message,
              status: sigFieldError.response?.status,
              data: sigFieldError.response?.data
            });
            // Don't throw - continue with sending even if signature fields fail
            console.warn('⚠️ Continuing with envelope send despite signature field save error');
          }
        }
      }

      // Step 7: Send or schedule the envelope
      // Check if scheduling is requested - either isScheduled flag is true OR scheduledDate is provided
      const shouldSchedule = (isScheduled === true) || (scheduledDate && scheduledDate.trim() !== '');
      
      console.log('📅 Final scheduling decision:', {
        shouldSchedule,
        isScheduled,
        scheduledDate,
        scheduledTime,
        envelopeId
      });
      
      if (shouldSchedule && scheduledDate) {
        // Schedule the envelope
        console.log('⏰ Scheduling envelope:', { envelopeId, scheduledDate, scheduledTime });
        try {
          const scheduleResponse = await axios.post(
            `${eSignServiceUrl}/api/e-sign/schedule-envelope/${envelopeId}`,
            { scheduledDate, scheduledTime: scheduledTime || null },
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 120000 // 2 minutes for scheduling
            }
          );
          console.log('✅ Envelope scheduled successfully:', scheduleResponse.data);
        } catch (scheduleError) {
          console.error('❌ Error scheduling envelope:', scheduleError.response?.data || scheduleError.message);
          throw scheduleError;
        }
      } else {
        // Send immediately
        console.log('📤 Sending envelope immediately (not scheduled)');
        
        // Verify envelope status before sending (only if we have envelopeData from earlier)
        if (envelopeData && envelopeData.status) {
          console.log('📋 Envelope status before send:', envelopeData.status);
          
          // Check if we're adding new recipients (resending scenario)
          const existingRecipientsInEnvelope = envelopeData.recipients || [];
          const existingEmails = existingRecipientsInEnvelope.map(r => (r.email || '').toLowerCase()).filter(Boolean);
          const newRecipientsToAdd = recipients.filter(r => !existingEmails.includes(r.email.toLowerCase()));
          
          // If envelope is already in-progress, sent, or completed
          if (envelopeData.status === 'in-progress' || envelopeData.status === 'sent' || envelopeData.status === 'completed') {
            if (newRecipientsToAdd.length > 0) {
              // New recipients added - always proceed with resend
              console.log(`ℹ️ Envelope is "${envelopeData.status}" but ${newRecipientsToAdd.length} new recipient(s) added. Proceeding with resend.`);
              // Continue with send - new recipients need to be notified
            } else {
              // No new recipients - check if all existing recipients have been notified
              const notifiedRecipients = existingRecipientsInEnvelope.filter(r => r.status === 'sent' || r.status === 'notified' || r.notified === true);
              
              if (notifiedRecipients.length === existingRecipientsInEnvelope.length && existingRecipientsInEnvelope.length > 0) {
                console.log('✅ All recipients have already been notified. Envelope is already sent.');
                return {
                  success: true,
                  message: `Envelope is already ${envelopeData.status}. All recipients have been notified.`,
                  envelopeId: envelopeId,
                  recipients: existingRecipientsInEnvelope.length,
                  status: envelopeData.status,
                  alreadySent: true
                };
              } else {
                // Some recipients not notified - proceed with resend
                console.log(`ℹ️ Envelope is "${envelopeData.status}" but not all recipients have been notified. Proceeding with resend...`);
              }
            }
          } else if (envelopeData.status !== 'draft') {
            console.warn(`⚠️ Envelope status is "${envelopeData.status}", not "draft". Attempting to send anyway...`);
          }
        }
        
        try {
          console.log(`🚀 Calling send-envelope API for envelope: ${envelopeId}`);
          const sendStartTime = Date.now();
          
          const sendResponse = await axios.post(
            `${eSignServiceUrl}/api/e-sign/send-envelope/${envelopeId}`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 300000 // 5 minutes for sending
            }
          );
          
          const sendDuration = Date.now() - sendStartTime;
          console.log(`✅ Envelope sent successfully in ${sendDuration}ms:`, sendResponse.data);
        } catch (sendError) {
          const errorDetails = {
            message: sendError.message,
            code: sendError.code,
            status: sendError.response?.status,
            statusText: sendError.response?.statusText,
            data: sendError.response?.data,
            timeout: sendError.code === 'ECONNABORTED' || sendError.message.includes('timeout')
          };
          
          console.error('❌ Error sending envelope:', errorDetails);
          
          // If envelope is in-progress and we get a 400/422, it might already be sent
          if ((envelopeData?.status === 'in-progress' || envelopeData?.status === 'sent') && 
              (sendError.response?.status === 400 || sendError.response?.status === 422)) {
            const errorMsg = sendError.response?.data?.message || sendError.response?.data?.error || '';
            if (errorMsg.includes('already') || errorMsg.includes('sent') || errorMsg.includes('in-progress')) {
              console.log('ℹ️ Envelope appears to already be sent. Returning success.');
              return {
                success: true,
                message: `Envelope is already ${envelopeData?.status || 'sent'}. Recipients have been notified.`,
                envelopeId: envelopeId,
                recipients: envelopeData?.recipients?.length || recipients.length,
                status: envelopeData?.status || 'in-progress',
                alreadySent: true
              };
            }
          }
          
          // If it's a timeout, provide more helpful error message
          if (errorDetails.timeout) {
            throw new Error(`Envelope send operation timed out after 5 minutes. The envelope (ID: ${envelopeId}) may still be processing in the background. Please check the envelope status in the e-sign service.`);
          }
          
          // If it's a 400/422 error, include the error details
          if (sendError.response?.status === 400 || sendError.response?.status === 422) {
            const errorMsg = sendError.response?.data?.message || sendError.response?.data?.error || sendError.message;
            throw new Error(`Failed to send envelope: ${errorMsg}`);
          }
          
          throw sendError;
        }
      }

      // Step 8: Deduct credits for authentication providers (if any)
      let creditsDebited = 0;
      const authUsage = [];

      if (recipientsAuthInfo.size > 0 && token) {
     
        for (const r of recipients) {
          if (!r || !r.email) continue;
          const emailKey = r.email.toLowerCase();
          const authInfo = recipientsAuthInfo.get(emailKey);
          if (!authInfo || !Array.isArray(authInfo.providerIds) || authInfo.providerIds.length === 0) {
            continue;
          }

          for (const providerId of authInfo.providerIds) {
            const method =
              (availableAuthMethods || []).find(
                m => String(m.id || m._id) === String(providerId)
              ) || null;
            const cost = Number(method?.cost ?? method?.defaultCredits ?? 0);
            if (!cost || !Number.isFinite(cost) || cost <= 0) {
              // console.log('AI Assistant skip credit consumption for provider with zero/invalid cost:', {
              //   providerId,
              //   methodName: method?.name,
              //   rawCost: method?.cost,
              //   defaultCredits: method?.defaultCredits
              // });
              continue;
            }

            try {
              const resp = await axios.post(
                `${subscriptionServiceUrl}/usage/consume`,
                {
                  action: 'esign:envelopeSend',
                  credits: cost,
                  authId: providerId,
                  toolId: 'esign',
                  reason: `AI envelope ${envelopeId} sent to ${r.email} using ${method?.name || 'auth provider'}`
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                  timeout: 30000
                }
              );

              creditsDebited += cost;
              authUsage.push({
                recipientEmail: r.email,
                authProviderId: providerId,
                authProviderName: method?.name || null,
                credits: cost
              });

              // console.log('AI Assistant credit consumption success:', {
              //   status: resp.status,
              //   recipientEmail: r.email,
              //   providerId,
              //   methodName: method?.name,
              //   credits: cost
              // });
            } catch (consumeErr) {
              console.error('Error consuming credits for AI envelope auth provider:', {
                message: consumeErr.message,
                status: consumeErr.response?.status,
                data: consumeErr.response?.data
              });

              // If subscription-service reports insufficient credits, bubble up a clear error
              if (
                consumeErr.response?.status === 402 ||
                consumeErr.response?.data?.status === 402
              ) {
                throw new Error(
                  consumeErr.response?.data?.message ||
                    'Insufficient credits to apply requested authentication methods.'
                );
              }

              // For other errors, log and continue without blocking envelope sending
            }
          }
        }
      }

      // Determine if envelope was scheduled or sent
      const wasScheduled = shouldSchedule && scheduledDate;
      
      return {
        success: true,
        message: wasScheduled 
          ? 'Envelope scheduled successfully' 
          : 'Envelope created and sent successfully',
        envelopeId,
        recipients: recipients.length,
        signatureFields: signatureFields?.length || 0,
        isScheduled: wasScheduled,
        scheduledDate: wasScheduled ? scheduledDate : null,
        scheduledTime: wasScheduled ? scheduledTime : null,
        authProvidersApplied: Array.from(recipientsAuthInfo.entries()).map(
          ([email, info]) => ({
            email,
            providerIds: info.providerIds,
            credits: info.credits
          })
        ),
        creditsDebited,
        authUsage
      };
    } catch (error) {
      console.error('Error executing create and send envelope:', error);
      throw error;
    }
  }

  // Execute generate_document action
  async executeGenerateDocument(parameters, userId, token, conversation) {
    try {
      const { category, requirements, formData: docFormData } = parameters;

      if (!category) {
        throw new Error('Document category is required');
      }

      // Check if this is the initial request (no requirements yet) or requirements are too minimal
      if (!requirements || requirements.trim() === '' || requirements.trim().length < 10) {
        // Ask for required details based on category
        const categoryPrompts = {
          'NDA': 'Please provide the required details for the NDA document:\n\n1. Parties:\n   - Party A: Legal Name, Entity Type, Address, Authorized Signatory Name, Signatory Designation\n   - Party B: Legal Name, Entity Type, Address, Authorized Signatory Name, Signatory Designation\n\n2. Purpose: Purpose of information sharing (short description)\n\n3. Confidential Information Scope:\n   - Types (Source code, Business data, Financial information, Client data, Documents/Designs)\n   - Format (Written, Electronic, Verbal)\n\n4. Exclusions: Publicly available info, Prior knowledge, Third-party lawful disclosure, Independently developed info\n\n5. Obligations: Use limitation, Disclosure restriction, Security standard\n\n6. Term & Duration: Agreement Effective Date, Agreement Term, Confidentiality Survival Period\n\n7. Permitted Disclosures: Legal/regulatory disclosure allowed, Prior notice required\n\n8. Return/Destruction: Return or destroy on termination, Timeframe\n\n9. Remedies: Injunctive relief, Monetary damages\n\n10. Governing Law: Governing Country/State, Jurisdiction/Courts\n\n11. Execution: Signing Date, Signing Place, Signature Method (Physical/eSign)\n\nYou can provide these details in natural language. For example: "Party A: Sneha, Individual, Noida, signatory Sneha, bottom right. Party B: Kiara, LLP, Singapore, signatory kiara, bottom left. Effective date: 19/12/2025, period: 5 months."',
          'Contract': 'Please provide: parties involved, contract type, start date, end date, payment terms, deliverables, terms and conditions.',
          'Agreement': 'Please provide: parties involved, agreement type, effective date, key terms, obligations of each party, termination conditions.'
        };

        const prompt = categoryPrompts[category] || `Please provide the required details for the ${category} document.`;

        return {
          success: false,
          clarification: prompt,
          needsDetails: true
        };
      }
      
      // Parse requirements to extract structured data if provided in natural language
      const parsedFormData = this.parseDocumentRequirements(requirements, category);

      // Generate document using template service
      const templateServiceUrl = process.env.TEMPLATE_SERVICE_URL || 'http://localhost:2105';
      
      const generateResponse = await axios.post(
        `${templateServiceUrl}/public/ai-content/generate`,
        {
          templateType: category,
          requirements: requirements,
          formData: docFormData || parsedFormData || {}
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 120000 // 2 minutes (increased from 60 seconds)
        }
      );

      if (!generateResponse.data?.success || !generateResponse.data?.data?.content) {
        throw new Error('Failed to generate document content');
      }

      const generatedContent = generateResponse.data.data.content;

      // Convert to PDF
      const pdfResponse = await axios.post(
        `${templateServiceUrl}/public/ai-content/convert-to-pdf`,
        {
          content: generatedContent,
          documentName: `${category}_${Date.now()}`
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 120000 // 2 minutes (increased from 60 seconds)
        }
      );

      if (!pdfResponse.data?.success || !pdfResponse.data?.data?.base64) {
        throw new Error('Failed to convert document to PDF');
      }

      // Create draft envelope in e-sign service for the generated document
      // Documents generated via AI should be created ONLY in e-sign service, not document service
      const eSignServiceUrl = process.env.ESIGN_SERVICE_URL || 'http://localhost:2103';
      const pdfBuffer = Buffer.from(pdfResponse.data.data.base64, 'base64');
      const FormDataLib = require('form-data');
      const envelopeFormData = new FormDataLib();
      
      const documentName = `${category}_${Date.now()}.pdf`;
      
      // E-sign service expects 'files' (plural) as the field name
      envelopeFormData.append('files', pdfBuffer, {
        filename: documentName,
        contentType: 'application/pdf'
      });
      envelopeFormData.append('subject', `${category} Document`);

      const envelopeResponse = await axios.post(
        `${eSignServiceUrl}/api/e-sign/upload`,
        envelopeFormData,
        {
          headers: {
            ...envelopeFormData.getHeaders(),
            Authorization: `Bearer ${token}`
          },
          timeout: 180000, // 3 minutes for file upload (increased from 60 seconds)
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      // Extract envelope ID from response
      const envelopeId = envelopeResponse.data?.data?.envelopeId || 
                        envelopeResponse.data?.data?._id || 
                        envelopeResponse.data?.data?.id ||
                        envelopeResponse.data?.envelopeId ||
                        envelopeResponse.data?._id ||
                        envelopeResponse.data?.id;
      
      if (!envelopeId) {
        console.error('❌ Envelope creation failed - no envelopeId returned');
        console.error('Envelope response structure:', JSON.stringify(envelopeResponse.data, null, 2));
        throw new Error('Failed to get envelopeId from e-sign service. Document may not have been created.');
      }
      
      // Try to get document ID from the response if available
      let documentIdFromResponse = null;
      if (envelopeResponse.data?.data?.documentIds && envelopeResponse.data.data.documentIds.length > 0) {
        documentIdFromResponse = envelopeResponse.data.data.documentIds[0];
      } else if (envelopeResponse.data?.data?.documents && envelopeResponse.data.data.documents.length > 0) {
        documentIdFromResponse = envelopeResponse.data.data.documents[0]._id || envelopeResponse.data.data.documents[0].id;
      }
      
      console.log('✅ Document created in e-sign service successfully:', {
        envelopeId,
        documentName,
        documentIdFromResponse,
        responseStructure: {
          hasData: !!envelopeResponse.data?.data,
          hasEnvelopeId: !!envelopeResponse.data?.data?.envelopeId,
          hasId: !!envelopeResponse.data?.data?._id || !!envelopeResponse.data?.data?.id,
          hasDocumentIds: !!envelopeResponse.data?.data?.documentIds,
          hasDocuments: !!envelopeResponse.data?.data?.documents,
          fullResponse: JSON.stringify(envelopeResponse.data, null, 2).substring(0, 500)
        }
      });

      return {
        success: true,
        message: `${category} document generated successfully!`,
        envelopeId: envelopeId, // Primary ID - document is in e-sign service
        documentId: null, // Not created in document service
        documentName: documentName,
        content: generatedContent,
        serviceType: 'e-sign-service', // Explicitly set service type for generated documents
        docType: 'envelope', // Explicitly set doc type
        nextStep: 'Would you like to send this document? Please provide recipient email address.'
      };
    } catch (error) {
      console.error('Error executing generate document:', error);
      throw error;
    }
  }

  // Parse document requirements from natural language
  parseDocumentRequirements(requirements, category) {
    const formData = {};
    
    // Extract party names - look for patterns like "two party involved sneha and kiara"
    const partyPatterns = [
      /(?:two|2)\s+party\s+(?:involved|are|:)?\s*([a-z]+)\s+(?:and|,)\s+([a-z]+)/i,
      /party\s+(?:involved|are|:)?\s*([a-z]+)\s+(?:and|,)\s+([a-z]+)/i,
      /([a-z]+)\s+(?:and|,)\s+([a-z]+)\s+(?:are|as)\s+(?:party|parties)/i
    ];
    
    for (const pattern of partyPatterns) {
      const match = requirements.match(pattern);
      if (match && match[1] && match[2]) {
        formData.partyAName = match[1].trim();
        formData.partyBName = match[2].trim();
        break;
      }
    }
    
    // Extract dates - look for patterns like "effective date 19/12/2025" or "19/12/2025"
    const datePatterns = [
      /effective\s+date[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
      /effective\s+date[:\-]?\s*(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/
    ];
    
    for (const pattern of datePatterns) {
      const match = requirements.match(pattern);
      if (match) {
        const dateStr = match[1];
        const dateParts = dateStr.split(/[\/\-]/);
        if (dateParts.length === 3) {
          if (dateParts[2] && dateParts[2].length === 4) {
            // DD/MM/YYYY format
            formData.effectiveDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
          } else if (dateParts[0] && dateParts[0].length === 4) {
            // YYYY-MM-DD format
            formData.effectiveDate = dateStr.replace(/\//g, '-');
          }
          break;
        }
      }
    }
    
    // Extract periods/durations - look for patterns like "period 5 months" or "5 months"
    const periodPatterns = [
      /(?:period|duration|term|confidentiality\s+period)[:\-]?\s*(\d+)\s*(months?|years?|days?)/i,
      /(\d+)\s*(months?|years?|days?)\s*(?:period|duration|term)?/i
    ];
    
    for (const pattern of periodPatterns) {
      const match = requirements.match(pattern);
      if (match) {
        formData.period = match[1];
        formData.periodUnit = (match[2] || 'months').toLowerCase();
        break;
      }
    }
    
    return formData;
  }

  // Execute list_documents_by_category action
  async executeListDocumentsByCategory(parameters, userId, token, conversation) {
    try {
      const { category, limit = 20 } = parameters;

      if (!category) {
        throw new Error('Category is required');
      }

      const documentServiceUrl = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:2102';
      const eSignServiceUrl = process.env.ESIGN_SERVICE_URL || 'http://localhost:2103';
      const categoryLower = category.toLowerCase();
      const allDocuments = [];

      // Search documents by category/tags from document service
      try {
        const docResponse = await axios.get(
          `${documentServiceUrl}/api/documents`,
          {
            params: {
              tags: categoryLower,
              limit: limit,
              page: 1
            },
            headers: { Authorization: `Bearer ${token}` },
            timeout: 30000
          }
        );

        const documents = docResponse.data?.data?.documents || [];
        
        // Filter to only include documents with matching category in tags or name
        const filteredDocs = documents.filter(doc => {
          const docTags = (doc.tags || []).map(t => t.toLowerCase());
          const docName = (doc.name || '').toLowerCase();
          return docTags.includes(categoryLower) || docName.includes(categoryLower);
        });

        // Add document service results
        allDocuments.push(...filteredDocs.map(doc => ({
          ...doc,
          source: 'document-service',
          serviceType: 'document'
        })));
      } catch (docError) {
        console.warn('Error fetching documents from document service:', docError.message);
      }

      // Search envelopes by category from e-sign service
      try {
        const eSignResponse = await axios.get(
          `${eSignServiceUrl}/api/e-sign/get-envelopes`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 30000
          }
        );

        const envelopes = eSignResponse.data?.data?.envelopes || eSignResponse.data?.envelopes || [];
        
        // Filter envelopes by category in subject or name
        const filteredEnvelopes = envelopes.filter(envelope => {
          const subject = (envelope.subject || '').toLowerCase();
          const name = (envelope.name || '').toLowerCase();
          return subject.includes(categoryLower) || name.includes(categoryLower);
        });

        // Add e-sign service results
        allDocuments.push(...filteredEnvelopes.map(envelope => ({
          _id: envelope._id || envelope.id,
          id: envelope._id || envelope.id,
          name: envelope.name || envelope.subject || `Envelope ${envelope._id || envelope.id}`,
          type: 'envelope',
          status: envelope.status,
          createdAt: envelope.createdAt,
          source: 'e-sign-service',
          serviceType: 'envelope',
          recipients: envelope.recipients || []
        })));
      } catch (eSignError) {
        console.warn('Error fetching envelopes from e-sign service:', eSignError.message);
      }

      // Sort by creation date (newest first) and limit
      allDocuments.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      const limited = allDocuments.slice(0, limit);

      // Store in conversation for later selection
      if (conversation) {
        conversation.lastDocumentList = limited.map((doc, idx) => ({
          index: idx + 1,
          id: doc._id || doc.id,
          name: doc.name,
          category: category,
          source: doc.source,
          serviceType: doc.serviceType
        }));
        await conversation.save();
      }

      return {
        success: true,
        documents: limited.map((doc, idx) => ({
          index: idx + 1,
          id: doc._id || doc.id,
          name: doc.name,
          type: doc.type || 'document',
          size: doc.size || 0,
          createdAt: doc.createdAt,
          tags: doc.tags || [],
          source: doc.source,
          serviceType: doc.serviceType,
          status: doc.status,
          recipients: doc.recipients
        })),
        count: limited.length,
        category: category
      };
    } catch (error) {
      console.error('Error executing list documents by category:', error);
      throw error;
    }
  }

  // Execute list_shared_documents action
  async executeListSharedDocuments(parameters, userId, token) {
    try {
      const { recipientEmail, date, serviceType, status, limit = 20 } = parameters;
      console.log('🔍 Executing list_shared_documents:', { recipientEmail, date, serviceType, status, limit, userId });
      console.log('📋 Raw parameters received:', JSON.stringify(parameters, null, 2));
      console.log('📊 Status parameter check:', { 
        status, 
        statusType: typeof status, 
        statusUndefined: status === undefined, 
        statusNull: status === null,
        statusEmpty: status === '',
        willIncludeDrafts: status && status.toLowerCase() === 'draft'
      });

      const documentServiceUrl = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:2102';
      const eSignServiceUrl = process.env.ESIGN_SERVICE_URL || 'http://localhost:2103';
      
      // If no recipientEmail provided, get current user's email from token
      let targetEmail = recipientEmail;
      if (!targetEmail) {
        // Get current user's email from the token (req.user should have it)
        // For now, we'll filter by userId instead
        targetEmail = null; // Will use userId filtering
      }
      
      const recipientLower = targetEmail ? targetEmail.toLowerCase() : null;
      const allShared = [];
      
      // Parse date filter
      let dateFilter = null;
      if (date) {
        const dateLower = date.toLowerCase();
        if (dateLower === 'today') {
          // Use UTC to match database timestamps
          const now = new Date();
          const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
          const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
          dateFilter = { from: today, to: tomorrow };
          console.log('📅 Date filter (today UTC):', { from: dateFilter.from.toISOString(), to: dateFilter.to.toISOString() });
        } else if (dateLower === 'yesterday') {
          // Use UTC to match database timestamps
          const now = new Date();
          const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 0, 0, 0, 0));
          const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
          dateFilter = { from: yesterday, to: today };
          console.log('📅 Date filter (yesterday UTC):', { from: dateFilter.from.toISOString(), to: dateFilter.to.toISOString() });
        } else if (date.match(/^\d{4}-\d{2}$/)) {
          // Month/year format (YYYY-MM) - filter for entire month
          const [year, month] = date.split('-').map(Number);
          const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)); // First day of month
          const to = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)); // First day of next month
          dateFilter = { from, to };
          console.log('📅 Date filter (month range):', { 
            from: dateFilter.from.toISOString(), 
            to: dateFilter.to.toISOString(),
            inputDate: date,
            month: month,
            year: year
          });
        } else {
          // Try to parse as ISO date (YYYY-MM-DD format)
          let parsedDate;
          if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // ISO format - parse in UTC to avoid timezone issues
            parsedDate = new Date(date + 'T00:00:00.000Z');
          } else {
            parsedDate = new Date(date);
          }
          
          if (!isNaN(parsedDate.getTime())) {
            // Use UTC dates to match database timestamps
            // Parse the date string directly to avoid timezone issues
            let year, month, day;
            if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // ISO format - extract components directly
              const parts = date.split('-');
              year = parseInt(parts[0], 10);
              month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
              day = parseInt(parts[2], 10);
            } else {
              // Fallback to parsed date
              year = parsedDate.getUTCFullYear();
              month = parsedDate.getUTCMonth();
              day = parsedDate.getUTCDate();
            }
            const from = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
            const to = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0));
            dateFilter = { from, to };
            console.log('📅 Date filter (specific date):', { 
              from: dateFilter.from.toISOString(), 
              to: dateFilter.to.toISOString(),
              inputDate: date,
              extractedYear: year,
              extractedMonth: month + 1,
              extractedDay: day
            });
          } else {
            console.warn(`⚠️ Could not parse date: ${date}`);
          }
        }
      }
      
      console.log('📋 Service type filter:', serviceType || 'both');
      console.log('📋 Status filter:', status || 'none (will exclude drafts by default)');

      // Get shared documents from document service
      try {
        const docResponse = await axios.get(
          `${documentServiceUrl}/api/documents`,
          {
            params: {
              limit: limit * 2, // Get more to filter
              page: 1
            },
            headers: { Authorization: `Bearer ${token}` },
            timeout: 30000
          }
        );

        const documents = docResponse.data?.data?.documents || [];
        
        // Filter documents
        const filteredDocs = documents.filter(doc => {
          // Must be shared (not drafted)
          if (!doc.shared || !doc.sharedWith || !Array.isArray(doc.sharedWith)) {
            return false;
          }
          
          // If recipientEmail provided, filter by recipient
          // If not provided, these are documents shared BY current user (owner is userId)
          if (recipientLower) {
            // Documents shared TO the specified recipient
            return doc.sharedWith.some(share => {
              const shareEmail = (share.email || '').toLowerCase();
              const shareUserId = (share.userId || '').toLowerCase();
              return shareEmail === recipientLower || shareUserId === recipientLower;
            });
          } else {
            // Documents shared BY current user (owner matches userId)
            return doc.ownerId === userId || doc.userId === userId;
          }
        }).filter(doc => {
          // Apply date filter if provided
          if (dateFilter) {
            // Try multiple date fields in order of preference:
            // 1. sharedWith[].createdAt (when specifically shared to someone)
            // 2. updatedAt (usually updated when shared)
            // 3. createdAt (when document was created - least accurate)
            let shareDate = null;
            
            if (doc.sharedWith && Array.isArray(doc.sharedWith) && doc.sharedWith.length > 0) {
              // Find the most recent share date - check both sharedAt and createdAt
              const shareDates = doc.sharedWith
                .map(share => {
                  if (share.sharedAt) return new Date(share.sharedAt);
                  if (share.createdAt) return new Date(share.createdAt);
                  return null;
                })
                .filter(date => date !== null);
              
              if (shareDates.length > 0) {
                shareDate = new Date(Math.max(...shareDates.map(d => d.getTime())));
                console.log(`📅 Document "${doc.name}" - using share date from sharedWith: ${shareDate.toISOString()}`);
              } else {
                console.log(`⚠️ Document "${doc.name}" - sharedWith array exists but no dates found. Sample share object:`, JSON.stringify(doc.sharedWith[0] || {}, null, 2));
              }
            }
            
            // Fallback to updatedAt if no share dates found (updatedAt is usually set when document is shared)
            if (!shareDate && doc.updatedAt) {
              shareDate = new Date(doc.updatedAt);
              console.log(`📅 Document "${doc.name}" - using updatedAt as share date: ${shareDate.toISOString()}`);
            }
            
            // Last fallback to createdAt
            if (!shareDate && doc.createdAt) {
              shareDate = new Date(doc.createdAt);
            }
            
            if (shareDate) {
              const isInDateRange = shareDate >= dateFilter.from && shareDate < dateFilter.to;
              if (!isInDateRange) {
                console.log(`❌ Document "${doc.name}" filtered out - share date: ${shareDate.toISOString()}, not in range ${dateFilter.from.toISOString()} to ${dateFilter.to.toISOString()}`);
              } else {
                console.log(`✅ Document "${doc.name}" included - share date: ${shareDate.toISOString()}`);
              }
              return isInDateRange;
            } else {
              console.log(`⚠️ Document "${doc.name}" has no date fields, excluding from date filter`);
              return false; // Exclude if no date available
            }
          }
          return true;
        });
        
        // Filter by service type if specified
        let serviceFilteredDocs = filteredDocs;
        if (serviceType === 'e-sign' || serviceType === 'esign') {
          // Skip document-service documents if only e-sign requested
          serviceFilteredDocs = [];
          console.log('📋 Filtering: Only e-sign documents requested, skipping document-service');
        }

        // Add document service results (only if not filtered out by service type)
        if (serviceFilteredDocs.length > 0 || !serviceType || (serviceType !== 'e-sign' && serviceType !== 'esign')) {
          allShared.push(...serviceFilteredDocs.map(doc => ({
            ...doc,
            source: 'document-service',
            serviceType: 'document'
          })));
        }
      } catch (docError) {
        console.warn('Error fetching shared documents from document service:', docError.message);
      }

      // Get envelopes shared to recipient from e-sign service
      try {
        console.log(`🔗 Calling e-sign service: ${eSignServiceUrl}/api/e-sign/get-envelopes`);
        let envelopes = [];
        
        try {
          const eSignResponse = await axios.get(
            `${eSignServiceUrl}/api/e-sign/get-envelopes`,
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 30000
            }
          );

          console.log(`📥 Raw e-sign response structure:`, {
            status: eSignResponse.status,
            hasData: !!eSignResponse.data,
            hasDataData: !!eSignResponse.data?.data,
            hasDataDataEnvelopes: !!eSignResponse.data?.data?.envelopes,
            hasDataEnvelopes: !!eSignResponse.data?.envelopes,
            responseKeys: Object.keys(eSignResponse.data || {}),
            dataDataKeys: eSignResponse.data?.data ? (Array.isArray(eSignResponse.data.data) ? `Array[${eSignResponse.data.data.length}]` : Object.keys(eSignResponse.data.data)) : null
          });

          // E-sign service returns: { status: 'success', data: [envelopes] }
          if (eSignResponse.data?.status === 'success' && Array.isArray(eSignResponse.data?.data)) {
            envelopes = eSignResponse.data.data;
          } else if (Array.isArray(eSignResponse.data?.data)) {
            envelopes = eSignResponse.data.data;
          } else if (Array.isArray(eSignResponse.data?.envelopes)) {
            envelopes = eSignResponse.data.envelopes;
          } else if (Array.isArray(eSignResponse.data)) {
            envelopes = eSignResponse.data;
          }
        } catch (eSignError) {
          // Handle 404 as "no envelopes found" (not an error)
          if (eSignError.response?.status === 404) {
            console.log(`📭 E-sign service returned 404 (no envelopes found)`);
            envelopes = [];
          } else {
            throw eSignError; // Re-throw other errors
          }
        }
        
        console.log(`📦 Fetched ${envelopes.length} envelopes from e-sign service`);
        
        if (envelopes.length > 0) {
          console.log(`📋 Sample envelope (first):`, {
            id: envelopes[0]._id || envelopes[0].id,
            subject: envelopes[0].subject,
            createdAt: envelopes[0].createdAt,
            status: envelopes[0].status,
            sender: envelopes[0].sender,
            createdBy: envelopes[0].createdBy,
            userId: envelopes[0].userId,
            allKeys: Object.keys(envelopes[0])
          });
          
          if (dateFilter) {
            console.log(`📋 Date filter:`, {
              filterFrom: dateFilter.from.toISOString(),
              filterTo: dateFilter.to.toISOString()
            });
          }
        } else {
          console.warn(`⚠️ No envelopes returned from e-sign service. Response:`, JSON.stringify(eSignResponse.data, null, 2).substring(0, 500));
        }
        
        // Filter envelopes
        let statusOwnershipPassed = 0;
        let datePassed = 0;
        const filteredEnvelopes = envelopes.filter(envelope => {
          // Handle status filtering
          // If status is "draft", include only drafts
          // If status is specified as something else (e.g., "sent", "completed"), filter by that status
          // If status is not specified, exclude drafts (default behavior for shared documents)
          if (status) {
            const statusLower = status.toLowerCase();
            const envelopeStatus = (envelope.status || '').toLowerCase();
            
            console.log(`🔍 Status filter check for envelope "${envelope.subject || envelope.id}":`, {
              requestedStatus: statusLower,
              envelopeStatus: envelopeStatus,
              matches: envelopeStatus === statusLower
            });
            
            if (statusLower === 'draft') {
              // Include only drafts (case-insensitive comparison)
              const envelopeStatusLower = (envelope.status || '').toLowerCase();
              if (envelopeStatusLower !== 'draft') {
                console.log(`❌ Envelope "${envelope.subject || envelope.id}" filtered out - status is "${envelope.status}", not "draft"`);
                return false;
              }
              console.log(`✅ Envelope "${envelope.subject || envelope.id}" included - status is "draft"`);
            } else {
              // Filter by specific status
              if (envelopeStatus !== statusLower) {
                console.log(`❌ Envelope "${envelope.subject || envelope.id}" filtered out - status is "${envelope.status}", not "${statusLower}"`);
                return false;
              }
              console.log(`✅ Envelope "${envelope.subject || envelope.id}" included - status matches "${statusLower}"`);
            }
          } else {
            // Default behavior: exclude draft envelopes when status is not specified
            const envelopeStatusLower = (envelope.status || '').toLowerCase();
            if (envelopeStatusLower === 'draft') {
              console.log(`❌ Envelope "${envelope.subject || envelope.id}" filtered out - status is "draft" (default: exclude drafts)`);
              return false;
            }
          }

          // If recipientEmail provided, filter by recipient
          // If not provided, these are envelopes created BY current user
          if (recipientLower) {
            // Envelopes shared TO the specified recipient
            const recipients = envelope.recipients || [];
            return recipients.some(r => {
              const rEmail = (r.email || '').toLowerCase();
              return rEmail === recipientLower;
            });
          } else {
            // Envelopes created BY current user
            // Check multiple fields: createdBy, userId, sender (can be ObjectId, string, or object with id property)
            const envelopeCreatedBy = envelope.createdBy?.toString() || envelope.createdBy;
            const envelopeUserId = envelope.userId?.toString() || envelope.userId;
            
            // Handle sender - can be ObjectId, string, or object with id/_id property
            let envelopeSenderId = null;
            if (envelope.sender) {
              // Check for object with id property first (most common case from e-sign service)
              if (envelope.sender.id) {
                envelopeSenderId = envelope.sender.id.toString();
              } else if (envelope.sender._id) {
                envelopeSenderId = envelope.sender._id.toString();
              } else if (typeof envelope.sender === 'string') {
                envelopeSenderId = envelope.sender;
              } else if (envelope.sender.toString && typeof envelope.sender.toString === 'function') {
                envelopeSenderId = envelope.sender.toString();
              } else {
                envelopeSenderId = String(envelope.sender);
              }
            }
            
            const currentUserIdStr = userId.toString();
            
            // Debug logging
            console.log(`🔍 Ownership check for envelope "${envelope.subject || envelope.id || envelope._id}":`, {
              envelopeCreatedBy,
              envelopeUserId,
              envelopeSenderId,
              currentUserIdStr,
              senderType: typeof envelope.sender,
              senderValue: envelope.sender
            });
            
            const matches = envelopeCreatedBy === currentUserIdStr || 
                           envelopeUserId === currentUserIdStr || 
                           envelopeSenderId === currentUserIdStr;
            
            if (!matches) {
              console.log(`⚠️ Envelope "${envelope.subject || envelope.id || envelope._id}" not owned by user - createdBy: ${envelopeCreatedBy}, userId: ${envelopeUserId}, senderId: ${envelopeSenderId}, currentUserId: ${currentUserIdStr}`);
            } else {
            const matchField = envelopeCreatedBy === currentUserIdStr ? 'createdBy' : 
                              envelopeUserId === currentUserIdStr ? 'userId' : 'sender';
              console.log(`✅ Envelope "${envelope.subject || envelope.id || envelope._id}" owned by user (matched via ${matchField})`);
            }
            if (matches) {
              statusOwnershipPassed++;
            }
            return matches;
          }
        }).filter(envelope => {
          // Apply date filter if provided
          // For envelopes, use createdAt (when envelope was created/sent)
          if (dateFilter) {
            let envDate = null;
            
            // Try createdAt first (when envelope was created/sent)
            if (envelope.createdAt) {
              envDate = new Date(envelope.createdAt);
            } else if (envelope.updatedAt) {
              envDate = new Date(envelope.updatedAt);
            }
            
            if (envDate) {
              const isInDateRange = envDate >= dateFilter.from && envDate < dateFilter.to;
              if (!isInDateRange) {
                console.log(`❌ Envelope "${envelope.subject || envelope.id}" filtered out - date: ${envDate.toISOString()}, not in range ${dateFilter.from.toISOString()} to ${dateFilter.to.toISOString()}`);
              } else {
                console.log(`✅ Envelope "${envelope.subject || envelope.id}" included - date: ${envDate.toISOString()}`);
                datePassed++;
              }
              return isInDateRange;
            } else {
              console.log(`⚠️ Envelope "${envelope.subject || envelope.id}" has no date fields, excluding from date filter`);
              return false; // Exclude if no date available
            }
          }
          return true;
        });
        
        console.log(`📊 Filter summary: ${statusOwnershipPassed} envelopes passed status/ownership filters, ${datePassed} passed date filter, ${filteredEnvelopes.length} total after all filters`);
        
        // Filter by service type if specified
        let serviceFilteredEnvelopes = filteredEnvelopes;
        if (serviceType === 'document' || serviceType === 'documents') {
          // Skip e-sign envelopes if only document-service requested
          serviceFilteredEnvelopes = [];
          console.log('📋 Filtering: Only document-service documents requested, skipping e-sign');
        }

        // Add e-sign service results (only if not filtered out by service type)
        if (serviceFilteredEnvelopes.length > 0 || !serviceType || (serviceType !== 'document' && serviceType !== 'documents')) {
          allShared.push(...serviceFilteredEnvelopes.map(envelope => ({
            _id: envelope._id || envelope.id,
            id: envelope._id || envelope.id,
            name: envelope.name || envelope.subject || `Envelope ${envelope._id || envelope.id}`,
            type: 'envelope',
            status: envelope.status,
            createdAt: envelope.createdAt,
            source: 'e-sign-service',
            serviceType: 'envelope',
            recipients: envelope.recipients || [],
            sharedWith: envelope.recipients || []
          })));
        }
      } catch (eSignError) {
        console.warn('Error fetching shared envelopes from e-sign service:', eSignError.message);
      }

      // Sort by creation date (newest first) and limit
      allShared.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      const limited = allShared.slice(0, limit);
      
      console.log(`✅ Found ${limited.length} shared documents (from ${allShared.length} total)`);

      const formattedDocuments = limited.map((doc, idx) => ({
        index: idx + 1,
        id: doc._id || doc.id,
        name: doc.name,
        type: doc.type || 'document',
        size: doc.size || 0,
        createdAt: doc.createdAt,
        sharedWith: doc.sharedWith || doc.recipients || [],
        source: doc.source,
        serviceType: doc.serviceType,
        status: doc.status
      }));

      return {
        success: true,
        documents: formattedDocuments,
        count: limited.length,
        recipientEmail: recipientEmail || 'current_user',
        date: date || null,
        status: status || null,
        _documentList: formattedDocuments // Store for auto-selection
      };
    } catch (error) {
      console.error('Error executing list shared documents:', error);
      throw error;
    }
  }

  // Execute list_signed_documents action
  async executeListSignedDocuments(parameters, userId, token) {
    try {
      const { recipientEmail, date, limit = 20 } = parameters;

      if (!recipientEmail) {
        throw new Error('Recipient email is required');
      }

      if (!date) {
        throw new Error('Date is required');
      }

      // Parse date
      let targetDate;
      if (date.toLowerCase() === 'today') {
        targetDate = new Date();
        targetDate.setHours(0, 0, 0, 0);
      } else {
        targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
      }

      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const eSignServiceUrl = process.env.ESIGN_SERVICE_URL || 'http://localhost:2103';

      // Get envelopes
      const response = await axios.get(
        `${eSignServiceUrl}/api/e-sign/envelopes`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );

      const envelopes = response.data?.data?.envelopes || response.data?.envelopes || [];
      
      // Filter to completed envelopes signed by the recipient on the target date
      const filtered = envelopes.filter(envelope => {
        if (envelope.status !== 'completed') {
          return false;
        }

        // Check if recipient is in the envelope
        const recipients = envelope.recipients || [];
        const hasRecipient = recipients.some(r => {
          const rEmail = (r.email || '').toLowerCase();
          return rEmail === recipientEmail.toLowerCase();
        });

        if (!hasRecipient) {
          return false;
        }

        // Check if signed on target date
        const completedAt = envelope.completedAt || envelope.updatedAt || envelope.createdAt;
        if (!completedAt) {
          return false;
        }

        const signDate = new Date(completedAt);
        signDate.setHours(0, 0, 0, 0);

        return signDate.getTime() === targetDate.getTime();
      });

      return {
        success: true,
        documents: filtered.map((envelope, idx) => ({
          index: idx + 1,
          id: envelope._id || envelope.id,
          name: envelope.name || envelope.subject || `Envelope ${envelope._id || envelope.id}`,
          status: envelope.status,
          completedAt: envelope.completedAt,
          recipients: envelope.recipients || []
        })),
        count: filtered.length,
        recipientEmail: recipientEmail,
        date: date
      };
    } catch (error) {
      console.error('Error executing list signed documents:', error);
      throw error;
    }
  }

  // Execute select_document action
  async executeSelectDocument(parameters, userId, token, conversation) {
    try {
      const { documentIndex, previousAction } = parameters;

      if (!documentIndex || !Number.isFinite(Number(documentIndex))) {
        throw new Error('Document index is required');
      }

      // Get the last document list from conversation
      const lastList = conversation?.lastDocumentList || [];
      
      if (lastList.length === 0) {
        throw new Error('No previous document list found. Please list documents first.');
      }

      const idx = Math.min(lastList.length, Math.max(1, Number(documentIndex))) - 1;
      const selectedDoc = lastList[idx];

      if (!selectedDoc) {
        throw new Error(`Document at index ${documentIndex} not found. Please select a valid number.`);
      }

      // Store selected document for next action
      if (conversation) {
        conversation.selectedDocument = {
          id: selectedDoc.id,
          name: selectedDoc.name,
          category: selectedDoc.category
        };
        await conversation.save();
      }

      return {
        success: true,
        message: `Selected document: ${selectedDoc.name}`,
        document: {
          id: selectedDoc.id,
          name: selectedDoc.name,
          category: selectedDoc.category
        },
        nextStep: 'What would you like to do with this document? (e.g., send it, prepare it for signing)'
      };
    } catch (error) {
      console.error('Error executing select document:', error);
      throw error;
    }
  }

  // Format result for storage in conversation
  formatResultForStorage(action, result, parameters) {
    if (!result) return 'Action completed successfully.';

    switch (action) {
      case 'search_document':
        const docs = result.documents || [];
        if (docs.length === 0) {
          return 'No documents found matching your search.';
        }
        // Format results with document names (use name first, then subject/fallback)
        const docList = docs.map((doc, idx) => {
          const docId = doc.documentId || doc.id || doc._id || '';
          // For e-sign envelopes, check metadata.name first, then documentName, then metadata.subject
          let docName = 'Untitled Document';
          if (doc.serviceType === 'e-sign-service' || doc.source === 'e-sign-service') {
            docName = doc.metadata?.name || doc.documentName || doc.metadata?.subject || doc.name || 'Untitled Envelope';
          } else {
            docName = doc.documentName || doc.name || 'Untitled Document';
          }
          // Clean the name for the link format (remove colons and special chars that might break parsing)
          docName = docName.replace(/:/g, '-').replace(/\s+/g, ' ').trim();
          const serviceType = doc.serviceType || doc.source || 'document-service';
          const docType = doc.documentType || doc.type || 'document';
          // Format: [[doc:name:id:serviceType:docType]]
          return `${idx + 1}. [[doc:${docName}:${docId}:${serviceType}:${docType}]]`;
        }).join('\n');
        return `Found ${docs.length} document(s):\n${docList}`;

      case 'send_document':
        return `Document sent successfully to ${parameters.recipients?.length || 0} recipient(s).`;

      case 'prepare_document':
        return `Document prepared with ${result.fields || 0} field(s). ${result.nextSteps?.join('\n') || ''}`;

      case 'list_auth_providers':
        if (!result.providers || result.providers.length === 0) {
          return 'No authentication providers are currently configured for your subscription plan.';
        }
        const names = result.providers.map(p => p.name).join(', ');
        return `You currently have ${result.providers.length} authentication provider(s) available in your plan: ${names}.`;

      case 'create_and_send_envelope':
        if (result.isScheduled === true) {
          const scheduledDate = result.scheduledDate;
          const scheduledTime = result.scheduledTime;
          let scheduleInfo = '';
          if (scheduledDate) {
            try {
              const date = new Date(scheduledDate);
              const formattedDate = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              });
              scheduleInfo = ` for ${formattedDate}`;
              if (scheduledTime) {
                const [hours, minutes] = scheduledTime.split(':');
                const hour12 = parseInt(hours) % 12 || 12;
                const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                scheduleInfo += ` at ${hour12}:${minutes} ${ampm}`;
              }
            } catch (e) {
              scheduleInfo = ` for ${scheduledDate}`;
              if (scheduledTime) scheduleInfo += ` at ${scheduledTime}`;
            }
          }
          return `Envelope scheduled successfully${scheduleInfo}! It will be sent to ${result.recipients || 0} recipient(s) with ${result.signatureFields || 0} signature field(s) at the scheduled time.`;
        }
        return `Envelope created and sent successfully! Sent to ${result.recipients || 0} recipient(s) with ${result.signatureFields || 0} signature field(s).`;

      case 'generate_document':
        if (result.needsDetails) {
          return result.clarification || 'Please provide the required details.';
        }
        // Include clickable document link if documentId or envelopeId is available
        let message = result.message || `${result.documentName || 'Document'} generated successfully!`;
        
        // Generated documents are created in e-sign service, so use envelopeId (not documentId)
        const docId = result.envelopeId || result.documentId;
        if (docId) {
          // Use a clean document name (remove file extension and special chars that might break the format)
          const docName = (result.documentName || 'Generated Document').replace(/\.pdf$/i, '').replace(/:/g, '-').replace(/\s+/g, ' ');
          const docIdStr = docId.toString(); // Ensure it's a string
          
          // If envelopeId exists, it's in e-sign service; otherwise document service
          // Generated documents are ALWAYS in e-sign service, so prioritize envelopeId
          const serviceType = result.envelopeId ? 'e-sign-service' : (result.serviceType || 'document-service');
          const docType = result.envelopeId ? 'envelope' : 'document';
          
          // Format: [[doc:name:id:serviceType:docType]]
          message += `\n\n📄 View document: [[doc:${docName}:${docIdStr}:${serviceType}:${docType}]]`;
          console.log('🔗 Created document link in formatResultForStorage:', { 
            docName, 
            docId: docIdStr, 
            serviceType, 
            docType, 
            hasEnvelopeId: !!result.envelopeId,
            resultEnvelopeId: result.envelopeId,
            resultServiceType: result.serviceType
          });
        } else {
          console.warn('⚠️ generate_document result missing documentId/envelopeId in formatResultForStorage:', result);
        }
        
        // If document was auto-sent, show confirmation instead of asking for email
        if (result.autoSent && result.sendResult) {
          const recipients = result.sendResult.recipients || 0;
          const signatureFields = result.sendResult.signatureFields || 0;
          
          // Check if it was scheduled or sent
          if (result.autoScheduled === true) {
            const scheduledDate = result.sendResult.scheduledDate || result.sendResult.scheduledDate;
            const scheduledTime = result.sendResult.scheduledTime || result.sendResult.scheduledTime;
            let scheduleInfo = '';
            if (scheduledDate) {
              try {
                const date = new Date(scheduledDate);
                const formattedDate = date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                });
                scheduleInfo = ` for ${formattedDate}`;
                if (scheduledTime) {
                  const [hours, minutes] = scheduledTime.split(':');
                  const hour12 = parseInt(hours) % 12 || 12;
                  const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                  scheduleInfo += ` at ${hour12}:${minutes} ${ampm}`;
                }
              } catch (e) {
                // If date parsing fails, just show the raw date
                scheduleInfo = ` for ${scheduledDate}`;
                if (scheduledTime) scheduleInfo += ` at ${scheduledTime}`;
              }
            }
            message += `\n\n✅ Document scheduled successfully${scheduleInfo}! It will be sent to ${recipients} recipient(s) with ${signatureFields} signature field(s) at the scheduled time.`;
          } else {
            message += `\n\n✅ Document sent successfully to ${recipients} recipient(s) with ${signatureFields} signature field(s)!`;
          }
          
          if (result.autoSendError) {
            message += `\n\n⚠️ Note: ${result.autoSendError}`;
          }
        } else if (result.nextStep && !result.autoSent) {
          // Only show nextStep if document was not auto-sent
          message += `\n\n${result.nextStep}`;
        }
        return message;

      case 'list_documents_by_category':
        const categoryDocs = result.documents || [];
        if (categoryDocs.length === 0) {
          return `No ${result.category || 'documents'} found.`;
        }
        const list = categoryDocs.map((doc, idx) => {
          const docId = doc.id || doc._id || '';
          let docName = doc.name || 'Untitled Document';
          // Clean the name for the link format (remove colons and special chars that might break parsing)
          docName = docName.replace(/:/g, '-').replace(/\s+/g, ' ').trim();
          // Normalize serviceType: if it's 'envelope', convert to 'e-sign-service'
          let serviceType = doc.serviceType || doc.source || 'document-service';
          if (serviceType === 'envelope') {
            serviceType = 'e-sign-service';
          }
          const docType = doc.type || 'document';
          // Format: [[doc:name:id:serviceType:docType]]
          return `${idx + 1}. [[doc:${docName}:${docId}:${serviceType}:${docType}]]`;
        }).join('\n');
        return `Found ${categoryDocs.length} ${result.category || 'document(s)'}:\n${list}\n\nYou can select one by saying "choose [number]" or "select [number]".`;

      case 'list_shared_documents':
        const sharedDocs = result.documents || [];
        const recipientEmail = result.recipientEmail;
        const date = result.date;
        const status = parameters?.status || result.status || null;
        const isDraft = status && status.toLowerCase() === 'draft';
        
        if (sharedDocs.length === 0) {
          if (recipientEmail === 'current_user' || !recipientEmail) {
            const dateText = date ? ` on ${date}` : '';
            const verb = isDraft ? 'drafted' : 'shared';
            return `You haven't ${verb} any documents${dateText}.`;
          }
          return `No documents shared to ${recipientEmail}.`;
        }
        
        const sharedList = sharedDocs.map((doc, idx) => {
          const docId = doc.id || doc._id || '';
          // For e-sign envelopes, ensure we use name first, then subject
          let docName = doc.name || 'Untitled Document';
          if (doc.serviceType === 'envelope' || doc.serviceType === 'e-sign-service' || doc.source === 'e-sign-service') {
            // The name should already be set correctly from list_shared_documents, but ensure it's clean
            docName = doc.name || 'Untitled Envelope';
          }
          // Clean the name for the link format (remove colons and special chars that might break parsing)
          docName = docName.replace(/:/g, '-').replace(/\s+/g, ' ').trim();
          // Normalize serviceType: if it's 'envelope', convert to 'e-sign-service'
          let serviceType = doc.serviceType || doc.source || 'document-service';
          if (serviceType === 'envelope') {
            serviceType = 'e-sign-service';
          }
          const docType = doc.type || 'document';
          // Format: [[doc:name:id:serviceType:docType]]
          return `${idx + 1}. [[doc:${docName}:${docId}:${serviceType}:${docType}]]`;
        }).join('\n');
        
        if (recipientEmail === 'current_user' || !recipientEmail) {
          const dateText = date ? ` on ${date}` : '';
          if (isDraft) {
            return `You drafted ${sharedDocs.length} document(s)${dateText}:\n${sharedList}`;
          } else {
            return `You shared ${sharedDocs.length} document(s)${dateText}:\n${sharedList}`;
          }
        }
        
        return `Found ${sharedDocs.length} shared document(s) to ${recipientEmail}:\n${sharedList}`;

      case 'list_signed_documents':
        const signedDocs = result.documents || [];
        if (signedDocs.length === 0) {
          return `No documents signed by ${result.recipientEmail || 'the specified recipient'} on ${result.date || 'the specified date'}.`;
        }
        const signedList = signedDocs.map((doc, idx) => {
          const docId = doc.id || doc._id || '';
          let docName = doc.name || 'Untitled Document';
          // Clean the name for the link format (remove colons and special chars that might break parsing)
          docName = docName.replace(/:/g, '-').replace(/\s+/g, ' ').trim();
          // Normalize serviceType: if it's 'envelope', convert to 'e-sign-service'
          let serviceType = doc.serviceType || doc.source || 'document-service';
          if (serviceType === 'envelope') {
            serviceType = 'e-sign-service';
          }
          const docType = doc.type || 'document';
          // Format: [[doc:name:id:serviceType:docType]]
          return `${idx + 1}. [[doc:${docName}:${docId}:${serviceType}:${docType}]]`;
        }).join('\n');
        return `Found ${signedDocs.length} document(s) signed by ${result.recipientEmail} on ${result.date}:\n${signedList}`;

      case 'select_document':
        if (result.document) {
          const docId = result.document.id || result.document._id || '';
          const serviceType = result.document.serviceType || result.document.source || 'document-service';
          const docType = result.document.type || 'document';
          const docLink = `[[doc:${result.document.name || 'document'}:${docId}:${serviceType}:${docType}]]`;
          return result.message || `Selected: ${docLink}. ${result.nextStep || ''}`;
        }
        return result.message || `Selected: ${result.document?.name || 'document'}. ${result.nextStep || ''}`;

      default:
        return 'Action completed successfully.';
    }
  }

  // Get conversation history (specific conversation or most recent)
  async getConversationHistory(req, res) {
    try {
      const userId = req.user.data.id;
      const { conversationId, limit = 50 } = req.query;

      let conversation = null;
      
      if (conversationId) {
        // Get specific conversation
        conversation = await Conversation.findOne({ _id: conversationId, userId });
      } else {
        // Get most recent active conversation
        conversation = await Conversation.findOne({ userId, isActive: true })
          .sort({ updatedAt: -1 });
      }

      if (conversation) {
        res.json({
          success: true,
          conversationId: conversation._id.toString(),
          title: conversation.title,
          messages: conversation.messages.slice(-limit)
        });
      } else {
        res.json({
          success: true,
          conversationId: null,
          title: 'New Chat',
          messages: []
        });
      }
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }

  // List all conversations for user
  async listConversations(req, res) {
    try {
      const userId = req.user.data.id;
      const { limit = 50 } = req.query;

      const conversations = await Conversation.find({ userId })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .select('_id title updatedAt createdAt messages')
        .lean();

      const formattedConversations = conversations.map(conv => ({
        id: conv._id.toString(),
        title: conv.title || 'New Chat',
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt,
        messageCount: conv.messages?.length || 0,
        preview: conv.messages && conv.messages.length > 0 
          ? conv.messages[conv.messages.length - 1].content.substring(0, 100)
          : ''
      }));

      res.json({
        success: true,
        conversations: formattedConversations
      });
    } catch (error) {
      console.error('Error listing conversations:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }

  // Create new conversation
  async createConversation(req, res) {
    try {
      const userId = req.user.data.id;
      const { title } = req.body;

      // Mark all existing conversations as inactive
      await Conversation.updateMany(
        { userId, isActive: true },
        { isActive: false }
      );

      // Create new conversation
      const conversation = new Conversation({
        userId,
        title: title || 'New Chat',
        isActive: true,
        messages: []
      });
      await conversation.save();

      res.json({
        success: true,
        conversationId: conversation._id.toString(),
        title: conversation.title
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }

  // Update conversation title
  async updateConversationTitle(req, res) {
    try {
      const userId = req.user.data.id;
      const { conversationId } = req.params;
      const { title } = req.body;

      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }

      const conversation = await Conversation.findOneAndUpdate(
        { _id: conversationId, userId },
        { title: title.trim().substring(0, 100) },
        { new: true }
      );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      res.json({
        success: true,
        conversationId: conversation._id.toString(),
        title: conversation.title
      });
    } catch (error) {
      console.error('Error updating conversation title:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }

  // Delete conversation
  async deleteConversation(req, res) {
    try {
      const userId = req.user.data.id;
      const { conversationId } = req.params;

      const conversation = await Conversation.findOneAndDelete({ _id: conversationId, userId });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      res.json({
        success: true,
        message: 'Conversation deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }

  // Helper method to extract scheduling information from text
  extractSchedulingFromText(text) {
    if (!text || typeof text !== 'string') {
      return { isScheduled: false, scheduledDate: null, scheduledTime: null };
    }

    const lowerText = text.toLowerCase();
    let isScheduled = false;
    let scheduledDate = null;
    let scheduledTime = null;

    // Check for scheduling keywords
    const hasScheduleKeywords = /schedule|send\s+(?:later|on|at|for)|delay|tomorrow|next\s+(?:week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(text);
    
    if (hasScheduleKeywords) {
      isScheduled = true;

      // Extract date patterns
      // "today"
      if (lowerText.includes('today')) {
        const today = new Date();
        scheduledDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
      }
      // "tomorrow"
      else if (lowerText.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        scheduledDate = tomorrow.toISOString().split('T')[0];
      }
      // Date patterns: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, "December 15, 2025", etc.
      else {
        // Try various date formats
        const datePatterns = [
          /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY or MM/DD/YYYY
          /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
          /(?:on|for)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
          /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i
        ];

        for (const pattern of datePatterns) {
          const match = text.match(pattern);
          if (match) {
            try {
              let dateStr;
              if (pattern === datePatterns[0]) {
                // DD/MM/YYYY or MM/DD/YYYY - assume DD/MM/YYYY
                const [, day, month, year] = match;
                dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              } else if (pattern === datePatterns[1]) {
                // YYYY-MM-DD
                dateStr = match[0];
              } else {
                // Month name format
                const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                const monthIndex = months.indexOf(match[1].toLowerCase());
                if (monthIndex !== -1) {
                  const month = (monthIndex + 1).toString().padStart(2, '0');
                  const day = match[2].replace(/\D/g, '').padStart(2, '0');
                  const year = match[3];
                  dateStr = `${year}-${month}-${day}`;
                }
              }
              
              if (dateStr) {
                // Validate date
                const testDate = new Date(dateStr);
                if (!isNaN(testDate.getTime())) {
                  scheduledDate = dateStr;
                  break;
                }
              }
            } catch (e) {
              // Continue to next pattern
            }
          }
        }
      }

      // Extract time patterns
      // "05:29PM", "5:29 PM", "17:29", "at 5:29 PM", etc.
      const timePatterns = [
        /(\d{1,2}):(\d{2})\s*(AM|PM)/i, // 12-hour format
        /at\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i, // "at 5:29 PM"
        /(\d{1,2}):(\d{2})/ // 24-hour format (if no AM/PM)
      ];

      for (const pattern of timePatterns) {
        const match = text.match(pattern);
        if (match) {
          try {
            let hours = parseInt(match[1]);
            const minutes = match[2];
            
            // Handle AM/PM
            if (match[3]) {
              const isPM = match[3].toUpperCase() === 'PM';
              if (isPM && hours !== 12) {
                hours += 12;
              } else if (!isPM && hours === 12) {
                hours = 0;
              }
            }
            
            scheduledTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
            break;
          } catch (e) {
            // Continue to next pattern
          }
        }
      }
    }

    return {
      isScheduled,
      scheduledDate,
      scheduledTime
    };
  }

  // Clear conversation history (deprecated - use deleteConversation instead)
  async clearConversation(req, res) {
    try {
      const userId = req.user.data.id;
      await Conversation.deleteOne({ userId });
      res.json({
        success: true,
        message: 'Conversation cleared'
      });
    } catch (error) {
      console.error('Error clearing conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  }

  // Sync documents for indexing
  async syncDocuments(req, res) {
    try {
      const userId = req.user.data.id;
      const token = req.headers.authorization?.replace('Bearer ', '') || null;

      if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication token required.' });
      }

      const indexedCount = await ragService.syncUserDocuments(userId, token);
      res.json({
        success: true,
        message: `Successfully indexed ${indexedCount.indexed || indexedCount} documents.`,
        indexed: indexedCount.indexed || indexedCount,
        documents: indexedCount.documents,
        envelopes: indexedCount.envelopes
      });
    } catch (error) {
      console.error('Error syncing documents for AI assistant:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to sync documents for AI assistant.'
      });
    }
  }
}

module.exports = new AIAssistantController();
