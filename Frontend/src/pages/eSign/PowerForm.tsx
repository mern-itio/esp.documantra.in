import React from 'react';
import { useParams } from 'react-router-dom';
import { PowerFormPreview } from '../../components/ESign/PowerFormPreview';

export const PowerForm: React.FC = () => {
  const { envelopeId } = useParams<{ formId: string; envelopeId: string }>();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background wrapper with additional decorative elements */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Additional gradient overlay for depth */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 0% 0%, rgba(124, 58, 237, 0.08) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)',
          }}
        ></div>
        
        {/* Decorative accent circles in corners */}
        <div 
          className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
            filter: 'blur(40px)',
            transform: 'translate(-30%, -30%)',
          }}
        ></div>
        
        <div 
          className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
            filter: 'blur(40px)',
            transform: 'translate(30%, 30%)',
          }}
        ></div>
      </div>
      
      <PowerFormPreview envelopeId={envelopeId} />
    </div>
  );
};
