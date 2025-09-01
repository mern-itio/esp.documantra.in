const PDFDocument = require('pdf-lib');
const fs = require('fs-extra');
const path = require('path');
const { PDFDocument: PDFLibDocument, PDFForm, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, PDFSignature } = require('pdf-lib');

const fillPdfFormController = {
  // Fill PDF form with provided data
  async fillPdfForm(req, res) {
    try {
      // Parse boolean values properly from FormData (they come as strings)
      const flatten = req.body.flatten === 'true' || req.body.flatten === true;
      const keepEditable = req.body.keepEditable !== 'false' && req.body.keepEditable !== false;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'PDF file is required'
        });
      }

      // Extract form data from request body
      let formData;
      
      // Check if formData is sent as a JSON string (from frontend)
      if (req.body.formData && typeof req.body.formData === 'string') {
        try {
          formData = JSON.parse(req.body.formData);
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: 'Invalid form data JSON'
          });
        }
      } else {
        // Extract individual form fields (from API tests)
        formData = { ...req.body };
        delete formData.flatten;
        delete formData.keepEditable;
      }
      
      if (!formData || Object.keys(formData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Form data is required'
        });
      }

      const inputPath = req.file.path;
      const outputFilename = `filled_form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`;
      const outputPath = path.join(__dirname, '../outputs', outputFilename);

      // Read the PDF file
      const pdfBytes = await fs.readFile(inputPath);
      const pdfDoc = await PDFLibDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      // Fill form fields
      const fields = form.getFields();
      
      for (const [fieldName, fieldValue] of Object.entries(formData)) {
        try {
          const field = form.getField(fieldName);
          
          if (field instanceof PDFTextField) {
            field.setText(fieldValue.toString());
          } else if (field instanceof PDFCheckBox) {
            if (fieldValue === true || fieldValue === 'true' || fieldValue === 'yes') {
              field.check();
            } else {
              field.uncheck();
            }
          } else if (field instanceof PDFRadioGroup) {
            field.select(fieldValue.toString());
          } else if (field instanceof PDFDropdown) {
            field.select(fieldValue.toString());
          }
        } catch (error) {
          console.warn(`Field ${fieldName} not found or could not be filled:`, error.message);
        }
      }

      // Flatten form if requested
      if (flatten) {
        form.flatten();
      }

      // Save the filled PDF
      const filledPdfBytes = await pdfDoc.save();
      await fs.writeFile(outputPath, filledPdfBytes);

      // Clean up input file
      await fs.remove(inputPath);

      res.json({
        success: true,
        message: 'PDF form filled successfully',
        result: {
          filename: outputFilename,
          downloadUrl: `/downloads/${outputFilename}`,
          fieldsFilled: Object.keys(formData).length,
          flattened: flatten,
          editable: !flatten && keepEditable
        }
      });

    } catch (error) {
      console.error('Error filling PDF form:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fill PDF form',
        details: error.message
      });
    }
  },

  // Auto-fill PDF form using AI/pattern recognition
  async autoFillPdfForm(req, res) {
    try {
      // Parse JSON data from FormData
      let autoFillRules = {};
      let userData = {};
      
      if (req.body.autoFillRules && typeof req.body.autoFillRules === 'string') {
        try {
          autoFillRules = JSON.parse(req.body.autoFillRules);
        } catch (error) {
          console.warn('Invalid autoFillRules JSON, using empty object');
        }
      }
      
      if (req.body.userData && typeof req.body.userData === 'string') {
        try {
          userData = JSON.parse(req.body.userData);
        } catch (error) {
          console.warn('Invalid userData JSON, using empty object');
        }
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'PDF file is required'
        });
      }

      const inputPath = req.file.path;
      const outputFilename = `auto_filled_form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`;
      const outputPath = path.join(__dirname, '../outputs', outputFilename);

      // Read the PDF file
      const pdfBytes = await fs.readFile(inputPath);
      const pdfDoc = await PDFLibDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      // Extract form fields for analysis
      const fields = form.getFields();
      const autoFilledData = {};

      // Apply auto-fill rules
      for (const field of fields) {
        const fieldName = field.getName();
        const fieldType = field.constructor.name;
        
        // Apply pattern matching and AI rules
        const matchedValue = await applyAutoFillRules(fieldName, fieldType, autoFillRules, userData);
        
        if (matchedValue !== null) {
          autoFilledData[fieldName] = matchedValue;
          
          try {
            if (field instanceof PDFTextField) {
              field.setText(matchedValue.toString());
            } else if (field instanceof PDFCheckBox) {
              if (matchedValue === true || matchedValue === 'true' || matchedValue === 'yes') {
                field.check();
              } else {
                field.uncheck();
              }
            } else if (field instanceof PDFRadioGroup) {
              field.select(matchedValue.toString());
            } else if (field instanceof PDFDropdown) {
              field.select(matchedValue.toString());
            }
          } catch (error) {
            console.warn(`Could not auto-fill field ${fieldName}:`, error.message);
          }
        }
      }

      // Save the auto-filled PDF
      const filledPdfBytes = await pdfDoc.save();
      await fs.writeFile(outputPath, filledPdfBytes);

      // Clean up input file
      await fs.remove(inputPath);

      res.json({
        success: true,
        message: 'PDF form auto-filled successfully',
        result: {
          filename: outputFilename,
          downloadUrl: `/downloads/${outputFilename}`,
          fieldsAutoFilled: Object.keys(autoFilledData).length,
          autoFilledData,
          confidence: calculateConfidence(autoFilledData, fields.length)
        }
      });

    } catch (error) {
      console.error('Error auto-filling PDF form:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to auto-fill PDF form',
        details: error.message
      });
    }
  },

  // Validate form data before filling
  async validateFormData(req, res) {
    try {
      const { formData, validationRules } = req.body;

      if (!formData || typeof formData !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Form data is required'
        });
      }

      const validationResults = {
        isValid: true,
        errors: [],
        warnings: [],
        validatedFields: {}
      };

      // Apply validation rules
      for (const [fieldName, fieldValue] of Object.entries(formData)) {
        const fieldValidation = await validateField(fieldName, fieldValue, validationRules);
        
        if (fieldValidation.isValid) {
          validationResults.validatedFields[fieldName] = {
            value: fieldValue,
            validation: fieldValidation
          };
        } else {
          validationResults.isValid = false;
          validationResults.errors.push({
            field: fieldName,
            error: fieldValidation.error,
            value: fieldValue
          });
        }

        if (fieldValidation.warning) {
          validationResults.warnings.push({
            field: fieldName,
            warning: fieldValidation.warning,
            value: fieldValue
          });
        }
      }

      res.json({
        success: true,
        validation: validationResults
      });

    } catch (error) {
      console.error('Error validating form data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate form data',
        details: error.message
      });
    }
  },

  // Extract form fields from PDF
  async extractFormFields(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'PDF file is required'
        });
      }

      const inputPath = req.file.path;

      // Read the PDF file
      const pdfBytes = await fs.readFile(inputPath);
      const pdfDoc = await PDFLibDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      const fields = form.getFields();
      const extractedFields = [];

      for (const field of fields) {
        const fieldInfo = {
          name: field.getName(),
          type: field.constructor.name,
          required: field.isRequired(),
          readOnly: field.isReadOnly(),
          defaultValue: null,
          currentValue: null
        };

        // Safely get values that might not exist on all field types
        try {
          fieldInfo.currentValue = field.getValue();
        } catch (error) {
          console.warn(`Could not get value for field ${field.getName()}:`, error.message);
        }

        try {
          if (typeof field.getDefaultValue === 'function') {
            fieldInfo.defaultValue = field.getDefaultValue();
          }
        } catch (error) {
          console.warn(`Could not get default value for field ${field.getName()}:`, error.message);
        }

        // Add type-specific information
        if (field instanceof PDFTextField) {
          try {
            fieldInfo.maxLength = field.getMaxLength();
            fieldInfo.isMultiline = field.isMultiline();
          } catch (error) {
            console.warn(`Could not get text field properties for ${field.getName()}:`, error.message);
          }
        } else if (field instanceof PDFDropdown) {
          try {
            fieldInfo.options = field.getOptions();
          } catch (error) {
            console.warn(`Could not get dropdown options for ${field.getName()}:`, error.message);
          }
        } else if (field instanceof PDFRadioGroup) {
          try {
            fieldInfo.options = field.getOptions();
          } catch (error) {
            console.warn(`Could not get radio group options for ${field.getName()}:`, error.message);
          }
        }

        // Add validation rules based on field name and type
        fieldInfo.validation = getValidationRulesForField(fieldInfo.name, fieldInfo.type);

        extractedFields.push(fieldInfo);
      }

      // Clean up input file
      await fs.remove(inputPath);

      res.json({
        success: true,
        fields: extractedFields,
        totalFields: extractedFields.length,
        fieldTypes: [...new Set(extractedFields.map(f => f.type))]
      });

    } catch (error) {
      console.error('Error extracting form fields:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to extract form fields',
        details: error.message
      });
    }
  },

  // Add signature to form fields
  async addSignatureToForm(req, res) {
    try {
      const { signatureData, signatureField } = req.body;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'PDF file is required'
        });
      }

      if (!signatureData || !signatureField) {
        return res.status(400).json({
          success: false,
          error: 'Signature data and field name are required'
        });
      }

      // Parse signature data if it's a JSON string
      let parsedSignatureData = signatureData;
      if (typeof signatureData === 'string') {
        try {
          parsedSignatureData = JSON.parse(signatureData);
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: 'Invalid signature data format'
          });
        }
      }

      const inputPath = req.file.path;
      const outputFilename = `signed_form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`;
      const outputPath = path.join(__dirname, '../outputs', outputFilename);

      // Read the PDF file
      const pdfBytes = await fs.readFile(inputPath);
      const pdfDoc = await PDFLibDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      // Get all form fields to check what's available
      const allFields = form.getFields();
      const availableFields = allFields.map(field => ({
        name: field.getName(),
        type: field.constructor.name
      }));

      // Check if the specified field exists
      if (!allFields.some(field => field.getName() === signatureField)) {
        return res.status(400).json({
          success: false,
          error: `Field "${signatureField}" not found in PDF`,
          details: {
            availableFields,
            message: 'Please select one of the available fields or check the field name'
          }
        });
      }

      // Add signature to the specified field
      try {
        const signatureFieldObj = form.getField(signatureField);
        
        // Allow both PDFSignature and PDFTextField for signatures
        if (signatureFieldObj instanceof PDFSignature) {
          // Handle true signature field
          if (parsedSignatureData.type === 'image') {
            const signatureImage = await pdfDoc.embedPng(parsedSignatureData.imageData);
            signatureFieldObj.setImage(signatureImage);
          } else if (parsedSignatureData.type === 'text') {
            signatureFieldObj.setText(parsedSignatureData.text);
          }
        } else if (signatureFieldObj instanceof PDFTextField) {
          // Handle text field as signature (text overlay)
          if (parsedSignatureData.type === 'text') {
            signatureFieldObj.setText(parsedSignatureData.text);
          } else if (parsedSignatureData.type === 'image') {
            // For image signatures in text fields, we'll add a note
            signatureFieldObj.setText(`[SIGNATURE IMAGE: ${parsedSignatureData.imageData ? 'Image provided' : 'No image'}]`);
          }
        } else {
          return res.status(400).json({
            success: false,
            error: `Field "${signatureField}" cannot be used for signatures`,
            details: {
              fieldType: signatureFieldObj.constructor.name,
              availableFields,
              message: 'Please select a text field or signature field'
            }
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: `Could not add signature to field "${signatureField}"`,
          details: {
            error: error.message,
            availableFields,
            message: 'Please check the field type and try again'
          }
        });
      }

      // Save the signed PDF
      const signedPdfBytes = await pdfDoc.save();
      await fs.writeFile(outputPath, signedPdfBytes);

      // Clean up input file
      await fs.remove(inputPath);

      res.json({
        success: true,
        message: 'Signature added to PDF form successfully',
        result: {
          filename: outputFilename,
          downloadUrl: `/downloads/${outputFilename}`,
          signatureField,
          signatureType: signatureData.type
        }
      });

    } catch (error) {
      console.error('Error adding signature to form:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add signature to form',
        details: error.message
      });
    }
  },

  // Bulk fill multiple forms
  async bulkFillForms(req, res) {
    try {
      // Parse boolean values properly from FormData
      const flatten = req.body.flatten === 'true' || req.body.flatten === true;
      
      // Parse form data from JSON string
      let formData;
      if (req.body.formData && typeof req.body.formData === 'string') {
        try {
          formData = JSON.parse(req.body.formData);
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: 'Invalid form data JSON'
          });
        }
      } else {
        formData = req.body.formData;
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'PDF files are required'
        });
      }

      if (!formData || Object.keys(formData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Form data is required'
        });
      }

      const results = [];
      const errors = [];

      for (const file of req.files) {
        try {
          const inputPath = file.path;
          const outputFilename = `bulk_filled_${file.originalname.replace('.pdf', '')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`;
          const outputPath = path.join(__dirname, '../outputs', outputFilename);

          // Read the PDF file
          const pdfBytes = await fs.readFile(inputPath);
          const pdfDoc = await PDFLibDocument.load(pdfBytes);
          const form = pdfDoc.getForm();

          // Fill form fields
          const fields = form.getFields();
          let fieldsFilled = 0;
          
          for (const [fieldName, fieldValue] of Object.entries(formData)) {
            try {
              const field = form.getField(fieldName);
              
              if (field instanceof PDFTextField) {
                field.setText(fieldValue.toString());
                fieldsFilled++;
              } else if (field instanceof PDFCheckBox) {
                if (fieldValue === true || fieldValue === 'true' || fieldValue === 'yes') {
                  field.check();
                } else {
                  field.uncheck();
                }
                fieldsFilled++;
              } else if (field instanceof PDFRadioGroup) {
                field.select(fieldValue.toString());
                fieldsFilled++;
              } else if (field instanceof PDFDropdown) {
                field.select(fieldValue.toString());
                fieldsFilled++;
              }
            } catch (error) {
              console.warn(`Field ${fieldName} not found in ${file.originalname}:`, error.message);
            }
          }

          // Flatten form if requested
          if (flatten) {
            form.flatten();
          }

          // Save the filled PDF
          const filledPdfBytes = await pdfDoc.save();
          await fs.writeFile(outputPath, filledPdfBytes);

          results.push({
            originalFile: file.originalname,
            outputFile: outputFilename,
            downloadUrl: `/downloads/${outputFilename}`,
            fieldsFilled,
            flattened: flatten
          });

          // Clean up input file
          await fs.remove(inputPath);

        } catch (error) {
          errors.push({
            file: file.originalname,
            error: error.message
          });
          
          // Clean up input file even if processing failed
          await fs.remove(file.path);
        }
      }

      res.json({
        success: true,
        message: 'Bulk form filling completed',
        results: {
          processed: results.length,
          errors: errors.length,
          files: results,
          errorDetails: errors
        }
      });

    } catch (error) {
      console.error('Error in bulk form filling:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process bulk form filling',
        details: error.message
      });
    }
  },

  // Save form data as template
  async saveFormTemplate(req, res) {
    try {
      const { templateName, formData, description, category } = req.body;

      if (!templateName || !formData) {
        return res.status(400).json({
          success: false,
          error: 'Template name and form data are required'
        });
      }

      const template = {
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: templateName,
        description: description || '',
        category: category || 'general',
        formData,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };

      // Save template to file (in a real app, this would go to a database)
      const templatesDir = path.join(__dirname, '../data/templates');
      await fs.ensureDir(templatesDir);
      
      const templatePath = path.join(templatesDir, `${template.id}.json`);
      await fs.writeFile(templatePath, JSON.stringify(template, null, 2));

      res.json({
        success: true,
        message: 'Template saved successfully',
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          fieldsCount: Object.keys(formData).length
        }
      });

    } catch (error) {
      console.error('Error saving template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save template',
        details: error.message
      });
    }
  },

  // Get saved templates
  async getSavedTemplates(req, res) {
    try {
      const { category } = req.query;
      const templatesDir = path.join(__dirname, '../data/templates');
      
      if (!await fs.pathExists(templatesDir)) {
        return res.json({
          success: true,
          templates: []
        });
      }

      const templateFiles = await fs.readdir(templatesDir);
      const templates = [];

      for (const file of templateFiles) {
        if (file.endsWith('.json')) {
          try {
            const templatePath = path.join(templatesDir, file);
            const templateData = await fs.readFile(templatePath, 'utf8');
            const template = JSON.parse(templateData);
            
            if (!category || template.category === category) {
              templates.push({
                id: template.id,
                name: template.name,
                description: template.description,
                category: template.category,
                created: template.created,
                updated: template.updated,
                fieldsCount: Object.keys(template.formData).length
              });
            }
          } catch (error) {
            console.warn(`Error reading template file ${file}:`, error.message);
          }
        }
      }

      res.json({
        success: true,
        templates: templates.sort((a, b) => new Date(b.updated) - new Date(a.updated))
      });

    } catch (error) {
      console.error('Error getting templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get templates',
        details: error.message
      });
    }
  },

  // Get a specific template by ID
  async getTemplateById(req, res) {
    try {
      const { templateId } = req.params;
      const templatesDir = path.join(__dirname, '../data/templates');
      const templatePath = path.join(templatesDir, `${templateId}.json`);
      
      if (!await fs.pathExists(templatePath)) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      const templateData = await fs.readFile(templatePath, 'utf8');
      const template = JSON.parse(templateData);
      
      res.json({
        success: true,
        template: {
          id: templateId,
          name: template.name,
          description: template.description,
          category: template.category,
          formData: template.formData,
          created: template.created,
          updated: template.updated,
          fieldsCount: Object.keys(template.formData).length
        }
      });
    } catch (error) {
      console.error('Error getting template by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get template',
        details: error.message
      });
    }
  },

  // Get service status
  async getServiceStatus(req, res) {
    try {
      const status = {
        service: 'Fill PDF Forms',
        status: 'operational',
        version: '1.0.0',
        features: [
          'auto_fill',
          'data_validation', 
          'signature_fields',
          'bulk_processing',
          'template_management'
        ],
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        status
      });

    } catch (error) {
      console.error('Error getting service status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get service status',
        details: error.message
      });
    }
  }
};

