import { createClient, RedisClientType } from 'redis';
import { config } from '../config/settings';

let redisClient: RedisClientType;

export async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({
      url: config.database.redis.url,
    });

    redisClient.on('error', (err: any) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
    console.log('✅ Redis connected successfully');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    throw error;
  }
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis not connected');
  }
  return redisClient;
}

// Redis utility functions
export class RedisService {
  static async setWithTTL(key: string, value: string, ttlSeconds: number): Promise<void> {
    await redisClient.setEx(key, ttlSeconds, value);
  }

  static async get(key: string): Promise<string | null> {
    return await redisClient.get(key);
  }

  static async delete(key: string): Promise<void> {
    await redisClient.del(key);
  }

  static async exists(key: string): Promise<boolean> {
    return (await redisClient.exists(key)) === 1;
  }

  // Stock locking with atomic operations
  static async lockStock(productId: string, lockerId: string, ttlSeconds: number = 300): Promise<boolean> {
    const lockKey = `stock_lock:${productId}`;
    const result = await redisClient.setNX(lockKey, lockerId);
    
    if (result) {
      await redisClient.expire(lockKey, ttlSeconds);
      return true;
    }
    return false;
  }

  static async releaseStock(productId: string, lockerId: string): Promise<boolean> {
    const lockKey = `stock_lock:${productId}`;
    const currentLocker = await redisClient.get(lockKey);
    
    if (currentLocker === lockerId) {
      await redisClient.del(lockKey);
      return true;
    }
    return false;
  }

  // QR session management
  static async createQRSession(sessionId: string, vendorId: string, ttlSeconds: number = 1800): Promise<void> {
    const sessionKey = `qr_session:${sessionId}`;
    await redisClient.setEx(sessionKey, ttlSeconds, vendorId);
  }

  static async validateQRSession(sessionId: string): Promise<string | null> {
    const sessionKey = `qr_session:${sessionId}`;
    return await redisClient.get(sessionKey);
  }

  // Audio cache
  static async cacheAudio(audioId: string, audioUrl: string, ttlSeconds: number): Promise<void> {
    const cacheKey = `audio_cache:${audioId}`;
    await redisClient.setEx(cacheKey, ttlSeconds, audioUrl);
  }

  static async getCachedAudio(audioId: string): Promise<string | null> {
    const cacheKey = `audio_cache:${audioId}`;
    return await redisClient.get(cacheKey);
  }
}