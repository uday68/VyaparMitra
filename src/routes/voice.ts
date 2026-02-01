import { Router } from 'express';
import { VoiceIntentService } from '../services/voice_intent';
import { VoiceWorkflowService, VoiceWorkflowState } from '../services/voice_workflow_service';
import { TTSService } from '../voice/tts_service';
import { TranslationService } from '../services/translation_service';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const voiceIntentSchema = {
  body: z.object({
    text: z.string().min(1).max(1000),
    language: z.string().min(2).max(5),
    userId: z.string().optional(),
    userType: z.enum(['vendor', 'customer']).optional()
  })
};

const ttsRequestSchema = {
  body: z.object({
    text: z.string().min(1).max(1000),
    language: z.string().min(2).max(5),
    userId: z.string().optional(),
    userType: z.enum(['vendor', 'customer']).optional()
  })
};

const translateRequestSchema = {
  body: z.object({
    text: z.string().min(1).max(5000),
    sourceLanguage: z.string().min(2).max(5),
    targetLanguage: z.string().min(2).max(5),
    context: z.enum(['negotiation', 'greeting', 'product_description', 'general']).optional()
  })
};

// Workflow-specific validation schemas
const workflowStartSchema = {
  body: z.object({
    userId: z.string().min(1),
    language: z.string().min(2).max(5)
  })
};

const workflowIntentSchema = {
  body: z.object({
    sessionId: z.string().min(1),
    text: z.string().min(1).max(1000),
    language: z.string().min(2).max(5).optional(),
    userId: z.string().optional(),
    userType: z.enum(['vendor', 'customer']).optional()
  })
};

const workflowUpdateSchema = {
  body: z.object({
    sessionId: z.string().min(1),
    state: z.nativeEnum(VoiceWorkflowState),
    data: z.object({
      photo: z.string().optional(),
      quantity: z.number().positive().optional(),
      price: z.number().positive().optional(),
      productName: z.string().optional(),
      unit: z.string().optional(),
      category: z.string().optional()
    }).optional()
  })
};

