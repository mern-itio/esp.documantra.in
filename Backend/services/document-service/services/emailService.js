const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    // Don't initialize immediately, wait for environment to be ready
  }

  initializeTransporter() {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('⚠️ Email service not configured: Missing EMAIL_USER or EMAIL_PASSWORD');
      console.log('🔍 Current env vars:', {
        EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
        EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET',
        EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail'
      });
      return;
    }

    try {
      // Configure email transporter
      if (process.env.EMAIL_SERVICE === 'sendgrid') {
        // SendGrid configuration (allows custom from addresses)
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: process.env.EMAIL_PASSWORD // SendGrid API key
          }
        });
      } else {
        // Gmail configuration (restricts from addresses)
        this.transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          },
          // Add additional options for Gmail
          ...(process.env.EMAIL_SERVICE === 'gmail' && {
            secure: true,
            port: 465
          })
        });
      }
      
      // console.log('✅ Email service configured successfully');
      // console.log('🔍 Using service:', process.env.EMAIL_SERVICE || 'gmail');
      // console.log('🔍 From email:', process.env.EMAIL_FROM || process.env.EMAIL_USER);
      // console.log('🔍 User email:', process.env.EMAIL_USER);
      // console.log('🔍 Password length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0);
    } catch (error) {
      console.error('❌ Failed to configure email service:', error);
      this.transporter = null;
    }
  }

  // Check if email service is properly configured
  isConfigured() {
    return !!(this.transporter && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
  }

  // Send workflow assignment notification
  async sendWorkflowAssignment(assigneeEmail, assigneeName, workflowName, documentName, documentId, stepName, dueDate, senderEmail = null) {
    // Check if email service is configured
    if (!this.isConfigured()) {
      console.log(`⚠️ Email service not configured, skipping workflow assignment email to ${assigneeEmail}`);
      return false;
    }

    const subject = `Workflow Assignment: ${stepName} - ${workflowName}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">📋 New Workflow Assignment</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #3498db; margin-bottom: 15px;">${stepName}</h3>
            <p style="color: #555; margin-bottom: 10px;"><strong>Workflow:</strong> ${workflowName}</p>
            <p style="color: #555; margin-bottom: 10px;"><strong>Document:</strong> ${documentName}</p>
            ${dueDate ? `<p style="color: #555; margin-bottom: 10px;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60;">
            <p style="margin: 0; color: #27ae60;">
              <strong>You have been assigned to review and edit this document.</strong>
            </p>
          </div>
          
          <div style="margin-top: 20px; text-align: center;">
            <a href="${process.env.FRONTEND_URL}" 
               style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Open Document
            </a>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              This email was sent automatically by the Document Management System.
              You can now access and edit this document as a collaborator.
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      // Use the user's email as sender
      const fromAddress = senderEmail || process.env.EMAIL_USER;
      const fromName = `"${assigneeName}" <${fromAddress}>`;
      
      await this.transporter.sendMail({
        from: fromName,
        to: assigneeEmail,
        subject: subject,
        html: htmlContent
      });
      
      console.log(`✅ Workflow assignment email sent to ${assigneeEmail} from ${fromName} (on behalf of ${senderEmail})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send workflow assignment email to ${assigneeEmail}:`, error);
      return false;
    }
  }

  // Send workflow completion notification
  async sendWorkflowCompletion(workflowName, documentName, completedBy, completedSteps, senderEmail = null) {
    // Check if email service is configured
    if (!this.isConfigured()) {
      console.log(`⚠️ Email service not configured, skipping workflow completion email`);
      return false;
    }

    const subject = `Workflow Completed: ${workflowName}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #27ae60; margin-bottom: 20px;">✅ Workflow Completed</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #2c3e50; margin-bottom: 15px;">${workflowName}</h3>
            <p style="color: #555; margin-bottom: 10px;"><strong>Document:</strong> ${documentName}</p>
            <p style="color: #555; margin-bottom: 10px;"><strong>Completed by:</strong> ${completedBy}</p>
            <p style="color: #555; margin-bottom: 10px;"><strong>Completed at:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60;">
            <p style="margin: 0; color: #27ae60;">
              <strong>All workflow steps have been completed successfully!</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      // Send to workflow creator and all assignees
      const recipients = [senderEmail || process.env.EMAIL_USER];
      
      for (const recipient of recipients) {
        // Use the user's email as sender
        const fromAddress = senderEmail || process.env.EMAIL_USER;
        const fromName = `"${completedBy}" <${fromAddress}>`;
        
        await this.transporter.sendMail({
          from: fromName,
          to: recipient,
          subject: subject,
          html: htmlContent
        });
      }
      
      console.log(`✅ Workflow completion notification sent from ${fromName} (on behalf of ${senderEmail})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send workflow completion notification:`, error);
      return false;
    }
  }

  // Send step completion notification
  async sendStepCompletion(workflowName, documentName, stepName, completedBy, status, comment = null, senderEmail = null) {
    // Check if email service is configured
    if (!this.isConfigured()) {
      console.log(`⚠️ Email service not configured, skipping step completion email`);
      return false;
    }

    const isRejected = status === 'rejected';
    const statusText = isRejected ? 'Rejected' : 'Completed';
    const statusColor = isRejected ? '#e74c3c' : '#27ae60';
    const statusIcon = isRejected ? '❌' : '✅';
    const statusBg = isRejected ? '#fce8e6' : '#e8f5e8';

    const subject = `Step ${statusText}: ${stepName} - ${workflowName}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: ${statusColor}; margin-bottom: 20px;">${statusIcon} Step ${statusText}</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #2c3e50; margin-bottom: 15px;">${workflowName}</h3>
            <p style="color: #555; margin-bottom: 10px;"><strong>Document:</strong> ${documentName}</p>
            <p style="color: #555; margin-bottom: 10px;"><strong>Step:</strong> ${stepName}</p>
            <p style="color: #555; margin-bottom: 10px;"><strong>${statusText} by:</strong> ${completedBy}</p>
            <p style="color: #555; margin-bottom: 10px;"><strong>${statusText} at:</strong> ${new Date().toLocaleString()}</p>
            <p style="color: #555; margin-bottom: 10px;"><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
          </div>
          
          ${comment ? `
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3498db;">
            <p style="margin: 0 0 5px 0; color: #2c3e50; font-weight: bold;">Comment:</p>
            <p style="margin: 0; color: #555;">${comment}</p>
          </div>
          ` : ''}
          
          <div style="background: ${statusBg}; padding: 15px; border-radius: 8px; border-left: 4px solid ${statusColor};">
            <p style="margin: 0; color: ${statusColor};">
              <strong>${isRejected ? 'This step has been rejected and may require attention.' : 'This step has been completed successfully!'}</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      // Send only to workflow creator
      const creatorEmail = senderEmail || process.env.EMAIL_USER;
      
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: creatorEmail,
        subject: subject,
        html: htmlContent
      });
      
      console.log(`✅ Step ${statusText.toLowerCase()} notification sent to creator: ${creatorEmail}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send step ${statusText.toLowerCase()} notification:`, error);
      return false;
    }
  }
  // Send collaborator invitation
  async sendCollaboratorInvitation(email, documentName, documentId, inviterName, permissions, senderEmail = null) {
    // Check if email service is configured
    if (!this.isConfigured()) {
      console.log(`⚠️ Email service not configured, skipping collaborator invitation email to ${email}`);
      return false;
    }

    const subject = `Document Collaboration Invitation: ${documentName}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #3498db; margin-bottom: 20px;">🤝 Collaboration Invitation</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #2c3e50; margin-bottom: 15px;">${documentName}</h3>
            <p style="color: #555; margin-bottom: 10px;"><strong>Invited by:</strong> ${inviterName}</p>
            <p style="color: #555; margin-bottom: 10px;"><strong>Permissions:</strong> ${permissions.join(', ')}</p>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60;">
            <p style="margin: 0; color: #27ae60;">
              <strong>You have been invited to collaborate on this document.</strong>
            </p>
          </div>
          
          <div style="margin-top: 20px; text-align: center;">
            <a href="${process.env.FRONTEND_URL}" 
               style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept & Open Document
            </a>
          </div>
        </div>
      </div>
    `;

    try {
      // Use the user's email as sender
      const fromAddress = senderEmail || process.env.EMAIL_USER;
      const fromName = `"${inviterName}" <${fromAddress}>`;
      
      await this.transporter.sendMail({
        from: fromName,
        to: email,
        subject: subject,
        html: htmlContent
      });
      
      console.log(`✅ Collaborator invitation email sent to ${email} from ${fromName} (on behalf of ${senderEmail})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send collaborator invitation email to ${email}:`, error);
      return false;
    }
  }

  // Send document share notification
  async sendDocumentShareNotification(email, documentName, documentId, sharerName, permission, message, senderEmail = null) {
    // Check if email service is configured
    if (!this.isConfigured()) {
      console.log(`⚠️ Email service not configured, skipping document share notification to ${email}`);
      return false;
    }


    const subject = `Document Shared: ${documentName}`;
    
    const permissionText = {
      'view': 'View Only',
      'comment': 'Comment',
      'edit': 'Edit'
    };
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #3498db; margin-bottom: 20px;">📄 Document Shared</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #2c3e50; margin-bottom: 15px;">${documentName}</h3>
            <p style="color: #555; margin-bottom: 10px;"><strong>Shared by:</strong> ${sharerName}</p>
            <p style="color: #555; margin-bottom: 10px;"><strong>Permission:</strong> ${permissionText[permission]}</p>
            ${message ? `<p style="color: #555; margin-bottom: 10px;"><strong>Message:</strong> ${message}</p>` : ''}
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60;">
            <p style="margin: 0; color: #27ae60;">
              <strong>You now have access to this document!</strong>
            </p>
          </div>
          
          <div style="margin-top: 20px; text-align: center;">
            <a href="${process.env.FRONTEND_URL}" 
               style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Open Document
            </a>
          </div>
        </div>
      </div>
    `;

    try {
      console.log('🔍 Email Service Debug - About to send email with from:', senderEmail);
      console.log('🔍 Email Service Debug - Authenticated user:', process.env.EMAIL_USER);
      
      // Use Gmail's authenticated email but show who actually sent it
      const fromAddress = process.env.EMAIL_USER; // Gmail requires this
      const fromName = `"${sharerName} (${senderEmail})" <${fromAddress}>`;
      
      await this.transporter.sendMail({
        from: fromName,
        to: email,
        subject: subject,
        html: htmlContent
      });
      
      console.log(`✅ Document share notification sent to ${email} from ${fromName} (on behalf of ${senderEmail})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send document share notification to ${email}:`, error);
      return false;
    }
  }

  // Send PDF share notification
  async sendPDFShareNotification(email, documentName, shareToken, sharerName, subject, message, shareUrl, senderEmail = null, cc = [], bcc = [], recipientType = 'TO', shareTime = null) {
    // Check if email service is configured
    if (!this.isConfigured()) {
      console.log(`⚠️ Email service not configured, skipping PDF share notification to ${email}`);
      return false;
    }

    const emailSubject = subject || `Document Shared: ${documentName}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #3498db; margin-bottom: 20px;">📄 Document Shared with You</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #2c3e50; margin-bottom: 15px;">${documentName}</h3>
            <p style="color: #555; margin-bottom: 10px;"><strong>Shared by:</strong> ${sharerName}</p>
            ${message ? `<p style="color: #555; margin-bottom: 10px;"><strong>Message:</strong> ${message}</p>` : ''}
            <p style="color: #555; margin-bottom: 10px;"><strong>Shared at:</strong> ${shareTime ? new Date(shareTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60; margin-bottom: 20px;">
            <p style="margin: 0; color: #27ae60;">
              <strong>You can now view this document!</strong>
            </p>
          </div>
          
          <div style="margin-top: 20px; text-align: center;">
            <a href="${shareUrl}" 
               style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-bottom: 10px;">
              View Document
            </a>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              This document was shared with you via a secure link. You can view it directly without creating an account.
              If you have any questions, please contact ${sharerName} at ${senderEmail || 'the sender'}.
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      // Use the user's email as sender
      const fromAddress = senderEmail || process.env.EMAIL_USER;
      const fromName = `"${sharerName}" <${fromAddress}>`;
      
      // Prepare email options based on recipient type
      const mailOptions = {
        from: fromName,
        subject: emailSubject,
        html: htmlContent
      };

      // Handle different recipient types
      if (recipientType === 'TO_CC') {
        // Send email to TO and CC recipients (BCC recipients are not included)
        mailOptions.to = email; // TO recipients
        if (cc && cc.length > 0) {
          mailOptions.cc = cc.map(recipient => recipient.email || recipient).join(', ');
        }
      } else if (recipientType === 'BCC') {
        // For BCC recipients, they should see all TO and CC recipients
        // but they should be in the BCC field themselves
        mailOptions.to = email; // TO recipients (what BCC recipient sees as TO)
        if (cc && cc.length > 0) {
          mailOptions.cc = cc.map(recipient => recipient.email || recipient).join(', '); // CC recipients
        }
        mailOptions.bcc = bcc; // BCC recipient sees themselves in BCC field
      } else if (recipientType === 'ALL') {
        // Send one email with all recipients properly set
        mailOptions.to = email; // TO recipients
        if (cc && cc.length > 0) {
          mailOptions.cc = cc.map(recipient => recipient.email || recipient).join(', ');
        }
        if (bcc && bcc.length > 0) {
          mailOptions.bcc = bcc.map(recipient => recipient.email || recipient).join(', ');
        }
      } else if (recipientType === 'CC') {
        // For CC recipients, send as TO with BCC included (but not other CC recipients)
        mailOptions.to = email;
        if (bcc && bcc.length > 0) {
          mailOptions.bcc = bcc.map(recipient => recipient.email || recipient).join(', ');
        }
      } else {
        // For TO recipients, send as TO with CC and BCC included
        mailOptions.to = email;
        if (cc && cc.length > 0) {
          mailOptions.cc = cc.map(recipient => recipient.email || recipient).join(', ');
        }
        if (bcc && bcc.length > 0) {
          mailOptions.bcc = bcc.map(recipient => recipient.email || recipient).join(', ');
        }
      }
      
      await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ PDF share notification sent to ${email} (${recipientType}) from ${fromName} (on behalf of ${senderEmail})`);
      if (mailOptions.cc) {
        console.log(`📧 CC: ${mailOptions.cc}`);
      }
      if (mailOptions.bcc) {
        console.log(`📧 BCC: ${mailOptions.bcc}`);
      }
      return true;
    } catch (error) {
      console.error(`❌ Failed to send PDF share notification to ${email}:`, error);
      return false;
    }
  }

  // Send PDF share notification specifically for BCC recipients
  async sendPDFShareNotificationBCC(email, documentName, shareToken, sharerName, subject, message, shareUrl, senderEmail = null, shareTime = null) {
    // Check if email service is configured
    if (!this.isConfigured()) {
      console.log(`⚠️ Email service not configured, skipping PDF share notification to BCC ${email}`);
      return false;
    }

    const emailSubject = subject || `Document Shared: ${documentName}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #3498db; margin-bottom: 20px;">📄 Document Shared with You</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #2c3e50; margin-bottom: 15px;">${documentName}</h3>
            <p style="color: #555; margin-bottom: 10px;"><strong>Shared by:</strong> ${sharerName}</p>
            ${message ? `<p style="color: #555; margin-bottom: 10px;"><strong>Message:</strong> ${message}</p>` : ''}
            <p style="color: #555; margin-bottom: 10px;"><strong>Shared at:</strong> ${shareTime ? new Date(shareTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60; margin-bottom: 20px;">
            <p style="margin: 0; color: #27ae60;">
              <strong>You can now view this document!</strong>
            </p>
          </div>
          
          <div style="margin-top: 20px; text-align: center;">
            <a href="${shareUrl}" 
               style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-bottom: 10px;">
              View Document
            </a>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              This document was shared with you via a secure link. You can view it directly without creating an account.
              If you have any questions, please contact ${sharerName} at ${senderEmail || 'the sender'}.
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      // Use the user's email as sender
      const fromAddress = senderEmail || process.env.EMAIL_USER;
      const fromName = `"${sharerName}" <${fromAddress}>`;
      
      // For BCC, we need to send to a dummy address and BCC the actual recipient
      const mailOptions = {
        from: fromName,
        to: fromAddress, // Send to sender's own address as dummy TO
        bcc: email, // BCC the actual recipient
        subject: emailSubject,
        html: htmlContent
      };
      
      await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ PDF share notification sent to BCC ${email} from ${fromName} (on behalf of ${senderEmail})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send PDF share notification to BCC ${email}:`, error);
      return false;
    }
  }

  // Send test email
  async sendTestEmail(senderEmail = null) {
    // Check if email service is configured
    if (!this.isConfigured()) {
      console.log(`⚠️ Email service not configured, skipping test email`);
      return false;
    }

    const subject = `Test Email - Document Service`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">🧪 Test Email</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #555; margin-bottom: 10px;">This is a test email from the Document Service.</p>
            <p style="color: #555; margin-bottom: 10px;"><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
            <p style="color: #555; margin-bottom: 10px;"><strong>Service:</strong> ${process.env.EMAIL_SERVICE || 'gmail'}</p>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60;">
            <p style="margin: 0; color: #27ae60;">
              <strong>Email service is working correctly!</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      // Use the user's email as sender
      const fromAddress = senderEmail || process.env.EMAIL_USER;
      const toAddress = senderEmail || process.env.EMAIL_USER;
      
      await this.transporter.sendMail({
        from: fromAddress,
        to: toAddress,
        subject: subject,
        html: htmlContent
      });
      
      console.log(`✅ Test email sent successfully to ${toAddress} from ${fromAddress}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send test email:`, error);
      throw error;
    }
  }
}

module.exports = new EmailService();
