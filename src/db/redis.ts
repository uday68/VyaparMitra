import { createClient, RedisClientType } from 'redis';
import { config } from '../config/settings';

let redisClient: RedisClientType | null = null;
let redisConnected = false;

export async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({
      url: config.database.redis.url,
    });

    redisClient.on('error', (err: any) => {
      console.error('Redis Client Error:', err);
      redisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
      redisConnected = true;
    });

    redisClient.on('disconnect', () => {
      console.warn('⚠️ Redis disconnected');
      redisConnected = false;
    });

    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    console.warn('⚠️ Continuing without Redis - some features may be limited');
    redisClient = null;
    redisConnected = false;
    // Don't throw error - allow server to start without Redis
  }
}

export function getRedisClient(): RedisClientType | null {
  return redisClient;
}

export function isRedisConnected(): boolean {
  return redisConnected && redisClient !== null;
}

// Redis utility functions
export class RedisService {
  static async setWithTTL(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!isRedisConnected() || !redisClient) {
      console.warn('Redis not available, skipping cache operation');
      return;
    }
    try {
      await redisClient.setEx(key, ttlSeconds, value);
    } catch (error) {
      console.error('Redis setWithTTL failed:', error);
    }
  }

  static async get(key: string): Promise<string | null> {
    if (!isRedisConnected() || !redisClient) {
      return null;
    }
    try {
      return await redisClient.get(key);
    } catch (error) {
      console.error('Redis get failed:', error);
      return null;
    }
  }

  static async delete(key: string): Promise<void> {
    if (!isRedisConnected() || !redisClient) {
      return;
    }
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Redis delete failed:', error);
    }
  }

  static async exists(key: string): Promise<boolean> {
    if (!isRedisConnected() || !redisClient) {
      return false;
    }
    try {
      return (await redisClient.exists(key)) === 1;
    } catch (error) {
      console.error('Redis exists failed:', error);
      return false;
    }
  }

  // Stock locking with atomic operations
  static async lockStock(productId: string, lockerId: string, ttlSeconds: number = 300): Promise<boolean> {
    if (!isRedisConnected() || !redisClient) {
      console.warn('Redis not available, stock locking disabled');
      return true; // Allow operation to proceed without locking
    }
    
    try {
      const lockKey = `stock_lock:${productId}`;
      const result = await redisClient.setNX(lockKey, lockerId);
      
      if (result) {
        await redisClient.expire(lockKey, ttlSeconds);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Redis lockStock failed:', error);
      return true; // Allow operation to proceed
    }
  }

  static async releaseStock(productId: string, lockerId: string): Promise<boolean> {
    if (!isRedisConnected() || !redisClient) {
      return true;
    }
    
    try {
      const lockKey = `stock_lock:${productId}`;
      const currentLocker = await redisClient.get(lockKey);
      
      if (currentLocker === lockerId) {
        await redisClient.del(lockKey);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Redis releaseStock failed:', error);
      return true;
    }
  }

  // QR session management
  static async createQRSession(sessionId: string, vendorId: string, ttlSeconds: number = 1800): Promise<void> {
    if (!isRedisConnected() || !redisClient) {
      console.warn('Redis not available, QR sessions will not persist');
      return;
    }
    
    try {
      const sessionKey = `qr_session:${sessionId}`;
      await redisClient.setEx(sessionKey, ttlSeconds, vendorId);
    } catch (error) {
      console.error('Redis createQRSession failed:', error);
    }
  }

  static async validateQRSession(sessionId: string): Promise<string | null> {
    if (!isRedisConnected() || !redisClient) {
      return null;
    }
    
    try {
      const sessionKey = `qr_session:${sessionId}`;
      return await redisClient.get(sessionKey);
    } catch (error) {
      console.error('Redis validateQRSession failed:', error);
      return null;
    }
  }

  // Audio cache
  static async cacheAudio(audioId: string, audioUrl: string, ttlSeconds: number): Promise<void> {
    if (!isRedisConnected() || !redisClient) {
      return;
    }
    
    try {
      const cacheKey = `audio_cache:${audioId}`;
      await redisClient.setEx(cacheKey, ttlSeconds, audioUrl);
    } catch (error) {
      console.error('Redis cacheAudio failed:', error);
    }
  }

  static async getCachedAudio(audioId: string): Promise<string | null> {
    if (!isRedisConnected() || !redisClient) {
      return null;
    }
    
    try {
      const cacheKey = `audio_cache:${audioId}`;
      return await redisClient.get(cacheKey);
    } catch (error) {
      console.error('Redis getCachedAudio failed:', error);
      return null;
    }
  }
}