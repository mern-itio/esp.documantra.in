# Fill PDF Forms Module

## Overview

The Fill PDF Forms module provides comprehensive functionality to fill out PDF forms digitally with features including auto-fill, data validation, signature fields, and bulk processing.

## Features

### Core Features
- **Auto-fill**: AI-powered automatic form filling using pattern recognition
- **Data Validation**: Comprehensive validation of form data before processing
- **Signature Fields**: Add digital signatures to form fields
- **Bulk Processing**: Process multiple PDF forms simultaneously
- **Template Management**: Save and reuse form data templates

### Additional Features
- **Form Field Extraction**: Extract and analyze form fields from PDFs
- **Form Flattening**: Convert form fields to static content
- **Multiple Output Options**: Keep forms editable or flatten them
- **CSV/JSON Import**: Import form data from external sources

## API Endpoints

### Base URL
```
http://localhost:2104/pdf-fill-form
```

### Endpoints

#### 1. Fill PDF Form
**POST** `/fill`
Fill a PDF form with provided data.

**Request:**
```javascript
// FormData
{
  pdf: File,                    // PDF file
  formData: JSON.stringify({    // Form field data
    "fieldName": "value",
    "checkboxField": true,
    "dropdownField": "option1"
  }),
  flatten: "false",             // Optional: flatten form
  keepEditable: "true"          // Optional: keep fields editable
}
```

**Response:**
```json
{
  "success": true,
  "message": "PDF form filled successfully",
  "result": {
    "filename": "filled_form_1234567890_abc123.pdf",
    "downloadUrl": "/downloads/filled_form_1234567890_abc123.pdf",
    "fieldsFilled": 5,
    "flattened": false,
    "editable": true
  }
}
```

#### 2. Auto-fill PDF Form
**POST** `/auto-fill`
Automatically fill PDF form using AI/pattern recognition.

**Request:**
```javascript
// FormData
{
  pdf: File,                    // PDF file
  autoFillRules: JSON.stringify({}),  // Auto-fill rules
  userData: JSON.stringify({    // User data for auto-fill
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "company": "ACME Corp",
    "title": "Manager"
  })
}
```

**Response:**
```json
{
  "success": true,
  "message": "PDF form auto-filled successfully",
  "result": {
    "filename": "auto_filled_form_1234567890_abc123.pdf",
    "downloadUrl": "/downloads/auto_filled_form_1234567890_abc123.pdf",
    "fieldsAutoFilled": 4,
    "autoFilledData": {
      "fullName": "John Doe",
      "emailAddress": "john@example.com",
      "phoneNumber": "+1234567890"
    },
    "confidence": 85
  }
}
```

#### 3. Validate Form Data
**POST** `/validate`
Validate form data before filling.

**Request:**
```json
{
  "formData": {
    "email": "john@example.com",
    "phone": "+1234567890",
    "age": "25"
  },
  "validationRules": {
    "email": {
      "type": "email",
      "required": true
    },
    "phone": {
      "pattern": "^\\+?[1-9]\\d{1,14}$",
      "required": true
    },
    "age": {
      "type": "number",
      "min": 18,
      "max": 100
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": [],
    "validatedFields": {
      "email": {
        "value": "john@example.com",
        "validation": { "isValid": true }
      }
    }
  }
}
```

#### 4. Extract Form Fields
**POST** `/extract-fields`
Extract form fields from a PDF.

**Request:**
```javascript
// FormData
{
  pdf: File  // PDF file
}
```

**Response:**
```json
{
  "success": true,
  "fields": [
    {
      "name": "fullName",
      "type": "PDFTextField",
      "required": true,
      "readOnly": false,
      "defaultValue": "",
      "currentValue": "",
      "maxLength": 50,
      "isMultiline": false
    },
    {
      "name": "email",
      "type": "PDFTextField",
      "required": true,
      "readOnly": false,
      "defaultValue": "",
      "currentValue": ""
    },
    {
      "name": "newsletter",
      "type": "PDFCheckBox",
      "required": false,
      "readOnly": false,
      "defaultValue": false,
      "currentValue": false
    }
  ],
  "totalFields": 3,
  "fieldTypes": ["PDFTextField", "PDFCheckBox"]
}
```

#### 5. Add Signature to Form
**POST** `/add-signature`
Add digital signature to a form field.

**Request:**
```javascript
// FormData
{
  pdf: File,                    // PDF file
  signatureData: JSON.stringify({
    "type": "text",             // "text" or "image"
    "text": "John Doe",         // For text signature
    "imageData": "data:image/png;base64,..."  // For image signature
  }),
  signatureField: "signature"   // Field name to add signature to
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signature added to PDF form successfully",
  "result": {
    "filename": "signed_form_1234567890_abc123.pdf",
    "downloadUrl": "/downloads/signed_form_1234567890_abc123.pdf",
    "signatureField": "signature",
    "signatureType": "text"
  }
}
```

#### 6. Bulk Fill Forms
**POST** `/bulk-fill`
Fill multiple PDF forms with the same data.

**Request:**
```javascript
// FormData
{
  pdfs: [File, File, File],     // Multiple PDF files
  formData: JSON.stringify({    // Form data to apply to all forms
    "name": "John Doe",
    "email": "john@example.com"
  }),
  flatten: "false"              // Optional: flatten forms
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk form filling completed",
  "results": {
    "processed": 3,
    "errors": 0,
    "files": [
      {
        "originalFile": "form1.pdf",
        "outputFile": "bulk_filled_form1_1234567890_abc123.pdf",
        "downloadUrl": "/downloads/bulk_filled_form1_1234567890_abc123.pdf",
        "fieldsFilled": 2,
        "flattened": false
      }
    ],
    "errorDetails": []
  }
}
```

