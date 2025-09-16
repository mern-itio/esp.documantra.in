import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Type, 
  Mail, 
  Phone, 
  Calendar, 
  CheckSquare, 
  Circle, 
  List, 
  FileText,
  Eye,
  Save,
  Settings,
  Trash2,
  GripVertical
} from 'lucide-react';
import { FormPreview } from '../../components/Template/FormPreview';
import { useParams } from 'react-router-dom';
import { templateServiceApi } from '../../services/apiHelper';

interface FormField {
  formId?:string;
  _id:string
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: any;
}

export const FormBuilder: React.FC = () => {
  const { id: formId } = useParams<{ id: string }>();
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [formTitle, setFormTitle] = useState('Untitled Form');

  const fieldTypes = [
    { type: 'text', label: 'Text Input', icon: Type },
    { type: 'email', label: 'Email', icon: Mail },
    { type: 'phone', label: 'Phone', icon: Phone },
    { type: 'date', label: 'Date', icon: Calendar },
    { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { type: 'radio', label: 'Radio Buttons', icon: Circle },
    { type: 'select', label: 'Dropdown', icon: List },
    { type: 'textarea', label: 'Text Area', icon: FileText }
  ];

  useEffect(() => {
  if (!formId) return;
  getFormDetail(formId);

}, [formId]);

const getFormDetail = async(formId:any)=>{
  try{
    const response = await templateServiceApi.get(`/api/template/get-form-details/${formId}`);
    if(response){
      console.log(response);
       setFormFields(response.data.fields || []);
       setFormTitle(response.data.title || 'Untitled Form');
    }
  }catch (err){
    console.log(err);
  }
}
const saveFormFields = async () => {
  try {
    await templateServiceApi.post('/api/template/add-fields', {
      formId,
      fields: formFields,
    });
    alert('Fields saved successfully');
  } catch (err) {
    console.error(err);
    alert('Failed to save fields');
  }
}; 
  const addField = (type: string) => {
    const newField: FormField = {
      _id: `field_${Date.now()}`,
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      placeholder: `Enter ${type}...`,
      required: false,
      options: type === 'radio' || type === 'select' ? ['Option 1', 'Option 2'] : undefined
    };
    setFormFields([...formFields, newField]);
    setSelectedField(newField);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFormFields(fields => 
      fields.map(field => 
        field._id === fieldId 
          ? { ...field, ...updates }
          : field
      )
    );
    if (selectedField?._id === fieldId) {
      setSelectedField({ ...selectedField, ...updates });
    }
  };

  const deleteField = (fieldId: string) => {
    setFormFields(fields => fields.filter(field => field._id !== fieldId));
    if (selectedField?._id === fieldId) {
      setSelectedField(null);
    }
  };

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const currentIndex = formFields.findIndex(field => field._id === fieldId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= formFields.length) return;

    const newFields = [...formFields];
    [newFields[currentIndex], newFields[newIndex]] = [newFields[newIndex], newFields[currentIndex]];
    setFormFields(newFields);
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar - Field Types */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Form Builder</h2>
          <p className="text-sm text-gray-600 mt-1">Drag and drop fields to create forms</p>
        </div>
        
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Form Fields</h3>
          <div className="space-y-2">
            {fieldTypes.map((fieldType) => {
              const Icon = fieldType.icon;
              return (
                <button
                  key={fieldType.type}
                  onClick={() => addField(fieldType.type)}
                  className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center mr-3">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{fieldType.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">{formTitle}</h1>
            <span className="text-sm text-gray-500">{formFields.length} fields</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center px-4 py-2 rounded-md font-medium ${
                showPreview
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Edit' : 'Preview'}
            </button>
            <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            onClick={saveFormFields}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Form
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Form Builder */}
          <div className={`${showPreview ? 'hidden' : 'flex-1'} p-6 overflow-auto`}>
            {formFields.length === 0 ? (
              <div className="text-center text-gray-400 mt-16">
                <Plus className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium mb-2">Start Building Your Form</h3>
                <p className="text-gray-500">Add fields from the sidebar to get started</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-4">
                {formFields.map((field, index) => (
                  <div
                    key={field._id}
                    className={`border-2 rounded-lg p-4 transition-all ${
                      selectedField?._id === field._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    onClick={() => setSelectedField(field)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        <span className="text-sm font-medium text-gray-700">{field.label}</span>
                        {field.required && <span className="text-red-500 text-sm">*</span>}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveField(field._id, 'up');
                          }}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          ↑
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveField(field._id, 'down');
                          }}
                          disabled={index === formFields.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          ↓
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteField(field._id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Field Preview */}
                    <div className="mt-2">
                      {field.type === 'text' || field.type === 'email' || field.type === 'phone' ? (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled
                        />
                      ) : field.type === 'textarea' ? (
                        <textarea
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          disabled
                        />
                      ) : field.type === 'date' ? (
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled
                        />
                      ) : field.type === 'checkbox' ? (
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" disabled />
                          <span className="text-gray-700">Checkbox option</span>
                        </label>
                      ) : field.type === 'radio' ? (
                        <div className="space-y-2">
                          {field.options?.map((option, optionIndex) => (
                            <label key={optionIndex} className="flex items-center">
                              <input type="radio" name={field._id} className="mr-2" disabled />
                              <span className="text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      ) : field.type === 'select' ? (
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled>
                          <option>Select an option...</option>
                          {field.options?.map((option, optionIndex) => (
                            <option key={optionIndex}>{option}</option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Preview */}
          {showPreview && (
            <div className="flex-1 p-6 overflow-auto">
              <FormPreview fields={formFields} />
            </div>
          )}

          {/* Properties Panel */}
          {!showPreview && (
            <div className="w-80 bg-white border-l border-gray-200 p-6">
              {selectedField ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Field Properties</h3>
                    <Settings className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                      <input
                        type="text"
                        value={selectedField.label}
                        onChange={(e) => updateField(selectedField._id, { label: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                      <input
                        type="text"
                        value={selectedField.placeholder || ''}
                        onChange={(e) => updateField(selectedField._id, { placeholder: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedField.required}
                          onChange={(e) => updateField(selectedField._id, { required: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Required field</span>
                      </label>
                    </div>
                    
                    {(selectedField.type === 'radio' || selectedField.type === 'select') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                        <div className="space-y-2">
                          {selectedField.options?.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...(selectedField.options || [])];
                                  newOptions[index] = e.target.value;
                                  updateField(selectedField._id, { options: newOptions });
                                }}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => {
                                  const newOptions = selectedField.options?.filter((_, i) => i !== index) || [];
                                  updateField(selectedField._id, { options: newOptions });
                                }}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newOptions = [...(selectedField.options || []), `Option ${(selectedField.options?.length || 0) + 1}`];
                              updateField(selectedField._id, { options: newOptions });
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            + Add Option
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 mt-8">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No Field Selected</p>
                  <p className="text-sm">Select a field to edit its properties</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};