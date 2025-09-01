# Calculate Fields Module - Sample Request Bodies

## Quick Start Examples

### 1. Basic Invoice Calculation
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
      "formula": "TAX(subtotal, tax_rate)",
      "triggerFields": ["subtotal", "tax_rate"],
      "calculationType": "financial",
      "isActive": true
    },
    {
      "name": "Total",
      "targetField": "total",
      "formula": "subtotal + tax_amount",
      "triggerFields": ["subtotal", "tax_amount"],
      "calculationType": "mathematical",
      "isActive": true
    }
  ]
}
```

### 2. Grade Calculator
```json
{
  "calculations": [
    {
      "name": "Average Score",
      "targetField": "average",
      "formula": "AVERAGE(quiz1, quiz2, quiz3, final)",
      "triggerFields": ["quiz1", "quiz2", "quiz3", "final"],
      "calculationType": "mathematical",
      "isActive": true
    },
    {
      "name": "Grade Letter",
      "targetField": "grade",
      "formula": "IF(average >= 90, 'A', IF(average >= 80, 'B', IF(average >= 70, 'C', 'F')))",
      "triggerFields": ["average"],
      "calculationType": "logical",
      "isActive": true
    }
  ]
}
```

### 3. Loan Calculator
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

## All Supported Operations

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

// Complex expressions
"(field1 + field2) * field3 / 100"
```

### 2. Mathematical Functions

#### SUM Function
```javascript
// Sum multiple fields
"SUM(field1, field2, field3)"

// Sum with constants
"SUM(field1, 10, field2)"

// Sum with calculations
"SUM(field1 * 2, field2, field3 / 2)"
```

#### PRODUCT Function
```javascript
// Multiply multiple fields
"PRODUCT(field1, field2)"

// Product with constants
"PRODUCT(quantity, unit_price, 1.1)"

// Product with calculations
"PRODUCT(field1 + 10, field2, field3)"
```

#### AVERAGE Function
```javascript
// Average of multiple fields
"AVERAGE(field1, field2, field3)"

// Average with constants
"AVERAGE(score1, score2, score3, 100)"

// Average with calculations
"AVERAGE(field1 * 2, field2, field3 / 2)"
```

#### MIN/MAX Functions
```javascript
// Minimum value
"MIN(field1, field2, field3)"

// Maximum value
"MAX(field1, field2, field3)"

// Min/Max with calculations
"MIN(field1 + 10, field2, field3 * 2)"
"MAX(field1 - 5, field2, field3 / 2)"
```

### 3. Financial Functions

#### TAX Function
```javascript
// Calculate tax amount (rate as percentage)
"TAX(amount, rate)"

// Examples:
"TAX(100, 8)"     // Returns 8 (8% of 100)
"TAX(250, 10.5)"  // Returns 26.25 (10.5% of 250)
"TAX(subtotal, tax_rate)"
```

#### DISCOUNT Function
```javascript
// Calculate discount amount (percentage as number)
"DISCOUNT(amount, percentage)"

// Examples:
"DISCOUNT(200, 15)"    // Returns 30 (15% of 200)
"DISCOUNT(500, 25)"    // Returns 125 (25% of 500)
"DISCOUNT(total, discount_percent)"
```

#### PERCENTAGE Function
```javascript
// Calculate percentage (value as percentage of total)
"PERCENTAGE(value, total)"

// Examples:
"PERCENTAGE(25, 100)"     // Returns 25 (25 is 25% of 100)
"PERCENTAGE(75, 200)"     // Returns 37.5 (75 is 37.5% of 200)
"PERCENTAGE(score, total_points)"
```

### 4. Conditional Logic

#### IF Function
```javascript
// Basic conditional
"IF(condition, true_value, false_value)"

// Examples:
"IF(total > 100, 'Free Shipping', 'Shipping: $5')"
"IF(quantity > 10, price * 0.9, price)"
"IF(score >= 90, 'A', IF(score >= 80, 'B', 'C'))"

// Nested IF statements
"IF(total > 1000, 'Premium', IF(total > 500, 'Standard', 'Basic'))"
```

### 5. Date Functions

#### DATE_DIFF Function
```javascript
// Calculate days between dates (YYYY-MM-DD format)
"DATE_DIFF(start_date, end_date)"

// Examples:
"DATE_DIFF('2024-01-01', '2024-01-15')"  // Returns 14
"DATE_DIFF('2024-01-01', '2024-02-01')"  // Returns 31
"DATE_DIFF(start_date, end_date)"
```

## Complete Business Examples

