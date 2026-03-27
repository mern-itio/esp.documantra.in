import React from 'react';
import Lottie from 'lottie-react';
import signatureLoader from '../../assets/lottie/signature.json';

const SignatureIcon = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 120 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M8 28C14 18 18 14 22 14C26 14 26 21 30 21C34 21 35 10 41 10C47 10 45 29 52 29C58 29 57 16 64 16C71 16 68 31 77 31C84 31 84 21 91 21C98 21 102 25 112 14"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M76 33H110"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
);

const DocumentIcon = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 64 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M14 4H38L54 20V70C54 73.3137 51.3137 76 48 76H14C10.6863 76 8 73.3137 8 70V10C8 6.68629 10.6863 4 14 4Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M38 4V16C38 18.2091 39.7909 20 42 20H54"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M18 30H44"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M18 40H44"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.8"
    />
    <path
      d="M18 50H36"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
);

const bgItems = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  type: i % 2 === 0 ? 'signature' : 'document',
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
  rotate: `${Math.random() * 30 - 15}deg`,
  scale: 0.7 + Math.random() * 0.6,
  delay: `${Math.random() * 4}s`,
  duration: `${6 + Math.random() * 4}s`,
}));

const Loader: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-blue-50 flex items-center justify-center">
      {/* Background SVG pattern */}
      <div className="absolute inset-0 pointer-events-none">
        {bgItems.map((item) => (
          <div
            key={item.id}
            className="absolute text-gray-400/20 animate-float"
            style={{
              top: item.top,
              left: item.left,
              transform: `translate(-50%, -50%) rotate(${item.rotate}) scale(${item.scale})`,
              animationDelay: item.delay,
              animationDuration: item.duration,
            }}
          >
            {item.type === 'signature' ? (
              <SignatureIcon className="w-16 sm:w-20" />
            ) : (
              <DocumentIcon className="w-10 sm:w-12" />
            )}
          </div>
        ))}
      </div>

      {/* Main loader */}
      <div className="relative z-10 w-40 sm:w-52">
        <Lottie animationData={signatureLoader} loop autoPlay />
      </div>

      <style>
        {`
          @keyframes float {
            0%, 100% {
              transform: translate(-50%, -50%) translateY(0) rotate(0deg);
            }
            50% {
              transform: translate(-50%, -50%) translateY(-10px) rotate(2deg);
            }
          }

          .animate-float {
            animation-name: float;
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
          }
        `}
      </style>
    </div>
  );
};

export default Loader;