# Calculate Fields Module - API Documentation

## Overview
The Calculate Fields module allows you to add dynamic calculations and formulas to PDF form fields. It supports mathematical operations, financial calculations, conditional logic, and date operations.

## API Endpoints

### 1. Get Form Fields
**Endpoint:** `POST /pdf-calculate-fields/get-form-fields`

**Description:** Extract form fields from a PDF for calculation setup.

**Request:**
```bash
curl -X POST http://localhost:2104/pdf-calculate-fields/get-form-fields \
  -F "pdf=@your_form.pdf"
```

**Response:**
```json
{
  "success": true,
  "fields": [
    {
      "name": "quantity",
      "type": "text",
      "currentValue": "5",
      "isReadOnly": false,
      "canCalculate": true
    },
    {
      "name": "price",
      "type": "text", 
      "currentValue": "10",
      "isReadOnly": false,
      "canCalculate": true
    },
    {
      "name": "total",
      "type": "text",
      "currentValue": "",
      "isReadOnly": false,
      "canCalculate": true
    }
  ],
  "totalFields": 3,
  "calculableFields": 3
}
```

### 2. Add Calculations
**Endpoint:** `POST /pdf-calculate-fields/add-calculations`

**Description:** Apply calculations to a PDF form.

**Request Body:**
```json
{
  "calculations": [
    {
      "name": "Total Calculation",
      "targetField": "total",
      "formula": "quantity * price",
      "triggerFields": ["quantity", "price"],
      "calculationType": "mathematical",
      "isActive": true
    }
  ]
}
```

**Sample Request with File:**
```bash
curl -X POST http://localhost:2104/pdf-calculate-fields/add-calculations \
  -F "pdf=@your_form.pdf" \
  -F 'calculations=[{"name":"Total Calculation","targetField":"total","formula":"quantity * price","triggerFields":["quantity","price"],"calculationType":"mathematical","isActive":true}]'
```

**Response:**
```json
{
  "success": true,
  "message": "Calculations applied successfully",
  "result": {
    "filename": "calculated_form_1703123456789_abc123.pdf",
    "downloadUrl": "/downloads/calculated_form_1703123456789_abc123.pdf",
    "calculationsApplied": 1,
    "totalCalculations": 1,
    "errors": [],
    "appliedCalculations": [
      {
        "targetField": "total",
        "formula": "quantity * price",
        "result": 50,
        "triggerFields": ["quantity", "price"],
        "calculationType": "mathematical",
        "applied": true
      }
    ]
  }
}
```

### 3. Validate Formula
**Endpoint:** `POST /pdf-calculate-fields/validate-formula`

**Description:** Validate a calculation formula syntax and field references.

**Request Body:**
```json
{
  "formula": "SUM(quantity, price) * 0.1",
  "fieldNames": ["quantity", "price", "total"]
}
```

**Response:**
```json
{
  "success": true,
  "isValid": true,
  "result": 1.5,
  "errors": [],
  "warnings": []
}
```

### 4. Get Calculation Templates
**Endpoint:** `GET /pdf-calculate-fields/templates`

**Description:** Get predefined calculation templates.

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "name": "Sum of Fields",
      "description": "Add multiple field values together",
      "formula": "SUM(field1, field2, field3)",
      "category": "mathematical",
      "example": "SUM(quantity, price, tax)"
    }
  ],
  "categories": ["mathematical", "financial", "date", "logical"]
}
```

### 5. Get Service Status
**Endpoint:** `GET /pdf-calculate-fields/status`

**Description:** Get service status and capabilities.

**Response:**
```json
{
  "success": true,
  "status": {
    "service": "Calculate Fields",
    "status": "operational",
    "version": "1.0.0",
    "features": [
      "formula_support",
      "field_relationships",
      "dynamic_calculations",
      "mathematical_operations",
      "conditional_logic",
      "date_calculations",
      "financial_formulas"
    ],
    "capabilities": {
      "supportedOperations": ["+", "-", "*", "/", "^", "%"],
      "supportedFunctions": ["SUM", "PRODUCT", "AVERAGE", "MIN", "MAX", "IF", "TAX", "DISCOUNT", "PERCENTAGE", "DATE_DIFF"],
      "maxCalculations": 50,
      "maxFormulaLength": 1000,
      "supportedFieldTypes": ["text", "number", "date"]
    }
  }
}
```

## Supported Operations

### 1. Basic Mathematical Operations
```javascript
// Addition
"field1 + field2"

// Subtraction  
"field1 - field2"

// Multiplication
"field1 * field2"

// Division
"field1 / field2"

// Power
"field1 ^ 2"

// Modulo
"field1 % 10"
```

### 2. Mathematical Functions

#### SUM Function
```javascript
// Sum multiple fields
"SUM(field1, field2, field3)"

// Sum with constants
"SUM(field1, 10, field2)"
```

#### PRODUCT Function
```javascript
// Multiply multiple fields
"PRODUCT(field1, field2)"

// Product with constants
"PRODUCT(quantity, unit_price, 1.1)"
```

#### AVERAGE Function
```javascript
// Average of multiple fields
"AVERAGE(field1, field2, field3)"

// Average with constants
"AVERAGE(score1, score2, score3, 100)"
```

#### MIN/MAX Functions
```javascript
// Minimum value
"MIN(field1, field2, field3)"

// Maximum value
"MAX(field1, field2, field3)"
```

### 3. Financial Functions

#### TAX Function
```javascript
// Calculate tax amount
"TAX(amount, rate)"

// Example: 8% tax on $100
"TAX(100, 8)"  // Returns 8
```

#### DISCOUNT Function
```javascript
// Calculate discount amount
"DISCOUNT(amount, percentage)"

