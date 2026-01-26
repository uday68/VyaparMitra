import express from 'express';
import { InventoryService } from '../services/inventory_service';
import { NegotiationService } from '../services/negotiation_service';
import { QRSessionService } from '../services/qr_session';
import { TTSService } from '../voice/tts_service';
import { VoiceIntentService } from '../services/voice_intent';
import { TranslationService } from '../services/translation_service';
import { HealthService } from '../utils/health';

const router = express.Router();

// Products API
router.get('/products', async (req, res) => {
  try {
    const { vendorId, category, search, inStock, minPrice, maxPrice } = req.query;
    
    const filter = {
      vendorId: vendorId as string,
      category: category as string,
      search: search as string,
      inStock: inStock === 'true',
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
    };

    const products = await InventoryService.searchProducts(filter);
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const product = await InventoryService.getProductById(req.params.id);
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Failed to fetch product:', error);
    res.status(404).json({ success: false, error: 'Product not found' });
  }
});

router.post('/products', async (req, res) => {
  try {
    const { vendorId, name, description, basePrice, stock, category, images } = req.body;
    
    const productData = {
      name,
      description,
      basePrice,
      stock,
      category,
      images,
    };

    const product = await InventoryService.addProduct(vendorId, productData);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('Failed to create product:', error);
    res.status(400).json({ success: false, error: 'Failed to create product' });
  }
});

router.patch('/products/:id', async (req, res) => {
  try {
    const updates = req.body;
    const product = await InventoryService.updateProduct(req.params.id, updates);
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Failed to update product:', error);
    res.status(400).json({ success: false, error: 'Failed to update product' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await InventoryService.deleteProduct(req.params.id);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Failed to delete product:', error);
    res.status(400).json({ success: false, error: 'Failed to delete product' });
  }
});

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
router.post('/translate', async (req, res) => {
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