### 1. E-commerce Order Calculator
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
      "name": "Shipping Cost",
      "targetField": "shipping",
      "formula": "IF(subtotal > 100, 0, 10)",
      "triggerFields": ["subtotal"],
      "calculationType": "logical",
      "isActive": true
    },
    {
      "name": "Tax Amount",
      "targetField": "tax",
      "formula": "TAX(subtotal, 8.5)",
      "triggerFields": ["subtotal"],
      "calculationType": "financial",
      "isActive": true
    },
    {
      "name": "Discount",
      "targetField": "discount",
      "formula": "DISCOUNT(subtotal, 15)",
      "triggerFields": ["subtotal"],
      "calculationType": "financial",
      "isActive": true
    },
    {
      "name": "Final Total",
      "targetField": "total",
      "formula": "subtotal + shipping + tax - discount",
      "triggerFields": ["subtotal", "shipping", "tax", "discount"],
      "calculationType": "mathematical",
      "isActive": true
    }
  ]
}
```

### 2. Employee Payroll Calculator
```json
{
  "calculations": [
    {
      "name": "Gross Pay",
      "targetField": "gross_pay",
      "formula": "hours_worked * hourly_rate",
      "triggerFields": ["hours_worked", "hourly_rate"],
      "calculationType": "mathematical",
      "isActive": true
    },
    {
      "name": "Overtime Pay",
      "targetField": "overtime_pay",
      "formula": "IF(hours_worked > 40, (hours_worked - 40) * hourly_rate * 1.5, 0)",
      "triggerFields": ["hours_worked", "hourly_rate"],
      "calculationType": "logical",
      "isActive": true
    },
    {
      "name": "Total Gross",
      "targetField": "total_gross",
      "formula": "gross_pay + overtime_pay",
      "triggerFields": ["gross_pay", "overtime_pay"],
      "calculationType": "mathematical",
      "isActive": true
    },
    {
      "name": "Tax Withholding",
      "targetField": "tax_withholding",
      "formula": "TAX(total_gross, 22)",
      "triggerFields": ["total_gross"],
      "calculationType": "financial",
      "isActive": true
    },
    {
      "name": "Net Pay",
      "targetField": "net_pay",
      "formula": "total_gross - tax_withholding",
      "triggerFields": ["total_gross", "tax_withholding"],
      "calculationType": "mathematical",
      "isActive": true
    }
  ]
}
```

### 3. Project Budget Calculator
```json
{
  "calculations": [
    {
      "name": "Labor Cost",
      "targetField": "labor_cost",
      "formula": "hours * hourly_rate",
      "triggerFields": ["hours", "hourly_rate"],
      "calculationType": "mathematical",
      "isActive": true
    },
    {
      "name": "Material Cost",
      "targetField": "material_cost",
      "formula": "SUM(material1_cost, material2_cost, material3_cost)",
      "triggerFields": ["material1_cost", "material2_cost", "material3_cost"],
      "calculationType": "mathematical",
      "isActive": true
    },
    {
      "name": "Subtotal",
      "targetField": "subtotal",
      "formula": "labor_cost + material_cost",
      "triggerFields": ["labor_cost", "material_cost"],
      "calculationType": "mathematical",
      "isActive": true
    },
    {
      "name": "Contingency",
      "targetField": "contingency",
      "formula": "DISCOUNT(subtotal, 10)",
      "triggerFields": ["subtotal"],
      "calculationType": "financial",
      "isActive": true
    },
    {
      "name": "Total Budget",
      "targetField": "total_budget",
      "formula": "subtotal + contingency",
      "triggerFields": ["subtotal", "contingency"],
      "calculationType": "mathematical",
      "isActive": true
    },
    {
      "name": "Budget Status",
      "targetField": "budget_status",
      "formula": "IF(total_budget <= 10000, 'Under Budget', 'Over Budget')",
      "triggerFields": ["total_budget"],
      "calculationType": "logical",
      "isActive": true
    }
  ]
}
```

### 4. Academic Grade Calculator
```json
{
  "calculations": [
    {
      "name": "Assignment Average",
      "targetField": "assignment_avg",
      "formula": "AVERAGE(assignment1, assignment2, assignment3, assignment4)",
      "triggerFields": ["assignment1", "assignment2", "assignment3", "assignment4"],
      "calculationType": "mathematical",
      "isActive": true
    },
    {
      "name": "Weighted Grade",
      "targetField": "weighted_grade",
      "formula": "(assignment_avg * 0.4) + (midterm * 0.3) + (final * 0.3)",
      "triggerFields": ["assignment_avg", "midterm", "final"],
      "calculationType": "mathematical",
      "isActive": true
    },
    {
      "name": "Letter Grade",
      "targetField": "letter_grade",
      "formula": "IF(weighted_grade >= 93, 'A', IF(weighted_grade >= 90, 'A-', IF(weighted_grade >= 87, 'B+', IF(weighted_grade >= 83, 'B', IF(weighted_grade >= 80, 'B-', IF(weighted_grade >= 77, 'C+', IF(weighted_grade >= 73, 'C', IF(weighted_grade >= 70, 'C-', IF(weighted_grade >= 67, 'D+', IF(weighted_grade >= 63, 'D', IF(weighted_grade >= 60, 'D-', 'F')))))))))))",
      "triggerFields": ["weighted_grade"],
      "calculationType": "logical",
      "isActive": true
    },
    {
      "name": "GPA Points",
      "targetField": "gpa_points",
      "formula": "IF(letter_grade = 'A', 4.0, IF(letter_grade = 'A-', 3.7, IF(letter_grade = 'B+', 3.3, IF(letter_grade = 'B', 3.0, IF(letter_grade = 'B-', 2.7, IF(letter_grade = 'C+', 2.3, IF(letter_grade = 'C', 2.0, IF(letter_grade = 'C-', 1.7, IF(letter_grade = 'D+', 1.3, IF(letter_grade = 'D', 1.0, IF(letter_grade = 'D-', 0.7, 0)))))))))))",
      "triggerFields": ["letter_grade"],
      "calculationType": "logical",
      "isActive": true
    }
  ]
}
```

### 5. Real Estate Investment Calculator
```json
{
  "calculations": [
    {
      "name": "Monthly Rent Income",
      "targetField": "monthly_rent",
      "formula": "rental_rate",
      "triggerFields": ["rental_rate"],
      "calculationType": "mathematical",
      "isActive": true
    },
    {
      "name": "Annual Rent Income",
      "targetField": "annual_rent",
      "formula": "monthly_rent * 12",
      "triggerFields": ["monthly_rent"],
      "calculationType": "mathematical",
      "isActive": true
    },
    {
      "name": "Monthly Expenses",
      "targetField": "monthly_expenses",
      "formula": "SUM(mortgage, property_tax, insurance, maintenance, utilities)",
      "triggerFields": ["mortgage", "property_tax", "insurance", "maintenance", "utilities"],
      "calculationType": "mathematical",
      "isActive": true
    },
    {
      "name": "Annual Expenses",
      "targetField": "annual_expenses",
      "formula": "monthly_expenses * 12",
      "triggerFields": ["monthly_expenses"],
      "calculationType": "mathematical",
      "isActive": true
    },
    {
      "name": "Net Operating Income",
      "targetField": "net_operating_income",
      "formula": "annual_rent - annual_expenses",
      "triggerFields": ["annual_rent", "annual_expenses"],
      "calculationType": "mathematical",
      "isActive": true
    },
    {
      "name": "ROI Percentage",
      "targetField": "roi_percentage",
      "formula": "PERCENTAGE(net_operating_income, property_value)",
      "triggerFields": ["net_operating_income", "property_value"],
      "calculationType": "financial",
      "isActive": true
    },
    {
      "name": "Investment Status",
      "targetField": "investment_status",
      "formula": "IF(roi_percentage >= 8, 'Excellent', IF(roi_percentage >= 6, 'Good', IF(roi_percentage >= 4, 'Fair', 'Poor')))",
      "triggerFields": ["roi_percentage"],
      "calculationType": "logical",
      "isActive": true
    }
  ]
}
```

## API Request Examples

### 1. Get Form Fields
```bash
curl -X POST http://localhost:2104/pdf-calculate-fields/get-form-fields \
  -F "pdf=@invoice_form.pdf"
