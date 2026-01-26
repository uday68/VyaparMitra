import axios from 'axios';
import { config } from '../config/settings';

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
}

export class TranslationService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  static async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> {
    // Skip translation if source and target are the same
    if (sourceLanguage === targetLanguage) {
      return text;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await this.callBhashiniAPI({
          text,
          sourceLanguage,
          targetLanguage,
        });

        return response.translatedText;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Translation attempt ${attempt} failed:`, error);

        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY * attempt);
        }
      }
    }

    // If all retries failed, return original text with warning
    console.error('All translation attempts failed:', lastError);
    return text; // Fallback to original text
  }

  private static async callBhashiniAPI(request: TranslationRequest): Promise<TranslationResponse> {
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
        timeout: 10000, // 10 seconds timeout
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
}