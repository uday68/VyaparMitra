#!/usr/bin/env node

/**
 * Development utility to reset rate limits
 * Usage: node scripts/reset-rate-limits.js [ip-address]
 */

const redis = require('redis');

async function resetRateLimits(ipAddress = null) {
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  try {
    await client.connect();
    console.log('Connected to Redis');

    // Rate limit prefixes used in the application
    const prefixes = [
      'rate_limit:auth',
      'rate_limit:general',
      'rate_limit:voice',
      'rate_limit:upload',
      'rate_limit:negotiation',
      'rate_limit:payment',
      'rate_limit:translation'
    ];

    if (ipAddress) {
      // Reset for specific IP
      console.log(`Resetting rate limits for IP: ${ipAddress}`);
      for (const prefix of prefixes) {
        const key = `${prefix}:${ipAddress}`;
        await client.del(key);
        console.log(`Cleared: ${key}`);
      }
    } else {
      // Reset all rate limits (development only!)
      console.log('Resetting ALL rate limits...');
      for (const prefix of prefixes) {
        const keys = await client.keys(`${prefix}:*`);
        if (keys.length > 0) {
          await client.del(keys);
          console.log(`Cleared ${keys.length} keys for prefix: ${prefix}`);
        }
      }
    }

    console.log('Rate limits reset successfully!');
  } catch (error) {
    console.error('Error resetting rate limits:', error);
  } finally {
    await client.quit();
  }
}

// Get IP address from command line argument
const ipAddress = process.argv[2];

if (process.env.NODE_ENV === 'production') {
  console.error('This script should not be run in production!');
  process.exit(1);
}

resetRateLimits(ipAddress);