import express from 'express';
import { InventoryService } from '../services/inventory_service';
import { NegotiationService } from '../services/negotiation_service';
import { QRSessionService } from '../services/qr_session';
import { TTSService } from '../voice/tts_service';
import { VoiceIntentService } from '../services/voice_intent';
import { TranslationService } from '../services/translation_service';
import { ImageStorageService } from '../services/image_storage';
import { HealthService } from '../utils/health';
import { authenticateToken, requireUserType, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { validateRequest, productSchemas, negotiationSchemas, voiceSchemas, qrSchemas } from '../middleware/validation';
import { rateLimiters, burstProtection, dynamicRateLimit } from '../middleware/rateLimiter';
import { logHelpers, PerformanceMonitor } from '../utils/logger';

const router = express.Router();

// Products API
router.get('/products', 
  optionalAuth,
  validateRequest(productSchemas.list),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { vendorId, category, search, inStock, minPrice, maxPrice, page, limit } = req.query as any;
      
      const filter = {
        vendorId: vendorId as string,
        category: category as string,
        search: search as string,
        inStock: inStock === 'true',
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      };

      const products = await PerformanceMonitor.measure(
        'products_search',
        () => InventoryService.searchProducts(filter, { page, limit }),
        { filter, userId: req.user?.id }
      );

      res.json({ success: true, data: products });
    } catch (error) {
      logHelpers.databaseError('products_fetch', error, { userId: req.user?.id });
      console.error('Failed to fetch products:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch products' });
    }
  }
);

router.get('/products/:id', 
  optionalAuth,
  validateRequest(productSchemas.get),
  async (req: AuthenticatedRequest, res) => {
    try {
      const product = await InventoryService.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      res.json({ success: true, data: product });
    } catch (error) {
      console.error('Failed to fetch product:', error);
      res.status(404).json({ success: false, error: 'Product not found' });
    }
  }
);

router.post('/products', 
  authenticateToken,
  requireUserType('vendor'),
  burstProtection.productCreation,
  validateRequest(productSchemas.create),
  async (req: AuthenticatedRequest, res) => {
    try {
      const vendorId = req.user!.id;
      const { name, description, basePrice, stock, category, images } = req.body;
      
      const productData = {
        name,
        description,
        basePrice,
        stock,
        category,
        images,
      };

      const product = await InventoryService.addProduct(vendorId, productData);
      
      logHelpers.businessEvent('product_created', {
        productId: product._id,
        vendorId,
        name,
        basePrice,
      });

      res.status(201).json({ success: true, data: product });
    } catch (error) {
      logHelpers.databaseError('product_creation', error, { vendorId: req.user!.id });
      console.error('Failed to create product:', error);
      res.status(400).json({ success: false, error: 'Failed to create product' });
    }
  }
);

router.patch('/products/:id', 
  authenticateToken,
  requireUserType('vendor'),
  validateRequest(productSchemas.update),
  async (req: AuthenticatedRequest, res) => {
    try {
      const updates = req.body;
      const product = await InventoryService.updateProduct(req.params.id, updates, req.user!.id);
      res.json({ success: true, data: product });
    } catch (error) {
      console.error('Failed to update product:', error);
      res.status(400).json({ success: false, error: 'Failed to update product' });
    }
  }
);

router.delete('/products/:id', 
  authenticateToken,
  requireUserType('vendor'),
  validateRequest(productSchemas.get),
  async (req: AuthenticatedRequest, res) => {
    try {
      await InventoryService.deleteProduct(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Failed to delete product:', error);
      res.status(400).json({ success: false, error: 'Failed to delete product' });
    }
  }
);

// Negotiations API
router.post('/negotiations', async (req, res) => {
  try {
    const { vendorId, customerId, productId } = req.body;
    
    const negotiation = await NegotiationService.createNegotiation(vendorId, customerId, productId);
    res.status(201).json({ 
      success: true, 
      data: negotiation,
      conversationId: negotiation.id 
    });
  } catch (error) {
    console.error('Failed to create negotiation:', error);
    res.status(400).json({ success: false, error: 'Failed to create negotiation' });
  }
});

router.get('/negotiations', async (req, res) => {
  try {
    const { userId, userType } = req.query;
    
    if (!userId || !userType) {
      return res.status(400).json({ success: false, error: 'userId and userType are required' });
    }

    const negotiations = await NegotiationService.getUserNegotiations(
      userId as string, 
      userType as 'vendor' | 'customer'
    );
    
    res.json({ success: true, data: negotiations });
  } catch (error) {
    console.error('Failed to fetch negotiations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch negotiations' });
  }
});

