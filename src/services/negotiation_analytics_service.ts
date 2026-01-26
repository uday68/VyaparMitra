import { logger } from '../utils/logger';
import { getPool, pool } from '../db/postgres';
import { getRedisClient, RedisService } from '../db/redis';

interface NegotiationAnalytics {
  totalNegotiations: number;
  successRate: number;
  averageNegotiationTime: number; // in minutes
  averageDiscount: number; // percentage
  topPerformingCategories: Array<{
    category: string;
    successRate: number;
    averageDiscount: number;
    totalVolume: number;
  }>;
  negotiationPatterns: {
    peakHours: Array<{ hour: number; count: number }>;
    preferredLanguages: Array<{ language: string; count: number; successRate: number }>;
    voiceVsText: {
      voice: { count: number; successRate: number; avgTime: number };
      text: { count: number; successRate: number; avgTime: number };
    };
  };
  customerBehavior: {
    averageBidsPerNegotiation: number;
    mostCommonStartingDiscount: number;
    acceptanceThreshold: number;
  };
  vendorPerformance: {
    averageResponseTime: number;
    counterOfferRate: number;
    finalAcceptanceRate: number;
  };
}

interface NegotiationInsight {
  type: 'success_factor' | 'improvement_opportunity' | 'market_trend' | 'behavioral_pattern';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendation?: string;
  metrics: Record<string, number>;
}

export class NegotiationAnalyticsService {
  private static readonly CACHE_TTL = 1800; // 30 minutes
  private static readonly ANALYSIS_PERIOD_DAYS = 90;

  /**
   * Get comprehensive negotiation analytics
   */
  static async getNegotiationAnalytics(
    vendorId?: string,
    customerId?: string,
    category?: string
  ): Promise<NegotiationAnalytics> {
    try {
      const cacheKey = `negotiation_analytics:${vendorId || 'all'}:${customerId || 'all'}:${category || 'all'}`;
      const redis = getRedisClient();
      
      // Check cache first
      const cached = await RedisService.get(cacheKey);
      if (cached) {
        logger.info('Negotiation analytics served from cache', { vendorId, customerId, category });
        return JSON.parse(cached);
      }

      const [
        basicStats,
        categoryPerformance,
        negotiationPatterns,
        customerBehavior,
        vendorPerformance
      ] = await Promise.all([
        this.getBasicNegotiationStats(vendorId, customerId, category),
        this.getCategoryPerformance(vendorId, customerId, category),
        this.getNegotiationPatterns(vendorId, customerId, category),
        this.getCustomerBehavior(vendorId, customerId, category),
        this.getVendorPerformance(vendorId, customerId, category)
      ]);

      const analytics: NegotiationAnalytics = {
        ...basicStats,
        topPerformingCategories: categoryPerformance,
        negotiationPatterns,
        customerBehavior,
        vendorPerformance
      };

      // Cache the result
      await RedisService.setWithTTL(cacheKey, JSON.stringify(analytics), this.CACHE_TTL);
      
      logger.info('Negotiation analytics generated', {
        vendorId,
        customerId,
        category,
        totalNegotiations: analytics.totalNegotiations,
        successRate: analytics.successRate
      });

      return analytics;
    } catch (error) {
      logger.error('Negotiation analytics generation failed', { error, vendorId, customerId, category });
      throw new Error('Failed to generate negotiation analytics');
    }
  }

