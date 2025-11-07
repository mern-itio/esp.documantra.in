import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { templateServiceApi } from '../../services/apiHelper';

interface FormField {
  formId?: string;
  _id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormPreviewProps {
  fields: FormField[];
}

export const FormPreview: React.FC<FormPreviewProps> = ({ fields }) => {
  const isEmbedded = window.self !== window.top;
  const [formData, setFormData] = useState<Record<string, any>>({});
  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await templateServiceApi.post('/public/template/insert-form-data', {
        formId: fields[0].formId,
        data: formData
      });
      if (response) {
        console.log(response);
        alert(response);
      }
    } catch (err) {
      console.log(`Error: ${err}`);
    }
    console.log('Form Data:', formData);
    alert('Form submitted! Check console for data.');
  };

  if (fields.length === 0) {
    return (
      <div>
        <div className="text-center text-gray-400 mt-16">
          <p className="text-lg">No fields to preview</p>
          {!isEmbedded && (
            <p className="text-sm">Add some fields to see the form preview</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-sm shadow-sm border border-gray-200 p-8">
        {!isEmbedded && (
          <div className="mb-8">
            <h2 className="text-2xl text-gray-900 mb-2">Form Preview</h2>
            <p className="text-gray-600">This is how your form will appear to users</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map((field) => (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === 'text' || field.type === 'email' || field.type === 'phone' ? (
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  required={field.required}
                  value={formData[field._id] || ''}
                  onChange={(e) => handleInputChange(field._id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-xs"

                />
              ) : field.type === 'textarea' ? (
                <textarea
                  placeholder={field.placeholder}
                  required={field.required}
                  value={formData[field._id] || ''}
                  onChange={(e) => handleInputChange(field._id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              ) : field.type === 'date' ? (
                <input
                  type="date"
                  required={field.required}
                  value={formData[field._id] || ''}
                  onChange={(e) => handleInputChange(field._id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    required={field.required}
                    checked={formData[field._id] || false}
                    onChange={(e) => handleInputChange(field._id, e.target.checked)}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">I agree to the terms and conditions</span>
                </label>
              ) : field.type === 'radio' ? (
                <div className="space-y-2">
                  {field.options?.map((option, index) => (
                    <label key={index} className="flex items-center">
                      <input
                        type="radio"
                        name={field._id}
                        value={option}
                        required={field.required}
                        checked={formData[field._id] === option}
                        onChange={(e) => handleInputChange(field._id, e.target.value)}
                        className="mr-2 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              ) : field.type === 'select' ? (
                <select
                  required={field.required}
                  value={formData[field._id] || ''}
                  onChange={(e) => handleInputChange(field._id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select an option...</option>
                  {field.options?.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              ) : null}
            </div>
          ))}

          <div className="pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-medium" style={{
                backgroundColor: '#4D0080',
              }}
            >
              <Send className="w-5 h-5 mr-2" />
              Submit Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};