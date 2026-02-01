// GraphQL Resolver for Cross-Language Negotiations
import { 
  Resolver, 
  Query, 
  Mutation, 
  Subscription, 
  Arg, 
  Ctx, 
  PubSub, 
  PubSubEngine,
  Authorized,
  ID
} from 'type-graphql';
import { 
  NegotiationMessage, 
  NegotiationRoom, 
  MessageInput,
  SupportedLanguage 
} from '../../types/qr-commerce';
import { NegotiationRoomModel } from '../../db/schemas/negotiation-room';
import { QRSessionService } from '../../services/qr_session_service';
import { TranslationService } from '../../services/translation_service';
import { VoiceProcessingService } from '../../services/voice_processing_service';
import { QRCommerceRedisSchemas } from '../../db/redis-schemas';
import { logger } from '../../utils/logger';
import { Context } from '../../types/context';

// GraphQL Types
import { ObjectType, Field, InputType, registerEnumType } from 'type-graphql';

registerEnumType(SupportedLanguage, {
  name: 'SupportedLanguage',
});

@ObjectType()
class GraphQLMessage {
  @Field(() => ID)
  id: string;

  @Field()
  sessionId: string;

  @Field()
  senderId: string;

  @Field()
  senderType: 'VENDOR' | 'CUSTOMER';

  @Field()
  content: string;

  @Field()
  originalContent: string;

  @Field(() => SupportedLanguage)
  language: SupportedLanguage;

  @Field(() => SupportedLanguage)
  targetLanguage: SupportedLanguage;

  @Field()
  type: 'TEXT' | 'VOICE';

  @Field()
  translationStatus: 'PENDING' | 'COMPLETED' | 'FAILED';

  @Field({ nullable: true })
  audioUrl?: string;

  @Field()
  timestamp: Date;

  @Field({ nullable: true })
  deliveredAt?: Date;

  @Field({ nullable: true })
  readAt?: Date;
}

@ObjectType()
class GraphQLNegotiationRoom {
  @Field(() => ID)
  id: string;

  @Field()
  sessionId: string;

  @Field()
  vendorId: string;

  @Field({ nullable: true })
  customerId?: string;

  @Field(() => SupportedLanguage)
  vendorLanguage: SupportedLanguage;

  @Field(() => SupportedLanguage, { nullable: true })
  customerLanguage?: SupportedLanguage;

  @Field()
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'ABANDONED';

  @Field(() => [GraphQLMessage])
  messages: GraphQLMessage[];

  @Field({ nullable: true })
  lastMessageAt?: Date;

  @Field()
  agreementReached: boolean;
}

@InputType()
class SendMessageInput {
  @Field()
  sessionId: string;

  @Field()
  content: string;

  @Field()
  type: 'TEXT' | 'VOICE';

  @Field(() => SupportedLanguage)
  language: SupportedLanguage;

  @Field({ nullable: true })
  audioData?: string; // Base64 encoded audio data
}

@InputType()
class JoinNegotiationInput {
  @Field()
  sessionId: string;

  @Field(() => SupportedLanguage)
  customerLanguage: SupportedLanguage;
}

@ObjectType()
class TypingIndicator {
  @Field()
  sessionId: string;

  @Field()
  userId: string;

  @Field()
  isTyping: boolean;

  @Field()
  timestamp: Date;
}

@Resolver()
export class CrossLanguageNegotiationResolver {
  constructor(
    private qrSessionService: QRSessionService,
    private translationService: TranslationService,
    private voiceProcessingService: VoiceProcessingService,
    private redisSchemas: QRCommerceRedisSchemas
  ) {}

