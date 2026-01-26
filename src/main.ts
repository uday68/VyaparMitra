import 'reflect-metadata';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import cron from 'node-cron';

import { connectMongoDB } from './db/mongo';
import { connectPostgreSQL } from './db/postgres';
import { connectRedis } from './db/redis';
import { VendorResolver } from './graphql/resolvers/VendorResolver';
import { ProductResolver } from './graphql/resolvers/ProductResolver';
import { NegotiationResolver } from './graphql/resolvers/NegotiationResolver';
import { config, validateConfig } from './config/settings';
import apiRoutes from './routes/api';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { StockLockService } from './services/stock_lock_service';
import { NegotiationService } from './services/negotiation_service';
import { QRService } from './utils/qr';

dotenv.config();

// Validate configuration
validateConfig();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [...config.upload.allowedImageTypes, ...config.upload.allowedAudioTypes];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  
  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static('uploads'));
  app.use('/public', express.static('public'));

  // Database connections
  await connectMongoDB();
  await connectPostgreSQL();
  await connectRedis();

  // GraphQL Schema
  const schema = await buildSchema({
    resolvers: [VendorResolver, ProductResolver, NegotiationResolver],
    validate: false,
  });

  // Apollo Server
  const server = new ApolloServer({
    schema,
    context: ({ req }) => ({ req }),
  });

  await server.start();
  server.applyMiddleware({ app });

  // REST API Routes
  app.use('/api', apiRoutes);

  // File upload routes
  app.post('/api/upload/audio', upload.single('audio'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    res.json({ 
      success: true, 
      data: { 
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype 
      } 
    });
  });

  app.post('/api/upload/image', upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    res.json({ 
      success: true, 
      data: { 
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype 
      } 
    });
  });

  // WebSocket Server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  useServer({ schema }, wsServer);

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Scheduled tasks
  setupCronJobs();

  const PORT = config.server.port;
  
  httpServer.listen(PORT, () => {
    console.log(`🚀 VyaparMitra Server ready at http://localhost:${PORT}`);
    console.log(`📊 GraphQL Playground: http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`🔊 WebSocket Subscriptions: ws://localhost:${PORT}/graphql`);
    console.log(`🌐 REST API: http://localhost:${PORT}/api`);
    console.log(`📱 Environment: ${config.server.nodeEnv}`);
  });
}

function setupCronJobs() {
  // Clean up expired stock locks every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await StockLockService.cleanupExpiredLocks();
    } catch (error) {
      console.error('Failed to cleanup expired locks:', error);
    }
  });

  // Clean up expired negotiations every hour
  cron.schedule('0 * * * *', async () => {
    try {
      await NegotiationService.expireOldNegotiations();
    } catch (error) {
      console.error('Failed to expire old negotiations:', error);
    }
  });

  // Clean up expired QR codes every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      await QRService.cleanupExpiredQRs();
    } catch (error) {
      console.error('Failed to cleanup expired QRs:', error);
    }
  });

  console.log('✅ Scheduled tasks configured');
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});