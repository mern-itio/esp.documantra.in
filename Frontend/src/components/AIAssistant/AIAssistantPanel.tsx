import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Bot, Loader2, Search, Mail, FileEdit, Trash2, ExternalLink, Paperclip, XCircle, Plus, MessageSquare, Edit2, History } from 'lucide-react';
import { aiAssistantApiService }from '../../services/aiAssistantService';
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

  // Auto‑resize the textarea as the user types (similar to chat apps)
  const autoResizeTextarea = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  // Load conversations list and current conversation on mount and when panel opens
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

  // Load conversation when currentConversationId changes
  useEffect(() => {
    if (isOpen && currentConversationId) {
      loadConversationHistory(currentConversationId);
    }
  }, [currentConversationId, isOpen]);

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

  // Recalculate textarea height whenever the input text changes
  useEffect(() => {
    autoResizeTextarea();
  }, [input]);

  // Handle chat area resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Calculate chat area width from the right edge
      const newChatWidth = window.innerWidth - e.clientX;
      // Constrain width between 400px and 1200px for chat area
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

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (showHistoryDropdown && historyButtonRef.current) {
      const buttonRect = historyButtonRef.current.getBoundingClientRect();
      const rightPosition = window.innerWidth - buttonRect.right;
      
      setDropdownPosition({
        top: buttonRect.bottom + 8, // 8px gap (mt-2)
        right: Math.max(10, rightPosition) // Ensure at least 10px from edge
      });
    }
  }, [showHistoryDropdown, chatAreaWidth]);

  // Close history dropdown when clicking outside
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
        // If no current conversation is set, use the most recent one
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
          // Reconstruct messages with proper formatting
          const reconstructedMessages: SearchResultMessage[] = response.messages.map((msg: any) => {
          // Ensure content is always a string (not JSON or object)
          let content: string = '';
          
          // Priority 1: Use stored formatted content if it's already a string (backend stores formatted content)
          if (typeof msg.content === 'string' && msg.content.trim()) {
            content = msg.content;
            
            // Only try to re-format if content looks like raw JSON (starts with { or [)
            // Otherwise, trust the stored formatted content from backend
            const trimmed = content.trim();
            if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && msg.action) {
              // This might be raw JSON that needs formatting
              try {
                const parsed = JSON.parse(content);
                if (parsed && typeof parsed === 'object') {
                  // Re-format using formatActionResult
                  const formatted = formatActionResult({
                    action: msg.action,
                    parameters: msg.parameters || {},
                    result: parsed
                  } as AICommandResponse);
                  content = formatted;
                }
              } catch (e) {
                // If parsing fails, keep the original formatted string
              }
            }
          }
          // Priority 2: If no stored content or content is empty, try to reconstruct from _resultData
          else if (!content && msg.parameters?._resultData && msg.action) {
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
          // Priority 3: If content is an object, try to format it
          else if (msg.content && typeof msg.content === 'object') {
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
          }
          // Priority 4: Final fallback
          else {
            content = String(msg.content || '');
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

    // Add user message to UI immediately (include file info if attached)
    const fileLabel = attachedFiles.length === 1
      ? `[File: ${attachedFiles[0].name}]`
      : attachedFiles.length > 1
        ? `[Files: ${attachedFiles.map(f => f.name).join(', ')}]`
        : '';

    const userMessageContent = attachedFiles.length > 0
      ? `${userMessage || 'Send this document'} ${fileLabel}`.trim()
      : userMessage;
    
    const newUserMessage: ConversationMessage = {
      role: 'user',
      content: userMessageContent,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const response: AICommandResponse = await aiAssistantApiService.processCommand(
        userMessage || 'Send this document', 
        attachedFiles, 
        undefined, 
        currentConversationId || undefined
      );
      
      // Update conversation ID if returned from backend
      if (response.conversationId && response.conversationId !== currentConversationId) {
        setCurrentConversationId(response.conversationId);
        // Reload conversations list to get updated titles
        loadConversationsList();
      }

      // Only clear attached files when an action has actually been identified/executed.
      // For pure clarification turns we keep the files so the user doesn't need to reattach them.
      if (response.action && !response.clarification) {
        setAttachedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }

      // If an envelope was created/sent via AI, refresh subscription credits and notify listeners to refresh envelopes
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

        // Notify envelope lists (e.g., AgreementPage) that new envelopes are available
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
          
          // Also dispatch a specific event for document sending
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

  // Render plain text content but turn URLs and document links into clickable links.
  const renderTextWithLinks = (text: string) => {
    if (!text) return null;

    // Pattern to match document links: [[doc:name:id:serviceType:docType]]
    const docLinkRegex = /\[\[doc:([^:]+):([^:]+):([^:]+):([^\]]+)\]\]/g;
    // Pattern to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // First, replace document links with placeholders, then split by URLs
    const docLinkPlaceholders: Array<{ placeholder: string; name: string; id: string; serviceType: string; docType: string }> = [];
    let processedText = text;
    let placeholderIndex = 0;
    
    // Replace document links with placeholders
    processedText = processedText.replace(docLinkRegex, ( name, id, serviceType, docType) => {
      const placeholder = `__DOC_LINK_${placeholderIndex}__`;
      docLinkPlaceholders.push({ placeholder, name, id, serviceType, docType });
      placeholderIndex++;
      return placeholder;
    });
    
    // Split by URLs
    const parts = processedText.split(urlRegex);

    return parts.map((part, index) => {
      // Check if this part is a URL
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
            className="text-purple-600 underline break-all"
          >
            {label}
          </a>
        );
      }
      
      // Check if this part contains document link placeholders
      if (part.includes('__DOC_LINK_')) {
        // Split by placeholders and render each part
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
                      className="text-purple-600 underline cursor-pointer hover:text-purple-800"
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
      
      // Regular text
      return <span key={index}>{part}</span>;
    });
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
        // If deleted conversation was current, switch to most recent or create new
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
      {/* Resize Handle - Always visible on left edge */}
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-visible">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-white relative">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-900">AI Assistant</h2>
          </div>
          <div className="flex items-center space-x-2">
            {/* History Dropdown Button */}
            <div className="relative">
              <button
                ref={historyButtonRef}
                onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                className={`p-1.5 rounded-lg transition-colors ${
                  showHistoryDropdown ? 'bg-purple-100 text-purple-600' : 'hover:bg-slate-100 text-slate-500'
                }`}
                title="Chat History"
              >
                <History className="w-4 h-4" />
              </button>
              
              {/* History Dropdown - Rendered via Portal to prevent cutoff */}
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
                  {/* Dropdown Header */}
                  <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Chat History</h3>
                    <button
                      onClick={handleNewChat}
                      className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
                      title="New Chat"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Conversations List */}
                  <div className="flex-1 overflow-y-auto p-2">
                    {isLoadingConversations ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
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
                            className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                              currentConversationId === conv.id
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
                      return renderTextWithLinks(message.content);
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
        {/* Attached Files Display */}
        {attachedFiles.length > 0 && (
          <div className="mb-2 space-y-1">
            {attachedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${file.size}-${idx}`}
                className="p-2 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <Paperclip className="w-4 h-4 text-purple-600 flex-shrink-0" />
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
                  <XCircle className="w-4 h-4 text-purple-600" />
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
            placeholder={attachedFiles.length > 0 ? "Write your message and I'll send these document(s)..." : "Type your command... (e.g., 'search documents sent to Rahul')"}
            className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent max-h-40 overflow-y-auto"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
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
    </div>
  );
};

export default AIAssistantPanel;

