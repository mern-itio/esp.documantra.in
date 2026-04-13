import React, { useState, useRef } from 'react';
import { editMetadataService } from '../../services/editMetadataService';
import type {
  EditMetadataRequest,
  EditMetadataResponse,
  MetadataCheckResponse,
  MetadataTemplate,
} from '../../types/editMetadata';
import { Button } from '../DocumentService/ui/button';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Download,
  Edit3,
  FileText,
  Settings,
  RotateCcw,
  CheckCircle,
  Info,
  Save,
  Database,
  FileSearch,
  Zap,
  Target,
  Briefcase,
  GraduationCap,
  Scale,
  Plus,
  Trash2,
  Calendar,
  User,
  Tag,
  Wrench,
  Shield,
  XCircle,
  AlertCircle
} from 'lucide-react';

const EditMetadata: React.FC = () => {
  const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingMetadata, setIsCheckingMetadata] = useState(false);
  const [metadataCheck, setMetadataCheck] = useState<MetadataCheckResponse | null>(null);
  const [result, setResult] = useState<EditMetadataResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'custom' | 'bulk'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<MetadataTemplate | null>(null);
  const [metadataFields, setMetadataFields] = useState<Record<string, string>>({});
  const [customProperties, setCustomProperties] = useState<Record<string, string>>({});
  const [newCustomProperty, setNewCustomProperty] = useState({ key: '', value: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templates = editMetadataService.getMetadataTemplates();
  const fields = editMetadataService.getMetadataFields();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      setMetadataCheck(null);
      setSuccess(null);
      // Automatically check metadata
      checkMetadata(file);
    } else if (file) {
      setError('Please select a valid PDF file');
    }
  };

  const checkMetadata = async (file: File) => {
    setIsCheckingMetadata(true);
    setError(null);

    try {
      const check = await editMetadataService.getCurrentMetadata(file);
      setMetadataCheck(check);

      // Pre-populate fields with current metadata
      if (check.metadataInfo.currentMetadata) {
        setMetadataFields(check.metadataInfo.currentMetadata);
      }
    } catch (err: any) {
      console.error('Metadata check error:', err);
      setError(`Failed to check metadata: ${err.message}`);
    } finally {
      setIsCheckingMetadata(false);
    }
  };

  const handleTemplateSelect = (template: MetadataTemplate) => {
    setSelectedTemplate(template);
    const { customProperties, ...metadataFields } = template.metadata;
    setMetadataFields(metadataFields);
    setCustomProperties(customProperties || {});
    setActiveTab('templates');
  };

  const handleFieldChange = (key: string, value: string) => {
    setMetadataFields(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCustomPropertyAdd = () => {
    if (newCustomProperty.key && newCustomProperty.value) {
      setCustomProperties(prev => ({
        ...prev,
        [newCustomProperty.key]: newCustomProperty.value
      }));
      setNewCustomProperty({ key: '', value: '' });
    }
  };

  const handleCustomPropertyRemove = (key: string) => {
    setCustomProperties(prev => {
      const newProps = { ...prev };
      delete newProps[key];
      return newProps;
    });
  };

  const handleEditMetadata = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file');
      return;
    }

    const request: EditMetadataRequest = {
      file: selectedFile,
      ...metadataFields,
      customProperties: Object.keys(customProperties).length > 0 ? customProperties : undefined
    };

    const validation = editMetadataService.validateRequest(request);
    if (!validation.valid) {
      setError(validation.message || 'Validation failed');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await editMetadataService.editMetadata(request);
      setResult(response);
      setSuccess('Metadata edited successfully!');
    } catch (err: any) {
      console.error('Metadata editing error:', err);
      setError(`Failed to edit metadata: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (result?.downloadUrl) {
      try {
        await editMetadataService.downloadFile(result.downloadUrl, result.filename);
      } catch (err: any) {
        console.error('Download error:', err);
        setError(`Failed to download file: ${err.message}`);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setSuccess(null);
    setMetadataCheck(null);
    setActiveTab('templates');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setSuccess(null);
    setMetadataCheck(null);
    setSelectedTemplate(null);
    setMetadataFields({});
    setCustomProperties({});
    setNewCustomProperty({ key: '', value: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getTemplateIcon = (template: MetadataTemplate) => {
    switch (template.icon) {
      case 'FileText':
        return <FileText className="w-5 h-5" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5" />;
      case 'Scale':
        return <Scale className="w-5 h-5" />;
      case 'Settings':
        return <Settings className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'professional':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'academic':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'legal':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'custom':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFieldIcon = (key: string) => {
    switch (key) {
      case 'title':
        return <FileText className="w-4 h-4" />;
      case 'author':
        return <User className="w-4 h-4" />;
      case 'subject':
        return <Tag className="w-4 h-4" />;
      case 'keywords':
        return <Tag className="w-4 h-4" />;
      case 'creator':
        return <Wrench className="w-4 h-4" />;
      case 'producer':
        return <Wrench className="w-4 h-4" />;
      case 'creationDate':
      case 'modificationDate':
        return <Calendar className="w-4 h-4" />;
      case 'trapped':
        return <Shield className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="mx-auto p-2 space-y-6">
      {/* Header */}
      <div className="bg-background shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              to={`/pdf-tools${location.search}`}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Edit Metadata</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Modify document properties and metadata to customize your PDF documents
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && !result && (
        <div className="mb-6 bg-success/10 border border-success rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-success mr-2" />
            <p className="text-success">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-destructive/10 border border-destructive rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-destructive mr-2" />
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      )}

      {!result && (
      <div className={`grid grid-cols-1 gap-6 ${selectedFile ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
        {/* Left Panel - File Upload and Configuration */}
        <div className={`space-y-6 ${selectedFile ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
          {/* File Upload Section */}
          <div className="bg-background rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Upload PDF File
              </h2>
              {selectedFile && (
                <button
                  onClick={removeFile}
                  className="text-destructive hover:text-destructive/80 font-medium text-sm flex items-center space-x-1"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Remove File</span>
                </button>
              )}
            </div>

            {!selectedFile ? (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center space-y-2 text-muted-foreground hover:text-primary mx-auto"
                >
                  <Upload className="w-12 h-12" />
                  <span className="text-lg font-medium">Click to upload PDF</span>
                  <span className="text-sm text-muted-foreground">Maximum file size: 2MB</span>
                </button>
              </div>
            ) : (
              <div className="bg-success/10 border border-success rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <h4 className="font-medium text-success">{selectedFile.name}</h4>
                      <p className="text-sm text-success">
                        Size: {editMetadataService.formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="text-destructive hover:text-destructive/80 p-1 rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
          {!selectedFile && (
            <div className="bg-background rounded-xl shadow-lg p-10 border-l-4 border-primary">
              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Template System
              </h3>
                  <p className="text-sm text-muted-foreground">
                Use our predefined templates to quickly apply professional metadata standards, or create custom templates
                for your specific needs. Templates ensure consistency across your document collection.
              </p>
            </div>
          )}

          {/* Metadata Check Result */}
          {isCheckingMetadata && (
              <div className="bg-background rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 text-primary">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Analyzing PDF metadata...</span>
              </div>
            </div>
          )}

          {metadataCheck && (
            <div className="bg-background rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <FileSearch className="w-5 h-5 mr-2" />
                Current Metadata
              </h3>

              <div className="space-y-3">
                {editMetadataService.getMetadataSummary(metadataCheck.metadataInfo).map((summary, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{summary}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configuration Tabs */}
          {selectedFile && (
            <div className="bg-background rounded-xl shadow-lg p-6">
              <div className="flex justify-center mb-6">
                <div className="flex space-x-1 bg-background rounded-lg p-1 shadow-sm border">
                  <button
                    onClick={() => setActiveTab('templates')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${activeTab === 'templates'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    <Target className="w-4 h-4" />
                    <span>Templates</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('custom')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${activeTab === 'custom'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Custom</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('bulk')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${activeTab === 'bulk'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Bulk Edit</span>
                  </button>
                </div>
              </div>

              {/* Templates Tab */}
              {activeTab === 'templates' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${selectedTemplate?.id === template.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary'
                          }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                            <div className={`p-2 rounded-lg ${selectedTemplate?.id === template.id ? 'bg-primary/10' : 'bg-muted'
                            }`}>
                            {getTemplateIcon(template)}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{template.name}</div>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full border ${getCategoryColor(template.category)}`}>
                              {template.category}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Tab */}
              {activeTab === 'custom' && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <Edit3 className="w-12 h-12 mx-auto mb-2 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Custom Metadata Fields</h3>
                    <p className="text-sm text-muted-foreground">Edit individual metadata fields for your document</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                          {getFieldIcon(field.key)}
                          <span>{field.label}</span>
                          {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            value={metadataFields[field.key] || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            rows={3}
                          />
                        ) : field.type === 'select' ? (
                          <select
                            value={metadataFields[field.key] || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="">Select {field.label}</option>
                            {field.options?.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            value={metadataFields[field.key] || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        )}
                        {field.description && (
                          <p className="text-xs text-muted-foreground">{field.description}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Custom Properties */}
                  <div className="space-y-4">
                      <h4 className="text-md font-semibold text-foreground border-b pb-2">Custom Properties</h4>

                    <div className="space-y-3">
                      {Object.entries(customProperties).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2 p-3 border border-border rounded-lg">
                          <span className="text-sm font-medium text-foreground min-w-0 flex-1">{key}:</span>
                          <span className="text-sm text-muted-foreground min-w-0 flex-1">{value}</span>
                          <button
                            onClick={() => handleCustomPropertyRemove(key)}
                            className="p-1 text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newCustomProperty.key}
                        onChange={(e) => setNewCustomProperty(prev => ({ ...prev, key: e.target.value }))}
                        placeholder="Property name"
                        className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={newCustomProperty.value}
                        onChange={(e) => setNewCustomProperty(prev => ({ ...prev, value: e.target.value }))}
                        placeholder="Property value"
                        className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <button
                        onClick={handleCustomPropertyAdd}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80 flex items-center space-x-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk Edit Tab */}
              {activeTab === 'bulk' && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <Zap className="w-12 h-12 mx-auto mb-2 text-warning" />
                    <h3 className="text-lg font-semibold text-foreground">Bulk Metadata Editing</h3>
                    <p className="text-sm text-muted-foreground">Apply metadata changes to multiple fields at once</p>
                  </div>

                  <div className="bg-warning/10 border border-warning rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-warning">
                      <Info className="w-5 h-5" />
                      <span className="font-medium">Bulk editing features coming soon!</span>
                    </div>
                    <p className="text-sm text-warning mt-1">
                      This feature will allow you to apply metadata templates to multiple documents and manage bulk operations.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 mt-6">
                <Button
                  onClick={handleEditMetadata}
                  disabled={isProcessing || !selectedFile}
                  className="flex items-center space-x-2 bg-primary hover:bg-primary/80"
                >
                  <Save className="w-4 h-4" />
                  <span>{isProcessing ? 'Processing...' : 'Edit Metadata'}</span>
                </Button>

                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Information and Help - Only show when no file is selected */}
        {!selectedFile && (
          <div className="space-y-6">
            {/* Help Information */}
            <div className="bg-background rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2" />
                How It Works
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>1. Upload:</strong> Select your PDF file for metadata editing</p>
                <p><strong>2. Analyze:</strong> We'll read the current metadata</p>
                <p><strong>3. Configure:</strong> Choose templates or customize fields</p>
                <p><strong>4. Process:</strong> Apply your metadata changes</p>
                <p><strong>5. Download:</strong> Get your updated PDF</p>
              </div>
            </div>

            {/* Metadata Benefits */}
            <div className="bg-background rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Metadata Benefits
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Improve document organization and searchability</p>
                <p>• Add professional branding and information</p>
                <p>• Enhance document compliance and tracking</p>
                <p>• Customize properties for specific workflows</p>
                <p>• Maintain consistent document standards</p>
              </div>
            </div>


          </div>
        )}
      </div>
      )}

      {/* Results Section - Show when file is selected and metadata editing is complete (success-only view) */}
      {selectedFile && result && (
            <div className="bg-background rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="w-6 h-6 text-success" />
              <h3 className="text-lg font-semibold text-success">Metadata Edited Successfully!</h3>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-foreground">File:</span>
                <span className="text-sm text-muted-foreground">{result.filename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-foreground">Pages:</span>
                <span className="text-sm text-muted-foreground">{result.totalPages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-foreground">Size:</span>
                <span className="text-sm text-muted-foreground">{editMetadataService.formatFileSize(result.fileSize)}</span>
              </div>
            </div>

            <Button
              onClick={handleDownload}
              className="w-full bg-success hover:bg-success/80 text-primary-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Updated PDF
            </Button>
          </div>
        )}

      {/* Processing Overlay */}
      {
        isProcessing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
                <div className="bg-background rounded-lg p-6 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">Editing metadata...</span>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default EditMetadata;
