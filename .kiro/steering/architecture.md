---
inclusion: fileMatch
fileMatchPattern: "src/**/*"
---

# VyaparMitra - Technical Architecture Guide

## 🏗️ System Architecture

### Multi-Tier Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Services      │
│   React SPA     │────│   Express.js    │────│   Business      │
│   Voice UI      │    │   GraphQL       │    │   Logic         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   Data Layer    │
                       │ PostgreSQL      │
                       │ MongoDB         │
                       │ Redis           │
                       └─────────────────┘
```

## 🗄️ Database Architecture

### PostgreSQL (ACID Transactions)
**Purpose**: Financial transactions, orders, negotiations, payments
**Location**: `src/db/postgres.ts`, `src/db/migrations/`

**Key Tables**:
- `users` - User accounts with vendor/customer roles
- `negotiations` - Price negotiation sessions
- `bids` - Individual bid records with voice/text
- `orders` - Purchase orders from successful negotiations
- `payments` - Payment transactions with Razorpay integration
- `audit_logs` - Complete audit trail for compliance

### MongoDB (Document Store)
**Purpose**: Flexible schemas, voice profiles, product catalogs
**Location**: `src/db/mongo.ts`

**Collections**:
- `products` - Product catalog with images and specifications
- `voice_profiles` - User voice cloning data and preferences
- `qr_sessions` - Temporary QR code session data
- `chat_messages` - Negotiation chat history

### Redis (Caching & Sessions)
**Purpose**: Performance optimization, session management
**Location**: `src/db/redis.ts`

**Usage Patterns**:
- Session storage for JWT tokens
- Audio file caching for TTS
- Translation result caching
- Stock lock management
- Rate limiting counters

## 🎤 Voice Processing Architecture

### TTS (Text-to-Speech) Pipeline
**Location**: `src/voice/`

```
Text Input → Language Detection → Model Selection → Audio Generation → Caching
    ↓              ↓                    ↓               ↓            ↓
 User Text    → BHASHINI API    → Tacotron/Voicebox → WAV/MP3 → Redis Cache
