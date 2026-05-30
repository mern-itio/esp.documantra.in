import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageSquare, Ticket, Users, BarChart3,
  Send, Search, Clock,
  XCircle, AlertCircle, TrendingUp, 
   ArrowLeft,  RefreshCw,
   FolderSync, Star, Power, PowerOff
} from 'lucide-react';
import { supportAgentApi, supportAdminApi } from '../../services/supportService';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
import { SUPPORT_SERVICE_URL } from '../../services/supportService';

interface Ticket {
  _id: string;
  ticketNumber: string;
  customerId: any;
  assignedAgentId?: string;
  subject: string;
  status: 'open' | 'ongoing' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: string;
  lastMessageAt: string;
  rating?: {
    score: number;
    feedback?: string;
  };
}

interface Message {
  _id: string;
  ticketId: string;
  senderId: string;
  senderType: 'customer' | 'agent' | 'system';
  content: string;
  messageType: 'text' | 'file' | 'image';
  attachments?: any[];
  createdAt: string;
  isRead: boolean;
}

interface Agent {
  _id: string;
  email: string;
  fullname: string;
  status: 'online' | 'offline' | 'away';
  isActive: boolean;
  stats: {
    totalTicketsHandled: number;
    averageResponseTime: number;
    averageRating: number;
  };
  currentTickets: number;
}

