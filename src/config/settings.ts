import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '4000'),
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Database Configuration
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/vyapar-mitra',
    },
    postgresql: {
      uri: process.env.POSTGRES_URI || 'postgresql://localhost:5432/vyapar_mitra',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'vyapar_mitra',
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password',
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
  },

  // Translation Service (BHASHINI)
  bhashini: {
    apiKey: process.env.BHASHINI_API_KEY || '',
    baseUrl: process.env.BHASHINI_BASE_URL || 'https://bhashini.gov.in/api',
    timeout: parseInt(process.env.BHASHINI_TIMEOUT || '10000'),
    // Fallback translation service
    fallback: {
      enabled: process.env.TRANSLATION_FALLBACK_ENABLED === 'true',
      service: process.env.FALLBACK_TRANSLATION_SERVICE || 'google',
      apiKey: process.env.FALLBACK_TRANSLATION_API_KEY || '',
    },
  },

  // Text-to-Speech Configuration
  tts: {
    defaultModel: process.env.TTS_MODEL || 'tacotron',
    voiceCloningEnabled: process.env.VOICE_CLONING_ENABLED === 'true',
    audioFormat: process.env.AUDIO_FORMAT || 'wav',
    sampleRate: parseInt(process.env.AUDIO_SAMPLE_RATE || '22050'),
    audioCacheTTL: parseInt(process.env.AUDIO_CACHE_TTL || '3600'), // 1 hour
    // Voice service endpoints
    tacotron: {
      endpoint: process.env.TACOTRON_ENDPOINT || 'http://localhost:8001',
      apiKey: process.env.TACOTRON_API_KEY || '',
    },
    voicebox: {
      endpoint: process.env.VOICEBOX_ENDPOINT || 'http://localhost:8002',
      apiKey: process.env.VOICEBOX_API_KEY || '',
    },
    sv2tts: {
      endpoint: process.env.SV2TTS_ENDPOINT || 'http://localhost:8003',
      apiKey: process.env.SV2TTS_API_KEY || '',
    },
  },

  // Authentication Configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    refreshSecret: process.env.REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
    refreshExpiry: process.env.REFRESH_EXPIRY || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  },

  // Payment Configuration
  payment: {
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID || '',
      keySecret: process.env.RAZORPAY_KEY_SECRET || '',
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    },
    upi: {
      enabled: process.env.UPI_ENABLED === 'true',
      vpa: process.env.UPI_VPA || 'merchant@upi',
    },
    currency: process.env.PAYMENT_CURRENCY || 'INR',
    timeout: parseInt(process.env.PAYMENT_TIMEOUT || '300000'), // 5 minutes
  },

  // Security Configuration
  security: {
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'), // 1 minute
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    trustedProxies: process.env.TRUSTED_PROXIES?.split(',') || [],
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  },

  // Application Configuration
  app: {
    baseUrl: process.env.APP_BASE_URL || 'http://localhost:4000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@vyaparmitra.com',
    companyName: process.env.COMPANY_NAME || 'VyaparMitra',
  },

  // Business Logic Configuration
  business: {
    negotiationTTL: parseInt(process.env.NEGOTIATION_TTL || '86400000'), // 24 hours
    stockLockTTL: parseInt(process.env.STOCK_LOCK_TTL || '300'), // 5 minutes
    qrSessionTTL: parseInt(process.env.QR_SESSION_TTL || '3600'), // 1 hour
    lowStockThreshold: parseInt(process.env.LOW_STOCK_THRESHOLD || '5'),
  },

  // Supported Languages
  languages: {
    supported: [
      'hi', // Hindi
      'bn', // Bengali
      'ta', // Tamil
      'te', // Telugu
      'kn', // Kannada
      'ml', // Malayalam
      'mr', // Marathi
      'or', // Oriya
      'pa', // Punjabi
      'as', // Assamese
      'gu', // Gujarati
      'en', // English
    ],
    default: 'hi', // Hindi as default
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedAudioTypes: ['audio/wav', 'audio/mp3', 'audio/ogg'],
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableFileLogging: process.env.ENABLE_FILE_LOGGING !== 'false',
    logDirectory: process.env.LOG_DIRECTORY || './logs',
  },

  // Monitoring Configuration
  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT || '9090'),
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'), // 30 seconds
  },
};

// Validation
export function validateConfig(): void {
  const required = [
    'MONGODB_URI',
    'POSTGRES_URI',
    'REDIS_URL',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    console.warn('Using default values. Please set these in production.');
  }

  if (!config.bhashini.apiKey && config.server.nodeEnv === 'production') {
    console.warn('⚠️  BHASHINI_API_KEY not set. Translation service will not work.');
  }

  if (config.security.jwtSecret === 'your-secret-key-change-in-production' && config.server.nodeEnv === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
}