```

**Models Supported**:
- **Tacotron**: Primary TTS with HiFi-GAN vocoder
- **Voicebox**: Meta's multilingual TTS model
- **SV2TTS**: Voice cloning for personalized audio

### Voice Intent Recognition
**Location**: `src/services/voice_intent.ts`

**Supported Intents**:
- `ADD_PRODUCT` - Voice product creation
- `START_NEGOTIATION` - Begin price negotiation
- `ACCEPT_BID` / `REJECT_BID` - Negotiation responses
- `COUNTER_BID` - Price counter-offers
- `CHECK_STOCK` - Inventory queries
- `HELP` / `GREETING` - User assistance

## 🌐 API Architecture

### RESTful Endpoints
**Location**: `src/routes/`

**Core Routes**:
- `/api/auth/*` - Authentication & user management
- `/api/products/*` - Product CRUD operations
- `/api/negotiations/*` - Negotiation lifecycle
- `/api/voice/*` - Voice processing services
- `/api/payment/*` - Payment processing
- `/api/translate` - Translation services

### GraphQL Subscriptions
**Location**: `src/graphql/resolvers/`

**Real-time Features**:
- `negotiationCreated` - New negotiation notifications
- `bidCreated` - Live bid updates with audio
- `bidAccepted/Rejected` - Negotiation status changes
- `voiceCommandProcessed` - Voice processing status

## 🔒 Security Architecture

### Authentication Flow
```
Client Request → JWT Validation → Role Check → Rate Limiting → Business Logic
      ↓              ↓              ↓            ↓              ↓
   Bearer Token → Verify Signature → Vendor/Customer → Redis Counter → Service Call
```

### Security Layers
1. **Input Validation**: Zod schemas for all endpoints
2. **Authentication**: JWT with refresh token rotation
3. **Authorization**: Role-based access control
4. **Rate Limiting**: Multi-tier protection with Redis
5. **Audit Logging**: Complete request/response tracking

## 💳 Payment Architecture

### Razorpay Integration Flow
```
Order Creation → Payment Link → User Payment → Webhook → Verification → Fulfillment
      ↓              ↓             ↓            ↓           ↓            ↓
   Database    → Razorpay API → Gateway UI → Callback → Signature → Order Update
```

**Security Features**:
- Cryptographic signature verification
- Webhook endpoint protection
- Transaction-based processing
- Comprehensive audit logging
- Automatic refund handling

## 🌍 Internationalization Architecture

### Translation Pipeline
**Location**: `client/src/i18n/`

```
User Language → Detection → Translation Keys → BHASHINI API → Cached Result
      ↓            ↓             ↓               ↓              ↓
   Browser    → i18next → JSON Files → Government API → Redis Cache
```

**Supported Languages**: 12 Indian languages with fallback chains
**Context Preservation**: Business-specific translation contexts

## 🔄 Real-time Architecture

### WebSocket Communication
```
Client Connection → GraphQL Subscription → Event Publisher → Database Change
        ↓                    ↓                   ↓               ↓
   Browser WS → Apollo Server → Redis PubSub → PostgreSQL Trigger
```

**Use Cases**:
- Live negotiation updates
- Voice processing status
- Payment confirmations
- System notifications

## 📊 Monitoring Architecture

### Logging Strategy
**Location**: `src/utils/logger.ts`

**Log Levels**:
- `error` - System errors and exceptions
- `warn` - Business logic warnings
- `info` - Important business events
- `debug` - Detailed debugging information

**Structured Logging**:
```json
{
  "timestamp": "2024-01-26T10:30:00Z",
  "level": "info",
  "message": "Payment processed successfully",
  "context": {
    "userId": "uuid",
    "orderId": "uuid",
    "amount": 1500,
    "paymentMethod": "razorpay"
  }
}
```

### Health Monitoring
**Location**: `src/utils/health.ts`

**Health Checks**:
- Database connectivity (PostgreSQL, MongoDB, Redis)
- External service availability (BHASHINI, Razorpay)
- Voice processing service status
- System resource utilization

## 🚀 Deployment Architecture

### Container Strategy
```
Docker Image → Container Registry → Orchestration → Load Balancer → SSL Termination
      ↓              ↓                   ↓              ↓              ↓
  Multi-stage → GitHub Registry → Docker Compose → Nginx → Let's Encrypt
```

**Production Stack**:
- **Application**: Node.js containers with health checks
- **Databases**: Managed database services or containers
- **Caching**: Redis cluster for high availability
- **Load Balancing**: Nginx with SSL termination
- **Monitoring**: Winston logs with external aggregation

## 🔧 Development Patterns

### Service Layer Pattern
**Location**: `src/services/`

Each service follows this structure:
```typescript
export class ServiceName {
  // Private dependencies
  private dependency: Dependency;
  
  // Public methods with error handling
  async publicMethod(params: ValidatedInput): Promise<TypedOutput> {
    try {
      // Business logic implementation
      const result = await this.privateMethod(params);
      
      // Logging and metrics
      logger.info('Operation completed', { context });
      
      return result;
    } catch (error) {
      logger.error('Operation failed', { error, context });
      throw error;
    }
  }
  
  // Private implementation methods
  private async privateMethod(params: Input): Promise<Output> {
    // Implementation details
  }
}
```

### Error Handling Pattern
**Location**: `src/middleware/errorHandler.ts`

Centralized error handling with:
- Type-specific error responses
- Logging with context
- User-friendly error messages
- Security-conscious error exposure

### Validation Pattern
**Location**: `src/middleware/validation.ts`

Zod-based validation with:
- Request body validation
- Query parameter validation
- Type-safe error responses
- Automatic OpenAPI documentation

This architecture ensures scalability, maintainability, and production readiness while supporting the complex requirements of voice commerce and multilingual negotiations.