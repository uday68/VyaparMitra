import { getPool } from '../db/postgres';
import { getRedisClient } from '../db/redis';
import mongoose from 'mongoose';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    postgres: 'connected' | 'disconnected' | 'error';
    mongodb: 'connected' | 'disconnected' | 'error';
    redis: 'connected' | 'disconnected' | 'error';
  };
  version: string;
  uptime: number;
}

export class HealthService {
  static async checkHealth(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const version = process.env.npm_package_version || '1.0.0';
    const uptime = process.uptime();

    const services = {
      postgres: await this.checkPostgreSQL(),
      mongodb: await this.checkMongoDB(),
      redis: await this.checkRedis(),
    };

    const allHealthy = Object.values(services).every(status => status === 'connected');
    
    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp,
      services,
      version,
      uptime,
    };
  }

  private static async checkPostgreSQL(): Promise<'connected' | 'disconnected' | 'error'> {
    try {
      const pool = getPool();
      await pool.query('SELECT 1');
      return 'connected';
    } catch (error) {
      console.error('PostgreSQL health check failed:', error);
      return 'error';
    }
  }

  private static async checkMongoDB(): Promise<'connected' | 'disconnected' | 'error'> {
    try {
      if (mongoose.connection.readyState === 1) {
        return 'connected';
      } else {
        return 'disconnected';
      }
    } catch (error) {
      console.error('MongoDB health check failed:', error);
      return 'error';
    }
  }

  private static async checkRedis(): Promise<'connected' | 'disconnected' | 'error'> {
    try {
      const client = getRedisClient();
      await client.ping();
      return 'connected';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return 'error';
    }
  }
}