  // Queries
  @Query(() => GraphQLNegotiationRoom, { nullable: true })
  @Authorized()
  async getNegotiationRoom(
    @Arg('sessionId') sessionId: string,
    @Ctx() ctx: Context
  ): Promise<GraphQLNegotiationRoom | null> {
    try {
      const room = await NegotiationRoomModel.findBySessionId(sessionId);
      if (!room) return null;

      // Verify user has access to this room
      const userId = ctx.user.id;
      if (room.vendorId !== userId && room.customerId !== userId) {
        throw new Error('Unauthorized access to negotiation room');
      }

      return this.mapToGraphQLRoom(room);
    } catch (error) {
      logger.error('Failed to get negotiation room', { error, sessionId });
      throw new Error('Failed to get negotiation room');
    }
  }

  @Query(() => [GraphQLMessage])
  @Authorized()
  async getMessageHistory(
    @Arg('sessionId') sessionId: string,
    @Arg('limit', { nullable: true }) limit: number = 50,
    @Ctx() ctx: Context
  ): Promise<GraphQLMessage[]> {
    try {
      const room = await NegotiationRoomModel.findBySessionId(sessionId);
      if (!room) return [];

      // Verify user has access
      const userId = ctx.user.id;
      if (room.vendorId !== userId && room.customerId !== userId) {
        throw new Error('Unauthorized access to messages');
      }

      const messages = room.messages
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
        .reverse();

      return messages.map(this.mapToGraphQLMessage);
    } catch (error) {
      logger.error('Failed to get message history', { error, sessionId });
      throw new Error('Failed to get message history');
    }
  }

  // Mutations
  @Mutation(() => GraphQLNegotiationRoom)
  @Authorized()
  async joinNegotiation(
    @Arg('input') input: JoinNegotiationInput,
    @Ctx() ctx: Context,
    @PubSub() pubSub: PubSubEngine
  ): Promise<GraphQLNegotiationRoom> {
    try {
      const { sessionId, customerLanguage } = input;
      const customerId = ctx.user.id;

      // Join the session
      const result = await this.qrSessionService.joinSession(
        sessionId,
        customerId,
        customerLanguage
      );

      if (!result.success || !result.negotiationRoom) {
        throw new Error('Failed to join negotiation session');
      }

      const room = this.mapToGraphQLRoom(result.negotiationRoom);

      // Notify vendor that customer joined
      await pubSub.publish(`NEGOTIATION_ROOM_${sessionId}`, {
        type: 'CUSTOMER_JOINED',
        room,
        timestamp: new Date()
      });

      // Record analytics
      await this.redisSchemas.recordSessionEvent(sessionId, 'CUSTOMER_JOINED_GRAPHQL', {
        customerId,
        customerLanguage
      });

      logger.info('Customer joined negotiation via GraphQL', {
        sessionId,
        customerId,
        customerLanguage
      });

      return room;
    } catch (error) {
      logger.error('Failed to join negotiation', { error, input });
      throw new Error('Failed to join negotiation');
    }
  }