// Helper functions
async function applyAutoFillRules(fieldName, fieldType, autoFillRules, userData) {
  // Simple pattern matching - in a real implementation, this would use AI/ML
  const fieldNameLower = fieldName.toLowerCase();
  
  // Check for common field patterns
  if (fieldNameLower.includes('name') || fieldNameLower.includes('fullname')) {
    return userData?.name || userData?.fullName || null;
  }
  
  if (fieldNameLower.includes('email')) {
    return userData?.email || null;
  }
  
  if (fieldNameLower.includes('phone') || fieldNameLower.includes('mobile')) {
    return userData?.phone || userData?.mobile || null;
  }
  
  if (fieldNameLower.includes('address')) {
    return userData?.address || null;
  }
  
  if (fieldNameLower.includes('date') || fieldNameLower.includes('dob')) {
    return userData?.dateOfBirth || userData?.birthDate || new Date().toISOString().split('T')[0];
  }
  
  if (fieldNameLower.includes('company') || fieldNameLower.includes('organization')) {
    return userData?.company || userData?.organization || null;
  }
  
  if (fieldNameLower.includes('title') || fieldNameLower.includes('position')) {
    return userData?.title || userData?.position || null;
  }

  return null;
}

async function validateField(fieldName, fieldValue, validationRules) {
  const result = {
    isValid: true,
    error: null,
    warning: null
  };

  if (!validationRules || !validationRules[fieldName]) {
    return result;
  }

  const rules = validationRules[fieldName];

  // Required validation
  if (rules.required && (!fieldValue || fieldValue.toString().trim() === '')) {
    result.isValid = false;
    result.error = 'This field is required';
    return result;
  }

  // Length validation
  if (rules.minLength && fieldValue.toString().length < rules.minLength) {
    result.isValid = false;
    result.error = `Minimum length is ${rules.minLength} characters`;
    return result;
  }

  if (rules.maxLength && fieldValue.toString().length > rules.maxLength) {
    result.isValid = false;
    result.error = `Maximum length is ${rules.maxLength} characters`;
    return result;
  }

  // Pattern validation
  if (rules.pattern) {
    const regex = new RegExp(rules.pattern);
    if (!regex.test(fieldValue.toString())) {
      result.isValid = false;
      result.error = 'Invalid format';
      return result;
    }
  }

  // Email validation
  if (rules.type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fieldValue.toString())) {
      result.isValid = false;
      result.error = 'Invalid email format';
      return result;
    }
  }

  // Number validation
  if (rules.type === 'number') {
    const numValue = parseFloat(fieldValue);
    if (isNaN(numValue)) {
      result.isValid = false;
      result.error = 'Must be a valid number';
      return result;
    }

    if (rules.min !== undefined && numValue < rules.min) {
      result.isValid = false;
      result.error = `Minimum value is ${rules.min}`;
      return result;
    }

    if (rules.max !== undefined && numValue > rules.max) {
      result.isValid = false;
      result.error = `Maximum value is ${rules.max}`;
      return result;
    }
  }

  return result;
}

