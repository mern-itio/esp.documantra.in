const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');

const createPdfFormController = {
  // Create a new PDF form with interactive elements
  async createPdfForm(req, res) {
    try {
      const {
        formName = 'Untitled Form',
        formFields = [],
        pageSize = 'A4',
        orientation = 'portrait',
        margins = { top: 50, bottom: 50, left: 50, right: 50 },
        styling = {
          fontFamily: 'Helvetica',
          fontSize: 12,
          primaryColor: '#2563eb',
          secondaryColor: '#6b7280'
        }
      } = req.body;

      if (!formFields || formFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one form field is required'
        });
      }

      // Generate unique filename
      const formFilename = `pdf_form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`;
      const formFilePath = path.join(__dirname, '../outputs', formFilename);

      // Create PDF document
      const doc = new PDFDocument({
        size: pageSize,
        layout: orientation,
        margins: margins
      });

      // Pipe to file
      const writeStream = fs.createWriteStream(formFilePath);
      doc.pipe(writeStream);

      // Add form header
      // doc.fontSize(24)
      //    .font('Helvetica-Bold')
      //    .fillColor(styling.primaryColor)
      //    .text(formName, { align: 'center' })
      //    .moveDown(0.5);

      // // Add form description
      // doc.fontSize(14)
      //    .font('Helvetica')
      //    .fillColor(styling.secondaryColor)
      //    .text('Interactive Fillable Form', { align: 'center' })
      //    .moveDown(2);

      // Process form fields
      let currentY = doc.y;
      const fieldHeight = 25;
      const fieldSpacing = 15;

      for (const field of formFields) {
        currentY = await addFormField(doc, field, currentY, styling);
        currentY += fieldSpacing;
      }

      // Finalize PDF
      doc.end();

      // Wait for file to be written
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // Create form metadata file
      const metadataFilename = `form_metadata_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`;
      const metadataFilePath = path.join(__dirname, '../outputs', metadataFilename);
      
      const formMetadata = {
        formName,
        formFields,
        pageSize,
        orientation,
        margins,
        styling,
        created: new Date().toISOString(),
        totalFields: formFields.length,
        fieldTypes: [...new Set(formFields.map(f => f.type))]
      };

      await fs.writeFile(metadataFilePath, JSON.stringify(formMetadata, null, 2));

      res.json({
        success: true,
        message: 'PDF form created successfully',
        form: {
          filename: formFilename,
          metadataFile: metadataFilename,
          downloadUrl: `/pdf-create-form/download/${formFilename}`,
          metadataUrl: `/pdf-create-form/download/${metadataFilename}`,
          formName,
          totalFields: formFields.length,
          pageSize,
          orientation
        }
      });

    } catch (error) {
      console.error('Error in createPdfForm:', error);
      res.status(500).json({
        success: false,
        error: 'Error creating PDF form',
        message: error.message
      });
    }
  },

  // Fill an existing PDF form
  async fillPdfForm(req, res) {
    try {
      const { formData, formTemplate } = req.body;

      if (!formData || !formTemplate) {
        return res.status(400).json({
          success: false,
          error: 'Form data and template are required'
        });
      }

      // Generate filled form filename
      const filledFormFilename = `filled_form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`;
      const filledFormPath = path.join(__dirname, '../outputs', filledFormFilename);

      // Create filled PDF
      const doc = new PDFDocument();
      const writeStream = fs.createWriteStream(filledFormPath);
      doc.pipe(writeStream);

      // Add filled form content
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('Filled Form', { align: 'center' })
         .moveDown(1);

      // Add form data
      for (const [fieldName, fieldValue] of Object.entries(formData)) {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text(`${fieldName}:`, { continued: true })
           .font('Helvetica')
           .text(` ${fieldValue}`)
           .moveDown(0.5);
      }

      doc.end();

      // Wait for file to be written
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      res.json({
        success: true,
        message: 'Form filled successfully',
        filledForm: {
          filename: filledFormFilename,
          downloadUrl: `/pdf-create-form/download/${filledFormFilename}`,
          totalFields: Object.keys(formData).length
        }
      });

    } catch (error) {
      console.error('Error in fillPdfForm:', error);
      res.status(500).json({
        success: false,
        error: 'Error filling PDF form',
        message: error.message
      });
    }
  },

  // Validate form fields
  async validateFormFields(req, res) {
    try {
      const { formFields, validationRules } = req.body;

      if (!formFields || !validationRules) {
        return res.status(400).json({
          success: false,
          error: 'Form fields and validation rules are required'
        });
      }

      const validationResults = [];
      const errors = [];

      for (const field of formFields) {
        const fieldValidation = await validateField(field, validationRules[field.name] || {});
        validationResults.push(fieldValidation);

        if (!fieldValidation.isValid) {
          errors.push({
            fieldName: field.name,
            errors: fieldValidation.errors
          });
        }
      }

      const isValid = errors.length === 0;

      res.json({
        success: true,
        validation: {
          isValid,
          totalFields: formFields.length,
          validFields: validationResults.filter(v => v.isValid).length,
          invalidFields: errors.length,
          results: validationResults,
          errors
        }
      });

    } catch (error) {
      console.error('Error in validateFormFields:', error);
      res.status(500).json({
        success: false,
        error: 'Error validating form fields',
        message: error.message
      });
    }
  },

  // Get form templates
  async getFormTemplates(req, res) {
    try {
      const templates = [
        {
          id: 'contact',
          name: 'Contact Form',
          description: 'Standard contact information form',
          fields: [
            { name: 'fullName', type: 'text', label: 'Full Name', required: true },
            { name: 'email', type: 'email', label: 'Email Address', required: true },
            { name: 'phone', type: 'tel', label: 'Phone Number', required: false },
            { name: 'message', type: 'textarea', label: 'Message', required: true }
          ],
          category: 'business'
        },
        {
          id: 'survey',
          name: 'Survey Form',
          description: 'Customer feedback survey form',
          fields: [
            { name: 'rating', type: 'radio', label: 'Overall Rating', options: ['1', '2', '3', '4', '5'], required: true },
            { name: 'feedback', type: 'textarea', label: 'Additional Feedback', required: false },
            { name: 'recommend', type: 'checkbox', label: 'Would you recommend us?', required: false }
          ],
          category: 'feedback'
        },
        {
          id: 'application',
          name: 'Job Application',
          description: 'Employment application form',
          fields: [
            { name: 'position', type: 'text', label: 'Position Applied For', required: true },
            { name: 'experience', type: 'number', label: 'Years of Experience', required: true },
            { name: 'resume', type: 'file', label: 'Resume Upload', required: true },
            { name: 'coverLetter', type: 'textarea', label: 'Cover Letter', required: false }
          ],
          category: 'employment'
        }
      ];

      res.json({
        success: true,
        templates,
        total: templates.length
      });

    } catch (error) {
      console.error('Error in getFormTemplates:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching form templates',
        message: error.message
      });
    }
  },

  // Get supported field types
  async getSupportedFieldTypes(req, res) {
    try {
      const fieldTypes = [
        {
          type: 'text',
          name: 'Text Input',
          description: 'Single line text input',
          properties: ['label', 'placeholder', 'required', 'maxLength', 'validation']
        },
        {
          type: 'textarea',
          name: 'Text Area',
          description: 'Multi-line text input',
          properties: ['label', 'placeholder', 'required', 'rows', 'maxLength']
        },
        {
          type: 'email',
          name: 'Email Input',
          description: 'Email address input with validation',
          properties: ['label', 'placeholder', 'required', 'validation']
        },
        {
          type: 'number',
          name: 'Number Input',
          description: 'Numeric input field',
          properties: ['label', 'min', 'max', 'step', 'required']
        },
        {
          type: 'date',
          name: 'Date Input',
          description: 'Date picker field',
          properties: ['label', 'minDate', 'maxDate', 'required']
        },
        {
          type: 'select',
          name: 'Dropdown Select',
          description: 'Single choice dropdown',
          properties: ['label', 'options', 'required', 'defaultValue']
        },
        {
          type: 'radio',
          name: 'Radio Buttons',
          description: 'Single choice radio buttons',
          properties: ['label', 'options', 'required', 'defaultValue']
        },
        {
          type: 'checkbox',
          name: 'Checkbox',
          description: 'Boolean checkbox field',
          properties: ['label', 'required', 'defaultValue']
        },
        {
          type: 'file',
          name: 'File Upload',
          description: 'File attachment field',
          properties: ['label', 'required', 'accept', 'maxSize']
        }
      ];

      res.json({
        success: true,
        fieldTypes,
        total: fieldTypes.length
      });

    } catch (error) {
      console.error('Error in getSupportedFieldTypes:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching field types',
        message: error.message
      });
    }
  },

  // Get service status
  async getServiceStatus(req, res) {
    try {
      const status = {
        service: 'PDF Service - Create PDF Form',
        status: 'running',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        features: ['form_designer', 'field_validation', 'interactive_elements']
      };

      res.json({
        success: true,
        status
      });

    } catch (error) {
      console.error('Error in getServiceStatus:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching service status',
        message: error.message
      });
    }
  }
};

