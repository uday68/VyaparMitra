import { Request, Response, NextFunction } from 'express';

/**
 * Development bypass middleware
 * Allows bypassing certain restrictions in development mode
 */
export const devBypass = {
  /**
   * Bypass rate limiting for development
   * Add ?dev-bypass=true to any request to skip rate limiting
   */
  rateLimiting: (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'development' && req.query['dev-bypass'] === 'true') {
      console.log('🚀 Development bypass: Skipping rate limiting for', req.path);
      return next();
    }
    next();
  },

  /**
   * Add development headers for debugging
   */
  debugHeaders: (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'development') {
      res.setHeader('X-Dev-Mode', 'true');
      res.setHeader('X-Rate-Limit-Bypass', req.query['dev-bypass'] || 'false');
    }
    next();
  }
};

/**
 * Development-only route to reset rate limits
 */
export const createDevResetRoute = () => {
  return async (req: Request, res: Response) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Not available in production' });
    }

    try {
      const { RedisService } = await import('../db/redis');
      
      // Reset rate limits for the requesting IP
      const clientIP = req.ip;
      const prefixes = [
        'rate_limit:auth',
        'rate_limit:general',
        'rate_limit:voice',
        'rate_limit:upload',
        'rate_limit:negotiation',
        'rate_limit:payment',
        'rate_limit:translation'
      ];

      for (const prefix of prefixes) {
        const key = `${prefix}:${clientIP}`;
        await RedisService.delete(key);
      }

      res.json({ 
        success: true, 
        message: `Rate limits reset for IP: ${clientIP}`,
        resetKeys: prefixes.map(p => `${p}:${clientIP}`)
      });
    } catch (error) {
      console.error('Error resetting rate limits:', error);
      res.status(500).json({ error: 'Failed to reset rate limits' });
    }
  };
};