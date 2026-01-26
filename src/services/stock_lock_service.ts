import { RedisService } from '../db/redis';
import { getPool } from '../db/postgres';

export interface StockLock {
  productId: string;
  lockedBy: string;
  lockedAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export class StockLockService {
  private static readonly DEFAULT_LOCK_TTL = 300; // 5 minutes in seconds
  private static readonly LOCK_PREFIX = 'stock_lock:';

  static async lockStock(
    productId: string,
    lockerId: string,
    ttlSeconds: number = this.DEFAULT_LOCK_TTL
  ): Promise<boolean> {
    try {
      // Try to acquire lock in Redis (atomic operation)
      const lockAcquired = await RedisService.lockStock(productId, lockerId, ttlSeconds);
      
      if (!lockAcquired) {
        console.log(`❌ Stock lock failed for product ${productId} - already locked`);
        return false;
      }

      // Mirror the lock in PostgreSQL for persistence
      await this.createPostgresLock(productId, lockerId, ttlSeconds);

      console.log(`✅ Stock locked for product ${productId} by ${lockerId}`);
      return true;
    } catch (error) {
      console.error('Failed to lock stock:', error);
      
      // If PostgreSQL fails, release Redis lock
      await RedisService.releaseStock(productId, lockerId);
      return false;
    }
  }

  static async releaseStock(productId: string, lockerId: string): Promise<boolean> {
    try {
      // Release from Redis
      const redisReleased = await RedisService.releaseStock(productId, lockerId);
      
      // Release from PostgreSQL
      const postgresReleased = await this.removePostgresLock(productId, lockerId);

      const success = redisReleased || postgresReleased;
      
      if (success) {
        console.log(`✅ Stock released for product ${productId} by ${lockerId}`);
      } else {
        console.log(`❌ Stock release failed for product ${productId} - not locked by ${lockerId}`);
      }

      return success;
    } catch (error) {
      console.error('Failed to release stock:', error);
      return false;
    }
  }

  static async isStockLocked(productId: string): Promise<boolean> {
    try {
      // Check Redis first (faster)
      const lockKey = `stock_lock:${productId}`;
      return await RedisService.exists(lockKey);
    } catch (error) {
      console.error('Failed to check stock lock status:', error);
      return false;
    }
  }

  static async getStockLock(productId: string): Promise<StockLock | null> {
    try {
      // Get lock info from Redis
      const lockKey = `stock_lock:${productId}`;
      const lockerId = await RedisService.get(lockKey);
      
      if (!lockerId) {
        return null;
      }

      // Get additional details from PostgreSQL
      const pool = getPool();
      const result = await pool.query(
        'SELECT * FROM stock_locks WHERE product_id = $1 AND locked_by = $2',
        [productId, lockerId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        productId: row.product_id,
        lockedBy: row.locked_by,
        lockedAt: row.locked_at,
        expiresAt: row.expires_at,
        isActive: new Date() < row.expires_at,
      };
    } catch (error) {
      console.error('Failed to get stock lock:', error);
      return null;
    }
  }

  static async extendLock(
    productId: string,
    lockerId: string,
    additionalSeconds: number
  ): Promise<boolean> {
    try {
      // Check if lock exists and is owned by the requester
      const currentLock = await this.getStockLock(productId);
      if (!currentLock || currentLock.lockedBy !== lockerId) {
        return false;
      }

      // Extend in Redis
      const lockKey = `stock_lock:${productId}`;
      await RedisService.setWithTTL(lockKey, lockerId, additionalSeconds);

      // Update PostgreSQL
      const pool = getPool();
      const newExpiresAt = new Date(Date.now() + additionalSeconds * 1000);
      
      await pool.query(
        'UPDATE stock_locks SET expires_at = $1 WHERE product_id = $2 AND locked_by = $3',
        [newExpiresAt, productId, lockerId]
      );

      console.log(`✅ Stock lock extended for product ${productId}`);
      return true;
    } catch (error) {
      console.error('Failed to extend stock lock:', error);
      return false;
    }
  }

  static async forceReleaseLock(productId: string): Promise<boolean> {
    try {
      // Force release from Redis
      const lockKey = `stock_lock:${productId}`;
      await RedisService.delete(lockKey);

      // Force release from PostgreSQL
      const pool = getPool();
      await pool.query('DELETE FROM stock_locks WHERE product_id = $1', [productId]);

      console.log(`✅ Stock lock force released for product ${productId}`);
      return true;
    } catch (error) {
      console.error('Failed to force release stock lock:', error);
      return false;
    }
  }

  static async getActiveLocks(lockerId?: string): Promise<StockLock[]> {
    try {
      const pool = getPool();
      let query = 'SELECT * FROM stock_locks WHERE expires_at > NOW()';
      const params: any[] = [];

      if (lockerId) {
        query += ' AND locked_by = $1';
        params.push(lockerId);
      }

      query += ' ORDER BY locked_at DESC';

      const result = await pool.query(query, params);

      return result.rows.map(row => ({
        productId: row.product_id,
        lockedBy: row.locked_by,
        lockedAt: row.locked_at,
        expiresAt: row.expires_at,
        isActive: new Date() < row.expires_at,
      }));
    } catch (error) {
      console.error('Failed to get active locks:', error);
      return [];
    }
  }

  static async cleanupExpiredLocks(): Promise<void> {
    try {
      const pool = getPool();
      
      // Remove expired locks from PostgreSQL
      const result = await pool.query(
        'DELETE FROM stock_locks WHERE expires_at <= NOW() RETURNING product_id'
      );

      // Redis locks expire automatically due to TTL
      // But we can clean up any orphaned keys
      for (const row of result.rows) {
        const lockKey = `stock_lock:${row.product_id}`;
        await RedisService.delete(lockKey);
      }

      if (result.rowCount > 0) {
        console.log(`✅ Cleaned up ${result.rowCount} expired stock locks`);
      }
    } catch (error) {
      console.error('Failed to cleanup expired locks:', error);
    }
  }

  private static async createPostgresLock(
    productId: string,
    lockerId: string,
    ttlSeconds: number
  ): Promise<void> {
    const pool = getPool();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    // Use INSERT ... ON CONFLICT to handle race conditions
    await pool.query(`
      INSERT INTO stock_locks (product_id, locked_by, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (product_id) 
      DO UPDATE SET 
        locked_by = EXCLUDED.locked_by,
        locked_at = CURRENT_TIMESTAMP,
        expires_at = EXCLUDED.expires_at
      WHERE stock_locks.expires_at <= CURRENT_TIMESTAMP
    `, [productId, lockerId, expiresAt]);
  }

  private static async removePostgresLock(productId: string, lockerId: string): Promise<boolean> {
    const pool = getPool();
    const result = await pool.query(
      'DELETE FROM stock_locks WHERE product_id = $1 AND locked_by = $2',
      [productId, lockerId]
    );

    return result.rowCount > 0;
  }

  // Lock analytics
  static async getLockStats(): Promise<{
    activeLocks: number;
    expiredLocks: number;
    averageLockDuration: number;
    topLockers: { lockerId: string; count: number }[];
  }> {
    try {
      const pool = getPool();

      // Get active locks count
      const activeResult = await pool.query(
        'SELECT COUNT(*) as count FROM stock_locks WHERE expires_at > NOW()'
      );

      // Get expired locks count (from last 24 hours)
      const expiredResult = await pool.query(`
        SELECT COUNT(*) as count FROM stock_locks 
        WHERE expires_at <= NOW() AND locked_at >= NOW() - INTERVAL '24 hours'
      `);

      // Get top lockers
      const topLockersResult = await pool.query(`
        SELECT locked_by, COUNT(*) as count 
        FROM stock_locks 
        WHERE locked_at >= NOW() - INTERVAL '24 hours'
        GROUP BY locked_by 
        ORDER BY count DESC 
        LIMIT 10
      `);

      return {
        activeLocks: parseInt(activeResult.rows[0].count),
        expiredLocks: parseInt(expiredResult.rows[0].count),
        averageLockDuration: 0, // Would need more complex query
        topLockers: topLockersResult.rows.map(row => ({
          lockerId: row.locked_by,
          count: parseInt(row.count),
        })),
      };
    } catch (error) {
      console.error('Failed to get lock stats:', error);
      return {
        activeLocks: 0,
        expiredLocks: 0,
        averageLockDuration: 0,
        topLockers: [],
      };
    }
  }
}