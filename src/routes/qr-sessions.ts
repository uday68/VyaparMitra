// REST API endpoints for QR Sessions and Cross-Language Commerce
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Pool } from 'pg';
import { RedisClientType } from 'redis';
import { QRSessionService } from '../services/qr_session_service';
import { TranslationService } from '../services/translation_service';
import { VoiceProcessingService } from '../services/voice_processing_service';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { rateLimiters } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';
import { SupportedLanguage } from '../types/qr-commerce';

// Validation schemas
const generateGeneralQRSchema = z.object({
  vendorId: z.string().uuid('Invalid vendor ID'),
  vendorLanguage: z.enum(['en', 'hi', 'bn', 'te', 'ta', 'ml', 'kn', 'gu', 'mr', 'pa', 'or', 'as'])
});

const generateQRSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  vendorLanguage: z.enum(['en', 'hi', 'bn', 'te', 'ta', 'ml', 'kn', 'gu', 'mr', 'pa', 'or', 'as'])
});

const validateQRSchema = z.object({
  qrToken: z.string().min(1, 'QR token is required')
});

const joinSessionSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  customerLanguage: z.enum(['en', 'hi', 'bn', 'te', 'ta', 'ml', 'kn', 'gu', 'mr', 'pa', 'or', 'as'])
});

const sendMessageSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  content: z.string().min(1, 'Message content is required'),
  type: z.enum(['TEXT', 'VOICE']),
  language: z.enum(['en', 'hi', 'bn', 'te', 'ta', 'ml', 'kn', 'gu', 'mr', 'pa', 'or', 'as']),
  audioData: z.string().optional() // Base64 encoded audio
});

