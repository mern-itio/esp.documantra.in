import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  Calculator,
  FileText,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Plus,
  Trash2,
  Zap,
  Target,
  Settings,
  Info,
  AlertCircle,
  CheckSquare,
  Copy,
  RefreshCw
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { pdfApi } from '../../services/apiHelper';

interface FormField {
  name: string;
  type: string;
  currentValue: string;
  isReadOnly: boolean;
  canCalculate: boolean;
}

interface Calculation {
  id: string;
  name: string;
  targetField: string;
  formula: string;
  triggerFields: string[];
  calculationType: string;
  isActive: boolean;
}

interface CalculationTemplate {
  name: string;
  description: string;
  formula: string;
  category: string;
  example: string;
}

interface FormulaValidation {
  isValid: boolean;
  result: number | null;
  errors: string[];
  warnings: string[];
}

const CalculateFieldsPage: React.FC = () => {
  const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [templates, setTemplates] = useState<CalculationTemplate[]>([]);
  // const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formulaValidation, setFormulaValidation] = useState<FormulaValidation | null>(null);
  const [resultFile, setResultFile] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'setup' | 'templates' | 'preview'>('setup');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setFormFields([]);
      setCalculations([]);
      setResultFile('');
      toast.success('PDF file selected for field calculations');
    } else {
      toast.error('Please select a valid PDF file');
    }
  };

  const handleLoadFormFields = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    setIsLoadingFields(true);
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      console.log('Loading form fields from PDF:', selectedFile.name);
      const response = await pdfApi.post('/pdf-calculate-fields/get-form-fields', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('API Response:', response.data);

      if (response.status === 200 && response.data.success) {
        setFormFields(response.data.fields);
        console.log('Form fields loaded:', response.data.fields);
        toast.success(`Loaded ${response.data.totalFields} form fields`);
      } else {
        console.error('API returned error:', response.data);
        toast.error('Failed to load form fields: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error loading form fields:', error);
      toast.error('Failed to load form fields: ' + ((error as Error).message || 'Network error'));
    } finally {
      setIsLoadingFields(false);
    }
  };

  const handleLoadTemplates = async () => {
    try {
      const response = await pdfApi.get('/pdf-calculate-fields/templates');
      if (response.status === 200 && response.data.success) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load calculation templates');
    }
  };

  const handleAddCalculation = () => {
    const newCalculation: Calculation = {
      id: Date.now().toString(),
      name: `Calculation ${calculations.length + 1}`,
      targetField: '',
      formula: '',
      triggerFields: [],
      calculationType: 'mathematical',
      isActive: true
    };
    setCalculations([...calculations, newCalculation]);
  };

  const handleUpdateCalculation = (id: string, updates: Partial<Calculation>) => {
    setCalculations(calculations.map(calc =>
      calc.id === id ? { ...calc, ...updates } : calc
    ));
  };

  const handleRemoveCalculation = (id: string) => {
    setCalculations(calculations.filter(calc => calc.id !== id));
  };

  const handleValidateFormula = async (formula: string) => {
    if (!formula.trim()) {
      setFormulaValidation(null);
      return;
    }

    setIsValidating(true);
    try {
      const fieldNames = formFields.map(field => field.name);
      const response = await pdfApi.post('/pdf-calculate-fields/validate-formula', {
        formula,
        fieldNames
      });

      if (response.status === 200 && response.data.success) {
        setFormulaValidation(response.data);
      }
    } catch (error) {
      console.error('Error validating formula:', error);
      toast.error('Failed to validate formula');
    } finally {
      setIsValidating(false);
    }
  };

  const handleApplyTemplate = (template: CalculationTemplate) => {
    const newCalculation: Calculation = {
      id: Date.now().toString(),
      name: template.name,
      targetField: '',
      formula: template.formula,
      triggerFields: [],
      calculationType: template.category,
      isActive: true
    };
    setCalculations([...calculations, newCalculation]);
    setActiveTab('setup');
    toast.success(`Template "${template.name}" applied`);
  };

  const handleApplyCalculations = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    if (calculations.length === 0) {
      toast.error('Please add at least one calculation');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('calculations', JSON.stringify(calculations));

      const response = await pdfApi.post('/pdf-calculate-fields/add-calculations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200 && response.data.success) {
        const result = response.data.result;
        setResultFile(result.filename);

        if (result.calculationsApplied > 0) {
          toast.success(`Calculations applied successfully! ${result.calculationsApplied} calculations processed`);
        } else {
          toast.error(`No calculations were applied. ${result.totalCalculations} calculations attempted.`);
        }

        if (result.errors.length > 0) {
          // Show detailed error information
          const errorMessages = result.errors.map((err: any) => `${err.calculation}: ${err.error}`).join('\n');
          toast.error(`${result.errors.length} calculations failed:\n${errorMessages}`, {
            duration: 8000, // Show for 8 seconds
            style: {
              whiteSpace: 'pre-line',
              maxWidth: '500px'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error applying calculations:', error);
      toast.error('Failed to apply calculations: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (resultFile) {
      const downloadUrl = `${import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104'}/downloads/${resultFile}`;
      window.open(downloadUrl, '_blank');
    }
  };

  const getValidationColor = (isValid: boolean) => {
    return isValid ? 'text-green-600' : 'text-red-600';
  };

  const getValidationIcon = (isValid: boolean) => {
    return isValid ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />;
  };

  return (
    <div className="mx-auto min-h-full w-full space-y-6 bg-background text-foreground">
      <div className="bg-background shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              to={`/pdf-tools${location.search}`}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Calculate Fields</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Add dynamic calculations and formulas to PDF form fields


              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload */}
          <div className="bg-card rounded-lg shadow p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Upload PDF Form</h2>

            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted/30 dark:bg-muted/20">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="mt-4">
                <label className="cursor-pointer">
                  <span className="text-primary hover:text-primary/80 font-medium">
                    Click to upload
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-muted-foreground mt-1">or drag and drop</p>
              </div>
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            {selectedFile && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleLoadFormFields}
                  disabled={isLoadingFields}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 disabled:opacity-50"
                >
                  {isLoadingFields ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  Load Form Fields
                </button>

                {formFields.length > 0 && (
                  <div className="text-sm text-success bg-success/10 p-2 rounded">
                    ✓ Loaded {formFields.length} form fields ({formFields.filter(f => f.canCalculate).length} calculable)
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="bg-card rounded-lg shadow border border-border">
            <div className="border-b border-border">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('setup')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'setup'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                >
                  <Calculator className="w-4 h-4 inline mr-2" />
                  Setup Calculations
                </button>
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'templates'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                >
                  <Copy className="w-4 h-4 inline mr-2" />
                  Templates
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'preview'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                >
                  <Target className="w-4 h-4 inline mr-2" />
                  Preview
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Setup Calculations Tab */}
              {activeTab === 'setup' && (
                <div className="space-y-6">
                  {formFields.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-4">Available Fields</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formFields.map((field, index) => (
                          <div key={index} className="border border-border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-foreground">{field.name}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${field.canCalculate ? 'text-success bg-success/10' : 'text-muted-foreground bg-muted/10'
                                }`}>
                                {field.type}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <div>Current Value: {field.currentValue || '(empty)'}</div>
                              <div>Read Only: {field.isReadOnly ? 'Yes' : 'No'}</div>
                              <div>Can Calculate: {field.canCalculate ? 'Yes' : 'No'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-foreground">Calculations</h3>
                      <button
                        onClick={handleAddCalculation}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Calculation
                      </button>
                    </div>

                    <div className="space-y-4">
                      {calculations.map((calculation) => (
                        <div key={calculation.id} className="border border-border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <input
                              type="text"
                              value={calculation.name}
                              onChange={(e) => handleUpdateCalculation(calculation.id, { name: e.target.value })}
                              className="text-lg font-medium text-foreground bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
                              placeholder="Calculation Name"
                            />
                            <button
                              onClick={() => handleRemoveCalculation(calculation.id)}
                              className="text-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Target Field
                              </label>
                              <select
                                value={calculation.targetField}
                                onChange={(e) => handleUpdateCalculation(calculation.id, { targetField: e.target.value })}
                                className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="">
                                  {formFields.length === 0
                                    ? "Load form fields first"
                                    : formFields.filter(f => f.canCalculate).length === 0
                                      ? "No calculable fields found"
                                      : "Select target field"
                                  }
                                </option>
                                {formFields.filter(f => f.canCalculate).map((field, index) => (
                                  <option key={index} value={field.name}>
                                    {field.name} ({field.type})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Calculation Type
                              </label>
                              <select
                                value={calculation.calculationType}
                                onChange={(e) => handleUpdateCalculation(calculation.id, { calculationType: e.target.value })}
                                className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="mathematical">Mathematical</option>
                                <option value="financial">Financial</option>
                                <option value="date">Date</option>
                                <option value="logical">Logical</option>
                              </select>
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Formula
                            </label>
                            <div className="relative">
                              <textarea
                                value={calculation.formula}
                                onChange={(e) => {
                                  handleUpdateCalculation(calculation.id, { formula: e.target.value });
                                  handleValidateFormula(e.target.value);
                                }}
                                className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                rows={3}
                                placeholder="Enter formula using actual field names (e.g., name + email or SUM(name, email, phone))"
                              />
                              <div className="mt-1 text-xs text-muted-foreground">
                                💡 Use actual field names from your PDF (like "name", "email", "phone") instead of generic names like "field1", "field2"
                              </div>
                              {isValidating && (
                                <div className="absolute right-2 top-2">
                                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            {formulaValidation && (
                              <div className={`mt-2 flex items-center text-sm ${getValidationColor(formulaValidation.isValid)}`}>
                                {getValidationIcon(formulaValidation.isValid)}
                                <span className="ml-2">
                                  {formulaValidation.isValid ? 'Valid formula' : 'Invalid formula'}
                                  {formulaValidation.result !== null && ` (Result: ${formulaValidation.result})`}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="mt-4">
                              <label className="block text-sm font-medium text-foreground mb-2">
                              Trigger Fields
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {formFields.map((field, index) => (
                                <label key={index} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={calculation.triggerFields.includes(field.name)}
                                    onChange={(e) => {
                                      const newTriggerFields = e.target.checked
                                        ? [...calculation.triggerFields, field.name]
                                        : calculation.triggerFields.filter(f => f !== field.name);
                                      handleUpdateCalculation(calculation.id, { triggerFields: newTriggerFields });
                                    }}
                                    className="h-4 w-4 text-primary focus:ring-primary border-border bg-background text-foreground rounded"
                                  />
                                  <span className="ml-2 text-sm text-muted-foreground">{field.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="mt-4 flex items-center">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={calculation.isActive}
                                onChange={(e) => handleUpdateCalculation(calculation.id, { isActive: e.target.checked })}
                                className="h-4 w-4 text-primary focus:ring-primary border-border bg-background text-foreground rounded"
                              />
                              <span className="ml-2 text-sm text-muted-foreground">Active</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Templates Tab */}
              {activeTab === 'templates' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-foreground">Calculation Templates</h3>
                    <button
                      onClick={handleLoadTemplates}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Templates
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template, index) => (
                      <div key={index} className="border border-border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-foreground">{template.name}</h4>
                          <span className="text-xs px-2 py-1 rounded-full text-primary bg-primary/10">
                            {template.category}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                        <div className="bg-[#F5F2EE] rounded p-2 mb-3">
                          <code className="text-sm text-foreground">{template.formula}</code>
                        </div>
                        <div className="text-xs text-muted-foreground mb-3">
                          Example: {template.example}
                        </div>
                        <button
                          onClick={() => handleApplyTemplate(template)}
                            className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Apply Template
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Tab */}
              {activeTab === 'preview' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-foreground">Calculation Preview</h3>

                  {calculations.length === 0 ? (
                    <div className="text-center py-8">
                      <Calculator className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">No calculations added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {calculations.map((calculation) => (
                        <div key={calculation.id} className="border border-border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-foreground">{calculation.name}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${calculation.isActive ? 'text-success bg-success/10' : 'text-muted-foreground bg-muted/10'
                              }`}>
                              {calculation.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                            <div><strong>Target:</strong> {calculation.targetField || '(not set)'}</div>
                            <div><strong>Formula:</strong> {calculation.formula || '(not set)'}</div>
                            <div><strong>Triggers:</strong> {calculation.triggerFields.join(', ') || '(none)'}</div>
                            <div><strong>Type:</strong> {calculation.calculationType}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-card rounded-lg shadow p-6 border border-border">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleApplyCalculations}
                disabled={isProcessing || !selectedFile || calculations.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Calculator className="w-4 h-4 mr-2" />
                )}
                Apply Calculations
              </button>

              {resultFile && (
                <button
                  onClick={downloadResult}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-success hover:bg-success/80"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Calculated Form
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Features */}
          <div className="bg-card rounded-lg shadow p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Features</h2>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calculator className="w-4 h-4 mr-2 text-primary" />
                Formula support
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Target className="w-4 h-4 mr-2 text-green-600" />
                Field relationships
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Zap className="w-4 h-4 mr-2 text-[#155E4B]" />
                Dynamic calculations
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Settings className="w-4 h-4 mr-2 text-orange-600" />
                Mathematical operations
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <CheckSquare className="w-4 h-4 mr-2 text-emerald-600" />
                Conditional logic
              </div>
            </div>
          </div>

          {/* Supported Operations */}
          <div className="bg-card rounded-lg shadow p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Supported Operations</h2>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                <strong>Basic:</strong> +, -, *, /, ^, %
              </div>
                <div className="text-sm text-muted-foreground">
                <strong>Functions:</strong> SUM, PRODUCT, AVERAGE, MIN, MAX
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>Financial:</strong> TAX, DISCOUNT, PERCENTAGE
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>Logical:</strong> IF, AND, OR
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>Date:</strong> DATE_DIFF
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-muted border border-border rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-foreground">
                <p className="font-medium mb-1">How it works:</p>
                <p>Upload a PDF form, load the fields, add calculations with formulas, and apply them to create dynamic forms that automatically calculate values based on user input.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>    
  );
};

export default CalculateFieldsPage;
