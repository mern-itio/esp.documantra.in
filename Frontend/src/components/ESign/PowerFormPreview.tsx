import React, { useState, useEffect } from 'react';
import { Send, User, Mail, Sparkles, Shield, Smartphone, Fingerprint, CreditCard, X, CheckCircle, XCircle, RefreshCw, Lock } from 'lucide-react';
import { eSignApi } from '../../services/apiHelper';


interface FormPreviewProps {
  envelopeId?: String
}

type AuthMethodType = 'email' | 'mobile_otp' | 'biometric' | 'aadhar';

interface AuthMethod {
  type: AuthMethodType;
  name: string;
  icon: React.ReactNode;
}

export const PowerFormPreview: React.FC<FormPreviewProps> = ({ envelopeId }) => {
  const isEmbedded = window.self !== window.top;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Authentication states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMethods, setAuthMethods] = useState<AuthMethod[]>([]);
  const [currentAuthIndex, setCurrentAuthIndex] = useState(0);
  const [authStatus, setAuthStatus] = useState<'pending' | 'verifying' | 'success' | 'failed'>('pending');
  const [retryCount, setRetryCount] = useState(0);
  const [otpCode, setOtpCode] = useState('');
  const [signerResponseData, setSignerResponseData] = useState<any>(null);
  
  // Mock envelope details - In real app, this would come from API
  const mockEnvelopeAuthMethods: AuthMethodType[] = ['email', 'mobile_otp', 'biometric', 'aadhar'];

  // Initialize auth methods based on mock envelope data
  useEffect(() => {
    const methodConfig: Record<AuthMethodType, { name: string; icon: React.ReactNode }> = {
      email: { name: 'Email Authentication', icon: <Mail className="w-6 h-6" /> },
      mobile_otp: { name: 'Mobile OTP Authentication', icon: <Smartphone className="w-6 h-6" /> },
      biometric: { name: 'Biometric Authentication', icon: <Fingerprint className="w-6 h-6" /> },
      aadhar: { name: 'Aadhar Authentication', icon: <CreditCard className="w-6 h-6" /> },
    };
    
    const methods = mockEnvelopeAuthMethods.map(type => ({
      type,
      ...methodConfig[type],
    }));
    setAuthMethods(methods);
  }, []);

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try{
     const response =  await eSignApi.post('/api/e-sign/public/envelope/signer-initiate',{
      envelopeId:envelopeId,
      data:{
        name,
        email
      }
     });
     if(response){
        // after successful POST in PowerFormPreview.handleSubmit
        if (response?.status === 201 && response.data?.signerInitiate) {
            // Store response data for later use after authentication
            setSignerResponseData(response.data);
            setIsSubmitting(false);
            
            // Show authentication modal instead of opening URL directly
            const url = `/e-sign/signer/${envelopeId}/${response.data.signerInitiate._id}/${response.data?.cycleId}?self=1`;
            window.open(url, '_blank');
            // setShowAuthModal(true);
            // setCurrentAuthIndex(0);
            // setAuthStatus('pending');
            // setRetryCount(0);
            // setOtpCode('');
            return;
        }
     }
    } catch (err){
      console.log(`Error: ${err}`);
      setIsSubmitting(false);
    }
    alert('Form submitted! Check console for data.');
    setIsSubmitting(false);
  };

  // Handle authentication success
  const handleAuthSuccess = () => {
    setAuthStatus('success');
    
    // Move to next authentication method or complete
    setTimeout(() => {
      if (currentAuthIndex < authMethods.length - 1) {
        // Move to next method
        setCurrentAuthIndex(currentAuthIndex + 1);
        setAuthStatus('pending');
        setRetryCount(0);
        setOtpCode('');
      } else {
        // All authentication methods completed - proceed to signer URL
        if (signerResponseData?.signerInitiate) {
          const selfSignerId = signerResponseData.signerInitiate._id || signerResponseData.signerInitiate.id;
          const url = `/e-sign/signer/${envelopeId}/${selfSignerId}/${signerResponseData?.cycleId}?self=1`;
          window.open(url, '_blank');
          setShowAuthModal(false);
        }
      }
    }, 1500);
  };

    // Handle authentication failure
    const handleAuthFailure = () => {
      if (retryCount < 2) {
        // Show failure, allow retry
        setAuthStatus('failed');
        setTimeout(() => {
          setRetryCount(retryCount + 1);
          setAuthStatus('pending');
          setOtpCode('');
        }, 2000);
      } else {
        // Max retries reached
        setAuthStatus('failed');
        // Show error message
        alert('Authentication failed. Maximum retry attempts reached. Please try again later.');
        setShowAuthModal(false);
      }
    };

  // Dummy authentication simulation
  const handleAuthenticate = async () => {
    setAuthStatus('verifying');
    
    // Simulate authentication delay (2-3 seconds)
    setTimeout(() => {
      // Randomly simulate success (70% success rate) or failure (30% failure rate)
      // In real scenario, this would be an API call
      const shouldSucceed = Math.random() > 0.3;
      
      if (shouldSucceed) {
        handleAuthSuccess();
      } else {
        handleAuthFailure();
      }
    }, 2000);
  };

  // Handle OTP verification
  const handleOTPVerify = () => {
    if (otpCode.length === 6) {
      handleAuthenticate();
    } else {
      alert('Please enter a valid 6-digit OTP');
    }
  };

  // Get current authentication method
  const currentAuthMethod = authMethods[currentAuthIndex];


  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 animate-fade-in relative overflow-hidden">



      {/* Floating particles - Many visible circles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(25)].map((_, i) => {
          const size = Math.random() * 20 + 12; // 12-32px
          const colors = [
            'rgba(124, 58, 237, 0.4)', // Purple
            'rgba(59, 130, 246, 0.4)', // Blue
            'rgba(168, 85, 247, 0.4)', // Light Purple
            'rgba(139, 92, 246, 0.4)', // Indigo
            'rgba(249, 115, 22, 0.35)', // Orange
            'rgba(96, 165, 250, 0.4)', // Light Blue
          ];
          const color = colors[Math.floor(Math.random() * colors.length)];
          
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                boxShadow: `0 0 ${size * 1.5}px ${color}`,
                animation: `particle-float ${8 + Math.random() * 8}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
                filter: 'blur(1px)',
              }}
            ></div>
          );
        })}
        
        {/* Medium sized floating circles */}
        {[...Array(8)].map((_, i) => {
          const size = Math.random() * 40 + 30; // 30-70px
          const colors = [
            'rgba(124, 58, 237, 0.3)',
            'rgba(59, 130, 246, 0.3)',
            'rgba(168, 85, 247, 0.3)',
          ];
          const color = colors[Math.floor(Math.random() * colors.length)];
          
          return (
            <div
              key={`medium-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                boxShadow: `0 0 ${size * 2}px ${color}`,
                animation: `particle-float ${12 + Math.random() * 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 6}s`,
                filter: 'blur(2px)',
              }}
            ></div>
          );
        })}
      </div>





      {/* Custom animations */}
      <style>{`
        @keyframes gradient-flow {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes mesh-move {
          0%, 100% {
            transform: translate(0, 0);
          }
          33% {
            transform: translate(20px, -20px);
          }
          66% {
            transform: translate(-20px, 20px);
          }
        }
        @keyframes float-orb {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0.4;
          }
          25% {
            transform: translate(40px, -50px) scale(1.1) rotate(90deg);
            opacity: 0.6;
          }
          50% {
            transform: translate(-30px, -80px) scale(0.9) rotate(180deg);
            opacity: 0.5;
          }
          75% {
            transform: translate(-60px, -30px) scale(1.05) rotate(270deg);
            opacity: 0.55;
          }
        }
        @keyframes pulse-glow {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 0.35;
          }
        }
        @keyframes particle-float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          25% {
            transform: translate(50px, -60px) scale(1.3);
            opacity: 0.9;
          }
          50% {
            transform: translate(-40px, -80px) scale(0.9);
            opacity: 0.7;
          }
          75% {
            transform: translate(-60px, -30px) scale(1.2);
            opacity: 0.8;
          }
        }
        @keyframes light-ray {
          0%, 100% {
            opacity: 0.2;
            transform: scaleY(1);
          }
          50% {
            opacity: 0.5;
            transform: scaleY(1.2);
          }
        }
        @keyframes circle-pulse {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.15) rotate(180deg);
            opacity: 0.8;
          }
        }
        @keyframes circle-pulse-left {
          0%, 100% {
            transform: translateY(-50%) scale(1) rotate(0deg);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-50%) scale(1.15) rotate(180deg);
            opacity: 0.8;
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
            opacity: 0.4;
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
            opacity: 0.35;
          }
        }
        @keyframes slideInFromLeft {
          0% {
            transform: translateX(-30px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideInFromRight {
          0% {
            transform: translateX(30px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeInUp {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes float-icon {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(5deg);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        @keyframes shimmer-bg {
          0%, 100% {
            background-position: -200% -200%;
          }
          50% {
            background-position: 200% 200%;
          }
        }
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(38, 5, 89, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(38, 5, 89, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(38, 5, 89, 0);
          }
        }
        .animate-delay-100 {
          animation-delay: 0.1s;
        }
        .animate-delay-200 {
          animation-delay: 0.2s;
        }
        .animate-delay-300 {
          animation-delay: 0.3s;
        }
        .animate-delay-400 {
          animation-delay: 0.4s;
        }
        .animate-delay-500 {
          animation-delay: 0.5s;
        }
      `}</style>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 overflow-hidden animate-slide-up">
          {/* Header with animated gradient */}
          <div 
            className="bg-[#260559] px-8 pt-8 pb-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #260559 0%, #3d1d6e 50%, #260559 100%)',
              backgroundSize: '200% 200%',
              animation: 'gradient-shift 8s ease infinite',
            }}
          >
            {/* Animated shimmer overlay */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s infinite',
              }}
            ></div>
            
            {!isEmbedded && (
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"
                    style={{
                      animation: 'float-icon 3s ease-in-out infinite',
                    }}
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 
                    className="text-3xl font-bold text-white"
                    style={{
                      animation: 'fadeInUp 0.8s ease-out',
                    }}
                  >
                    Get Started
                  </h2>
                </div>
                <p 
                  className="text-white/90 text-lg"
                  style={{
                    animation: 'fadeInUp 0.8s ease-out 0.2s both',
                  }}
                >
                  Enter your details to begin the signing process
                </p>
              </div>
            )}
            {isEmbedded && (
              <div className="relative z-10 flex items-center gap-3">
                <div 
                  className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"
                  style={{
                    animation: 'float-icon 3s ease-in-out infinite',
                  }}
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Start Signature</h2>
              </div>
            )}
          </div>

          {/* Form content */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Name field */}
            <div 
              className="relative group"
              style={{
                animation: 'slideInFromLeft 0.6s ease-out 0.3s both',
              }}
            >
              <label 
                htmlFor="name" 
                  className={`block text-sm font-semibold text-gray-700 mb-2 transition-all duration-300 ${
                  focusedField === 'name' ? 'text-[#260559] scale-105' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className={`w-4 h-4 transition-colors duration-300 ${
                    focusedField === 'name' ? 'text-[#260559]' : 'text-gray-500'
                  }`} />
                  Full Name
                </div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className={`w-full px-4 py-3.5 pl-11 border-2 rounded-lg shadow-sm transition-all duration-300
                    ${focusedField === 'name' 
                      ? 'border-[#260559] ring-2 ring-[#260559]/20 bg-[#260559]/5 shadow-md' 
                      : 'border-gray-300 hover:border-[#260559]/50 bg-white hover:shadow-md'
                    }
                    focus:outline-none text-gray-900 placeholder-gray-400
                    focus:scale-[1.01] transform
                  `}
                  placeholder="Enter your full name"
                />
                <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                  focusedField === 'name' ? 'text-[#260559] scale-110' : 'text-gray-400 group-hover:text-[#260559]/70'
                }`} />
              </div>
            </div>

            {/* Email field */}
            <div 
              className="relative group"
              style={{
                animation: 'slideInFromRight 0.6s ease-out 0.5s both',
              }}
            >
              <label 
                htmlFor="email" 
                  className={`block text-sm font-semibold text-gray-700 mb-2 transition-all duration-300 ${
                  focusedField === 'email' ? 'text-[#260559] scale-105' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className={`w-4 h-4 transition-colors duration-300 ${
                    focusedField === 'email' ? 'text-[#260559]' : 'text-gray-500'
                  }`} />
                  Email Address
                </div>
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className={`w-full px-4 py-3.5 pl-11 border-2 rounded-lg shadow-sm transition-all duration-300
                    ${focusedField === 'email' 
                      ? 'border-[#260559] ring-2 ring-[#260559]/20 bg-[#260559]/5 shadow-md' 
                      : 'border-gray-300 hover:border-[#260559]/50 bg-white hover:shadow-md'
                    }
                    focus:outline-none text-gray-900 placeholder-gray-400
                    focus:scale-[1.01] transform
                  `}
                  placeholder="your.email@example.com"
                />
                <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                  focusedField === 'email' ? 'text-[#260559] scale-110' : 'text-gray-400 group-hover:text-[#260559]/70'
                }`} />
              </div>
            </div>

            {/* Submit button */}
            <div 
              className="pt-6"
              style={{
                animation: 'fadeInUp 0.6s ease-out 0.7s both',
              }}
            >
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full flex items-center justify-center gap-3 px-8 py-3 
                  bg-[#260559] hover:bg-[#260559]/90
                  disabled:bg-blue-400
                  text-white rounded-lg font-semibold text-base
                  shadow-md hover:shadow-lg hover:shadow-[#260559]/30
                  transform hover:scale-[1.02] active:scale-[0.98]
                  transition-all duration-300
                  overflow-hidden group
                  disabled:cursor-not-allowed"
              >
                {/* Animated gradient background */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(135deg, #260559 0%, #3d1d6e 50%, #260559 100%)',
                    backgroundSize: '200% 200%',
                    animation: 'gradient-shift 3s ease infinite',
                  }}
                ></div>
                
                {/* Shine effect on hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                
                {/* Pulsing ring effect */}
                <div 
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    boxShadow: '0 0 0 0 rgba(38, 5, 89, 0.7)',
                    animation: 'pulse-ring 2s infinite',
                  }}
                ></div>
                
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin w-5 h-5 text-white relative z-10"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span className="relative z-10">Processing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 transform group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300 relative z-10" />
                    <span className="relative z-10">Start Signature</span>
                  </>
                )}
              </button>
            </div>

            {/* Trust indicators */}
            <div 
              className="pt-4 flex items-center justify-center gap-6 text-xs text-gray-500"
              style={{
                animation: 'fadeInUp 0.6s ease-out 0.9s both',
              }}
            >
              <div 
                className="flex items-center gap-1.5 hover:text-accent-green transition-colors duration-300 cursor-default"
                style={{
                  animation: 'fadeInUp 0.4s ease-out 1s both',
                }}
              >
                <svg 
                  className="w-4 h-4 text-accent-green animate-pulse" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Secure</span>
              </div>
              <div 
                className="flex items-center gap-1.5 hover:text-accent-green transition-colors duration-300 cursor-default"
                style={{
                  animation: 'fadeInUp 0.4s ease-out 1.1s both',
                }}
              >
                <svg 
                  className="w-4 h-4 text-accent-green animate-pulse" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  style={{
                    animationDelay: '0.2s',
                  }}
                >
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Encrypted</span>
              </div>
              <div 
                className="flex items-center gap-1.5 hover:text-accent-green transition-colors duration-300 cursor-default"
                style={{
                  animation: 'fadeInUp 0.4s ease-out 1.2s both',
                }}
              >
                <svg 
                  className="w-4 h-4 text-accent-green animate-pulse" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  style={{
                    animationDelay: '0.4s',
                  }}
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                <span>Legal</span>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Authentication Modal */}
      {showAuthModal && currentAuthMethod && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="bg-[#260559] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Authentication Required</h3>
                  <p className="text-white/80 text-sm">
                    Step {currentAuthIndex + 1} of {authMethods.length}
                  </p>
                </div>
              </div>
              {authStatus !== 'verifying' && (
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Current Method Display */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-4 rounded-xl ${
                  authStatus === 'success' ? 'bg-green-100' :
                  authStatus === 'failed' ? 'bg-red-100' :
                  'bg-[#260559]/10'
                }`}>
                  <div className={`${
                    authStatus === 'success' ? 'text-green-600' :
                    authStatus === 'failed' ? 'text-red-600' :
                    'text-[#260559]'
                  }`}>
                    {currentAuthMethod.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{currentAuthMethod.name}</h4>
                  <p className="text-sm text-gray-600">Please complete authentication to proceed</p>
                </div>
              </div>

              {/* Retry Counter */}
              {retryCount > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">Remaining attempts:</span> {3 - retryCount} of 3
                  </p>
                </div>
              )}

              {/* Status Messages */}
              {authStatus === 'success' && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-green-800 font-medium">Authentication successful!</p>
                </div>
              )}

              {authStatus === 'failed' && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800 font-medium">
                    Authentication failed. {retryCount < 2 ? 'Please try again.' : 'Maximum attempts reached.'}
                  </p>
                </div>
              )}

              {/* Method-Specific UI */}
              {authStatus === 'pending' && (
                <div className="space-y-4">
                  {currentAuthMethod.type === 'email' && (
                    <div className="text-center py-4">
                      <Mail className="w-16 h-16 text-[#260559] mx-auto mb-4" />
                      <p className="text-gray-700 mb-2">
                        A verification email has been sent to <span className="font-semibold">{email}</span>
                      </p>
                      <p className="text-sm text-gray-600 mb-4">Please check your inbox and click the verification link.</p>
                      <button
                        onClick={handleAuthenticate}
                        className="w-full px-6 py-3 bg-[#260559] hover:bg-[#260559]/90 text-white rounded-lg font-semibold transition-colors"
                      >
                        I've Verified My Email
                      </button>
                    </div>
                  )}

                  {currentAuthMethod.type === 'mobile_otp' && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <Smartphone className="w-16 h-16 text-[#260559] mx-auto mb-4" />
                        <p className="text-gray-700 mb-2">Enter the 6-digit OTP sent to your mobile</p>
                        <p className="text-sm text-gray-600 mb-4">Check your SMS for the verification code</p>
                      </div>
                      <div>
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="000000"
                          className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border-2 border-gray-300 rounded-lg focus:border-[#260559] focus:ring-2 focus:ring-[#260559]/20 outline-none"
                        />
                      </div>
                      <button
                        onClick={handleOTPVerify}
                        disabled={otpCode.length !== 6}
                        className="w-full px-6 py-3 bg-[#260559] hover:bg-[#260559]/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                      >
                        Verify OTP
                      </button>
                    </div>
                  )}

                  {(currentAuthMethod.type === 'biometric' || currentAuthMethod.type === 'aadhar') && (
                    <div className="text-center py-4">
                      {currentAuthMethod.type === 'biometric' ? (
                        <Fingerprint className="w-16 h-16 text-[#260559] mx-auto mb-4" />
                      ) : (
                        <CreditCard className="w-16 h-16 text-[#260559] mx-auto mb-4" />
                      )}
                      <p className="text-gray-700 mb-4">
                        {currentAuthMethod.type === 'biometric' 
                          ? 'Click the button below to authenticate using your biometric data'
                          : 'Click the button below to authenticate using your Aadhar credentials'}
                      </p>
                      <div className="space-y-2">
                        <button
                          onClick={handleAuthenticate}
                          className="w-full px-6 py-3 bg-[#260559] hover:bg-[#260559]/90 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <Lock className="w-5 h-5" />
                          Authenticate
                        </button>
                        <button
                          onClick={handleAuthFailure}
                          className="w-full px-6 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors text-sm"
                        >
                          Simulate Failure
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Verifying State */}
              {authStatus === 'verifying' && (
                <div className="text-center py-8">
                  <RefreshCw className="w-16 h-16 text-[#260559] mx-auto mb-4 animate-spin" />
                  <p className="text-gray-700 font-medium">Verifying authentication...</p>
                  <p className="text-sm text-gray-600 mt-2">Please wait</p>
                </div>
              )}

              {/* Progress Indicator */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-semibold text-[#260559]">
                    {currentAuthIndex + 1} / {authMethods.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#260559] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((currentAuthIndex + 1) / authMethods.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};