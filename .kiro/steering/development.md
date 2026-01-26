---
inclusion: fileMatch
fileMatchPattern: "src/**/*.ts"
---

# VyaparMitra - Development Workflow & Standards

## 🔧 Development Environment Setup

### Prerequisites
- Node.js 20+ with npm
- Docker & Docker Compose
- PostgreSQL 16+, MongoDB 7+, Redis 7+
- Git with SSH keys configured

### Quick Start
```bash
# Clone and setup
git clone https://github.com/uday68/VyaparMitra.git
cd VyaparMitra

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start databases
docker-compose up -d postgres mongodb redis

# Run migrations
npm run migrate:up

# Start development server
npm run dev
```

## 📝 Code Standards & Patterns

### TypeScript Configuration
- **Strict Mode**: Enabled for type safety
- **Target**: ES2022 for modern features
- **Module**: ESNext with Node.js resolution
- **Decorators**: Enabled for GraphQL and validation

### Code Style Guidelines
```typescript
// ✅ Good: Service layer pattern
export class PaymentService {
  private razorpay: Razorpay;
  
  async createPaymentOrder(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate input
      const validation = paymentSchema.parse(request);
      
      // Business logic
      const order = await this.processPayment(validation);
      
      // Logging
      logger.info('Payment order created', { orderId: order.id });
      
      return order;
    } catch (error) {
      logger.error('Payment creation failed', { error, request });
      throw error;
    }
  }
}

// ❌ Bad: Direct database access in routes
app.post('/payment', async (req, res) => {
  const result = await db.query('INSERT INTO payments...');
  res.json(result);
});
```

### File Organization Patterns
```
src/
├── services/           # Business logic (single responsibility)
│   ├── payment_service.ts
│   ├── voice_intent.ts
│   └── translation_service.ts
├── routes/            # API endpoints (thin controllers)
│   ├── auth.ts
│   ├── payment.ts
│   └── api.ts
├── middleware/        # Cross-cutting concerns
│   ├── auth.ts
│   ├── validation.ts
│   └── rateLimiter.ts
└── __tests__/         # Test files (mirror structure)
    ├── services/
    ├── routes/
    └── setup.ts
```

## 🧪 Testing Standards

### Test Structure
```typescript
// ✅ Good: Comprehensive test coverage
describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockRazorpay: jest.Mocked<Razorpay>;
  
  beforeEach(() => {
    mockRazorpay = createMockRazorpay();
    paymentService = new PaymentService(mockRazorpay);
  });
  
  describe('createPaymentOrder', () => {
    it('should create payment order successfully', async () => {
      // Arrange
      const request = createValidPaymentRequest();
      mockRazorpay.orders.create.mockResolvedValue(mockOrder);
      
      // Act
      const result = await paymentService.createPaymentOrder(request);
      
      // Assert
      expect(result).toMatchObject({
        id: expect.any(String),
        status: 'created',
        amount: request.amount
      });
      expect(mockRazorpay.orders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: request.amount,
          currency: 'INR'
        })
      );
    });
    
    it('should handle payment creation failure', async () => {
      // Arrange
      const request = createValidPaymentRequest();
      mockRazorpay.orders.create.mockRejectedValue(new Error('API Error'));
      
      // Act & Assert
      await expect(paymentService.createPaymentOrder(request))
        .rejects.toThrow('API Error');
    });
  });
});
```

### Test Categories
1. **Unit Tests**: Individual service methods
2. **Integration Tests**: API endpoints with database
3. **E2E Tests**: Complete user workflows
4. **Performance Tests**: Load testing with k6

### Test Commands
```bash
npm run test              # Run all tests
npm run test:coverage     # Generate coverage report
npm run test:watch        # Watch mode for development
npm run performance:test  # Load testing
```

## 🎤 Voice Commerce Development

### Voice Intent Development Pattern
```typescript
// Adding new voice intents
export class VoiceIntentService {
  private static readonly intentMappings: IntentMapping[] = [
    {
      patterns: [
        'cancel order',
        'cancel my order',
        'आर्डर रद्द करें',
        'ऑर्डर कैंसल करें'
      ],
      intent: 'CANCEL_ORDER',
      requiredEntities: ['order_id']
    }
  ];
  
  // Always add multilingual support
  // Always include entity extraction
  // Always handle confidence thresholds
}
```

### TTS Integration Pattern
```typescript
// Voice service integration
export class TTSService {
  static async speak(request: TTSRequest): Promise<TTSResponse> {
    // 1. Check cache first
    const cached = await this.getCachedAudio(request);
    if (cached) return cached;
    
    // 2. Try primary service
    try {
      return await this.generateWithPrimaryService(request);
    } catch (error) {
      // 3. Fallback to secondary service
      return await this.generateWithFallbackService(request);
    }
  }
}
```

