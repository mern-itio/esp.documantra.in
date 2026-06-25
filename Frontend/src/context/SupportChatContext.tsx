import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../components/AuthService/AuthContext';
import { SUPPORT_SERVICE_URL } from '../services/supportService';
import { getMemoryAccessToken } from '../utils/authSession';
import toast from 'react-hot-toast';

interface Message {
  _id: string;
  ticketId: string;
  senderId: string;
  senderType: 'customer' | 'agent' | 'system' | 'ai';
  content: string;
  messageType: 'text' | 'file' | 'image' | 'system';
  attachments?: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
  }>;
  readBy?: Array<{
    userId: string;
    readAt: Date;
  }>;
  isRead: boolean;
  createdAt: Date;
}

interface Ticket {
  _id: string;
  ticketNumber: string;
  customerId: string;
  assignedAgentId?: string;
  subject: string;
  status: 'open' | 'ongoing' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: Date;
  lastMessageAt: Date;
  rating?: {
    score: number;
    feedback?: string;
    ratedAt: Date;
  };
}

interface SupportChatContextType {
  socket: Socket | null;
  isConnected: boolean;
  currentTicket: Ticket | null;
  messages: Message[];
  typingUsers: Set<string>;
  joinTicket: (ticketId: string) => void;
  leaveTicket: () => void;
  sendMessage: (content: string, messageType?: string, attachments?: any[]) => Promise<void>;
  markAsRead: (messageIds: string[]) => void;
  setTyping: (isTyping: boolean) => void;
  createTicket: (subject: string, initialMessage: string, category?: string, priority?: string) => Promise<Ticket | null>;
  setCurrentTicket: (ticket: Ticket | null) => void;
}

const SupportChatContext = createContext<SupportChatContextType | undefined>(undefined);

