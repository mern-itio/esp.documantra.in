import React from 'react';
import { useParams } from 'react-router-dom';
import { PowerFormPreview } from '../../components/ESign/PowerFormPreview';

export const PowerForm: React.FC = () => {
  const { envelopeId } = useParams<{ formId: string; envelopeId: string }>();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <PowerFormPreview envelopeId={envelopeId} />
    </div>
  );
};
