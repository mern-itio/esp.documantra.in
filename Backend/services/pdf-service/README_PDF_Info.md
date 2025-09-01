# PDF Information Module

## Overview

The PDF Information module provides comprehensive analysis of PDF documents, extracting metadata, document statistics, security information, and detailed field analysis. This module helps users understand the structure, properties, and security status of their PDF documents.

## Features

- **Metadata Viewer**: Extract and display document metadata (title, author, subject, creator, producer, dates, keywords)
- **Document Statistics**: Analyze page count, form fields, file size, and page dimensions
- **Security Information**: Check encryption status, password protection, and document permissions
- **Field Analysis**: Categorize and count different types of form fields
- **Page Analysis**: Detailed information about each page including dimensions and orientation

## API Endpoints

### 1. Get Comprehensive PDF Information

**Endpoint:** `POST /pdf-info/get-info`

**Description:** Get complete PDF information including metadata, statistics, security, and page details.

**Request:**
```http
POST /pdf-info/get-info
Content-Type: multipart/form-data

pdf: [PDF file]
```

**Response:**
```json
{
  "success": true,
  "result": {
    "metadata": {
      "title": "Document Title",
      "author": "Document Author",
      "subject": "Document Subject",
      "creator": "Application that created the document",
      "producer": "Application that produced the document",
      "creationDate": "2024-01-15T10:30:00.000Z",
      "modificationDate": "2024-01-15T11:45:00.000Z",
      "keywords": ["keyword1", "keyword2"]
    },
    "statistics": {
      "pageCount": 5,
      "fieldCount": 12,
      "fieldTypes": {
        "text": 8,
        "checkbox": 2,
        "radio": 1,
        "dropdown": 1,
        "signature": 0,
        "unknown": 0
      },
      "fileSize": "245.67 KB",
      "fileSizeBytes": 251567
    },
    "security": {
      "isEncrypted": false,
      "isPasswordProtected": false,
      "permissions": {
        "print": true,
        "copy": true,
        "modify": true,
        "annotate": true,
        "fillForms": true,
        "extractText": true
      },
      "encryptionLevel": "None",
      "securityMethod": "None"
    },
    "pages": [
      {
        "pageNumber": 1,
        "width": 612,
        "height": 792,
        "orientation": "portrait"
      }
    ]
  }
}
```

### 2. Get Metadata Only

**Endpoint:** `POST /pdf-info/get-metadata`

**Description:** Extract only document metadata.

**Request:**
```http
POST /pdf-info/get-metadata
Content-Type: multipart/form-data

pdf: [PDF file]
```

**Response:**
```json
{
  "success": true,
  "result": {
    "title": "Document Title",
    "author": "Document Author",
    "subject": "Document Subject",
    "creator": "Application that created the document",
    "producer": "Application that produced the document",
    "creationDate": "2024-01-15T10:30:00.000Z",
    "modificationDate": "2024-01-15T11:45:00.000Z",
    "keywords": ["keyword1", "keyword2"]
  }
}
```

### 3. Get Document Statistics

**Endpoint:** `POST /pdf-info/get-statistics`

**Description:** Get document statistics and field analysis.

**Request:**
```http
POST /pdf-info/get-statistics
Content-Type: multipart/form-data

pdf: [PDF file]
```

**Response:**
```json
{
  "success": true,
  "result": {
    "pageCount": 5,
    "fieldCount": 12,
    "fieldTypes": {
      "text": 8,
      "checkbox": 2,
      "radio": 1,
      "dropdown": 1,
      "signature": 0,
      "unknown": 0
    },
    "fileSize": "245.67 KB",
    "fileSizeBytes": 251567,
    "pages": [
      {
        "pageNumber": 1,
        "width": 612,
        "height": 792,
        "orientation": "portrait"
      }
    ]
  }
}
```

### 4. Get Security Information

**Endpoint:** `POST /pdf-info/get-security`

**Description:** Get security and permission information.

**Request:**
```http
POST /pdf-info/get-security
Content-Type: multipart/form-data

pdf: [PDF file]
```

