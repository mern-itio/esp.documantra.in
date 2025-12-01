import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Send, Paperclip, Star, Minimize2, Maximize2, AlertCircle } from 'lucide-react';
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
    if (!messageInput.trim()) return;
    
    // Prevent sending messages to closed tickets
    if (currentTicket?.status === 'closed') {
      toast.error('This ticket is closed. Please create a new ticket to continue.');
      setCurrentTicket(null);
      setShowCreateTicket(true);
      return;
    }
    
    const content = messageInput.trim();
    setMessageInput('');
    await sendMessage(content);
    setTyping(false);
  };

  const handleTyping = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
        await sendMessage(`Uploaded: ${attachment.originalName}`, 'file', [attachment]);
        toast.success('File uploaded successfully');
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
          className="fixed bottom-6 right-6 z-50 bg-[#260559] hover:bg-[#260559]/90 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
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
          className={`fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-2xl transition-all ${
            isMinimized ? 'h-14 w-80' : 'h-[600px] w-96'
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
                                <span className={`text-xs px-2 py-1 rounded ${
                                  ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
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
                        <span className="font-semibold text-sm">{currentTicket.subject}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          currentTicket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                          currentTicket.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {currentTicket.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{currentTicket.ticketNumber}</p>
                    </div>

                    {/* Messages */}
                    {messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.senderType === 'customer'
                              ? 'bg-[#260559] text-white'
                              : 'bg-white border'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {msg.attachments.map((att, idx) => (
                                <a
                                  key={idx}
                                  href={`${import.meta.env.VITE_SUPPORT_SERVICE_URL || 'http://localhost:2107'}/uploads/${att.path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs underline flex items-center gap-1"
                                >
                                  <Paperclip className="w-3 h-3" />
                                  {att.originalName}
                                </a>
                              ))}
                            </div>
                          )}
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                className={`w-8 h-8 ${
                                  star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
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
                    <div className="border-t p-3 bg-white">
                      <div className="flex gap-2 items-end">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={handleTyping}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Type a message..."
                          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#260559]"
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
                          disabled={!messageInput.trim() || uploadingFile}
                          className="bg-[#260559] text-white p-2 rounded-lg hover:bg-[#260559]/90 disabled:opacity-50"
                        >
                          <Send className="w-5 h-5" />
                        </button>
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

