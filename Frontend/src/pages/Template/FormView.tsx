import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FormPreview } from '../../components/Template/FormPreview';
import { templateServiceApi } from '../../services/apiHelper';

interface FormField {
  formId?:string;
  _id:string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: any;
}

export const FormView: React.FC = () => {
  const { id: formId } = useParams<{ id: string }>();
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formTitle, setFormTitle] = useState('Untitled Form');

  useEffect(() => {
    if (!formId) return;
    getFormDetail(formId);
  }, [formId]);

  const getFormDetail = async (formId: string) => {
    try {
      const response = await templateServiceApi.get(`/public/template/get-form-details/${formId}`);
      if (response) {
        console.log(response);
        setFormFields(response.data.fields || []);
        setFormTitle(response.data.title || 'Untitled Form');
      }
    } catch (err) {
      console.error('Failed to load form:', err);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">{formTitle}</h1>
      <div className="bg-white p-6 rounded-2xl shadow">
        <FormPreview fields={formFields} />
      </div>
    </div>
  );
};
