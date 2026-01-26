import axios from 'axios';
import { config } from '../config/settings';
import { logger } from '../utils/logger';

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

    // Try BHASHINI first
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
    logger.error('All translation attempts failed:', lastError);
    return text; // Fallback to original text
  }

  private static async callBhashiniAPI(request: TranslationRequest): Promise<TranslationResponse> {
    if (!config.bhashini.apiKey) {
      throw new Error('BHASHINI API key not configured');
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

    if (!response.data || !response.data.pipelineResponse) {
      throw new Error('Invalid response from BHASHINI API');
    }

    const translationResult = response.data.pipelineResponse[0];
    
    return {
      translatedText: translationResult.output[0].target,
      confidence: translationResult.confidence || 0.9,
      sourceLanguage: request.sourceLanguage,
      targetLanguage: request.targetLanguage,
      provider: 'bhashini',
    };
  }

  private static async callFallbackService(request: TranslationRequest): Promise<TranslationResponse> {
    const { service, apiKey } = config.bhashini.fallback;

    if (!apiKey) {
      throw new Error('Fallback translation API key not configured');
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

  private static async callGoogleTranslate(
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

  private static async callAzureTranslate(
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