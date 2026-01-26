---
inclusion: manual
---

# VyaparMitra - Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Database Connection Issues

#### PostgreSQL Connection Failed
**Symptoms**: `ECONNREFUSED` errors, migration failures
**Causes**: Database not running, incorrect credentials, network issues

**Solutions**:
```bash
# Check database status
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres

# Verify connection
npm run migrate:status
```

#### MongoDB Connection Timeout
**Symptoms**: `MongoNetworkTimeoutError`, slow queries
**Causes**: Network latency, insufficient resources, index missing

**Solutions**:
```bash
# Check MongoDB status
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Monitor performance
docker-compose exec mongodb mongosh --eval "db.stats()"

# Check indexes
docker-compose exec mongodb mongosh --eval "db.products.getIndexes()"
```

#### Redis Connection Issues
**Symptoms**: Session failures, cache misses, rate limiting errors
**Causes**: Redis memory full, connection pool exhausted

**Solutions**:
```bash
# Check Redis status
docker-compose exec redis redis-cli ping

# Monitor memory usage
docker-compose exec redis redis-cli info memory

# Clear cache if needed
docker-compose exec redis redis-cli flushdb
```

### Payment Processing Issues

#### Razorpay Webhook Failures
**Symptoms**: Payment status not updating, webhook timeouts
**Causes**: Invalid signatures, network issues, server overload

**Debugging Steps**:
```typescript
// Enable webhook debugging
logger.info('Webhook received', {
  headers: req.headers,
  body: req.body,
  signature: req.get('X-Razorpay-Signature')
});

// Verify signature manually
const expectedSignature = crypto
  .createHmac('sha256', config.payment.razorpay.webhookSecret)
  .update(JSON.stringify(req.body))
  .digest('hex');

console.log('Expected:', expectedSignature);
console.log('Received:', req.get('X-Razorpay-Signature'));
```

**Solutions**:
- Verify webhook secret configuration
- Check server response times
- Implement webhook retry mechanism
- Monitor payment logs for patterns

#### Payment Order Creation Failures
**Symptoms**: `400 Bad Request` from Razorpay, invalid amount errors
**Causes**: Incorrect amount format, missing required fields

**Solutions**:
```typescript
// Validate payment request
const validatePaymentAmount = (amount: number): boolean => {
  // Amount must be in paise (INR * 100)
  return Number.isInteger(amount) && amount > 0;
};

// Debug payment creation
logger.debug('Creating payment order', {
  amount: request.amount,
  currency: request.currency,
  orderId: request.orderId
});
```

### Voice Processing Issues

#### TTS Generation Failures
**Symptoms**: Audio not generated, timeout errors, poor quality
**Causes**: External service unavailable, invalid text input, language not supported

**Debugging**:
```typescript
// Test TTS service health
const testTTS = async () => {
  try {
    const result = await TTSService.speak({
      text: 'Test message',
      language: 'hi',
      userId: 'test-user'
    });
    console.log('TTS working:', result.audioUrl);
  } catch (error) {
    console.error('TTS failed:', error);
  }
};
```

**Solutions**:
- Check external TTS service status
- Implement fallback TTS providers
- Validate input text length and characters
- Monitor TTS service quotas

#### Voice Intent Recognition Issues
**Symptoms**: Incorrect intent detection, low confidence scores
**Causes**: Ambiguous voice commands, language mismatch, training data issues

**Solutions**:
```typescript
// Debug intent recognition
const debugIntent = async (text: string, language: string) => {
  const result = await VoiceIntentService.recognizeIntent(text, language);
  
  logger.debug('Intent recognition result', {
    originalText: text,
    detectedIntent: result.intent,
    confidence: result.confidence,
    entities: result.entities,
    language: language
  });
  
  return result;
};
```

### Translation Service Issues

#### BHASHINI API Failures
**Symptoms**: Translation timeouts, API quota exceeded, poor translation quality
**Causes**: Service unavailable, invalid API key, unsupported language pairs

**Solutions**:
```typescript
// Test BHASHINI connectivity
const testBhashini = async () => {
  try {
    const result = await TranslationService.translateText(
      'Hello world',
      'en',
      'hi'
    );
    console.log('BHASHINI working:', result);
  } catch (error) {
    console.error('BHASHINI failed:', error);
    // Try fallback service
    const fallback = await TranslationService.translateWithFallback(
      'Hello world',
      'en', 
      'hi'
    );
    console.log('Fallback result:', fallback);
  }
};
```

### Real-time Features Issues

#### WebSocket Connection Failures
**Symptoms**: Live updates not working, connection drops, subscription errors
**Causes**: Network issues, server overload, client-side problems

**Debugging**:
```typescript
// Monitor WebSocket connections
const wsConnections = new Map();

io.on('connection', (socket) => {
  wsConnections.set(socket.id, {
    connectedAt: new Date(),
    userId: socket.userId,
    subscriptions: []
  });
  
  socket.on('disconnect', (reason) => {
    logger.info('WebSocket disconnected', {
      socketId: socket.id,
      reason,
      duration: Date.now() - wsConnections.get(socket.id).connectedAt
    });
    wsConnections.delete(socket.id);
  });
});
```

