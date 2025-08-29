import React, { useState } from 'react';
import { MessageCircle, Send, Bot, User, FileText, CheckCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  suggestions?: string[];
  templatePreview?: {
    name: string;
    fields: string[];
    sections: string[];
  };
}

interface ConversationalTemplateBuilderProps {
  onTemplateGenerated: (template: any) => void;
}

export const ConversationalTemplateBuilder: React.FC<ConversationalTemplateBuilderProps> = ({
  onTemplateGenerated
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'ai',
      content: "Hi! I'm your AI template assistant. I can help you create professional templates through conversation. What type of document template would you like to create today?",
      timestamp: new Date().toISOString(),
      suggestions: [
        "Employment contract for tech company",
        "Non-disclosure agreement for consultants",
        "Sales proposal for services",
        "Invoice template for freelancers"
      ]
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [templateInProgress, setTemplateInProgress] = useState<any>(null);

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate AI response based on conversation context
    const aiResponse = generateAIResponse(message, messages);
    setMessages(prev => [...prev, aiResponse]);
    setIsTyping(false);

    // Update template in progress if applicable
    if (aiResponse.templatePreview) {
      setTemplateInProgress(aiResponse.templatePreview);
    }
  };

  const generateAIResponse = (userMessage: string, conversationHistory: ChatMessage[]): ChatMessage => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Analyze user intent and generate appropriate response
    if (lowerMessage.includes('employment') || lowerMessage.includes('contract') || lowerMessage.includes('job')) {
      return {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: "Great! I'll help you create an employment contract template. Let me ask a few questions to customize it for your needs. What industry is this for, and what position level are you hiring for?",
        timestamp: new Date().toISOString(),
        suggestions: [
          "Technology industry, software engineer",
          "Healthcare, registered nurse",
          "Finance, financial analyst",
          "Marketing, marketing manager"
        ],
        templatePreview: {
          name: "Employment Contract Template",
          fields: ["employee_name", "position", "start_date", "salary"],
          sections: ["Employee Information", "Position Details", "Compensation"]
        }
      };
    } else if (lowerMessage.includes('nda') || lowerMessage.includes('disclosure') || lowerMessage.includes('confidential')) {
      return {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: "Perfect! I'll create a non-disclosure agreement template for you. To make it specific to your needs, what type of information will be shared? Is this for employees, contractors, or business partners?",
        timestamp: new Date().toISOString(),
        suggestions: [
          "Employee access to proprietary information",
          "Contractor working on sensitive projects",
          "Business partnership discussions",
          "Investor due diligence process"
        ],
        templatePreview: {
          name: "Non-Disclosure Agreement",
          fields: ["disclosing_party", "receiving_party", "effective_date"],
          sections: ["Parties", "Confidential Information", "Obligations"]
        }
      };
    } else if (lowerMessage.includes('sales') || lowerMessage.includes('proposal') || lowerMessage.includes('quote')) {
      return {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: "Excellent! I'll help you create a sales proposal template. What type of services or products will you be proposing? This will help me include the right sections and pricing structures.",
        timestamp: new Date().toISOString(),
        suggestions: [
          "Consulting services with hourly rates",
          "Software development project",
          "Marketing campaign proposal",
          "Product sales with volume discounts"
        ],
        templatePreview: {
          name: "Sales Proposal Template",
          fields: ["client_name", "project_description", "total_cost"],
          sections: ["Client Information", "Project Overview", "Pricing"]
        }
      };
    } else if (lowerMessage.includes('technology') || lowerMessage.includes('software') || lowerMessage.includes('tech')) {
      return {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: "Great choice! For a technology industry employment contract, I'll include modern clauses for remote work, intellectual property, and equity compensation. What specific role is this for, and do you need any special provisions?",
        timestamp: new Date().toISOString(),
        suggestions: [
          "Software Engineer with equity options",
          "Product Manager with remote work",
          "Data Scientist with IP agreements",
          "DevOps Engineer with on-call provisions"
        ],
        templatePreview: {
          name: "Tech Employment Contract",
          fields: ["employee_name", "position", "salary", "equity_percentage", "remote_days"],
          sections: ["Employee Info", "Position Details", "Compensation", "Benefits", "IP Rights", "Remote Work Policy"]
        }
      };
    } else if (conversationHistory.length > 2) {
      // Continue building the template based on previous context
      return {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: "Perfect! Based on your requirements, I'm refining the template. Would you like me to add any specific clauses or modify any sections? I can also generate the complete template now if you're satisfied with the structure.",
        timestamp: new Date().toISOString(),
        suggestions: [
          "Add termination clause",
          "Include benefits section",
          "Add confidentiality provisions",
          "Generate the complete template"
        ]
      };
    } else {
      return {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: "I understand you'd like help with that. Could you provide more details about the type of template you need? For example, is it for legal documents, business contracts, forms, or something else?",
        timestamp: new Date().toISOString(),
        suggestions: [
          "Legal document template",
          "Business contract template",
          "Form or survey template",
          "Invoice or billing template"
        ]
      };
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const generateCompleteTemplate = () => {
    if (templateInProgress) {
      const completeTemplate = {
        id: `conv_template_${Date.now()}`,
        name: templateInProgress.name,
        type: 'conversational',
        structure: {
          sections: templateInProgress.sections.map((section: string) => ({
            name: section,
            fields: templateInProgress.fields.filter((field: string) => 
              field.includes(section.toLowerCase().replace(' ', '_')) || 
              ['name', 'date', 'signature'].some(common => field.includes(common))
            )
          }))
        },
        fields: templateInProgress.fields,
        aiGenerated: true,
        conversationHistory: messages
      };

      onTemplateGenerated(completeTemplate);

      // Add completion message
      const completionMessage: ChatMessage = {
        id: `ai_completion_${Date.now()}`,
        type: 'ai',
        content: `Perfect! I've generated your ${templateInProgress.name} with all the sections and fields we discussed. The template is now ready for use and can be further customized in the template editor.`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, completionMessage]);
      setTemplateInProgress(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Conversational Template Builder</h2>
          <p className="text-sm text-gray-600">Create templates through natural conversation with AI</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto mb-4 border border-gray-200 rounded-lg p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.type === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-900'
            }`}>
              <div className="flex items-center mb-1">
                {message.type === 'ai' ? (
                  <Bot className="w-4 h-4 mr-2 text-blue-600" />
                ) : (
                  <User className="w-4 h-4 mr-2 text-white" />
                )}
                <span className="text-xs opacity-75">
                  {message.type === 'ai' ? 'AI Assistant' : 'You'}
                </span>
              </div>
              <p className="text-sm">{message.content}</p>
              
              {/* Template Preview */}
              {message.templatePreview && (
                <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                  <div className="flex items-center mb-2">
                    <FileText className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">{message.templatePreview.name}</span>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    Sections: {message.templatePreview.sections.join(', ')}
                  </div>
                  <div className="text-xs text-gray-600">
                    Fields: {message.templatePreview.fields.join(', ')}
                  </div>
                </div>
              )}
              
              {/* Suggestions */}
              {message.suggestions && (
                <div className="mt-3 space-y-1">
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="block w-full text-left px-3 py-2 text-xs bg-white bg-opacity-20 hover:bg-opacity-30 rounded border border-white border-opacity-30 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center">
                <Bot className="w-4 h-4 mr-2 text-blue-600" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Template Progress */}
      {templateInProgress && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">Template in Progress</h3>
              <p className="text-sm text-blue-700">{templateInProgress.name}</p>
              <p className="text-xs text-blue-600 mt-1">
                {templateInProgress.sections.length} sections, {templateInProgress.fields.length} fields
              </p>
            </div>
            <button
              onClick={generateCompleteTemplate}
              className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Generate Template
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="flex items-center space-x-3">
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage(currentMessage)}
          placeholder="Describe what you need or ask a question..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isTyping}
        />
        <button
          onClick={() => sendMessage(currentMessage)}
          disabled={!currentMessage.trim() || isTyping}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => handleSuggestionClick("Create a simple employment contract")}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full"
        >
          Employment Contract
        </button>
        <button
          onClick={() => handleSuggestionClick("Generate an NDA template")}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full"
        >
          NDA Template
        </button>
        <button
          onClick={() => handleSuggestionClick("Build a sales proposal")}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full"
        >
          Sales Proposal
        </button>
        <button
          onClick={() => handleSuggestionClick("Create an invoice template")}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full"
        >
          Invoice Template
        </button>
      </div>
    </div>
  );
};