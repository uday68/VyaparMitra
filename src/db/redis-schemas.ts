// Redis Schema Definitions for Cross-Language QR Commerce and Voice Workflows
import { RedisClientType } from 'redis';
import { VoiceWorkflowState } from '../services/voice_workflow_service';

export class QRCommerceRedisSchemas {
  constructor(private redis: RedisClientType) {}

  // Translation Cache Keys
  private getTranslationCacheKey(sourceText: string, fromLang: string, toLang: string): string {
    const hash = Buffer.from(`${sourceText}:${fromLang}:${toLang}`).toString('base64');
    return `translation:cache:${hash}`;
  }

  // Session Cache Keys
  private getSessionCacheKey(sessionId: string): string {
    return `qr:session:${sessionId}`;
  }

  private getActiveSessionsKey(vendorId: string): string {
    return `qr:active:vendor:${vendorId}`;
  }

  // Typing Indicator Keys
  private getTypingKey(sessionId: string, userId: string): string {
    return `typing:${sessionId}:${userId}`;
  }

  // Message Queue Keys
  private getMessageQueueKey(sessionId: string): string {
    return `messages:queue:${sessionId}`;
  }

  // Translation Cache Operations
  async cacheTranslation(
    sourceText: string, 
    translatedText: string, 
    fromLang: string, 
    toLang: string,
    provider: string,
    confidence: number
  ): Promise<void> {
    const key = this.getTranslationCacheKey(sourceText, fromLang, toLang);
    const data = {
      translatedText,
      provider,
      confidence: confidence.toString(),
      createdAt: Date.now().toString(),
      usageCount: '1'
    };
    
    await this.redis.hSet(key, data);
    await this.redis.expire(key, 30 * 24 * 60 * 60); // 30 days TTL
  }

  async getCachedTranslation(
    sourceText: string, 
    fromLang: string, 
    toLang: string
  ): Promise<{
    translatedText: string;
    provider: string;
    confidence: number;
    usageCount: number;
  } | null> {
    const key = this.getTranslationCacheKey(sourceText, fromLang, toLang);
    const data = await this.redis.hGetAll(key);
    
    if (!data.translatedText) return null;

    // Increment usage count
    await this.redis.hIncrBy(key, 'usageCount', 1);
    await this.redis.hSet(key, 'lastUsedAt', Date.now().toString());

    return {
      translatedText: data.translatedText,
      provider: data.provider,
      confidence: parseFloat(data.confidence),
      usageCount: parseInt(data.usageCount) + 1
    };
  }

  // Session Cache Operations
  async cacheSession(sessionId: string, sessionData: any): Promise<void> {
    const key = this.getSessionCacheKey(sessionId);
    await this.redis.setEx(key, 24 * 60 * 60, JSON.stringify(sessionData)); // 24 hours TTL
  }

