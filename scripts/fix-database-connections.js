#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Services that need database connection fixes
const servicesToFix = [
  'src/services/inventory_analytics_service.ts',
  'src/services/market_insights_service.ts', 
  'src/services/price_prediction_service.ts',
  'src/services/recommendation_service.ts',
  'src/services/social_commerce_service.ts'
];

// Fix database connections in all services
servicesToFix.forEach(servicePath => {
  console.log(`Fixing database connections in ${servicePath}...`);
  
  let content = fs.readFileSync(servicePath, 'utf8');
  
  // Replace all pool.connect() with getPool().connect()
  content = content.replace(/const client = await pool\.connect\(\);/g, 
    'const pool = getPool();\n    const client = await pool.connect();');
  
  // Fix Redis cache calls
  content = content.replace(/await redis\.get\(/g, 'await RedisService.get(');
  content = content.replace(/await redis\.setex\(/g, 'await RedisService.setWithTTL(');
  content = content.replace(/await redis\.del\(/g, 'await RedisService.delete(');
  
  // Fix Redis cache variable usage
  content = content.replace(/const redis = getRedisClient\(\);/g, '// Redis handled by RedisService');
  
  fs.writeFileSync(servicePath, content);
  console.log(`✅ Fixed ${servicePath}`);
});

console.log('🎉 All database connections fixed!');