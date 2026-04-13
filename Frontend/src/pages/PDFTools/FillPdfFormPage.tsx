import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Download,
  FileText,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Save,
  Loader2,
  Wand2,
  Shield,
  PenTool,
  Database,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { pdfApi } from '../../services/apiHelper';

interface FormField {
  name: string;
  type: string;
  currentValue: string | boolean | number | null;
  defaultValue: string | boolean | number | null;
  required: boolean;
  readOnly: boolean;
  maxLength?: number;
  isMultiline?: boolean;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    type?: string;
  };
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fieldsCount: number;
  created: string;
  updated: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; error: string; value: any }>;
  warnings: Array<{ field: string; warning: string; value: any }>;
  validatedFields: Record<string, any>;
}

const FillPdfFormPage: React.FC = () => {
   const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  // const [isExtracting, setIsExtracting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  // const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [processingMode, setProcessingMode] = useState<'manual' | 'auto' | 'bulk'>('manual');
  const [outputOptions, setOutputOptions] = useState({
    flatten: false,
    keepEditable: true,
    addSignature: false
  });
  const [autoFillData, setAutoFillData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    title: ''
  });
  const [signatureData, setSignatureData] = useState({
    type: 'text',
    text: '',
    imageData: null as string | null,
    fieldName: '' // Add field name selection
  });
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkData, setBulkData] = useState<Record<string, any>>({});
  // const [showPreview, setShowPreview] = useState(false);
  // const [previewUrl, setPreviewUrl] = useState<string>('');
  const [resultFile, setResultFile] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await pdfApi.get('/pdf-fill-form/templates');
      if (response.status === 200 && response.data.success) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setFormFields([]);
      setFormData({});
      setValidationResults(null);
      setResultFile('');
      extractFormFields(file);
    } else {
      toast.error('Please select a valid PDF file');
    }
  };

  const handleBulkFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');

    if (pdfFiles.length > 0) {
      setBulkFiles(pdfFiles);

      // Initialize bulk data with common form fields if not already populated
      if (Object.keys(bulkData).length === 0) {
        setBulkData({
          name: '',
          email: '',
          phone: '',
          address: '',
          company: '',
          title: '',
          date: '',
          city: '',
          state: '',
          zipcode: ''
        });
      }

      toast.success(`${pdfFiles.length} PDF files selected for bulk processing`);
    } else {
      toast.error('Please select valid PDF files');
    }
  };

  const extractFormFields = async (file: File) => {
    // setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await pdfApi.post('/pdf-fill-form/extract-fields', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200 && response.data.success) {
        const fields = response.data.fields;
        setFormFields(fields);

        // Initialize form data with current values or empty values
        const initialData: Record<string, any> = {};
        fields.forEach((field: FormField) => {
          initialData[field.name] = field.currentValue || field.defaultValue || '';
        });
        setFormData(initialData);

        toast.success(`Extracted ${fields.length} form fields`);
      }
    } catch (error) {
      console.error('Error extracting form fields:', error);
      toast.error('Failed to extract form fields');
    } finally {
      // setIsExtracting(false);
    }
  };

  const validateFormData = async () => {
    if (Object.keys(formData).length === 0) {
      toast.error('No form data to validate');
      return;
    }

    setIsValidating(true);
    try {
      const validationRules: Record<string, any> = {};
      formFields.forEach(field => {
        if (field.validation) {
          validationRules[field.name] = field.validation;
        }
      });

      const response = await pdfApi.post('/pdf-fill-form/validate', {
        formData,
        validationRules
      });

      if (response.status === 200 && response.data.success) {
        setValidationResults(response.data.validation);

        if (response.data.validation.isValid) {
          toast.success('Form data validation passed');
        } else {
          toast.error(`Validation failed: ${response.data.validation.errors.length} errors found`);
        }
      }
    } catch (error) {
      console.error('Error validating form data:', error);
      toast.error('Failed to validate form data');
    } finally {
      setIsValidating(false);
    }
  };

  const handleAutoFill = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('autoFillRules', JSON.stringify({}));
      formData.append('userData', JSON.stringify(autoFillData));

      const response = await pdfApi.post('/pdf-fill-form/auto-fill', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200 && response.data.success) {
        const result = response.data.result;
        setResultFile(result.filename);
        setFormData(result.autoFilledData);
        toast.success(`Auto-filled ${result.fieldsAutoFilled} fields with ${result.confidence}% confidence`);
      }
    } catch (error) {
      console.error('Error auto-filling form:', error);
      toast.error('Failed to auto-fill form');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualFill = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('pdf', selectedFile);
      formDataToSend.append('formData', JSON.stringify(formData));
      formDataToSend.append('flatten', outputOptions.flatten.toString());
      formDataToSend.append('keepEditable', outputOptions.keepEditable.toString());

      const response = await pdfApi.post('/pdf-fill-form/fill', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200 && response.data.success) {
        const result = response.data.result;
        setResultFile(result.filename);
        toast.success(`Form filled successfully with ${result.fieldsFilled} fields`);
      }
    } catch (error) {
      console.error('Error filling form:', error);
      toast.error('Failed to fill form');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkFill = async () => {
    if (bulkFiles.length === 0) {
      toast.error('Please select PDF files for bulk processing');
      return;
    }

    if (Object.keys(bulkData).length === 0) {
      toast.error('Please provide form data for bulk filling');
      return;
    }

    setIsProcessing(true);
    try {
      const formDataToSend = new FormData();
      bulkFiles.forEach(file => {
        formDataToSend.append('pdfs', file);
      });
      formDataToSend.append('formData', JSON.stringify(bulkData));
      formDataToSend.append('flatten', outputOptions.flatten.toString());

      const response = await pdfApi.post('/pdf-fill-form/bulk-fill', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200 && response.data.success) {
        const results = response.data.results;
        toast.success(`Bulk processing completed: ${results.processed} files processed`);

        if (results.errors > 0) {
          toast.error(`${results.errors} files failed to process`);
        }
      }
    } catch (error) {
      console.error('Error in bulk filling:', error);
      toast.error('Failed to process bulk filling');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddSignature = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    if (!signatureData.fieldName) {
      toast.error('Please select a signature field');
      return;
    }

    if (signatureData.type === 'text' && !signatureData.text) {
      toast.error('Please provide signature text');
      return;
    }

    if (signatureData.type === 'image' && !signatureData.imageData) {
      toast.error('Please select a signature image');
      return;
    }

    setIsProcessing(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('pdf', selectedFile);
      formDataToSend.append('signatureData', JSON.stringify(signatureData));
      formDataToSend.append('signatureField', signatureData.fieldName);

      const response = await pdfApi.post('/pdf-fill-form/add-signature', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200 && response.data.success) {
        const result = response.data.result;
        setResultFile(result.filename);
        toast.success('Signature added successfully');
      }
    } catch (error: any) {
      console.error('Error adding signature:', error);

      // Handle detailed error messages from backend
      if (error.response?.data?.details) {
        const details = error.response.data.details;
        let errorMessage = error.response.data.error;

        if (details.availableFields && details.availableFields.length > 0) {
          errorMessage += `\n\nAvailable fields: ${details.availableFields.map((f: any) => f.name).join(', ')}`;
        }

        if (details.message) {
          errorMessage += `\n\n${details.message}`;
        }

        toast.error(errorMessage, { duration: 6000 });
      } else {
        toast.error(error.response?.data?.error || 'Failed to add signature');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const saveAsTemplate = async () => {
    if (Object.keys(formData).length === 0) {
      toast.error('No form data to save as template');
      return;
    }

    const templateName = prompt('Enter template name:');
    if (!templateName) return;

    try {
      const response = await pdfApi.post('/pdf-fill-form/save-template', {
        templateName,
        formData,
        description: `Template for ${selectedFile?.name || 'PDF form'}`,
        category: 'general'
      });

      if (response.status === 200 && response.data.success) {
        toast.success('Template saved successfully');
        fetchTemplates(); // Refresh templates list
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const loadTemplate = async (templateId: string) => {
    try {
      const response = await pdfApi.get(`/pdf-fill-form/templates/${templateId}`);
      if (response.status === 200 && response.data.success) {
        const template = response.data.template;

        // Load the template data into the form
        setFormData(template.formData);

        // Update the selected template
        // setSelectedTemplate(templateId);

        // Show success message with template details
        toast.success(`Template "${template.name}" loaded with ${template.fieldsCount} fields`);

        // Debug: Log what was loaded
        console.log('Template loaded:', template);
        console.log('Form data set to:', template.formData);

        // If we have form fields extracted, we can also populate them
        if (formFields.length > 0) {
          // Update form fields with template data where field names match
          const updatedFormData = { ...template.formData };

          // Only keep fields that exist in the current PDF
          Object.keys(updatedFormData).forEach(fieldName => {
            if (!formFields.find(field => field.name === fieldName)) {
              delete updatedFormData[fieldName];
            }
          });

          setFormData(updatedFormData);
          console.log('Updated form data (filtered):', updatedFormData);
        } else {
          console.log('No form fields extracted yet, template data loaded directly');
        }
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
    }
  };

  const downloadResult = () => {
    if (resultFile) {
      const downloadUrl = `${import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:2104'}/downloads/${resultFile}`;
      window.open(downloadUrl, '_blank');
    }
  };

  const handleFormDataChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleAutoFillDataChange = (field: string, value: string) => {
    setAutoFillData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBulkDataChange = (fieldName: string, value: any) => {
    setBulkData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',');
        const data: Record<string, any> = {};

        headers.forEach((header, index) => {
          if (lines[1] && lines[1].split(',')[index]) {
            data[header.trim()] = lines[1].split(',')[index].trim();
          }
        });

        setBulkData(data);
        toast.success('CSV data imported successfully');
      };
      reader.readAsText(file);
    }
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
              <h1 className="text-3xl font-bold text-foreground">Fill PDF Forms</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Fill out PDF forms digitally with auto-fill, validation, and signature support

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
                <p className="text-sm text-muted-foreground mt-1">or drag and drop</p>
              </div>
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Processing Mode Selection */}
          <div className="bg-card rounded-lg shadow p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Processing Mode</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setProcessingMode('manual')}
                className={`p-4 rounded-lg border-2 text-left ${processingMode === 'manual'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground/40'
                  }`}
              >
                <PenTool className="w-6 h-6 text-blue-600 mb-2" />
                <h3 className="font-medium">Manual Fill</h3>
                <p className="text-sm text-muted-foreground">Fill form fields manually</p>
              </button>

              <button
                onClick={() => setProcessingMode('auto')}
                className={`p-4 rounded-lg border-2 text-left ${processingMode === 'auto'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground/40'
                  }`}
              >
                <Wand2 className="w-6 h-6 text-blue-600 mb-2" />
                <h3 className="font-medium">Auto Fill</h3>
                <p className="text-sm text-muted-foreground">AI-powered automatic filling</p>
              </button>

              <button
                onClick={() => setProcessingMode('bulk')}
                className={`p-4 rounded-lg border-2 text-left ${processingMode === 'bulk'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground/40'
                  }`}
              >
                <Database className="w-6 h-6 text-blue-600 mb-2" />
                <h3 className="font-medium">Bulk Process</h3>
                <p className="text-sm text-muted-foreground">Process multiple forms</p>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          {formFields.length > 0 && processingMode === 'manual' && (
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-foreground">Form Fields</h2>
                <button
                  onClick={validateFormData}
                  disabled={isValidating}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isValidating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  Validate
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formFields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      {field.name}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'PDFTextField' && (
                      <input
                        type="text"
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFormDataChange(field.name, e.target.value)}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder={`Enter ${field.name}`}
                      />
                    )}
                    {field.type === 'PDFCheckBox' && (
                      <input
                        type="checkbox"
                        checked={formData[field.name] || false}
                        onChange={(e) => handleFormDataChange(field.name, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    )}
                    {field.type === 'PDFDropdown' && field.options && (
                      <select
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFormDataChange(field.name, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select an option</option>
                        {field.options.map((option: string) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>

              {validationResults && (
                <div className="mt-6 p-4 rounded-lg border">
                  <h3 className="font-medium mb-2">Validation Results</h3>
                  {validationResults.isValid ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      All fields are valid
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {validationResults.errors.map((error, index) => (
                        <div key={index} className="flex items-center text-red-600">
                          <AlertCircle className="w-5 h-5 mr-2" />
                          {error.field}: {error.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Template Data Display */}
          {Object.keys(formData).length > 0 && formFields.length === 0 && processingMode === 'manual' && (
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-foreground">Template Data Loaded</h2>
                <div className="text-sm text-muted-foreground">
                  Upload a PDF to see and edit these fields
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData).map(([fieldName, fieldValue]) => (
                  <div key={fieldName} className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      {fieldName}
                    </label>
                    <div className="px-3 py-2 bg-muted border border-border bg-background text-foreground rounded-md">
                      {typeof fieldValue === 'boolean' ? (fieldValue ? 'Yes' : 'No') : fieldValue}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-muted border border-border bg-background text-foreground rounded-md">
                <div className="flex items-center text-foreground">
                  <Info className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    Template data is loaded. Upload a PDF form to start filling it out with this data.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Auto Fill Data */}
          {processingMode === 'auto' && (
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Auto Fill Data</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(autoFillData).map(([field, value]) => (
                  <div key={field} className="space-y-2">
                    <label className="block text-sm font-medium text-foreground capitalize">
                      {field}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleAutoFillDataChange(field, e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder={`Enter ${field}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Processing */}
          {processingMode === 'bulk' && (
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bulk Processing</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Upload Multiple PDFs</h3>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center bg-muted/30 dark:bg-muted/20">
                    <FileSpreadsheet className="mx-auto h-8 w-8 text-muted-foreground" />
                    <div className="mt-2">
                      <label className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-500 font-medium">
                          Select PDF files
                        </span>
                        <input
                          ref={bulkFileInputRef}
                          type="file"
                          accept=".pdf"
                          multiple
                          onChange={handleBulkFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {bulkFiles.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {bulkFiles.length} files selected
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2">Form Data</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={importFromCSV}
                        className="text-sm"
                      />
                      <span className="text-sm text-muted-foreground">or enter manually:</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(bulkData).map(([field, value]) => (
                        <div key={field} className="space-y-2">
                          <label className="block text-sm font-medium text-foreground">
                            {field}
                          </label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleBulkDataChange(field, e.target.value)}
                            className="w-full px-3 py-2 border border-muted-foreground bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Signature Section */}
          {outputOptions.addSignature && (
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Digital Signature</h2>

              <div className="space-y-4">
                {/* Signature Field Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Signature Field
                  </label>
                  {formFields.length > 0 ? (
                    <select
                      value={signatureData.fieldName}
                      onChange={(e) => setSignatureData(prev => ({ ...prev, fieldName: e.target.value }))}
                      className="w-full px-3 py-2 border border-muted-foreground bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a field for signature</option>
                      {formFields.map((field) => (
                        <option key={field.name} value={field.name}>
                          {field.name} ({field.type}) {field.type === 'PDFTextField' ? '✓' : field.type === 'PDFSignature' ? '🔒' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-muted border border-border bg-background text-foreground rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Upload a PDF first to see available signature fields
                      </p>
                    </div>
                  )}

                  {formFields.length > 0 && (
                    <div className="mt-2 p-2 bg-muted border border-border bg-background text-foreground rounded-md">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">✓</span> Text fields can be used for signatures<br />
                        <span className="font-medium">🔒</span> True signature fields (if available)
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Signature Type
                  </label>
                  <select
                    value={signatureData.type}
                    onChange={(e) => setSignatureData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-muted-foreground bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">Text Signature</option>
                    <option value="image">Image Signature</option>
                  </select>
                </div>

                {signatureData.type === 'text' && (
                  <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                      Signature Text
                    </label>
                    <input
                      type="text"
                      value={signatureData.text}
                      onChange={(e) => setSignatureData(prev => ({ ...prev, text: e.target.value }))}
                      className="w-full px-3 py-2 border border-muted-foreground bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your signature"
                    />
                  </div>
                )}

                {signatureData.type === 'image' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Signature Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            setSignatureData(prev => ({
                              ...prev,
                              imageData: e.target?.result as string
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full px-3 py-2 border border-muted-foreground bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-card rounded-lg shadow p-6 border border-border">
            <div className="flex flex-wrap gap-4">
              {processingMode === 'manual' && (
                <button
                  onClick={handleManualFill}
                  disabled={isProcessing || formFields.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  Fill Form
                </button>
              )}

              {processingMode === 'auto' && (
                <button
                  onClick={handleAutoFill}
                  disabled={isProcessing || !selectedFile}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  Auto Fill
                </button>
              )}

              {processingMode === 'bulk' && (
                <button
                  onClick={handleBulkFill}
                  disabled={isProcessing || bulkFiles.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4 mr-2" />
                  )}
                  Bulk Process
                </button>
              )}

              {outputOptions.addSignature && (
                <button
                  onClick={handleAddSignature}
                  disabled={isProcessing || !selectedFile || !signatureData.fieldName ||
                    (signatureData.type === 'text' && !signatureData.text) ||
                    (signatureData.type === 'image' && !signatureData.imageData)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <PenTool className="w-4 h-4 mr-2" />
                  )}
                  Add Signature
                </button>
              )}

              {resultFile && (
                <button
                  onClick={downloadResult}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Result
                </button>
              )}

              <button
                onClick={saveAsTemplate}
                disabled={Object.keys(formData).length === 0}
                className="inline-flex items-center px-4 py-2 border border-border bg-background text-foreground rounded-md hover:bg-muted disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                Save as Template
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Output Options */}
          <div className="bg-card rounded-lg shadow p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Output Options</h2>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={outputOptions.flatten}
                  onChange={(e) => setOutputOptions(prev => ({ ...prev, flatten: e.target.checked }))}
                  className="h-4 w-4 text-primary focus:ring-primary border-border bg-background text-foreground rounded"
                />
                <span className="ml-2 text-sm text-foreground">Flatten form after filling</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={outputOptions.keepEditable}
                  onChange={(e) => setOutputOptions(prev => ({ ...prev, keepEditable: e.target.checked }))}
                  className="h-4 w-4 text-primary focus:ring-primary border-border bg-background text-foreground rounded"
                />
                <span className="ml-2 text-sm text-foreground">Keep form fields editable</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={outputOptions.addSignature}
                  onChange={(e) => setOutputOptions(prev => ({ ...prev, addSignature: e.target.checked }))}
                    className="h-4 w-4 text-primary focus:ring-primary border-border bg-background text-foreground rounded"
                />
                <span className="ml-2 text-sm text-foreground">Add digital signature</span>
              </label>
            </div>
          </div>

          {/* Templates */}
          <div className="bg-card rounded-lg shadow p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Saved Templates</h2>

            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No templates saved yet</p>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-3 border border-border bg-background text-foreground rounded-lg hover:border-muted-foreground/40 cursor-pointer"
                    onClick={() => loadTemplate(template.id)}
                  >
                    <h3 className="font-medium text-foreground">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {template.fieldsCount} fields • {new Date(template.updated).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Features */}
          <div className="bg-card rounded-lg shadow p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Features</h2>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Wand2 className="w-4 h-4 mr-2 text-blue-600" />
                Auto-fill with AI
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Shield className="w-4 h-4 mr-2 text-green-600" />
                Data validation
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <PenTool className="w-4 h-4 mr-2 text-purple-600" />
                Signature fields
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Database className="w-4 h-4 mr-2 text-orange-600" />
                Bulk processing
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Save className="w-4 h-4 mr-2 text-indigo-600" />
                Template management
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FillPdfFormPage;
