---
inclusion: fileMatch
fileMatchPattern: "scripts/**/*"
---

# VyaparMitra - Deployment Guide

## 🚀 Deployment Overview

VyaparMitra follows a containerized deployment strategy with Docker Compose for orchestration, supporting both development and production environments with automated CI/CD pipelines.

## 🏗️ Infrastructure Architecture

### Production Stack
```
Internet → Load Balancer → Application Containers → Database Cluster
    ↓           ↓                    ↓                    ↓
  HTTPS    → Nginx Proxy → Node.js Instances → PostgreSQL/MongoDB/Redis
```

### Container Architecture
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   App Container │  │  Database       │  │   Cache         │
│   - Node.js     │  │  - PostgreSQL   │  │   - Redis       │
│   - Express     │  │  - MongoDB      │  │   - Sessions    │
│   - GraphQL     │  │                 │  │   - Audio Cache │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## 📦 Docker Configuration

### Multi-stage Production Build
**File**: `Dockerfile.production`

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "start"]
```

### Docker Compose Production
**File**: `docker-compose.production.yml`

Key services:
- **app**: Node.js application with health checks
- **postgres**: PostgreSQL with persistent volumes
- **mongodb**: MongoDB with replica set configuration
- **redis**: Redis with persistence enabled
- **nginx**: Reverse proxy with SSL termination

## 🔧 Environment Configuration

### Production Environment Variables
**File**: `.env.production.example`

Critical configurations:
```bash
# Application
NODE_ENV=production
PORT=4000
APP_BASE_URL=https://api.vyaparmitra.com
FRONTEND_URL=https://vyaparmitra.com

# Security
JWT_SECRET=your-super-secure-jwt-secret
CORS_ORIGINS=https://vyaparmitra.com,https://www.vyaparmitra.com

# Databases
POSTGRES_URI=postgresql://user:pass@postgres:5432/vyapar_mitra_prod
MONGODB_URI=mongodb://user:pass@mongodb:27017/vyapar_mitra_prod
REDIS_URL=redis://redis:6379

# Payment Gateway
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Voice & Translation
BHASHINI_API_KEY=your_bhashini_api_key
TACOTRON_ENDPOINT=https://tts-tacotron.yourdomain.com
VOICEBOX_ENDPOINT=https://tts-voicebox.yourdomain.com
```

## 🚀 Deployment Scripts

### Production Deployment
**File**: `scripts/deploy-production.sh`

Features:
- Automated backup creation
- Database migration execution
- Health checks and smoke tests
- Rollback capability on failure
- Slack notifications

Usage:
```bash
# Deploy latest version
./scripts/deploy-production.sh

# Deploy specific tag
./scripts/deploy-production.sh -t v1.2.3

# Rollback to previous version
./scripts/deploy-production.sh -r
```

### Development Deployment
**File**: `scripts/deploy.sh`

Simplified deployment for development environments:
```bash
# Quick development deployment
npm run deploy:dev
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
**File**: `.github/workflows/ci-cd.yml`

Pipeline stages:
1. **Test & Code Quality**
   - Unit and integration tests
   - Code coverage reporting
   - TypeScript compilation
   - ESLint and Prettier checks

2. **Security Scanning**
   - Dependency vulnerability scanning (Snyk)
   - Container image scanning (Trivy)
   - Code security analysis
   - License compliance checks

3. **Build & Package**
   - Multi-platform Docker builds
   - Container registry push
   - Artifact generation
   - Version tagging

4. **Deploy to Staging**
   - Automated staging deployment
   - Smoke test execution
   - Performance testing
   - Integration validation

5. **Deploy to Production**
   - Manual approval gate
   - Blue-green deployment
   - Health monitoring
   - Rollback on failure

### Deployment Triggers
- **Staging**: Push to `develop` branch
- **Production**: Push to `main` branch
- **Hotfix**: Push to `hotfix/*` branches

## 🗄️ Database Deployment

### Migration Strategy
```bash
# Run migrations
npm run migrate:up

# Check migration status
npm run migrate:status

# Rollback if needed
npm run migrate:rollback filename
```

### Database Initialization
**File**: `src/db/migrations/001_initial_schema.sql`

