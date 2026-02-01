// WebSocket Service for Real-time Cross-Language Communication
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { RedisClientType } from 'redis';
import { 
  NegotiationMessage, 
  SupportedLanguage, 
  TypingIndicator 
} from '../types/qr-commerce';
import { NegotiationService } from './negotiation_service';
import { QRSessionService } from './qr_session_service';
import { NegotiationRoomModel } from '../db/schemas/negotiation-room';
import { logger } from '../utils/logger';

interface AuthenticatedSocket {
  id: string;
  userId: string;
  sessionId?: string;
  userType?: 'VENDOR' | 'CUSTOMER';
  language?: SupportedLanguage;
}

export class WebSocketService {
  private io: SocketIOServer;
  private negotiationService: NegotiationService;
  private qrSessionService: QRSessionService;
  private authenticatedSockets: Map<string, AuthenticatedSocket> = new Map();

  constructor(
    httpServer: HTTPServer,
    private db: Pool,
    private redis: RedisClientType,
    private jwtSecret: string = process.env.JWT_SECRET || 'default-secret'
  ) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.negotiationService = new NegotiationService(db, redis);
    this.qrSessionService = new QRSessionService(db, redis);

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, this.jwtSecret) as any;
        
        // Store authenticated socket info
        this.authenticatedSockets.set(socket.id, {
          id: socket.id,
          userId: decoded.id || decoded.userId,
        });

        logger.info('Socket authenticated', {
          socketId: socket.id,
          userId: decoded.id || decoded.userId
        });

        next();
      } catch (error) {
        logger.error('Socket authentication failed', { error, socketId: socket.id });
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      const socketInfo = this.authenticatedSockets.get(socket.id);
      if (!socketInfo) {
        socket.disconnect();
        return;
      }

      logger.info('Client connected', {
        socketId: socket.id,
        userId: socketInfo.userId
      });

      // Join negotiation room
      socket.on('join_negotiation', async (data: { 
        sessionId: string; 
        language: SupportedLanguage;
        userType: 'VENDOR' | 'CUSTOMER';
      }) => {
        try {
          const { sessionId, language, userType } = data;

          // Verify user has access to this session
          const room = await NegotiationRoomModel.findBySessionId(sessionId);
          if (!room) {
            socket.emit('error', { message: 'Negotiation room not found' });
            return;
          }

          if (room.vendorId !== socketInfo.userId && room.customerId !== socketInfo.userId) {
            socket.emit('error', { message: 'Unauthorized access to negotiation room' });
            return;
          }

          // Update socket info
          socketInfo.sessionId = sessionId;
          socketInfo.userType = userType;
          socketInfo.language = language;

          // Join socket room
          await socket.join(`negotiation_${sessionId}`);

          // If customer joining for first time, update the negotiation room
          if (userType === 'CUSTOMER' && !room.customerId) {
            const joinResult = await this.qrSessionService.joinSession(
              sessionId,
              socketInfo.userId,
              language
            );

            if (joinResult.success) {
              // Notify vendor that customer joined
              socket.to(`negotiation_${sessionId}`).emit('customer_joined', {
                customerId: socketInfo.userId,
                customerLanguage: language,
                timestamp: new Date()
              });
            }
          }

          // Send current room state
          const updatedRoom = await NegotiationRoomModel.findBySessionId(sessionId);
          socket.emit('room_state', {
            room: updatedRoom?.toObject(),
            messages: updatedRoom?.messages || []
          });

          logger.info('User joined negotiation room', {
            socketId: socket.id,
            userId: socketInfo.userId,
            sessionId,
            userType
          });

        } catch (error) {
          logger.error('Failed to join negotiation', { error, socketId: socket.id });
          socket.emit('error', { message: 'Failed to join negotiation' });
        }
      });

      // Send message
      socket.on('send_message', async (data: {
        content: string;
        type: 'TEXT' | 'VOICE';
        audioData?: string; // Base64 encoded
      }) => {
        try {
          if (!socketInfo.sessionId || !socketInfo.userType || !socketInfo.language) {
            socket.emit('error', { message: 'Not joined to any negotiation room' });
            return;
          }

          const message = await this.negotiationService.sendMessage({
            sessionId: socketInfo.sessionId,
            senderId: socketInfo.userId,
            senderType: socketInfo.userType,
            content: data.content,
            type: data.type,
            language: socketInfo.language,
            audioData: data.audioData
          });

          // Broadcast message to all participants in the room
          this.io.to(`negotiation_${socketInfo.sessionId}`).emit('new_message', message);

          logger.info('Message sent via WebSocket', {
            messageId: message.id,
            sessionId: socketInfo.sessionId,
            senderId: socketInfo.userId,
            type: data.type
          });

        } catch (error) {
          logger.error('Failed to send message via WebSocket', { error, socketId: socket.id });
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Typing indicators
      socket.on('typing_start', async () => {
        if (!socketInfo.sessionId) return;

        await this.negotiationService.updateTypingStatus(
          socketInfo.sessionId,
          socketInfo.userId,
          true
        );

        socket.to(`negotiation_${socketInfo.sessionId}`).emit('user_typing', {
          userId: socketInfo.userId,
          isTyping: true,
          timestamp: new Date()
        });
      });

      socket.on('typing_stop', async () => {
        if (!socketInfo.sessionId) return;

        await this.negotiationService.updateTypingStatus(
          socketInfo.sessionId,
          socketInfo.userId,
          false
        );

        socket.to(`negotiation_${socketInfo.sessionId}`).emit('user_typing', {
          userId: socketInfo.userId,
          isTyping: false,
          timestamp: new Date()
        });
      });

      // Mark messages as read
      socket.on('mark_messages_read', async (data: { messageIds: string[] }) => {
        try {
          if (!socketInfo.sessionId) return;

          await this.negotiationService.markMessagesAsRead(
            socketInfo.sessionId,
            socketInfo.userId,
            data.messageIds
          );

          // Notify other participants
          socket.to(`negotiation_${socketInfo.sessionId}`).emit('messages_read', {
            userId: socketInfo.userId,
            messageIds: data.messageIds,
            timestamp: new Date()
          });

        } catch (error) {
          logger.error('Failed to mark messages as read', { error, socketId: socket.id });
        }
      });

      // Language change
      socket.on('change_language', async (data: { language: SupportedLanguage }) => {
        try {
          if (!socketInfo.sessionId) return;

          socketInfo.language = data.language;

          // Notify other participants about language change
          socket.to(`negotiation_${socketInfo.sessionId}`).emit('language_changed', {
            userId: socketInfo.userId,
            newLanguage: data.language,
            timestamp: new Date()
          });

          logger.info('User changed language', {
            socketId: socket.id,
            userId: socketInfo.userId,
            sessionId: socketInfo.sessionId,
            newLanguage: data.language
          });

        } catch (error) {
          logger.error('Failed to change language', { error, socketId: socket.id });
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info('Client disconnected', {
          socketId: socket.id,
          userId: socketInfo.userId,
          reason
        });

        // Clean up typing indicators
        if (socketInfo.sessionId) {
          this.negotiationService.updateTypingStatus(
            socketInfo.sessionId,
            socketInfo.userId,
            false
          ).catch(error => {
            logger.error('Failed to cleanup typing status on disconnect', { error });
          });

          // Notify other participants
          socket.to(`negotiation_${socketInfo.sessionId}`).emit('user_disconnected', {
            userId: socketInfo.userId,
            timestamp: new Date()
          });
        }

        // Remove from authenticated sockets
        this.authenticatedSockets.delete(socket.id);
      });

      // Error handling
      socket.on('error', (error) => {
        logger.error('Socket error', { error, socketId: socket.id });
      });
    });
  }

  // Public methods for external services to broadcast events

  /**
   * Broadcast message translation update
   */
  public async broadcastMessageTranslated(
    sessionId: string, 
    message: NegotiationMessage
  ): Promise<void> {
    this.io.to(`negotiation_${sessionId}`).emit('message_translated', message);
  }

  /**
   * Broadcast session status update
   */
  public async broadcastSessionUpdate(
    sessionId: string, 
    update: any
  ): Promise<void> {
    this.io.to(`negotiation_${sessionId}`).emit('session_update', update);
  }

  /**
   * Broadcast agreement reached
   */
  public async broadcastAgreementReached(
    sessionId: string, 
    agreementDetails: any
  ): Promise<void> {
    this.io.to(`negotiation_${sessionId}`).emit('agreement_reached', agreementDetails);
  }

  /**
   * Get connected users for a session
   */
  public async getConnectedUsers(sessionId: string): Promise<string[]> {
    const room = this.io.sockets.adapter.rooms.get(`negotiation_${sessionId}`);
    if (!room) return [];

    const connectedUsers: string[] = [];
    for (const socketId of room) {
      const socketInfo = this.authenticatedSockets.get(socketId);
      if (socketInfo) {
        connectedUsers.push(socketInfo.userId);
      }
    }

    return connectedUsers;
  }

  /**
   * Check if user is connected to a session
   */
  public async isUserConnected(sessionId: string, userId: string): Promise<boolean> {
    const connectedUsers = await this.getConnectedUsers(sessionId);
    return connectedUsers.includes(userId);
  }

  /**
   * Gracefully shutdown WebSocket server
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down WebSocket service');
    
    // Notify all connected clients
    this.io.emit('server_shutdown', {
      message: 'Server is shutting down. Please reconnect in a moment.',
      timestamp: new Date()
    });

    // Close all connections
    this.io.close();
  }
}