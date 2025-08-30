# Create PDF Form Module

## Overview
The Create PDF Form module allows users to design interactive fillable forms with advanced field validation and interactive elements. This module is integrated into the PDF service and provides a comprehensive form creation experience.

## Features

### 1. Form Designer
- **Drag & Drop Interface**: Intuitive form building with visual field placement
- **Field Types**: Support for multiple input types including text, email, number, date, select, radio, checkbox, and file upload
- **Layout Options**: Customizable page size (A4, A3, Letter, Legal) and orientation (portrait/landscape)
- **Styling**: Customizable colors, fonts, and visual appearance

### 2. Field Validation
- **Required Fields**: Mark fields as mandatory
- **Type Validation**: Automatic validation based on field type (email format, number range, etc.)
- **Custom Rules**: Set minimum/maximum length, value ranges, and custom patterns
- **Real-time Validation**: Instant feedback during form creation

### 3. Interactive Elements
- **Form Templates**: Pre-built templates for common use cases
- **Field Properties**: Comprehensive field configuration options
- **Preview Mode**: Real-time form preview before PDF generation
- **Field Duplication**: Copy and modify existing fields

## API Endpoints

### Base URL
```
http://localhost:2104/pdf-create-form
```

### 1. Create PDF Form
**POST** `/create`

Creates a new PDF form with the specified fields and settings.

**Request Body:**
```json
{
  "formName": "Contact Form",
  "formFields": [
    {
      "name": "fullName",
      "type": "text",
      "label": "Full Name",
      "required": true,
      "placeholder": "Enter your full name"
    }
  ],
  "pageSize": "A4",
  "orientation": "portrait",
  "styling": {
    "primaryColor": "#2563eb",
    "secondaryColor": "#6b7280"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "PDF form created successfully",
  "form": {
    "filename": "pdf_form_1234567890_abc123.pdf",
    "metadataFile": "form_metadata_1234567890_abc123.json",
    "downloadUrl": "/pdf-create-form/download/pdf_form_1234567890_abc123.pdf",
    "metadataUrl": "/pdf-create-form/download/form_metadata_1234567890_abc123.json",
    "formName": "Contact Form",
    "totalFields": 1,
    "pageSize": "A4",
    "orientation": "portrait"
  }
}
```

### 2. Fill PDF Form
**POST** `/fill`

Fills an existing PDF form with provided data.

**Request Body:**
```json
{
  "formData": {
    "fullName": "John Doe",
    "email": "john@example.com"
  },
  "formTemplate": "contact_form_template"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Form filled successfully",
  "filledForm": {
    "filename": "filled_form_1234567890_abc123.pdf",
    "downloadUrl": "/pdf-create-form/download/filled_form_1234567890_abc123.pdf",
    "totalFields": 2
  }
}
```

### 3. Validate Form Fields
**POST** `/validate`

Validates form fields against specified rules.

**Request Body:**
```json
{
  "formFields": [
    {
      "name": "email",
      "type": "email",
      "value": "invalid-email"
    }
  ],
  "validationRules": {
    "email": {
      "required": true,
      "pattern": "email"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "validation": {
    "isValid": false,
    "totalFields": 1,
    "validFields": 0,
    "invalidFields": 1,
    "results": [
      {
        "fieldName": "email",
        "isValid": false,
        "errors": ["Please enter a valid email address"]
      }
    ],
    "errors": [
      {
        "fieldName": "email",
        "errors": ["Please enter a valid email address"]
      }
    ]
  }
}
```

### 4. Get Form Templates
**GET** `/templates`

