// Voice Processing Service for Cross-Language QR Commerce
import { Pool } from 'pg';
import { RedisClientType } from 'redis';
import { 
  STTResult, 
  TTSResult, 
  LanguageDetection, 
  AudioQualityCheck,
  SupportedLanguage 
} from '../types/qr-commerce';
import { QRCommerceRedisSchemas } from '../db/redis-schemas';
import { logger } from '../utils/logger';
import { config } from '../config/settings';

// Import existing voice services
import { TacotronTTS } from '../voice/tacotron';
import { VoiceboxTTS } from '../voice/voicebox';
import { SV2TTSService } from '../voice/sv2tts';
import { TTSService } from '../voice/tts_service';

export class VoiceProcessingService {
  private redisSchemas: QRCommerceRedisSchemas;
  private tacotronService: TacotronTTS;
  private voiceboxService: VoiceboxTTS;
  private sv2ttsService: SV2TTSService;
  private ttsService: TTSService;

  constructor(
    private db: Pool,
    private redis: RedisClientType
  ) {
    this.redisSchemas = new QRCommerceRedisSchemas(redis);
    
    // Initialize voice services
    this.tacotronService = new TacotronTTS();
    this.voiceboxService = new VoiceboxTTS();
    this.sv2ttsService = new SV2TTSService();
    this.ttsService = new TTSService();
  }

  /**
   * Convert speech to text with language-specific processing
   */
  async speechToText(
    audioData: Buffer, 
    language: SupportedLanguage
  ): Promise<STTResult> {
    const startTime = Date.now();
    
    try {
      // Validate audio quality first
      const qualityCheck = await this.validateAudioQuality(audioData);
      if (!qualityCheck.isValid) {
        throw new Error(`Poor audio quality: ${qualityCheck.issues.join(', ')}`);
      }

      // Use appropriate STT service based on language and availability
      let sttResult: STTResult;

      try {
        // Try Voicebox first (best for Indian languages)
        sttResult = await this.processWithVoicebox(audioData, language);
      } catch (voiceboxError) {
        logger.warn('Voicebox STT failed, trying fallback', { error: voiceboxError });
        
        try {
          // Fallback to SV2TTS
          sttResult = await this.processWithSV2TTS(audioData, language);
        } catch (sv2ttsError) {
          logger.warn('SV2TTS STT failed, trying Tacotron', { error: sv2ttsError });
          
          // Final fallback to Tacotron
          sttResult = await this.processWithTacotron(audioData, language);
        }
      }

      const processingTime = Date.now() - startTime;
      sttResult.processingTime = processingTime;

      // Record performance metrics
      await this.redisSchemas.recordTranslationLatency('STT', processingTime);

      // Log successful processing
      logger.info('Speech-to-text processing successful', {
        language,
        confidence: sttResult.confidence,
        processingTime,
        textLength: sttResult.text.length
      });

      return sttResult;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Speech-to-text processing failed', { 
        error, 
        language, 
        processingTime,
        audioSize: audioData.length 
      });

