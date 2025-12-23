import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Download,
  Send,
  Loader2,
  ArrowLeft,
  AlertCircle,
  User,
  Bot,
  Trash2,
  Square,
  Mic
} from 'lucide-react';
import { useAuth } from '../../components/AuthService/AuthContext';
import { aiContentService } from '../../services/aiContentService';
import toast from 'react-hot-toast';
import './AITemplateGenerator.css';

type Complexity = 'Simple' | 'Medium' | 'Complex';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  complexity: Complexity;
  rating: number;
  downloads: number;
  timeToComplete: string;
  isPremium: boolean;
  isFeatured: boolean;
  tags: string[];
  expertReviewed: boolean;
  jurisdictions: string[];
  fields: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isGenerating?: boolean;
  isDocument?: boolean;
}

// Helper function to convert markdown bold (**text**) to HTML
const renderMarkdown = (text: string): string => {
  const escapeHtml = (str: string) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  let html = escapeHtml(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\n/g, '<br>');

  return html;
};

const AITemplateGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [downloadingMessageId, setDownloadingMessageId] = useState<string | null>(null);
  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState(''); // Add this for real-time display
  const recognitionRef = useRef<any>(null);

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  useEffect(() => {
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;  // Changed to true - keeps listening
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      // console.log('Speech recognition started');
      setIsListening(true);
      setLiveTranscript(''); // Clear previous transcript
    };

    recognition.onend = () => {
      // console.log('Speech recognition ended');
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        // Capitalize first letter
        const capitalizedTranscript = transcript.charAt(0).toUpperCase() + transcript.slice(1);

        if (event.results[i].isFinal) {
          // Final result - add to input with space
          finalTranscript += capitalizedTranscript + ' ';
        } else {
          // Interim result - show in real-time
          interimTranscript += capitalizedTranscript;
        }
      }

      // Update live transcript for real-time display
      if (interimTranscript) {
        setLiveTranscript(interimTranscript);
      }

      // Update input message with final results only
      if (finalTranscript) {
        setInputMessage(prev => {
          const combined = (prev + ' ' + finalTranscript).trim();
          setLiveTranscript(''); // Clear interim when final is added
          return combined;
        });
      }
    };

    recognition.onerror = (err: any) => {
      console.error('Speech recognition error:', err.error);
      let errorMessage = '';

      switch (err.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Ensure it is connected.';
          break;
        case 'network':
          errorMessage = 'Network error occurred.';
          break;
        default:
          errorMessage = `Error: ${err.error}`;
      }

      console.error('Speech error:', errorMessage);
      toast.error(errorMessage);
      setIsListening(false);
      setLiveTranscript('');
    };

    recognitionRef.current = recognition;

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech Recognition not available');
      return;
    }

    try {
      setLiveTranscript('');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
      setIsListening(false); // Add this line
      setLiveTranscript('');
    } catch (error) {
      console.error('Error stopping recognition:', error);
      setIsListening(false); // Add this line
    }
  };

  // Initial welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your AI document assistant. I can help you create professional legal documents.\n\nTo get started, you can:\n1. Select a template type from the dropdown above\n2. Or simply describe what kind of document you need\n\nFor example: "I need a non-disclosure agreement for my startup" or "Create an employment contract for a software engineer"\n\nI\'ll ask you for any missing information needed to create your document.',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  const templates: Template[] = [
    {
      id: 'nda',
      name: 'Non-Disclosure Agreement',
      category: 'business',
      description: 'Protect confidential information in business relationships',
      complexity: 'Simple',
      rating: 4.9,
      downloads: 15420,
      timeToComplete: '5 min',
      isPremium: false,
      isFeatured: true,
      tags: ['Confidentiality', 'Business', 'Legal Protection'],
      expertReviewed: true,
      jurisdictions: ['US', 'CA', 'UK', 'AU'],
      fields: ['Company Name', 'Recipient Name', 'Effective Date', 'Jurisdiction', 'Project Description']
    },
    {
      id: 'employment-contract',
      name: 'Employment Contract',
      category: 'employment',
      description: 'Comprehensive employment agreement template',
      complexity: 'Medium',
      rating: 4.8,
      downloads: 12350,
      timeToComplete: '8 min',
      isPremium: false,
      isFeatured: true,
      tags: ['Employment', 'HR', 'Contracts'],
      expertReviewed: true,
      jurisdictions: ['US', 'CA'],
      fields: ['Employee Name', 'Position', 'Start Date', 'Salary', 'Benefits']
    },
    {
      id: 'rental-agreement',
      name: 'Residential Lease Agreement',
      category: 'real-estate',
      description: 'Standard residential rental agreement',
      complexity: 'Medium',
      rating: 4.7,
      downloads: 9870,
      timeToComplete: '10 min',
      isPremium: false,
      isFeatured: false,
      tags: ['Real Estate', 'Rental', 'Property'],
      expertReviewed: true,
      jurisdictions: ['US'],
      fields: ['Landlord Name', 'Tenant Name', 'Property Address', 'Rent Amount', 'Lease Term']
    },
    {
      id: 'service-agreement',
      name: 'Service Agreement',
      category: 'business',
      description: 'Professional services contract template',
      complexity: 'Medium',
      rating: 4.6,
      downloads: 8920,
      timeToComplete: '7 min',
      isPremium: false,
      isFeatured: false,
      tags: ['Services', 'Business', 'Freelance'],
      expertReviewed: true,
      jurisdictions: ['US', 'CA', 'UK'],
      fields: ['Service Provider', 'Client Name', 'Services Description', 'Payment Terms']
    },
    {
      id: 'partnership-agreement',
      name: 'Partnership Agreement',
      category: 'business',
      description: 'Business partnership formation document',
      complexity: 'Complex',
      rating: 4.8,
      downloads: 5430,
      timeToComplete: '15 min',
      isPremium: true,
      isFeatured: false,
      tags: ['Partnership', 'Business Formation', 'Legal'],
      expertReviewed: true,
      jurisdictions: ['US', 'CA'],
      fields: ['Partner Names', 'Business Name', 'Capital Contributions', 'Profit Sharing']
    },
    {
      id: 'loan-agreement',
      name: 'Personal Loan Agreement',
      category: 'finance',
      description: 'Simple personal loan contract',
      complexity: 'Simple',
      rating: 4.5,
      downloads: 7650,
      timeToComplete: '6 min',
      isPremium: false,
      isFeatured: false,
      tags: ['Finance', 'Loan', 'Personal'],
      expertReviewed: true,
      jurisdictions: ['US'],
      fields: ['Lender Name', 'Borrower Name', 'Loan Amount', 'Interest Rate', 'Repayment Terms']
    }
  ];

  useEffect(() => {
    if (!selectedTemplate && templates.length > 0) {
      setSelectedTemplate(templates[0]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isGenerating) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsGenerating(true);

    // Create streaming message with empty content
    const streamingMessageId = `assistant_${Date.now()}`;
    const streamingMessage: Message = {
      id: streamingMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isGenerating: true
    };
    setMessages(prev => [...prev, streamingMessage]);

    try {
      // Build conversation context
      const conversationHistory = messages
        .filter(m => !m.isGenerating)
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');

      const templateType = selectedTemplate?.name || 'General Legal Document';

      let requirementsText = '';
      if (selectedTemplate) {
        requirementsText += `Template Type: ${selectedTemplate.name}\n`;
        requirementsText += `Description: ${selectedTemplate.description}\n\n`;
      }
      requirementsText += `User Request:\n${userMessage.content}`;

      if (conversationHistory) {
        requirementsText += `\n\nConversation History:\n${conversationHistory}`;
      }

      requirementsText += `\n\nInstructions: Please analyze the user's request. If you have enough information to generate the document, provide the complete document. If information is missing, ask specific clarifying questions in a friendly, conversational manner.`;

      let accumulatedContent = '';

      // Use TRUE STREAMING from backend
      await aiContentService.generateContentStreaming(
        {
          templateType: templateType,
          requirements: requirementsText.trim(),
          formData: {}
        },
        {
          onToken: (token: string) => {
            accumulatedContent += token;

            // Update the streaming message in real-time
            setMessages(prev =>
              prev.map(msg =>
                msg.id === streamingMessageId
                  ? { ...msg, content: accumulatedContent }
                  : msg
              )
            );
          },
          onComplete: (fullContent: string) => {
            // Check if it's a complete document
            const isCompleteDocument =
              fullContent.includes('WHEREAS') ||
              fullContent.includes('NOW, THEREFORE') ||
              fullContent.includes('IN WITNESS WHEREOF') ||
              fullContent.length > 500;

            // Update final message
            setMessages(prev =>
              prev.map(msg =>
                msg.id === streamingMessageId
                  ? {
                    ...msg,
                    content: fullContent,
                    isGenerating: false,
                    isDocument: isCompleteDocument
                  }
                  : msg
              )
            );

            if (isCompleteDocument) {
              toast.success('Document generated successfully!');
            }

            setIsGenerating(false);
            inputRef.current?.focus();
          },
          onError: (error: Error) => {
            console.error('Error generating content:', error);

            setMessages(prev => prev.filter(m => m.id !== streamingMessageId));

            const errorMessage: Message = {
              id: `error_${Date.now()}`,
              role: 'assistant',
              content: 'I apologize, but I encountered an error. Please try again or rephrase your request.',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);

            toast.error(error.message || 'Failed to generate response. Please try again.');
            setIsGenerating(false);
            inputRef.current?.focus();
          }
        }
      );

    } catch (error: any) {
      console.error('Error generating content:', error);

      setMessages(prev => prev.filter(m => m.id !== streamingMessageId));

      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or rephrase your request.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);

      toast.error(error.message || 'Failed to generate response. Please try again.');
      setIsGenerating(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearConversation = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your AI document assistant. I can help you create professional legal documents.\n\nTo get started, you can:\n1. Select a template type from the dropdown above\n2. Or simply describe what kind of document you need\n\nFor example: "I need a non-disclosure agreement for my startup" or "Create an employment contract for a software engineer"\n\nI\'ll ask you for any missing information needed to create your document.',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    toast.success('Conversation cleared');
  };

  const handleDownloadPDF = async (content: string, messageId: string) => {
    if (!content) {
      toast.error('No content to download');
      return;
    }

    setDownloadingMessageId(messageId);

    try {
      const response = await aiContentService.convertToPDF({
        content: content,
        documentName: selectedTemplate?.name || 'Legal Document'
      });

      if (response.success && response.data.base64) {
        aiContentService.downloadPDF(
          response.data.base64,
          `${(selectedTemplate?.name || 'Document').replace(/\s+/g, '_')}.pdf`
        );
        toast.success('PDF downloaded successfully!');
      } else {
        toast.error('Failed to generate PDF. Please try again.');
      }
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast.error(error.message || 'Failed to download PDF. Please try again.');
    } finally {
      setDownloadingMessageId(null);
    }
  };

  const handleSendAsEnvelope = async (content: string, messageId: string) => {
    if (!content) {
      toast.error('No content to send');
      return;
    }

    if (!isAuthenticated) {
      setSendingMessageId(messageId);
      try {
        const response = await aiContentService.storePendingDocument({
          documentName: selectedTemplate?.name || 'Legal Document',
          content: content,
          templateType: selectedTemplate?.name || 'Unknown',
          sessionId
        });

        if (response.success) {
          localStorage.setItem('pendingDocumentId', response.data.documentId);
          localStorage.setItem('pendingSessionId', response.data.sessionId);
          toast.success('Document saved. Please login to continue.');
          navigate('/login', { state: { returnTo: '/e-sign/create', pendingDocument: response.data.documentId } });
        } else {
          toast.error('Failed to save document. Please try again.');
        }
      } catch (error: any) {
        console.error('Error storing document:', error);
        toast.error(error.message || 'Failed to save document. Please try again.');
      } finally {
        setSendingMessageId(null);
      }
      return;
    }

    setSendingMessageId(messageId);
    try {
      const response = await aiContentService.convertToPDF({
        content: content,
        documentName: selectedTemplate?.name || 'Legal Document'
      });

      if (response.success && response.data.base64) {
        navigate('/e-sign/create', {
          state: {
            documentData: {
              name: `${(selectedTemplate?.name || 'Document').replace(/\s+/g, '_')}.pdf`,
              content: response.data.base64,
              type: 'application/pdf'
            }
          }
        });
      } else {
        toast.error('Failed to prepare document. Please try again.');
      }
    } catch (error: any) {
      console.error('Error preparing document:', error);
      toast.error(error.message || 'Failed to prepare document. Please try again.');
    } finally {
      setSendingMessageId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <div className="border-b flex-shrink-0" style={{ borderColor: '#D0D0D0', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/e-sign/form-list')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gray-50"
                style={{ color: '#28004D' }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg">
                  <Sparkles className="w-6 h-6" style={{ color: '#4D0080' }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: '#28004D' }}>
                    AI Template Generator
                  </h1>
                  <p className="text-sm" style={{ color: '#888888' }}>
                    Generate professional legal documents using AI
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => {
                  const template = templates.find(t => t.id === e.target.value);
                  setSelectedTemplate(template || null);
                }}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                style={{
                  borderColor: '#D0D0D0',
                  borderRadius: '6px',
                  color: '#28004D',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <option value="">Select Template (Optional)</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>

              {messages.length > 1 && (
                <button
                  onClick={handleClearConversation}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gray-50"
                  style={{ color: '#28004D' }}
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-8 py-6">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4D0080' }}>
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-lg ${message.role === 'user'
                  ? 'rounded-br-none'
                  : 'rounded-bl-none'
                  }`}
                style={{
                  backgroundColor: message.role === 'user' ? '#4D0080' : '#F9FAFB',
                  color: message.role === 'user' ? '#FFFFFF' : '#28004D',
                  border: message.role === 'assistant' ? '1px solid #D0D0D0' : 'none'
                }}
              >
                <div className={`px-4 py-3 ${message.isDocument ? 'pb-3' : ''}`}>
                  <div
                    className={`whitespace-pre-wrap text-sm leading-relaxed ${message.isGenerating ? 'streaming-cursor' : ''
                      }`}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content || '') }}
                  />
                </div>

                {message.isDocument && !message.isGenerating && (
                  <div className="px-4 pb-3 pt-2 border-t space-y-2" style={{ borderColor: message.role === 'assistant' ? '#D0D0D0' : 'rgba(255,255,255,0.2)' }}>
                    <button
                      onClick={() => handleDownloadPDF(message.content, message.id)}
                      disabled={downloadingMessageId === message.id}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      style={{
                        borderColor: message.role === 'user' ? 'rgba(255,255,255,0.5)' : '#4D0080',
                        color: message.role === 'user' ? '#FFFFFF' : '#4D0080',
                        borderRadius: '6px',
                        backgroundColor: message.role === 'user' ? 'rgba(255,255,255,0.1)' : '#FFFFFF'
                      }}
                    >
                      {downloadingMessageId === message.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Generating PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          <span>Download PDF</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleSendAsEnvelope(message.content, message.id)}
                      disabled={sendingMessageId === message.id}
                      className="w-full py-2 px-4 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                      style={{
                        backgroundColor: message.role === 'user' ? 'rgba(255,255,255,0.2)' : '#4D0080',
                        color: '#FFFFFF',
                        borderRadius: '6px'
                      }}
                    >
                      {sendingMessageId === message.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{isAuthenticated ? 'Preparing...' : 'Saving...'}</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>{isAuthenticated ? 'Send as Envelope' : 'Login to Send as Envelope'}</span>
                        </>
                      )}
                    </button>

                    {!isAuthenticated && (
                      <p className="text-xs text-center flex items-center justify-center gap-1" style={{ color: message.role === 'user' ? 'rgba(255,255,255,0.8)' : '#888888' }}>
                        <AlertCircle className="h-3 w-3" />
                        You'll be redirected to login after saving your document
                      </p>
                    )}
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs" style={{ backgroundColor: '#4D0080', color: '#FFFFFF' }}>
                  {user?.fullname ? (
                    user.fullname
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  ) : (
                    <User className="w-5 h-5" style={{ color: '#FFFFFF' }} />
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border rounded-lg p-4" style={{ borderColor: '#D0D0D0', backgroundColor: '#FFFFFF' }}>
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyPress={handleKeyPress}
                placeholder={isListening && liveTranscript ? '' : "Describe the document you need... (e.g., 'I need an NDA for my startup with a tech company')"}
                rows={1}
                className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none w-full"
                style={{
                  borderColor: '#D0D0D0',
                  borderRadius: '6px',
                  color: '#28004D',
                  maxHeight: '120px'
                }}
                disabled={isGenerating}
              />
              {/* Live transcript display */}
              {isListening && liveTranscript && (
                <div
                  className="absolute bottom-3 left-4 text-sm italic pointer-events-none"
                  style={{ color: '#888888' }}
                >
                  {liveTranscript}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className="p-3 rounded-lg transition-all"
                title={isListening ? 'Stop listening' : 'Start listening'}
              >
                <Mic
                  className={`w-5 h-5 ${isListening ? 'animate-pulse text-red-500' : 'text-black-700'
                    }`}
                />
              </button>

              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isGenerating}
                className=" rounded-lg transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <Square className="w-5 h-5 text-purple-700" />
                ) : (
                  <Send className="w-5 h-5 text-[#4D0080]" />
                )}
              </button>
            </div>
          </div>
          <p className="text-xs mt-2" style={{ color: '#888888' }}>
            Press Enter to send, Shift+Enter for new line • Click mic to speak
          </p>
        </div>
      </div>
    </div>
  );
};

export default AITemplateGenerator;