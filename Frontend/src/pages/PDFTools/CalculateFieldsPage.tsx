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
import { Link } from 'react-router-dom';
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
    <div className="mx-auto space-y-6">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              to="/pdf-tools"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Calculate Fields</h1>
              <p className="mt-2 text-sm text-gray-600">
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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload PDF Form</h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-500 font-medium">
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
                  <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
                </div>
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>

              {selectedFile && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={handleLoadFormFields}
                    disabled={isLoadingFields}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoadingFields ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    Load Form Fields
                  </button>
                  
                  {formFields.length > 0 && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                      ✓ Loaded {formFields.length} form fields ({formFields.filter(f => f.canCalculate).length} calculable)
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('setup')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'setup'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Calculator className="w-4 h-4 inline mr-2" />
                    Setup Calculations
                  </button>
                  <button
                    onClick={() => setActiveTab('templates')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'templates'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Copy className="w-4 h-4 inline mr-2" />
                    Templates
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'preview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Available Fields</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formFields.map((field, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-900">{field.name}</h4>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  field.canCalculate ? 'text-green-600 bg-green-100' : 'text-gray-500 bg-gray-100'
                                }`}>
                                  {field.type}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
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
                        <h3 className="text-lg font-medium text-gray-900">Calculations</h3>
                        <button
                          onClick={handleAddCalculation}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Calculation
                        </button>
                      </div>

                      <div className="space-y-4">
                        {calculations.map((calculation) => (
                          <div key={calculation.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-4">
                              <input
                                type="text"
                                value={calculation.name}
                                onChange={(e) => handleUpdateCalculation(calculation.id, { name: e.target.value })}
                                className="text-lg font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                                placeholder="Calculation Name"
                              />
                              <button
                                onClick={() => handleRemoveCalculation(calculation.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Target Field
                                </label>
                                <select
                                  value={calculation.targetField}
                                  onChange={(e) => handleUpdateCalculation(calculation.id, { targetField: e.target.value })}
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Calculation Type
                                </label>
                                <select
                                  value={calculation.calculationType}
                                  onChange={(e) => handleUpdateCalculation(calculation.id, { calculationType: e.target.value })}
                                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="mathematical">Mathematical</option>
                                  <option value="financial">Financial</option>
                                  <option value="date">Date</option>
                                  <option value="logical">Logical</option>
                                </select>
                              </div>
                            </div>

                                                          <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Formula
                                </label>
                                <div className="relative">
                                  <textarea
                                    value={calculation.formula}
                                    onChange={(e) => {
                                      handleUpdateCalculation(calculation.id, { formula: e.target.value });
                                      handleValidateFormula(e.target.value);
                                    }}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Enter formula using actual field names (e.g., name + email or SUM(name, email, phone))"
                                  />
                                  <div className="mt-1 text-xs text-gray-500">
                                    💡 Use actual field names from your PDF (like "name", "email", "phone") instead of generic names like "field1", "field2"
                                  </div>
                                {isValidating && (
                                  <div className="absolute right-2 top-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
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
                              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">{field.name}</span>
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
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Active</span>
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
                      <h3 className="text-lg font-medium text-gray-900">Calculation Templates</h3>
                      <button
                        onClick={handleLoadTemplates}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Templates
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {templates.map((template, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{template.name}</h4>
                            <span className="text-xs px-2 py-1 rounded-full text-blue-600 bg-blue-100">
                              {template.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                          <div className="bg-gray-50 rounded p-2 mb-3">
                            <code className="text-sm text-gray-800">{template.formula}</code>
                          </div>
                          <div className="text-xs text-gray-500 mb-3">
                            Example: {template.example}
                          </div>
                          <button
                            onClick={() => handleApplyTemplate(template)}
                            className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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
                    <h3 className="text-lg font-medium text-gray-900">Calculation Preview</h3>
                    
                    {calculations.length === 0 ? (
                      <div className="text-center py-8">
                        <Calculator className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-gray-500">No calculations added yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {calculations.map((calculation) => (
                          <div key={calculation.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">{calculation.name}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                calculation.isActive ? 'text-green-600 bg-green-100' : 'text-gray-500 bg-gray-100'
                              }`}>
                                {calculation.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
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
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleApplyCalculations}
                  disabled={isProcessing || !selectedFile || calculations.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Calculator className="w-4 h-4 mr-2 text-blue-600" />
                  Formula support
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Target className="w-4 h-4 mr-2 text-green-600" />
                  Field relationships
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Zap className="w-4 h-4 mr-2 text-purple-600" />
                  Dynamic calculations
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Settings className="w-4 h-4 mr-2 text-orange-600" />
                  Mathematical operations
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckSquare className="w-4 h-4 mr-2 text-indigo-600" />
                  Conditional logic
                </div>
              </div>
            </div>

            {/* Supported Operations */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Supported Operations</h2>
              
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <strong>Basic:</strong> +, -, *, /, ^, %
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Functions:</strong> SUM, PRODUCT, AVERAGE, MIN, MAX
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Financial:</strong> TAX, DISCOUNT, PERCENTAGE
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Logical:</strong> IF, AND, OR
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Date:</strong> DATE_DIFF
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
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