  /**
   * Get basic negotiation statistics
   */
  private static async getBasicNegotiationStats(
    vendorId?: string,
    customerId?: string,
    category?: string
  ): Promise<{
    totalNegotiations: number;
    successRate: number;
    averageNegotiationTime: number;
    averageDiscount: number;
  }> {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      let whereClause = `WHERE n.created_at >= NOW() - INTERVAL '${this.ANALYSIS_PERIOD_DAYS} days'`;
      const params: any[] = [];
      let paramIndex = 1;

      if (vendorId) {
        whereClause += ` AND p.vendor_id = $${paramIndex}`;
        params.push(vendorId);
        paramIndex++;
      }

      if (customerId) {
        whereClause += ` AND n.user_id = $${paramIndex}`;
        params.push(customerId);
        paramIndex++;
      }

      if (category) {
        whereClause += ` AND n.product_category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      const query = `
        SELECT 
          COUNT(*) as total_negotiations,
          COUNT(CASE WHEN n.status = 'completed' THEN 1 END) as successful_negotiations,
          AVG(CASE WHEN n.status = 'completed' THEN EXTRACT(EPOCH FROM (n.updated_at - n.created_at))/60 END) as avg_time_minutes,
          AVG(CASE WHEN n.status = 'completed' THEN ((p.price - n.final_price) / p.price * 100) END) as avg_discount_percent
        FROM negotiations n
        JOIN products p ON n.product_id = p.id
        ${whereClause}
      `;
      
      const result = await client.query(query, params);
      const row = result.rows[0];
      
      const totalNegotiations = parseInt(row.total_negotiations || '0');
      const successfulNegotiations = parseInt(row.successful_negotiations || '0');
      
      return {
        totalNegotiations,
        successRate: totalNegotiations > 0 ? (successfulNegotiations / totalNegotiations) * 100 : 0,
        averageNegotiationTime: parseFloat(row.avg_time_minutes || '0'),
        averageDiscount: parseFloat(row.avg_discount_percent || '0')
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get category performance analysis
   */
  private static async getCategoryPerformance(
    vendorId?: string,
    customerId?: string,
    category?: string
  ): Promise<Array<{
    category: string;
    successRate: number;
    averageDiscount: number;
    totalVolume: number;
  }>> {
    const client = await pool.connect();
    
    try {
      let whereClause = `WHERE n.created_at >= NOW() - INTERVAL '${this.ANALYSIS_PERIOD_DAYS} days'`;
      const params: any[] = [];
      let paramIndex = 1;

      if (vendorId) {
        whereClause += ` AND p.vendor_id = $${paramIndex}`;
        params.push(vendorId);
        paramIndex++;
      }

      if (customerId) {
        whereClause += ` AND n.user_id = $${paramIndex}`;
        params.push(customerId);
        paramIndex++;
      }

      if (category) {
        whereClause += ` AND n.product_category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      const query = `
        SELECT 
          n.product_category as category,
          COUNT(*) as total_volume,
          COUNT(CASE WHEN n.status = 'completed' THEN 1 END) as successful_count,
          AVG(CASE WHEN n.status = 'completed' THEN ((p.price - n.final_price) / p.price * 100) END) as avg_discount
        FROM negotiations n
        JOIN products p ON n.product_id = p.id
        ${whereClause}
        GROUP BY n.product_category
        HAVING COUNT(*) >= 5
        ORDER BY successful_count DESC
        LIMIT 10
      `;
      
      const result = await client.query(query, params);
      
      return result.rows.map(row => ({
        category: row.category,
        successRate: (parseInt(row.successful_count) / parseInt(row.total_volume)) * 100,
        averageDiscount: parseFloat(row.avg_discount || '0'),
        totalVolume: parseInt(row.total_volume)
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Analyze negotiation patterns
   */
  private static async getNegotiationPatterns(
    vendorId?: string,
    customerId?: string,
    category?: string
  ): Promise<{
    peakHours: Array<{ hour: number; count: number }>;
    preferredLanguages: Array<{ language: string; count: number; successRate: number }>;
    voiceVsText: {
      voice: { count: number; successRate: number; avgTime: number };
      text: { count: number; successRate: number; avgTime: number };
    };
  }> {
    const client = await pool.connect();
    
    try {
      let whereClause = `WHERE n.created_at >= NOW() - INTERVAL '${this.ANALYSIS_PERIOD_DAYS} days'`;
      const params: any[] = [];
      let paramIndex = 1;

      if (vendorId) {
        whereClause += ` AND p.vendor_id = $${paramIndex}`;
        params.push(vendorId);
        paramIndex++;
      }

      if (customerId) {
        whereClause += ` AND n.user_id = $${paramIndex}`;
        params.push(customerId);
        paramIndex++;
      }

      if (category) {
        whereClause += ` AND n.product_category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      // Peak hours analysis
      const peakHoursQuery = `
        SELECT 
          EXTRACT(HOUR FROM n.created_at) as hour,
          COUNT(*) as count
        FROM negotiations n
        JOIN products p ON n.product_id = p.id
        ${whereClause}
        GROUP BY EXTRACT(HOUR FROM n.created_at)
        ORDER BY hour
      `;
      
      const peakHoursResult = await client.query(peakHoursQuery, params);
      const peakHours = peakHoursResult.rows.map(row => ({
        hour: parseInt(row.hour),
        count: parseInt(row.count)
      }));

      // Language preferences analysis
      const languageQuery = `
        SELECT 
          COALESCE(n.language, 'en') as language,
          COUNT(*) as count,
          COUNT(CASE WHEN n.status = 'completed' THEN 1 END) as successful_count
        FROM negotiations n
        JOIN products p ON n.product_id = p.id
        ${whereClause}
        GROUP BY COALESCE(n.language, 'en')
        ORDER BY count DESC
      `;
      
      const languageResult = await client.query(languageQuery, params);
      const preferredLanguages = languageResult.rows.map(row => ({
        language: row.language,
        count: parseInt(row.count),
        successRate: (parseInt(row.successful_count) / parseInt(row.count)) * 100
      }));

      // Voice vs Text analysis
      const voiceTextQuery = `
        SELECT 
          CASE WHEN n.is_voice_enabled = true THEN 'voice' ELSE 'text' END as interaction_type,
          COUNT(*) as count,
          COUNT(CASE WHEN n.status = 'completed' THEN 1 END) as successful_count,
          AVG(CASE WHEN n.status = 'completed' THEN EXTRACT(EPOCH FROM (n.updated_at - n.created_at))/60 END) as avg_time
        FROM negotiations n
        JOIN products p ON n.product_id = p.id
        ${whereClause}
        GROUP BY CASE WHEN n.is_voice_enabled = true THEN 'voice' ELSE 'text' END
      `;
      
      const voiceTextResult = await client.query(voiceTextQuery, params);
      
      const voiceData = voiceTextResult.rows.find(row => row.interaction_type === 'voice') || 
        { count: '0', successful_count: '0', avg_time: '0' };
      const textData = voiceTextResult.rows.find(row => row.interaction_type === 'text') || 
        { count: '0', successful_count: '0', avg_time: '0' };

      const voiceVsText = {
        voice: {
          count: parseInt(voiceData.count),
          successRate: parseInt(voiceData.count) > 0 ? (parseInt(voiceData.successful_count) / parseInt(voiceData.count)) * 100 : 0,
          avgTime: parseFloat(voiceData.avg_time || '0')
        },
        text: {
          count: parseInt(textData.count),
          successRate: parseInt(textData.count) > 0 ? (parseInt(textData.successful_count) / parseInt(textData.count)) * 100 : 0,
          avgTime: parseFloat(textData.avg_time || '0')
        }
      };

      return {
        peakHours,
        preferredLanguages,
        voiceVsText
      };
    } finally {
      client.release();
    }
  }

  /**
   * Analyze customer behavior patterns
   */
  private static async getCustomerBehavior(
    vendorId?: string,
    customerId?: string,
    category?: string
  ): Promise<{
    averageBidsPerNegotiation: number;
    mostCommonStartingDiscount: number;
    acceptanceThreshold: number;
  }> {
    const client = await pool.connect();
    
    try {
      let whereClause = `WHERE n.created_at >= NOW() - INTERVAL '${this.ANALYSIS_PERIOD_DAYS} days'`;
      const params: any[] = [];
      let paramIndex = 1;

      if (vendorId) {
        whereClause += ` AND p.vendor_id = $${paramIndex}`;
        params.push(vendorId);
        paramIndex++;
      }

      if (customerId) {
        whereClause += ` AND n.user_id = $${paramIndex}`;
        params.push(customerId);
        paramIndex++;
      }

      if (category) {
        whereClause += ` AND n.product_category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      const query = `
        SELECT 
          AVG(bid_count) as avg_bids_per_negotiation,
          AVG(starting_discount) as avg_starting_discount,
          AVG(CASE WHEN n.status = 'completed' THEN final_discount END) as avg_acceptance_threshold
        FROM (
          SELECT 
            n.id,
            n.status,
            COUNT(b.id) as bid_count,
            ((p.price - b.amount) / p.price * 100) as starting_discount,
            CASE WHEN n.status = 'completed' THEN ((p.price - n.final_price) / p.price * 100) END as final_discount
          FROM negotiations n
          JOIN products p ON n.product_id = p.id
          LEFT JOIN bids b ON n.id = b.negotiation_id
          ${whereClause}
          GROUP BY n.id, n.status, p.price, n.final_price
          HAVING COUNT(b.id) > 0
        ) negotiation_stats
      `;
      
      const result = await client.query(query, params);
      const row = result.rows[0];
      
      return {
        averageBidsPerNegotiation: parseFloat(row.avg_bids_per_negotiation || '0'),
        mostCommonStartingDiscount: parseFloat(row.avg_starting_discount || '0'),
        acceptanceThreshold: parseFloat(row.avg_acceptance_threshold || '0')
      };
    } finally {
      client.release();
    }
  }

  /**
   * Analyze vendor performance patterns
   */
  private static async getVendorPerformance(
    vendorId?: string,
    customerId?: string,
    category?: string
  ): Promise<{
    averageResponseTime: number;
    counterOfferRate: number;
    finalAcceptanceRate: number;
  }> {
    const client = await pool.connect();
    
    try {
      let whereClause = `WHERE n.created_at >= NOW() - INTERVAL '${this.ANALYSIS_PERIOD_DAYS} days'`;
      const params: any[] = [];
      let paramIndex = 1;

      if (vendorId) {
        whereClause += ` AND p.vendor_id = $${paramIndex}`;
        params.push(vendorId);
        paramIndex++;
      }

      if (customerId) {
        whereClause += ` AND n.user_id = $${paramIndex}`;
        params.push(customerId);
        paramIndex++;
      }

      if (category) {
        whereClause += ` AND n.product_category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      const query = `
        SELECT 
          AVG(EXTRACT(EPOCH FROM (first_vendor_response - n.created_at))/60) as avg_response_time_minutes,
          COUNT(CASE WHEN vendor_counter_offers > 0 THEN 1 END) * 100.0 / COUNT(*) as counter_offer_rate,
          COUNT(CASE WHEN n.status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as final_acceptance_rate
        FROM (
          SELECT 
            n.id,
            n.created_at,
            n.status,
            MIN(CASE WHEN b.bid_type = 'vendor_counter' THEN b.created_at END) as first_vendor_response,
            COUNT(CASE WHEN b.bid_type = 'vendor_counter' THEN 1 END) as vendor_counter_offers
          FROM negotiations n
          JOIN products p ON n.product_id = p.id
          LEFT JOIN bids b ON n.id = b.negotiation_id
          ${whereClause}
          GROUP BY n.id, n.created_at, n.status
        ) vendor_stats
      `;
      
      const result = await client.query(query, params);
      const row = result.rows[0];
      
      return {
        averageResponseTime: parseFloat(row.avg_response_time_minutes || '0'),
        counterOfferRate: parseFloat(row.counter_offer_rate || '0'),
        finalAcceptanceRate: parseFloat(row.final_acceptance_rate || '0')
      };
    } finally {
      client.release();
    }
  }

  /**
   * Generate negotiation insights based on analytics
   */
  static async generateNegotiationInsights(
    vendorId?: string,
    customerId?: string,
    category?: string
  ): Promise<NegotiationInsight[]> {
    try {
      const analytics = await this.getNegotiationAnalytics(vendorId, customerId, category);
      const insights: NegotiationInsight[] = [];

      // Success rate insights
      if (analytics.successRate > 80) {
        insights.push({
          type: 'success_factor',
          title: 'High Success Rate',
          description: `Your negotiation success rate of ${analytics.successRate.toFixed(1)}% is excellent`,
          impact: 'high',
          actionable: true,
          recommendation: 'Maintain current negotiation strategies and consider sharing best practices',
          metrics: { successRate: analytics.successRate }
        });
      } else if (analytics.successRate < 50) {
        insights.push({
          type: 'improvement_opportunity',
          title: 'Low Success Rate',
          description: `Your negotiation success rate of ${analytics.successRate.toFixed(1)}% needs improvement`,
          impact: 'high',
          actionable: true,
          recommendation: 'Review pricing strategy and consider more flexible negotiation approaches',
          metrics: { successRate: analytics.successRate }
        });
      }

      // Voice vs Text insights
      const { voice, text } = analytics.negotiationPatterns.voiceVsText;
      if (voice.count > 0 && text.count > 0) {
        if (voice.successRate > text.successRate + 10) {
          insights.push({
            type: 'behavioral_pattern',
            title: 'Voice Negotiations More Successful',
            description: `Voice negotiations have ${voice.successRate.toFixed(1)}% success rate vs ${text.successRate.toFixed(1)}% for text`,
            impact: 'medium',
            actionable: true,
            recommendation: 'Encourage customers to use voice features for better outcomes',
            metrics: { voiceSuccessRate: voice.successRate, textSuccessRate: text.successRate }
          });
        }
      }

      return insights.sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      });
    } catch (error) {
      logger.error('Negotiation insights generation failed', { error, vendorId, customerId, category });
      throw new Error('Failed to generate negotiation insights');
    }
  }
}