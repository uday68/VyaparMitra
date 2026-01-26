import { RedisService } from '../db/redis';
import { QRService, QRCodeData } from '../utils/qr';
import * as crypto from 'crypto';

export interface QRSession {
  sessionId: string;
  vendorId: string;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
}

export class QRSessionService {
  private static readonly SESSION_TTL = 30 * 60; // 30 minutes in seconds
  private static readonly SESSION_PREFIX = 'qr_session:';

  static async createQRSession(vendorId: string): Promise<QRSession> {
    try {
      const sessionId = crypto.randomUUID();
      const createdAt = Date.now();
      const expiresAt = createdAt + (this.SESSION_TTL * 1000);

      const session: QRSession = {
        sessionId,
        vendorId,
        createdAt,
        expiresAt,
        isActive: true,
      };

      // Store session in Redis with TTL
      await RedisService.createQRSession(sessionId, vendorId, this.SESSION_TTL);

      // Store additional session metadata
      const sessionKey = `${this.SESSION_PREFIX}meta:${sessionId}`;
      await RedisService.setWithTTL(
        sessionKey,
        JSON.stringify(session),
        this.SESSION_TTL
      );

      console.log(`✅ QR session created: ${sessionId} for vendor: ${vendorId}`);
      return session;
    } catch (error) {
      console.error('Failed to create QR session:', error);
      throw error;
    }
  }

  static async validateQRSession(sessionId: string): Promise<QRSession | null> {
    try {
      // Check if session exists in Redis
      const vendorId = await RedisService.validateQRSession(sessionId);
      if (!vendorId) {
        return null;
      }

      // Get session metadata
      const sessionKey = `${this.SESSION_PREFIX}meta:${sessionId}`;
      const sessionData = await RedisService.get(sessionKey);
      
      if (!sessionData) {
        return null;
      }

      const session: QRSession = JSON.parse(sessionData);
      
      // Double-check expiration
      if (Date.now() > session.expiresAt) {
        await this.invalidateSession(sessionId);
        return null;
      }

      return session;
    } catch (error) {
      console.error('Failed to validate QR session:', error);
      return null;
    }
  }

  static async invalidateSession(sessionId: string): Promise<boolean> {
    try {
      // Remove from Redis
      const sessionKey = `qr_session:${sessionId}`;
      const metaKey = `${this.SESSION_PREFIX}meta:${sessionId}`;
      
      await Promise.all([
        RedisService.delete(sessionKey),
        RedisService.delete(metaKey),
      ]);

      console.log(`✅ QR session invalidated: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('Failed to invalidate QR session:', error);
      return false;
    }
  }

  static async extendSession(sessionId: string, additionalSeconds: number = 1800): Promise<boolean> {
    try {
      const session = await this.validateQRSession(sessionId);
      if (!session) {
        return false;
      }

      // Extend expiration time
      session.expiresAt += additionalSeconds * 1000;

      // Update in Redis
      const sessionKey = `qr_session:${sessionId}`;
      const metaKey = `${this.SESSION_PREFIX}meta:${sessionId}`;
      
      await Promise.all([
        RedisService.setWithTTL(sessionKey, session.vendorId, additionalSeconds),
        RedisService.setWithTTL(metaKey, JSON.stringify(session), additionalSeconds),
      ]);

      console.log(`✅ QR session extended: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('Failed to extend QR session:', error);
      return false;
    }
  }

  static async getActiveSessionsForVendor(vendorId: string): Promise<QRSession[]> {
    try {
      // This would require scanning Redis keys, which is not ideal for production
      // In a real implementation, you might maintain a separate index
      // For now, return empty array as this is primarily for monitoring
      return [];
    } catch (error) {
      console.error('Failed to get active sessions:', error);
      return [];
    }
  }

  static async createSessionFromQRData(qrContent: string): Promise<QRSession | null> {
    try {
      const qrData = QRService.parseQRData(qrContent);
      if (!qrData) {
        return null;
      }

      // Check if session already exists
      const existingSession = await this.validateQRSession(qrData.sessionId);
      if (existingSession) {
        return existingSession;
      }

      // Create new session from QR data
      const session: QRSession = {
        sessionId: qrData.sessionId,
        vendorId: qrData.vendorId,
        createdAt: qrData.timestamp,
        expiresAt: qrData.expiresAt,
        isActive: true,
      };

      // Calculate remaining TTL
      const remainingTTL = Math.max(0, Math.floor((qrData.expiresAt - Date.now()) / 1000));
      
      if (remainingTTL <= 0) {
        return null; // QR code has expired
      }

      // Store in Redis
      await RedisService.createQRSession(qrData.sessionId, qrData.vendorId, remainingTTL);
      
      const metaKey = `${this.SESSION_PREFIX}meta:${qrData.sessionId}`;
      await RedisService.setWithTTL(metaKey, JSON.stringify(session), remainingTTL);

      return session;
    } catch (error) {
      console.error('Failed to create session from QR data:', error);
      return null;
    }
  }

  static async generateVendorQR(): Promise<string> {
    // Generate a unique QR code for vendor registration
    const sessionId = crypto.randomUUID();
    const timestamp = Date.now();
    const expiresAt = timestamp + (this.SESSION_TTL * 1000);

    const qrData = {
      type: 'vendor_registration',
      sessionId,
      timestamp,
      expiresAt,
    };

    // Use QRService to generate the actual QR code
    const qrImageUrl = await QRService.generateQRWithCustomData(qrData);
    
    console.log(`✅ Vendor QR generated: ${sessionId}`);
    return qrImageUrl;
  }
  static async getSessionStats(): Promise<{
    activeSessions: number;
    totalSessionsToday: number;
    averageSessionDuration: number;
  }> {
    try {
      // In a real implementation, you would track these metrics
      // For now, return mock data
      return {
        activeSessions: 0,
        totalSessionsToday: 0,
        averageSessionDuration: 0,
      };
    } catch (error) {
      console.error('Failed to get session stats:', error);
      return {
        activeSessions: 0,
        totalSessionsToday: 0,
        averageSessionDuration: 0,
      };
    }
  }

  // Cleanup expired sessions (called by cron job)
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      // Redis automatically handles TTL expiration
      // This method could be used for additional cleanup or logging
      console.log('QR session cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
    }
  }
}