```

### 2. Validate Formula
```bash
curl -X POST http://localhost:2104/pdf-calculate-fields/validate-formula \
  -H "Content-Type: application/json" \
  -d '{
    "formula": "SUM(quantity, price) * 0.1",
    "fieldNames": ["quantity", "price", "total"]
  }'
```

### 3. Apply Calculations
```bash
curl -X POST http://localhost:2104/pdf-calculate-fields/add-calculations \
  -F "pdf=@invoice_form.pdf" \
  -F 'calculations=[{"name":"Total","targetField":"total","formula":"quantity * price","triggerFields":["quantity","price"],"calculationType":"mathematical","isActive":true}]'
```

### 4. Get Templates
```bash
curl -X GET http://localhost:2104/pdf-calculate-fields/templates
```

### 5. Get Service Status
```bash
curl -X GET http://localhost:2104/pdf-calculate-fields/status
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

### Limitations
- Maximum 50 calculations per form
- Maximum 1000 characters per formula
- Only text fields can be target fields
- Date fields must be in YYYY-MM-DD format

## Error Handling Examples

### Common Error Responses
```json
{
  "success": false,
  "error": "Failed to add calculations",
  "details": "Target field 'total' not found"
}
```

```json
{
  "success": false,
  "error": "Failed to add calculations",
  "details": "Invalid formula: Division by zero"
}
```

```json
{
  "success": false,
  "error": "Failed to add calculations",
  "details": "Trigger fields not found: invalid_field"
}
```

## Best Practices

1. **Field Naming**: Use descriptive names (e.g., `quantity`, `unit_price`, `total`)
2. **Formula Validation**: Always validate formulas before applying
3. **Error Handling**: Check for calculation errors in the response
4. **Performance**: Limit the number of calculations per form
5. **Testing**: Test calculations with sample data before production use
6. **Documentation**: Document complex formulas for future reference