  async getCachedSession(sessionId: string): Promise<any | null> {
    const key = this.getSessionCacheKey(sessionId);
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async invalidateSession(sessionId: string): Promise<void> {
    const key = this.getSessionCacheKey(sessionId);
    await this.redis.del(key);
  }

  // Active Sessions Tracking
  async addActiveSession(vendorId: string, sessionId: string): Promise<void> {
    const key = this.getActiveSessionsKey(vendorId);
    await this.redis.sAdd(key, sessionId);
    await this.redis.expire(key, 24 * 60 * 60); // 24 hours TTL
  }

  async removeActiveSession(vendorId: string, sessionId: string): Promise<void> {
    const key = this.getActiveSessionsKey(vendorId);
    await this.redis.sRem(key, sessionId);
  }

  async getActiveSessions(vendorId: string): Promise<string[]> {
    const key = this.getActiveSessionsKey(vendorId);
    return await this.redis.sMembers(key);
  }

  // Typing Indicators
  async setTypingIndicator(sessionId: string, userId: string, isTyping: boolean): Promise<void> {
    const key = this.getTypingKey(sessionId, userId);
    
    if (isTyping) {
      await this.redis.setEx(key, 10, 'typing'); // 10 seconds TTL
    } else {
      await this.redis.del(key);
    }
  }

  async getTypingUsers(sessionId: string): Promise<string[]> {
    const pattern = `typing:${sessionId}:*`;
    const keys = await this.redis.keys(pattern);
    return keys.map(key => key.split(':')[2]);
  }

  // Message Queue Operations (for offline resilience)
  async queueMessage(sessionId: string, message: any): Promise<void> {
    const key = this.getMessageQueueKey(sessionId);
    await this.redis.lPush(key, JSON.stringify({
      ...message,
      queuedAt: Date.now()
    }));
    await this.redis.expire(key, 7 * 24 * 60 * 60); // 7 days TTL
  }

  async getQueuedMessages(sessionId: string): Promise<any[]> {
    const key = this.getMessageQueueKey(sessionId);
    const messages = await this.redis.lRange(key, 0, -1);
    return messages.map(msg => JSON.parse(msg));
  }

  async clearMessageQueue(sessionId: string): Promise<void> {
    const key = this.getMessageQueueKey(sessionId);
    await this.redis.del(key);
  }

  // Performance Monitoring
  async recordTranslationLatency(provider: string, latency: number): Promise<void> {
    const key = `perf:translation:${provider}`;
    const timestamp = Math.floor(Date.now() / 1000);
    
    await this.redis.zAdd(key, {
      score: timestamp,
      value: latency.toString()
    });
    
    // Keep only last 24 hours of data
    const oneDayAgo = timestamp - (24 * 60 * 60);
    await this.redis.zRemRangeByScore(key, 0, oneDayAgo);
  }

  async getAverageTranslationLatency(provider: string, minutes: number = 60): Promise<number> {
    const key = `perf:translation:${provider}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const startTime = timestamp - (minutes * 60);
    
    const latencies = await this.redis.zRangeByScore(key, startTime, timestamp);
    if (latencies.length === 0) return 0;
    
    const sum = latencies.reduce((acc, val) => acc + parseFloat(val), 0);
    return sum / latencies.length;
  }

  // Session Analytics
  async recordSessionEvent(sessionId: string, event: string, data?: any): Promise<void> {
    const key = `analytics:session:${sessionId}`;
    const eventData = {
      event,
      timestamp: Date.now(),
      data: data || {}
    };
    
    await this.redis.lPush(key, JSON.stringify(eventData));
    await this.redis.expire(key, 30 * 24 * 60 * 60); // 30 days TTL
  }

  async getSessionAnalytics(sessionId: string): Promise<any[]> {
    const key = `analytics:session:${sessionId}`;
    const events = await this.redis.lRange(key, 0, -1);
    return events.map(event => JSON.parse(event));
  }

  // Message Caching Operations
  async cacheMessage(sessionId: string, message: any): Promise<void> {
    const key = `messages:cache:${sessionId}`;
    await this.redis.lPush(key, JSON.stringify(message));
    await this.redis.expire(key, 24 * 60 * 60); // 24 hours TTL
    
    // Keep only last 100 messages in cache
    await this.redis.lTrim(key, 0, 99);
  }

  async getCachedMessages(sessionId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    const key = `messages:cache:${sessionId}`;
    const messages = await this.redis.lRange(key, offset, offset + limit - 1);
    return messages.map(msg => JSON.parse(msg));
  }

  async updateMessageReadStatus(sessionId: string, messageId: string, readAt: string): Promise<void> {
    const key = `messages:cache:${sessionId}`;
    const messages = await this.redis.lRange(key, 0, -1);
    
    for (let i = 0; i < messages.length; i++) {
      const message = JSON.parse(messages[i]);
      if (message.id === messageId) {
        message.readAt = readAt;
        await this.redis.lSet(key, i, JSON.stringify(message));
        break;
      }
    }
  }

  // Cleanup Operations
  async cleanupExpiredData(): Promise<void> {
    // This would typically be run by a background job
    const patterns = [
      'translation:cache:*',
      'qr:session:*',
      'typing:*',
      'messages:queue:*',
      'voice_workflow:*'
    ];

    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern);
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) {
          // Key exists but has no TTL, set appropriate TTL based on key type
          if (key.startsWith('translation:cache:')) {
            await this.redis.expire(key, 30 * 24 * 60 * 60);
          } else if (key.startsWith('qr:session:')) {
            await this.redis.expire(key, 24 * 60 * 60);
          } else if (key.startsWith('voice_workflow:')) {
            await this.redis.expire(key, 5 * 60); // 5 minutes for voice workflows
          } else {
            await this.redis.expire(key, 60 * 60); // 1 hour default
          }
        }
      }
    }
  }

  // Voice Workflow Cache Operations
  private getVoiceWorkflowKey(sessionId: string): string {
    return `voice_workflow:${sessionId}`;
  }

  async cacheVoiceWorkflow(sessionId: string, workflowData: any): Promise<void> {
    const key = this.getVoiceWorkflowKey(sessionId);
    await this.redis.setEx(key, 5 * 60, JSON.stringify(workflowData)); // 5 minutes TTL
  }

  async getCachedVoiceWorkflow(sessionId: string): Promise<any | null> {
    const key = this.getVoiceWorkflowKey(sessionId);
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async updateVoiceWorkflowState(sessionId: string, state: VoiceWorkflowState, data?: any): Promise<void> {
    const key = this.getVoiceWorkflowKey(sessionId);
    const existing = await this.getCachedVoiceWorkflow(sessionId);
    
    if (existing) {
      existing.state = state;
      if (data) {
        existing.data = { ...existing.data, ...data };
      }
      existing.updatedAt = new Date().toISOString();
      
      await this.redis.setEx(key, 5 * 60, JSON.stringify(existing));
    }
  }

  async invalidateVoiceWorkflow(sessionId: string): Promise<void> {
    const key = this.getVoiceWorkflowKey(sessionId);
    await this.redis.del(key);
  }

  // TTS Audio Cache Operations
  private getTTSCacheKey(text: string, language: string, voice?: string): string {
    const hash = Buffer.from(`${text}:${language}:${voice || 'default'}`).toString('base64');
    return `tts:cache:${hash}`;
  }

  async cacheTTSAudio(text: string, language: string, audioUrl: string, voice?: string): Promise<void> {
    const key = this.getTTSCacheKey(text, language, voice);
    const data = {
      audioUrl,
      language,
      voice: voice || 'default',
      createdAt: Date.now().toString(),
      usageCount: '1'
    };
    
    await this.redis.hSet(key, data);
    await this.redis.expire(key, 7 * 24 * 60 * 60); // 7 days TTL
  }

  async getCachedTTSAudio(text: string, language: string, voice?: string): Promise<{
    audioUrl: string;
    usageCount: number;
  } | null> {
    const key = this.getTTSCacheKey(text, language, voice);
    const data = await this.redis.hGetAll(key);
    
    if (!data.audioUrl) return null;

    // Increment usage count
    await this.redis.hIncrBy(key, 'usageCount', 1);
    await this.redis.hSet(key, 'lastUsedAt', Date.now().toString());

    return {
      audioUrl: data.audioUrl,
      usageCount: parseInt(data.usageCount) + 1
    };
  }
}