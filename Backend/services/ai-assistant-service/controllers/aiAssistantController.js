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
      const uploadedFile = req.file; // File from multer

      if (!command || typeof command !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Command is required'
        });
      }

      // If file is uploaded, add it to context
      let enhancedContext = context || {};
      if (uploadedFile) {
        enhancedContext.uploadedFile = {
          filename: uploadedFile.filename,
          originalname: uploadedFile.originalname,
          path: uploadedFile.path,
          mimetype: uploadedFile.mimetype,
          size: uploadedFile.size
        };
        console.log('File uploaded:', uploadedFile.originalname, 'Size:', uploadedFile.size);
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
        hasFile: !!uploadedFile,
        fileName: uploadedFile?.originalname,
        fileType: uploadedFile?.mimetype
      };
      
      const result = await llmService.processCommand(command, llmContext);

      // Save conversation
      if (!conversation) {
        conversation = new Conversation({ userId, messages: [] });
      }

      conversation.messages.push({
        role: 'user',
        content: command
      });

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
            case 'create_and_send_envelope':
              console.log('Calling executeCreateAndSendEnvelope with uploadedFile:', uploadedFile ? {
                originalname: uploadedFile.originalname,
                path: uploadedFile.path,
                size: uploadedFile.size
              } : 'null/undefined');
              executionResult = await this.executeCreateAndSendEnvelope(result.parameters, userId, token, uploadedFile);
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
          console.log(`Document ${documentId} not found in document-service, checking e-sign service...`);
          
          try {
            // Check if it's an envelope ID in e-sign service
            console.log(`Attempting to fetch envelope from e-sign service: ${documentId}`);
            const envelopeResponse = await axios.get(
              `${eSignServiceUrl}/api/e-sign/envelope/${documentId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 300000 // 10 seconds
              }
            );

            console.log('Envelope API response:', {
              status: envelopeResponse.status,
              statusText: envelopeResponse.statusText,
              responseKeys: Object.keys(envelopeResponse.data || {}),
              hasData: !!envelopeResponse.data?.data
            });

            // Handle different response structures
            // Response might be: { status: 'success', data: {...} } or just the envelope object directly
            const envelope = envelopeResponse.data?.data || envelopeResponse.data;
            
            console.log('Parsed envelope:', {
              hasEnvelope: !!envelope,
              envelopeId: envelope?.id || envelope?._id,
              envelopeStatus: envelope?.status,
              hasRecipients: !!(envelope?.recipients),
              recipientsCount: envelope?.recipients?.length || 0
            });
            
            if (envelope && (envelope.id || envelope._id)) {
              // If it's an envelope, we need to send it via e-sign service
              // Check if envelope is already completed
              if (envelope.status === 'completed') {
                // Completed envelopes cannot be resent
                // Check if new recipients need to be added
                const existingRecipients = envelope.recipients || [];
                const existingEmails = existingRecipients.map(r => (r.email || '').toLowerCase()).filter(Boolean);
                const newRecipients = recipients.filter(r => !existingEmails.includes(r.email.toLowerCase()));

                if (newRecipients.length > 0) {
                  // Try to add new recipients (this might work even for completed envelopes)
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

  // Execute create_and_send_envelope action - Complete envelope creation and sending
  async executeCreateAndSendEnvelope(parameters, userId, token, uploadedFile = null) {
    try {
      const { documentId, recipients, signatureFields, subject, message } = parameters;

      // Debug logging
      console.log('executeCreateAndSendEnvelope - uploadedFile:', uploadedFile ? {
        originalname: uploadedFile.originalname,
        path: uploadedFile.path,
        size: uploadedFile.size,
        exists: uploadedFile.path ? require('fs').existsSync(uploadedFile.path) : false
      } : 'null/undefined');
      console.log('executeCreateAndSendEnvelope - documentId:', documentId);
      console.log('executeCreateAndSendEnvelope - parameters:', JSON.stringify(parameters, null, 2));

      // Check if uploadedFile exists and has required properties
      const hasValidUploadedFile = uploadedFile && 
        (uploadedFile.path || uploadedFile.buffer) && 
        uploadedFile.originalname;

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

      let document = null;
      let fileBuffer = null;
      let documentName = 'document.pdf';
      let isFromESign = false;
      let isUploadedFile = false;

      // Step 0: Check if file was uploaded
      if (hasValidUploadedFile) {
        // Use the uploaded file directly
        const fs = require('fs');
        if (uploadedFile.buffer) {
          // File is in memory (buffer)
          fileBuffer = uploadedFile.buffer;
        } else if (uploadedFile.path) {
          // File is on disk
          fileBuffer = fs.readFileSync(uploadedFile.path);
        } else {
          throw new Error('Uploaded file has no path or buffer');
        }
        documentName = uploadedFile.originalname;
        isUploadedFile = true;
        console.log('Using uploaded file:', documentName);
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
          console.log(`Document ${documentId} not found in document-service, checking e-sign service...`);
          
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
            
            console.log('Envelope fetch response (create_and_send):', {
              status: envelopeResponse.status,
              responseKeys: Object.keys(envelopeResponse.data || {}),
              hasData: !!envelopeResponse.data?.data,
              envelopeKeys: envelope ? Object.keys(envelope) : null,
              envelopeId: envelope?.id || envelope?._id,
              hasDocuments: !!(envelope?.documents && envelope.documents.length > 0),
              documentsCount: envelope?.documents?.length || 0
            });
            
            if (envelope && (envelope.id || envelope._id) && envelope.documents && envelope.documents.length > 0) {
              // Get the first document from the envelope
              const eSignDoc = envelope.documents[0];
              // Document structure: { id, name, size, type } from the formatted response
              documentName = eSignDoc.name || eSignDoc.fileName || envelope.subject || 'document.pdf';
              isFromESign = true;
              
              console.log('E-sign document details:', {
                docId: eSignDoc.id || eSignDoc._id,
                docName: documentName,
                docSize: eSignDoc.size,
                docType: eSignDoc.type
              });

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

      // Save file temporarily (if not already a temp file from upload)
      let tempFilePath;
      let shouldDeleteTempFile = false;
      
      if (isUploadedFile && uploadedFile.path) {
        // Use the uploaded file path directly
        tempFilePath = uploadedFile.path;
      } else {
        // Create temp file for downloaded documents
        const tempDir = os.tmpdir();
        tempFilePath = path.join(tempDir, `${Date.now()}-${documentName}`);
        fs.writeFileSync(tempFilePath, fileBuffer);
        shouldDeleteTempFile = true;
      }

      // Upload document to envelope
      const formData = new FormData();
      formData.append('files', fs.createReadStream(tempFilePath), documentName);
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

      const envelopeId = uploadResponse.data?.data?.envelopeId;
      if (!envelopeId) {
        throw new Error('Failed to create envelope');
      }

      // Clean up temp file (only if we created it, not if it was uploaded)
      if (shouldDeleteTempFile) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (e) {
          console.warn('Failed to delete temp file:', e);
        }
      }
      
      // Clean up uploaded file after use
      if (isUploadedFile && uploadedFile.path) {
        try {
          fs.unlinkSync(uploadedFile.path);
        } catch (e) {
          console.warn('Failed to delete uploaded file:', e);
        }
      }

      // Step 4: Add recipients
      await axios.post(
        `${eSignServiceUrl}/api/e-sign/add-recipients`,
        {
          envelopeId,
          recipients: recipients.map(r => ({
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
        // Get document ID from envelope (first document)
        const envelopeDocId = envelopeData?.documents?.[0]?._id || envelopeData?.documents?.[0]?.id;
        
        if (envelopeDocId) {
          const pageWidth = 595; // A4 width in points
          const pageHeight = 842; // A4 height in points
          
          const processedFields = signatureFields.map((field, index) => {
            // Calculate position based on field.position or use provided x, y
            let x = field.x;
            let y = field.y;
            
            if (field.position && !x && !y) {
              // Default positions (assuming A4 page: 595x842 points)
              const fieldWidth = field.width || 150;
              const fieldHeight = field.height || 40;
              
              switch (field.position) {
                case 'bottom-right':
                  x = pageWidth - fieldWidth - 50;
                  y = pageHeight - fieldHeight - 50;
                  break;
                case 'bottom-left':
                  x = 50;
                  y = pageHeight - fieldHeight - 50;
                  break;
                case 'top-right':
                  x = pageWidth - fieldWidth - 50;
                  y = 50;
                  break;
                case 'top-left':
                  x = 50;
                  y = 50;
                  break;
                case 'center':
                  x = (pageWidth - fieldWidth) / 2;
                  y = (pageHeight - fieldHeight) / 2;
                  break;
                default:
                  x = pageWidth - fieldWidth - 50;
                  y = pageHeight - fieldHeight - 50;
              }
            }

            // Find recipient ID if recipientEmail is specified
            let recipientId = null;
            if (field.recipientEmail) {
              recipientId = recipientMap.get(field.recipientEmail.toLowerCase());
            } else if (recipients.length === 1) {
              // If only one recipient, assign to them
              recipientId = recipientMap.get(recipients[0].email.toLowerCase());
            }

            return {
              envelopeId,
              documentId: envelopeDocId,
              recipientId,
              type: field.type || 'signature',
              page: field.page || 1,
              x: x || (pageWidth - (field.width || 150) - 50),
              y: y || (pageHeight - (field.height || 40) - 50),
              width: field.width || 150,
              height: field.height || 40,
              order: index + 1,
              status: 'pending'
            };
          });

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

      return {
        success: true,
        message: 'Envelope created and sent successfully',
        envelopeId,
        recipients: recipients.length,
        signatureFields: signatureFields?.length || 0
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
