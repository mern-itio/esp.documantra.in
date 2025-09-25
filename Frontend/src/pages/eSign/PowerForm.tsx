import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { eSignApi, templateServiceApi } from '../../services/apiHelper';
import { PowerFormPreview } from '../../components/ESign/PowerFormPreview';

interface FormField {
  formId?: string;
  _id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: any;
}

export const PowerForm: React.FC = () => {
  const { formId, envelopeId } = useParams<{ formId: string; envelopeId: string }>();
  console.log(formId);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formTitle, setFormTitle] = useState('Untitled Form');

  useEffect(() => {
    if (!formId) return;

    const fetchData = async () => {
      const isFrom = await getFormDetail(formId);
      if (isFrom === true && envelopeId) {
        const isEnvelope = await getEnvelope(formId, envelopeId);
        if (!isEnvelope) {
          setFormTitle("Wrong embed url or Envelope has been removed");
          setFormFields([]);
        }
      }
    };

    fetchData();
  }, [formId, envelopeId]);

  const getFormDetail = async (formId: string): Promise<boolean> => {
    try {
      const response = await templateServiceApi.get(`/public/template/get-form-details/${formId}`);
      if (response) {
        setFormFields(response.data.fields || []);
        setFormTitle(response.data.title || 'Untitled Form');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to load form:', err);
      return false;
    }
  };

  const getEnvelope = async (formId: string, envelopeId: string): Promise<boolean> => {
    try {
      const response = await eSignApi.get(`/api/e-sign/public/envelope/power/${formId}/${envelopeId}`);
      if (response) {
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to load envelope:', err);
      return false;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">{formTitle}</h1>
      <div className="bg-white p-6 rounded-2xl shadow">
        <PowerFormPreview fields={formFields} envelopeId={envelopeId} />
      </div>
    </div>
  );
};
