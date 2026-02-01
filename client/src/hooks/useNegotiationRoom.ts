// React hook for managing negotiation room real-time connections
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  NegotiationRoom, 
  NegotiationMessage, 
  SupportedLanguage, 
  MessageInput
} from '../types/qr-commerce';
import { getWebSocketService, WebSocketService } from '../services/websocketService';

interface UseNegotiationRoomProps {
  sessionId: string;
  userId: string;
  token: string; // JWT token for authentication
}

interface UseNegotiationRoomReturn {
  room: NegotiationRoom | null;
  messages: NegotiationMessage[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  typingUsers: string[];
  sendMessage: (input: MessageInput) => Promise<boolean>;
  updateTypingStatus: (isTyping: boolean) => Promise<void>;
  joinNegotiation: (customerLanguage: SupportedLanguage) => Promise<boolean>;
  reconnect: () => void;
}

export const useNegotiationRoom = ({
  sessionId,
  userId,
  token
}: UseNegotiationRoomProps): UseNegotiationRoomReturn => {
  const [room, setRoom] = useState<NegotiationRoom | null>(null);
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const wsService = useRef<WebSocketService | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize WebSocket connection
  const initializeConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      wsService.current = getWebSocketService();
      
      // Connect to WebSocket
      await wsService.current.connect(token);
      
      // Set up event listeners
      setupEventListeners();
      
      setIsConnected(true);
      
    } catch (err) {
      console.error('Failed to initialize WebSocket connection:', err);
      setError('Failed to connect to server');
      setIsConnected(false);
      scheduleReconnect();
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Set up WebSocket event listeners
  const setupEventListeners = useCallback(() => {
    if (!wsService.current) return;

    const ws = wsService.current;

    // Connection events
    ws.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    ws.on('disconnect', (reason) => {
      setIsConnected(false);
      if (reason !== 'io client disconnect') {
        setError('Connection lost. Attempting to reconnect...');
      }
    });

    ws.on('error', (error) => {
      setError(error.message);
      setIsConnected(false);
    });

    // Room events
    ws.on('room_state', (data) => {
      setRoom(data.room);
      setMessages(data.messages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ));
    });

    ws.on('customer_joined', (data) => {
      // Update room state when customer joins
      setRoom(prev => prev ? {
        ...prev,
        customerId: data.customerId,
        customerLanguage: data.customerLanguage,
        status: 'ACTIVE'
      } : null);
    });

    // Message events
    ws.on('new_message', (message) => {
      setMessages(prev => {
        // Check if message already exists (avoid duplicates)
        const exists = prev.some(msg => msg.id === message.id);
        if (exists) {
          // Update existing message
          return prev.map(msg => 
            msg.id === message.id ? message : msg
          );
        } else {
          // Add new message
          return [...prev, message].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        }
      });
    });

    ws.on('message_translated', (message) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id ? message : msg
        )
      );
    });

    ws.on('messages_read', (data) => {
      if (data.userId !== userId) {
        setMessages(prev => 
          prev.map(msg => 
            data.messageIds.includes(msg.id) 
              ? { ...msg, readAt: data.timestamp }
              : msg
          )
        );
      }
    });

    // Typing events
    ws.on('user_typing', (data) => {
      if (data.userId === userId) return; // Don't show own typing

      setTypingUsers(prev => {
        if (data.isTyping) {
          return prev.includes(data.userId) ? prev : [...prev, data.userId];
        } else {
          return prev.filter(id => id !== data.userId);
        }
      });
    });

    // Session events
    ws.on('session_update', (update) => {
      setRoom(prev => prev ? { ...prev, ...update } : null);
    });

    ws.on('language_changed', (data) => {
      if (data.userId !== userId) {
        // Update room language if it's the other participant
        setRoom(prev => {
          if (!prev) return null;
          
          if (prev.vendorId === data.userId) {
            return { ...prev, vendorLanguage: data.newLanguage };
          } else if (prev.customerId === data.userId) {
            return { ...prev, customerLanguage: data.newLanguage };
          }
          
          return prev;
        });
      }
    });

    ws.on('user_disconnected', (data) => {
      // Remove from typing users
      setTypingUsers(prev => prev.filter(id => id !== data.userId));
    });

    ws.on('server_shutdown', (data) => {
      setError(data.message);
      setIsConnected(false);
    });

  }, [userId]);

  // Join negotiation room
  const joinNegotiation = useCallback(async (customerLanguage: SupportedLanguage): Promise<boolean> => {
    try {
      if (!wsService.current?.isConnected()) {
        throw new Error('WebSocket not connected');
      }

      wsService.current.joinNegotiation(sessionId, customerLanguage, 'CUSTOMER');
      return true;
    } catch (err) {
      console.error('Failed to join negotiation:', err);
      setError('Failed to join negotiation');
      return false;
    }
  }, [sessionId]);

  // Send message
  const sendMessage = useCallback(async (input: MessageInput): Promise<boolean> => {
    try {
      if (!wsService.current?.isConnected()) {
        throw new Error('WebSocket not connected');
      }

      let audioData: string | undefined;
      
      if (input.type === 'VOICE' && input.audioData) {
        // Convert Blob to base64
        if (input.audioData instanceof Blob) {
          audioData = await blobToBase64(input.audioData);
        } else if (typeof input.audioData === 'string') {
          audioData = input.audioData;
        }
      }

      wsService.current.sendMessage(input.content, input.type, audioData);
      return true;
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
      return false;
    }
  }, []);

  // Update typing status
  const updateTypingStatus = useCallback(async (isTyping: boolean): Promise<void> => {
    try {
      if (!wsService.current?.isConnected()) return;

      if (isTyping) {
        wsService.current.startTyping();
        
        // Auto-clear typing status after 3 seconds
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          wsService.current?.stopTyping();
        }, 3000);
      } else {
        wsService.current.stopTyping();
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    } catch (err) {
      console.error('Failed to update typing status:', err);
    }
  }, []);

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('Attempting to reconnect...');
      initializeConnection();
    }, 3000); // Reconnect after 3 seconds
  }, [initializeConnection]);

  // Reconnect function
  const reconnect = useCallback(() => {
    setError(null);
    setIsConnected(false);
    initializeConnection();
  }, [initializeConnection]);

  // Initialize on mount
  useEffect(() => {
    initializeConnection();

    return () => {
      // Cleanup
      if (wsService.current) {
        wsService.current.disconnect();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [initializeConnection]);

  // Join negotiation room when connected
  useEffect(() => {
    if (isConnected && wsService.current && room?.vendorId) {
      // Determine user type and language
      const userType = room.vendorId === userId ? 'VENDOR' : 'CUSTOMER';
      const language = userType === 'VENDOR' 
        ? (room.vendorLanguage as SupportedLanguage) 
        : (room.customerLanguage as SupportedLanguage) || 'en';

      wsService.current.joinNegotiation(sessionId, language, userType);
    }
  }, [isConnected, room, userId, sessionId]);

  return {
    room,
    messages,
    isConnected,
    isLoading,
    error,
    typingUsers,
    sendMessage,
    updateTypingStatus,
    joinNegotiation,
    reconnect
  };
};

// Helper function to convert Blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};