import React from 'react';
import Lottie from 'lottie-react';
import signatureLoader from '../../assets/lottie/signature.json';
import DocumentSignatureBackground from './DocumentSignatureBackground';

const Loader: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center">
      <DocumentSignatureBackground />

      {/* Main loader */}
      <div className="relative z-10 w-40 sm:w-52">
        <Lottie animationData={signatureLoader} loop autoPlay />
      </div>
    </div>
  );
};

export default Loader;
