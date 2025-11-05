import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TutorialModalProps {
  step: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ step, onNext, onPrev, onClose }) => {
  const navigate = useNavigate();

  const handleStepAction = () => {
    if (step === 1) {
      // Navigate to envelope creator on "Next" from step 1
      localStorage.setItem('tutorialState', JSON.stringify({
        inProgress: true,
        currentStep: 2
      }));
      navigate('/e-sign/create');
    } else {
      onNext();
    }
  };

  const getStepContent = () => {
    switch (step) {
      case 0:
        return {
          title: "Welcome to E-Signature!",
          content: "Digitally sign, send, and manage your documents with ease. Let's walk through the main features.",
          position: "center",
          showPrev: false,
          nextText: "Start Tutorial"
        };
      case 1:
        return {
          title: "Step 1: Create an Envelope",
          content: "Click 'Create Envelope' to start a new signing workflow. You can upload documents, set a subject, and add a message for recipients.",
          position: "top-24 right-8",
          showPrev: true,
          nextText: "Let's Create One"
        };
      case 2:
        return {
          title: "Step 2: Add Recipients",
          content: "Add one or more recipients and set their signing order. You can assign roles and add authentication if needed.",
          position: "top-1/3 left-8",
          showPrev: true,
          nextText: "Next"
        };
      case 3:
        return {
          title: "Step 3: Send for Signature",
          content: "Once your envelope is ready, click 'Send'. Recipients will receive an email to review and sign the document.",
          position: "bottom-1/3 right-8",
          showPrev: true,
          nextText: "Next"
        };
      case 4:
        return {
          title: "Step 4: Track Status",
          content: "Monitor the status of your envelopes in real time. See who has signed, who is pending, and send reminders if needed.",
          position: "top-1/2 left-8",
          showPrev: true,
          nextText: "Next"
        };
      case 5:
        return {
          title: "Step 5: Access Completed Documents",
          content: "Download or review signed documents anytime from your dashboard. All your completed envelopes are securely stored.",
          position: "bottom-24 right-8",
          showPrev: true,
          nextText: "Finish"
        };
      default:
        return null;
    }
  };

  const stepContent = getStepContent();
  if (!stepContent) return null;

  const { title, content, position, showPrev, nextText } = stepContent;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 backdrop-blur-[2px]"></div>
      <div className={`bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 max-w-lg w-full absolute transition-all duration-300 ease-in-out min-h-[340px] flex flex-col justify-between ${position}`}>
        <div className="relative">
          {step === 1 && (
            <div className="absolute -top-16 right-8 w-16 h-16">
              <div className="w-16 h-16 border-t-4 border-r-4 border-blue-500 rounded-tr-xl transform rotate-45 absolute"></div>
            </div>
          )}
          <h2 className="text-xl font-bold mb-4">{title}</h2>
          <p className="text-gray-700 mb-4">{content}</p>
        </div>
        <div className="flex-1" />
        <div className="flex justify-between gap-2 mt-6">
          {showPrev && (
            <button 
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors" 
              onClick={onPrev}
            >
              Back
            </button>
          )}
          <button 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ml-auto" 
            onClick={step === 5 ? onClose : handleStepAction}
          >
            {nextText}
          </button>
        </div>
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
          onClick={onClose}
          aria-label="Close tutorial"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default TutorialModal;