**Response:**
```json
{
  "success": true,
  "result": {
    "isEncrypted": false,
    "isPasswordProtected": false,
    "permissions": {
      "print": true,
      "copy": true,
      "modify": true,
      "annotate": true,
      "fillForms": true,
      "extractText": true
    },
    "encryptionLevel": "None",
    "securityMethod": "None"
  }
}
```

### 5. Get Service Status

**Endpoint:** `GET /pdf-info/status`

**Description:** Get service status and capabilities.

**Request:**
```http
GET /pdf-info/status
```

**Response:**
```json
{
  "success": true,
  "status": {
    "service": "PDF Information",
    "status": "operational",
    "version": "1.0.0",
    "features": [
      "metadata_viewer",
      "document_statistics",
      "security_info",
      "page_analysis",
      "field_analysis"
    ],
    "capabilities": {
      "supportedMetadata": [
        "title",
        "author",
        "subject",
        "creator",
        "producer",
        "creationDate",
        "modificationDate",
        "keywords"
      ],
      "supportedStatistics": [
        "pageCount",
        "fieldCount",
        "fieldTypes",
        "fileSize",
        "pageDimensions"
      ],
      "supportedSecurity": [
        "encryption",
        "permissions",
        "passwordProtection"
      ],
      "maxFileSize": "100MB",
      "supportedFormats": ["PDF"]
    },
    "timestamp": "2024-01-15T12:00:00.000Z"
  }
}
```

## Field Types Supported

The module categorizes form fields into the following types:

- **text**: Text input fields
- **checkbox**: Checkbox fields
- **radio**: Radio button groups
- **dropdown**: Dropdown/select fields
- **signature**: Signature fields
- **unknown**: Unrecognized field types

## Security Information

The security analysis provides information about:

- **Encryption Status**: Whether the document is encrypted
- **Password Protection**: Whether a password is required to open the document
- **Permissions**: Document-level permissions for various operations
- **Encryption Level**: Type of encryption used (if any)
- **Security Method**: Method of security implementation

## Page Analysis

For each page, the module provides:

- **Page Number**: Sequential page number
- **Width**: Page width in points
- **Height**: Page height in points
- **Orientation**: Portrait or landscape

## Error Handling

The module handles various error scenarios:

```json
{
  "success": false,
  "error": "PDF file is required"
}
```

```json
{
  "success": false,
  "error": "Failed to get PDF information",
  "details": "Error message details"
}
```

## Usage Examples

### Frontend Integration

```javascript
// Upload and analyze PDF
const formData = new FormData();
formData.append('pdf', file);

const response = await fetch('/pdf-info/get-info', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('PDF Info:', result.result);
```

### Node.js Integration

```javascript
const FormData = require('form-data');
const fs = require('fs');

const formData = new FormData();
formData.append('pdf', fs.createReadStream('document.pdf'));

const response = await fetch('http://localhost:2104/pdf-info/get-info', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Analysis complete:', result.result);
```

## Limitations

1. **Security Detection**: Basic security information detection. Advanced encryption methods may not be fully detected.
2. **Field Recognition**: Limited to standard PDF form field types.
3. **File Size**: Maximum file size of 100MB.
4. **Format Support**: Only PDF files are supported.

## Best Practices

1. **File Validation**: Always validate that the uploaded file is a valid PDF.
2. **Error Handling**: Implement proper error handling for failed analyses.
3. **User Feedback**: Provide clear feedback to users during analysis.
4. **Security**: Be aware that metadata may contain sensitive information.

## Troubleshooting

### Common Issues

1. **"PDF file is required"**: Ensure a PDF file is included in the request.
2. **"Failed to get PDF information"**: Check if the PDF file is corrupted or password-protected.
3. **Large file errors**: Ensure the file size is under 100MB.

### Debug Information

Enable detailed logging by checking the server console for error messages and processing details.

## Security Considerations

- Metadata may contain sensitive information about document creation and modification
- Security analysis provides basic information only
- Consider implementing access controls for sensitive documents
- Be cautious when displaying metadata in public interfaces