router.get('/negotiations/:id', async (req, res) => {
  try {
    const negotiation = await NegotiationService.getNegotiationById(parseInt(req.params.id));
    if (!negotiation) {
      return res.status(404).json({ success: false, error: 'Negotiation not found' });
    }
    
    const bids = await NegotiationService.getNegotiationBids(negotiation.id);
    
    res.json({ 
      success: true, 
      data: { 
        ...negotiation, 
        bids 
      } 
    });
  } catch (error) {
    console.error('Failed to fetch negotiation:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch negotiation' });
  }
});

router.patch('/negotiations/:id/status', async (req, res) => {
  try {
    const { status, finalPrice } = req.body;
    const negotiationId = parseInt(req.params.id);
    
    // This would update the negotiation status
    // Implementation depends on your specific business logic
    
    res.json({ 
      success: true, 
      message: 'Negotiation status updated',
      data: { negotiationId, status, finalPrice }
    });
  } catch (error) {
    console.error('Failed to update negotiation status:', error);
    res.status(400).json({ success: false, error: 'Failed to update negotiation status' });
  }
});

// Bids API
router.post('/negotiations/:id/bids', async (req, res) => {
  try {
    const negotiationId = parseInt(req.params.id);
    const { bidderType, bidderId, amount, message, language, targetLanguage } = req.body;
    
    const result = await NegotiationService.createBid({
      negotiationId,
      bidderType,
      bidderId,
      amount,
      message,
      language,
      targetLanguage,
    });
    
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Failed to create bid:', error);
    res.status(400).json({ success: false, error: 'Failed to create bid' });
  }
});

router.post('/negotiations/:id/accept', async (req, res) => {
  try {
    const negotiationId = parseInt(req.params.id);
    const { accepterId, accepterType, language } = req.body;
    
    const result = await NegotiationService.acceptBid(negotiationId, accepterId, accepterType, language);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Failed to accept bid:', error);
    res.status(400).json({ success: false, error: 'Failed to accept bid' });
  }
});

router.post('/negotiations/:id/reject', async (req, res) => {
  try {
    const negotiationId = parseInt(req.params.id);
    const { rejecterId, rejectorType, language, reason } = req.body;
    
    const result = await NegotiationService.rejectBid(negotiationId, rejecterId, rejectorType, language, reason);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Failed to reject bid:', error);
    res.status(400).json({ success: false, error: 'Failed to reject bid' });
  }
});

// QR Session API
router.post('/qr/session', async (req, res) => {
  try {
    const { vendorId } = req.body;
    const session = await QRSessionService.createQRSession(vendorId);
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    console.error('Failed to create QR session:', error);
    res.status(400).json({ success: false, error: 'Failed to create QR session' });
  }
});

router.get('/qr/session/:sessionId', async (req, res) => {
  try {
    const session = await QRSessionService.validateQRSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found or expired' });
    }
    
    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Failed to validate QR session:', error);
    res.status(500).json({ success: false, error: 'Failed to validate QR session' });
  }
});

// Voice & TTS API
router.post('/voice/intent', async (req, res) => {
  try {
    const { text, language, userId, userType } = req.body;
    
    const result = await VoiceIntentService.processVoiceCommand(text, language, userId, userType);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Failed to process voice intent:', error);
    res.status(400).json({ success: false, error: 'Failed to process voice intent' });
  }
});

router.post('/voice/tts', async (req, res) => {
  try {
    const { text, language, userId, userType } = req.body;
    
    const result = await TTSService.speak({ text, language, userId, userType });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Failed to generate TTS:', error);
    res.status(400).json({ success: false, error: 'Failed to generate TTS' });
  }
});

