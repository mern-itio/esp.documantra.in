# Email Service Setup Guide

## Overview
The document service includes an email notification system for workflows and collaboration. This system automatically sends emails when:
- Workflows are assigned to users
- Workflow steps are completed
- Users are invited to collaborate on documents

## Environment Variables Required

Add these variables to your `.env` file:

```bash
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
EMAIL_FROM=your_email@gmail.com

# Frontend URL for email links
FRONTEND_URL=http://localhost:5173
```

## Email Service Options

### Gmail Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Use the generated password as `EMAIL_PASSWORD`

### SendGrid Setup
1. Create a SendGrid account
2. Get your API key
3. Update the email service configuration in `services/emailService.js`:
   ```javascript
   this.transporter = nodemailer.createTransporter({
     host: 'smtp.sendgrid.net',
     port: 587,
     secure: false,
     auth: {
       user: 'apikey',
       pass: process.env.SENDGRID_API_KEY
     }
   });
   ```

### Custom SMTP Setup
```javascript
this.transporter = nodemailer.createTransporter({
  host: 'your-smtp-host.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});
```

## Email Templates

The system includes three email templates:

1. **Workflow Assignment**: Sent when a user is assigned to a workflow step
2. **Workflow Completion**: Sent when all workflow steps are completed
3. **Collaborator Invitation**: Sent when someone is invited to collaborate

## Testing Email Service

To test the email service:

1. Create a workflow with an assignee
2. Check the console for email sending logs
3. Verify emails are received by the assignee

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check email credentials
   - Ensure 2FA is enabled for Gmail
   - Verify app password is correct

2. **Emails Not Sending**
   - Check console logs for errors
   - Verify environment variables are set
   - Check email service configuration

3. **Email Links Not Working**
   - Verify `FRONTEND_URL` is correct
   - Ensure frontend is accessible

### Debug Mode

Enable debug logging by adding to your `.env`:
```bash
DEBUG_EMAIL=true
```

## Security Notes

- Never commit email credentials to version control
- Use environment variables for sensitive information
- Consider using email service providers with better security features
- Implement rate limiting for email sending in production