function calculateConfidence(autoFilledData, totalFields) {
  if (totalFields === 0) return 0;
  return Math.round((Object.keys(autoFilledData).length / totalFields) * 100);
}

// Function to generate validation rules based on field name and type
function getValidationRulesForField(fieldName, fieldType) {
  const validationRules = {};
  
  // Convert field name to lowercase for matching
  const lowerFieldName = fieldName.toLowerCase();
  
  // Email field validation
  if (lowerFieldName.includes('email') || lowerFieldName.includes('mail')) {
    validationRules.type = 'email';
    validationRules.required = true;
  }
  
  // Phone field validation
  else if (lowerFieldName.includes('phone') || lowerFieldName.includes('tel') || lowerFieldName.includes('mobile')) {
    validationRules.type = 'phone';
    validationRules.pattern = '^[+]?[1-9]?[0-9]{7,15}$'; // Basic international phone pattern
    validationRules.required = true;
  }
  
  // Name field validation
  else if (lowerFieldName.includes('name') || lowerFieldName.includes('firstname') || lowerFieldName.includes('lastname')) {
    validationRules.minLength = 2;
    validationRules.maxLength = 50;
    validationRules.pattern = '^[a-zA-Z\\s]+$'; // Only letters and spaces
    validationRules.required = true;
  }
  
  // Address field validation
  else if (lowerFieldName.includes('address') || lowerFieldName.includes('street') || lowerFieldName.includes('location')) {
    validationRules.minLength = 5;
    validationRules.maxLength = 200;
    validationRules.required = true;
  }
  
  // Age field validation
  else if (lowerFieldName.includes('age')) {
    validationRules.type = 'number';
    validationRules.min = 1;
    validationRules.max = 120;
    validationRules.required = true;
  }
  
  // Date field validation
  else if (lowerFieldName.includes('date') || lowerFieldName.includes('birth') || lowerFieldName.includes('dob')) {
    validationRules.type = 'date';
    validationRules.required = true;
  }
  
  // URL field validation
  else if (lowerFieldName.includes('url') || lowerFieldName.includes('website') || lowerFieldName.includes('link')) {
    validationRules.type = 'url';
  }
  
  // ZIP/Postal code validation
  else if (lowerFieldName.includes('zip') || lowerFieldName.includes('postal') || lowerFieldName.includes('postcode')) {
    validationRules.pattern = '^[0-9]{5}(-[0-9]{4})?$|^[A-Z0-9]{3,10}$'; // US ZIP or general postal code
    validationRules.required = true;
  }
  
  // Default text field validation
  else if (fieldType === 'PDFTextField') {
    validationRules.minLength = 1;
    validationRules.maxLength = 255;
  }
  
  return validationRules;
}

module.exports = fillPdfFormController;