// Voice intent processing endpoint
router.post('/intent', validateRequest(voiceIntentSchema), async (req, res) => {
  try {
    const { text, language, userId, userType } = req.body;

    logger.info('Processing voice intent', {
      text: text.substring(0, 100), // Log first 100 chars for privacy
      language,
      userId,
      userType
    });

    // For text-based processing (when we already have transcribed text)
    const mockAudioData = Buffer.from('mock-audio-data'); // In production, this would be actual audio
    
    const result = await VoiceIntentService.processVoiceIntent({
      audioData: mockAudioData,
      userLanguage: language,
      userId,
      userType
    });

    // Generate appropriate response based on intent
    let response = '';
    let actionData = {};

    switch (result.intent) {
      case 'ADD_PRODUCT':
        response = 'I\'ll help you add a new product. Please provide the product details.';
        actionData = { 
          action: 'navigate',
          url: '/vendor/add-product',
          entities: result.entities
        };
        break;

      case 'START_VOICE_PRODUCT_WORKFLOW':
        response = 'Starting voice-guided product addition. Let\'s begin by taking a photo of your product.';
        actionData = {
          action: 'start_voice_workflow',
          workflowType: 'product_addition',
          sessionId: result.sessionId,
          workflowState: result.workflowState,
          entities: result.entities
        };
        break;

      case 'START_NEGOTIATION':
        response = 'Starting negotiation for the selected product.';
        actionData = {
          action: 'start_negotiation',
          productId: result.entities.product_id,
          entities: result.entities
        };
        break;

      case 'ACCEPT_BID':
        response = 'Bid accepted successfully. Processing the transaction.';
        actionData = {
          action: 'accept_bid',
          bidId: result.entities.bid_id,
          entities: result.entities
        };
        break;

      case 'REJECT_BID':
        response = 'Bid rejected. You can make a counter offer.';
        actionData = {
          action: 'reject_bid',
          bidId: result.entities.bid_id,
          entities: result.entities
        };
        break;

      case 'COUNTER_BID':
        response = 'Making counter bid with your new price.';
        actionData = {
          action: 'counter_bid',
          bidId: result.entities.bid_id,
          newPrice: result.entities.new_price,
          entities: result.entities
        };
        break;

      case 'CHECK_STOCK':
        response = 'Checking stock levels for the requested product.';
        actionData = {
          action: 'check_stock',
          productName: result.entities.product_name,
          entities: result.entities
        };
        break;

      case 'HELP':
        response = 'Here are the available voice commands you can use.';
        actionData = {
          action: 'show_help',
          commands: VoiceIntentService.getSupportedIntents()
        };
        break;

      case 'GREETING':
        response = 'Hello! Welcome to VyaparMitra. How can I assist you today?';
        actionData = {
          action: 'greeting',
          supportedLanguages: VoiceIntentService.getSupportedLanguages('GREETING')
        };
        break;

      // Workflow-specific intents
      case 'WORKFLOW_PHOTO_CAPTURE':
      case 'WORKFLOW_PHOTO_CONFIRM':
      case 'WORKFLOW_PHOTO_RETAKE':
      case 'WORKFLOW_QUANTITY_INPUT':
      case 'WORKFLOW_PRICE_INPUT':
      case 'WORKFLOW_CONFIRM':
      case 'WORKFLOW_CANCEL':
        response = 'Processing workflow command...';
        actionData = {
          action: 'workflow_command',
          intent: result.intent,
          sessionId: result.sessionId,
          workflowState: result.workflowState,
          entities: result.entities
        };
        break;

      default:
        response = 'I didn\'t understand that command. Please try again or say "help" for available commands.';
        actionData = {
          action: 'unknown',
          suggestion: 'Try saying "help" to see available commands'
        };
    }

    // Translate response to user's language if needed
    if (language !== 'en') {
      response = await TranslationService.translateWithContext(
        response,
        'en',
        language,
        'general'
      );
    }

    res.json({
      success: true,
      intent: result.intent,
      confidence: result.confidence,
      originalText: result.originalText,
      translatedText: result.translatedText,
      detectedLanguage: result.detectedLanguage,
      response,
      audioResponse: result.audioResponse,
      actionData,
      entities: result.entities,
      sessionId: result.sessionId,
      workflowState: result.workflowState
    });

  } catch (error) {
    logger.error('Voice intent processing failed', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: 'Failed to process voice intent',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Workflow session management endpoints

// Start a new voice workflow session
router.post('/workflow/start', authenticateToken, validateRequest(workflowStartSchema), async (req, res) => {
  try {
    const { userId, language } = req.body;

    logger.info('Starting voice workflow session', { userId, language });

    const session = await VoiceIntentService.startWorkflowSession(userId, language);

    res.json({
      success: true,
      sessionId: session.sessionId,
      userId: session.userId,
      language: session.language,
      state: session.state,
      data: session.data,
      expiresAt: session.expiresAt
    });

  } catch (error) {
    logger.error('Failed to start workflow session', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: 'Failed to start workflow session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Process workflow intent with session context
router.post('/workflow/intent', validateRequest(workflowIntentSchema), async (req, res) => {
  try {
    const { sessionId, text, language, userId, userType } = req.body;

    logger.info('Processing workflow intent', {
      sessionId,
      text: text.substring(0, 100),
      language,
      userId,
      userType
    });

    // Get workflow session
    const session = await VoiceIntentService.getWorkflowSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Workflow session not found',
        message: 'Session may have expired or does not exist'
      });
    }

    // Process intent with workflow context
    const mockAudioData = Buffer.from('mock-audio-data');
    const result = await VoiceIntentService.processVoiceIntent({
      audioData: mockAudioData,
      userLanguage: language || session.language,
      userId: userId || session.userId,
      userType,
      sessionId
    });

    // Generate workflow-specific response
    let response = '';
    let actionData = {};

    switch (result.workflowState) {
      case VoiceWorkflowState.PHOTO_CAPTURE:
        response = 'Please take a photo of your product. Say "take photo" when ready.';
        actionData = { action: 'capture_photo', state: result.workflowState };
        break;

      case VoiceWorkflowState.PHOTO_CONFIRMATION:
        response = 'Photo captured! Please confirm if the photo looks good or say "retake photo" to try again.';
        actionData = { action: 'confirm_photo', state: result.workflowState };
        break;

      case VoiceWorkflowState.QUANTITY_INPUT:
        response = 'Great! Now please tell me the quantity and unit. For example, "5 kilograms" or "10 pieces".';
        actionData = { action: 'input_quantity', state: result.workflowState };
        break;

      case VoiceWorkflowState.QUANTITY_CONFIRMATION:
        response = 'I heard the quantity. Please confirm if this is correct or provide the quantity again.';
        actionData = { 
          action: 'confirm_quantity', 
          state: result.workflowState,
          quantity: session.data.quantity,
          unit: session.data.unit
        };
        break;

      case VoiceWorkflowState.PRICE_INPUT:
        response = 'Perfect! Now please tell me the price per unit. For example, "50 rupees per kilogram".';
        actionData = { action: 'input_price', state: result.workflowState };
        break;

      case VoiceWorkflowState.PRICE_CONFIRMATION:
        response = 'I heard the price. Please confirm if this is correct or provide the price again.';
        actionData = { 
          action: 'confirm_price', 
          state: result.workflowState,
          price: session.data.price
        };
        break;

      case VoiceWorkflowState.COMPLETION:
        response = 'Excellent! Your product has been added successfully. You can now add another product or return to the main menu.';
        actionData = { 
          action: 'workflow_complete', 
          state: result.workflowState,
          productData: session.data
        };
        break;

      default:
        response = 'Processing your request...';
        actionData = { action: 'processing', state: result.workflowState };
    }

    // Translate response to user's language if needed
    const userLanguage = language || session.language;
    if (userLanguage !== 'en') {
      response = await TranslationService.translateWithContext(
        response,
        'en',
        userLanguage,
        'general'
      );
    }

    res.json({
      success: true,
      sessionId: result.sessionId,
      intent: result.intent,
      confidence: result.confidence,
      workflowState: result.workflowState,
      originalText: result.originalText,
      translatedText: result.translatedText,
      detectedLanguage: result.detectedLanguage,
      response,
      audioResponse: result.audioResponse,
      actionData,
      entities: result.entities,
      sessionData: session.data
    });

  } catch (error) {
    logger.error('Workflow intent processing failed', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: 'Failed to process workflow intent',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update workflow state manually (for external triggers like photo capture)
router.post('/workflow/update', authenticateToken, validateRequest(workflowUpdateSchema), async (req, res) => {
  try {
    const { sessionId, state, data } = req.body;

    logger.info('Updating workflow state', { sessionId, state, data });

    const updatedSession = await VoiceIntentService.updateWorkflowState(sessionId, state, data);

    res.json({
      success: true,
      sessionId: updatedSession.sessionId,
      userId: updatedSession.userId,
      language: updatedSession.language,
      state: updatedSession.state,
      data: updatedSession.data,
      updatedAt: updatedSession.updatedAt
    });

  } catch (error) {
    logger.error('Failed to update workflow state', { error, body: req.body });
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Workflow session not found',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update workflow state',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get workflow session details
router.get('/workflow/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    logger.info('Getting workflow session', { sessionId });

    const session = await VoiceIntentService.getWorkflowSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Workflow session not found',
        message: 'Session may have expired or does not exist'
      });
    }

    res.json({
      success: true,
      sessionId: session.sessionId,
      userId: session.userId,
      language: session.language,
      state: session.state,
      data: session.data,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt
    });

  } catch (error) {
    logger.error('Failed to get workflow session', { error, sessionId: req.params.sessionId });
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Complete workflow session
router.post('/workflow/:sessionId/complete', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    logger.info('Completing workflow session', { sessionId });

    const completed = await VoiceIntentService.completeWorkflowSession(sessionId);

    if (!completed) {
      return res.status(404).json({
        success: false,
        error: 'Workflow session not found',
        message: 'Session may have already been completed or does not exist'
      });
    }

    res.json({
      success: true,
      sessionId,
      completed: true,
      message: 'Workflow session completed successfully'
    });

  } catch (error) {
    logger.error('Failed to complete workflow session', { error, sessionId: req.params.sessionId });
    res.status(500).json({
      success: false,
      error: 'Failed to complete workflow session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user's active workflow sessions
router.get('/workflow/user/:userId/active', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    logger.info('Getting user active workflow sessions', { userId });

    const sessions = await VoiceIntentService.getUserActiveSessions(userId);

    res.json({
      success: true,
      userId,
      activeSessions: sessions.map(session => ({
        sessionId: session.sessionId,
        language: session.language,
        state: session.state,
        data: session.data,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt
      })),
      count: sessions.length
    });

  } catch (error) {
    logger.error('Failed to get user active sessions', { error, userId: req.params.userId });
    res.status(500).json({
      success: false,
      error: 'Failed to get active sessions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Text-to-Speech endpoint
router.post('/tts', validateRequest(ttsRequestSchema), async (req, res) => {
  try {
    const { text, language, userId, userType } = req.body;

    logger.info('Processing TTS request', {
      text: text.substring(0, 100),
      language,
      userId,
      userType
    });

    const result = await TTSService.speakMultilingual(
      text,
      language,
      userId,
      userType
    );

    res.json({
      success: true,
      audioUrl: result.audioUrl,
      duration: result.duration,
      cached: result.cached,
      language
    });

  } catch (error) {
    logger.error('TTS processing failed', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: 'Failed to generate speech',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Translation endpoint
router.post('/translate', validateRequest(translateRequestSchema), async (req, res) => {
  try {
    const { text, sourceLanguage, targetLanguage, context } = req.body;

    logger.info('Processing translation request', {
      text: text.substring(0, 100),
      sourceLanguage,
      targetLanguage,
      context
    });

    const translatedText = context 
      ? await TranslationService.translateWithContext(text, sourceLanguage, targetLanguage, context)
      : await TranslationService.translateText(text, sourceLanguage, targetLanguage);

    res.json({
      success: true,
      originalText: text,
      translatedText,
      sourceLanguage,
      targetLanguage,
      context
    });

  } catch (error) {
    logger.error('Translation failed', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: 'Translation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Language detection endpoint
router.post('/detect-language', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    // Simple language detection based on Unicode ranges
    const detectLanguage = (text: string): string => {
      const unicodeRanges = {
        'hi': /[\u0900-\u097F]/,  // Devanagari
        'bn': /[\u0980-\u09FF]/,  // Bengali
        'gu': /[\u0A80-\u0AFF]/,  // Gujarati
        'pa': /[\u0A00-\u0A7F]/,  // Gurmukhi
        'or': /[\u0B00-\u0B7F]/,  // Oriya
        'ta': /[\u0B80-\u0BFF]/,  // Tamil
        'te': /[\u0C00-\u0C7F]/,  // Telugu
        'kn': /[\u0C80-\u0CFF]/,  // Kannada
        'ml': /[\u0D00-\u0D7F]/,  // Malayalam
        'as': /[\u0980-\u09FF]/,  // Assamese
        'mr': /[\u0900-\u097F]/   // Marathi
      };

      for (const [lang, regex] of Object.entries(unicodeRanges)) {
        if (regex.test(text)) {
          return lang;
        }
      }

      return 'en'; // Default to English
    };

    const detectedLanguage = detectLanguage(text);
    const confidence = detectedLanguage === 'en' ? 0.7 : 0.9; // Higher confidence for non-English

    logger.info('Language detected', {
      text: text.substring(0, 50),
      detectedLanguage,
      confidence
    });

    res.json({
      success: true,
      detectedLanguage,
      confidence,
      supportedLanguages: VoiceIntentService.getSupportedLanguages('GREETING')
    });

  } catch (error) {
    logger.error('Language detection failed', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: 'Language detection failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get supported languages and intents
router.get('/capabilities', (req, res) => {
  try {
    const supportedIntents = VoiceIntentService.getSupportedIntents();
    const languageCapabilities: Record<string, string[]> = {};

    // Get supported languages for each intent
    for (const intent of supportedIntents) {
      languageCapabilities[intent] = VoiceIntentService.getSupportedLanguages(intent);
    }

    res.json({
      success: true,
      supportedIntents,
      languageCapabilities,
      totalLanguages: 12,
      totalIntents: supportedIntents.length
    });

  } catch (error) {
    logger.error('Failed to get voice capabilities', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get capabilities'
    });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const voiceIntentHealth = await VoiceIntentService.isHealthy();
    const ttsHealth = {
      tacotron: await TTSService.checkTacotronHealth(),
      voicebox: await TTSService.checkVoiceboxHealth(),
      sv2tts: await TTSService.checkSV2TTSHealth()
    };
    const translationHealth = await TranslationService.isHealthy();

    const overallHealth = voiceIntentHealth && 
                         (ttsHealth.tacotron || ttsHealth.voicebox) && 
                         (translationHealth.bhashini || translationHealth.fallback);

    res.json({
      success: true,
      healthy: overallHealth,
      services: {
        voiceIntent: voiceIntentHealth,
        tts: ttsHealth,
        translation: translationHealth
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Voice health check failed', { error });
    res.status(500).json({
      success: false,
      healthy: false,
      error: 'Health check failed'
    });
  }
});

export default router;