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
  Mic,
  Save,
  ClipboardEdit,
  X
} from 'lucide-react';
import { useAuth } from '../../components/AuthService/AuthContext';
import { aiContentService } from '../../services/aiContentService';
import { templateServiceApi } from '../../services/apiHelper';
import toast from 'react-hot-toast';
import './AITemplateGenerator.css';
import FeedbackButtons from '../../components/Template/feedbackButton';
import InlineEditor from '../../components/Template/InlineEditor';
// type Complexity = 'Simple' | 'Medium' | 'Complex';

type TemplateFieldType = 'text' | 'date' | 'textarea';
type TemplateField = {
  id: string;
  label: string;
  type: TemplateFieldType;
  required?: boolean;
  placeholder?: string;
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isGenerating?: boolean;
  isDocument?: boolean;
  userMessage?: string;
  editableContent?: string;
  templateText?: string; // plain text with {{placeholders}}
  templateFields?: TemplateField[];
  savedTemplateId?: string;
  templateType?: string;
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

function interpolate(text: string, values: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_m, key) => values[key] ?? `{{${key}}}`);
}

function titleCaseFromId(id: string) {
  const withSpaces = id.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
  return withSpaces
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function extractJsonBlock(text: string) {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/i);
  return match ? match[1] : null;
}

function stripJsonBlock(text: string) {
  return text.replace(/```json\s*[\s\S]*?\s*```/gi, '').trim();
}

function fallbackExtractFieldsFromPlaceholders(templateText: string): TemplateField[] {
  const ids = new Set<string>();
  const re = /\{\{(\w+)\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(templateText)) !== null) {
    ids.add(m[1]);
  }
  return Array.from(ids).map((id) => ({
    id,
    label: titleCaseFromId(id),
    type: id.toLowerCase().includes('date') ? 'date' : 'text',
    required: true,
  }));
}

function safeParseFieldsJson(jsonText: string): TemplateField[] | null {
  try {
    const parsed = JSON.parse(jsonText);
    const list = Array.isArray(parsed?.fields) ? parsed.fields : Array.isArray(parsed) ? parsed : null;
    if (!Array.isArray(list)) return null;
    const normalized: TemplateField[] = list
      .map((f: any) => ({
        id: String(f.id || '').trim(),
        label: String(f.label || '').trim(),
        type: (String(f.type || 'text').trim() as TemplateFieldType) || 'text',
        required: Boolean(f.required ?? true),
        placeholder: typeof f.placeholder === 'string' ? f.placeholder : undefined,
      }))
      .filter((f: TemplateField) => f.id && f.label && (f.type === 'text' || f.type === 'date' || f.type === 'textarea'));
    return normalized.length ? normalized : null;
  } catch {
    return null;
  }
}

function extractTemplateAndFields(fullContent: string): { templateText: string; fields: TemplateField[] } {
  const jsonBlock = extractJsonBlock(fullContent);
  const templateText = stripJsonBlock(fullContent);
  const parsedFields = jsonBlock ? safeParseFieldsJson(jsonBlock) : null;
  const fields = parsedFields ?? fallbackExtractFieldsFromPlaceholders(templateText);
  return { templateText, fields };
}

function inferTemplateTypeFromPrompt(prompt: string): string {
  const text = (prompt || '').toLowerCase();
  if (
    text.includes('tech') ||
    text.includes('api') ||
    text.includes('documentation') ||
    text.includes('software') ||
    text.includes('developer')
  ) return 'tech';
  if (
    text.includes('employee') ||
    text.includes('employment') ||
    text.includes('hr') ||
    text.includes('offer letter') ||
    text.includes('onboarding')
  ) return 'hr';
  if (
    text.includes('mou') ||
    text.includes('memorandum') ||
    text.includes('partnership') ||
    text.includes('business')
  ) return 'business';
  return 'legal';
}

const AITemplateGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [downloadingMessageId, setDownloadingMessageId] = useState<string | null>(null);
  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null);
  const [savingTemplateId, setSavingTemplateId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const [fillOpen, setFillOpen] = useState(false);
  const [fillMessageId, setFillMessageId] = useState<string | null>(null);
  const [fillTitle, setFillTitle] = useState<string>('AI Template');
  const [fillTemplateText, setFillTemplateText] = useState<string>('');
  const [fillFields, setFillFields] = useState<TemplateField[]>([]);
  const [fillValues, setFillValues] = useState<Record<string, string>>({});
  const [fillGenerating, setFillGenerating] = useState(false);
  const [fillEditMode, setFillEditMode] = useState(false);
  const [fillTemplateDraft, setFillTemplateDraft] = useState<string>('');
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
      const templateType = inferTemplateTypeFromPrompt(userMessage.content);
      let requirementsText = `User Request:\n${userMessage.content}`;
      if (conversationHistory) {
        requirementsText += `\n\nConversation History:\n${conversationHistory}`;
      }
      requirementsText += `\n\nInstructions: Please analyze the user's request. If you have enough information to generate a TEMPLATE (not a filled final document), provide the complete template using placeholder tokens like {{disclosingParty}}, {{receivingParty}}, {{effectiveDate}} where details should be filled later. After the template, include a JSON block in a fenced code block with the required fields.\n\nOutput format requirements:\n1) Template text (plain text) with {{placeholders}}.\n2) Then a fenced JSON block exactly like:\n\n\`\`\`json\n{\n  \"fields\": [\n    { \"id\": \"disclosingParty\", \"label\": \"Disclosing Party\", \"type\": \"text\", \"required\": true, \"placeholder\": \"e.g., Acme Corp\" }\n  ]\n}\n\`\`\`\n\nIf information is missing, ask specific clarifying questions instead of generating the full template.`;
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
            const extracted = isCompleteDocument ? extractTemplateAndFields(fullContent) : null;
            // Convert markdown to HTML for documents
            const htmlContent = isCompleteDocument
              ? renderMarkdown(extracted?.templateText || fullContent)
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
                    templateText: extracted?.templateText,
                    templateFields: extracted?.fields,
                    templateType,
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

  const openFillModalForMessage = (message: Message) => {
    const sourceText = message.templateText && message.templateText.trim().length > 0
      ? message.templateText
      : convertHtmlToPlainText(message.editableContent || message.content);
    const extracted = extractTemplateAndFields(sourceText);
    const fields = extracted.fields;
    const initialValues = fields.reduce<Record<string, string>>((acc, f) => {
      acc[f.id] = '';
      return acc;
    }, {});

    setFillMessageId(message.id);
    setFillTitle(message.userMessage ? `${message.userMessage.slice(0, 40)}...` : 'AI Template');
    const nextTemplateText = (extracted.templateText || sourceText).trim();
    setFillTemplateText(nextTemplateText);
    setFillTemplateDraft(nextTemplateText);
    setFillFields(fields);
    setFillValues(initialValues);
    setFillEditMode(false);
    setFillOpen(true);
  };

  const closeFillModal = () => {
    if (fillGenerating) return;
    setFillOpen(false);
    setFillMessageId(null);
    setFillTitle('AI Template');
    setFillTemplateText('');
    setFillTemplateDraft('');
    setFillFields([]);
    setFillValues({});
    setFillEditMode(false);
  };

  const handleFillGeneratePdfAndOpenEsign = async () => {
    const templateBase = (fillTemplateDraft || fillTemplateText || '').trim();
    if (!templateBase || fillGenerating) return;
    const missing = fillFields.find((f) => f.required && !(fillValues[f.id] || '').trim());
    if (missing) {
      toast.error(`Please fill required field: ${missing.label}`);
      return;
    }

    try {
      setFillGenerating(true);
      const filledText = interpolate(templateBase, fillValues);
      const response = await aiContentService.convertToPDF({
        content: filledText,
        documentName: fillTitle || 'AI Template',
      });
      if (!response?.success || !response?.data?.base64) {
        throw new Error(response?.message || 'Unable to generate PDF');
      }
      closeFillModal();
      toast.success('Template generated. Opening e-sign create flow...');
      navigate('/e-sign/create', {
        state: {
          documentData: {
            name: response.data.fileName || 'Template.pdf',
            content: response.data.base64,
            type: 'application/pdf',
          },
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate template PDF';
      toast.error(msg);
    } finally {
      setFillGenerating(false);
    }
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
  const handleSaveTemplate = async (content: string, messageId: string, userMessage?: string, templateType?: string) => {
    const finalContent = content;
    if (!finalContent) {
      toast.error('No content to save');
      return;
    }
    if (!isAuthenticated) {
      toast.error('Please login to save templates');
      return;
    }
    // Generate a default title from user message or use a generic one
    let defaultTitle = 'AI Generated Template';
    if (userMessage) {
      // Extract a meaningful title from the user's request
      const words = userMessage.split(' ').slice(0, 5);
      defaultTitle = words.join(' ') + ' Template';
    }
    const existingId = messages.find(m => m.id === messageId)?.savedTemplateId;

    // For first save, ask title. For subsequent saves, reuse the same title (avoid duplicates).
    let title = defaultTitle;
    if (!existingId) {
      const prompted = prompt('Enter template title:', defaultTitle);
      if (!prompted || !prompted.trim()) return;
      title = prompted.trim();
    } else {
      // Reuse previously saved title shown in UI content (best-effort).
      title = defaultTitle;
    }
    setSavingTemplateId(messageId);
    try {
      const plainTextContent = convertHtmlToPlainText(finalContent);
      const response = await templateServiceApi.post('/api/template/save-ai-template', {
        id: existingId,
        title: title.trim(),
        content: plainTextContent,
        description: userMessage || 'AI-generated template',
        templateType: templateType || inferTemplateTypeFromPrompt(userMessage || '')
      });
      if (response.data && response.data.success) {
        toast.success('Template saved successfully!');
        const newId = response.data?.data?._id;
        if (newId) {
          setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, savedTemplateId: newId } : m)));
        }
        // Optionally navigate to form list
        // navigate('/e-sign/form-list');
      } else {
        toast.error('Failed to save template. Please try again.');
      }
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to save template. Please try again.');
    } finally {
      setSavingTemplateId(null);
    }
  };
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="border-b flex-shrink-0" style={{ borderColor: '#D0D0D0', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/e-sign/templateLibrary')}
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
                            onClick={() => openFillModalForMessage(message)}
                            title="Fill data & preview"
                            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
                            disabled={fillGenerating}
                          >
                            <ClipboardEdit className="w-4 h-4 text-[#4D0080]" />
                          </button>
                          <button
                            onClick={() =>
                              handleSaveTemplate(
                                message.editableContent || message.content,
                                message.id,
                                message.userMessage,
                                message.templateType
                              )
                            }
                            disabled={savingTemplateId === message.id || !isAuthenticated}
                            title={isAuthenticated ? 'Save as Template' : 'Login to Save Template'}
                            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
                          >
                            {savingTemplateId === message.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#4D0080]" />
                            ) : (
                              <Save className="w-4 h-4 text-[#4D0080]" />
                            )}
                          </button>
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
        {/* Fill Data Modal */}
        {fillOpen && (
          <div className="fixed inset-0 z-[9999]">
            <div className="absolute inset-0 bg-black/40" onClick={closeFillModal} aria-hidden="true" />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                  <div className="text-sm font-semibold text-slate-900">Fill template data</div>
                  <button
                    onClick={closeFillModal}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                    aria-label="Close"
                    disabled={fillGenerating}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 min-h-0">
                  <div className="lg:col-span-1 p-5 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 overflow-auto min-h-0">
                    <div className="text-sm font-semibold text-slate-900 mb-3">Required fields</div>
                    <div className="space-y-3">
                      {fillFields.map((f) => {
                        const value = fillValues[f.id] ?? '';
                        const common =
                          'w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#3E2B66]/20 focus:border-[#3E2B66] outline-none text-sm';

                        return (
                          <label key={f.id} className="block">
                            <div className="text-xs font-semibold text-slate-700 mb-1">
                              {f.label} {f.required ? <span className="text-rose-600">*</span> : null}
                            </div>
                            {f.type === 'textarea' ? (
                              <textarea
                                value={value}
                                onChange={(e) => setFillValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                                placeholder={f.placeholder}
                                className={`${common} min-h-[96px] resize-none`}
                              />
                            ) : (
                              <input
                                type={f.type}
                                value={value}
                                onChange={(e) => setFillValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                                placeholder={f.placeholder}
                                className={common}
                              />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="lg:col-span-2 p-6 flex flex-col min-h-0">
                    <div className="overflow-auto rounded-2xl border border-slate-200 bg-white flex-1 min-h-0">
                      <div className="px-8 py-8">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xl font-extrabold tracking-wide text-slate-900">
                            {fillEditMode ? 'Edit template' : 'Preview'}
                          </div>
                          <button
                            type="button"
                            onClick={() => setFillEditMode((v) => !v)}
                            disabled={fillGenerating}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                              fillEditMode
                                ? 'bg-[#3E2B66] text-white border-[#3E2B66]'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                            title={fillEditMode ? 'Switch to preview' : 'Edit template text'}
                          >
                            {fillEditMode ? 'Done' : 'Edit'}
                          </button>
                        </div>

                        {fillEditMode ? (
                          <textarea
                            value={fillTemplateDraft}
                            onChange={(e) => setFillTemplateDraft(e.target.value)}
                            className="mt-4 w-full min-h-[360px] rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 leading-relaxed outline-none focus:ring-2 focus:ring-[#3E2B66]/20 focus:border-[#3E2B66]"
                            placeholder="Edit template text here..."
                          />
                        ) : (
                          <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                            {interpolate((fillTemplateDraft || fillTemplateText || '').trim(), fillValues)}
                          </pre>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-5">
                      <button
                        onClick={closeFillModal}
                        className="px-5 py-2.5 rounded-xl font-semibold text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
                        disabled={fillGenerating}
                      >
                        CANCEL
                      </button>
                      <button
                        onClick={handleFillGeneratePdfAndOpenEsign}
                        disabled={fillGenerating || !fillMessageId}
                        className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-[#3E2B66] hover:bg-[#2a0a59] text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {fillGenerating ? 'GENERATING...' : 'GENERATE'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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