router.post('/voice/profile', async (req, res) => {
  try {
    const { userId, userType, consentGiven } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Audio file is required' });
    }
    
    const result = await TTSService.createVoiceProfile(userId, userType, req.file.buffer, consentGiven);
    res.json({ success: true, data: { created: result } });
  } catch (error) {
    console.error('Failed to create voice profile:', error);
    res.status(400).json({ success: false, error: 'Failed to create voice profile' });
  }
});

// Translation API
router.post('/translate', 
  rateLimiters.translation,
  validateRequest(voiceSchemas.translate),
  async (req, res) => {
    try {
      const { text, sourceLanguage, targetLanguage, context } = req.body;
      
      const translatedText = context 
        ? await TranslationService.translateWithContext(text, sourceLanguage, targetLanguage, context)
        : await TranslationService.translateText(text, sourceLanguage, targetLanguage);
      
      res.json({ 
        success: true, 
        data: { 
          translatedText,
          sourceLanguage,
          targetLanguage 
        } 
      });
    } catch (error) {
      console.error('Failed to translate text:', error);
      res.status(400).json({ success: false, error: 'Failed to translate text' });
    }
  }
);

router.post('/translate/batch', 
  rateLimiters.translation,
  async (req, res) => {
    try {
      const { texts, sourceLanguage, targetLanguage } = req.body;
      
      if (!Array.isArray(texts) || texts.length === 0) {
        return res.status(400).json({ success: false, error: 'texts must be a non-empty array' });
      }

      if (texts.length > 100) {
        return res.status(400).json({ success: false, error: 'Maximum 100 texts allowed per batch' });
      }
      
      const translations = await TranslationService.translateBatch(texts, sourceLanguage, targetLanguage);
      
      res.json({ 
        success: true, 
        data: { 
          translations,
          sourceLanguage,
          targetLanguage,
          count: translations.length
        } 
      });
    } catch (error) {
      console.error('Failed to translate batch:', error);
      res.status(400).json({ success: false, error: 'Failed to translate batch' });
    }
  }
);

// Voice processing health checks
router.get('/voice/health', async (req, res) => {
  try {
    const ttsHealth = await TTSService.tacotron.isHealthy();
    const translationHealth = await TranslationService.isHealthy();
    
    const health = {
      tts: {
        tacotron: ttsHealth,
        voicebox: true, // Would implement similar health check
        sv2tts: true,   // Would implement similar health check
      },
      translation: translationHealth,
      timestamp: new Date().toISOString(),
    };

    const allHealthy = ttsHealth && 
                      translationHealth.bhashini && 
                      (translationHealth.fallback || !config.bhashini.fallback.enabled);

    res.status(allHealthy ? 200 : 503).json({
      success: true,
      status: allHealthy ? 'healthy' : 'degraded',
      data: health
    });
  } catch (error) {
    console.error('Voice health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Voice health check failed'
    });
  }
});

// Mock audio endpoint for development
router.get('/audio/mock/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    // Generate a simple beep sound for testing
    const sampleRate = 22050;
    const duration = 2; // 2 seconds
    const frequency = 440; // A4 note
    const samples = sampleRate * duration;
    
    // Create WAV header
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + samples * 2, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // PCM
    header.writeUInt16LE(1, 22); // Mono
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * 2, 28);
    header.writeUInt16LE(2, 32);
    header.writeUInt16LE(16, 34);
    header.write('data', 36);
    header.writeUInt32LE(samples * 2, 40);
    
    // Generate sine wave
    const audioData = Buffer.alloc(samples * 2);
    for (let i = 0; i < samples; i++) {
      const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
      const intSample = Math.round(sample * 32767);
      audioData.writeInt16LE(intSample, i * 2);
    }
    
    const wavFile = Buffer.concat([header, audioData]);
    
    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': wavFile.length,
      'Cache-Control': 'public, max-age=3600',
    });
    
    res.send(wavFile);
  } catch (error) {
    console.error('Failed to generate mock audio:', error);
    res.status(500).json({ success: false, error: 'Failed to generate mock audio' });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const health = await HealthService.checkHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

export default router;