## 🌍 Internationalization Development

### Translation Key Patterns
```typescript
// ✅ Good: Structured translation keys
{
  "negotiation": {
    "bid": {
      "create": "Create new bid",
      "accept": "Accept bid",
      "reject": "Reject bid",
      "counter": "Make counter offer"
    },
    "status": {
      "pending": "Negotiation pending",
      "accepted": "Bid accepted",
      "rejected": "Bid rejected"
    }
  }
}

// ❌ Bad: Flat structure
{
  "negotiation_bid_create": "Create new bid",
  "negotiation_bid_accept": "Accept bid"
}
```

### Translation Usage Pattern
```typescript
// In React components
const { t } = useTranslation();

return (
  <button onClick={handleAccept}>
    {t('negotiation.bid.accept')}
  </button>
);

// In backend services
const message = await TranslationService.translateWithContext(
  'Bid accepted successfully',
  'en',
  userLanguage,
  'negotiation'
);
```

## 💳 Payment Integration Development

### Payment Flow Pattern
```typescript
// Always follow this pattern for payments
export class PaymentService {
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const client = await this.pool.connect();
    
    try {
      // 1. Start transaction
      await client.query('BEGIN');
      
      // 2. Validate order and amount
      await this.validatePaymentRequest(request, client);
      
      // 3. Create payment with gateway
      const gatewayResponse = await this.createGatewayPayment(request);
      
      // 4. Store payment record
      await this.storePaymentRecord(gatewayResponse, client);
      
      // 5. Commit transaction
      await client.query('COMMIT');
      
      return this.formatPaymentResponse(gatewayResponse);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
```

## 🔒 Security Development Patterns

### Authentication Middleware Pattern
```typescript
// Always validate JWT and extract user context
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractBearerToken(req);
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    
    // Attach user to request
    req.user = await getUserById(decoded.userId);
    
    // Log authentication event
    logger.info('User authenticated', {
      userId: req.user.id,
      userType: req.user.type,
      endpoint: req.path
    });
    
    next();
  } catch (error) {
    logger.warn('Authentication failed', { error, path: req.path });
    res.status(401).json({ error: 'Unauthorized' });
  }
};
```

### Input Validation Pattern
```typescript
// Always use Zod for validation
const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  category: z.enum(['fruits', 'vegetables', 'grains']),
  description: z.string().optional(),
  images: z.array(z.string().url()).max(5)
});

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      } else {
        next(error);
      }
    }
  };
};
```

## 📊 Logging & Monitoring Patterns

### Structured Logging Pattern
```typescript
// Always use structured logging with context
logger.info('Business event occurred', {
  event: 'negotiation_completed',
  userId: user.id,
  vendorId: vendor.id,
  productId: product.id,
  finalPrice: negotiation.finalPrice,
  duration: negotiation.duration,
  language: user.language
});

// Error logging with full context
logger.error('Service operation failed', {
  service: 'PaymentService',
  method: 'createPaymentOrder',
  error: error.message,
  stack: error.stack,
  input: sanitizeForLogging(request),
  userId: user?.id
});
```

### Performance Monitoring Pattern
```typescript
// Measure critical operations
const timer = logger.startTimer();
try {
  const result = await expensiveOperation();
  timer.done({ message: 'Operation completed', success: true });
  return result;
} catch (error) {
  timer.done({ message: 'Operation failed', success: false, error });
  throw error;
}
```

## 🚀 Deployment Development

### Environment Configuration Pattern
```typescript
// Always validate environment variables
export const config = {
  server: {
    port: parseInt(process.env.PORT || '4000'),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    postgresql: {
      uri: process.env.POSTGRES_URI || throwMissingEnvError('POSTGRES_URI'),
    }
  }
};

function throwMissingEnvError(varName: string): never {
  throw new Error(`Missing required environment variable: ${varName}`);
}
```

### Health Check Pattern
```typescript
// Always implement comprehensive health checks
export class HealthService {
  static async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalServices()
    ]);
    
    const allHealthy = checks.every(check => 
      check.status === 'fulfilled' && check.value === 'healthy'
    );
    
    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: this.formatHealthResults(checks)
    };
  }
}
```

## 🔄 Git Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature development
- `hotfix/*` - Production fixes

### Commit Message Format
```
type(scope): description

feat(payment): add Razorpay webhook handling
fix(voice): resolve TTS caching issue
docs(api): update authentication endpoints
test(negotiation): add integration tests
```

### Pre-commit Checklist
- [ ] Tests pass (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript compiles (`npm run build`)
- [ ] No console.log statements
- [ ] Environment variables documented
- [ ] Database migrations created if needed

This development guide ensures consistency, quality, and maintainability across the VyaparMitra codebase while supporting the complex requirements of voice commerce and multilingual negotiations.