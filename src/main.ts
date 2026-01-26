import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { config, validateConfig } from './config/settings';
import { connectMongoDB } from './db/mongo';
import { connectRedis } from './db/redis';
import { connectPostgreSQL } from './db/postgres';
import { ImageStorageService } from './services/image_storage';
import { HealthService } from './utils/health';
import { logger, requestLogger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimiters } from './middleware/rateLimiter';

// Import routes
import authRoutes from './routes/auth';
import apiRoutes from './routes/api';

async function createApp(): Promise<express.Application> {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.use(cors({
    origin: config.security.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // Compression middleware
  app.use(compression());

  // Request logging
  app.use(requestLogger);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // General rate limiting
  app.use(rateLimiters.general);

  // Static file serving for uploads
  app.use('/uploads', express.static(config.upload.uploadPath));

  // Health check endpoint (no auth required)
  app.get('/health', async (req, res) => {
    try {
      const health = await HealthService.checkHealth();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    }
  });

  // Detailed health check (for monitoring systems)
  app.get('/health/detailed', async (req, res) => {
    try {
      const health = await HealthService.getDetailedHealth();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      logger.error('Detailed health check failed', { error: error.message });
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Detailed health check failed',
      });
    }
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api', apiRoutes);

  // API documentation endpoint
  app.get('/api/docs', (req, res) => {
    res.json({
      title: 'VyaparMitra API',
      version: '1.0.0',
      description: 'Real-Time Linguistic Bridge for Local Trade',
      endpoints: {
        auth: {
          'POST /api/auth/register': 'Register new user (vendor or customer)',
          'POST /api/auth/login': 'Login user',
          'POST /api/auth/refresh': 'Refresh access token',
          'GET /api/auth/profile': 'Get user profile',
          'PATCH /api/auth/profile': 'Update user profile',
          'POST /api/auth/logout': 'Logout user',
        },
        products: {
          'GET /api/products': 'List products with filtering',
          'GET /api/products/:id': 'Get product by ID',
          'POST /api/products': 'Create new product (vendors only)',
          'PATCH /api/products/:id': 'Update product (vendors only)',
          'DELETE /api/products/:id': 'Delete product (vendors only)',
        },
        negotiations: {
          'POST /api/negotiations': 'Create new negotiation',
          'GET /api/negotiations': 'List user negotiations',
          'GET /api/negotiations/:id': 'Get negotiation details',
          'PATCH /api/negotiations/:id/status': 'Update negotiation status',
          'POST /api/negotiations/:id/bids': 'Create new bid',
          'POST /api/negotiations/:id/bids/:bidId/accept': 'Accept bid',
          'POST /api/negotiations/:id/bids/:bidId/reject': 'Reject bid',
        },
        voice: {
          'POST /api/voice/intent': 'Process voice intent',
          'POST /api/voice/tts': 'Generate text-to-speech',
          'POST /api/voice/profile': 'Create voice profile',
          'GET /api/voice/profile/:userId': 'Get voice profile',
          'DELETE /api/voice/profile/:userId': 'Delete voice profile',
        },
        qr: {
          'POST /api/qr/session': 'Create QR session',
          'GET /api/qr/session/:sessionId': 'Validate QR session',
        },
        translation: {
          'POST /api/translate': 'Translate text',
        },
        health: {
          'GET /health': 'Basic health check',
          'GET /health/detailed': 'Detailed health check with metrics',
        },
      },
      authentication: {
        type: 'Bearer Token',
        header: 'Authorization: Bearer <token>',
        endpoints: {
          register: 'POST /api/auth/register',
          login: 'POST /api/auth/login',
          refresh: 'POST /api/auth/refresh',
        },
      },
      rateLimit: {
        general: '1000 requests per 15 minutes per IP',
        auth: '10 requests per 15 minutes per IP',
        voice: '30 requests per minute per IP',
        upload: '20 requests per 5 minutes per IP',
      },
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

async function initializeServices(): Promise<void> {
  logger.info('Initializing services...');

  try {
    // Validate configuration
    validateConfig();

    // Initialize database connections
    await connectMongoDB();
    await connectRedis();
    await connectPostgreSQL();

    // Initialize image storage
    await ImageStorageService.initialize();

    // Initialize health monitoring
    await HealthService.initialize();

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Service initialization failed', { error: error.message });
    throw error;
  }
}

async function startServer(): Promise<void> {
  try {
    // Initialize services first
    await initializeServices();

    // Create Express app
    const app = await createApp();

    // Create HTTP server
    const server = createServer(app);

    // Start server
    const port = config.server.port;
    server.listen(port, () => {
      logger.info('Server started successfully', {
        port,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      });
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        
        // Cleanup services
        HealthService.cleanup();
        
        // Close database connections
        // MongoDB will close automatically
        // PostgreSQL pool will close automatically
        // Redis client will close automatically
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', { reason, promise });
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('Server startup failed', { error: error.message });
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

export { createApp, startServer };