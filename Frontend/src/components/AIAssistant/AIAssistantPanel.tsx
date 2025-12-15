import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Loader2, Search, Mail, FileEdit, Trash2, ExternalLink, Paperclip, XCircle } from 'lucide-react';
import { aiAssistantApiService }from '../../services/aiAssistantService';
import type { ConversationMessage, AICommandResponse } from '../../services/aiAssistantService';
import toast from 'react-hot-toast';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResultMessage extends ConversationMessage {
  searchResults?: any[];
}

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<SearchResultMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation history on mount and when panel opens
  useEffect(() => {
    if (isOpen) {
      // Force reload conversation history when panel opens
      loadConversationHistory();
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const loadConversationHistory = async () => {
    try {
      setIsInitializing(true);
      const response = await aiAssistantApiService.getConversationHistory();
      if (response.success && response.messages) {
        // Reconstruct messages with proper formatting
        const reconstructedMessages: SearchResultMessage[] = response.messages.map((msg: any) => {
          // Ensure content is always a string (not JSON or object)
          let content: string = '';
          
          // Handle different content types - prioritize _resultData for reconstruction
          if (msg.parameters?._resultData && msg.action) {
            // If we have _resultData, use it to format the content properly
            try {
              content = formatActionResult({
                action: msg.action,
                parameters: msg.parameters || {},
                result: msg.parameters._resultData
              } as AICommandResponse);
            } catch (e) {
              // If formatting fails, fall through to other methods
            }
          }
          
          // If content is still empty, try other methods
          if (!content) {
            if (typeof msg.content === 'string') {
              content = msg.content;
              
              // If content is a string that looks like JSON, try to parse and format it
              const trimmed = content.trim();
              if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && msg.action) {
                try {
                  const parsed = JSON.parse(content);
                  // If it's a valid JSON object, format it using formatActionResult
                  if (parsed && typeof parsed === 'object') {
                    const formatted = formatActionResult({
                      action: msg.action,
                      parameters: msg.parameters || {},
                      result: parsed
                    } as AICommandResponse);
                    content = formatted;
                  }
                } catch (e) {
                  // If parsing fails, keep the original string
                }
              }
            } else if (msg.content && typeof msg.content === 'object') {
              // If content is an object, try to format it
              try {
                content = formatActionResult({
                  action: msg.action,
                  parameters: msg.parameters || {},
                  result: msg.content
                } as AICommandResponse);
              } catch (e) {
                // Fallback: try to stringify and parse
                try {
                  const stringified = JSON.stringify(msg.content);
                  const parsed = JSON.parse(stringified);
                  if (msg.action && parsed) {
                    content = formatActionResult({
                      action: msg.action,
                      parameters: msg.parameters || {},
                      result: parsed
                    } as AICommandResponse);
                  } else {
                    content = stringified;
                  }
                } catch (e2) {
                  content = 'Message content could not be displayed.';
                }
              }
            } else {
              // Fallback for any other type
              content = String(msg.content || '');
            }
          }

          // Ensure content is never empty for assistant messages
          if (msg.role === 'assistant' && !content.trim()) {
            content = 'Action completed successfully.';
          }

          // Reconstruct searchResults from _resultData if it exists
          let searchResults: any[] | undefined = undefined;
          if (msg.action === 'search_document') {
            if (msg.parameters?._resultData) {
              const resultData = msg.parameters._resultData;
              if (resultData.documents && Array.isArray(resultData.documents)) {
                searchResults = resultData.documents;
              } else if (Array.isArray(resultData)) {
                searchResults = resultData;
              }
            }
          }

          return {
            role: msg.role,
            content: content, // Always a string now
            action: msg.action || null,
            parameters: msg.parameters || {},
            searchResults: searchResults,
            timestamp: msg.timestamp
          } as SearchResultMessage;
        });
        
        setMessages(reconstructedMessages);
      }
    } catch (error: any) {
      console.error('Error loading conversation:', error);
      // Add welcome message if no history
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m your AI assistant. I can help you:\n\n• Search documents: "Find the NDA sent to Rahul"\n• Send documents: "Send this document to Priya"\n• Prepare documents: "Add signature and name fields"\n\nWhat would you like to do?'
      }]);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF, DOC, DOCX, etc.)
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF, Word document, or image file');
        return;
      }
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }
      setAttachedFile(file);
      toast.success(`File attached: ${file.name}`);
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message to UI immediately (include file info if attached)
    const userMessageContent = attachedFile 
      ? `${userMessage || 'Send this document'} [File: ${attachedFile.name}]`
      : userMessage;
    
    const newUserMessage: ConversationMessage = {
      role: 'user',
      content: userMessageContent,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const response: AICommandResponse = await aiAssistantApiService.processCommand(userMessage || 'Send this document', attachedFile);
      
      // Clear attached file after sending
      setAttachedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Handle response
      if (response.clarification) {
        // Show clarification question
        const clarificationMessage: ConversationMessage = {
          role: 'assistant',
          content: response.clarification,
          action: null,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, clarificationMessage]);
      } else if (response.action && response.result) {
        // Show action result
        const resultMessage: SearchResultMessage = {
          role: 'assistant',
          content: formatActionResult(response),
          action: response.action,
          parameters: response.parameters,
          timestamp: new Date().toISOString(),
          // Store search results for clickable links
          searchResults: response.action === 'search_document' ? response.result.documents : undefined
        };
        setMessages(prev => [...prev, resultMessage]);

        // Show toast notification
        toast.success(`Action executed: ${response.action.replace('_', ' ')}`);
      } else if (response.action) {
        // Action identified but no result (shouldn't happen, but handle gracefully)
        const actionMessage: ConversationMessage = {
          role: 'assistant',
          content: `I understand you want to ${response.action.replace('_', ' ')}. Processing...`,
          action: response.action,
          parameters: response.parameters,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, actionMessage]);
      }
    } catch (error: any) {
      console.error('Error processing command:', error);
      const errorMessage: ConversationMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.response?.data?.message || error.message || 'Unknown error'}. Please try again.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to process command');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const formatActionResult = (response: AICommandResponse): string => {
    if (!response.result) return 'Action completed successfully.';

    switch (response.action) {
      case 'search_document':
        const docs = response.result.documents || [];
        if (docs.length === 0) {
          return 'No documents found matching your search.';
        }
        // Return a simple message - the actual rendering will be done in the message component
        return `Found ${docs.length} document(s). Click on any document to view details.`;

      case 'send_document':
        return `Document sent successfully to ${response.parameters.recipients?.length || 0} recipient(s).`;

      case 'prepare_document':
        return `Document prepared with ${response.result.fields || 0} field(s). ${response.result.nextSteps?.join('\n') || ''}`;

      case 'create_and_send_envelope':
        return `Envelope created and sent successfully! Sent to ${response.result.recipients || response.parameters?.recipients?.length || 0} recipient(s) with ${response.result.signatureFields || 0} signature field(s).`;

      default:
        return response.message || 'Action completed successfully.';
    }
  };

  const handleDocumentClick = async (documentId: string, documentName: string, serviceType?: string, documentType?: string) => {
    try {
      // Check if it's an e-sign envelope
      if (serviceType === 'e-sign-service' || documentType === 'envelope' || documentType === 'esign') {
        // Navigate to e-sign envelope detail page
        window.location.href = `/e-sign/envelope/${documentId}`;
        onClose();
        toast.success(`Opening envelope: ${documentName}`);
        return;
      }

      // For regular documents, dispatch event and navigate to document service
      window.dispatchEvent(new CustomEvent('ai-assistant:open-document', {
        detail: { documentId, documentName, serviceType: 'document-service' }
      }));
      
      // Navigate to all documents page using window.location
      // This works outside Router context
      if (window.location.pathname !== '/all-documents') {
        window.location.href = '/all-documents';
      }
      
      // Close the AI assistant panel
      onClose();
      
      toast.success(`Opening document: ${documentName}`);
    } catch (error) {
      console.error('Error opening document:', error);
      toast.error('Failed to open document');
    }
  };

  const handleClear = async () => {
    try {
      await aiAssistantApiService.clearConversation();
      setMessages([{
        role: 'assistant',
        content: 'Conversation cleared. How can I help you?'
      }]);
      toast.success('Conversation cleared');
    } catch (error: any) {
      console.error('Error clearing conversation:', error);
      toast.error('Failed to clear conversation');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getActionIcon = (action: string | null | undefined) => {
    switch (action) {
      case 'search_document':
        return <Search className="w-4 h-4 text-blue-500" />;
      case 'send_document':
        return <Mail className="w-4 h-4 text-green-500" />;
      case 'prepare_document':
        return <FileEdit className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-[60] flex flex-col border-l border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-white">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-slate-900">AI Assistant</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4 text-slate-500" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-slate-50">
        {isInitializing ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-500 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>Start a conversation with your AI assistant</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 break-words ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-slate-900 border border-slate-200'
                }`}
              >
                {message.role === 'assistant' && message.action && (
                  <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-200">
                    {getActionIcon(message.action)}
                    <span className="text-xs font-medium text-slate-600">
                      {message.action.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm break-words">
                  {(() => {
                    // Ensure content is always displayed as a formatted string
                    if (typeof message.content === 'string') {
                      return message.content;
                    }
                    // If content is an object, try to format it
                    if (message.content && typeof message.content === 'object' && message.action) {
                      try {
                        return formatActionResult({
                          action: message.action,
                          parameters: message.parameters || {},
                          result: message.parameters?._resultData || message.content
                        } as AICommandResponse);
                      } catch (e) {
                        // Fallback to stringify if formatting fails
                        return JSON.stringify(message.content, null, 2);
                      }
                    }
                    // Final fallback
                    return String(message.content || '');
                  })()}
                </div>
                {/* Render clickable search results */}
                {message.searchResults && message.searchResults.length > 0 && (
                  <div className="mt-3 space-y-2 pt-3 border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-600 mb-2">Search Results:</p>
                    {message.searchResults.map((doc: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => handleDocumentClick(
                          doc.documentId, 
                          doc.documentName || doc.documentId,
                          doc.serviceType,
                          doc.documentType
                        )}
                        className="w-full text-left p-2 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-purple-300 transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-semibold text-purple-600">#{idx + 1}</span>
                              <p className="text-sm font-medium text-slate-900 truncate group-hover:text-purple-600">
                                {doc.documentName || doc.documentId}
                              </p>
                            </div>
                            {doc.metadata?.description && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {doc.metadata.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-3 mt-1 text-xs text-slate-400">
                              {doc.serviceType === 'e-sign-service' && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                  E-Sign
                                </span>
                              )}
                              {doc.metadata?.recipientName && (
                                <span>To: {doc.metadata.recipientName}</span>
                              )}
                              {doc.metadata?.category && (
                                <span>• {doc.metadata.category}</span>
                              )}
                              {doc.metadata?.status && (
                                <span>• {doc.metadata.status}</span>
                              )}
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-purple-600 flex-shrink-0 ml-2" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg px-4 py-2 border border-slate-200">
              <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 bg-white overflow-x-hidden">
        {/* Attached File Display */}
        {attachedFile && (
          <div className="mb-2 p-2 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <Paperclip className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <span className="text-sm text-slate-700 truncate">{attachedFile?.name || 'Unknown file'}</span>
              <span className="text-xs text-slate-500 flex-shrink-0">
                ({attachedFile ? (attachedFile.size / 1024 / 1024).toFixed(2) : '0'} MB)
              </span>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-1 hover:bg-purple-100 rounded transition-colors flex-shrink-0"
              title="Remove file"
            >
              <XCircle className="w-4 h-4 text-purple-600" />
            </button>
          </div>
        )}
        
        <div className="flex items-end space-x-2">
          {/* File Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
            id="ai-assistant-file-input"
          />
          <label
            htmlFor="ai-assistant-file-input"
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors flex-shrink-0"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5 text-slate-600" />
          </label>
          
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={attachedFile ? "Write your message and I'll send this document..." : "Type your command... (e.g., 'search documents sent to Rahul')"}
            className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !attachedFile) || isLoading}
            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default AIAssistantPanel;

