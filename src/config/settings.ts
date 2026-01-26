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
  },

  // Text-to-Speech Configuration
  tts: {
    defaultModel: process.env.TTS_MODEL || 'tacotron',
    voiceCloning: process.env.VOICE_CLONING_ENABLED === 'true',
    audioFormat: process.env.AUDIO_FORMAT || 'wav',
    sampleRate: parseInt(process.env.AUDIO_SAMPLE_RATE || '22050'),
    cacheTTL: parseInt(process.env.AUDIO_CACHE_TTL || '3600'), // 1 hour
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    refreshSecret: process.env.REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
    refreshExpiry: process.env.REFRESH_EXPIRY || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'), // 1 minute
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
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