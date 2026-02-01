// Negotiation Service - Manages real-time communication and message handling
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import { RedisClientType } from 'redis';
import { 
  NegotiationMessage, 
  MessageInput, 
  SupportedLanguage,
  TranslationResult 
} from '../types/qr-commerce';
import { TranslationService } from './translation_service';
import { VoiceProcessingService } from './voice_processing_service';
import { NegotiationRoomModel } from '../db/schemas/negotiation-room';
import { QRCommerceRedisSchemas } from '../db/redis-schemas';
import { logger } from '../utils/logger';

export class NegotiationService {
  private translationService: TranslationService;
  private voiceProcessingService: VoiceProcessingService;
  private redisSchemas: QRCommerceRedisSchemas;

  constructor(
    private db: Pool,
    private redis: RedisClientType
  ) {
    this.translationService = new TranslationService(db, redis);
    this.voiceProcessingService = new VoiceProcessingService(db, redis);
    this.redisSchemas = new QRCommerceRedisSchemas(redis);
  }

  /**
   * Send a message in a negotiation session
   * Handles both text and voice messages with translation
   */
  async sendMessage(input: MessageInput & { 
    sessionId: string; 
    senderId: string; 
    senderType: 'VENDOR' | 'CUSTOMER' 
  }): Promise<NegotiationMessage> {
    try {
      const messageId = uuidv4();
      const timestamp = new Date().toISOString();

      // Get negotiation room to determine target language
      const room = await NegotiationRoomModel.findBySessionId(input.sessionId);
      if (!room) {
        throw new Error('Negotiation room not found');
      }

      // Determine target language based on sender type
      const targetLanguage: SupportedLanguage = input.senderType === 'VENDOR' 
        ? (room.customerLanguage as SupportedLanguage) || 'en'
        : (room.vendorLanguage as SupportedLanguage) || 'hi';

      let processedContent = input.content;
      let audioUrl: string | undefined;
      let translationResult: TranslationResult | null = null;

      // Process voice message if applicable
      if (input.type === 'VOICE' && input.audioData) {
        try {
          // Convert voice to text
          let audioBuffer: Buffer;
          if (typeof input.audioData === 'string') {
            // Base64 string from frontend
            audioBuffer = Buffer.from(input.audioData, 'base64');
          } else {
            // Blob from frontend - convert to buffer
            const arrayBuffer = await input.audioData.arrayBuffer();
            audioBuffer = Buffer.from(arrayBuffer);
          }
          
          const sttResult = await this.voiceProcessingService.speechToText(
            audioBuffer,
            input.language
          );
          
          processedContent = sttResult.text;
          
          // Store audio file and get URL
          audioUrl = await this.storeAudioFile(audioBuffer, messageId);
          
          logger.info('Voice message processed', {
            messageId,
            sessionId: input.sessionId,
            confidence: sttResult.confidence,
            originalLength: typeof input.audioData === 'string' ? input.audioData.length : input.audioData.size
          });
        } catch (error) {
          logger.error('Voice processing failed', { error, messageId });
          throw new Error('Failed to process voice message');
        }
      }

      // Translate message if needed
      if (input.language !== targetLanguage) {
        try {
          translationResult = await this.translationService.translateMessage(
            processedContent,
            input.language,
            targetLanguage
          );
          
          logger.info('Message translated', {
            messageId,
            fromLanguage: input.language,
            toLanguage: targetLanguage,
            confidence: translationResult.confidence
          });
        } catch (error) {
          logger.error('Translation failed', { error, messageId });
          // Continue with original message if translation fails
          translationResult = {
            translatedText: processedContent,
            originalText: processedContent,
            fromLanguage: input.language,
            toLanguage: targetLanguage,
            confidence: 0,
            translationProvider: 'FALLBACK' as const,
            cached: false
          };
        }
      }

      // Create message object
      const message: NegotiationMessage = {
        id: messageId,
        sessionId: input.sessionId,
        senderId: input.senderId,
        senderType: input.senderType,
        content: translationResult ? translationResult.translatedText : processedContent,
        originalContent: processedContent,
        language: input.language,
        targetLanguage,
        type: input.type,
        translationStatus: translationResult ? 'COMPLETED' : 'NOT_REQUIRED',
        audioUrl,
        timestamp: new Date(timestamp),
        deliveredAt: new Date(timestamp),
        readAt: undefined
      };

      // Store message in database
      await this.storeMessage(message);

      // Add message to negotiation room
      await room.addMessage(message);

      // Cache message for quick retrieval
      await this.redisSchemas.cacheMessage(input.sessionId, message);

      // Record analytics
      await this.redisSchemas.recordSessionEvent(input.sessionId, 'MESSAGE_SENT', {
        messageId,
        senderId: input.senderId,
        senderType: input.senderType,
        messageType: input.type,
        language: input.language,
        targetLanguage,
        translated: !!translationResult,
        timestamp
      });

      logger.info('Message sent successfully', {
        messageId,
        sessionId: input.sessionId,
        senderId: input.senderId,
        type: input.type,
        translated: !!translationResult
      });

      return message;

    } catch (error) {
      logger.error('Failed to send message', { 
        error, 
        sessionId: input.sessionId,
        senderId: input.senderId 
      });
      throw error;
    }
  }