Includes:
- Complete PostgreSQL schema (12 tables)
- Indexes for performance optimization
- Triggers for audit logging
- Seed data for development

### Backup Strategy
```bash
# PostgreSQL backup
docker-compose exec postgres pg_dump -U user dbname > backup.sql

# MongoDB backup
docker-compose exec mongodb mongodump --db dbname --archive > backup.archive

# Automated backups in production
0 2 * * * /scripts/backup-databases.sh
```

## 🔍 Health Monitoring

### Health Check Endpoints
- `GET /health` - Basic application health
- `GET /health/detailed` - Comprehensive system status
- `GET /api/voice/health` - Voice services status

### Health Check Implementation
```typescript
// Comprehensive health monitoring
export class HealthService {
  static async checkHealth(): Promise<HealthStatus> {
    const services = await Promise.allSettled([
      this.checkPostgreSQL(),
      this.checkMongoDB(), 
      this.checkRedis(),
      this.checkExternalServices()
    ]);
    
    return {
      status: this.determineOverallHealth(services),
      timestamp: new Date().toISOString(),
      services: this.formatServiceStatus(services),
      version: process.env.npm_package_version,
      uptime: process.uptime()
    };
  }
}
```

### Monitoring Integration
- **Logs**: Winston structured logging
- **Metrics**: Prometheus-compatible metrics
- **Alerts**: Health check failures trigger notifications
- **Dashboards**: Grafana visualization

## 🔒 Security Deployment

### SSL/TLS Configuration
```nginx
# Nginx SSL configuration
server {
    listen 443 ssl http2;
    server_name api.vyaparmitra.com;
    
    ssl_certificate /etc/ssl/certs/vyaparmitra.crt;
    ssl_certificate_key /etc/ssl/private/vyaparmitra.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    location / {
        proxy_pass http://app:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Security Headers
```typescript
// Helmet.js security configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## 📊 Performance Optimization

### Load Testing
**File**: `tests/performance/load-test.js`

K6 performance testing scenarios:
- Product listing performance
- Payment processing load
- Voice service capacity
- Translation service throughput
- Real-time negotiation scalability

```bash
# Run performance tests
npm run performance:test

# Custom load testing
k6 run --vus 100 --duration 5m tests/performance/load-test.js
```

### Caching Strategy
- **Redis**: Session storage, API responses, audio files
- **CDN**: Static assets, images, audio files
- **Application**: In-memory caching for translations
- **Database**: Query result caching

### Resource Optimization
```yaml
# Docker resource limits
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

## 🚨 Disaster Recovery

### Backup Procedures
1. **Database Backups**: Daily automated backups
2. **File Backups**: Voice recordings, uploaded images
3. **Configuration Backups**: Environment variables, certificates
4. **Code Backups**: Git repository with tags

### Recovery Procedures
1. **Application Recovery**: Container restart with health checks
2. **Database Recovery**: Point-in-time recovery from backups
3. **Full System Recovery**: Complete infrastructure rebuild
4. **Data Recovery**: Backup restoration with validation

### Rollback Strategy
```bash
# Automated rollback on deployment failure
if ! health_check_passes; then
    echo "Health check failed, initiating rollback..."
    restore_previous_version
    restart_services
    verify_rollback_success
fi
```

## 📋 Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Backup procedures verified

### Deployment
- [ ] Application containers healthy
- [ ] Database connections established
- [ ] External services accessible
- [ ] Health checks passing
- [ ] Performance metrics normal
- [ ] Error rates acceptable

### Post-deployment
- [ ] Smoke tests completed
- [ ] Monitoring alerts configured
- [ ] Log aggregation working
- [ ] Backup procedures scheduled
- [ ] Documentation updated
- [ ] Team notifications sent

## 🎯 Deployment Best Practices

### Zero-downtime Deployment
- Blue-green deployment strategy
- Health check validation
- Gradual traffic shifting
- Automatic rollback on failure

### Configuration Management
- Environment-specific configurations
- Secret management with encryption
- Configuration validation
- Version-controlled settings

### Monitoring & Alerting
- Comprehensive health monitoring
- Performance metric tracking
- Error rate alerting
- Business metric dashboards

This deployment guide ensures reliable, secure, and scalable deployment of VyaparMitra while maintaining high availability and performance standards.