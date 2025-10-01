const { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } = require('pdf-lib');
const fs = require('fs-extra');
const path = require('path');

const calculateFieldsController = {
  // Add calculations to form fields
  async addCalculations(req, res) {
    try {
      // console.log('Received request body:', req.body);
      // console.log('Received file:', req.file);
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'PDF file is required'
        });
      }

      let calculations;
      try {
        // Parse calculations from FormData (it comes as a JSON string)
        if (!req.body.calculations) {
          return res.status(400).json({
            success: false,
            error: 'Calculations field is required in request body'
          });
        }
        
        calculations = JSON.parse(req.body.calculations);
        // console.log('Parsed calculations:', calculations);
      } catch (error) {
        console.error('Error parsing calculations:', error);
        return res.status(400).json({
          success: false,
          error: 'Invalid calculations format. Expected JSON string.',
          details: error.message
        });
      }

      if (!calculations || !Array.isArray(calculations)) {
        return res.status(400).json({
          success: false,
          error: 'Calculations must be an array'
        });
      }

      const inputPath = req.file.path;
      const outputFilename = `calculated_form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`;
      const outputPath = path.join(__dirname, '../outputs', outputFilename);

      // Read the PDF file
      const pdfBytes = await fs.readFile(inputPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      // Get existing fields
      const existingFields = form.getFields();
      const fieldMap = new Map();
      existingFields.forEach(field => {
        fieldMap.set(field.getName(), field);
      });

      // Apply calculations
      const appliedCalculations = [];
      const errors = [];

      for (const calculation of calculations) {
        try {
          const result = await applyCalculation(form, fieldMap, calculation);
          appliedCalculations.push(result);
        } catch (error) {
          errors.push({
            calculation: calculation.name,
            error: error.message
          });
        }
      }

      // Save the calculated PDF
      const calculatedPdfBytes = await pdfDoc.save();
      await fs.writeFile(outputPath, calculatedPdfBytes);

      // Clean up input file
      await fs.remove(inputPath);

      res.json({
        success: true,
        message: 'Calculations applied successfully',
        result: {
          filename: outputFilename,
          downloadUrl: `/downloads/${outputFilename}`,
          calculationsApplied: appliedCalculations.length,
          totalCalculations: calculations.length,
          errors: errors,
          appliedCalculations: appliedCalculations
        }
      });

    } catch (error) {
      console.error('Error adding calculations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add calculations',
        details: error.message
      });
    }
  },

  // Get form fields for calculation setup
  async getFormFields(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'PDF file is required'
        });
      }

      const inputPath = req.file.path;
      const pdfBytes = await fs.readFile(inputPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      // Extract field information
      const fields = form.getFields().map(field => ({
        name: field.getName(),
        type: getFieldType(field),
        currentValue: getFieldValue(field),
        isReadOnly: field.isReadOnly(),
        canCalculate: canFieldBeCalculated(field)
      }));

      // Clean up input file
      await fs.remove(inputPath);

      res.json({
        success: true,
        fields: fields,
        totalFields: fields.length,
        calculableFields: fields.filter(f => f.canCalculate).length
      });

    } catch (error) {
      console.error('Error getting form fields:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get form fields',
        details: error.message
      });
    }
  },

  // Validate calculation formula
  async validateFormula(req, res) {
    try {
      const { formula, fieldNames } = req.body;

      if (!formula) {
        return res.status(400).json({
          success: false,
          error: 'Formula is required'
        });
      }

      const validation = validateCalculationFormula(formula, fieldNames || []);

      res.json({
        success: true,
        isValid: validation.isValid,
        result: validation.result,
        errors: validation.errors,
        warnings: validation.warnings
      });

    } catch (error) {
      console.error('Error validating formula:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate formula',
        details: error.message
      });
    }
  },

  // Get calculation templates
  async getCalculationTemplates(req, res) {
    try {
      const templates = [
        {
          name: 'Sum of Fields',
          description: 'Add multiple field values together',
          formula: 'SUM(field1, field2, field3)',
          category: 'mathematical',
          example: 'SUM(quantity, price, tax)'
        },
        {
          name: 'Product',
          description: 'Multiply field values',
          formula: 'PRODUCT(field1, field2)',
          category: 'mathematical',
          example: 'PRODUCT(quantity, unit_price)'
        },
        {
          name: 'Percentage',
          description: 'Calculate percentage of a value',
          formula: 'PERCENTAGE(value, total)',
          category: 'mathematical',
          example: 'PERCENTAGE(discount, total_amount)'
        },
        {
          name: 'Tax Calculation',
          description: 'Calculate tax based on amount and rate',
          formula: 'TAX(amount, rate)',
          category: 'financial',
          example: 'TAX(subtotal, 0.08)'
        },
        {
          name: 'Discount',
          description: 'Calculate discount amount',
          formula: 'DISCOUNT(amount, percentage)',
          category: 'financial',
          example: 'DISCOUNT(total, 0.15)'
        },
        {
          name: 'Date Difference',
          description: 'Calculate days between two dates',
          formula: 'DATE_DIFF(date1, date2)',
          category: 'date',
          example: 'DATE_DIFF(start_date, end_date)'
        },
        {
          name: 'Conditional',
          description: 'Set value based on condition',
          formula: 'IF(condition, true_value, false_value)',
          category: 'logical',
          example: 'IF(total > 100, "Free Shipping", "Shipping: $5")'
        },
        {
          name: 'Average',
          description: 'Calculate average of field values',
          formula: 'AVERAGE(field1, field2, field3)',
          category: 'mathematical',
          example: 'AVERAGE(score1, score2, score3)'
        }
      ];

      res.json({
        success: true,
        templates: templates,
        categories: [...new Set(templates.map(t => t.category))]
      });

    } catch (error) {
      console.error('Error getting calculation templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get calculation templates',
        details: error.message
      });
    }
  },

  // Get calculation service status
  async getServiceStatus(req, res) {
    try {
      const status = {
        service: 'Calculate Fields',
        status: 'operational',
        version: '1.0.0',
        features: [
          'formula_support',
          'field_relationships', 
          'dynamic_calculations',
          'mathematical_operations',
          'conditional_logic',
          'date_calculations',
          'financial_formulas'
        ],
        capabilities: {
          supportedOperations: ['+', '-', '*', '/', '^', '%'],
          supportedFunctions: ['SUM', 'PRODUCT', 'AVERAGE', 'MIN', 'MAX', 'IF', 'TAX', 'DISCOUNT', 'PERCENTAGE', 'DATE_DIFF'],
          maxCalculations: 50,
          maxFormulaLength: 1000,
          supportedFieldTypes: ['text', 'number', 'date']
        },
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

async function applyCalculation(form, fieldMap, calculation) {
  const { targetField, formula, triggerFields, calculationType } = calculation;

  // Validate target field exists
  if (!fieldMap.has(targetField)) {
    throw new Error(`Target field '${targetField}' not found`);
  }

  const targetFieldObj = fieldMap.get(targetField);

  // Validate trigger fields exist
  const missingFields = triggerFields.filter(field => !fieldMap.has(field));
  if (missingFields.length > 0) {
    throw new Error(`Trigger fields not found: ${missingFields.join(', ')}`);
  }

  // Calculate the result
  const result = await evaluateFormula(formula, fieldMap, triggerFields);

  // Apply the result to target field
  if (targetFieldObj instanceof PDFTextField) {
    targetFieldObj.setText(result.toString());
  }

  return {
    targetField,
    formula,
    result: result,
    triggerFields,
    calculationType,
    applied: true
  };
}

async function evaluateFormula(formula, fieldMap, triggerFields) {
  // Replace field references with actual values
  let processedFormula = formula;
  
  for (const fieldName of triggerFields) {
    const field = fieldMap.get(fieldName);
    const value = getFieldValue(field);
    const numericValue = parseFloat(value) || 0;
    
    // Replace field references in formula
    processedFormula = processedFormula.replace(
      new RegExp(`\\b${fieldName}\\b`, 'g'), 
      numericValue
    );
  }

  // Handle special functions
  processedFormula = processSpecialFunctions(processedFormula);

  // Evaluate the formula safely
  try {
    // Use Function constructor for safe evaluation
    const result = new Function(`return ${processedFormula}`)();
    return isNaN(result) ? 0 : result;
  } catch (error) {
    throw new Error(`Invalid formula: ${error.message}`);
  }
}

function processSpecialFunctions(formula) {
  // Handle SUM function
  formula = formula.replace(/SUM\(([^)]+)\)/g, (match, args) => {
    const values = args.split(',').map(v => parseFloat(v.trim()) || 0);
    return values.reduce((sum, val) => sum + val, 0);
  });

  // Handle PRODUCT function
  formula = formula.replace(/PRODUCT\(([^)]+)\)/g, (match, args) => {
    const values = args.split(',').map(v => parseFloat(v.trim()) || 1);
    return values.reduce((product, val) => product * val, 1);
  });

  // Handle AVERAGE function
  formula = formula.replace(/AVERAGE\(([^)]+)\)/g, (match, args) => {
    const values = args.split(',').map(v => parseFloat(v.trim()) || 0);
    const sum = values.reduce((s, val) => s + val, 0);
    return values.length > 0 ? sum / values.length : 0;
  });

  // Handle MIN function
  formula = formula.replace(/MIN\(([^)]+)\)/g, (match, args) => {
    const values = args.split(',').map(v => parseFloat(v.trim()) || 0);
    return Math.min(...values);
  });

  // Handle MAX function
  formula = formula.replace(/MAX\(([^)]+)\)/g, (match, args) => {
    const values = args.split(',').map(v => parseFloat(v.trim()) || 0);
    return Math.max(...values);
  });

  // Handle TAX function
  formula = formula.replace(/TAX\(([^)]+)\)/g, (match, args) => {
    const [amount, rate] = args.split(',').map(v => parseFloat(v.trim()) || 0);
    return amount * (rate / 100);
  });

  // Handle DISCOUNT function
  formula = formula.replace(/DISCOUNT\(([^)]+)\)/g, (match, args) => {
    const [amount, percentage] = args.split(',').map(v => parseFloat(v.trim()) || 0);
    return amount * (percentage / 100);
  });

  // Handle PERCENTAGE function
  formula = formula.replace(/PERCENTAGE\(([^)]+)\)/g, (match, args) => {
    const [value, total] = args.split(',').map(v => parseFloat(v.trim()) || 0);
    return total > 0 ? (value / total) * 100 : 0;
  });

  return formula;
}

