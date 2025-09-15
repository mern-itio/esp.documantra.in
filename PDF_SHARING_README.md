# PDF Sharing Functionality

This document describes the new PDF sharing functionality that has been implemented in the Final Draft and Sign application.

## Overview

The PDF sharing feature allows users to upload PDF documents and share them with others via email or direct links. Recipients can view the documents without logging in, making it perfect for external collaboration.

## Features

### 1. PDF Upload for Sharing
- Users can upload PDF files specifically for sharing
- File size limit: 50MB
- Only PDF files are accepted
- Automatic preview generation using PDF.js

### 2. Email Sharing
- Add multiple recipients with email addresses
- Support for CC recipients
- Custom email subject and message
- Automatic email notifications sent to recipients

### 3. Link Sharing
- Generate secure share links
- Share links can be copied and shared manually
- No authentication required for recipients

### 4. Access Control
- Optional password protection
- Expiration dates for shared documents
- Download permission control
- Comment permission control

### 5. Public Document Viewer
- Auth-free document viewing interface
- PDF preview with zoom and navigation controls
- Download functionality (if allowed)
- View tracking and statistics

## Backend Implementation

### Models
- **SharedDocument**: Stores sharing information, recipients, and access controls
- **Document**: Extended to support shared documents

### API Endpoints
- `POST /api/pdf-share/upload` - Upload PDF for sharing
- `POST /api/pdf-share/share` - Create share and send emails
- `GET /api/pdf-share/my-shares` - Get user's shared documents
- `DELETE /api/pdf-share/revoke/:shareToken` - Revoke shared document
- `GET /api/pdf-share/view/:shareToken` - Get shared document (public)
- `POST /api/pdf-share/download/:shareToken` - Download shared document (public)

### Email Service
- Extended email service with PDF sharing notifications
- HTML email templates with document information
- Support for custom sender information

## Frontend Implementation

### Components
- **PDFShareModal**: Main sharing interface with step-by-step workflow
- **SharedDocumentViewer**: Public document viewer (no auth required)
- **PDFShareButton**: Integration button for document service

### Services
- **pdfShareService**: API service for PDF sharing operations
- Integration with existing PDF.js worker for document preview

### Routing
- Public route: `/shared/:shareToken` - No authentication required
- Integrated into existing document service interface

## Usage Flow

### For Document Owners:
1. Click "Share PDF" button in document service
2. Upload PDF file
3. Add recipient email addresses
4. Configure sharing options (permissions, expiration, password)
5. Preview document and settings
6. Send emails and generate share link

### For Recipients:
1. Receive email notification with share link
2. Click link to view document (no login required)
3. Enter password if required
4. View document with full PDF controls
5. Download document if permitted

## Security Features

- Secure token-based sharing (32-character random tokens)
- Optional password protection
- Expiration date support
- Access tracking and logging
- Revocable shares

## Integration Points

- Document Service: PDF sharing button in header
- Email Service: Notification emails
- PDF Service: Document preview and processing
- Authentication: JWT-based API access

## Environment Variables

Required environment variables:
- `EMAIL_USER`: Email service username
- `EMAIL_PASSWORD`: Email service password
- `EMAIL_SERVICE`: Email service provider (gmail, sendgrid)
- `FRONTEND_URL`: Frontend application URL for share links

## File Structure

```
Backend/services/document-service/
├── models/SharedDocument.js
├── controllers/pdfShareController.js
├── routes/pdfShareRoutes.js
└── services/emailService.js (extended)

Frontend/src/
├── services/pdfShareService.ts
├── components/DocumentService/sharing/
│   ├── PDFShareModal.tsx
│   ├── SharedDocumentViewer.tsx
│   └── PDFShareButton.tsx
└── pages/SharedDocument.tsx
```

## Testing

To test the functionality:

1. Start the document service backend
2. Start the frontend application
3. Navigate to document service
4. Click "Share PDF" button
5. Upload a PDF file
6. Add recipient email addresses
7. Configure sharing options
8. Send the share
9. Check email for share link
10. Access the shared document via the link

## Future Enhancements

- Bulk sharing capabilities
- Advanced permission controls
- Document analytics and insights
- Integration with cloud storage providers
- Mobile-optimized sharing interface
- Document watermarking for shared files
