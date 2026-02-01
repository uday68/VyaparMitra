import axios from 'axios';
import { Pool } from 'pg';
import { RedisClientType } from 'redis';
import { config } from '../config/settings';
import { logger } from '../utils/logger';
import { 
  TranslationResult, 
  ConversationContext, 
  SupportedLanguage 
} from '../types/qr-commerce';
import { QRCommerceRedisSchemas } from '../db/redis-schemas';

export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslationResponse {
  translatedText: string;
  confidence: number;
  sourceLanguage: string;
  targetLanguage: string;
  provider: 'bhashini' | 'fallback' | 'cache';
}

export class TranslationService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second
  private static translationCache = new Map<string, { translation: string; timestamp: number }>();
  private static readonly CACHE_TTL = 3600000; // 1 hour
  
  private redisSchemas: QRCommerceRedisSchemas;

  constructor(
    private db: Pool,
    private redis: RedisClientType
  ) {
    this.redisSchemas = new QRCommerceRedisSchemas(redis);
  }

  /**
   * Enhanced translation method with context awareness and caching
   */
  async translateMessage(
    text: string,
    fromLang: SupportedLanguage,
    toLang: SupportedLanguage
  ): Promise<TranslationResult> {
    // Skip translation if source and target are the same
    if (fromLang === toLang) {
      return {
        translatedText: text,
        confidence: 1.0,
        originalText: text,
        fromLanguage: fromLang,
        toLanguage: toLang,
        translationProvider: 'CACHED'
      };
    }

    try {
      // Check Redis cache first
      const cachedTranslation = await this.redisSchemas.getCachedTranslation(text, fromLang, toLang);
      if (cachedTranslation) {
        logger.debug('Translation served from Redis cache', { fromLang, toLang });
        return {
          translatedText: cachedTranslation.translatedText,
          confidence: cachedTranslation.confidence,
          originalText: text,
          fromLanguage: fromLang,
          toLanguage: toLang,
          translationProvider: 'CACHED'
        };
      }

      // Try BHASHINI translation
      const startTime = Date.now();
      let translationResult: TranslationResult;

      try {
        const bhashiniResponse = await this.callBhashiniAPI({
          text,
          sourceLanguage: fromLang,
          targetLanguage: toLang
        });

        translationResult = {
          translatedText: bhashiniResponse.translatedText,
          confidence: bhashiniResponse.confidence,
          originalText: text,
          fromLanguage: fromLang,
          toLanguage: toLang,
          translationProvider: 'BHASHINI'
        };

        // Record performance metrics
        const latency = Date.now() - startTime;
        await this.redisSchemas.recordTranslationLatency('BHASHINI', latency);

      } catch (bhashiniError) {
        logger.warn('BHASHINI translation failed, trying fallback', { error: bhashiniError });
        
        // Try fallback services
        const fallbackResponse = await this.callFallbackService({
          text,
          sourceLanguage: fromLang,
          targetLanguage: toLang
        });

        translationResult = {
          translatedText: fallbackResponse.translatedText,
          confidence: fallbackResponse.confidence,
          originalText: text,
          fromLanguage: fromLang,
          toLanguage: toLang,
          translationProvider: 'FALLBACK'
        };

        // Record performance metrics
        const latency = Date.now() - startTime;
        await this.redisSchemas.recordTranslationLatency('FALLBACK', latency);
      }

      // Cache the successful translation
      await this.redisSchemas.cacheTranslation(
        text,
        translationResult.translatedText,
        fromLang,
        toLang,
        translationResult.translationProvider,
        translationResult.confidence
      );

      // Store in PostgreSQL for analytics
      await this.storeTranslationInDB(translationResult);

      return translationResult;

    } catch (error) {
      logger.error('All translation attempts failed', { error, fromLang, toLang });
      
      // Return original text with failed status
      return {
        translatedText: text,
        confidence: 0.0,
        originalText: text,
        fromLanguage: fromLang,
        toLanguage: toLang,
        translationProvider: 'FALLBACK'
      };
    }
  }

  /**
   * Context-aware translation for better accuracy
   */
  async translateWithContext(
    text: string, 
    context: ConversationContext
  ): Promise<TranslationResult> {
    const { sessionId, previousMessages, negotiationTopic, productCategory } = context;
    
    // Build context for better translation
    let contextualText = text;
    
    // Add context markers based on conversation history
    if (previousMessages.length > 0) {
      const recentMessages = previousMessages.slice(-3); // Last 3 messages for context
      const contextKeywords = this.extractContextKeywords(recentMessages, productCategory);
      
      if (contextKeywords.length > 0) {
        contextualText = `[CONTEXT: ${contextKeywords.join(', ')}] ${text}`;
      }
    }

    // Add negotiation context
    if (negotiationTopic) {
      contextualText = `[TOPIC: ${negotiationTopic}] ${contextualText}`;
    }

    // Determine languages from context
    const fromLang = context.previousMessages.length > 0 
      ? context.previousMessages[context.previousMessages.length - 1].language
      : 'en' as SupportedLanguage;
    
    const toLang = context.previousMessages.length > 0
      ? context.previousMessages[context.previousMessages.length - 1].targetLanguage
      : 'hi' as SupportedLanguage;

    const result = await this.translateMessage(contextualText, fromLang, toLang);
    
    // Clean up context markers from result
    result.translatedText = result.translatedText.replace(/^\[.*?\]\s*/, '');
    
    return result;
  }

  /**
   * Get cached translation from Redis
   */
  async getCachedTranslation(
    text: string, 
    fromLang: SupportedLanguage, 
    toLang: SupportedLanguage
  ): Promise<string | null> {
    const cached = await this.redisSchemas.getCachedTranslation(text, fromLang, toLang);
    return cached ? cached.translatedText : null;
  }

  /**
   * Validate if language pair is supported
   */
  validateLanguagePair(fromLang: SupportedLanguage, toLang: SupportedLanguage): boolean {
    const supportedLanguages: SupportedLanguage[] = [
      'en', 'hi', 'bn', 'te', 'ta', 'ml', 'kn', 'gu', 'mr', 'pa', 'or', 'as'
    ];
    
    return supportedLanguages.includes(fromLang) && supportedLanguages.includes(toLang);
  }

  /**
   * Batch translation for multiple messages
   */
  async translateBatch(
    texts: string[],
    fromLang: SupportedLanguage,
    toLang: SupportedLanguage
  ): Promise<TranslationResult[]> {
    const translations = await Promise.all(
      texts.map(text => this.translateMessage(text, fromLang, toLang))
    );

    return translations;
  }

  // Private methods

  private async storeTranslationInDB(result: TranslationResult): Promise<void> {
    try {
      const query = `
        INSERT INTO translation_cache (
          source_text, translated_text, from_language, to_language, 
          provider, confidence, created_at, usage_count, last_used_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), 1, NOW())
        ON CONFLICT (source_text, from_language, to_language) 
        DO UPDATE SET 
          usage_count = translation_cache.usage_count + 1,
          last_used_at = NOW()
      `;

      await this.db.query(query, [
        result.originalText,
        result.translatedText,
        result.fromLanguage,
        result.toLanguage,
        result.translationProvider,
        result.confidence
      ]);
    } catch (error) {
      logger.error('Failed to store translation in database', { error });
      // Don't throw - this is not critical for the translation to succeed
    }
  }

  private extractContextKeywords(
    messages: any[], 
    productCategory: string
  ): string[] {
    const keywords: string[] = [];
    
    // Add product category
    if (productCategory) {
      keywords.push(productCategory);
    }

    // Extract common negotiation terms
    const negotiationTerms = [
      'price', 'cost', 'discount', 'quantity', 'delivery', 'quality',
      'मूल्य', 'कीमत', 'छूट', 'मात्रा', 'डिलीवरी', 'गुणवत्ता'
    ];

    messages.forEach(msg => {
      negotiationTerms.forEach(term => {
        if (msg.content.toLowerCase().includes(term.toLowerCase())) {
          keywords.push(term);
        }
      });
    });

    return [...new Set(keywords)]; // Remove duplicates
  }

  // Static methods for backward compatibility
  static async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> {
    // Skip translation if source and target are the same
    if (sourceLanguage === targetLanguage) {
      return text;
    }

    // Check cache first
    const cacheKey = `${text}:${sourceLanguage}:${targetLanguage}`;
    const cached = this.translationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      logger.debug('Translation served from cache', { cacheKey });
      return cached.translation;
    }

    let lastError: Error | null = null;

    // Check if BHASHINI is properly configured
    const bhashiniConfigured = config.bhashini.apiKey && 
                              config.bhashini.apiKey !== 'test_key_for_development' && 
                              config.bhashini.apiKey !== '';

    // Try BHASHINI first only if properly configured
    if (bhashiniConfigured) {
      for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
        try {
          const response = await this.callBhashiniAPI({
            text,
            sourceLanguage,
            targetLanguage,
          });

          // Cache successful translation
          this.translationCache.set(cacheKey, {
            translation: response.translatedText,
            timestamp: Date.now()
          });

          logger.info('Translation successful via BHASHINI', {
            sourceLanguage,
            targetLanguage,
            confidence: response.confidence
          });

          return response.translatedText;
        } catch (error) {
          lastError = error as Error;
          logger.warn(`BHASHINI translation attempt ${attempt} failed:`, error);

          if (attempt < this.MAX_RETRIES) {
            await this.delay(this.RETRY_DELAY * attempt);
          }
        }
      }
    } else {
      logger.warn('BHASHINI not configured, skipping to fallback', {
        apiKey: config.bhashini.apiKey ? 'present' : 'missing'
      });
    }

    // Try fallback service if enabled
    if (config.bhashini.fallback.enabled) {
      try {
        const fallbackResult = await this.callFallbackService({
          text,
          sourceLanguage,
          targetLanguage,
        });

        // Cache fallback translation
        this.translationCache.set(cacheKey, {
          translation: fallbackResult.translatedText,
          timestamp: Date.now()
        });

        logger.info('Translation successful via fallback service', {
          sourceLanguage,
          targetLanguage,
          provider: config.bhashini.fallback.service
        });

        return fallbackResult.translatedText;
      } catch (fallbackError) {
        logger.error('Fallback translation service also failed:', fallbackError);
      }
    }

    // If all services failed, return original text with warning
    logger.error('All translation attempts failed, returning original text:', lastError);
    return text; // Fallback to original text
  }

  private async callBhashiniAPI(request: TranslationRequest): Promise<TranslationResponse> {
    if (!config.bhashini.apiKey || config.bhashini.apiKey === 'test_key_for_development') {
      throw new Error('BHASHINI API key not configured or using test key');
    }

    const payload = {
      pipelineTasks: [
        {
          taskType: 'translation',
          config: {
            language: {
              sourceLanguage: request.sourceLanguage,
              targetLanguage: request.targetLanguage,
            },
          },
        },
      ],
      inputData: {
        input: [
          {
            source: request.text,
          },
        ],
      },
    };

    try {
      const response = await axios.post(
        `${config.bhashini.baseUrl}/v1/translate`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${config.bhashini.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: config.bhashini.timeout,
        }
      );

      if (!response.data || !response.data.pipelineResponse || !response.data.pipelineResponse[0]) {
        throw new Error('Invalid response structure from BHASHINI API');
      }

      const translationResult = response.data.pipelineResponse[0];
      
      if (!translationResult.output || !translationResult.output[0] || !translationResult.output[0].target) {
        throw new Error('Missing translation output in BHASHINI response');
      }
      
      return {
        translatedText: translationResult.output[0].target,
        confidence: translationResult.confidence || 0.9,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        provider: 'bhashini',
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(`BHASHINI API error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
        } else if (error.request) {
          throw new Error('BHASHINI API network error: No response received');
        }
      }
      throw error;
    }
  }

  private async callFallbackService(request: TranslationRequest): Promise<TranslationResponse> {
    const { service, apiKey } = config.bhashini.fallback;

    // Simple fallback for development - just return original text with a note
    if (service === 'simple' || !apiKey) {
      logger.info('Using simple fallback translation (development mode)', {
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage
      });
      
      return {
        translatedText: request.text, // Return original text in development
        confidence: 0.5,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        provider: 'fallback',
      };
    }

    switch (service) {
      case 'google':
        return await this.callGoogleTranslate(request, apiKey);
      case 'azure':
        return await this.callAzureTranslate(request, apiKey);
      default:
        throw new Error(`Unsupported fallback service: ${service}`);
    }
  }

  private async callGoogleTranslate(
    request: TranslationRequest,
    apiKey: string
  ): Promise<TranslationResponse> {
    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        q: request.text,
        source: request.sourceLanguage,
        target: request.targetLanguage,
        format: 'text',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    if (!response.data || !response.data.data || !response.data.data.translations) {
      throw new Error('Invalid response from Google Translate API');
    }

    const translation = response.data.data.translations[0];

    return {
      translatedText: translation.translatedText,
      confidence: 0.85, // Google doesn't provide confidence scores
      sourceLanguage: request.sourceLanguage,
      targetLanguage: request.targetLanguage,
      provider: 'fallback',
    };
  }

  private async callAzureTranslate(
    request: TranslationRequest,
    apiKey: string
  ): Promise<TranslationResponse> {
    const response = await axios.post(
      'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0',
      [{ text: request.text }],
      {
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'Content-Type': 'application/json',
        },
        params: {
          from: request.sourceLanguage,
          to: request.targetLanguage,
        },
        timeout: 10000,
      }
    );

    if (!response.data || !response.data[0] || !response.data[0].translations) {
      throw new Error('Invalid response from Azure Translator API');
    }

    const translation = response.data[0].translations[0];

    return {
      translatedText: translation.text,
      confidence: translation.confidence || 0.85,
      sourceLanguage: request.sourceLanguage,
      targetLanguage: request.targetLanguage,
      provider: 'fallback',
    };
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      if (typeof setTimeout !== 'undefined') {
        setTimeout(resolve, ms);
      } else {
        resolve();
      }
    });
  }

  // Preserve intent and politeness in translation
  static async translateWithContext(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    context: 'negotiation' | 'greeting' | 'product_description' | 'general' = 'general'
  ): Promise<string> {
    // Add context markers to preserve intent
    let contextualText = text;
    
    switch (context) {
      case 'negotiation':
        contextualText = `[BUSINESS_NEGOTIATION] ${text}`;
        break;
      case 'greeting':
        contextualText = `[POLITE_GREETING] ${text}`;
        break;
      case 'product_description':
        contextualText = `[PRODUCT_INFO] ${text}`;
        break;
    }

    const translated = await this.translateText(contextualText, sourceLanguage, targetLanguage);
    
    // Remove context markers from result
    return translated.replace(/^\[.*?\]\s*/, '');
  }

  // Batch translation for efficiency
  static async translateBatch(
    texts: string[],
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string[]> {
    const translations = await Promise.all(
      texts.map(text => this.translateText(text, sourceLanguage, targetLanguage))
    );

    return translations;
  }

  // Clear translation cache
  static clearCache(): void {
    this.translationCache.clear();
    logger.info('Translation cache cleared');
  }

  // Get cache statistics
  static getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.translationCache.size,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
    };
  }

  // Health check for translation services
  static async isHealthy(): Promise<{ bhashini: boolean; fallback: boolean }> {
    const results = {
      bhashini: false,
      fallback: false,
    };

    // Test BHASHINI
    try {
      if (config.bhashini.apiKey) {
        await this.translateText('test', 'en', 'hi');
        results.bhashini = true;
      }
    } catch (error) {
      logger.error('BHASHINI health check failed:', error);
    }

    // Test fallback service
    try {
      if (config.bhashini.fallback.enabled && config.bhashini.fallback.apiKey) {
        // Temporarily disable BHASHINI to test fallback
        const originalApiKey = config.bhashini.apiKey;
        (config.bhashini as any).apiKey = '';
        
        await this.translateText('test', 'en', 'hi');
        results.fallback = true;
        
        // Restore original API key
        (config.bhashini as any).apiKey = originalApiKey;
      }
    } catch (error) {
      logger.error('Fallback translation service health check failed:', error);
    }

    return results;
  }
}