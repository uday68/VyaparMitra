import { logger } from './logger';

/**
 * Wrapper for analytics functions to handle database errors gracefully
 */
export class AnalyticsErrorHandler {
  /**
   * Wraps an analytics function to handle table missing errors
   */
  static async safeExecute<T>(
    operation: () => Promise<T>,
    defaultValue: T,
    operationName: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      // Check if it's a table missing error (42P01)
      if (error.code === '42P01') {
        logger.warn(`Analytics operation failed due to missing table: ${operationName}`, {
          error: error.message,
          code: error.code
        });
        return defaultValue;
      }
      
      // Check if it's a column missing error
      if (error.code === '42703') {
        logger.warn(`Analytics operation failed due to missing column: ${operationName}`, {
          error: error.message,
          code: error.code
        });
        return defaultValue;
      }
      
      // Check if it's a UUID type mismatch error (42883)
      if (error.code === '42883' && error.message.includes('operator does not exist')) {
        logger.warn(`Analytics operation failed due to type mismatch: ${operationName}`, {
          error: error.message,
          code: error.code,
          hint: 'UUID type casting may be needed'
        });
        return defaultValue;
      }
      
      // Log other errors but still return default value to prevent crashes
      logger.error(`Analytics operation failed: ${operationName}`, {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      
      return defaultValue;
    }
  }

  /**
   * Check if required tables exist before running analytics
   */
  static async checkTablesExist(pool: any, tables: string[]): Promise<boolean> {
    try {
      const tableChecks = tables.map(table => 
        `(SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table}')) as ${table}_exists`
      ).join(', ');
      
      const query = `SELECT ${tableChecks};`;
      const result = await pool.query(query);
      
      const missingTables = tables.filter(table => !result.rows[0][`${table}_exists`]);
      
      if (missingTables.length > 0) {
        logger.warn('Missing required tables for analytics', { missingTables });
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to check table existence', { error });
      return false;
    }
  }

  /**
   * Get default analytics response when tables are missing
   */
  static getDefaultInventoryAnalytics() {
    return {
      totalProducts: 0,
      totalValue: 0,
      lowStockAlerts: 0,
      fastMovingItems: [],
      slowMovingItems: [],
      categoryPerformance: [],
      reorderRecommendations: []
    };
  }

  /**
   * Get default negotiation analytics response when tables are missing
   */
  static getDefaultNegotiationAnalytics() {
    return {
      totalNegotiations: 0,
      successRate: 0,
      averageNegotiationTime: 0,
      averageDiscount: 0,
      topPerformingCategories: [],
      negotiationPatterns: {
        peakHours: [],
        preferredLanguages: [],
        voiceVsText: {
          voice: { count: 0, successRate: 0, avgTime: 0 },
          text: { count: 0, successRate: 0, avgTime: 0 }
        }
      },
      customerBehavior: {
        averageBidsPerNegotiation: 0,
        mostCommonStartingDiscount: 0,
        acceptanceThreshold: 0
      },
      vendorPerformance: {
        averageResponseTime: 0,
        counterOfferRate: 0,
        finalAcceptanceRate: 0
      }
    };
  }
}