export const SupportChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const currentTicketRef = useRef<Ticket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = getMemoryAccessToken();
    if (!token) return;

    const newSocket = io(SUPPORT_SERVICE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('error', (error: any) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'Connection error');
    });

    newSocket.on('new_message', (data: { message: Message; ticketId: string }) => {
      const currentTicket = currentTicketRef.current;
      console.log('Customer received new_message event:', {
        ticketId: data.ticketId,
        currentTicketId: currentTicket?._id,
        messageId: data.message?._id,
        senderType: data.message?.senderType,
        content: data.message?.content?.substring(0, 30)
      });
      
      if (!data.message || !data.ticketId) {
        console.error('Invalid message data received:', data);
        return;
      }
      
      // Check if message is from someone else (not the current user)
      const isMessageFromOthers = data.message.senderId !== user?.id;
      
      if (currentTicket && data.ticketId === currentTicket._id) {
        setMessages(prev => {
          // Remove optimistic message with same content from same sender (replace with real message)
          const withoutOptimistic = prev.filter(msg => 
            !(msg._id?.startsWith('temp-') && msg.content === data.message.content && msg.senderId === data.message.senderId)
          );
          
          // Check if real message already exists
          const alreadyExists = withoutOptimistic.some(msg => msg._id === data.message._id);
          if (!alreadyExists) {
            console.log('✅ Adding new message to UI:', data.message._id, data.message.content.substring(0, 30));
            return [...withoutOptimistic, data.message];
          }
          console.log('⚠️ Message already exists in UI:', data.message._id);
          return withoutOptimistic;
        });
        
        // Only notify if message is from someone else and user is viewing this ticket
        if (isMessageFromOthers) {
          playNotificationSound();
          showBrowserNotification('New message', data.message.content.substring(0, 100));
        }
      } else {
        // Message is for a different ticket (not currently open)
        // Still notify if message is from someone else
        if (isMessageFromOthers) {
          console.log('Message for different ticket, but triggering notification. Expected:', currentTicket?._id, 'Got:', data.ticketId);
          playNotificationSound();
          showBrowserNotification('New message in another ticket', data.message.content.substring(0, 100));
        } else {
          console.log('Message for different ticket, ignoring. Expected:', currentTicket?._id, 'Got:', data.ticketId);
        }
      }
    });

    newSocket.on('ticket_messages', (data: { ticketId: string; messages: Message[] }) => {
      const currentTicket = currentTicketRef.current;
      console.log('Received ticket messages:', data.ticketId, data.messages.length);
      if (currentTicket && data.ticketId === currentTicket._id) {
        setMessages(data.messages);
      }
    });

    newSocket.on('user_typing', (data: { ticketId: string; userId: string; userType: string; isTyping: boolean }) => {
      const currentTicket = currentTicketRef.current;
      if (currentTicket && data.ticketId === currentTicket._id && data.userId !== user?.id) {
        console.log('Customer received typing indicator:', { ticketId: data.ticketId, userId: data.userId, isTyping: data.isTyping });
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

    newSocket.on('messages_read', (data: { ticketId: string; userId: string; messageIds: string[] }) => {
      const currentTicket = currentTicketRef.current;
      if (currentTicket && data.ticketId === currentTicket._id && data.userId !== user?.id) {
        setMessages(prev => prev.map(msg => 
          data.messageIds.includes(msg._id) 
            ? { ...msg, isRead: true, readBy: [...(msg.readBy || []), { userId: data.userId, readAt: new Date() }] }
            : msg
        ));
      }
    });

    newSocket.on('notification', (data: { type: string; ticketId: string; ticketNumber: string; message: string }) => {
      toast.success(`New message in ticket ${data.ticketNumber}`);
      playNotificationSound();
      showBrowserNotification(`Ticket ${data.ticketNumber}`, data.message);
    });

    // Listen for ticket status updates (e.g., when ticket is closed)
    newSocket.on('ticket_updated', (data: { ticketId: string; status: string; closedAt?: Date }) => {
      const currentTicket = currentTicketRef.current;
      if (currentTicket && data.ticketId === currentTicket._id) {
        // Update current ticket status
        const updatedTicket = { ...currentTicket, status: data.status as 'open' | 'ongoing' | 'closed', closedAt: data.closedAt };
        setCurrentTicket(updatedTicket);
        currentTicketRef.current = updatedTicket;
        
        if (data.status === 'closed') {
          toast.error('This ticket has been closed.');
        }
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  // Initialize audio element on mount
  useEffect(() => {
    // Create a persistent audio element for notifications
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgzMGHm7A7+OZUQ0PVKzn77FcGAg+ltryy3UqBSh/zfLZiTYIGWa77+OcTg4OUafk8rZmHQY6k9nzznktBSR3x+/ckEEKEV606OuqVhUKRp/g8r1sIQUxh9Hy0oQzBh5uwO/jmlEOEFWt5++xXBgIPpba8st1KgUof83y2Yk2CBlmu+/jnE4ODlGn5PK2Zh0GOpPZ8855LQUkd8fv3JBBCg=');
    audio.volume = 0.5;
    audio.preload = 'auto';
    
    // Try to preload the audio
    try {
      audio.load();
    } catch (err: any) {
      console.warn('Could not preload notification sound:', err);
    }
    
    audioRef.current = audio;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Last resort: Generate beep using Web Audio API
  const tryWebAudioBeep = useCallback(() => {
    try {
      console.log('🔊 Attempting Web Audio API beep...');
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('Web Audio API not supported');
        return;
      }
      
      const audioContext = new AudioContextClass();
      
      // Resume audio context if suspended (required by some browsers)
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('Audio context resumed');
        });
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create a pleasant notification beep (two short beeps)
      oscillator.frequency.value = 800; // 800 Hz tone
      oscillator.type = 'sine';
      
      // First beep
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.1);
      
      // Second beep (after short pause)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.25);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      console.log('✅ Web Audio beep played');
    } catch (error) {
      console.warn('❌ Could not play Web Audio beep:', error);
    }
  }, []);

  // Fallback: Create new audio element
  const tryFallbackSound = useCallback(() => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgzMGHm7A7+OZUQ0PVKzn77FcGAg+ltryy3UqBSh/zfLZiTYIGWa77+OcTg4OUafk8rZmHQY6k9nzznktBSR3x+/ckEEKEV606OuqVhUKRp/g8r1sIQUxh9Hy0oQzBh5uwO/jmlEOEFWt5++xXBgIPpba8st1KgUof83y2Yk2CBlmu+/jnE4ODlGn5PK2Zh0GOpPZ8855LQUkd8fv3JBBCg=');
      audio.volume = 0.5;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('Could not play notification sound (fallback):', error);
          tryWebAudioBeep();
        });
      }
    } catch (error) {
      console.warn('Error creating fallback audio:', error);
      tryWebAudioBeep();
    }
  }, [tryWebAudioBeep]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    console.log('🔔 Attempting to play notification sound...');
    try {
      // Try using the persistent audio element first
      if (audioRef.current) {
        // Reset to beginning if already played
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('✅ Notification sound played successfully (persistent)');
            })
            .catch((error) => {
              console.warn('❌ Could not play notification sound (persistent):', error);
              // Fallback: try creating a new audio element
              tryFallbackSound();
            });
        } else {
          console.log('✅ Notification sound played (no promise returned)');
        }
        return;
      }
      
      // Fallback: create new audio element if persistent one doesn't exist
      console.log('⚠️ Persistent audio not available, using fallback');
      tryFallbackSound();
    } catch (error) {
      console.warn('❌ Error playing notification sound:', error);
      // Last resort: try Web Audio API beep
      tryWebAudioBeep();
    }
  }, [tryFallbackSound, tryWebAudioBeep]);

  // Show browser notification
  const showBrowserNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo.png'
      });
    }
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const joinTicket = useCallback((ticketId: string) => {
    if (!socket || !isConnected) {
      console.warn('Socket not connected, cannot join ticket:', ticketId);
      return;
    }
    console.log('Joining ticket room:', ticketId);
    socket.emit('join_ticket', { ticketId, userId: user?.id, userType: 'customer' });
  }, [socket, isConnected, user?.id]);

  const leaveTicket = useCallback(() => {
    if (!socket || !currentTicket) return;
    socket.emit('leave_ticket', { ticketId: currentTicket._id });
    setCurrentTicket(null);
    setMessages([]);
    setTypingUsers(new Set());
  }, [socket, currentTicket]);

  const sendMessage = useCallback(async (content: string, messageType: string = 'text', attachments: any[] = []) => {
    if (!socket || !isConnected || !currentTicket || !user) {
      toast.error('Not connected or no active ticket');
      return;
    }

    // Prevent sending messages to closed tickets
    if (currentTicket.status === 'closed') {
      toast.error('This ticket is closed. Please create a new ticket to continue.');
      setCurrentTicket(null);
      return;
    }

    // Ensure we're in the ticket room before sending (joinTicket will handle if not already joined)
    joinTicket(currentTicket._id);

    // Create optimistic message for immediate UI update
    const tempMessageId = `temp-${Date.now()}`;
    const now = new Date();
    const optimisticMessage: any = {
      _id: tempMessageId,
      ticketId: currentTicket._id,
      senderId: user.id,
      senderType: 'customer',
      content,
      messageType: messageType as 'text' | 'file' | 'image',
      attachments: attachments || [],
      timestamp: now.toISOString(),
      createdAt: now,
      isRead: false,
      readBy: []
    };

    // Add optimistic message to UI immediately
    console.log('Customer sending message, adding optimistic:', optimisticMessage);
    setMessages(prev => [...prev, optimisticMessage]);

    // Emit message to server
    console.log('Customer emitting send_message:', { ticketId: currentTicket._id, content: content.substring(0, 30) });
    socket.emit('send_message', {
      ticketId: currentTicket._id,
      content,
      messageType,
      attachments
    });

    // Stop typing indicator
    if (isTypingRef.current) {
      socket.emit('stop_typing', { ticketId: currentTicket._id });
      isTypingRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, [socket, isConnected, currentTicket, user, joinTicket]);

  const markAsRead = useCallback((messageIds: string[]) => {
    if (!socket || !isConnected || !currentTicket || messageIds.length === 0) return;
    socket.emit('mark_read', { ticketId: currentTicket._id, messageIds });
  }, [socket, isConnected, currentTicket]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (!socket || !isConnected || !currentTicket) return;

    if (isTyping && !isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', { ticketId: currentTicket._id });
    } else if (!isTyping && isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('stop_typing', { ticketId: currentTicket._id });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }

    // Auto-stop typing after 3 seconds of inactivity
    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          setTyping(false);
        }
      }, 3000);
    }
  }, [socket, isConnected, currentTicket]);

  const setCurrentTicketState = useCallback((ticket: Ticket | null) => {
    setCurrentTicket(ticket);
    currentTicketRef.current = ticket;
    if (ticket) {
      localStorage.setItem('currentSupportTicket', JSON.stringify(ticket));
    } else {
      localStorage.removeItem('currentSupportTicket');
    }
  }, []);

  // Update ref when currentTicket changes
  useEffect(() => {
    currentTicketRef.current = currentTicket;
  }, [currentTicket]);

  // Load messages when ticket changes
  useEffect(() => {
    if (currentTicket && socket && isConnected) {
      const loadMessagesForTicket = async () => {
        try {
          const { supportCustomerApi } = await import('../services/supportService');
          const response = await supportCustomerApi.getMessages(currentTicket._id);
          if (response.data?.data?.messages) {
            console.log('Loaded messages for ticket:', currentTicket._id, response.data.data.messages.length);
            setMessages(response.data.data.messages || []);
          }
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      };
      
      loadMessagesForTicket();
      // Join socket room for real-time updates
      joinTicket(currentTicket._id);
    } else if (!currentTicket) {
      setMessages([]);
    }
  }, [currentTicket, socket, isConnected, joinTicket]);

  // Load ticket from localStorage on mount
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCurrentTicket(null);
      return;
    }
    
    try {
      const stored = localStorage.getItem('currentSupportTicket');
      if (stored) {
        const ticket = JSON.parse(stored);
        // Ensure ticket belongs to the current user to prevent "Access denied" errors on login
        if (ticket.customerId === user.id) {
          setCurrentTicket(ticket);
        } else {
          localStorage.removeItem('currentSupportTicket');
          setCurrentTicket(null);
        }
      }
    } catch (error) {
      console.error('Error loading stored ticket:', error);
      localStorage.removeItem('currentSupportTicket');
    }
  }, [isAuthenticated, user]);

  const createTicket = useCallback(async (subject: string, initialMessage: string, category?: string, priority?: string): Promise<Ticket | null> => {
    try {
      const { supportCustomerApi } = await import('../services/supportService');
      const response = await supportCustomerApi.createTicket({
        subject,
        initialMessage,
        category: category || 'other',
        priority: priority || 'medium',
        metadata: {
          browserInfo: navigator.userAgent,
          ipAddress: null // Would need backend to capture this
        }
      });

      if (response.data?.data?.ticket) {
        const ticket = response.data.data.ticket;
        // Wait a bit for socket to be ready
        setTimeout(() => {
          setCurrentTicketState(ticket);
          joinTicket(ticket._id);
        }, 500);
        return ticket;
      }
      return null;
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to create ticket');
      return null;
    }
  }, [joinTicket, setCurrentTicketState]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (messages.length > 0 && currentTicket) {
      const unreadMessages = messages.filter(msg => 
        msg.senderType !== 'customer' && 
        !msg.readBy?.some(r => r.userId === user?.id)
      );
      
      if (unreadMessages.length > 0) {
        const unreadIds = unreadMessages.map(m => m._id);
        markAsRead(unreadIds);
      }
    }
  }, [messages, currentTicket, user, markAsRead]);

  const value: SupportChatContextType = {
    socket,
    isConnected,
    currentTicket,
    messages,
    typingUsers,
    joinTicket,
    leaveTicket,
    sendMessage,
    markAsRead,
    setTyping,
    createTicket,
    setCurrentTicket: setCurrentTicketState
  };

  return (
    <SupportChatContext.Provider value={value}>
      {children}
    </SupportChatContext.Provider>
  );
};

export const useSupportChat = () => {
  const context = useContext(SupportChatContext);
  if (context === undefined) {
    throw new Error('useSupportChat must be used within a SupportChatProvider');
  }
  return context;
};

