import rateLimit from 'express-rate-limit';
import { RedisService } from '../db/redis';
import { Request, Response } from 'express';

// Custom Redis store for rate limiting
class RedisStore {
  private prefix: string;
  private windowMs: number;

  constructor(prefix: string, windowMs: number) {
    this.prefix = prefix;
    this.windowMs = windowMs;
  }

  async increment(key: string): Promise<{ totalHits: number; timeToExpire?: number }> {
    const redisKey = `${this.prefix}:${key}`;
    
    try {
      const current = await RedisService.get(redisKey);
      const hits = current ? parseInt(current) + 1 : 1;
      
      if (hits === 1) {
        // First request, set TTL
        await RedisService.setWithTTL(redisKey, hits.toString(), Math.ceil(this.windowMs / 1000));
        return { totalHits: hits, timeToExpire: this.windowMs };
      } else {
        // Increment existing counter
        await RedisService.setWithTTL(redisKey, hits.toString(), Math.ceil(this.windowMs / 1000));
        return { totalHits: hits };
      }
    } catch (error) {
      console.error('Redis rate limiter error:', error);
      // Fallback to allowing request if Redis fails
      return { totalHits: 1 };
    }
  }

  async decrement(key: string): Promise<void> {
    const redisKey = `${this.prefix}:${key}`;
    
    try {
      const current = await RedisService.get(redisKey);
      if (current) {
        const hits = Math.max(0, parseInt(current) - 1);
        if (hits === 0) {
          await RedisService.delete(redisKey);
        } else {
          await RedisService.setWithTTL(redisKey, hits.toString(), Math.ceil(this.windowMs / 1000));
        }
      }
    } catch (error) {
      console.error('Redis rate limiter decrement error:', error);
    }
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = `${this.prefix}:${key}`;
    
    try {
      await RedisService.delete(redisKey);
    } catch (error) {
      console.error('Redis rate limiter reset error:', error);
    }
  }
}

// Rate limiter configurations
export const rateLimiters = {
  // General API rate limiting
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore('rate_limit:general', 15 * 60 * 1000) as any,
  }),

  // Authentication endpoints (stricter)
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 auth requests per windowMs
    message: {
      success: false,
      error: 'Too many authentication attempts, please try again later',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore('rate_limit:auth', 15 * 60 * 1000) as any,
  }),

  // Voice processing (moderate limits due to processing cost)
  voice: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 voice requests per minute
    message: {
      success: false,
      error: 'Too many voice processing requests, please try again later',
      code: 'VOICE_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore('rate_limit:voice', 1 * 60 * 1000) as any,
  }),

  // File uploads (stricter due to resource usage)
  upload: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // Limit each IP to 20 uploads per 5 minutes
    message: {
      success: false,
      error: 'Too many file uploads, please try again later',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore('rate_limit:upload', 5 * 60 * 1000) as any,
  }),

  // Negotiation creation (prevent spam)
  negotiation: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 negotiations per minute
    message: {
      success: false,
      error: 'Too many negotiation requests, please try again later',
      code: 'NEGOTIATION_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore('rate_limit:negotiation', 1 * 60 * 1000) as any,
  }),

  // Payment processing (strict limits for security)
  payment: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // Limit each IP to 5 payment attempts per 5 minutes
    message: {
      success: false,
      error: 'Too many payment attempts, please try again later',
      code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore('rate_limit:payment', 5 * 60 * 1000) as any,
  }),

  // Translation API (moderate limits)
  translation: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 translation requests per minute
    message: {
      success: false,
      error: 'Too many translation requests, please try again later',
      code: 'TRANSLATION_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore('rate_limit:translation', 1 * 60 * 1000) as any,
  }),
};

// User-specific rate limiting (requires authentication)
export function createUserRateLimit(
  windowMs: number,
  max: number,
  prefix: string
) {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, fallback to IP
      const authReq = req as any;
      return authReq.user?.id || req.ip;
    },
    message: {
      success: false,
      error: 'Too many requests from this user, please try again later',
      code: 'USER_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore(`rate_limit:${prefix}`, windowMs) as any,
  });
}

// Burst protection for expensive operations
export const burstProtection = {
  // TTS generation (expensive operation)
  tts: createUserRateLimit(
    1 * 60 * 1000, // 1 minute
    5, // 5 TTS requests per minute per user
    'user_tts'
  ),

  // Voice profile creation (one-time setup)
  voiceProfile: createUserRateLimit(
    24 * 60 * 60 * 1000, // 24 hours
    3, // 3 voice profile attempts per day per user
    'user_voice_profile'
  ),

  // Product creation (vendors only)
  productCreation: createUserRateLimit(
    5 * 60 * 1000, // 5 minutes
    10, // 10 products per 5 minutes per vendor
    'vendor_products'
  ),
};

// Dynamic rate limiting based on user type
export function dynamicRateLimit(
  vendorLimits: { windowMs: number; max: number },
  customerLimits: { windowMs: number; max: number }
) {
  return (req: Request, res: Response, next: Function) => {
    const authReq = req as any;
    const userType = authReq.user?.type;

    let limiter;
    if (userType === 'vendor') {
      limiter = rateLimit({
        ...vendorLimits,
        keyGenerator: (req: Request) => `vendor:${(req as any).user?.id || req.ip}`,
        store: new RedisStore('rate_limit:dynamic_vendor', vendorLimits.windowMs) as any,
      });
    } else if (userType === 'customer') {
      limiter = rateLimit({
        ...customerLimits,
        keyGenerator: (req: Request) => `customer:${(req as any).user?.id || req.ip}`,
        store: new RedisStore('rate_limit:dynamic_customer', customerLimits.windowMs) as any,
      });
    } else {
      // Unauthenticated users get stricter limits
      limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        keyGenerator: (req: Request) => `anonymous:${req.ip}`,
        store: new RedisStore('rate_limit:anonymous', 15 * 60 * 1000) as any,
      });
    }

    limiter(req, res, next);
  };
}