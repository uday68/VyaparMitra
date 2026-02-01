// WebSocket Client Service for Real-time Communication
import { io, Socket } from 'socket.io-client';
import { 
  NegotiationMessage, 
  NegotiationRoom, 
  SupportedLanguage, 
  TypingIndicator 
} from '../types/qr-commerce';

interface WebSocketEvents {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  error: (error: { message: string }) => void;
  
  // Room events
  room_state: (data: { room: NegotiationRoom; messages: NegotiationMessage[] }) => void;
  customer_joined: (data: { customerId: string; customerLanguage: SupportedLanguage; timestamp: Date }) => void;
  
  // Message events
  new_message: (message: NegotiationMessage) => void;
  message_translated: (message: NegotiationMessage) => void;
  messages_read: (data: { userId: string; messageIds: string[]; timestamp: Date }) => void;
  
  // Typing events
  user_typing: (data: { userId: string; isTyping: boolean; timestamp: Date }) => void;
  
  // Session events
  session_update: (update: any) => void;
  agreement_reached: (agreementDetails: any) => void;
  language_changed: (data: { userId: string; newLanguage: SupportedLanguage; timestamp: Date }) => void;
  user_disconnected: (data: { userId: string; timestamp: Date }) => void;
  
  // Server events
  server_shutdown: (data: { message: string; timestamp: Date }) => void;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private eventListeners: Map<keyof WebSocketEvents, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor(private serverUrl: string = 'http://localhost:4000') {}

  /**
   * Connect to WebSocket server
   */
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(this.serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.emit('connect');
        resolve();
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log('❌ WebSocket disconnected:', reason);
        this.emit('disconnect', reason);
        
        // Auto-reconnect for certain disconnect reasons
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, don't reconnect
          return;
        }
        
        this.scheduleReconnect(token);
      });

      this.socket.on('connect_error', (error: Error) => {
        console.error('❌ WebSocket connection error:', error);
        this.emit('error', { message: error.message });
        reject(error);
      });

      // Set up event forwarding
      this.setupEventForwarding();
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventListeners.clear();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Join a negotiation room
   */
  joinNegotiation(
    sessionId: string, 
    language: SupportedLanguage, 
    userType: 'VENDOR' | 'CUSTOMER'
  ): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('join_negotiation', {
      sessionId,
      language,
      userType
    });
  }

  /**
   * Send a message
   */
  sendMessage(content: string, type: 'TEXT' | 'VOICE', audioData?: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('send_message', {
      content,
      type,
      audioData
    });
  }

  /**
   * Start typing indicator
   */
  startTyping(): void {
    if (!this.socket?.connected) return;
    this.socket.emit('typing_start');
  }

  /**
   * Stop typing indicator
   */
  stopTyping(): void {
    if (!this.socket?.connected) return;
    this.socket.emit('typing_stop');
  }

  /**
   * Mark messages as read
   */
  markMessagesAsRead(messageIds: string[]): void {
    if (!this.socket?.connected) return;
    this.socket.emit('mark_messages_read', { messageIds });
  }

  /**
   * Change language
   */
  changeLanguage(language: SupportedLanguage): void {
    if (!this.socket?.connected) return;
    this.socket.emit('change_language', { language });
  }

  /**
   * Add event listener
   */
  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit<K extends keyof WebSocketEvents>(event: K, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Set up event forwarding from socket to listeners
   */
  private setupEventForwarding(): void {
    if (!this.socket) return;

    // Room events
    this.socket.on('room_state', (data: any) => this.emit('room_state', data));
    this.socket.on('customer_joined', (data: any) => this.emit('customer_joined', data));

    // Message events
    this.socket.on('new_message', (message: any) => this.emit('new_message', message));
    this.socket.on('message_translated', (message: any) => this.emit('message_translated', message));
    this.socket.on('messages_read', (data: any) => this.emit('messages_read', data));

    // Typing events
    this.socket.on('user_typing', (data: any) => this.emit('user_typing', data));

    // Session events
    this.socket.on('session_update', (update: any) => this.emit('session_update', update));
    this.socket.on('agreement_reached', (details: any) => this.emit('agreement_reached', details));
    this.socket.on('language_changed', (data: any) => this.emit('language_changed', data));
    this.socket.on('user_disconnected', (data: any) => this.emit('user_disconnected', data));

    // Server events
    this.socket.on('server_shutdown', (data: any) => this.emit('server_shutdown', data));

    // Error handling
    this.socket.on('error', (error: any) => this.emit('error', error));
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.emit('error', { message: 'Failed to reconnect after multiple attempts' });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (!this.socket?.connected) {
        this.connect(token).catch(error => {
          console.error('❌ Reconnection failed:', error);
        });
      }
    }, delay);
  }
}

// Singleton instance
let webSocketService: WebSocketService | null = null;

/**
 * Get WebSocket service instance
 */
export const getWebSocketService = (): WebSocketService => {
  if (!webSocketService) {
    webSocketService = new WebSocketService();
  }
  return webSocketService;
};

/**
 * Initialize WebSocket connection
 */
export const initializeWebSocket = async (token: string): Promise<WebSocketService> => {
  const service = getWebSocketService();
  await service.connect(token);
  return service;
};