import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Download,
  Send,
  Loader2,
  ArrowLeft,
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
import FeedbackButtons from '../../components/Template/feedbackButton';
import InlineEditor from '../../components/Template/InlineEditor';
// type Complexity = 'Simple' | 'Medium' | 'Complex';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isGenerating?: boolean;
  isDocument?: boolean;
  userMessage?: string;
  editableContent?: string;
}
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
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [downloadingMessageId, setDownloadingMessageId] = useState<string | null>(null);
  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
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
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setIsListening(true);
      setLiveTranscript('');
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const capitalizedTranscript = transcript.charAt(0).toUpperCase() + transcript.slice(1);
        if (event.results[i].isFinal) {
          finalTranscript += capitalizedTranscript + ' ';
        } else {
          interimTranscript += capitalizedTranscript;
        }
      }
      if (interimTranscript) {
        setLiveTranscript(interimTranscript);
      }
      if (finalTranscript) {
        setInputMessage(prev => {
          const combined = (prev + ' ' + finalTranscript).trim();
          setLiveTranscript('');
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
      setIsListening(false);
      setLiveTranscript('');
    } catch (error) {
      console.error('Error stopping recognition:', error);
      setIsListening(false);
    }
  };
  // Initial welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your AI document assistant. I can help you create professional legal documents.\n\nTo get started, simply describe what kind of document you need.\n\nFor example: "I need a non-disclosure agreement for my startup" or "Create an employment contract for a software engineer"\n\nI\'ll ask you for any missing information needed to create your document.',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);  
  useEffect(() => {
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
    const streamingMessageId = `assistant_${Date.now()}`;
    const streamingMessage: Message = {
      id: streamingMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isGenerating: true,
      userMessage: userMessage.content
    };
    setMessages(prev => [...prev, streamingMessage]);
    try {
      const conversationHistory = messages
        .filter(m => !m.isGenerating)
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');
      const templateType = 'General Legal Document';
      let requirementsText = `User Request:\n${userMessage.content}`;
      if (conversationHistory) {
        requirementsText += `\n\nConversation History:\n${conversationHistory}`;
      }
      requirementsText += `\n\nInstructions: Please analyze the user's request. If you have enough information to generate the document, provide the complete document. If information is missing, ask specific clarifying questions in a friendly, conversational manner.`;
      let accumulatedContent = '';
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
            // Convert markdown to HTML for documents
            const htmlContent = isCompleteDocument
              ? renderMarkdown(fullContent)
              : fullContent;
            // Update final message
            setMessages(prev =>
              prev.map(msg =>
                msg.id === streamingMessageId
                  ? {
                    ...msg,
                    content: htmlContent, // Store HTML version
                    editableContent: htmlContent, // Store HTML version
                    isDocument: isCompleteDocument,
                    isGenerating: false,
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
      content: 'Hello! I\'m your AI document assistant. I can help you create professional legal documents.\n\nTo get started, simply describe what kind of document you need.\n\nFor example: "I need a non-disclosure agreement for my startup" or "Create an employment contract for a software engineer"\n\nI\'ll ask you for any missing information needed to create your document.',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    toast.success('Conversation cleared');
  };
  const convertHtmlToPlainText = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.querySelectorAll('strong').forEach(strong => {
      const text = strong.textContent || '';
      strong.replaceWith(`**${text}**`);
    });
    tempDiv.querySelectorAll('br').forEach(br => {
      br.replaceWith('\n');
    });
    let plainText = tempDiv.textContent || '';
    plainText = plainText.replace(/\n\s+\n/g, '\n\n');
    return plainText.trim();
  };
  const handleDownloadPDF = async (content: string, messageId: string) => {
    const finalContent = content;
    if (!finalContent) {
      toast.error('No content to download');
      return;
    }
    setDownloadingMessageId(messageId);
    try {
      const plainTextContent = convertHtmlToPlainText(finalContent);
      const response = await aiContentService.convertToPDF({
        content: plainTextContent,
        documentName: 'Legal Document'
      });
      if (response.success && response.data.base64) {
        aiContentService.downloadPDF(
          response.data.base64,
          `Document.pdf`
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
    const finalContent = content;
    if (!finalContent) {
      toast.error('No content to send');
      return;
    }
    if (!isAuthenticated) {
      setSendingMessageId(messageId);
      try {
        const plainTextContent = convertHtmlToPlainText(finalContent);
        const response = await aiContentService.storePendingDocument({
          documentName: 'Legal Document',
          content: plainTextContent,
          templateType: 'General Legal Document',
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
      const plainTextContent = convertHtmlToPlainText(finalContent);
      const response = await aiContentService.convertToPDF({
        content: plainTextContent,
        documentName: 'Legal Document'
      });
      if (response.success && response.data.base64) {
        navigate('/e-sign/create', {
          state: {
            documentData: {
              name: `Document.pdf`,
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
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-8 py-6">  
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
                  {message.isDocument ? (
                    <InlineEditor
                      value={message.editableContent || message.content}
                      onChange={(updatedHtml) => {
                        setMessages(prev =>
                          prev.map(m =>
                            m.id === message.id
                              ? { ...m, editableContent: updatedHtml }
                              : m
                          )
                        );
                      }}
                    />
                  ) : (
                    <div
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content || '') }}
                    />
                  )}
                  {message.role === 'assistant' && !message.isGenerating && (
                    <div className="flex items-center justify-between px-4 pt-2 border-t"
                      style={{ borderColor: '#D0D0D0' }}>
                      <FeedbackButtons
                        messageId={message.id}
                        sessionId={sessionId}
                        messageContent={message.content}
                        userMessage={message.userMessage}
                        onFeedbackSubmit={(type) => {
                          if (type === 'like') {
                            toast.success('Thank you for your feedback!');
                          }
                        }}
                      />
                      {message.isDocument && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              handleDownloadPDF(
                                message.editableContent || message.content,
                                message.id
                              )
                            }
                            disabled={downloadingMessageId === message.id}
                            title="Download PDF"
                            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
                          >
                            {downloadingMessageId === message.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#4D0080]" />
                            ) : (
                              <Download className="w-4 h-4 text-[#4D0080]" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              handleSendAsEnvelope(
                                message.editableContent || message.content,
                                message.id
                              )
                            }
                            disabled={sendingMessageId === message.id}
                            title={isAuthenticated ? 'Send as Envelope' : 'Login to Send'}
                            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
                          >
                            {sendingMessageId === message.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#4D0080]" />
                            ) : (
                              <Send className="w-4 h-4 text-[#4D0080]" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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