import React from 'react';
import { useParams } from 'react-router-dom';
import { PowerFormPreview } from '../../components/ESign/PowerFormPreview';

export const PowerForm: React.FC = () => {
  const { envelopeId } = useParams<{ formId: string; envelopeId: string }>();


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">Start Signature</h1>
      <div className="bg-white p-6 rounded-2xl shadow">
        <PowerFormPreview  envelopeId={envelopeId} />
      </div>
    </div>
  );
};