  /**
   * Retrieve message history for a session
   */
  async getMessageHistory(
    sessionId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<NegotiationMessage[]> {
    try {
      // Try cache first
      const cachedMessages = await this.redisSchemas.getCachedMessages(sessionId, limit, offset);
      if (cachedMessages.length > 0) {
        return cachedMessages;
      }

      // Fallback to database
      const query = `
        SELECT 
          id,
          session_id as "sessionId",
          sender_id as "senderId",
          sender_type as "senderType",
          content,
          original_content as "originalContent",
          language,
          target_language as "targetLanguage",
          type,
          translation_status as "translationStatus",
          audio_url as "audioUrl",
          timestamp,
          delivered_at as "deliveredAt",
          read_at as "readAt"
        FROM negotiation_messages 
        WHERE session_id = $1 
        ORDER BY timestamp ASC
        LIMIT $2 OFFSET $3
      `;

      const result = await this.db.query(query, [sessionId, limit, offset]);
      const messages = result.rows;

      // Cache the results
      if (messages.length > 0) {
        await Promise.all(
          messages.map(msg => this.redisSchemas.cacheMessage(sessionId, msg))
        );
      }

      logger.info('Message history retrieved', {
        sessionId,
        messageCount: messages.length,
        limit,
        offset
      });

      return messages;

    } catch (error) {
      logger.error('Failed to retrieve message history', { error, sessionId });
      return [];
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(
    sessionId: string, 
    userId: string, 
    messageIds: string[]
  ): Promise<void> {
    try {
      const readAt = new Date().toISOString();

      // Update database
      const query = `
        UPDATE negotiation_messages 
        SET read_at = $1 
        WHERE session_id = $2 
          AND id = ANY($3) 
          AND sender_id != $4
          AND read_at IS NULL
      `;

      await this.db.query(query, [readAt, sessionId, messageIds, userId]);

      // Update cache
      await Promise.all(
        messageIds.map(messageId => 
          this.redisSchemas.updateMessageReadStatus(sessionId, messageId, readAt)
        )
      );

      // Record analytics
      await this.redisSchemas.recordSessionEvent(sessionId, 'MESSAGES_READ', {
        userId,
        messageIds,
        readAt,
        count: messageIds.length
      });

      logger.info('Messages marked as read', {
        sessionId,
        userId,
        messageCount: messageIds.length
      });

    } catch (error) {
      logger.error('Failed to mark messages as read', { error, sessionId, userId });
    }
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadMessageCount(sessionId: string, userId: string): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM negotiation_messages 
        WHERE session_id = $1 
          AND sender_id != $2 
          AND read_at IS NULL
      `;

      const result = await this.db.query(query, [sessionId, userId]);
      return parseInt(result.rows[0].count) || 0;

    } catch (error) {
      logger.error('Failed to get unread message count', { error, sessionId, userId });
      return 0;
    }
  }

  /**
   * Update typing status for real-time indicators
   */
  async updateTypingStatus(
    sessionId: string, 
    userId: string, 
    isTyping: boolean
  ): Promise<void> {
    try {
      const key = `typing:${sessionId}:${userId}`;
      
      if (isTyping) {
        // Set typing status with expiration
        await this.redis.setEx(key, 5, 'typing'); // 5 second expiration
      } else {
        // Remove typing status
        await this.redis.del(key);
      }

      // Publish typing event for real-time updates
      await this.redis.publish(`typing:${sessionId}`, JSON.stringify({
        sessionId,
        userId,
        isTyping,
        timestamp: new Date().toISOString()
      }));

      logger.debug('Typing status updated', { sessionId, userId, isTyping });

    } catch (error) {
      logger.error('Failed to update typing status', { error, sessionId, userId });
    }
  }

  /**
   * Get current typing users for a session
   */
  async getTypingUsers(sessionId: string): Promise<string[]> {
    try {
      const pattern = `typing:${sessionId}:*`;
      const keys = await this.redis.keys(pattern);
      
      // Extract user IDs from keys
      const typingUsers = keys.map(key => {
        const parts = key.split(':');
        return parts[parts.length - 1];
      });

      return typingUsers;

    } catch (error) {
      logger.error('Failed to get typing users', { error, sessionId });
      return [];
    }
  }

  /**
   * Store message in database
   */
  private async storeMessage(message: NegotiationMessage): Promise<void> {
    const query = `
      INSERT INTO negotiation_messages (
        id, session_id, sender_id, sender_type, content, original_content,
        language, target_language, type, translation_status, audio_url,
        timestamp, delivered_at, read_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;

    const values = [
      message.id,
      message.sessionId,
      message.senderId,
      message.senderType,
      message.content,
      message.originalContent,
      message.language,
      message.targetLanguage,
      message.type,
      message.translationStatus,
      message.audioUrl,
      message.timestamp,
      message.deliveredAt,
      message.readAt
    ];

    await this.db.query(query, values);
  }

  /**
   * Store audio file and return URL
   */
  private async storeAudioFile(audioData: Buffer, messageId: string): Promise<string> {
    try {
      // In a real implementation, you would store this in a file storage service
      // For now, we'll store in Redis with expiration (24 hours)
      
      // Convert buffer to base64 for storage
      const audioBase64 = audioData.toString('base64');
      const audioKey = `audio:${messageId}`;
      await this.redis.setEx(audioKey, 24 * 60 * 60, audioBase64);
      
      // Return a URL that can be used to retrieve the audio
      return `/api/qr-sessions/audio/${messageId}`;

    } catch (error) {
      logger.error('Failed to store audio file', { error, messageId });
      throw new Error('Failed to store audio file');
    }
  }

  /**
   * Clean up old messages and audio files
   */
  async cleanupOldMessages(olderThanDays: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Get messages to be deleted (to clean up audio files)
      const selectQuery = `
        SELECT id, audio_url 
        FROM negotiation_messages 
        WHERE timestamp < $1 AND audio_url IS NOT NULL
      `;
      
      const messagesToDelete = await this.db.query(selectQuery, [cutoffDate.toISOString()]);

      // Clean up audio files
      for (const message of messagesToDelete.rows) {
        const audioKey = `audio:${message.id}`;
        await this.redis.del(audioKey);
      }

      // Delete old messages
      const deleteQuery = `
        DELETE FROM negotiation_messages 
        WHERE timestamp < $1
      `;
      
      const result = await this.db.query(deleteQuery, [cutoffDate.toISOString()]);
      const deletedCount = result.rowCount || 0;

      logger.info('Old messages cleaned up', {
        deletedCount,
        cutoffDate: cutoffDate.toISOString(),
        audioFilesDeleted: messagesToDelete.rows.length
      });

      return deletedCount;

    } catch (error) {
      logger.error('Failed to cleanup old messages', { error });
      return 0;
    }
  }
}