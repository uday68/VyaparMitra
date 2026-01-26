---
inclusion: always
---

# VyaparMitra - Project Overview

## 🎯 Project Mission
VyaparMitra is a revolutionary voice-first e-commerce platform that enables seamless price negotiations between vendors and customers through AI-assisted voice interactions, multilingual support, and intelligent automation.

## 🏗️ Architecture Overview

### Technology Stack
- **Backend**: Node.js + TypeScript + Express.js
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Databases**: PostgreSQL (transactions) + MongoDB (documents) + Redis (caching)
- **Voice Processing**: Tacotron, Voicebox, SV2TTS with BHASHINI translation
- **Real-time**: GraphQL subscriptions + WebSockets
- **Payment**: Razorpay integration with UPI support
- **Deployment**: Docker + Docker Compose + GitHub Actions CI/CD

### Core Features
1. **Voice Commerce**: Complete TTS/STT pipeline with 12 Indian languages
2. **Real-time Negotiations**: Live bidding with voice and text support
3. **Payment Processing**: Razorpay integration with webhooks and refunds
4. **Multilingual Support**: 12 Indian languages with context-aware translation
5. **Accessibility**: Voice-first design for inclusive commerce

## 📁 Project Structure

```
VyaparMitra/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-based pages (25+ implemented)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── i18n/           # Internationalization (12 languages)
│   │   └── lib/            # Utility libraries
├── src/                    # Backend services
│   ├── config/             # Configuration management
│   ├── db/                 # Database connections & migrations
│   ├── services/           # Business logic services
│   ├── routes/             # API endpoints
│   ├── middleware/         # Express middleware
│   ├── voice/              # Voice processing modules
│   ├── graphql/            # GraphQL resolvers
│   └── __tests__/          # Test suites
├── scripts/                # Deployment and utility scripts
├── docs/                   # Documentation
└── .github/                # CI/CD workflows
```

## 🎯 Development Priorities

### Current Status: 100% Production Ready
- ✅ Complete payment processing (Razorpay)
- ✅ Voice processing pipeline (TTS/STT/Intent)
- ✅ Translation services (BHASHINI + fallbacks)
- ✅ 12-language i18n support
- ✅ Real-time negotiations
- ✅ Security & authentication
- ✅ CI/CD pipeline
- ✅ Database migrations
- ✅ Monitoring & logging

### Key Business Logic
1. **Negotiation Flow**: Customer → Voice/Text Bid → Vendor Response → Agreement → Payment
2. **Voice Processing**: Speech → Intent Recognition → Translation → Response Generation
3. **Payment Flow**: Order Creation → Razorpay → Webhook → Confirmation → Fulfillment
4. **User Management**: Registration → Verification → Profile → Voice Profile (optional)

## 🔧 Development Guidelines

### Code Standards
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Jest for testing with 85%+ coverage target
- Functional components with hooks preferred
- Service layer pattern for business logic

### Database Patterns
- PostgreSQL for ACID transactions (payments, orders)
- MongoDB for flexible documents (users, products)
- Redis for caching and sessions
- Migration-based schema management

### API Design
- RESTful endpoints for CRUD operations
- GraphQL for real-time subscriptions
- Zod validation for all inputs
- JWT authentication with refresh tokens
- Rate limiting per endpoint type

### Voice Commerce Patterns
- Intent-based voice command processing
- Context-aware translation preservation
- Fallback mechanisms for voice services
- Audio caching for performance
- Multilingual voice profile support

## 🚀 Deployment Strategy

### Production Environment
- Docker containerized deployment
- Multi-database cluster setup
- Load balancing with Nginx
- SSL/TLS termination
- Automated backup procedures

### CI/CD Pipeline
- GitHub Actions workflow
- Automated testing (unit, integration, e2e)
- Security scanning (Snyk, Trivy)
- Performance testing (k6)
- Automated deployment with rollback

### Monitoring & Observability
- Winston structured logging
- Health check endpoints
- Performance metrics collection
- Error tracking and alerting
- Business metrics dashboard

## 🎯 Success Metrics

### Technical KPIs
- API response time < 200ms (95th percentile < 500ms)
- Voice processing < 2s
- Translation accuracy > 85%
- System uptime > 99.9%
- Test coverage > 85%

### Business KPIs
- User registration conversion > 70%
- Negotiation completion rate > 60%
- Voice feature adoption > 40%
- Payment success rate > 95%
- Multi-language usage > 30%

## 🔍 Common Development Patterns

When working on VyaparMitra, follow these established patterns:

1. **Service Layer**: Business logic in `/src/services/`
2. **Validation**: Zod schemas in `/src/middleware/validation.ts`
3. **Error Handling**: Centralized in `/src/middleware/errorHandler.ts`
4. **Logging**: Structured logging with context
5. **Testing**: Comprehensive test coverage with mocks
6. **i18n**: Translation keys in `/client/src/i18n/locales/`
7. **Voice**: Intent processing in `/src/services/voice_intent.ts`
8. **Real-time**: GraphQL subscriptions for live updates