// Example: 15% discount on $200
"DISCOUNT(200, 15)"  // Returns 30
```

#### PERCENTAGE Function
```javascript
// Calculate percentage
"PERCENTAGE(value, total)"

// Example: What percentage is 25 of 100?
"PERCENTAGE(25, 100)"  // Returns 25
```

### 4. Conditional Logic

#### IF Function
```javascript
// Basic conditional
"IF(condition, true_value, false_value)"

// Examples:
"IF(total > 100, 'Free Shipping', 'Shipping: $5')"
"IF(quantity > 10, price * 0.9, price)"
```

### 5. Date Functions

#### DATE_DIFF Function
```javascript
// Calculate days between dates
"DATE_DIFF(start_date, end_date)"

// Note: Dates should be in YYYY-MM-DD format
"DATE_DIFF('2024-01-01', '2024-01-15')"  // Returns 14
```

## Complete Examples

### Example 1: Invoice Calculation
```json
{
  "calculations": [
    {
      "name": "Subtotal",
      "targetField": "subtotal",
      "formula": "quantity * unit_price",
      "triggerFields": ["quantity", "unit_price"],
      "calculationType": "mathematical",
      "isActive": true
    },
    {
      "name": "Tax Amount",
      "targetField": "tax_amount",
      "formula": "TAX(subtotal, 8.5)",
      "triggerFields": ["subtotal"],
      "calculationType": "financial",
      "isActive": true
    },
    {
      "name": "Total Amount",
      "targetField": "total_amount",
      "formula": "subtotal + tax_amount",
      "triggerFields": ["subtotal", "tax_amount"],
      "calculationType": "mathematical",
      "isActive": true
    }
  ]
}
```

### Example 2: Grade Calculation
```json
{
  "calculations": [
    {
      "name": "Average Score",
      "targetField": "average_score",
      "formula": "AVERAGE(quiz1, quiz2, quiz3, final_exam)",
      "triggerFields": ["quiz1", "quiz2", "quiz3", "final_exam"],
      "calculationType": "mathematical",
      "isActive": true
    },
    {
      "name": "Grade Letter",
      "targetField": "grade_letter",
      "formula": "IF(average_score >= 90, 'A', IF(average_score >= 80, 'B', IF(average_score >= 70, 'C', 'F')))",
      "triggerFields": ["average_score"],
      "calculationType": "logical",
      "isActive": true
    }
  ]
}
```

### Example 3: Loan Calculator
```json
{
  "calculations": [
    {
      "name": "Monthly Payment",
      "targetField": "monthly_payment",
      "formula": "(principal * (rate / 100 / 12) * (1 + rate / 100 / 12) ^ (years * 12)) / ((1 + rate / 100 / 12) ^ (years * 12) - 1)",
      "triggerFields": ["principal", "rate", "years"],
      "calculationType": "financial",
      "isActive": true
    },
    {
      "name": "Total Interest",
      "targetField": "total_interest",
      "formula": "(monthly_payment * years * 12) - principal",
      "triggerFields": ["monthly_payment", "years", "principal"],
      "calculationType": "financial",
      "isActive": true
    }
  ]
}
```

### Example 4: Inventory Management
```json
{
  "calculations": [
    {
      "name": "Total Value",
      "targetField": "total_value",
      "formula": "SUM(item1_value, item2_value, item3_value)",
      "triggerFields": ["item1_value", "item2_value", "item3_value"],
      "calculationType": "mathematical",
      "isActive": true
    },
    {
      "name": "Reorder Alert",
      "targetField": "reorder_alert",
      "formula": "IF(MIN(item1_stock, item2_stock, item3_stock) < 10, 'Reorder Needed', 'Stock OK')",
      "triggerFields": ["item1_stock", "item2_stock", "item3_stock"],
      "calculationType": "logical",
      "isActive": true
    }
  ]
}
```

## Field Types and Limitations

### Supported Field Types
- **Text Fields**: Can be used for calculations and results
- **Number Fields**: Ideal for mathematical operations
- **Date Fields**: Can be used in date calculations

### Field Properties
- **Read-Only Fields**: Cannot be used as target fields
- **Calculable Fields**: Only text fields can receive calculated results
- **Trigger Fields**: Any field can trigger calculations

## Error Handling

### Common Errors
1. **Field Not Found**: Target or trigger field doesn't exist
2. **Invalid Formula**: Syntax error in formula
3. **Division by Zero**: Mathematical error
4. **Invalid Date Format**: Date fields must be in YYYY-MM-DD format

### Error Response Format
```json
{
  "success": false,
  "error": "Failed to add calculations",
  "details": "Target field 'total' not found"
}
```

## Best Practices

1. **Field Naming**: Use descriptive field names (e.g., `quantity`, `unit_price`, `total`)
2. **Formula Validation**: Always validate formulas before applying
3. **Error Handling**: Check for calculation errors in the response
4. **Performance**: Limit the number of calculations per form (max 50)
5. **Testing**: Test calculations with sample data before production use

## Frontend Integration

The module includes a complete React frontend with:
- File upload interface
- Field extraction and display
- Calculation setup with real-time validation
- Template management
- Preview functionality
- Download processed PDFs

## Security Considerations

1. **Formula Evaluation**: Uses safe `Function` constructor for evaluation
2. **Input Validation**: All formulas are validated before execution
3. **Field Access**: Only allows access to existing form fields
4. **File Cleanup**: Temporary files are automatically removed

## Troubleshooting

### Common Issues
1. **No Fields Found**: Ensure PDF has fillable form fields
2. **Calculation Not Applied**: Check if target field is read-only
3. **Formula Errors**: Validate formula syntax and field references
4. **Download Issues**: Check if output directory exists and is writable

### Debug Mode
Enable console logging in the frontend to see detailed API responses and field information.
