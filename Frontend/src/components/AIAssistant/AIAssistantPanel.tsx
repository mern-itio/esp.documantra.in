import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Bot, Loader2, Search, Mail, FileEdit, Trash2, ExternalLink, Paperclip, XCircle, Plus, MessageSquare, Edit2, History, Dot, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import { aiAssistantApiService } from '../../services/aiAssistantService';
import type { ConversationMessage, AICommandResponse, Conversation } from '../../services/aiAssistantService';
import { subscriptionApi } from '../../services/apiHelper';
import { SubscriptionStorage } from '../../services/subscriptionService';
import toast from 'react-hot-toast';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}
interface SearchResultMessage extends ConversationMessage {
  searchResults?: any[];
  isError?: boolean;
  patternId?: string; // For learning system
  failedAction?: string;
  failedParameters?: any;
}
const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<SearchResultMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [chatAreaWidth, setChatAreaWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const historyDropdownRef = useRef<HTMLDivElement>(null);
  const historyButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [_showScheduleOptions, setShowScheduleOptions] = useState<boolean>(false);
  
  // Learning system state
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [currentFailedPattern, setCurrentFailedPattern] = useState<{
    patternId: string;
    userCommand: string;
    failedAction: string;
    failedParameters: any;
  } | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<Map<string, {
    patternId: string;
    userCommand: string;
    failedAction: string;
    timestamp: number;
  }>>(new Map());
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const autoResizeTextarea = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    if (isOpen) {
      loadConversationsList();
      if (currentConversationId) {
        loadConversationHistory(currentConversationId);
      } else {
        loadConversationHistory();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && currentConversationId) {
      loadConversationHistory(currentConversationId);
    }
  }, [currentConversationId, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    autoResizeTextarea();
  }, [input]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newChatWidth = window.innerWidth - e.clientX;
      const constrainedWidth = Math.max(400, Math.min(1200, newChatWidth));
      setChatAreaWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  useEffect(() => {
    if (showHistoryDropdown && historyButtonRef.current) {
      const buttonRect = historyButtonRef.current.getBoundingClientRect();
      const rightPosition = window.innerWidth - buttonRect.right;

      setDropdownPosition({
        top: buttonRect.bottom + 8,
        right: Math.max(10, rightPosition)
      });
    }
  }, [showHistoryDropdown, chatAreaWidth]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(event.target as Node)) {
        if (historyButtonRef.current && !historyButtonRef.current.contains(event.target as Node)) {
          setShowHistoryDropdown(false);
        }
      }
    };
    if (showHistoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHistoryDropdown]);
  const loadConversationsList = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await aiAssistantApiService.listConversations();
      if (response.success && response.conversations) {
        setConversations(response.conversations);
        if (!currentConversationId && response.conversations.length > 0) {
          setCurrentConversationId(response.conversations[0].id);
        }
      }
    } catch (error: any) {
      console.error('Error loading conversations list:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };
  const loadConversationHistory = async (conversationId?: string) => {
    try {
      setIsInitializing(true);
      const response = await aiAssistantApiService.getConversationHistory(conversationId);
      if (response.success) {
        if (response.conversationId) {
          setCurrentConversationId(response.conversationId);
        }
        if (response.messages) {
          const reconstructedMessages: SearchResultMessage[] = response.messages.map((msg: any) => {
            let content: string = '';

            if (typeof msg.content === 'string' && msg.content.trim()) {
              content = msg.content;

              const trimmed = content.trim();
              if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && msg.action) {
                try {
                  const parsed = JSON.parse(content);
                  if (parsed && typeof parsed === 'object') {
                    const formatted = formatActionResult({
                      action: msg.action,
                      parameters: msg.parameters || {},
                      result: parsed
                    } as AICommandResponse);
                    content = formatted;
                  }
                } catch (e) {
                }
              }
            }
            else if (!content && msg.parameters?._resultData && msg.action) {
              try {
                content = formatActionResult({
                  action: msg.action,
                  parameters: msg.parameters || {},
                  result: msg.parameters._resultData
                } as AICommandResponse);
              } catch (e) {
              }
            }
            else if (msg.content && typeof msg.content === 'object') {
              try {
                content = formatActionResult({
                  action: msg.action,
                  parameters: msg.parameters || {},
                  result: msg.content
                } as AICommandResponse);
              } catch (e) {
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
            }
            else {
              content = String(msg.content || '');
            }
            if (msg.role === 'assistant' && !content.trim()) {
              content = 'Action completed successfully.';
            }
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
              content: content,
              action: msg.action || null,
              parameters: msg.parameters || {},
              searchResults: searchResults,
              timestamp: msg.timestamp
            } as SearchResultMessage;
          });

          setMessages(reconstructedMessages);
        }
      }
    } catch (error: any) {
      console.error('Error loading conversation:', error);
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m your AI assistant. I can help you:\n\n• Search documents: "Find the NDA sent to Receipient Name"\n• Send documents: "Send this document to Receipient Name"\n• Prepare documents: "Add signature and name fields"\n\nWhat would you like to do?'
      }]);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];

    const validFiles: File[] = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Unsupported file type: ${file.name}. Please upload PDF, Word document, or image file.`);
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`File too large: ${file.name}. Max size is 50MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setAttachedFiles(prev => [...prev, ...validFiles]);
      toast.success(validFiles.length === 1 ? `File attached: ${validFiles[0].name}` : `${validFiles.length} files attached`);
    }
  };

  const handleRemoveFile = (index?: number) => {
    setAttachedFiles(prev => {
      if (index === undefined) return [];
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    const fileLabel = attachedFiles.length === 1
      ? `[File: ${attachedFiles[0].name}]`
      : attachedFiles.length > 1
        ? `[Files: ${attachedFiles.map(f => f.name).join(', ')}]`
        : '';

    // Append scheduling information to the command if scheduling is enabled
    let commandWithScheduling = userMessage || 'Send this document';
    if (isScheduled && scheduledDate) {
      const scheduledDateTime = new Date(scheduledDate + (scheduledTime ? `T${scheduledTime}` : '')).toLocaleString();
      commandWithScheduling += ` [SCHEDULE: ${scheduledDateTime}]`;
    }

    const userMessageContent = attachedFiles.length > 0
      ? `${commandWithScheduling} ${fileLabel}`.trim()
      : commandWithScheduling;

    const newUserMessage: ConversationMessage = {
      role: 'user',
      content: userMessageContent,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Prepare context with scheduling information
      const context = isScheduled && scheduledDate ? {
        isScheduled: true,
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime || null
      } : undefined;

      const response: AICommandResponse = await aiAssistantApiService.processCommand(
        commandWithScheduling,
        attachedFiles,
        context,
        currentConversationId || undefined
      );

      if (response.conversationId && response.conversationId !== currentConversationId) {
        setCurrentConversationId(response.conversationId);
        loadConversationsList();
      }

      if (response.action && !response.clarification) {
        setAttachedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Reset scheduling options after successful action
        if (isScheduled) {
          setIsScheduled(false);
          setScheduledDate('');
          setScheduledTime('');
          setShowScheduleOptions(false);
        }
      }

      const shouldRefreshEnvelopes =
        (response.action === 'create_and_send_envelope' && response.result?.success) ||
        (response.action === 'generate_document' && response.result?.autoSent && response.result?.sendResult?.success) ||
        (response.result?.autoSent === true && response.result?.sendResult?.success);

      if (shouldRefreshEnvelopes) {
        try {
          const planResp = await subscriptionApi.get('/user-plan/me');
          if (planResp.status === 200 && planResp.data?.data) {
            SubscriptionStorage.savePlan(planResp.data.data);
            window.dispatchEvent(new CustomEvent('credits-updated'));
          }
        } catch (e) {
          console.error('Failed to refresh subscription credits after AI envelope send:', e);
        }

        try {
          const envelopeId = response.result?.envelopeId ||
            response.result?.sendResult?.envelopeId ||
            null;

          window.dispatchEvent(new CustomEvent('envelopes:updated', {
            detail: {
              source: 'ai-assistant',
              action: response.action,
              envelopeId: envelopeId,
              autoSent: response.result?.autoSent || false
            }
          }));

          window.dispatchEvent(new CustomEvent('ai-assistant:document-sent', {
            detail: {
              source: 'ai-assistant',
              action: response.action,
              envelopeId: envelopeId,
              autoSent: response.result?.autoSent || false
            }
          }));
        } catch (e) {
          console.error('Failed to dispatch envelopes:updated event:', e);
        }
      }

      if (response.clarification) {
        const clarificationMessage: ConversationMessage = {
          role: 'assistant',
          content: response.clarification,
          action: null,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, clarificationMessage]);
      } else if (response.action && response.result) {
        const resultMessage: SearchResultMessage = {
          role: 'assistant',
          content: formatActionResult(response),
          action: response.action,
          parameters: response.parameters,
          timestamp: new Date().toISOString(),
          searchResults: response.action === 'search_document' ? response.result.documents : undefined
        };
        setMessages(prev => [...prev, resultMessage]);

        toast.success(`Action executed: ${response.action.replace('_', ' ')}`);
      } else if (response.action) {
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
      const errorResponse = error.response?.data;
      const isLearningEnabled = errorResponse?.learningEnabled || false;
      const patternId = errorResponse?.patternId;
      
      const errorMessage: SearchResultMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorResponse?.message || error.message || 'Unknown error'}. Please try again.`,
        timestamp: new Date().toISOString(),
        isError: true,
        patternId: patternId,
        failedAction: errorResponse?.action,
        failedParameters: errorResponse?.parameters,
        userCommand: userMessageContent // Store user command for correction modal
      } as any;
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to process command');
      
      // Track failed attempt for automatic detection
      if (isLearningEnabled && patternId) {
        trackFailedAttempt(patternId, userMessageContent, errorResponse?.action, errorResponse?.parameters);
      }
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
        return `Found ${docs.length} document(s). Click on any document to view details.`;

      case 'send_document':
        return `Document sent successfully to ${response.parameters.recipients?.length || 0} recipient(s).`;

      case 'prepare_document':
        return `Document prepared with ${response.result.fields || 0} field(s). ${response.result.nextSteps?.join('\n') || ''}`;

      case 'list_auth_providers':
        if (!response.result.providers || response.result.providers.length === 0) {
          return 'No authentication providers are currently configured for your subscription plan.';
        }
        return `You have ${response.result.providers.length} authentication provider(s) available: ${response.result.providers.map((p: any) => p.name).join(', ')}.`;

      case 'create_and_send_envelope':
        return `Envelope created and sent successfully! Sent to ${response.result.recipients || response.parameters?.recipients?.length || 0} recipient(s) with ${response.result.signatureFields || 0} signature field(s).`;

      default:
        return response.message || 'Action completed successfully.';
    }
  };

  const renderTextWithLinks = (text: string) => {
    if (!text) return null;

    const docLinkRegex = /\[\[doc:([^:]+):([^:]+):([^:]+):([^\]]+)\]\]/g;
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const docLinkPlaceholders: Array<{ placeholder: string; name: string; id: string; serviceType: string; docType: string }> = [];
    let processedText = text;
    let placeholderIndex = 0;

    processedText = processedText.replace(docLinkRegex, (_match, name, id, serviceType, docType) => {
      const placeholder = `__DOC_LINK_${placeholderIndex}__`;
      docLinkPlaceholders.push({ placeholder, name, id, serviceType, docType });
      placeholderIndex++;
      return placeholder;
    });

    const parts = processedText.split(urlRegex);

    return parts.map((part, index) => {
      const isUrl = part.startsWith('http://') || part.startsWith('https://');
      if (isUrl) {
        const isPdfToolLink = part.includes('/pdf-tools/');
        const label = isPdfToolLink ? 'Convert this file to PDF' : part;
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#4D0080] underline break-all"
          >
            {label}
          </a>
        );
      }

      if (part.includes('__DOC_LINK_')) {
        const docLinkParts = part.split(/(__DOC_LINK_\d+__)/g);
        return (
          <span key={index}>
            {docLinkParts.map((subPart, subIndex) => {
              const docLinkMatch = subPart.match(/^__DOC_LINK_(\d+)__$/);
              if (docLinkMatch) {
                const linkIndex = parseInt(docLinkMatch[1]);
                const docLink = docLinkPlaceholders[linkIndex];
                if (docLink) {
                  return (
                    <a
                      key={subIndex}
                      onClick={(e) => {
                        e.preventDefault();
                        handleDocumentClick(docLink.id, docLink.name, docLink.serviceType, docLink.docType);
                      }}
                      className="text-[#4D0080] underline cursor-pointer hover:text-purple-800"
                    >
                      {docLink.name}
                    </a>
                  );
                }
              }
              return <span key={subIndex}>{subPart}</span>;
            })}
          </span>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  const handleDocumentClick = async (documentId: string, documentName: string, serviceType?: string, documentType?: string) => {
    try {
      if (serviceType === 'e-sign-service' || documentType === 'envelope' || documentType === 'esign') {
        window.location.href = `/e-sign/envelope/${documentId}`;
        onClose();
        toast.success(`Opening envelope: ${documentName}`);
        return;
      }

      window.dispatchEvent(new CustomEvent('ai-assistant:open-document', {
        detail: { documentId, documentName, serviceType: 'document-service' }
      }));

      if (window.location.pathname !== '/all-documents') {
        window.location.href = '/all-documents';
      }

      onClose();

      toast.success(`Opening document: ${documentName}`);
    } catch (error) {
      console.error('Error opening document:', error);
      toast.error('Failed to open document');
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await aiAssistantApiService.createConversation();
      setCurrentConversationId(response.conversationId);
      setMessages([]);
      setAttachedFiles([]);
      loadConversationsList();
      toast.success('New chat started');
    } catch (error: any) {
      console.error('Error creating new conversation:', error);
      toast.error('Failed to create new chat');
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId);
    await loadConversationHistory(conversationId);
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }
    try {
      await aiAssistantApiService.deleteConversation(conversationId);
      if (currentConversationId === conversationId) {
        const remaining = conversations.filter(c => c.id !== conversationId);
        if (remaining.length > 0) {
          setCurrentConversationId(remaining[0].id);
          await loadConversationHistory(remaining[0].id);
        } else {
          setCurrentConversationId(null);
          setMessages([]);
        }
      }
      loadConversationsList();
      toast.success('Conversation deleted');
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const handleEditTitle = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTitleId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const handleSaveTitle = async (conversationId: string) => {
    if (!editingTitle.trim()) {
      setEditingTitleId(null);
      return;
    }
    try {
      await aiAssistantApiService.updateConversationTitle(conversationId, editingTitle.trim());
      setEditingTitleId(null);
      loadConversationsList();
      toast.success('Title updated');
    } catch (error: any) {
      console.error('Error updating title:', error);
      toast.error('Failed to update title');
    }
  };

  const handleClear = async () => {
    try {
      if (currentConversationId) {
        await aiAssistantApiService.deleteConversation(currentConversationId);
        setCurrentConversationId(null);
        setMessages([]);
        loadConversationsList();
        toast.success('Conversation cleared');
      } else {
        setMessages([{
          role: 'assistant',
          content: 'Conversation cleared. How can I help you?'
        }]);
        toast.success('Conversation cleared');
      }
    } catch (error: any) {
      console.error('Error clearing conversation:', error);
      toast.error('Failed to clear conversation');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Track failed attempt for automatic detection
  const trackFailedAttempt = (patternId: string, userCommand: string, failedAction: string, _failedParameters: any) => {
    const attemptKey = `${patternId}_${Date.now()}`;
    setFailedAttempts(prev => {
      const newMap = new Map(prev);
      newMap.set(attemptKey, {
        patternId,
        userCommand,
        failedAction,
        timestamp: Date.now()
      });
      // Keep only last 10 failed attempts
      if (newMap.size > 10) {
        const firstKey = Array.from(newMap.keys())[0];
        newMap.delete(firstKey);
      }
      return newMap;
    });

    // Set up automatic detection listener (5 minute window)
    setTimeout(() => {
      setFailedAttempts(prev => {
        const newMap = new Map(prev);
        newMap.delete(attemptKey);
        return newMap;
      });
    }, 5 * 60 * 1000); // 5 minutes
  };

  // Detect user actions after failures (automatic detection)
  useEffect(() => {
    const handleUserAction = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const actionType = customEvent.detail?.action || event.type;
      const actionData = customEvent.detail?.data || customEvent.detail;
      
      // Map event types to AI actions
      const eventToActionMap: Record<string, string> = {
        'envelopes:updated': 'create_and_send_envelope',
        'ai-assistant:document-sent': 'create_and_send_envelope',
        'document:sent': 'send_document',
        'envelope:created': 'create_and_send_envelope'
      };

      const aiAction = eventToActionMap[actionType];
      if (!aiAction) return;

      // Extract parameters from event data
      let parameters: any = {};
      if (actionData) {
        if (actionData.recipients) parameters.recipients = actionData.recipients;
        if (actionData.documentId) parameters.documentId = actionData.documentId;
        if (actionData.envelopeId) parameters.documentId = actionData.envelopeId;
        if (actionData.signatureFields) parameters.signatureFields = actionData.signatureFields;
      }

      // Record user action for automatic matching
      try {
        await aiAssistantApiService.recordUserAction(
          aiAction,
          parameters,
          'ui',
          { route: window.location.pathname, eventType: actionType }
        );
      } catch (error) {
        console.error('Error recording user action:', error);
      }

      // Check if this action happened after a recent failure
      const recentFailures = Array.from(failedAttempts.entries())
        .filter(([_, attempt]) => Date.now() - attempt.timestamp < 5 * 60 * 1000)
        .sort(([_, a], [__, b]) => b.timestamp - a.timestamp);

      if (recentFailures.length > 0) {
        const mostRecentFailure = recentFailures[0][1];
        
        // Check if action matches failed action
        if (aiAction === mostRecentFailure.failedAction) {
          // User performed the action manually - prompt for correction
          setCurrentFailedPattern({
            patternId: mostRecentFailure.patternId,
            userCommand: mostRecentFailure.userCommand,
            failedAction: mostRecentFailure.failedAction,
            failedParameters: {}
          });
          setShowCorrectionModal(true);
          
          // Pre-fill correction form with detected action
          setTimeout(() => {
            // The correction form will be populated with the detected action
          }, 100);
          
          // Remove from tracking
          setFailedAttempts(prev => {
            const newMap = new Map(prev);
            newMap.delete(recentFailures[0][0]);
            return newMap;
          });
        }
      }
    };

    // Listen for various user actions
    const handleUserActionListener = handleUserAction as unknown as EventListener;
    window.addEventListener('envelopes:updated', handleUserActionListener);
    window.addEventListener('ai-assistant:document-sent', handleUserActionListener);
    window.addEventListener('ai-assistant:action-completed', handleUserActionListener);

    return () => {
      window.removeEventListener('envelopes:updated', handleUserActionListener);
      window.removeEventListener('ai-assistant:document-sent', handleUserActionListener);
      window.removeEventListener('ai-assistant:action-completed', handleUserActionListener);
    };
  }, [failedAttempts]);

  // Handle correction recording
  const handleRecordCorrection = async (correction: {
    action: string;
    parameters: any;
    description?: string;
  }) => {
    if (!currentFailedPattern) return;

    try {
      await aiAssistantApiService.recordUserCorrection(
        currentFailedPattern.patternId,
        correction
      );
      toast.success('Thank you! Your correction has been recorded. The AI will learn from this.');
      setShowCorrectionModal(false);
      setCurrentFailedPattern(null);
    } catch (error: any) {
      console.error('Error recording correction:', error);
      toast.error('Failed to record correction. Please try again.');
    }
  };

  // Open correction modal manually
  const handleShowCorrection = (patternId: string, userCommand: string, failedAction: string, failedParameters: any) => {
    setCurrentFailedPattern({
      patternId,
      userCommand,
      failedAction,
      failedParameters
    });
    setShowCorrectionModal(true);
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
    <div
      ref={panelRef}
      className="fixed right-0 top-0 h-full bg-white shadow-2xl z-[60] flex border-l border-slate-200 overflow-hidden"
      style={{ width: `${chatAreaWidth}px` }}
    >
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
        className="w-1 cursor-col-resize hover:bg-purple-400 transition-colors z-10 group relative flex-shrink-0 bg-transparent"
        title="Drag to resize panel"
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-slate-300 group-hover:bg-purple-500 rounded transition-colors" />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-visible">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-white relative">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-[#4D0080]" />
            <h2 className="text-lg font-semibold text-slate-900">AI Assistant</h2>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                ref={historyButtonRef}
                onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                className={`p-1.5 rounded-lg transition-colors ${showHistoryDropdown ? 'bg-purple-100 text-[#4D0080]' : 'hover:bg-slate-100 text-slate-500'
                  }`}
                title="Chat History"
              >
                <History className="w-4 h-4" />
              </button>

              {showHistoryDropdown && createPortal(
                <div
                  ref={historyDropdownRef}
                  className="fixed bg-white rounded-lg shadow-xl border border-slate-200 z-[70] max-h-[600px] flex flex-col"
                  style={{
                    width: `${Math.min(320, Math.max(280, chatAreaWidth - 100))}px`,
                    minWidth: '280px',
                    top: `${dropdownPosition.top}px`,
                    right: `${dropdownPosition.right}px`,
                    maxHeight: 'calc(100vh - 80px)'
                  }}
                >
                  <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Chat History</h3>
                    <button
                      onClick={handleNewChat}
                      className="p-1.5 rounded-lg hover:bg-purple-50 text-[#4D0080] transition-colors"
                      title="New Chat"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Conversations List */}
                  <div className="flex-1 overflow-y-auto p-2">
                    {isLoadingConversations ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-5 h-5 text-[#4D0080] animate-spin" />
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-sm">
                        No conversations yet. Start a new chat!
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {conversations.map((conv) => (
                          <div
                            key={conv.id}
                            onClick={() => {
                              handleSelectConversation(conv.id);
                              setShowHistoryDropdown(false);
                            }}
                            className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${currentConversationId === conv.id
                                ? 'bg-purple-100 border border-purple-300'
                                : 'hover:bg-slate-100 border border-transparent'
                              }`}
                          >
                            {editingTitleId === conv.id ? (
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onBlur={() => handleSaveTitle(conv.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveTitle(conv.id);
                                  } else if (e.key === 'Escape') {
                                    setEditingTitleId(null);
                                  }
                                }}
                                className="w-full px-2 py-1 text-sm border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                      <p className="text-sm font-medium text-slate-900 truncate">
                                        {conv.title}
                                      </p>
                                    </div>
                                    {conv.preview && (
                                      <p className="text-xs text-slate-500 truncate ml-6">
                                        {conv.preview}
                                      </p>
                                    )}
                                    <p className="text-xs text-slate-400 mt-1 ml-6">
                                      {formatDate(conv.updatedAt)}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => handleEditTitle(conv, e)}
                                      className="p-1 hover:bg-slate-200 rounded transition-colors"
                                      title="Edit title"
                                    >
                                      <Edit2 className="w-3 h-3 text-slate-500" />
                                    </button>
                                    <button
                                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                                      className="p-1 hover:bg-red-100 rounded transition-colors"
                                      title="Delete conversation"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-500" />
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                , document.body
              )}
            </div>

            <button
              onClick={handleNewChat}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="New Chat"
            >
              <Plus className="w-4 h-4 text-slate-500" />
            </button>
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
              <Loader2 className="w-6 h-6 text-[#4D0080] animate-spin" />
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
                  className={`max-w-[80%] rounded-lg px-4 py-2 break-words ${message.role === 'user'
                      ? 'bg-[#4D0080] text-white'
                      : message.isError
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : 'bg-white text-slate-900 border border-slate-200'
                    }`}
                >
                  {message.role === 'assistant' && message.action && (
                    <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-200">
                      {message.isError ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        getActionIcon(message.action)
                      )}
                      <span className="text-xs font-medium text-slate-600">
                        {message.isError ? 'ERROR' : message.action.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  )}
                  {message.isError && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Lightbulb className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-yellow-800 mb-2">
                            Help the AI learn! If you perform this action manually, we can record it so the AI does it correctly next time.
                          </p>
                          {message.patternId ? (
                            <button
                              onClick={() => {
                                const userCmd = (message as any).userCommand || 'Previous command';
                                const failedAct = message.failedAction || message.action || '';
                                const failedParams = message.failedParameters || message.parameters || {};
                                handleShowCorrection(message.patternId!, userCmd, failedAct, failedParams);
                              }}
                              className="text-xs px-3 py-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors flex items-center space-x-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Record Correction</span>
                            </button>
                          ) : (
                            <p className="text-xs text-yellow-700 italic">
                              Perform the action manually and the system will auto-detect it within 5 minutes.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm break-words">
                    {(() => {
                      if (typeof message.content === 'string') {
                        return renderTextWithLinks(message.content);
                      }
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
                      {message.searchResults.map((doc: any, idx: number) => {
                        // For e-sign envelopes, use metadata.name first, then documentName, then metadata.subject
                        const displayName = (doc.serviceType === 'e-sign-service' || doc.source === 'e-sign-service' || doc.documentType === 'envelope')
                          ? (doc.metadata?.name || doc.documentName || doc.metadata?.subject || doc.name || doc.documentId)
                          : (doc.documentName || doc.name || doc.documentId);

                        return (
                          <button
                            key={idx}
                            onClick={() => handleDocumentClick(
                              doc.documentId,
                              displayName,
                              doc.serviceType,
                              doc.documentType
                            )}
                            className="w-full text-left p-2 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#4D0080] transition-all group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-semibold text-[#4D0080]">#{idx + 1}</span>
                                  <p className="text-sm font-medium text-slate-900 truncate group-hover:text-[#4D0080]">
                                    {displayName}
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
                              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#4D0080] flex-shrink-0 ml-2" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center justify-center h-full">
                <span className="text-sm text-[#4D0080] font-medium">
                  Thinking
                  <span className="inline-block w-[1ch] animate-dot"><Dot className="w-2 h-2" /></span>
                  <span className="inline-block w-[1ch] animate-dot animation-delay-200"><Dot className="w-2 h-2" /></span>
                  <span className="inline-block w-[1ch] animate-dot animation-delay-400"><Dot className="w-2 h-2" /></span>
                </span>
              </div>

            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-200 bg-white overflow-x-hidden">
          {/* Attached Files Display */}
          {attachedFiles.length > 0 && (
            <div className="mb-2 space-y-1">
              {attachedFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${file.size}-${idx}`}
                  className="p-2 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <Paperclip className="w-4 h-4 text-[#4D0080] flex-shrink-0" />
                    <span className="text-sm text-slate-700 truncate">
                      {file.name || 'Unknown file'}
                    </span>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(idx)}
                    className="p-1 hover:bg-purple-100 rounded transition-colors flex-shrink-0"
                    title="Remove file"
                  >
                    <XCircle className="w-4 h-4 text-[#4D0080]" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end space-x-2">
            {/* File Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              multiple
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
              placeholder={attachedFiles.length > 0 ? "Write your message and I'll send these document(s)..." : "Type your command... (e.g., 'search documents sent to Receipient Name')"}
              className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent max-h-40 overflow-y-auto"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
              className="p-2 bg-[#4D0080] text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {/* Correction Modal */}
      {showCorrectionModal && currentFailedPattern && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Help AI Learn</h3>
                </div>
                <button
                  onClick={() => {
                    setShowCorrectionModal(false);
                    setCurrentFailedPattern(null);
                  }}
                  className="p-1 hover:bg-slate-100 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            <CorrectionForm
              failedPattern={currentFailedPattern}
              onRecord={handleRecordCorrection}
              onCancel={() => {
                setShowCorrectionModal(false);
                setCurrentFailedPattern(null);
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Correction Form Component
interface CorrectionFormProps {
  failedPattern: {
    patternId: string;
    userCommand: string;
    failedAction: string;
    failedParameters: any;
  };
  onRecord: (correction: { action: string; parameters: any; description?: string }) => void;
  onCancel: () => void;
}

const CorrectionForm: React.FC<CorrectionFormProps> = ({ failedPattern, onRecord, onCancel }) => {
  const [action, setAction] = useState(failedPattern.failedAction || '');
  const [parameters, setParameters] = useState(JSON.stringify(failedPattern.failedParameters || {}, null, 2));
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);

  // Try to auto-detect correction from recent user actions
  useEffect(() => {
    const detectCorrection = async () => {
      try {
        // Get recent patterns for this command to see if auto-detection already matched
        const patterns = await aiAssistantApiService.getLearnedPatterns(failedPattern.userCommand);
        if (patterns.data && patterns.data.length > 0) {
          const recentPattern = patterns.data.find((p: any) => 
            p.failedCommand === failedPattern.userCommand && 
            p.correctAction && 
            p.correctParameters
          );
          if (recentPattern && recentPattern.correctAction) {
            setAction(recentPattern.correctAction);
            setParameters(JSON.stringify(recentPattern.correctParameters, null, 2));
            setAutoDetected(true);
            setDescription('Automatically detected from your recent action');
          }
        }
      } catch (error) {
        console.error('Error detecting correction:', error);
      }
    };

    detectCorrection();
  }, [failedPattern]);

  const handleSubmit = async () => {
    try {
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(parameters);
      } catch (e) {
        toast.error('Invalid JSON in parameters. Please fix the format.');
        return;
      }

      setIsSubmitting(true);
      await onRecord({
        action,
        parameters: parsedParams,
        description: description.trim() || undefined
      });
    } catch (error) {
      console.error('Error submitting correction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <p className="text-sm text-slate-600 mb-2">
          <strong>Your Command:</strong> "{failedPattern.userCommand}"
        </p>
        <p className="text-sm text-slate-600 mb-4">
          <strong>AI Attempted:</strong> {failedPattern.failedAction}
        </p>
        {autoDetected && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-800">
                We detected you performed this action manually. The correction has been pre-filled below.
              </p>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Correct Action *
        </label>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="search_document">Search Document</option>
          <option value="send_document">Send Document</option>
          <option value="prepare_document">Prepare Document</option>
          <option value="create_and_send_envelope">Create and Send Envelope</option>
          <option value="list_auth_providers">List Auth Providers</option>
          <option value="generate_document">Generate Document</option>
          <option value="list_documents_by_category">List Documents by Category</option>
          <option value="list_shared_documents">List Shared Documents</option>
          <option value="list_signed_documents">List Signed Documents</option>
          <option value="select_document">Select Document</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Correct Parameters (JSON) *
        </label>
        <textarea
          value={parameters}
          onChange={(e) => setParameters(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
          rows={8}
          placeholder='{"recipients": [{"email": "user@example.com", "name": "User"}], "signatureFields": [...]}'
        />
        <p className="text-xs text-slate-500 mt-1">
          Enter the correct parameters as JSON. This is what the AI should have used.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          rows={3}
          placeholder="Describe what you did to complete this action correctly..."
        />
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!action || !parameters || isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-[#4D0080] rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Recording...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Record Correction</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AIAssistantPanel;

