import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Send, Paperclip, Star, Minimize2, Maximize2, AlertCircle, Bot } from 'lucide-react';
import { useSupportChat } from '../../context/SupportChatContext';
import { supportCustomerApi } from '../../services/supportService';
import toast from 'react-hot-toast';
import { useAuth } from '../AuthService/AuthContext';

const CustomerChatWidget: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const {
    socket,
    isConnected,
    currentTicket,
    messages,
    typingUsers,
    joinTicket,
    leaveTicket,
    sendMessage,
    setTyping,
    createTicket,
    setCurrentTicket
  } = useSupportChat();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<string>('other');
  const [isRating, setIsRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    uploadedAt?: Date;
  }>>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Load tickets on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadTickets();
    }
  }, [isAuthenticated]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Monitor ticket status and clear input if ticket becomes closed
  useEffect(() => {
    if (currentTicket?.status === 'closed') {
      setMessageInput(''); // Clear any input when ticket is closed
    }
  }, [currentTicket?.status]);

  // Auto‑resize the chat message textarea as the user types
  const autoResizeMessageInput = () => {
    const el = messageInputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    autoResizeMessageInput();
  }, [messageInput, currentTicket?._id, isOpen]);

  // Load tickets from API
  const loadTickets = async () => {
    try {
      const response = await supportCustomerApi.getTickets();
      if (response.data?.data?.tickets) {
        setTickets(response.data.data.tickets);

        // If current ticket exists, update its status from the API response
        if (currentTicket) {
          const updatedTicket = response.data.data.tickets.find((t: any) => t._id === currentTicket._id);
          if (updatedTicket) {
            // Update the ticket with latest data, especially status
            setCurrentTicket(updatedTicket);
            // If ticket is now closed, clear input
            if (updatedTicket.status === 'closed') {
              setMessageInput('');
            }
          }
        } else {
          const activeTicket = response.data.data.tickets.find((t: any) => t.status !== 'closed');
          if (activeTicket) {
            setCurrentTicket(activeTicket);
          }
        }
      }
    } catch (error: any) {
      console.error('Error loading tickets:', error);
    }
  };

  // Open ticket and join socket room
  const handleOpenTicket = async (ticket: any) => {
    try {
      if (ticket.status === 'closed') {
        setCurrentTicket(ticket); // Set it so we can show the closed message
        setIsOpen(true);
        setIsMinimized(false);
        toast.error('This ticket is closed. Please create a new ticket to continue.');
        return;
      }

      setCurrentTicket(ticket);
      setIsOpen(true);
      setIsMinimized(false);

      if (isConnected && socket) {
        joinTicket(ticket._id);
      } else {
        setTimeout(() => {
          if (socket) {
            joinTicket(ticket._id);
          }
        }, 500);
      }
    } catch (error: any) {
      console.error('Error opening ticket:', error);
      toast.error('Failed to open ticket');
    }
  };

  const handleSendMessage = async () => {
    if (!currentTicket) return;

    // Prevent sending messages to closed tickets
    if (currentTicket.status === 'closed') {
      toast.error('This ticket is closed. Please create a new ticket to continue.');
      setCurrentTicket(null);
      setShowCreateTicket(true);
      return;
    }

    // Don't send if there's no message and no attachments
    if (!messageInput.trim() && pendingAttachments.length === 0) return;

    const content = messageInput.trim() || (pendingAttachments.length > 0
      ? `Uploaded: ${pendingAttachments.map(a => a.originalName).join(', ')}`
      : '');

    const attachmentsToSend = [...pendingAttachments];

    // Clear input and pending attachments
    setMessageInput('');
    setPendingAttachments([]);

    // Send message with attachments
    await sendMessage(content, attachmentsToSend.length > 0 ? 'file' : 'text', attachmentsToSend);
    setTyping(false);
  };

  const handleTyping = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    setTyping(true);
  }, [setTyping]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentTicket) return;

    // Prevent uploading files to closed tickets
    if (currentTicket.status === 'closed') {
      toast.error('This ticket is closed. Please create a new ticket to continue.');
      setCurrentTicket(null);
      setShowCreateTicket(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setUploadingFile(true);
    try {
      const response = await supportCustomerApi.uploadFile(currentTicket._id, file);
      if (response.data?.data?.attachment) {
        const attachment = response.data.data.attachment;
        // Add to pending attachments instead of sending immediately
        setPendingAttachments(prev => [...prev, attachment]);
        toast.success('File added. Add a message and send when ready.');
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePendingAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateTicket = async () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) {
      toast.error('Please fill in both subject and message');
      return;
    }

    const ticket = await createTicket(newTicketSubject, newTicketMessage, newTicketCategory);
    if (ticket) {
      setShowCreateTicket(false);
      setNewTicketSubject('');
      setNewTicketMessage('');
      setNewTicketCategory('other');
      await loadTickets();
      // Wait for ticket to be set in context before showing success
      setTimeout(() => {
        toast.success('Ticket created successfully');
      }, 600);
    }
  };


  const handleSubmitRating = async () => {
    if (!rating || !currentTicket) return;

    try {
      await supportCustomerApi.submitRating(currentTicket._id, { score: rating, feedback });
      toast.success('Thank you for your feedback!');
      setIsRating(false);
      setRating(0);
      setFeedback('');
      await loadTickets();
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    }
  };

  // Check if ticket can be rated
  useEffect(() => {
    if (currentTicket?.status === 'closed' && !currentTicket?.rating?.score) {
      setIsRating(true);
    }
  }, [currentTicket]);

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-50 rounded-full bg-primary p-4 text-primary-foreground shadow-lg transition-all hover:scale-110 hover:bg-primary/90"
          aria-label="Open support chat"
        >
          <MessageSquare className="h-6 w-6" />
          {!isConnected && (
            <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-destructive" />
          )}
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div
          ref={chatContainerRef}
          className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-lg border border-border bg-card text-card-foreground shadow-2xl transition-all ${isMinimized ? 'h-14 w-80' : 'h-[600px] w-96'
            }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-lg bg-primary p-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <span className="font-semibold">Support Chat</span>
              {!isConnected && (
                <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="rounded p-1 hover:bg-primary-foreground/15"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  leaveTicket();
                }}
                className="rounded p-1 hover:bg-primary-foreground/15"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {!currentTicket ? (
                // Ticket List / Create Ticket
                <div className="flex-1 overflow-y-auto p-4">
                  {showCreateTicket ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Create New Ticket</h3>
                      <input
                        type="text"
                        placeholder="Subject"
                        value={newTicketSubject}
                        onChange={(e) => setNewTicketSubject(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <select
                        value={newTicketCategory}
                        onChange={(e) => setNewTicketCategory(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="technical">Technical</option>
                        <option value="billing">Billing</option>
                        <option value="documentation">Documentation</option>
                        <option value="feature">Feature Request</option>
                        <option value="bug">Bug Report</option>
                        <option value="other">Other</option>
                      </select>
                      <textarea
                        placeholder="Describe your issue..."
                        value={newTicketMessage}
                        onChange={(e) => setNewTicketMessage(e.target.value)}
                        className="h-32 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleCreateTicket}
                          className="flex-1 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                        >
                          Create Ticket
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCreateTicket(false)}
                          className="rounded-lg border border-border px-4 py-2 hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">Your Tickets</h3>
                        <button
                          type="button"
                          onClick={() => setShowCreateTicket(true)}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          New Ticket
                        </button>
                      </div>
                      <div className="space-y-2">
                        {tickets.length === 0 ? (
                          <p className="py-8 text-center text-sm text-muted-foreground">No tickets yet. Create one to get started!</p>
                        ) : (
                          tickets.map((ticket) => (
                            <button
                              type="button"
                              key={ticket._id}
                              onClick={() => handleOpenTicket(ticket)}
                              className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/60"
                            >
                              <div className="mb-1 flex items-start justify-between">
                                <span className="text-sm font-medium text-foreground">{ticket.subject}</span>
                                <span className={`rounded px-2 py-1 text-xs font-medium ${
                                  ticket.status === 'open'
                                    ? 'border border-amber-500/35 bg-amber-500/15 text-amber-900 dark:text-amber-100'
                                    : ticket.status === 'ongoing'
                                      ? 'border border-success/30 bg-success/10 text-success'
                                      : 'border border-border bg-muted text-muted-foreground'
                                  }`}>
                                  {ticket.status}
                                </span>
                              </div>
                              <p className="truncate text-xs text-muted-foreground">{ticket.ticketNumber}</p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Messages Area */}
                  <div className="flex-1 space-y-4 overflow-y-auto bg-muted/30 p-4">
                    {/* Ticket Info */}
                    <div className="rounded-lg border border-border bg-card p-3">
                      <div className="mb-1 flex items-start justify-between">
                        <span className="text-[15px] font-semibold text-foreground">{currentTicket.subject}</span>
                        <span className={`rounded px-2 py-1 text-[9px] font-medium ${
                          currentTicket.status === 'open'
                            ? 'border border-amber-500/35 bg-amber-500/15 text-amber-900 dark:text-amber-100'
                            : currentTicket.status === 'ongoing'
                              ? 'border border-success/30 bg-success/10 text-success'
                              : 'border border-border bg-muted text-muted-foreground'
                          }`}>
                          {currentTicket.status}
                        </span>
                      </div>
                      <p className="text-[9px] text-muted-foreground">{currentTicket.ticketNumber}</p>
                    </div>

                    {/* Messages */}
                    {messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[90%] rounded-lg p-2 ${msg.senderType === 'customer'
                            ? 'bg-primary text-primary-foreground'
                            : msg.senderType === 'ai'
                              ? 'border border-primary/25 bg-primary/10'
                              : 'border border-border bg-card text-foreground'
                            }`}
                        >
                          {/* AI Badge */}
                          {msg.senderType === 'ai' && (
                            <div className="mb-2 flex items-center gap-2">
                              <Bot className="h-4 w-4 text-primary" />
                              <span className="text-xs font-semibold text-primary">AI Assistant</span>
                            </div>
                          )}
                          {/* Only show text content if it's not just a file upload notification */}
                          {msg.content && !(msg.messageType === 'file' && msg.content.startsWith('Uploaded:')) && (
                            <p className={`whitespace-pre-wrap break-words text-sm ${msg.senderType === 'ai' ? 'text-foreground' : ''
                              }`}>{msg.content}</p>
                          )}
                          {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {msg.attachments.map((att, idx) => {
                                if (!att || !att.path) return null;

                                // Handle both relative and absolute paths
                                let filePath = att.path;
                                // If path is absolute, extract relative part
                                if (filePath.includes('uploads')) {
                                  const uploadsIndex = filePath.indexOf('uploads');
                                  filePath = filePath.substring(uploadsIndex + 'uploads'.length);
                                  if (filePath.startsWith('/') || filePath.startsWith('\\')) {
                                    filePath = filePath.substring(1);
                                  }
                                  // Normalize path separators
                                  filePath = filePath.replace(/\\/g, '/');
                                }

                                // Ensure path doesn't start with /
                                if (filePath.startsWith('/')) {
                                  filePath = filePath.substring(1);
                                }

                                const supportServiceUrl = import.meta.env.VITE_SUPPORT_SERVICE_URL || 'https://esp.documantra.in/support';
                                const fileUrl = `${supportServiceUrl}/uploads/${filePath}`;
                                const isImage = att.mimeType?.startsWith('image/');

                                const isCustomerMessage = msg.senderType === 'customer';

                                return (
                                  <div key={idx || `att-${idx}`} className="mt-2">
                                    {isImage ? (
                                      <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block mt-2"
                                      >
                                        <img
                                          src={fileUrl}
                                          alt={att.originalName || 'Image attachment'}
                                          className={`max-h-[250px] max-w-full cursor-pointer rounded-lg transition-opacity hover:opacity-90 ${isCustomerMessage
                                            ? 'border border-white/30'
                                            : 'border border-border'
                                            }`}
                                          style={{ maxHeight: '250px', maxWidth: '100%' }}
                                          onError={(e) => {
                                            console.error('Failed to load image:', fileUrl);
                                            // Hide broken image and show fallback link
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                              const fallback = document.createElement('a');
                                              fallback.href = fileUrl;
                                              fallback.target = '_blank';
                                              fallback.rel = 'noopener noreferrer';
                                              fallback.className = isCustomerMessage
                                                ? 'inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition-colors text-sm'
                                                : 'inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted text-foreground hover:bg-muted/80 transition-colors text-sm';
                                              fallback.innerHTML = `
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                                                </svg>
                                                <span>${att.originalName || 'Download image'}</span>
                                              `;
                                              parent.appendChild(fallback);
                                            }
                                          }}
                                        />
                                      </a>
                                    ) : (
                                      <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${isCustomerMessage
                                          ? 'border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20'
                                          : 'border-border bg-muted text-foreground hover:bg-muted/80'
                                          }`}
                                      >
                                        <Paperclip className="w-4 h-4" />
                                        <span className="font-medium">{att.originalName || 'Download file'}</span>
                                        {att.size && (
                                          <span className={`text-xs ${isCustomerMessage ? 'opacity-70' : 'text-muted-foreground'}`}>
                                            ({(att.size / 1024).toFixed(1)} KB)
                                          </span>
                                        )}
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <p className={`mt-1 text-[9px] ${msg.senderType === 'customer' ? 'text-right text-primary-foreground/75' : 'text-right text-muted-foreground'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>

                        </div>
                      </div>
                    ))}

                    {/* Typing Indicator */}
                    {typingUsers.size > 0 && (
                      <div className="flex justify-start">
                        <div className="rounded-lg border border-border bg-card p-3">
                          <div className="flex gap-1">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: '0ms' }} />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: '150ms' }} />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Closed Ticket Message */}
                  {currentTicket?.status === 'closed' && (
                    <div className="mx-4 mb-4 rounded-lg border border-amber-500/35 bg-amber-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700 dark:text-amber-300" />
                        <div className="flex-1">
                          <p className="mb-2 text-sm font-medium text-amber-950 dark:text-amber-100">
                            Current ticket is closed
                          </p>
                          <p className="mb-3 text-xs text-amber-900/90 dark:text-amber-200/90">
                            This ticket has been closed. Create a new ticket to continue the conversation.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentTicket(null);
                              setShowCreateTicket(true);
                            }}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                          >
                            Create New Ticket
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rating Modal */}
                  {isRating && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                      <div className="mx-4 w-full max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg">
                        <h3 className="mb-4 text-lg font-semibold">Rate Your Experience</h3>
                        <div className="mb-4 flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setRating(star)}
                              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                            >
                              <Star
                                className={`h-8 w-8 ${star <= rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                                  }`}
                              />
                            </button>
                          ))}
                        </div>
                        <textarea
                          placeholder="Optional feedback..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSubmitRating}
                            disabled={!rating}
                            className="flex-1 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            Submit
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsRating(false)}
                            className="rounded-lg border border-border px-4 py-2 hover:bg-muted"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Input Area - Only show when ticket is not closed */}
                  {currentTicket?.status !== 'closed' && (
                    <div className="border-t border-border bg-card">
                      {/* Pending Attachments Preview */}
                      {pendingAttachments.length > 0 && (
                        <div className="space-y-2 border-b border-border bg-muted/30 p-3">
                          <div className="mb-2 text-xs text-muted-foreground">Attachments ({pendingAttachments.length}):</div>
                          {pendingAttachments.map((att, idx) => {
                            const supportServiceUrl = import.meta.env.VITE_SUPPORT_SERVICE_URL || 'https://esp.documantra.in/support';
                            const filePath = att.path.startsWith('/') ? att.path.substring(1) : att.path;
                            const fileUrl = `${supportServiceUrl}/uploads/${filePath}`;
                            const isImage = att.mimeType?.startsWith('image/');

                            return (
                              <div key={idx} className="flex items-center gap-2 rounded border border-border bg-card p-2">
                                {isImage ? (
                                  <img
                                    src={fileUrl}
                                    alt={att.originalName}
                                    className="h-12 w-12 rounded object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                                    <Paperclip className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-medium text-foreground">{att.originalName}</div>
                                  {att.size && (
                                    <div className="text-xs text-muted-foreground">{(att.size / 1024).toFixed(1)} KB</div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePendingAttachment(idx)}
                                  className="rounded p-1 text-destructive hover:bg-destructive/10"
                                  title="Remove attachment"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex gap-2 items-end">
                          <textarea
                            ref={messageInputRef}
                            value={messageInput}
                            onChange={handleTyping}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            placeholder="Type a message..."
                            className="max-h-32 flex-1 resize-none overflow-y-auto rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                            rows={1}
                          />
                          <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileUpload}
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingFile}
                            className="p-2 text-muted-foreground hover:text-primary disabled:opacity-50"
                            title="Attach file"
                          >
                            <Paperclip className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleSendMessage}
                            disabled={(!messageInput.trim() && pendingAttachments.length === 0) || uploadingFile}
                            className="rounded-lg bg-primary p-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            <Send className="h-5 w-5" />
                          </button>
                        </div>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Press <span className="font-semibold">Enter</span> to send,&nbsp;
                          <span className="font-semibold">Shift+Enter</span> for a new line.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default CustomerChatWidget;

