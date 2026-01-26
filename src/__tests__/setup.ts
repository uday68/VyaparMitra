// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock setTimeout and other Node.js globals
global.setTimeout = jest.fn((fn) => fn()) as any;

// Setup test database connections (mocked)
jest.mock('../db/postgres', () => ({
  connectPostgreSQL: jest.fn(),
  getPool: jest.fn(() => ({
    query: jest.fn(),
  })),
}));

jest.mock('../db/mongo', () => ({
  connectMongoDB: jest.fn(),
  Vendor: {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Product: {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  },
  User: {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  },
  VoiceProfile: {
    findOne: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

jest.mock('../db/redis', () => ({
  connectRedis: jest.fn(),
  getRedisClient: jest.fn(),
  RedisService: {
    setWithTTL: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    lockStock: jest.fn(),
    releaseStock: jest.fn(),
    createQRSession: jest.fn(),
    validateQRSession: jest.fn(),
    cacheAudio: jest.fn(),
    getCachedAudio: jest.fn(),
  },
}));

// Mock axios for translation service
jest.mock('axios', () => ({
  post: jest.fn(() => Promise.reject(new Error('Mocked axios error'))),
}));