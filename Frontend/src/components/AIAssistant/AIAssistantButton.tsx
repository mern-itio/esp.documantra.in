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
          className="fixed bottom-44 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 hover:scale-110"
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

