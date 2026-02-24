import React from 'react';
import Lottie from 'lottie-react';
import signatureLoader from '../../assets/lottie/signature.json';

const Loader: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-40 sm:w-52">
        <Lottie
          animationData={signatureLoader}
          loop
          autoPlay
        />
      </div>
    </div>
  );
};

export default Loader;
