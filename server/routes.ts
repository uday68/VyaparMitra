import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "../shared/routes";
import { z } from "zod";
import { registerAudioRoutes } from "./replit_integrations/audio";
import { chatStorage } from "./replit_integrations/chat/storage";

// Import our main API routes
import authRoutes from "../src/routes/auth";
import apiRoutes from "../src/routes/api";
import paymentRoutes from "../src/routes/payment";
import analyticsRoutes from "../src/routes/analytics";
import voiceRoutes from "../src/routes/voice";

// Import Cross-Language QR Commerce routes
import { createQRSessionsRouter } from "../src/routes/qr-sessions";

// Import WebSocket service
import { WebSocketService } from "../src/services/websocket_service";

// Import database initialization
import { connectMongoDB } from "../src/db/mongo";
import { connectRedis } from "../src/db/redis";
import { connectPostgreSQL } from "../src/db/postgres";
import { ImageStorageService } from "../src/services/image_storage";

let webSocketService: WebSocketService;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Initialize database connections
  try {
    await connectMongoDB();
    const redis = await connectRedis();
    const db = await connectPostgreSQL();
    await ImageStorageService.initialize();
    
    // Initialize WebSocket service for real-time communication
    webSocketService = new WebSocketService(httpServer, db, redis);
    
    // Initialize Cross-Language QR Commerce routes
    const qrSessionsRouter = createQRSessionsRouter(db, redis);
    app.use('/api/qr-sessions', qrSessionsRouter);
    
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    // Continue anyway for development
  }

  // Add necessary middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Register AI Audio routes (Voice Chat)
  registerAudioRoutes(app);

  // === MAIN API ROUTES (from src/routes) ===
  app.use('/api/auth', authRoutes);
  app.use('/api/payment', paymentRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/voice', voiceRoutes);
  app.use('/api', apiRoutes);

  // Health check endpoints
  app.get('/health', async (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'vyapar-mitra'
    });
  });

  // === LEGACY API ROUTES (for compatibility) ===

  // Products
  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  // Negotiations
  app.post(api.negotiations.create.path, async (req, res) => {
    try {
      const { productId, initialMessage } = api.negotiations.create.input.parse(req.body);
      
      const product = await storage.getProduct(productId);
      if (!product) return res.status(404).json({ message: "Product not found" });

      // 1. Create Conversation
      const title = `Negotiation for ${product.name}`;
      const conversation = await chatStorage.createConversation(title);

      // 2. Create Negotiation
      const negotiation = await storage.createNegotiation({
        productId,
        conversationId: conversation.id,
        status: "active",
      });

      // 3. Add initial message if provided (System/Context setting)
      await chatStorage.createMessage(
        conversation.id, 
        "system", 
        `You are a fruit vendor negotiating the price of ${product.name}. The base price is ${product.price}/${product.unit}. Be polite but firm. Do not go below 80% of the price.`
      );

      // 4. Add initial user message if any? (Usually voice starts it, but maybe context helps)
      // Actually, let's just return the negotiation so the frontend can start the voice stream.

      res.status(201).json({ ...negotiation, conversationId: conversation.id });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.negotiations.list.path, async (req, res) => {
    const negotiations = await storage.getNegotiations();
    res.json(negotiations);
  });

  app.get(api.negotiations.get.path, async (req, res) => {
    const negotiation = await storage.getNegotiation(Number(req.params.id));
    if (!negotiation) return res.status(404).json({ message: "Negotiation not found" });
    res.json(negotiation);
  });

  app.patch(api.negotiations.updateStatus.path, async (req, res) => {
    try {
      const { status, finalPrice } = api.negotiations.updateStatus.input.parse(req.body);
      const negotiation = await storage.updateNegotiationStatus(Number(req.params.id), status, finalPrice);
      if (!negotiation) return res.status(404).json({ message: "Negotiation not found" });
      res.json(negotiation);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Seed Data function (called internally if needed)
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingProducts = await storage.getProducts();
  if (existingProducts.length === 0) {
    console.log("Seeding database with products...");
    await storage.createProduct({
      name: "Fresh Shimla Apples",
      description: "Crisp, sweet and directly sourced from Shimla orchards.",
      price: "180",
      unit: "kg",
      imageUrl: "/images/apples.jpg",
      vendorName: "Sanjay's Fruits",
      active: true,
    });
    await storage.createProduct({
      name: "Robusta Bananas",
      description: "Naturally ripened, rich in potassium and energy.",
      price: "60",
      unit: "dozen",
      imageUrl: "/images/bananas.jpg",
      vendorName: "Sanjay's Fruits",
      active: true,
    });
    await storage.createProduct({
      name: "Ratnagiri Alphonso",
      description: "The King of Mangoes, premium quality from Ratnagiri.",
      price: "800",
      unit: "dozen",
      imageUrl: "/images/mangoes.jpg",
      vendorName: "Sanjay's Fruits",
      active: true,
    });
    console.log("Seeding complete.");
  }
}
