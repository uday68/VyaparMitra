import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { redis } from '../db/redis';
import { pool } from '../db/postgres';
import { logger } from '../utils/logger';

export enum VoiceWorkflowState {
  IDLE = 'idle',
  PHOTO_CAPTURE = 'photo_capture',
  PHOTO_CONFIRMATION = 'photo_confirmation',
  QUANTITY_INPUT = 'quantity_input',
  QUANTITY_CONFIRMATION = 'quantity_confirmation',
  PRICE_INPUT = 'price_input',
  PRICE_CONFIRMATION = 'price_confirmation',
  COMPLETION = 'completion'
}

export interface VoiceProductWorkflow {
  sessionId: string;
  userId: string;
  language: string;
  state: VoiceWorkflowState;
  data: {
    photo?: string;
    quantity?: number;
    price?: number;
    productName?: string;
    unit?: string;
    category?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface VoiceWorkflowRedisData {
  sessionId: string;
  userId: string;
  language: string;
  state: VoiceWorkflowState;
  data: {
    photo?: string;
    quantity?: number;
    price?: number;
    productName?: string;
    unit?: string;
    category?: string;
  };
  createdAt: string;
  expiresAt: string;
}

export class VoiceWorkflowService {
  private static readonly SESSION_TTL = 300; // 5 minutes in seconds
  private static readonly REDIS_KEY_PREFIX = 'voice_workflow:';

  /**
   * Create a new voice workflow session
   */
  static async createWorkflowSession(
    userId: string,
    language: string
  ): Promise<VoiceProductWorkflow> {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_TTL * 1000);

    const workflow: VoiceProductWorkflow = {
      sessionId,
      userId,
      language,
      state: VoiceWorkflowState.PHOTO_CAPTURE,
      data: {},
      createdAt: now,
      updatedAt: now,
      expiresAt
    };

    // Store in Redis for temporary session data
    const redisData: VoiceWorkflowRedisData = {
      sessionId,
      userId,
      language,
      state: workflow.state,
      data: workflow.data,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    const redisKey = `${this.REDIS_KEY_PREFIX}${sessionId}`;
    await redis.setex(redisKey, this.SESSION_TTL, JSON.stringify(redisData));

    // Store in PostgreSQL for audit trail
    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO voice_workflow_sessions (
          session_id, user_id, language, initial_state, workflow_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [sessionId, userId, language, workflow.state, JSON.stringify(workflow.data), now]);
    } finally {
      client.release();
    }

    logger.info('Voice workflow session created', {
      sessionId,
      userId,
      language,
      state: workflow.state
    });

    return workflow;
  }

  /**
   * Update workflow state and data
   */
  static async updateWorkflowState(
    sessionId: string,
    newState: VoiceWorkflowState,
    data?: Partial<VoiceProductWorkflow['data']>
  ): Promise<VoiceProductWorkflow> {
    const redisKey = `${this.REDIS_KEY_PREFIX}${sessionId}`;
    const existingData = await redis.get(redisKey);

    if (!existingData) {
      throw new Error(`Voice workflow session not found: ${sessionId}`);
    }

    const workflow: VoiceWorkflowRedisData = JSON.parse(existingData);
    const now = new Date();

    // Update workflow data
    workflow.state = newState;
    if (data) {
      workflow.data = { ...workflow.data, ...data };
    }

    // Reset TTL to extend session
    await redis.setex(redisKey, this.SESSION_TTL, JSON.stringify(workflow));

    // Update PostgreSQL audit record
    const client = await pool.connect();
    try {
      await client.query(`
        UPDATE voice_workflow_sessions 
        SET final_state = $1, workflow_data = $2, updated_at = $3
        WHERE session_id = $4
      `, [newState, JSON.stringify(workflow.data), now, sessionId]);
    } finally {
      client.release();
    }

    logger.info('Voice workflow state updated', {
      sessionId,
      newState,
      data: workflow.data
    });

    return {
      sessionId: workflow.sessionId,
      userId: workflow.userId,
      language: workflow.language,
      state: workflow.state,
      data: workflow.data,
      createdAt: new Date(workflow.createdAt),
      updatedAt: now,
      expiresAt: new Date(workflow.expiresAt)
    };
  }

  /**
   * Get workflow session by ID
   */
  static async getWorkflowSession(sessionId: string): Promise<VoiceProductWorkflow | null> {
    const redisKey = `${this.REDIS_KEY_PREFIX}${sessionId}`;
    const data = await redis.get(redisKey);

    if (!data) {
      logger.debug('Voice workflow session not found in Redis', { sessionId });
      return null;
    }

    const workflow: VoiceWorkflowRedisData = JSON.parse(data);

    return {
      sessionId: workflow.sessionId,
      userId: workflow.userId,
      language: workflow.language,
      state: workflow.state,
      data: workflow.data,
      createdAt: new Date(workflow.createdAt),
      updatedAt: new Date(), // Current time as we don't track updates in Redis
      expiresAt: new Date(workflow.expiresAt)
    };
  }

  /**
   * Complete workflow and clean up session
   */
  static async completeWorkflow(sessionId: string): Promise<boolean> {
    const workflow = await this.getWorkflowSession(sessionId);
    if (!workflow) {
      return false;
    }

    // Update final state in PostgreSQL
    const client = await pool.connect();
    try {
      await client.query(`
        UPDATE voice_workflow_sessions 
        SET final_state = $1, completed = true, completed_at = $2,
            duration_seconds = EXTRACT(EPOCH FROM ($2 - created_at))
        WHERE session_id = $3
      `, [VoiceWorkflowState.COMPLETION, new Date(), sessionId]);
    } finally {
      client.release();
    }

    // Remove from Redis
    const redisKey = `${this.REDIS_KEY_PREFIX}${sessionId}`;
    await redis.del(redisKey);

    logger.info('Voice workflow completed', {
      sessionId,
      userId: workflow.userId,
      finalData: workflow.data
    });

    return true;
  }

  /**
   * Clean up expired sessions (called by background job)
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const pattern = `${this.REDIS_KEY_PREFIX}*`;
    const keys = await redis.keys(pattern);
    let cleanedCount = 0;

    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl <= 0) {
        await redis.del(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleaned up expired voice workflow sessions', { count: cleanedCount });
    }

    return cleanedCount;
  }

  /**
   * Get all active sessions for a user
   */
  static async getUserActiveSessions(userId: string): Promise<VoiceProductWorkflow[]> {
    const pattern = `${this.REDIS_KEY_PREFIX}*`;
    const keys = await redis.keys(pattern);
    const sessions: VoiceProductWorkflow[] = [];

    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const workflow: VoiceWorkflowRedisData = JSON.parse(data);
        if (workflow.userId === userId) {
          sessions.push({
            sessionId: workflow.sessionId,
            userId: workflow.userId,
            language: workflow.language,
            state: workflow.state,
            data: workflow.data,
            createdAt: new Date(workflow.createdAt),
            updatedAt: new Date(),
            expiresAt: new Date(workflow.expiresAt)
          });
        }
      }
    }

    return sessions;
  }

  /**
   * Health check for the service
   */
  static async isHealthy(): Promise<boolean> {
    try {
      // Test Redis connection
      await redis.ping();
      
      // Test PostgreSQL connection
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
      } finally {
        client.release();
      }

      return true;
    } catch (error) {
      logger.error('Voice workflow service health check failed', { error });
      return false;
    }
  }
}