#### 7. Save Template
**POST** `/save-template`
Save form data as a reusable template.

**Request:**
```json
{
  "templateName": "Employee Form Template",
  "formData": {
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Engineering"
  },
  "description": "Template for employee onboarding forms",
  "category": "hr"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Template saved successfully",
  "template": {
    "id": "template_1234567890_abc123",
    "name": "Employee Form Template",
    "description": "Template for employee onboarding forms",
    "category": "hr",
    "fieldsCount": 3
  }
}
```

#### 8. Get Saved Templates
**GET** `/templates?category=hr`

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": "template_1234567890_abc123",
      "name": "Employee Form Template",
      "description": "Template for employee onboarding forms",
      "category": "hr",
      "created": "2024-01-15T10:30:00.000Z",
      "updated": "2024-01-15T10:30:00.000Z",
      "fieldsCount": 3
    }
  ]
}
```

#### 9. Service Status
**GET** `/status`

**Response:**
```json
{
  "success": true,
  "status": {
    "service": "Fill PDF Forms",
    "status": "operational",
    "version": "1.0.0",
    "features": [
      "auto_fill",
      "data_validation",
      "signature_fields",
      "bulk_processing",
      "template_management"
    ],
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Field Types Supported

### Text Fields
- **PDFTextField**: Single-line and multi-line text input
- **PDFDropdown**: Dropdown selection with predefined options
- **PDFRadioGroup**: Radio button groups

### Interactive Fields
- **PDFCheckBox**: Checkbox fields
- **PDFSignature**: Digital signature fields

## Validation Rules

### Supported Validation Types
- **Required**: Field must have a value
- **Length**: Minimum and maximum character limits
- **Pattern**: Regular expression validation
- **Email**: Email format validation
- **Number**: Numeric value validation with min/max ranges

### Example Validation Rules
```json
{
  "email": {
    "type": "email",
    "required": true
  },
  "phone": {
    "pattern": "^\\+?[1-9]\\d{1,14}$",
    "required": true
  },
  "age": {
    "type": "number",
    "min": 18,
    "max": 100
  },
  "description": {
    "minLength": 10,
    "maxLength": 500
  }
}
```

## Auto-fill Patterns

The auto-fill feature recognizes common field patterns:

- **Name fields**: `name`, `fullname`, `firstname`, `lastname`
- **Email fields**: `email`, `emailaddress`
- **Phone fields**: `phone`, `mobile`, `telephone`
- **Address fields**: `address`, `street`, `city`
- **Date fields**: `date`, `dob`, `birthdate`
- **Company fields**: `company`, `organization`, `employer`
- **Title fields**: `title`, `position`, `jobtitle`

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

Common error scenarios:
- Missing required files or data
- Invalid PDF format
- Form field not found
- Validation failures
- File processing errors

## File Management

- Input files are automatically cleaned up after processing
- Output files are stored in the `outputs` directory
- Files are accessible via download URLs for 1 hour
- Automatic cleanup of old files (24+ hours)

## Security Considerations

- File upload validation
- Input sanitization
- Secure file handling
- Temporary file cleanup
- CORS configuration

## Performance

- Efficient PDF processing using pdf-lib
- Memory-optimized file handling
- Batch processing for multiple files
- Asynchronous operations

## Dependencies

- `pdf-lib`: PDF manipulation and form handling
- `fs-extra`: Enhanced file system operations
- `multer`: File upload handling
- `express`: Web framework

## Usage Examples

### Frontend Integration

```javascript
// Fill a form manually
const fillForm = async (file, formData) => {
  const formDataToSend = new FormData();
  formDataToSend.append('pdf', file);
  formDataToSend.append('formData', JSON.stringify(formData));
  
  const response = await fetch('/pdf-fill-form/fill', {
    method: 'POST',
    body: formDataToSend
  });
  
  return response.json();
};

// Auto-fill a form
const autoFillForm = async (file, userData) => {
  const formDataToSend = new FormData();
  formDataToSend.append('pdf', file);
  formDataToSend.append('userData', JSON.stringify(userData));
  
  const response = await fetch('/pdf-fill-form/auto-fill', {
    method: 'POST',
    body: formDataToSend
  });
  
  return response.json();
};
```

### cURL Examples

```bash
# Fill a form
curl -X POST http://localhost:2104/pdf-fill-form/fill \
  -F "pdf=@form.pdf" \
  -F "formData={\"name\":\"John Doe\",\"email\":\"john@example.com\"}"

# Auto-fill a form
curl -X POST http://localhost:2104/pdf-fill-form/auto-fill \
  -F "pdf=@form.pdf" \
  -F "userData={\"name\":\"John Doe\",\"email\":\"john@example.com\"}"

# Validate form data
curl -X POST http://localhost:2104/pdf-fill-form/validate \
  -H "Content-Type: application/json" \
  -d '{"formData":{"email":"john@example.com"},"validationRules":{"email":{"type":"email","required":true}}}'
```

## Troubleshooting

### Common Issues

1. **File not found errors**: Ensure PDF files are valid and not corrupted
2. **Field not found**: Verify field names match exactly (case-sensitive)
3. **Validation failures**: Check validation rules and data format
4. **Memory issues**: For large files, consider processing in smaller batches

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=pdf-fill-form:*
```

## Future Enhancements

- Advanced AI-powered field recognition
- OCR integration for scanned forms
- Real-time collaboration features
- Advanced signature verification
- Integration with external data sources
- Mobile-optimized interface
