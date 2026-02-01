// QR Session Service - Manages QR code generation, validation, and session lifecycle
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { RedisClientType } from 'redis';
import { 
  QRSession, 
  QRCodeData, 
  SessionValidation, 
  NegotiationRoom,
  SupportedLanguage 
} from '../types/qr-commerce';
import { QRCommerceRedisSchemas } from '../db/redis-schemas';
import { NegotiationRoomModel } from '../db/schemas/negotiation-room';
import { logger } from '../utils/logger';

export class QRSessionService {
  private redisSchemas: QRCommerceRedisSchemas;

  constructor(
    private db: Pool,
    private redis: RedisClientType,
    private jwtSecret: string = process.env.JWT_SECRET || 'default-secret'
  ) {
    this.redisSchemas = new QRCommerceRedisSchemas(redis);
  }

  /**
   * Generate QR code for general conversation (no specific product)
   */
  async generateGeneralQRCode(
    vendorId: string, 
    vendorLanguage: SupportedLanguage
  ): Promise<QRCodeData> {
    try {
      const sessionId = uuidv4();
      const sessionToken = this.generateGeneralSessionToken(sessionId, vendorId);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create QR session in database (no product_id for general conversation)
      const query = `
        INSERT INTO qr_sessions (
          id, session_token, vendor_id, vendor_language, 
          expires_at, qr_code_url, status, session_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      // Generate QR code URL
      const qrCodeUrl = await this.generateQRCodeImage(sessionToken);

      const values = [
        sessionId,
        sessionToken,
        vendorId,
        vendorLanguage,
        expiresAt,
        qrCodeUrl,
        'ACTIVE',
        'GENERAL'
      ];

      const result = await this.db.query(query, values);
      const session = result.rows[0];

      // Create corresponding negotiation room for general conversation
      await this.createNegotiationRoom(sessionId, vendorId, vendorLanguage);

      // Cache session data
      await this.redisSchemas.cacheSession(sessionId, {
        sessionId,
        vendorId,
        productId: null, // No specific product
        vendorLanguage,
        expiresAt: expiresAt.toISOString(),
        status: 'ACTIVE',
        sessionType: 'GENERAL'
      });

      // Track active session
      await this.redisSchemas.addActiveSession(vendorId, sessionId);

      // Record analytics
      await this.redisSchemas.recordSessionEvent(sessionId, 'GENERAL_QR_GENERATED', {
        vendorId,
        vendorLanguage,
        sessionType: 'GENERAL'
      });

      logger.info('General QR code generated successfully', {
        sessionId,
        vendorId,
        expiresAt
      });

      return {
        qrCodeUrl,
        sessionToken,
        expiresAt,
        sessionId
      };

    } catch (error) {
      logger.error('Failed to generate general QR code', { error, vendorId });
      throw new Error('Failed to generate general QR code');
    }
  }

  /**
   * Generate QR code for a product negotiation session
   */
  async generateQRCode(
    vendorId: string, 
    productId: string, 
    vendorLanguage: SupportedLanguage
  ): Promise<QRCodeData> {
    try {
      const sessionId = uuidv4();
      const sessionToken = this.generateSessionToken(sessionId, vendorId, productId);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create QR session in database
      const query = `
        INSERT INTO qr_sessions (
          id, session_token, vendor_id, product_id, vendor_language, 
          expires_at, qr_code_url, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      // Generate QR code URL (will be updated after QR generation)
      const qrCodeUrl = await this.generateQRCodeImage(sessionToken);

      const values = [
        sessionId,
        sessionToken,
        vendorId,
        productId,
        vendorLanguage,
        expiresAt,
        qrCodeUrl,
        'ACTIVE'
      ];

      const result = await this.db.query(query, values);
      const session = result.rows[0];

      // Create corresponding negotiation room
      await this.createNegotiationRoom(sessionId, vendorId, vendorLanguage);

      // Cache session data
      await this.redisSchemas.cacheSession(sessionId, {
        sessionId,
        vendorId,
        productId,
        vendorLanguage,
        expiresAt: expiresAt.toISOString(),
        status: 'ACTIVE'
      });

      // Track active session
      await this.redisSchemas.addActiveSession(vendorId, sessionId);

      // Record analytics
      await this.redisSchemas.recordSessionEvent(sessionId, 'QR_GENERATED', {
        vendorId,
        productId,
        vendorLanguage
      });

      logger.info('QR code generated successfully', {
        sessionId,
        vendorId,
        productId,
        expiresAt
      });

      return {
        qrCodeUrl,
        sessionToken,
        expiresAt,
        sessionId
      };

    } catch (error) {
      logger.error('Failed to generate QR code', { error, vendorId, productId });
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Validate QR code and return session information
   */
  async validateQRCode(qrToken: string): Promise<SessionValidation> {
    try {
      // First try to decode the JWT token
      const decoded = this.decodeSessionToken(qrToken);
      if (!decoded) {
        return {
          isValid: false,
          sessionId: '',
          vendorId: '',
          productId: '',
          vendorLanguage: 'en',
          expiresAt: new Date()
        };
      }

      const { sessionId, vendorId, productId } = decoded;

      // Check cache first
      let sessionData = await this.redisSchemas.getCachedSession(sessionId);
      
      if (!sessionData) {
        // Fallback to database
        const query = `
          SELECT * FROM qr_sessions 
          WHERE session_token = $1 AND status IN ('ACTIVE', 'JOINED')
        `;
        const result = await this.db.query(query, [qrToken]);
        
        if (result.rows.length === 0) {
          return {
            isValid: false,
            sessionId,
            vendorId,
            productId,
            vendorLanguage: 'en',
            expiresAt: new Date()
          };
        }

        sessionData = result.rows[0];
        // Update cache
        await this.redisSchemas.cacheSession(sessionId, sessionData);
      }

      // Check if session is expired
      const expiresAt = new Date(sessionData.expires_at || sessionData.expiresAt);
      const isExpired = expiresAt < new Date();

      if (isExpired) {
        await this.expireSession(sessionId);
        return {
          isValid: false,
          sessionId,
          vendorId,
          productId: productId || '',
          vendorLanguage: sessionData.vendor_language || sessionData.vendorLanguage,
          expiresAt
        };
      }

      // Record validation event
      await this.redisSchemas.recordSessionEvent(sessionId, 'QR_VALIDATED', {
        validatedAt: new Date().toISOString()
      });

      return {
        isValid: true,
        sessionId,
        vendorId,
        productId: productId || '',
        vendorLanguage: sessionData.vendor_language || sessionData.vendorLanguage,
        expiresAt
      };

    } catch (error) {
      logger.error('Failed to validate QR code', { error, qrToken });
      return {
        isValid: false,
        sessionId: '',
        vendorId: '',
        productId: '',
        vendorLanguage: 'en',
        expiresAt: new Date()
      };
    }
  }

  /**
   * Create negotiation room for a session
   */
  async createNegotiationRoom(
    sessionId: string, 
    vendorId: string, 
    vendorLanguage: SupportedLanguage,
    customerLanguage?: SupportedLanguage
  ): Promise<NegotiationRoom> {
    try {
      const roomId = uuidv4();
      
      const negotiationRoom = await NegotiationRoomModel.create({
        id: roomId,
        sessionId,
        vendorId,
        vendorLanguage,
        customerLanguage,
        status: customerLanguage ? 'ACTIVE' : 'WAITING',
        messages: [],
        agreementReached: false
      });

      logger.info('Negotiation room created', {
        roomId,
        sessionId,
        vendorId,
        status: negotiationRoom.status
      });

      return negotiationRoom.toObject();

    } catch (error) {
      logger.error('Failed to create negotiation room', { error, sessionId });
      throw new Error('Failed to create negotiation room');
    }
  }

  /**
   * Join a session as a customer
   */
  async joinSession(
    sessionId: string, 
    customerId: string, 
    customerLanguage: SupportedLanguage
  ): Promise<{ success: boolean; negotiationRoom?: NegotiationRoom }> {
    try {
      // Update QR session with customer info
      const updateQuery = `
        UPDATE qr_sessions 
        SET customer_language = $1, status = 'JOINED', last_activity_at = NOW()
        WHERE id = $2 AND status = 'ACTIVE'
        RETURNING *
      `;
      
      const result = await this.db.query(updateQuery, [customerLanguage, sessionId]);
      
      if (result.rows.length === 0) {
        return { success: false };
      }

      // Update negotiation room
      const negotiationRoom = await NegotiationRoomModel.findBySessionId(sessionId);
      if (!negotiationRoom) {
        return { success: false };
      }

      negotiationRoom.customerId = customerId;
      negotiationRoom.customerLanguage = customerLanguage;
      await negotiationRoom.markAsActive();

      // Update cache
      await this.redisSchemas.invalidateSession(sessionId);
      
      // Record join event
      await this.redisSchemas.recordSessionEvent(sessionId, 'CUSTOMER_JOINED', {
        customerId,
        customerLanguage,
        joinedAt: new Date().toISOString()
      });

      logger.info('Customer joined session', {
        sessionId,
        customerId,
        customerLanguage
      });

      return { 
        success: true, 
        negotiationRoom: negotiationRoom.toObject() 
      };

    } catch (error) {
      logger.error('Failed to join session', { error, sessionId, customerId });
      return { success: false };
    }
  }

  /**
   * Get active session by ID
   */
  async getActiveSession(sessionId: string): Promise<QRSession | null> {
    try {
      // Check cache first
      let sessionData = await this.redisSchemas.getCachedSession(sessionId);
      
      if (!sessionData) {
        const query = `
          SELECT * FROM qr_sessions 
          WHERE id = $1 AND status IN ('ACTIVE', 'JOINED')
        `;
        const result = await this.db.query(query, [sessionId]);
        
        if (result.rows.length === 0) {
          return null;
        }

        sessionData = result.rows[0];
        await this.redisSchemas.cacheSession(sessionId, sessionData);
      }

      return this.mapDbRowToSession(sessionData);

    } catch (error) {
      logger.error('Failed to get active session', { error, sessionId });
      return null;
    }
  }

  /**
   * Expire a session
   */
  async expireSession(sessionId: string): Promise<void> {
    try {
      const query = `
        UPDATE qr_sessions 
        SET status = 'EXPIRED', last_activity_at = NOW()
        WHERE id = $1
      `;
      
      await this.db.query(query, [sessionId]);

      // Update negotiation room
      const negotiationRoom = await NegotiationRoomModel.findBySessionId(sessionId);
      if (negotiationRoom && negotiationRoom.status !== 'COMPLETED') {
        negotiationRoom.status = 'ABANDONED';
        await negotiationRoom.save();
      }

      // Clear cache
      await this.redisSchemas.invalidateSession(sessionId);

      // Record expiration
      await this.redisSchemas.recordSessionEvent(sessionId, 'SESSION_EXPIRED', {
        expiredAt: new Date().toISOString()
      });

      logger.info('Session expired', { sessionId });

    } catch (error) {
      logger.error('Failed to expire session', { error, sessionId });
    }
  }

  /**
   * Clean up expired sessions (called by background job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const query = `
        UPDATE qr_sessions 
        SET status = 'EXPIRED', last_activity_at = NOW()
        WHERE expires_at < NOW() AND status IN ('ACTIVE', 'JOINED')
        RETURNING id
      `;
      
      const result = await this.db.query(query);
      const expiredSessionIds = result.rows.map(row => row.id);

      // Update corresponding negotiation rooms
      for (const sessionId of expiredSessionIds) {
        const negotiationRoom = await NegotiationRoomModel.findBySessionId(sessionId);
        if (negotiationRoom && negotiationRoom.status !== 'COMPLETED') {
          negotiationRoom.status = 'ABANDONED';
          await negotiationRoom.save();
        }

        await this.redisSchemas.invalidateSession(sessionId);
      }

      logger.info('Cleaned up expired sessions', { count: expiredSessionIds.length });
      return expiredSessionIds.length;

    } catch (error) {
      logger.error('Failed to cleanup expired sessions', { error });
      return 0;
    }
  }

  // Private helper methods

  private generateGeneralSessionToken(sessionId: string, vendorId: string): string {
    const payload = {
      sessionId,
      vendorId,
      productId: null, // No specific product for general conversation
      type: 'qr_session_general',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: '24h' });
  }

  private generateSessionToken(sessionId: string, vendorId: string, productId: string): string {
    const payload = {
      sessionId,
      vendorId,
      productId,
      type: 'qr_session',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: '24h' });
  }

  private decodeSessionToken(token: string): { sessionId: string; vendorId: string; productId: string | null } | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      if (decoded.type !== 'qr_session' && decoded.type !== 'qr_session_general') {
        return null;
      }

      return {
        sessionId: decoded.sessionId,
        vendorId: decoded.vendorId,
        productId: decoded.productId || null
      };
    } catch (error) {
      return null;
    }
  }

  private async generateQRCodeImage(sessionToken: string): Promise<string> {
    try {
      // Create the QR code data URL
      const qrCodeDataUrl = await QRCode.toDataURL(sessionToken, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      return qrCodeDataUrl;
    } catch (error) {
      logger.error('Failed to generate QR code image', { error });
      throw new Error('Failed to generate QR code image');
    }
  }

  private mapDbRowToSession(row: any): QRSession {
    return {
      id: row.id,
      sessionToken: row.session_token || row.sessionToken,
      vendorId: row.vendor_id || row.vendorId,
      productId: row.product_id || row.productId,
      vendorLanguage: row.vendor_language || row.vendorLanguage,
      customerLanguage: row.customer_language || row.customerLanguage,
      status: row.status,
      createdAt: new Date(row.created_at || row.createdAt),
      expiresAt: new Date(row.expires_at || row.expiresAt),
      lastActivityAt: new Date(row.last_activity_at || row.lastActivityAt),
      qrCodeUrl: row.qr_code_url || row.qrCodeUrl
    };
  }
}