  @Mutation(() => GraphQLMessage)
  @Authorized()
  async sendMessage(
    @Arg('input') input: SendMessageInput,
    @Ctx() ctx: Context,
    @PubSub() pubSub: PubSubEngine
  ): Promise<GraphQLMessage> {
    try {
      const { sessionId, content, type, language, audioData } = input;
      const senderId = ctx.user.id;

      // Get negotiation room
      const room = await NegotiationRoomModel.findBySessionId(sessionId);
      if (!room) {
        throw new Error('Negotiation room not found');
      }

      // Verify user has access
      if (room.vendorId !== senderId && room.customerId !== senderId) {
        throw new Error('Unauthorized access to send message');
      }

      // Determine sender type and target language
      const senderType = room.vendorId === senderId ? 'VENDOR' : 'CUSTOMER';
      const targetLanguage = senderType === 'VENDOR' 
        ? room.customerLanguage || 'en'
        : room.vendorLanguage;

      // Process voice message if needed
      let processedContent = content;
      let audioUrl: string | undefined;

      if (type === 'VOICE' && audioData) {
        try {
          // Convert base64 to buffer
          const audioBuffer = Buffer.from(audioData, 'base64');
          
          // Process speech to text
          const sttResult = await this.voiceProcessingService.speechToText(audioBuffer, language);
          processedContent = sttResult.text;
          
          // Store audio file (implementation depends on your file storage)
          audioUrl = await this.storeAudioFile(audioBuffer, sessionId);
        } catch (voiceError) {
          logger.error('Voice processing failed', { error: voiceError, sessionId });
          // Fallback to text content if voice processing fails
        }
      }

      // Create message
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const message: Partial<NegotiationMessage> = {
        id: messageId,
        sessionId,
        senderId,
        senderType,
        content: processedContent,
        originalContent: processedContent,
        language,
        targetLanguage,
        type,
        translationStatus: 'PENDING',
        audioUrl,
        timestamp: new Date()
      };

      // Add message to room
      await room.addMessage(message);

      // Start translation process asynchronously
      this.translateMessageAsync(messageId, sessionId, processedContent, language, targetLanguage, pubSub);

      const graphqlMessage = this.mapToGraphQLMessage(message as NegotiationMessage);

      // Publish message immediately (original version)
      await pubSub.publish(`MESSAGES_${sessionId}`, {
        type: 'NEW_MESSAGE',
        message: graphqlMessage,
        timestamp: new Date()
      });

      // Record analytics
      await this.redisSchemas.recordSessionEvent(sessionId, 'MESSAGE_SENT', {
        senderId,
        senderType,
        messageType: type,
        language
      });

      logger.info('Message sent in negotiation', {
        sessionId,
        messageId,
        senderId,
        type
      });

      return graphqlMessage;
    } catch (error) {
      logger.error('Failed to send message', { error, input });
      throw new Error('Failed to send message');
    }
  }

  @Mutation(() => Boolean)
  @Authorized()
  async updateTypingStatus(
    @Arg('sessionId') sessionId: string,
    @Arg('isTyping') isTyping: boolean,
    @Ctx() ctx: Context,
    @PubSub() pubSub: PubSubEngine
  ): Promise<boolean> {
    try {
      const userId = ctx.user.id;

      // Update typing indicator in Redis
      await this.redisSchemas.setTypingIndicator(sessionId, userId, isTyping);

      // Publish typing status
      await pubSub.publish(`TYPING_${sessionId}`, {
        type: 'TYPING_UPDATE',
        typingIndicator: {
          sessionId,
          userId,
          isTyping,
          timestamp: new Date()
        }
      });

      return true;
    } catch (error) {
      logger.error('Failed to update typing status', { error, sessionId, isTyping });
      return false;
    }
  }

  // Subscriptions
  @Subscription(() => GraphQLMessage, {
    topics: ({ args }) => `MESSAGES_${args.sessionId}`
  })
  @Authorized()
  async messageUpdates(
    @Arg('sessionId') sessionId: string,
    @Ctx() ctx: Context
  ): AsyncIterator<GraphQLMessage> {
    // Verify user has access to this session
    const room = await NegotiationRoomModel.findBySessionId(sessionId);
    if (!room) {
      throw new Error('Negotiation room not found');
    }

    const userId = ctx.user.id;
    if (room.vendorId !== userId && room.customerId !== userId) {
      throw new Error('Unauthorized access to message updates');
    }

    // Return async iterator (implementation depends on your GraphQL subscription setup)
    return {} as AsyncIterator<GraphQLMessage>;
  }

  @Subscription(() => TypingIndicator, {
    topics: ({ args }) => `TYPING_${args.sessionId}`
  })
  @Authorized()
  async typingUpdates(
    @Arg('sessionId') sessionId: string,
    @Ctx() ctx: Context
  ): AsyncIterator<TypingIndicator> {
    // Verify access similar to messageUpdates
    const room = await NegotiationRoomModel.findBySessionId(sessionId);
    if (!room) {
      throw new Error('Negotiation room not found');
    }

    const userId = ctx.user.id;
    if (room.vendorId !== userId && room.customerId !== userId) {
      throw new Error('Unauthorized access to typing updates');
    }

    return {} as AsyncIterator<TypingIndicator>;
  }

