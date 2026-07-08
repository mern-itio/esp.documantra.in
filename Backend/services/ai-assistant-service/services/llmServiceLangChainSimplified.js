const { ChatOpenAI } = require('@langchain/openai');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const { z } = require('zod');
const fs = require('fs');
const path = require('path');
const { ActionResponseSchema } = require('../schemas/actionSchemas');

/**
 * Simplified LLM Service - More natural, ChatGPT-like approach
 * Uses few-shot examples instead of verbose rules
 */
class LLMServiceLangChainSimplified {
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
        path.join(__dirname, '../knowledge-base.json')
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

      return {};
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      return {};
    }
  }

  buildPrompt() {
    const kb = this.knowledgeBase;
    let formatInstructions;
    try {
      formatInstructions = this.parser.getFormatInstructions();
    } catch (error) {
      console.warn('Could not get format instructions, using default:', error.message);
      formatInstructions = 'You must respond with valid JSON matching the action schema.';
    }
    
    // Escape curly braces for template
    const escapedFormatInstructions = formatInstructions.replace(/\{/g, '{{').replace(/\}/g, '}}');
    const kbString = JSON.stringify(kb, null, 2).replace(/\{/g, '{{').replace(/\}/g, '}}');
    
    // Simplified, natural prompt with few-shot examples
    const systemPrompt = `You are a helpful AI assistant for DocuMantra, a document management and e-signature platform.

Your role is to understand what users want and convert their requests into structured actions. Be conversational and helpful, just like ChatGPT.

AVAILABLE ACTIONS:
- search_document: Find documents by content, name, or metadata
- send_document: Share a document via email
- prepare_document: Add signature fields to a document
- create_and_send_envelope: Create e-sign envelope with signature fields and send. Supports scheduling - if user says "schedule for [date]", "send on [date]", "send later", "tomorrow", "at [time]", etc., extract isScheduled: true, scheduledDate (YYYY-MM-DD), and scheduledTime (HH:MM format, 24-hour)
- list_auth_providers: Show available authentication methods
- generate_document: Create a new document (NDA, contract, offer letter, etc.)
- list_documents_by_category: List documents of a specific type
- list_shared_documents: Show documents shared to someone, or show drafted documents/envelopes (use status: "draft" when user asks for drafts)
- list_signed_documents: Show documents signed by someone on a date
- select_document: Choose a document from a previous list

${escapedFormatInstructions}

EXAMPLES OF HOW TO RESPOND:

User: "generate offer letter for software developer position to sneha at ITIO, joining date 01/01/2026, salary 40,000"
Assistant: {{"action": "generate_document", "parameters": {{"category": "offer letter", "requirements": "software developer position to sneha at ITIO, joining date 01/01/2026, salary 40,000"}}, "clarification": null}}

User: "yes send the generated document to snehat@itio.in"
Assistant: {{"action": "create_and_send_envelope", "parameters": {{"documentId": null, "recipients": [{{"email": "snehat@itio.in", "name": "sneha"}}], "signatureFields": []}}, "clarification": null}}

User: "send it as envelope with one signature field at bottom left side with no auth to the recipient snehat@itio.in"
Assistant: {{"action": "create_and_send_envelope", "parameters": {{"documentId": null, "recipients": [{{"email": "snehat@itio.in", "name": "sneha"}}], "signatureFields": [{{"type": "signature", "page": 1, "position": "bottom-left"}}]}}, "clarification": null}}

User: "show me documents I shared today"
Assistant: {{"action": "list_shared_documents", "parameters": {{"recipientEmail": null, "date": "today"}}, "clarification": null}}

User: "show me documents I drafted on 18 november 2025"
Assistant: {{"action": "list_shared_documents", "parameters": {{"recipientEmail": null, "date": "2025-11-18", "status": "draft"}}, "clarification": null}}

User: "list all draft envelopes"
Assistant: {{"action": "list_shared_documents", "parameters": {{"recipientEmail": null, "status": "draft", "serviceType": "e-sign"}}, "clarification": null}}

User: "send this file to john@example.com with signature field"
Assistant: {{"action": "create_and_send_envelope", "parameters": {{"documentId": null, "recipients": [{{"email": "john@example.com", "name": "john"}}], "signatureFields": [{{"type": "signature", "page": 1, "position": "bottom-right"}}]}}, "clarification": null}}

User: "schedule this document to send tomorrow at 2 PM to snehat@itio.in with signature field"
Assistant: {{"action": "create_and_send_envelope", "parameters": {{"documentId": null, "recipients": [{{"email": "snehat@itio.in", "name": "sneha"}}], "signatureFields": [{{"type": "signature", "page": 1, "position": "bottom-right"}}], "isScheduled": true, "scheduledDate": "2025-12-16", "scheduledTime": "14:00"}}, "clarification": null}}

User: "add signature field at the bottom right and no auth"
Assistant: {{"action": "create_and_send_envelope", "parameters": {{"documentId": null, "recipients": [], "signatureFields": [{{"type": "signature", "page": 1, "position": "bottom-right"}}]}}, "clarification": "Who should receive this document? Please provide recipient email address."}}

User: "Add a signature at the bottom-right of page 1. no authentication"
Assistant: {{"action": "create_and_send_envelope", "parameters": {{"documentId": null, "recipients": [], "signatureFields": [{{"type": "signature", "page": 1, "position": "bottom-right"}}]}}, "clarification": "Which document should I add the signature to? Please provide the document ID or attach a file."}}

User: "what auth providers do you have?"
Assistant: {{"action": "list_auth_providers", "parameters": {{}}, "clarification": null}}

GUIDELINES:
- Understand context from conversation history
- If a document was just generated, use it when user says "send the generated document"
- Extract dates naturally: "today", "yesterday", "18th november 2025" → "2025-11-18"
- **SCHEDULING**: If user mentions "schedule", "send later", "send on [date]", "send at [time]", "tomorrow", etc., extract isScheduled: true, scheduledDate (YYYY-MM-DD), and scheduledTime (HH:MM, 24-hour format). Examples: "tomorrow at 2 PM" → scheduledDate: tomorrow's date, scheduledTime: "14:00"; "on December 15 at 3:30 PM" → scheduledDate: "2025-12-15", scheduledTime: "15:30"
- When user asks for "drafted documents", "draft envelopes", "documents I drafted", etc., use list_shared_documents with status: "draft" and recipientEmail: null
- When user says "add signature field at [position]" or "signature at [position]", create the signature field immediately with that position
- Common positions: "bottom right" → "bottom-right", "bottom left" → "bottom-left", "top right" → "top-right", "top left" → "top-left"
- When user says "no auth" or "no authentication", don't add any auth methods to recipients
- If user mentions "e-sign", "envelope", or "esign", set serviceType: "e-sign" for list_shared_documents
- If information is missing, ask a friendly question in the clarification field
- Always return valid JSON - never plain text explanations
- Be smart about understanding user intent - don't ask for clarification if you can infer it

PLATFORM INFO:
${kbString}

Remember: Be helpful, conversational, and smart. Understand what the user wants and make it happen.`;

    return ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      new MessagesPlaceholder('history'),
      ['human', '{input}']
    ]);
  }

  buildChain() {
    return RunnableSequence.from([
      {
        input: (x) => x.input,
        history: (x) => x.history || []
      },
      this.prompt,
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
      // Build history from previous messages (keep more context for better understanding)
      const history = (context.previousMessages || []).slice(-6).map(msg => {
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

      const result = await this.chain.invoke({
        input: userMessage,
        history: history
      });

      // Post-process dates if needed (minimal intervention)
      if (result.action === 'list_shared_documents' && result.parameters) {
        const lowerCommand = userCommand.toLowerCase();
        if ((lowerCommand.includes('today') || lowerCommand.includes('yesterday')) && !result.parameters.date) {
          result.parameters.date = lowerCommand.includes('today') ? 'today' : 'yesterday';
        }
      }

      // Post-process: If user mentions signature field with position but LLM didn't create it
      if (result.action === 'create_and_send_envelope' && result.parameters) {
        const lowerCommand = userCommand.toLowerCase();
        const hasSignatureMention = lowerCommand.includes('signature') || lowerCommand.includes('sign');
        const hasPosition = lowerCommand.includes('bottom-right') || lowerCommand.includes('bottom right') || 
                           lowerCommand.includes('bottom-left') || lowerCommand.includes('bottom left') ||
                           lowerCommand.includes('top-right') || lowerCommand.includes('top right') ||
                           lowerCommand.includes('top-left') || lowerCommand.includes('top left');
        
        // Extract page number if mentioned
        const pageMatch = userCommand.match(/page\s+(\d+)/i);
        const pageNumber = pageMatch ? parseInt(pageMatch[1]) : 1;
        
        if (hasSignatureMention && hasPosition && (!result.parameters.signatureFields || result.parameters.signatureFields.length === 0)) {
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
          }
          
          result.parameters.signatureFields = [{
            type: 'signature',
            page: pageNumber,
            position: position,
            width: 150,
            height: 40
          }];
          
          console.log('✅ Post-processed: Added signature field based on user command');
        }
        
        // Handle "no auth" or "no authentication"
        if ((lowerCommand.includes('no auth') || lowerCommand.includes('no authentication')) && result.parameters.recipients) {
          // Ensure recipients don't have auth methods
          result.parameters.recipients = result.parameters.recipients.map(r => ({
            ...r,
            authMethods: []
          }));
          console.log('✅ Post-processed: Removed authentication as requested');
        }
      }

      return result;
    } catch (error) {
      console.error('Error processing command with LangChain:', error);
      
      // Handle quota/rate limit errors
      if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
        console.error('OpenAI API quota/rate limit exceeded. Using fallback parser.');
        return {
          action: null,
          parameters: {},
          clarification: '⚠️ AI processing is temporarily limited. Please try again in a moment.'
        };
      }
      
      // Fallback
      return {
        action: null,
        parameters: {},
        clarification: 'I encountered an error. Could you please rephrase your request?'
      };
    }
  }
}

module.exports = new LLMServiceLangChainSimplified();