const SupportDashboard: React.FC = () => {
  const [userRole, setUserRole] = useState<'agent' | 'admin'>('agent');
  const userRoleRef = useRef<'agent' | 'admin'>('agent');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'online' | 'offline' | 'away'>('offline');
  
  // Agent data
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const selectedTicketRef = useRef<Ticket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Keep refs in sync with state
  useEffect(() => {
    selectedTicketRef.current = selectedTicket;
  }, [selectedTicket]);

  useEffect(() => {
    userRoleRef.current = userRole;
  }, [userRole]);

  // Auto-scroll chat container to bottom when new messages arrive or when ticket is selected
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0 && selectedTicket) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom();
      }, 150);
    }
  }, [messages, selectedTicket, scrollToBottom]);
  
  // Admin data
  const [agents, setAgents] = useState<Agent[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'tickets' | 'agents' | 'analytics'>('tickets');
  const [ticketFilter, setTicketFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  // Initialize socket
  useEffect(() => {
    initializeSocket();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Check user role and load data when role is determined
  useEffect(() => {
    checkUserRole();
  }, []);

  // Load data when userRole is determined
  useEffect(() => {
    if (userRole) {
      loadInitialData();
    }
  }, [userRole]);

  // Update socket event handlers when selectedTicket changes
  useEffect(() => {
    if (socket && isConnected && selectedTicket) {
      // Join ticket room when ticket is selected
      console.log('Agent joining ticket room:', selectedTicket._id);
      socket.emit('join_ticket', { ticketId: selectedTicket._id });
    }
  }, [socket, isConnected, selectedTicket]);

  const checkUserRole = async () => {
    // Check if user is admin by trying to access admin endpoints
    try {
      const response = await supportAdminApi.getAllAgents();
      if (response.data?.status === 200) {
        setUserRole('admin');
      }
    } catch (error) {
      setUserRole('agent');
    }
  };

  const initializeSocket = async () => {
    try {
      // First login as agent
      const token = localStorage.getItem('agentToken') || localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Authentication required. Please log in as agent/admin.');
        return;
      }

      const newSocket = io(SUPPORT_SERVICE_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        if (selectedTicket) {
          newSocket.emit('join_ticket', { ticketId: selectedTicket._id });
        }
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('new_message', (data: { message: Message; ticketId: string }) => {
        console.log('Agent dashboard received new_message:', {
          ticketId: data.ticketId,
          messageId: data.message?._id,
          senderType: data.message?.senderType,
          content: data.message?.content?.substring(0, 30)
        });
        
        // Use ref to get current selectedTicket (always up-to-date)
        const currentTicket = selectedTicketRef.current;
        
        if (currentTicket && data.ticketId === currentTicket._id) {
          console.log('✅ Message matches current ticket, adding to UI');
          setMessages(prev => {
            // Remove any optimistic message with same content
            const filtered = prev.filter(msg => 
              !(msg._id?.startsWith('temp-') && msg.content === data.message.content)
            );
            
            // Check if message already exists
            const exists = filtered.some(msg => msg._id === data.message._id);
            if (!exists) {
              console.log('✅ Adding new message:', data.message._id);
              const newMessages = [...filtered, data.message];
              // Scroll chat container to bottom after adding new message
              setTimeout(() => {
                if (messagesContainerRef.current) {
                  messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                }
              }, 100);
              return newMessages;
            }
            console.log('⚠️ Message already exists');
            return filtered;
          });
          
          // Only show toast if message is from someone else
          const agentData = localStorage.getItem('agentData');
          const agent = agentData ? JSON.parse(agentData) : null;
          const agentId = agent?.id || agent?._id || localStorage.getItem('agentId');
          
          if (data.message.senderId !== agentId && data.message.senderType !== 'agent') {
            toast.success('New message received');
          }
        } else {
          console.log('⚠️ Message for different ticket. Current:', currentTicket?._id, 'Received:', data.ticketId);
        }
      });

      newSocket.on('ticket_messages', (data: { ticketId: string; messages: Message[] }) => {
        const currentTicket = selectedTicketRef.current;
        if (currentTicket && data.ticketId === currentTicket._id) {
          console.log('Received ticket_messages for current ticket:', data.messages.length);
          setMessages(data.messages);
        }
      });

      newSocket.on('user_typing', (data: { ticketId: string; userId: string; isTyping: boolean }) => {
        const currentTicket = selectedTicketRef.current;
        if (currentTicket && data.ticketId === currentTicket._id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (data.isTyping) {
              newSet.add(data.userId);
            } else {
              newSet.delete(data.userId);
            }
            return newSet;
          });
        }
      });

      newSocket.on('agent_status_change', (data: { agentId: string; status: string }) => {
        setAgents(prev => prev.map(a => 
          a._id === data.agentId ? { ...a, status: data.status as 'online' | 'offline' | 'away' } : a
        ));
      });

      // Listen for new tickets
      newSocket.on('new_ticket', () => {
        const currentRole = userRoleRef.current;
        if (currentRole === 'admin') {
          loadAdminData();
        } else {
          loadAgentData();
        }
      });

      // Listen for ticket updates
      newSocket.on('ticket_updated', () => {
        const currentRole = userRoleRef.current;
        if (currentRole === 'admin') {
          loadAdminData();
        } else {
          loadAgentData();
        }
      });

      setSocket(newSocket);
    } catch (error: any) {
      console.error('Socket initialization error:', error);
      toast.error('Failed to connect to chat server');
    }
  };

  const loadInitialData = async () => {
    if (userRole === 'admin') {
      await loadAdminData();
    } else {
      await loadAgentData();
    }
  };

  const loadAgentData = async () => {
    try {
      // Load agent profile
      const profileRes = await supportAgentApi.getProfile();
      if (profileRes.data?.data?.agent) {
        setAgentStatus(profileRes.data.data.agent.status || 'offline');
      }

      // Load dashboard
      const dashboardRes = await supportAgentApi.getDashboard();
      if (dashboardRes.data?.data) {
        setTickets(dashboardRes.data.data.tickets || []);
      }
    } catch (error: any) {
      console.error('Error loading agent data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const loadAdminData = async () => {
    try {
      // Load agents
      const agentsRes = await supportAdminApi.getAllAgents();
      if (agentsRes.data?.data?.agents) {
        setAgents(agentsRes.data.data.agents);
      }

      // Load all tickets
      const ticketsRes = await supportAdminApi.getAllTickets();
      if (ticketsRes.data?.data?.tickets) {
        setAllTickets(ticketsRes.data.data.tickets);
      }

      // Load analytics
      const analyticsRes = await supportAdminApi.getAnalytics();
      if (analyticsRes.data?.data) {
        setAnalytics(analyticsRes.data.data);
      }
    } catch (error: any) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    }
  };

  const handleStatusToggle = async (status: 'online' | 'offline' | 'away') => {
    try {
      await supportAgentApi.updateStatus(status);
      setAgentStatus(status);
      if (socket) {
        socket.emit('update_status', { status });
      }
      toast.success(`Status updated to ${status}`);
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const handleSelectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    try {
      const response = await supportAgentApi.getMessages(ticket._id);
      if (response.data?.data?.messages) {
        setMessages(response.data.data.messages);
        // Scroll chat container to bottom after loading messages
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 200);
      }
      if (socket && isConnected) {
        socket.emit('join_ticket', { ticketId: ticket._id });
      }
    } catch (error: any) {
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedTicket || !socket) return;

    const content = messageInput.trim();
    const agentId = localStorage.getItem('agentId') || 'agent'; // Get agent ID from storage or context
    
    // Create optimistic message for immediate UI update
    const tempMessageId = `temp-${Date.now()}`;
    const optimisticMessage: any = {
      _id: tempMessageId,
      ticketId: selectedTicket._id,
      senderId: agentId,
      senderType: 'agent',
      content,
      messageType: 'text',
      createdAt: new Date().toISOString(),
      isRead: false
    };

    // Add optimistic message to UI immediately
    setMessages(prev => [...prev, optimisticMessage]);
    setMessageInput('');

    // Scroll chat container to bottom immediately after adding optimistic message
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 50);

    // Emit message to server
    socket.emit('send_message', {
      ticketId: selectedTicket._id,
      content,
      messageType: 'text'
    });
    
    // Refresh tickets to update last message time
    if (userRole === 'agent') {
      await loadAgentData();
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      await supportAgentApi.closeTicket(selectedTicket._id);
      toast.success('Ticket closed');
      setSelectedTicket(null);
      setMessages([]);
      await loadAgentData();
    } catch (error: any) {
      toast.error('Failed to close ticket');
    }
  };

  const handleTransferTicket = async () => {
    if (!selectedTicket || !selectedAgentId) return;
    try {
      await supportAgentApi.transferTicket(selectedTicket._id, {
        toAgentId: selectedAgentId,
        reason: 'Manual transfer'
      });
      toast.success('Ticket transferred successfully');
      setShowTransferModal(false);
      setSelectedTicket(null);
      await loadAgentData();
    } catch (error: any) {
      toast.error('Failed to transfer ticket');
    }
  };

  const handleReassignTicket = async () => {
    if (!selectedTicket || !selectedAgentId) return;
    try {
      await supportAdminApi.reassignTicket(selectedTicket._id, {
        toAgentId: selectedAgentId
      });
      toast.success('Ticket reassigned successfully');
      setShowTransferModal(false);
      await loadAdminData();
    } catch (error: any) {
      toast.error('Failed to reassign ticket');
    }
  };

  const filteredTickets = (userRole === 'admin' ? allTickets : tickets).filter(ticket => {
    if (ticketFilter !== 'all' && ticket.status !== ticketFilter) return false;
    if (searchQuery && !ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) 
        && !ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-[#F7F3EE] border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-[#260559] to-[#3d1a7a] rounded-xl shadow-md">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Support Dashboard</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {userRole === 'admin' ? 'Admin Panel' : 'Agent Dashboard'}
                </p>
              </div>
            </div>
            
            {userRole === 'agent' && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1.5 shadow-inner">
                    <button
                      onClick={() => handleStatusToggle('online')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        agentStatus === 'online' 
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Power className="w-4 h-4 inline mr-1.5" />
                      Online
                    </button>
                    <button
                      onClick={() => handleStatusToggle('away')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        agentStatus === 'away' 
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Away
                    </button>
                    <button
                      onClick={() => handleStatusToggle('offline')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        agentStatus === 'offline' 
                          ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <PowerOff className="w-4 h-4 inline mr-1.5" />
                      Offline
                    </button>
                  </div>
                </div>
                {!isConnected && (
                  <span className="text-xs text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                    <XCircle className="w-4 h-4" />
                    Disconnected
                  </span>
                )}
                {isConnected && (
                  <span className="text-xs text-green-600 flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Connected
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {userRole === 'admin' && (
          <div className="mb-6">
            <div className="flex gap-2 border-b border-gray-200 bg-[#F7F3EE] rounded-t-xl px-4 pt-4">
              <button
                onClick={() => setActiveTab('tickets')}
                className={`px-5 py-3 font-medium transition-all duration-200 rounded-t-lg ${
                  activeTab === 'tickets'
                    ? 'border-b-2 border-[#260559] text-[#260559] bg-[#F5F2EE]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-[#F5F2EE]'
                }`}
              >
                <Ticket className="w-4 h-4 inline mr-2" />
                Tickets
              </button>
              <button
                onClick={() => setActiveTab('agents')}
                className={`px-5 py-3 font-medium transition-all duration-200 rounded-t-lg ${
                  activeTab === 'agents'
                    ? 'border-b-2 border-[#260559] text-[#260559] bg-[#F5F2EE]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-[#F5F2EE]'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Agents
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-5 py-3 font-medium transition-all duration-200 rounded-t-lg ${
                  activeTab === 'analytics'
                    ? 'border-b-2 border-[#260559] text-[#260559] bg-[#F5F2EE]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-[#F5F2EE]'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Analytics
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className={`${selectedTicket ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
            <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Tickets</h2>
                  <button
                    onClick={loadInitialData}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 hover:rotate-180"
                    title="Refresh tickets"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tickets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#260559] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <select
                    value={ticketFilter}
                    onChange={(e) => setTicketFilter(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#260559] focus:border-transparent transition-all bg-[#F7F3EE]"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                {filteredTickets.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Ticket className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="font-medium">No tickets found</p>
                    <p className="text-sm mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredTickets.map((ticket) => (
                      <button
                        key={ticket._id}
                        onClick={() => handleSelectTicket(ticket)}
                        className={`w-full text-left p-4 hover:bg-[#F5F2EE] transition-all duration-200 ${
                          selectedTicket?._id === ticket._id 
                            ? 'bg-gradient-to-r from-blue-50 to-emerald-50 border-l-4 border-[#260559] shadow-sm' 
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{ticket.subject}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{ticket.ticketNumber}</p>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ml-2 ${
                            ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                            ticket.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                          <span className={`px-2 py-0.5 rounded-md font-medium ${
                            ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.priority}
                          </span>
                          <div className="flex items-center gap-1 text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(ticket.lastMessageAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          {selectedTicket && (
            <div className="lg:col-span-2">
              <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
                {/* Chat Header */}
                <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{selectedTicket.subject}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{selectedTicket.ticketNumber}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {selectedTicket.status !== 'closed' && (
                      <>
                        {(userRole === 'agent' || userRole === 'admin') && (
                          <button
                            onClick={() => setShowTransferModal(true)}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-[#F5F2EE] transition-colors duration-200 font-medium text-gray-700"
                            title="Transfer/Reassign ticket"
                          >
                            <FolderSync className="w-4 h-4 inline mr-1.5" />
                            {userRole === 'admin' ? 'Reassign' : 'Transfer'}
                          </button>
                        )}
                        <button
                          onClick={handleCloseTicket}
                          className="px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm font-medium"
                        >
                          Close
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                      title="Back to tickets"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex ${msg.senderType === 'agent' || msg.senderType === 'system' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-xl p-4 shadow-sm ${
                          msg.senderType === 'agent' || msg.senderType === 'system'
                            ? 'bg-gradient-to-br from-[#260559] to-[#3d1a7a] text-white'
                            : 'bg-[#F7F3EE] border border-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                        <p className={`text-xs mt-2 ${msg.senderType === 'agent' || msg.senderType === 'system' ? 'text-white/70' : 'text-gray-500'}`}>
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {typingUsers.size > 0 && (
                    <div className="flex justify-start">
                      <div className="bg-[#F7F3EE] border border-gray-200 rounded-xl p-4 shadow-sm">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Scroll anchor - used for auto-scrolling to bottom when messages change */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {selectedTicket.status !== 'closed' && (
                  <div className="p-5 border-t border-gray-200 bg-[#F7F3EE]">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#260559] focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={!isConnected}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || !isConnected}
                        className="px-6 py-3 bg-gradient-to-r from-[#260559] to-[#3d1a7a] text-white rounded-lg hover:from-[#3d1a7a] hover:to-[#260559] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Views */}
        {userRole === 'admin' && activeTab === 'agents' && (
          <div className="mt-6 bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Agents</h2>
              <button
                onClick={() => setShowAgentModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-[#260559] to-[#3d1a7a] text-white rounded-lg hover:from-[#3d1a7a] hover:to-[#260559] transition-all duration-200 shadow-md hover:shadow-lg font-medium"
              >
                Add Agent
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {agents.map((agent) => (
                <div key={agent._id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 bg-[#F7F3EE]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{agent.fullname}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${
                        agent.status === 'online' ? 'bg-green-500 animate-pulse' :
                        agent.status === 'away' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-xs text-gray-500 capitalize">{agent.status}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{agent.email}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                      <span className="text-gray-600">Tickets Handled:</span>
                      <span className="font-semibold text-gray-900">{agent.stats.totalTicketsHandled}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                      <span className="text-gray-600">Avg Response:</span>
                      <span className="font-semibold text-gray-900">{Math.round(agent.stats.averageResponseTime)}s</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                      <span className="text-gray-600">Rating:</span>
                      <span className="font-semibold text-gray-900 flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                        {agent.stats.averageRating.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-gray-600">Active Tickets:</span>
                      <span className="font-semibold text-gray-900">{agent.currentTickets}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {userRole === 'admin' && activeTab === 'analytics' && analytics && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Tickets</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.overview?.totalTickets || 0}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Ticket className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Open Tickets</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.overview?.openTickets || 0}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
              <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Avg Response</p>
                    <p className="text-3xl font-bold text-gray-900">{Math.round(analytics.performance?.averageResponseTime || 0)}s</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">SLA Performance</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.performance?.slaPerformance?.toFixed(1) || 0}%</p>
                  </div>
                  <div className="p-3 bg-[#DCFCE7] rounded-xl">
                    <TrendingUp className="w-6 h-6 text-[#155E4B]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transfer/Reassign Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#F7F3EE] rounded-xl shadow-xl p-6 max-w-md w-full border border-gray-200">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">
              {userRole === 'admin' ? 'Reassign Ticket' : 'Transfer Ticket'}
            </h3>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#260559] focus:border-transparent transition-all"
            >
              <option value="">Select Agent</option>
              {agents.map((agent) => (
                <option key={agent._id} value={agent._id}>
                  {agent.fullname} ({agent.status})
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={userRole === 'admin' ? handleReassignTicket : handleTransferTicket}
                disabled={!selectedAgentId}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#260559] to-[#3d1a7a] text-white rounded-lg hover:from-[#3d1a7a] hover:to-[#260559] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md font-medium"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedAgentId('');
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-[#F5F2EE] transition-colors duration-200 font-medium text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Agent Modal */}
      {showAgentModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <CreateAgentModal
            onClose={() => setShowAgentModal(false)}
            onSuccess={() => {
              setShowAgentModal(false);
              loadAdminData();
            }}
          />
        </div>
      )}
    </div>
  );
};

// Create Agent Modal Component
const CreateAgentModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullname: '',
    role: 'agent'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supportAdminApi.createAgent(formData);
      toast.success('Agent created successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create agent');
    }
  };

  return (
    <div className="bg-[#F7F3EE] rounded-xl shadow-xl p-6 max-w-md w-full border border-gray-200">
      <h3 className="text-xl font-semibold mb-5 text-gray-900">Create New Agent</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          value={formData.fullname}
          onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#260559] focus:border-transparent transition-all"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#260559] focus:border-transparent transition-all"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#260559] focus:border-transparent transition-all"
          required
        />
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#260559] focus:border-transparent transition-all bg-[#F7F3EE]"
        >
          <option value="agent">Agent</option>
          <option value="admin">Admin</option>
        </select>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#260559] to-[#3d1a7a] text-white rounded-lg hover:from-[#3d1a7a] hover:to-[#260559] transition-all duration-200 shadow-md font-medium"
          >
            Create
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-[#F5F2EE] transition-colors duration-200 font-medium text-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupportDashboard;