// Helper function to add form field to PDF
async function addFormField(doc, field, startY, styling) {
  const fieldHeight = 25;
  const fieldSpacing = 15;
  let currentY = startY;

  // Add field label
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(styling.secondaryColor)
     .text(field.label || field.name, 50, currentY);

  currentY += 20;

  // Add field input area based on type
  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
      doc.rect(50, currentY, 200, fieldHeight)
         .strokeColor(styling.primaryColor)
         .lineWidth(1)
         .stroke();
      break;

    case 'textarea':
      doc.rect(50, currentY, 200, fieldHeight * 2)
         .strokeColor(styling.primaryColor)
         .lineWidth(1)
         .stroke();
      currentY += fieldHeight;
      break;

    case 'select':
    case 'radio':
    case 'checkbox':
      // Add options
      if (field.options) {
        field.options.forEach((option, index) => {
          doc.circle(60 + (index * 30), currentY + 12, 5)
             .strokeColor(styling.primaryColor)
             .lineWidth(1)
             .stroke();
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor(styling.secondaryColor)
             .text(option, 70 + (index * 30), currentY + 8);
        });
      }
      break;

    case 'number':
    case 'date':
      doc.rect(50, currentY, 200, fieldHeight)
         .strokeColor(styling.primaryColor)
         .lineWidth(1)
         .stroke();
      break;

    case 'file':
      doc.rect(50, currentY, 200, fieldHeight)
         .strokeColor(styling.primaryColor)
         .lineWidth(1)
         .stroke();
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(styling.secondaryColor)
         .text('Click to upload file', 60, currentY + 8);
      break;

    default:
      doc.rect(50, currentY, 200, fieldHeight)
         .strokeColor(styling.primaryColor)
         .lineWidth(1)
         .stroke();
  }

  return currentY + fieldHeight + fieldSpacing;
}

// Helper function to validate form field
async function validateField(field, rules) {
  const errors = [];
  const value = field.value || '';

  // Required validation
  if (rules.required && (!value || value.trim() === '')) {
    errors.push('This field is required');
  }

  // Type-specific validation
  if (value && value.trim() !== '') {
    switch (field.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push('Please enter a valid email address');
        }
        break;

      case 'number':
        if (isNaN(value) || isNaN(parseFloat(value))) {
          errors.push('Please enter a valid number');
        } else {
          if (rules.min !== undefined && parseFloat(value) < rules.min) {
            errors.push(`Value must be at least ${rules.min}`);
          }
          if (rules.max !== undefined && parseFloat(value) > rules.max) {
            errors.push(`Value must be at most ${rules.max}`);
          }
        }
        break;

      case 'tel':
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
          errors.push('Please enter a valid phone number');
        }
        break;

      case 'text':
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`Text must be no more than ${rules.maxLength} characters`);
        }
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`Text must be at least ${rules.minLength} characters`);
        }
        break;
    }
  }

  return {
    fieldName: field.name,
    isValid: errors.length === 0,
    errors
  };
}

module.exports = createPdfFormController;
