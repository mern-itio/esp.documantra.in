import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Eye, 
  Settings, 
  FileText,
  ArrowLeft,
  Palette,
  Type,
  Upload
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { pdfApi } from '../../services/apiHelper';

interface FormField {
  id: string;
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  value?: string | number | boolean;
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  category: string;
}

interface FieldType {
  type: string;
  name: string;
  description: string;
  properties: string[];
}

const CreatePdfFormPage: React.FC = () => {
  const [formName, setFormName] = useState('Untitled Form');
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [fieldTypes, setFieldTypes] = useState<FieldType[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [formSettings, setFormSettings] = useState({
    pageSize: 'A4',
    orientation: 'portrait',
    primaryColor: '#2563eb',
    secondaryColor: '#6b7280'
  });

  useEffect(() => {
    fetchTemplates();
    fetchFieldTypes();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await pdfApi.get('/pdf-create-form/templates');
      if (response.status === 200) {
        const data = response.data;
        if (data.success) {
          setTemplates(data.templates);
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchFieldTypes = async () => {
    try {
      const response = await pdfApi.get('/pdf-create-form/field-types');
      if (response.status === 200) {
        const data = response.data;
        if (data.success) {
          setFieldTypes(data.fieldTypes);
        }
      }
    } catch (error) {
      console.error('Error fetching field types:', error);
    }
  };

  const addField = (type: string) => {
    const newField: FormField = {
      id: Date.now().toString(),
      name: `field_${formFields.length + 1}`,
      type,
      label: `Field ${formFields.length + 1}`,
      required: false,
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined
    };
    setFormFields([...formFields, newField]);
    setSelectedField(newField);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFormFields(formFields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
    
    // Update selectedField if it's the one being edited
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates });
    }
  };

  const removeField = (fieldId: string) => {
    setFormFields(formFields.filter(field => field.id !== fieldId));
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  const duplicateField = (field: FormField) => {
    const newField = {
      ...field,
      id: Date.now().toString(),
      name: `${field.name}_copy`,
      label: `${field.label} (Copy)`
    };
    setFormFields([...formFields, newField]);
  };

  const loadTemplate = (template: FormTemplate) => {
    setFormName(template.name);
    setFormFields(template.fields.map(field => ({
      ...field,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    })));
    toast.success(`Template "${template.name}" loaded successfully`);
  };

  const createForm = async () => {
    if (formFields.length === 0) {
      toast.error('Please add at least one field to the form');
      return;
    }

    setIsCreating(true);
    try {
      const response = await pdfApi.post('/pdf-create-form/create', {
        formName,
        formFields,
        pageSize: formSettings.pageSize,
        orientation: formSettings.orientation,
        styling: {
          primaryColor: formSettings.primaryColor,
          secondaryColor: formSettings.secondaryColor
        }
      });

      if (response.status === 200) {
        const data = response.data;
        if (data.success) {
          toast.success('PDF form created successfully!');
          // Trigger download
          const link = document.createElement('a');
          link.href = `${pdfApi.defaults.baseURL}${data.form.downloadUrl}`;
          link.download = data.form.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          throw new Error(data.error || 'Failed to create form');
        }
      } else {
        throw new Error('Failed to create form');
      }
    } catch (error) {
      console.error('Error creating form:', error);
      toast.error('Failed to create PDF form. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const renderFieldEditor = () => {
    if (!selectedField) return null;

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Field Properties
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Field Name</label>
            <input
              type="text"
              value={selectedField.name}
              onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
            <input
              type="text"
              value={selectedField.label}
              onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Placeholder</label>
            <input
              type="text"
              value={selectedField.placeholder || ''}
              onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="required"
              checked={selectedField.required}
              onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="required" className="ml-2 text-sm text-gray-700">
              Required field
            </label>
          </div>

          {(selectedField.type === 'select' || selectedField.type === 'radio') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              {selectedField.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(selectedField.options || [])];
                      newOptions[index] = e.target.value;
                      updateField(selectedField.id, { options: newOptions });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => {
                      const newOptions = selectedField.options?.filter((_, i) => i !== index);
                      updateField(selectedField.id, { options: newOptions });
                    }}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newOptions = [...(selectedField.options || []), `Option ${(selectedField.options?.length || 0) + 1}`];
                  updateField(selectedField.id, { options: newOptions });
                }}
                className="mt-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add Option
              </button>
            </div>
          )}

          <div className="pt-4 border-t">
            <button
              onClick={() => duplicateField(selectedField)}
              className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Duplicate Field
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFieldPreview = (field: FormField) => {
    const baseClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <input
            type={field.type}
            placeholder={field.placeholder || field.label}
            className={baseClasses}
            disabled
          />
        );
      
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder || field.label}
            rows={3}
            className={baseClasses}
            disabled
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            placeholder={field.placeholder || field.label}
            className={baseClasses}
            disabled
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            className={baseClasses}
            disabled
          />
        );
      
      case 'select':
        return (
          <select className={baseClasses} disabled>
            <option>{field.placeholder || 'Select an option'}</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="radio"
                  name={field.name}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  disabled
                />
                <label className="ml-2 text-sm text-gray-700">{option}</label>
              </div>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled
            />
            <label className="ml-2 text-sm text-gray-700">{field.label}</label>
          </div>
        );
      
      case 'file':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Click to upload file</p>
          </div>
        );
      
      default:
        return <div className="p-2 bg-gray-100 rounded text-gray-500">Unknown field type</div>;
    }
  };

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
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
              <h1 className="text-3xl font-bold text-gray-900">Create PDF Form</h1>
              <p className="mt-2 text-sm text-gray-600">
                Design interactive fillable forms with advanced field validation
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Field Types */}
          <div className="lg:col-span-1 space-y-6">
            {/* Form Settings */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Form Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Form Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Page Size</label>
                  <select
                    value={formSettings.pageSize}
                    onChange={(e) => setFormSettings({ ...formSettings, pageSize: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                    <option value="Letter">Letter</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Orientation</label>
                  <select
                    value={formSettings.orientation}
                    onChange={(e) => setFormSettings({ ...formSettings, orientation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Field Types */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Type className="w-5 h-5 mr-2" />
                Add Fields
              </h3>
              
              <div className="space-y-2">
                {fieldTypes.map((fieldType) => (
                  <button
                    key={fieldType.type}
                    onClick={() => addField(fieldType.type)}
                    className="w-full text-left p-3 text-sm border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{fieldType.name}</div>
                    <div className="text-xs text-gray-500">{fieldType.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Templates */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Templates
              </h3>
              
              <div className="space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => loadTemplate(template)}
                    className="w-full text-left p-3 text-sm border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{template.name}</div>
                    <div className="text-xs text-gray-500">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center - Form Designer */}
          <div className="lg:col-span-2 space-y-6">
            {/* Form Preview */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Form Preview
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                  <button
                    onClick={createForm}
                    disabled={isCreating || formFields.length === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Create PDF
                      </>
                    )}
                  </button>
                </div>
              </div>

              {showPreview && (
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <h2 className="text-2xl font-bold text-center mb-6">{formName}</h2>
                  <div className="space-y-4">
                    {formFields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderFieldPreview(field)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Field List */}
              <div className="mt-6">
                <h4 className="text-md font-medium mb-3">Form Fields ({formFields.length})</h4>
                <div className="space-y-2">
                  {formFields.map((field, index) => (
                    <div
                      key={field.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedField?.id === field.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedField(field)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900">
                            {index + 1}. {field.label}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {field.type}
                          </span>
                          {field.required && (
                            <span className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeField(field.id);
                          }}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Field Editor */}
          <div className="lg:col-span-1">
            {renderFieldEditor()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePdfFormPage;