  @Subscription(() => GraphQLNegotiationRoom, {
    topics: ({ args }) => `NEGOTIATION_ROOM_${args.sessionId}`
  })
  @Authorized()
  async negotiationRoomUpdates(
    @Arg('sessionId') sessionId: string,
    @Ctx() ctx: Context
  ): AsyncIterator<GraphQLNegotiationRoom> {
    // Verify access
    const room = await NegotiationRoomModel.findBySessionId(sessionId);
    if (!room) {
      throw new Error('Negotiation room not found');
    }

    const userId = ctx.user.id;
    if (room.vendorId !== userId && room.customerId !== userId) {
      throw new Error('Unauthorized access to room updates');
    }

    return {} as AsyncIterator<GraphQLNegotiationRoom>;
  }

  // Private helper methods
  private async translateMessageAsync(
    messageId: string,
    sessionId: string,
    content: string,
    fromLanguage: SupportedLanguage,
    toLanguage: SupportedLanguage,
    pubSub: PubSubEngine
  ): Promise<void> {
    try {
      // Translate the message
      const translationResult = await this.translationService.translateMessage(
        content,
        fromLanguage,
        toLanguage
      );

      // Update message in database
      const room = await NegotiationRoomModel.findBySessionId(sessionId);
      if (room) {
        const message = room.messages.find(m => m.id === messageId);
        if (message) {
          message.content = translationResult.translatedText;
          message.translationStatus = 'COMPLETED';
          await room.save();

          // Publish translated message
          await pubSub.publish(`MESSAGES_${sessionId}`, {
            type: 'MESSAGE_TRANSLATED',
            message: this.mapToGraphQLMessage(message),
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      logger.error('Translation failed', { error, messageId, sessionId });
      
      // Mark translation as failed
      const room = await NegotiationRoomModel.findBySessionId(sessionId);
      if (room) {
        const message = room.messages.find(m => m.id === messageId);
        if (message) {
          message.translationStatus = 'FAILED';
          await room.save();

          await pubSub.publish(`MESSAGES_${sessionId}`, {
            type: 'MESSAGE_TRANSLATION_FAILED',
            message: this.mapToGraphQLMessage(message),
            timestamp: new Date()
          });
        }
      }
    }
  }

  private async storeAudioFile(audioBuffer: Buffer, sessionId: string): Promise<string> {
    // Implementation depends on your file storage solution
    // This is a placeholder - you might use AWS S3, local storage, etc.
    const filename = `audio_${sessionId}_${Date.now()}.wav`;
    const audioUrl = `/api/audio/${filename}`;
    
    // Store the file (implementation needed)
    // await this.fileStorageService.store(filename, audioBuffer);
    
    return audioUrl;
  }

  private mapToGraphQLMessage(message: any): GraphQLMessage {
    return {
      id: message.id,
      sessionId: message.sessionId,
      senderId: message.senderId,
      senderType: message.senderType,
      content: message.content,
      originalContent: message.originalContent,
      language: message.language,
      targetLanguage: message.targetLanguage,
      type: message.type,
      translationStatus: message.translationStatus,
      audioUrl: message.audioUrl,
      timestamp: message.timestamp,
      deliveredAt: message.deliveredAt,
      readAt: message.readAt
    };
  }

  private mapToGraphQLRoom(room: any): GraphQLNegotiationRoom {
    return {
      id: room.id,
      sessionId: room.sessionId,
      vendorId: room.vendorId,
      customerId: room.customerId,
      vendorLanguage: room.vendorLanguage,
      customerLanguage: room.customerLanguage,
      status: room.status,
      messages: room.messages.map(this.mapToGraphQLMessage),
      lastMessageAt: room.lastMessageAt,
      agreementReached: room.agreementReached
    };
  }
}