Retrieves available form templates.

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": "contact",
      "name": "Contact Form",
      "description": "Standard contact information form",
      "fields": [
        {
          "name": "fullName",
          "type": "text",
          "label": "Full Name",
          "required": true
        }
      ],
      "category": "business"
    }
  ],
  "total": 1
}
```

### 5. Get Supported Field Types
**GET** `/field-types`

Retrieves supported field types and their properties.

**Response:**
```json
{
  "success": true,
  "fieldTypes": [
    {
      "type": "text",
      "name": "Text Input",
      "description": "Single line text input",
      "properties": ["label", "placeholder", "required", "maxLength", "validation"]
    }
  ],
  "total": 9
}
```

### 6. Get Service Status
**GET** `/status`

Retrieves the current service status.

**Response:**
```json
{
  "success": true,
  "status": {
    "service": "PDF Service - Create PDF Form",
    "status": "running",
    "uptime": 3600,
    "memory": {...},
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0",
    "features": ["form_designer", "field_validation", "interactive_elements"]
  }
}
```

## Download Routes

### File Downloads
**GET** `/pdf-create-form/download/:filename`

Downloads generated PDF forms and metadata files.

**Supported File Types:**
- `.pdf` - Generated PDF forms
- `.json` - Form metadata and templates

## Field Types

### 1. Text Input
- **Type**: `text`
- **Properties**: label, placeholder, required, maxLength, validation
- **Use Case**: Names, addresses, general text input

### 2. Text Area
- **Type**: `textarea`
- **Properties**: label, placeholder, required, rows, maxLength
- **Use Case**: Long text, comments, descriptions

### 3. Email Input
- **Type**: `email`
- **Properties**: label, placeholder, required, validation
- **Use Case**: Email addresses with automatic format validation

### 4. Number Input
- **Type**: `number`
- **Properties**: label, min, max, step, required
- **Use Case**: Age, quantity, measurements

### 5. Date Input
- **Type**: `date`
- **Properties**: label, minDate, maxDate, required
- **Use Case**: Birth dates, appointment dates

### 6. Dropdown Select
- **Type**: `select`
- **Properties**: label, options, required, defaultValue
- **Use Case**: Country selection, category choice

### 7. Radio Buttons
- **Type**: `radio`
- **Properties**: label, options, required, defaultValue
- **Use Case**: Single choice questions, preferences

### 8. Checkbox
- **Type**: `checkbox`
- **Properties**: label, required, defaultValue
- **Use Case**: Terms acceptance, multiple selections

### 9. File Upload
- **Type**: `file`
- **Properties**: label, required, accept, maxSize
- **Use Case**: Document uploads, resume attachments

## Form Templates

### 1. Contact Form
- **Category**: Business
- **Fields**: Full Name, Email, Phone, Message
- **Use Case**: Customer inquiries, support requests

### 2. Survey Form
- **Category**: Feedback
- **Fields**: Rating, Feedback, Recommendation
- **Use Case**: Customer satisfaction surveys

### 3. Job Application
- **Category**: Employment
- **Fields**: Position, Experience, Resume, Cover Letter
- **Use Case**: Job applications, recruitment

## Configuration

### Environment Variables
No additional environment variables required beyond the main PDF service configuration.

### Dependencies
- `pdfkit`: PDF generation library
- `fs-extra`: Enhanced file system operations
- `path`: Path manipulation utilities

## Usage Examples

### 1. Create a Simple Contact Form
```javascript
const formData = {
  formName: "Contact Form",
  formFields: [
    {
      name: "fullName",
      type: "text",
      label: "Full Name",
      required: true,
      placeholder: "Enter your full name"
    },
    {
      name: "email",
      type: "email",
      label: "Email Address",
      required: true,
      placeholder: "Enter your email"
    },
    {
      name: "message",
      type: "textarea",
      label: "Message",
      required: true,
      placeholder: "Enter your message"
    }
  ],
  pageSize: "A4",
  orientation: "portrait"
};

const response = await fetch('http://localhost:2104/pdf-create-form/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});
```

### 2. Load and Customize a Template
```javascript
// First, get available templates
const templatesResponse = await fetch('http://localhost:2104/pdf-create-form/templates');
const templatesData = await templatesResponse.json();

// Load a specific template
const contactTemplate = templatesData.templates.find(t => t.id === 'contact');
if (contactTemplate) {
  // Customize the template
  const customizedFields = contactTemplate.fields.map(field => ({
    ...field,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }));
  
  // Create form with customized template
  const createResponse = await fetch('http://localhost:2104/pdf-create-form/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      formName: "Custom Contact Form",
      formFields: customizedFields,
      pageSize: "A4",
      orientation: "portrait"
    })
  });
}
```

## Error Handling

### Common Error Responses
```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```

### Error Codes
- `400`: Bad Request - Invalid form data or missing required fields
- `500`: Internal Server Error - Server-side processing error

## Performance Considerations

### Optimization Tips
1. **Field Count**: Limit forms to reasonable field counts (recommended: <50 fields)
2. **File Size**: Large forms may take longer to generate
3. **Caching**: Templates are cached for better performance
4. **Validation**: Client-side validation reduces server load

### Memory Usage
- Each form generation uses temporary memory for PDF creation
- Memory is automatically freed after PDF generation
- Large forms may require more memory allocation

## Security

### File Access
- Generated files are stored in the `outputs` directory
- Files are accessible via download routes
- No authentication required for downloads (public access)

### Input Validation
- All form data is validated before processing
- File uploads are restricted to safe file types
- No executable code execution

## Monitoring and Logging

### Service Health
- Status endpoint provides uptime and memory usage
- Error logging for debugging and monitoring
- Performance metrics for optimization

### Troubleshooting
1. **Form Creation Fails**: Check field validation and required properties
2. **PDF Generation Issues**: Verify page size and orientation settings
3. **Download Problems**: Ensure output directory exists and is writable

## Future Enhancements

### Planned Features
1. **Advanced Styling**: CSS-like styling options
2. **Form Logic**: Conditional field display and validation
3. **Multi-page Forms**: Support for complex multi-page forms
4. **Form Analytics**: Usage tracking and analytics
5. **Collaboration**: Multi-user form editing
6. **Version Control**: Form versioning and history

### Integration Possibilities
1. **Database Storage**: Save forms to database for reuse
2. **API Integration**: Connect with external form services
3. **Workflow Integration**: Connect with business process workflows
4. **Mobile Support**: Responsive form design for mobile devices

## Support and Documentation

### Getting Help
- Check the service status endpoint for system health
- Review error messages for specific issue details
- Check server logs for detailed error information

### Contributing
- Follow the existing code structure and patterns
- Add comprehensive error handling
- Include proper TypeScript types
- Update documentation for new features