export function createQRSessionsRouter(
  db: Pool,
  redis: RedisClientType
): Router {
  const router = Router();
  
  // Initialize services
  const qrSessionService = new QRSessionService(db, redis);
  const translationService = new TranslationService(db, redis);
  const voiceProcessingService = new VoiceProcessingService(db, redis);

  /**
   * POST /api/qr-sessions/generate-general
   * Generate QR code for general conversation
   */
  router.post('/generate-general', 
    authenticateToken,
    rateLimiters.general,
    validateRequest({ body: generateGeneralQRSchema }),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { vendorId, vendorLanguage } = req.body;
        const authenticatedVendorId = req.user?.id;

        if (!authenticatedVendorId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        // Ensure vendor can only generate QR codes for themselves
        if (vendorId !== authenticatedVendorId) {
          return res.status(403).json({
            success: false,
            error: 'You can only generate QR codes for your own account'
          });
        }

        const qrCodeData = await qrSessionService.generateGeneralQRCode(
          vendorId,
          vendorLanguage as SupportedLanguage
        );

        logger.info('General QR code generated via API', {
          vendorId,
          sessionId: qrCodeData.sessionId
        });

        res.json({
          success: true,
          ...qrCodeData
        });

      } catch (error) {
        logger.error('General QR generation API error', { error, body: req.body });
        res.status(500).json({
          success: false,
          error: 'Failed to generate general QR code'
        });
      }
    }
  );

  /**
   * POST /api/qr-sessions/generate
   * Generate QR code for a product
   */
  router.post('/generate', 
    authenticateToken,
    rateLimiters.general, // Use general rate limiter instead of api
    validateRequest({ body: generateQRSchema }),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { productId, vendorLanguage } = req.body;
        const vendorId = req.user?.id;

        if (!vendorId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        // Verify vendor owns the product (optional - depends on your business logic)
        // const productOwnership = await verifyProductOwnership(vendorId, productId);
        // if (!productOwnership) {
        //   return res.status(403).json({
        //     success: false,
        //     error: 'You do not have permission to create QR codes for this product'
        //   });
        // }

        const qrCodeData = await qrSessionService.generateQRCode(
          vendorId,
          productId,
          vendorLanguage as SupportedLanguage
        );

        logger.info('QR code generated via API', {
          vendorId,
          productId,
          sessionId: qrCodeData.sessionId
        });

        res.json({
          success: true,
          ...qrCodeData
        });

      } catch (error) {
        logger.error('QR generation API error', { error, body: req.body });
        res.status(500).json({
          success: false,
          error: 'Failed to generate QR code'
        });
      }
    }
  );

  /**
   * POST /api/qr-sessions/validate
   * Validate QR code and get session information
   */
  router.post('/validate',
    rateLimiters.general, // Use general rate limiter
    validateRequest({ body: validateQRSchema }),
    async (req: Request, res: Response) => {
      try {
        const { qrToken } = req.body;

        const validation = await qrSessionService.validateQRCode(qrToken);

        if (validation.isValid) {
          logger.info('QR code validated successfully', {
            sessionId: validation.sessionId,
            vendorId: validation.vendorId
          });
        } else {
          logger.warn('Invalid QR code validation attempt', { qrToken: qrToken.substring(0, 20) });
        }

        res.json(validation);

      } catch (error) {
        logger.error('QR validation API error', { error });
        res.status(500).json({
          isValid: false,
          sessionId: '',
          vendorId: '',
          productId: '',
          vendorLanguage: 'en',
          expiresAt: new Date(),
          error: 'Validation failed'
        });
      }
    }
  );

  /**
   * POST /api/qr-sessions/join
   * Join a negotiation session as a customer
   */
  router.post('/join',
    authenticateToken,
    rateLimiters.general, // Use general rate limiter
    validateRequest({ body: joinSessionSchema }),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { sessionId, customerLanguage } = req.body;
        const customerId = req.user?.id;

        if (!customerId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        const result = await qrSessionService.joinSession(
          sessionId,
          customerId,
          customerLanguage as SupportedLanguage
        );

        if (result.success) {
          logger.info('Customer joined session via API', {
            sessionId,
            customerId,
            customerLanguage
          });
        }

        res.json(result);

      } catch (error) {
        logger.error('Session join API error', { error, body: req.body });
        res.status(500).json({
          success: false,
          error: 'Failed to join session'
        });
      }
    }
  );

  /**
   * GET /api/qr-sessions/active
   * Get active sessions for the authenticated user
   */
  router.get('/active',
    authenticateToken,
    rateLimiters.general, // Use general rate limiter
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        // Get active sessions from database
        const query = `
          SELECT 
            id as "sessionId",
            vendor_id as "vendorId", 
            product_id as "productId",
            vendor_language as "vendorLanguage",
            customer_language as "customerLanguage",
            status,
            created_at as "createdAt",
            expires_at as "expiresAt",
            last_activity_at as "lastActivityAt"
          FROM qr_sessions 
          WHERE (vendor_id = $1 OR customer_id = $1) 
            AND status IN ('ACTIVE', 'JOINED')
            AND expires_at > NOW()
          ORDER BY created_at DESC
          LIMIT 20
        `;

        const result = await db.query(query, [userId]);

        res.json({
          success: true,
          sessions: result.rows.map(row => ({
            ...row,
            isValid: true
          }))
        });

      } catch (error) {
        logger.error('Get active sessions API error', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to get active sessions',
          sessions: []
        });
      }
    }
  );

  /**
   * POST /api/qr-sessions/:sessionId/end
   * End a session
   */
  router.post('/:sessionId/end',
    authenticateToken,
    rateLimiters.general, // Use general rate limiter
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { sessionId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        // Verify user has permission to end this session
        const session = await qrSessionService.getActiveSession(sessionId);
        if (!session) {
          return res.status(404).json({
            success: false,
            error: 'Session not found'
          });
        }

        if (session.vendorId !== userId) {
          return res.status(403).json({
            success: false,
            error: 'You do not have permission to end this session'
          });
        }

        await qrSessionService.expireSession(sessionId);

        logger.info('Session ended via API', { sessionId, userId });

        res.json({
          success: true,
          message: 'Session ended successfully'
        });

      } catch (error) {
        logger.error('End session API error', { error, sessionId: req.params.sessionId });
        res.status(500).json({
          success: false,
          error: 'Failed to end session'
        });
      }
    }
  );

  /**
   * POST /api/qr-sessions/translate
   * Translate text (utility endpoint)
   */
  router.post('/translate',
    authenticateToken,
    rateLimiters.translation, // Use translation rate limiter
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { text, fromLanguage, toLanguage } = req.body;

        if (!text || !fromLanguage || !toLanguage) {
          return res.status(400).json({
            success: false,
            error: 'Text, fromLanguage, and toLanguage are required'
          });
        }

        const result = await translationService.translateMessage(
          text,
          fromLanguage as SupportedLanguage,
          toLanguage as SupportedLanguage
        );

        res.json({
          success: true,
          ...result
        });

      } catch (error) {
        logger.error('Translation API error', { error, body: req.body });
        res.status(500).json({
          success: false,
          error: 'Translation failed',
          translatedText: req.body.text // Fallback to original text
        });
      }
    }
  );

  /**
   * POST /api/qr-sessions/voice/stt
   * Speech-to-text conversion
   */
  router.post('/voice/stt',
    authenticateToken,
    rateLimiters.voice, // Use voice rate limiter
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { audioData, language } = req.body;

        if (!audioData || !language) {
          return res.status(400).json({
            success: false,
            error: 'Audio data and language are required'
          });
        }

        // Convert base64 to buffer
        const audioBuffer = Buffer.from(audioData, 'base64');

        const result = await voiceProcessingService.speechToText(
          audioBuffer,
          language as SupportedLanguage
        );

        res.json({
          success: true,
          ...result
        });

      } catch (error) {
        logger.error('STT API error', { error });
        res.status(500).json({
          success: false,
          error: 'Speech-to-text conversion failed',
          text: '',
          confidence: 0
        });
      }
    }
  );

  /**
   * POST /api/qr-sessions/voice/tts
   * Text-to-speech conversion
   */
  router.post('/voice/tts',
    authenticateToken,
    rateLimiters.voice, // Use voice rate limiter
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { text, language, voiceProfile } = req.body;

        if (!text || !language) {
          return res.status(400).json({
            success: false,
            error: 'Text and language are required'
          });
        }

        const result = await voiceProcessingService.textToSpeech(
          text,
          language as SupportedLanguage,
          voiceProfile
        );

        // Convert buffer to base64 for JSON response
        const audioDataBase64 = result.audioData.toString('base64');

        res.json({
          success: true,
          audioData: audioDataBase64,
          duration: result.duration,
          language: result.language,
          voiceProfile: result.voiceProfile
        });

      } catch (error) {
        logger.error('TTS API error', { error });
        res.status(500).json({
          success: false,
          error: 'Text-to-speech conversion failed'
        });
      }
    }
  );

  /**
   * GET /api/qr-sessions/audio/:messageId
   * Retrieve audio file for a message
   */
  router.get('/audio/:messageId',
    rateLimiters.general,
    async (req: Request, res: Response) => {
      try {
        const { messageId } = req.params;
        
        // Get audio data from Redis
        const audioKey = `audio:${messageId}`;
        const audioBase64 = await redis.get(audioKey);
        
        if (!audioBase64) {
          return res.status(404).json({
            success: false,
            error: 'Audio file not found or expired'
          });
        }

        // Convert base64 back to buffer
        const audioBuffer = Buffer.from(audioBase64, 'base64');
        
        // Set appropriate headers
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Length', audioBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
        
        res.send(audioBuffer);

      } catch (error) {
        logger.error('Audio retrieval error', { error, messageId: req.params.messageId });
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve audio file'
        });
      }
    }
  );
  router.get('/health',
    rateLimiters.general, // Use general rate limiter
    async (req: Request, res: Response) => {
      try {
        const [translationHealth, voiceHealth] = await Promise.all([
          TranslationService.isHealthy(),
          voiceProcessingService.isHealthy()
        ]);

        const isHealthy = translationHealth.bhashini || translationHealth.fallback;

        res.status(isHealthy ? 200 : 503).json({
          status: isHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          services: {
            translation: translationHealth,
            voice: voiceHealth,
            database: true, // Would need actual DB health check
            redis: true // Would need actual Redis health check
          }
        });

      } catch (error) {
        logger.error('Health check error', { error });
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Health check failed'
        });
      }
    }
  );

  return router;
}