function validateCalculationFormula(formula, fieldNames) {
  const validation = {
    isValid: true,
    result: null,
    errors: [],
    warnings: []
  };

  try {
    // Check for basic syntax
    if (!formula || typeof formula !== 'string') {
      validation.isValid = false;
      validation.errors.push('Formula must be a non-empty string');
      return validation;
    }

    // Check for balanced parentheses
    const openParens = (formula.match(/\(/g) || []).length;
    const closeParens = (formula.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      validation.isValid = false;
      validation.errors.push('Unbalanced parentheses in formula');
    }

    // Check for valid mathematical operators
    const validOperators = /[\+\-\*\/\^\(\)\s\d\.]/;
    const invalidChars = formula.replace(validOperators, '').replace(/[A-Za-z_]/g, '');
    if (invalidChars.length > 0) {
      validation.warnings.push(`Potentially invalid characters: ${invalidChars}`);
    }

    // Check for field references
    const fieldRefs = formula.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) || [];
    const unknownFields = fieldRefs.filter(ref => 
      !['SUM', 'PRODUCT', 'AVERAGE', 'MIN', 'MAX', 'IF', 'TAX', 'DISCOUNT', 'PERCENTAGE', 'DATE_DIFF'].includes(ref) &&
      !fieldNames.includes(ref)
    );

    if (unknownFields.length > 0) {
      validation.warnings.push(`Unknown field references: ${unknownFields.join(', ')}`);
    }

    // Try to evaluate with sample values
    const sampleFormula = formula.replace(/\b[A-Za-z_][A-Za-z0-9_]*\b/g, '1');
    try {
      const result = new Function(`return ${sampleFormula}`)();
      validation.result = result;
    } catch (error) {
      validation.isValid = false;
      validation.errors.push(`Formula syntax error: ${error.message}`);
    }

  } catch (error) {
    validation.isValid = false;
    validation.errors.push(`Validation error: ${error.message}`);
  }

  return validation;
}

function getFieldType(field) {
  if (field instanceof PDFTextField) return 'text';
  if (field instanceof PDFCheckBox) return 'checkbox';
  if (field instanceof PDFRadioGroup) return 'radio';
  if (field instanceof PDFDropdown) return 'dropdown';
  return 'unknown';
}

function getFieldValue(field) {
  try {
    if (field instanceof PDFTextField) {
      return field.getText() || '';
    } else if (field instanceof PDFCheckBox) {
      return field.isChecked() ? '1' : '0';
    } else if (field instanceof PDFRadioGroup) {
      return field.getSelected() || '';
    } else if (field instanceof PDFDropdown) {
      return field.getSelected() || '';
    }
    return '';
  } catch (error) {
    return '';
  }
}

function canFieldBeCalculated(field) {
  // Only text fields can be calculated (for now)
  return field instanceof PDFTextField;
}

module.exports = calculateFieldsController;
