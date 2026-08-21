import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import { useAuth } from '../AuthService/AuthContext';
import AIAssistantPanel from './AIAssistantPanel';

const AIAssistantButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  // Only show if user is authenticated
  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating Button - positioned above support chat widget */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-[5.75rem] right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#260559] to-purple-700 text-white shadow-lg shadow-[#260559]/25 transition-all duration-300 hover:scale-105 hover:shadow-xl md:right-6"
          title="Open AI Assistant"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {/* AI Assistant Panel */}
      <AIAssistantPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default AIAssistantButton;

