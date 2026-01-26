import winston from 'winston';
import { config } from '../config/settings';

// Custom log levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  },
};

// Add colors to winston
winston.addColors(customLevels.colors);

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
    });
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  levels: customLevels.levels,
  level: config.logging.level,
  format: logFormat,
  defaultMeta: {
    service: 'vyapar-mitra-api',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// Request logging middleware
export function requestLogger(req: any, res: any, next: any) {
  const start = Date.now();
  
  // Log request
  logger.http('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    userType: req.user?.type,
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.http('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id,
      userType: req.user?.type,
    });
  });

  next();
}

// Structured logging helpers
export const logHelpers = {
  // Authentication events
  authSuccess: (userId: string, userType: string, ip: string) => {
    logger.info('Authentication successful', {
      event: 'auth_success',
      userId,
      userType,
      ip,
    });
  },

  authFailure: (reason: string, ip: string, userAgent?: string) => {
    logger.warn('Authentication failed', {
      event: 'auth_failure',
      reason,
      ip,
      userAgent,
    });
  },

  // Business events
  negotiationCreated: (negotiationId: number, vendorId: string, customerId: string, productId: string) => {
    logger.info('Negotiation created', {
      event: 'negotiation_created',
      negotiationId,
      vendorId,
      customerId,
      productId,
    });
  },

  bidCreated: (bidId: number, negotiationId: number, amount: number, bidderType: string) => {
    logger.info('Bid created', {
      event: 'bid_created',
      bidId,
      negotiationId,
      amount,
      bidderType,
    });
  },

  bidAccepted: (bidId: number, negotiationId: number, amount: number) => {
    logger.info('Bid accepted', {
      event: 'bid_accepted',
      bidId,
      negotiationId,
      amount,
    });
  },

  // Voice processing events
  voiceIntentProcessed: (intent: string, confidence: number, userId?: string) => {
    logger.info('Voice intent processed', {
      event: 'voice_intent_processed',
      intent,
      confidence,
      userId,
    });
  },

  ttsGenerated: (textLength: number, language: string, userId?: string, cached: boolean = false) => {
    logger.info('TTS generated', {
      event: 'tts_generated',
      textLength,
      language,
      userId,
      cached,
    });
  },

  // Error events
  databaseError: (operation: string, error: Error, context?: any) => {
    logger.error('Database error', {
      event: 'database_error',
      operation,
      error: error.message,
      stack: error.stack,
      context,
    });
  },

  voiceProcessingError: (operation: string, error: Error, userId?: string) => {
    logger.error('Voice processing error', {
      event: 'voice_processing_error',
      operation,
      error: error.message,
      stack: error.stack,
      userId,
    });
  },

  // Performance events
  slowQuery: (query: string, duration: number, context?: any) => {
    logger.warn('Slow database query', {
      event: 'slow_query',
      query,
      duration: `${duration}ms`,
      context,
    });
  },

  // Security events
  rateLimitExceeded: (ip: string, endpoint: string, userId?: string) => {
    logger.warn('Rate limit exceeded', {
      event: 'rate_limit_exceeded',
      ip,
      endpoint,
      userId,
    });
  },

  suspiciousActivity: (activity: string, ip: string, userId?: string, details?: any) => {
    logger.warn('Suspicious activity detected', {
      event: 'suspicious_activity',
      activity,
      ip,
      userId,
      details,
    });
  },
};

// Performance monitoring
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  static start(operation: string): void {
    this.timers.set(operation, Date.now());
  }

  static end(operation: string, context?: any): number {
    const startTime = this.timers.get(operation);
    if (!startTime) {
      logger.warn('Performance timer not found', { operation });
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(operation);

    // Log slow operations
    if (duration > 1000) { // > 1 second
      logger.warn('Slow operation detected', {
        event: 'slow_operation',
        operation,
        duration: `${duration}ms`,
        context,
      });
    }

    return duration;
  }

  static async measure<T>(operation: string, fn: () => Promise<T>, context?: any): Promise<T> {
    this.start(operation);
    try {
      const result = await fn();
      this.end(operation, context);
      return result;
    } catch (error) {
      this.end(operation, { ...context, error: error.message });
      throw error;
    }
  }
}

export default logger;