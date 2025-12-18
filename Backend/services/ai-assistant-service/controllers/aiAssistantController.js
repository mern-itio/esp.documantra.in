const llmService = require('../services/llmService');
const ragService = require('../services/ragService');
const Conversation = require('../models/Conversation');
const axios = require('axios');

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

      // Get conversation history
      let conversation = await Conversation.findOne({ userId })
        .sort({ updatedAt: -1 });

      const previousMessages = conversation?.messages.slice(-10) || [];

      // Process command with LLM (include file info if uploaded)
      const llmContext = {
        previousMessages: previousMessages.map(m => ({
          role: m.role,
          content: m.content
        })),
        hasFile: uploadedFiles.length > 0,
        fileName: uploadedFiles[0]?.originalname,
        fileType: uploadedFiles[0]?.mimetype
      };
      
      const result = await llmService.processCommand(command, llmContext);

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
        const hasSignatureFields = signatureFields && signatureFields.length > 0;

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
              // console.log(
              //   'Calling executeCreateAndSendEnvelope with uploadedFiles:',
              //   uploadedFiles && uploadedFiles.length
              //     ? uploadedFiles.map(f => ({
              //         originalname: f.originalname,
              //         path: f.path,
              //         size: f.size
              //       }))
              //     : 'none'
              // );
              executionResult = await this.executeCreateAndSendEnvelope(result.parameters, userId, token, uploadedFiles);
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
        await conversation.save();

        return res.json({
          success: true,
          action: result.action,
          parameters: result.parameters,
          clarification: null,
          result: executionResult
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
      await conversation.save();

      return res.json({
        success: true,
        action: null,
        parameters: {},
        clarification: result.clarification || 'I didn\'t understand that command. Please try again.',
        message: result.clarification || 'I didn\'t understand that command. Please try again.'
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
      const searchResults = await ragService.hybridSearch({
        ...parameters,
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
                        timeout: 30000 // 30 seconds
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
                      timeout: 30000 // 30 seconds
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
  async executeCreateAndSendEnvelope(parameters, userId, token, uploadedFile = null) {
    try {
      const { documentId, recipients, signatureFields, subject, message } = parameters;

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
        // Step 1: Try to get document from document-service first
        try {
          const docResponse = await axios.get(
          `${documentServiceUrl}/api/documents/${documentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000 // 10 seconds for metadata
          }
        );

        document = docResponse.data?.data;
        if (document) {
          documentName = document.name || document.title || 'document.pdf';
          
          // Get document file from document-service with longer timeout for large files
          const fileResponse = await axios.get(
            `${documentServiceUrl}/api/documents/${documentId}/download`,
            {
              headers: { Authorization: `Bearer ${token}` },
              responseType: 'arraybuffer',
              timeout: 120000 // 2 minutes for file download
            }
          );
          fileBuffer = fileResponse.data;
        }
        } catch (docServiceError) {
        // If document not found in document-service, try e-sign service
        if (docServiceError.response?.status === 404) {
          // console.log(`Document ${documentId} not found in document-service, checking e-sign service...`);
          
          try {
            // Check if it's an envelope ID
            const envelopeResponse = await axios.get(
              `${eSignServiceUrl}/api/e-sign/envelope/${documentId}`,
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );

            // Handle different response structures
            // Response might be: { status: 'success', data: {...} } or just the envelope object
            const envelope = envelopeResponse.data?.data || envelopeResponse.data;
            
            // console.log('Envelope fetch response (create_and_send):', {
            //   status: envelopeResponse.status,
            //   responseKeys: Object.keys(envelopeResponse.data || {}),
            //   hasData: !!envelopeResponse.data?.data,
            //   envelopeKeys: envelope ? Object.keys(envelope) : null,
            //   envelopeId: envelope?.id || envelope?._id,
            //   hasDocuments: !!(envelope?.documents && envelope.documents.length > 0),
            //   documentsCount: envelope?.documents?.length || 0
            // });
            
            if (envelope && (envelope.id || envelope._id) && envelope.documents && envelope.documents.length > 0) {
              // Get the first document from the envelope
              const eSignDoc = envelope.documents[0];
              // Document structure: { id, name, size, type } from the formatted response
              documentName = eSignDoc.name || eSignDoc.fileName || envelope.subject || 'document.pdf';
              isFromESign = true;
              
              // console.log('E-sign document details:', {
              //   docId: eSignDoc.id || eSignDoc._id,
              //   docName: documentName,
              //   docSize: eSignDoc.size,
              //   docType: eSignDoc.type
              // });

              // Get document file from e-sign service
              // Try to download the signed document if available, otherwise use original
              const fs = require('fs');
              const path = require('path');
              
              try {
                // First, try to get signed document if available
                const downloadResponse = await axios.get(
                  `${eSignServiceUrl}/api/e-sign/signatures/download/${eSignDoc._id || eSignDoc.id}`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'arraybuffer',
                    timeout: 120000 // 2 minutes for file download
                  }
                );
                fileBuffer = downloadResponse.data;
              } catch (downloadError) {
                // If signed document not available, try to read from file system
                if (eSignDoc.filePath) {
                  // Try relative path first (from e-sign service uploads folder)
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
                    // If file not found locally, we need to use the filePath as provided
                    // The e-sign service upload endpoint should handle it
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
            
            // If it's a 404, the envelope doesn't exist or user doesn't have access
            if (eSignError.response?.status === 404) {
              throw new Error(`Envelope not found or you don't have access to it. Document ID: ${documentId}. Please verify you have access to this envelope.`);
            }
            
            // If it's a 403, user doesn't have permission
            if (eSignError.response?.status === 403) {
              throw new Error(`You don't have permission to access this envelope. Document ID: ${documentId}`);
            }
            
            // If it's a 401, authentication issue
            if (eSignError.response?.status === 401) {
              throw new Error(`Authentication failed. Please check your access token.`);
            }
            
            const errorMessage = eSignError.response?.data?.message || eSignError.message || 'Unknown error';
            throw new Error(`Document not found in document-service or e-sign service. Document ID: ${documentId}. Error: ${errorMessage}`);
          }
        } else {
          throw docServiceError;
        }
        } // Close the else if (documentId) block
      } else {
        // No documentId and no uploaded file
        throw new Error('No document provided. Please attach a file or provide a document ID.');
      }

      if (!fileBuffer) {
        throw new Error('Could not retrieve document file');
      }

      // Step 2: Create envelope in e-sign service
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

      const envelopeId = uploadResponse.data?.data?.envelopeId || uploadResponse.data?.data?._id || uploadResponse.data?.data?.id;
      if (!envelopeId) {
        throw new Error('Failed to create envelope');
      }

      // Step 4: Add recipients (include authentication providers if any)
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

      await axios.post(
        `${eSignServiceUrl}/api/e-sign/add-recipients`,
        {
          envelopeId,
          recipients: recipientsPayload
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000 // 30 seconds
        }
      );

      // Step 5: Get recipient IDs for signature field assignment
      const envelopeDetailResponse = await axios.get(
        `${eSignServiceUrl}/api/e-sign/envelope/${envelopeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000 // 30 seconds
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

          await axios.post(
            `${eSignServiceUrl}/api/e-sign/save-signature-fields`,
            {
              envelopeId,
              signatureFields: processedFields
            },
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 30000 // 30 seconds
            }
          );
        }
      }

      // Step 7: Send the envelope
      await axios.post(
        `${eSignServiceUrl}/api/e-sign/send-envelope/${envelopeId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 60000 // 1 minute for sending
        }
      );

      // Step 8: Deduct credits for authentication providers (if any)
      let creditsDebited = 0;
      const authUsage = [];

      if (recipientsAuthInfo.size > 0 && token) {
        // console.log('AI Assistant starting credit consumption for auth providers:', {
        //   subscriptionServiceUrl,
        //   recipientsWithAuth: Array.from(recipientsAuthInfo.keys())
        // });
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

      return {
        success: true,
        message: 'Envelope created and sent successfully',
        envelopeId,
        recipients: recipients.length,
        signatureFields: signatureFields?.length || 0,
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

  // Format result for storage in conversation
  formatResultForStorage(action, result, parameters) {
    if (!result) return 'Action completed successfully.';

    switch (action) {
      case 'search_document':
        const docs = result.documents || [];
        if (docs.length === 0) {
          return 'No documents found matching your search.';
        }
        return `Found ${docs.length} document(s). Click on any document to view details.`;

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
        return `Envelope created and sent successfully! Sent to ${result.recipients || 0} recipient(s) with ${result.signatureFields || 0} signature field(s).`;

      default:
        return 'Action completed successfully.';
    }
  }

  // Get conversation history
  async getConversationHistory(req, res) {
    try {
      const userId = req.user.data.id;
      const { limit = 50 } = req.query;

      const conversation = await Conversation.findOne({ userId })
        .sort({ updatedAt: -1 })
        .limit(1);

      if (conversation) {
        res.json({
          success: true,
          messages: conversation.messages.slice(-limit)
        });
      } else {
        res.json({
          success: true,
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

  // Clear conversation history
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
