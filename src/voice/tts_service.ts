import { RedisService } from '../db/redis';
import { config } from '../config/settings';
import { TacotronTTS } from './tacotron';
import { SV2TTSService } from './sv2tts';
import { VoiceboxTTS } from './voicebox';
import * as crypto from 'crypto';

export interface TTSRequest {
  text: string;
  language: string;
  userId?: string;
  userType?: 'vendor' | 'customer';
}

export interface TTSResponse {
  audioUrl: string;
  duration: number;
  cached: boolean;
}

export class TTSService {
  private static tacotron = new TacotronTTS();
  private static sv2tts = new SV2TTSService();
  private static voicebox = new VoiceboxTTS();

  static async speak(request: TTSRequest): Promise<TTSResponse> {
    // Generate cache key
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    const cachedUrl = await RedisService.getCachedAudio(cacheKey);
    if (cachedUrl) {
      return {
        audioUrl: cachedUrl,
        duration: 0, // Duration not stored in cache
        cached: true,
      };
    }

    // Determine TTS model to use
    const audioUrl = await this.generateAudio(request);
    
    // Cache the result
    await RedisService.cacheAudio(cacheKey, audioUrl, config.tts.audioCacheTTL);

    return {
      audioUrl,
      duration: 0, // Would be calculated during generation
      cached: false,
    };
  }

  private static async generateAudio(request: TTSRequest): Promise<string> {
    const { text, language, userId, userType } = request;

    // If voice cloning is enabled and user has a profile, use SV2TTS
    if (config.tts.voiceCloningEnabled && userId && userType) {
      try {
        const hasProfile = await this.sv2tts.hasVoiceProfile(userId, userType);
        if (hasProfile) {
          return await this.sv2tts.generateVoice(text, userId, userType, language);
        }
      } catch (error) {
        console.warn('SV2TTS failed, falling back to default TTS:', error);
      }
    }

    // Choose TTS model based on language and configuration
    switch (config.tts.defaultModel) {
      case 'voicebox':
        return await this.voicebox.generateSpeech(text, language);
      
      case 'tacotron':
      default:
        return await this.tacotron.generateSpeech(text, language);
    }
  }

  private static generateCacheKey(request: TTSRequest): string {
    const { text, language, userId, userType } = request;
    const keyData = `${text}:${language}:${userId || 'anonymous'}:${userType || 'default'}`;
    return crypto.createHash('md5').update(keyData).digest('hex');
  }

  // Voice profile management
  static async createVoiceProfile(
    userId: string,
    userType: 'vendor' | 'customer',
    audioSample: Buffer,
    consentGiven: boolean
  ): Promise<boolean> {
    if (!consentGiven) {
      throw new Error('Voice cloning requires explicit consent');
    }

    if (!config.tts.voiceCloningEnabled) {
      throw new Error('Voice cloning is disabled');
    }

    return await this.sv2tts.createVoiceProfile(userId, userType, audioSample);
  }

  static async hasVoiceProfile(userId: string, userType: 'vendor' | 'customer'): Promise<boolean> {
    return await this.sv2tts.hasVoiceProfile(userId, userType);
  }

  static async deleteVoiceProfile(userId: string, userType: 'vendor' | 'customer'): Promise<boolean> {
    return await this.sv2tts.deleteVoiceProfile(userId, userType);
  }

  // Language-specific TTS optimization
  static async speakMultilingual(
    text: string,
    language: string,
    userId?: string,
    userType?: 'vendor' | 'customer'
  ): Promise<TTSResponse> {
    // For low-resource languages, prefer Voicebox
    const lowResourceLanguages = ['as', 'bn', 'gu', 'hi', 'kn', 'ml', 'mr', 'or', 'pa', 'ta', 'te'];
    
    let modelOverride: string | undefined;
    if (lowResourceLanguages.includes(language)) {
      modelOverride = 'voicebox';
    }

    const originalModel = config.tts.defaultModel;
    if (modelOverride) {
      (config.tts as any).defaultModel = modelOverride;
    }

    try {
      return await this.speak({ text, language, userId, userType });
    } finally {
      if (modelOverride) {
        (config.tts as any).defaultModel = originalModel;
      }
    }
  }
}