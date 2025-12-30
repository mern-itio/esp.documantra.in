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
          // Auto-open most recent active ticket
          const activeTicket = response.data.data.tickets.find((t: any) => t.status !== 'closed');
          if (activeTicket) {
            handleOpenTicket(activeTicket);
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
      // Check if ticket is closed - if so, show message and don't allow opening
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

      // Messages will be loaded automatically by context when currentTicket changes
      // Just join the socket room for real-time updates
      if (isConnected && socket) {
        joinTicket(ticket._id);
      } else {
        // Wait a bit if socket not connected yet
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
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-50 bg-[#260559] hover:bg-[#260559]/90 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
          aria-label="Open support chat"
        >
          <MessageSquare className="w-6 h-6" />
          {!isConnected && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div
          ref={chatContainerRef}
          className={`fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-2xl transition-all ${isMinimized ? 'h-14 w-80' : 'h-[600px] w-96'
            } flex flex-col`}
        >
          {/* Header */}
          <div className="bg-[#260559] text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span className="font-semibold">Support Chat</span>
              {!isConnected && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-white/20 rounded p-1"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  leaveTicket();
                }}
                className="hover:bg-white/20 rounded p-1"
              >
                <X className="w-4 h-4" />
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
                      <h3 className="font-semibold text-lg">Create New Ticket</h3>
                      <input
                        type="text"
                        placeholder="Subject"
                        value={newTicketSubject}
                        onChange={(e) => setNewTicketSubject(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <select
                        value={newTicketCategory}
                        onChange={(e) => setNewTicketCategory(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-white"
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
                        className="w-full px-3 py-2 border rounded-lg h-32"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateTicket}
                          className="flex-1 bg-[#260559] text-white px-4 py-2 rounded-lg hover:bg-[#260559]/90"
                        >
                          Create Ticket
                        </button>
                        <button
                          onClick={() => setShowCreateTicket(false)}
                          className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold">Your Tickets</h3>
                        <button
                          onClick={() => setShowCreateTicket(true)}
                          className="text-[#260559] hover:underline text-sm"
                        >
                          New Ticket
                        </button>
                      </div>
                      <div className="space-y-2">
                        {tickets.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No tickets yet. Create one to get started!</p>
                        ) : (
                          tickets.map((ticket) => (
                            <button
                              key={ticket._id}
                              onClick={() => handleOpenTicket(ticket)}
                              className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-sm">{ticket.subject}</span>
                                <span className={`text-xs px-2 py-1 rounded ${ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                                  ticket.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                  {ticket.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 truncate">{ticket.ticketNumber}</p>
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
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {/* Ticket Info */}
                    <div className="bg-white p-3 rounded-lg border">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-[15px]">{currentTicket.subject}</span>
                        <span className={`text-[9px] px-2 py-1 rounded ${currentTicket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                          currentTicket.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                          {currentTicket.status}
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-500">{currentTicket.ticketNumber}</p>
                    </div>

                    {/* Messages */}
                    {messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[90%] rounded-lg p-2 ${msg.senderType === 'customer'
                            ? 'bg-[#260559] text-white'
                            : msg.senderType === 'ai'
                              ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200'
                              : 'bg-white border'
                            }`}
                        >
                          {/* AI Badge */}
                          {msg.senderType === 'ai' && (
                            <div className="flex items-center gap-2 mb-2">
                              <Bot className="w-4 h-4 text-purple-600" />
                              <span className="text-xs font-semibold text-purple-600">AI Assistant</span>
                            </div>
                          )}
                          {/* Only show text content if it's not just a file upload notification */}
                          {msg.content && !(msg.messageType === 'file' && msg.content.startsWith('Uploaded:')) && (
                            <p className={`text-sm whitespace-pre-wrap break-words ${msg.senderType === 'ai' ? 'text-gray-800' : ''
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

                                const supportServiceUrl = import.meta.env.VITE_SUPPORT_SERVICE_URL || 'http://165.22.215.73:2107';
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
                                          className={`max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${isCustomerMessage
                                            ? 'border border-white/30'
                                            : 'border border-gray-300'
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
                                                ? 'inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/30 bg-white/10 text-white hover:bg-white/20 transition-colors text-sm'
                                                : 'inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm';
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
                                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${isCustomerMessage
                                          ? 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                                          : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'
                                          }`}
                                      >
                                        <Paperclip className="w-4 h-4" />
                                        <span className="font-medium">{att.originalName || 'Download file'}</span>
                                        {att.size && (
                                          <span className={`text-xs ${isCustomerMessage ? 'opacity-70' : 'text-gray-500'}`}>
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
                          <p className="text-[9px] mt-1 opacity-70 text-right">
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
                        <div className="bg-white border rounded-lg p-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Closed Ticket Message */}
                  {currentTicket?.status === 'closed' && (
                    <div className="mx-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-yellow-900 mb-2">
                            Current ticket is closed
                          </p>
                          <p className="text-xs text-yellow-700 mb-3">
                            This ticket has been closed. Create a new ticket to continue the conversation.
                          </p>
                          <button
                            onClick={() => {
                              setCurrentTicket(null);
                              setShowCreateTicket(true);
                            }}
                            className="px-4 py-2 bg-[#260559] text-white text-sm rounded-lg hover:bg-[#260559]/90 transition-colors font-medium"
                          >
                            Create New Ticket
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rating Modal */}
                  {isRating && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="font-semibold text-lg mb-4">Rate Your Experience</h3>
                        <div className="flex gap-2 mb-4">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setRating(star)}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                  }`}
                              />
                            </button>
                          ))}
                        </div>
                        <textarea
                          placeholder="Optional feedback..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg mb-4"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSubmitRating}
                            disabled={!rating}
                            className="flex-1 bg-[#260559] text-white px-4 py-2 rounded-lg hover:bg-[#260559]/90 disabled:opacity-50"
                          >
                            Submit
                          </button>
                          <button
                            onClick={() => setIsRating(false)}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Input Area - Only show when ticket is not closed */}
                  {currentTicket?.status !== 'closed' && (
                    <div className="border-t bg-white">
                      {/* Pending Attachments Preview */}
                      {pendingAttachments.length > 0 && (
                        <div className="p-3 border-b bg-gray-50 space-y-2">
                          <div className="text-xs text-gray-600 mb-2">Attachments ({pendingAttachments.length}):</div>
                          {pendingAttachments.map((att, idx) => {
                            const supportServiceUrl = import.meta.env.VITE_SUPPORT_SERVICE_URL || 'http://165.22.215.73:2107';
                            const filePath = att.path.startsWith('/') ? att.path.substring(1) : att.path;
                            const fileUrl = `${supportServiceUrl}/uploads/${filePath}`;
                            const isImage = att.mimeType?.startsWith('image/');

                            return (
                              <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                                {isImage ? (
                                  <img
                                    src={fileUrl}
                                    alt={att.originalName}
                                    className="w-12 h-12 object-cover rounded"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                    <Paperclip className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">{att.originalName}</div>
                                  {att.size && (
                                    <div className="text-xs text-gray-500">{(att.size / 1024).toFixed(1)} KB</div>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleRemovePendingAttachment(idx)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                  title="Remove attachment"
                                >
                                  <X className="w-4 h-4" />
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
                            className="flex-1 resize-none px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#260559] max-h-32 overflow-y-auto text-sm"
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
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingFile}
                            className="p-2 text-gray-500 hover:text-[#260559] disabled:opacity-50"
                            title="Attach file"
                          >
                            <Paperclip className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleSendMessage}
                            disabled={(!messageInput.trim() && pendingAttachments.length === 0) || uploadingFile}
                            className="bg-[#260559] text-white p-2 rounded-lg hover:bg-[#260559]/90 disabled:opacity-50"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="mt-2 text-[11px] text-gray-500">
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