#### GraphQL Subscription Issues
**Symptoms**: Subscription not triggering, memory leaks, performance degradation
**Causes**: Subscription not properly cleaned up, too many active subscriptions

**Solutions**:
- Implement subscription cleanup
- Monitor active subscription count
- Add subscription rate limiting
- Use Redis for subscription scaling

### Performance Issues

#### High Memory Usage
**Symptoms**: Out of memory errors, slow response times, container restarts
**Causes**: Memory leaks, large payloads, inefficient caching

**Debugging**:
```bash
# Monitor memory usage
docker stats vyaparmitra_app

# Check Node.js memory
node --inspect src/main.ts

# Analyze heap dump
npm install -g clinic
clinic doctor -- node src/main.ts
```

**Solutions**:
- Implement proper cleanup in services
- Add memory monitoring alerts
- Optimize database queries
- Implement request size limits

#### Slow Database Queries
**Symptoms**: High response times, database timeouts, connection pool exhaustion
**Causes**: Missing indexes, N+1 queries, large result sets

**Solutions**:
```sql
-- Analyze slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE schemaname = 'public' 
AND n_distinct > 100;
```

### Security Issues

#### Authentication Failures
**Symptoms**: JWT validation errors, unauthorized access, token expiration
**Causes**: Invalid tokens, clock skew, compromised secrets

**Debugging**:
```typescript
// Debug JWT issues
const debugJWT = (token: string) => {
  try {
    const decoded = jwt.decode(token, { complete: true });
    console.log('JWT Header:', decoded?.header);
    console.log('JWT Payload:', decoded?.payload);
    
    const verified = jwt.verify(token, config.auth.jwtSecret);
    console.log('JWT Valid:', verified);
  } catch (error) {
    console.error('JWT Error:', error.message);
  }
};
```

#### Rate Limiting Issues
**Symptoms**: Legitimate requests blocked, inconsistent rate limiting
**Causes**: Redis connection issues, incorrect rate limit configuration

**Solutions**:
```typescript
// Debug rate limiting
const debugRateLimit = async (key: string) => {
  const client = getRedisClient();
  const current = await client.get(`rate_limit:${key}`);
  const ttl = await client.ttl(`rate_limit:${key}`);
  
  console.log(`Rate limit for ${key}:`, {
    current: current || 0,
    ttl: ttl,
    limit: rateLimitConfig.max
  });
};
```

## 🔧 Diagnostic Tools

### Health Check Commands
```bash
# Application health
curl -f http://localhost:4000/health

# Detailed health check
curl -f http://localhost:4000/health/detailed

# Voice services health
curl -f http://localhost:4000/api/voice/health

# Database connectivity
npm run migrate:status
```

### Log Analysis
```bash
# View application logs
docker-compose logs -f app

# Search for errors
docker-compose logs app | grep -i error

# Monitor real-time logs
tail -f logs/app.log | jq '.'

# Filter by log level
cat logs/app.log | jq 'select(.level == "error")'
```

### Performance Monitoring
```bash
# Run performance tests
npm run performance:test

# Monitor resource usage
docker stats

# Check database performance
docker-compose exec postgres pg_stat_activity

# Monitor Redis performance
docker-compose exec redis redis-cli --latency-history
```

## 🚨 Emergency Procedures

### Service Recovery
```bash
# Quick service restart
docker-compose restart app

# Full stack restart
docker-compose down && docker-compose up -d

# Database recovery
docker-compose exec postgres pg_ctl restart

# Clear all caches
docker-compose exec redis redis-cli flushall
```

### Rollback Procedures
```bash
# Rollback to previous version
./scripts/deploy-production.sh --rollback

# Manual rollback
git checkout previous-stable-tag
docker-compose build
docker-compose up -d
```

### Data Recovery
```bash
# Restore database from backup
docker-compose exec postgres psql -U user -d dbname < backup.sql

# Restore MongoDB
docker-compose exec mongodb mongorestore --db dbname backup/

# Verify data integrity
npm run test:integration
```

## 📞 Escalation Procedures

### Severity Levels
- **P0 - Critical**: Payment failures, complete service outage
- **P1 - High**: Voice features down, database issues
- **P2 - Medium**: Performance degradation, partial feature issues
- **P3 - Low**: Minor bugs, cosmetic issues

### Contact Information
- **On-call Engineer**: Check team rotation schedule
- **Database Admin**: For critical database issues
- **Security Team**: For security incidents
- **DevOps Team**: For infrastructure issues

### Incident Response
1. **Assess Impact**: Determine severity and affected users
2. **Immediate Action**: Implement temporary fixes if possible
3. **Communication**: Notify stakeholders and users
4. **Investigation**: Root cause analysis
5. **Resolution**: Permanent fix implementation
6. **Post-mortem**: Document lessons learned

This troubleshooting guide provides systematic approaches to diagnosing and resolving common issues in the VyaparMitra platform, ensuring quick recovery and minimal downtime.