      // Return error result
      return {
        text: '',
        confidence: 0.0,
        language,
        processingTime
      };
    }
  }

  /**
   * Convert text to speech with language-specific voice profiles
   */
  async textToSpeech(
    text: string, 
    language: SupportedLanguage, 
    voiceProfile?: string
  ): Promise<TTSResult> {
    const startTime = Date.now();

    try {
      // Select appropriate voice profile if not specified
      const selectedProfile = voiceProfile || this.getDefaultVoiceProfile(language);

      let ttsResult: TTSResult;

      try {
        // Try Voicebox first (best for Indian languages)
        ttsResult = await this.synthesizeWithVoicebox(text, language, selectedProfile);
      } catch (voiceboxError) {
        logger.warn('Voicebox TTS failed, trying fallback', { error: voiceboxError });
        
        try {
          // Fallback to Tacotron
          ttsResult = await this.synthesizeWithTacotron(text, language, selectedProfile);
        } catch (tacotronError) {
          logger.warn('Tacotron TTS failed, trying TTS service', { error: tacotronError });
          
          // Final fallback to TTS service
          ttsResult = await this.synthesizeWithTTSService(text, language, selectedProfile);
        }
      }

      const processingTime = Date.now() - startTime;

      // Record performance metrics
      await this.redisSchemas.recordTranslationLatency('TTS', processingTime);

      logger.info('Text-to-speech synthesis successful', {
        language,
        voiceProfile: selectedProfile,
        processingTime,
        textLength: text.length,
        audioDuration: ttsResult.duration
      });

      return ttsResult;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Text-to-speech synthesis failed', { 
        error, 
        language, 
        text: text.substring(0, 100),
        processingTime 
      });

      // Return empty audio buffer on failure
      return {
        audioData: Buffer.alloc(0),
        duration: 0,
        language,
        voiceProfile: voiceProfile || 'default'
      };
    }
  }

  /**
   * Detect language from audio data
   */
  async detectLanguage(audioData: Buffer): Promise<LanguageDetection> {
    try {
      // Use a simple approach - try STT with multiple languages and pick the best confidence
      const languages: SupportedLanguage[] = ['hi', 'en', 'bn', 'te', 'ta'];
      const results = await Promise.allSettled(
        languages.map(lang => this.speechToText(audioData, lang))
      );

      let bestResult: { language: SupportedLanguage; confidence: number } = {
        language: 'en',
        confidence: 0
      };

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.confidence > bestResult.confidence) {
          bestResult = {
            language: languages[index],
            confidence: result.value.confidence
          };
        }
      });

      return bestResult;

    } catch (error) {
      logger.error('Language detection failed', { error });
      return {
        language: 'en',
        confidence: 0.5 // Default fallback
      };
    }
  }

  /**
   * Validate audio quality
   */
  async validateAudioQuality(audioData: Buffer): Promise<AudioQualityCheck> {
    const issues: string[] = [];
    let quality: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';

    try {
      // Basic audio validation
      if (audioData.length < 1000) {
        issues.push('Audio too short');
        quality = 'LOW';
      }

      if (audioData.length > 10 * 1024 * 1024) { // 10MB limit
        issues.push('Audio file too large');
        quality = 'LOW';
      }

      // Check for valid audio header (basic check)
      const header = audioData.slice(0, 12).toString('hex');
      const isValidWav = header.startsWith('52494646') && header.includes('57415645');
      const isValidMp3 = header.startsWith('494433') || header.startsWith('fffb') || header.startsWith('fff3');
      
      if (!isValidWav && !isValidMp3) {
        issues.push('Invalid audio format');
        quality = 'LOW';
      }

      // Additional quality checks could be added here
      // - Noise level analysis
      // - Frequency analysis
      // - Volume level checks

      return {
        isValid: issues.length === 0,
        quality,
        issues
      };

    } catch (error) {
      logger.error('Audio quality validation failed', { error });
      return {
        isValid: false,
        quality: 'LOW',
        issues: ['Validation failed']
      };
    }
  }

  // Private methods for different voice services

  private async processWithVoicebox(
    audioData: Buffer, 
    language: SupportedLanguage
  ): Promise<STTResult> {
    try {
      // For now, return a mock result since Voicebox doesn't have STT in the current implementation
      return {
        text: "Mock STT result from Voicebox",
        confidence: 0.8,
        language,
        processingTime: 0
      };
    } catch (error) {
      logger.error('Voicebox STT processing failed', { error, language });
      throw error;
    }
  }

  private async processWithSV2TTS(
    audioData: Buffer, 
    language: SupportedLanguage
  ): Promise<STTResult> {
    try {
      // For now, return a mock result since SV2TTS doesn't have STT in the current implementation
      return {
        text: "Mock STT result from SV2TTS",
        confidence: 0.7,
        language,
        processingTime: 0
      };
    } catch (error) {
      logger.error('SV2TTS STT processing failed', { error, language });
      throw error;
    }
  }

  private async processWithTacotron(
    audioData: Buffer, 
    language: SupportedLanguage
  ): Promise<STTResult> {
    try {
      // For now, return a mock result since Tacotron doesn't have STT in the current implementation
      return {
        text: "Mock STT result from Tacotron",
        confidence: 0.6,
        language,
        processingTime: 0
      };
    } catch (error) {
      logger.error('Tacotron STT processing failed', { error, language });
      throw error;
    }
  }

  private async synthesizeWithVoicebox(
    text: string, 
    language: SupportedLanguage, 
    voiceProfile: string
  ): Promise<TTSResult> {
    try {
      const audioUrl = await this.voiceboxService.generateSpeech(text, language);
      
      return {
        audioData: Buffer.alloc(0), // URL-based, no buffer needed
        duration: Math.max(2, text.length * 0.1), // Estimate duration
        language,
        voiceProfile,
        audioUrl
      };
    } catch (error) {
      logger.error('Voicebox TTS synthesis failed', { error, language });
      throw error;
    }
  }

  private async synthesizeWithTacotron(
    text: string, 
    language: SupportedLanguage, 
    voiceProfile: string
  ): Promise<TTSResult> {
    try {
      const audioUrl = await this.tacotronService.generateSpeech(text, language);
      
      return {
        audioData: Buffer.alloc(0), // URL-based, no buffer needed
        duration: Math.max(2, text.length * 0.1), // Estimate duration
        language,
        voiceProfile,
        audioUrl
      };
    } catch (error) {
      logger.error('Tacotron TTS synthesis failed', { error, language });
      throw error;
    }
  }

  private async synthesizeWithTTSService(
    text: string, 
    language: SupportedLanguage, 
    voiceProfile: string
  ): Promise<TTSResult> {
    try {
      const result = await TTSService.speak({
        text,
        language,
        userId: undefined,
        userType: undefined
      });
      
      return {
        audioData: Buffer.alloc(0), // URL-based, no buffer needed
        duration: result.duration,
        language,
        voiceProfile,
        audioUrl: result.audioUrl
      };
    } catch (error) {
      logger.error('TTS Service synthesis failed', { error, language });
      throw error;
    }
  }

  private getDefaultVoiceProfile(language: SupportedLanguage): string {
    const voiceProfiles: Record<SupportedLanguage, string> = {
      'en': 'en-female-1',
      'hi': 'hi-female-1',
      'bn': 'bn-female-1',
      'te': 'te-female-1',
      'ta': 'ta-female-1',
      'ml': 'ml-female-1',
      'kn': 'kn-female-1',
      'gu': 'gu-female-1',
      'mr': 'mr-female-1',
      'pa': 'pa-female-1',
      'or': 'or-female-1',
      'as': 'as-female-1'
    };

    return voiceProfiles[language] || 'en-female-1';
  }

  /**
   * Health check for voice services
   */
  async isHealthy(): Promise<{
    voicebox: boolean;
    tacotron: boolean;
    sv2tts: boolean;
    ttsService: boolean;
  }> {
    const results = {
      voicebox: false,
      tacotron: false,
      sv2tts: false,
      ttsService: false
    };

    // Test each service with a simple request
    const testText = 'Hello';
    const testLanguage: SupportedLanguage = 'en';

    try {
      await this.synthesizeWithVoicebox(testText, testLanguage, 'en-female-1');
      results.voicebox = true;
    } catch (error) {
      logger.warn('Voicebox health check failed', { error });
    }

    try {
      await this.synthesizeWithTacotron(testText, testLanguage, 'en-female-1');
      results.tacotron = true;
    } catch (error) {
      logger.warn('Tacotron health check failed', { error });
    }

    try {
      await this.synthesizeWithTTSService(testText, testLanguage, 'en-female-1');
      results.ttsService = true;
    } catch (error) {
      logger.warn('TTS Service health check failed', { error });
    }

    return results;
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStats(): Promise<{
    avgSTTLatency: number;
    avgTTSLatency: number;
    totalProcessed: number;
  }> {
    try {
      const sttLatency = await this.redisSchemas.getAverageTranslationLatency('STT', 60);
      const ttsLatency = await this.redisSchemas.getAverageTranslationLatency('TTS', 60);

      return {
        avgSTTLatency: sttLatency,
        avgTTSLatency: ttsLatency,
        totalProcessed: 0 // Would need to track this separately
      };
    } catch (error) {
      logger.error('Failed to get performance stats', { error });
      return {
        avgSTTLatency: 0,
        avgTTSLatency: 0,
        totalProcessed: 0
      };
    }
  }
}