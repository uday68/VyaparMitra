import { logger } from '../utils/logger';
import { pool } from '../db/postgres';
import { getRedisClient } from '../db/redis';

interface NegotiationAnalytics {
  totalNegotiations: number;
  successRate: number;
  averageNegotiationTime: number; // in minutes
  averageDiscount: number; // percentage
  totalRevenue: number;
  conversionRate: number;
  topPerformingCategories: Array<{
    category: string;
    successRate: number;
    averageDiscount: number;
    totalNegotiations: number;
  }>;
  negotiationPatterns: {
    peakHours: Array<{ hour: number; count: number }>;
    averageBidsPerNegotiation: number;
    mostCommonOutcome: 'accepted' | 'rejected' | 'counter_offered';
  };
  customerBehavior: {
    averageInitialOffer: number; // percentage of asking price
    priceFlexibility: number; // how much customers typically move from initial offer
    negotiationStyle: 'aggressive' | 'moderate' | 'conservative';
  };
  vendorPerformance: {
    responseTime: number; // average response time in minutes
    acceptanceRate: number;
    profitMargin: number;
  };
}

interface NegotiationInsight {
  type: 'success_factor' | 'improvement_opportunity' | 'market_trend' | 'customer_preference';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendation: string;
  metrics: Record<string, number>;
}

interface VoiceNegotiationAnalytics {
  voiceUsageRate: number;
  voiceSuccessRate: number;
  averageVoiceNegotiationTime: number;
  languagePreferences: Array<{
    language: string;
    usage: number;
    successRate: number;
  }>;
  voiceCommandEffectiveness: Array<{
    command: string;
    frequency: number;
    successRate: number;
  }>;
  speechPatternAnalysis: {
    averageWordsPerMessage: number;
    sentimentDistribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
    urgencyIndicators: Array<{
      indicator: string;
      frequency: number;
      impact: number;
    }>;
  };
}

interface NegotiationForecast {
  timeframe: '7d' | '30d' | '90d';
  predictedNegotiations: number;
  expectedSuccessRate: number;
  projectedRevenue: number;
  seasonalFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  recommendations: string[];
}

export class NegotiationAnalyticsService {
  private static readonly CACHE_TTL = 1800; // 30 minutes
  private static readonly ANALYSIS_PERIOD_DAYS = 90;

  /**
   * Get comprehensive negotiation analytics for a vendor
   */
  static async getNegotiationAnalytics(vendorId: string, period: number = 90): Promise<NegotiationAnalytics> {
    try {
      const cacheKey = `negotiation_analytics:${vendorId}:${period}`;
      const redis = getRedisClient();
      
      // Check cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info('Negotiation analytics served from cache', { vendorId });
        return JSON.parse(cached);
      }

      const [
        basicStats,
        categoryPerformance,
        negotiationPatterns,
        customerBehavior,
        vendorPerformance
      ] = await Promise.all([
        this.getBasicNegotiationStats(vendorId, period),
        this.getCategoryPerformance(vendorId, period),
        this.getNegotiationPatterns(vendorId, period),
        this.getCustomerBehavior(vendorId, period),
        this.getVendorPerformance(vendorId, period)
      ]);

      const analytics: NegotiationAnalytics = {
        ...basicStats,
        topPerformingCategories: categoryPerformance,
        negotiationPatterns,
        customerBehavior,
        vendorPerformance
      };

      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(analytics));
      
      logger.info('Negotiation analytics generated', {
        vendorId,
        totalNegotiations: analytics.totalNegotiations,
        successRate: analytics.successRate
      });

      return analytics;
    } catch (error) {
      logger.error('Negotiation analytics generation failed', { error, vendorId });
      throw new Error('Failed to generate negotiation analytics');
    }
  }

  /**
   * Get basic negotiation statistics
   */
  private static async getBasicNegotiationStats(vendorId: string, period: number): Promise<{
    totalNegotiations: number;
    successRate: number;
    averageNegotiationTime: number;
    averageDiscount: number;
    totalRevenue: number;
    conversionRate: number;
  }> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          COUNT(*) as total_negotiations,
          COUNT(CASE WHEN n.status = 'completed' THEN 1 END) as successful_negotiations,
          AVG(EXTRACT(EPOCH FROM (n.updated_at - n.created_at)) / 60) as avg_negotiation_time,
          AVG(CASE 
            WHEN n.status = 'completed' AND p.price > 0 
            THEN ((p.price - n.final_price) / p.price) * 100 
            ELSE 0 
          END) as avg_discount,
          SUM(CASE WHEN n.status = 'completed' THEN n.final_price ELSE 0 END) as total_revenue,
          COUNT(CASE WHEN n.status = 'completed' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as success_rate
        FROM negotiations n
        JOIN products p ON n.product_id = p.id
        WHERE p.vendor_id = $1
        AND n.created_at >= NOW() - INTERVAL '${period} days'
      `;
      
      const result = await client.query(query, [vendorId]);
      const row = result.rows[0];
      
      // Get conversion rate (negotiations to actual orders)
      const conversionQuery = `
        SELECT 
          COUNT(DISTINCT n.id) as negotiations_with_orders,
          COUNT(DISTINCT o.id) as total_orders
        FROM negotiations n
        JOIN products p ON n.product_id = p.id
        LEFT JOIN orders o ON n.id = o.negotiation_id
        WHERE p.vendor_id = $1
        AND n.created_at >= NOW() - INTERVAL '${period} days'
        AND n.status = 'completed'
      `;
      
      const conversionResult = await client.query(conversionQuery, [vendorId]);
      const conversionRow = conversionResult.rows[0];
      
      const conversionRate = conversionRow.negotiations_with_orders > 0 
        ? (conversionRow.total_orders / conversionRow.negotiations_with_orders) * 100 
        : 0;
      
      return {
        totalNegotiations: parseInt(row.total_negotiations || '0'),
        successRate: parseFloat(row.success_rate || '0'),
        averageNegotiationTime: parseFloat(row.avg_negotiation_time || '0'),
        averageDiscount: parseFloat(row.avg_discount || '0'),
        totalRevenue: parseFloat(row.total_revenue || '0'),
        conversionRate: parseFloat(conversionRate.toFixed(2))
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get category-wise performance
   */
  private static async getCategoryPerformance(vendorId: string, period: number): Promise<Array<{
    category: string;
    successRate: number;
    averageDiscount: number;
    totalNegotiations: number;
  }>> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          p.category,
          COUNT(*) as total_negotiations,
          COUNT(CASE WHEN n.status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as success_rate,
          AVG(CASE 
            WHEN n.status = 'completed' AND p.price > 0 
            THEN ((p.price - n.final_price) / p.price) * 100 
            ELSE 0 
          END) as avg_discount
        FROM negotiations n
        JOIN products p ON n.product_id = p.id
        WHERE p.vendor_id = $1
        AND n.created_at >= NOW() - INTERVAL '${period} days'
        GROUP BY p.category
        HAVING COUNT(*) >= 3
        ORDER BY success_rate DESC
      `;
      
      const result = await client.query(query, [vendorId]);
      
      return result.rows.map(row => ({
        category: row.category,
        successRate: parseFloat(row.success_rate || '0'),
        averageDiscount: parseFloat(row.avg_discount || '0'),
        totalNegotiations: parseInt(row.total_negotiations)
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Analyze negotiation patterns
   */
  private static async getNegotiationPatterns(vendorId: string, period: number): Promise<{
    peakHours: Array<{ hour: number; count: number }>;
    averageBidsPerNegotiation: number;
    mostCommonOutcome: 'accepted' | 'rejected' | 'counter_offered';
  }> {
    const client = await pool.connect();
    
    try {
      // Peak hours analysis
      const peakHoursQuery = `
        SELECT 
          EXTRACT(HOUR FROM n.created_at) as hour,
          COUNT(*) as count
        FROM negotiations n
        JOIN products p ON n.product_id = p.id
        WHERE p.vendor_id = $1
        AND n.created_at >= NOW() - INTERVAL '${period} days'
        GROUP BY EXTRACT(HOUR FROM n.created_at)
        ORDER BY hour
      `;
      
      const peakHoursResult = await client.query(peakHoursQuery, [vendorId]);
      const peakHours = peakHoursResult.rows.map(row => ({
        hour: parseInt(row.hour),
        count: parseInt(row.count)
      }));
      
      // Average bids per negotiation
      const bidsQuery = `
        SELECT 
          AVG(bid_count) as avg_bids
        FROM (
          SELECT 
            n.id,
            COUNT(b.id) as bid_count
          FROM negotiations n
          JOIN products p ON n.product_id = p.id
          LEFT JOIN bids b ON n.id = b.negotiation_id
          WHERE p.vendor_id = $1
          AND n.created_at >= NOW() - INTERVAL '${period} days'
          GROUP BY n.id
        ) bid_counts
      `;
      
      const bidsResult = await client.query(bidsQuery, [vendorId]);
      const averageBidsPerNegotiation = parseFloat(bidsResult.rows[0]?.avg_bids || '0');
      
      // Most common outcome
      const outcomeQuery = `
        SELECT 
          n.status,
          COUNT(*) as count
        FROM negotiations n
        JOIN products p ON n.product_id = p.id
        WHERE p.vendor_id = $1
        AND n.created_at >= NOW() - INTERVAL '${period} days'
        GROUP BY n.status
        ORDER BY count DESC
        LIMIT 1
      `;
      
      const outcomeResult = await client.query(outcomeQuery, [vendorId]);
      const mostCommonOutcome = outcomeResult.rows[0]?.status || 'rejected';
      
      return {
        peakHours,
        averageBidsPerNegotiation,
        mostCommonOutcome: mostCommonOutcome as 'accepted' | 'rejected' | 'counter_offered'
      };
    } finally {
      client.release();
    }
  }

  /**
   * Analyze customer behavior patterns
   */
  private static async getCustomerBehavior(vendorId: string, period: number): Promise<{
    averageInitialOffer: number;
    priceFlexibility: number;
    negotiationStyle: 'aggressive' | 'moderate' | 'conservative';
  }> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          AVG(CASE 
            WHEN p.price > 0 AND b.amount > 0 
            THEN (b.amount / p.price) * 100 
            ELSE 0 
          END) as avg_initial_offer_percent,
          AVG(CASE 
            WHEN n.status = 'completed' AND b.amount > 0 AND n.final_price > 0
            THEN ABS(n.final_price - b.amount) / b.amount * 100
            ELSE 0
          END) as avg_price_flexibility
        FROM negotiations n
        JOIN products p ON n.product_id = p.id
        JOIN bids b ON n.id = b.negotiation_id
        WHERE p.vendor_id = $1
        AND n.created_at >= NOW() - INTERVAL '${period} days'
        AND b.bid_order = 1  -- First bid only
      `;
      
      const result = await client.query(query, [vendorId]);
      const row = result.rows[0];
      
      const averageInitialOffer = parseFloat(row.avg_initial_offer_percent || '0');
      const priceFlexibility = parseFloat(row.avg_price_flexibility || '0');
      
      // Determine negotiation style based on initial offer percentage
      let negotiationStyle: 'aggressive' | 'moderate' | 'conservative';
      if (averageInitialOffer < 70) {
        negotiationStyle = 'aggressive';
      } else if (averageInitialOffer < 85) {
        negotiationStyle = 'moderate';
      } else {
        negotiationStyle = 'conservative';
      }
      
      return {
        averageInitialOffer,
        priceFlexibility,
        negotiationStyle
      };
    } finally {
      client.release();
    }
  }

  /**
   * Analyze vendor performance metrics
   */
  private static async getVendorPerformance(vendorId: string, period: number): Promise<{
    responseTime: number;
    acceptanceRate: number;
    profitMargin: number;
  }> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          AVG(EXTRACT(EPOCH FROM (vendor_response_time)) / 60) as avg_response_time,
          COUNT(CASE WHEN n.status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as acceptance_rate,
          AVG(CASE 
            WHEN n.status = 'completed' AND p.cost_price > 0 
            THEN ((n.final_price - p.cost_price) / n.final_price) * 100 
            ELSE 0 
          END) as avg_profit_margin
        FROM negotiations n
        JOIN products p ON n.product_id = p.id
        LEFT JOIN (
          SELECT 
            negotiation_id,
            MIN(created_at) as vendor_response_time
          FROM bids
          WHERE bid_type = 'vendor'
          GROUP BY negotiation_id
        ) vr ON n.id = vr.negotiation_id
        WHERE p.vendor_id = $1
        AND n.created_at >= NOW() - INTERVAL '${period} days'
      `;
      
      const result = await client.query(query, [vendorId]);
      const row = result.rows[0];
      
      return {
        responseTime: parseFloat(row.avg_response_time || '0'),
        acceptanceRate: parseFloat(row.acceptance_rate || '0'),
        profitMargin: parseFloat(row.avg_profit_margin || '0')
      };
    } finally {
      client.release();
    }
  }

  /**
   * Generate actionable negotiation insights
   */
  static async getNegotiationInsights(vendorId: string): Promise<NegotiationInsight[]> {
    try {
      const analytics = await this.getNegotiationAnalytics(vendorId);
      const insights: NegotiationInsight[] = [];
      
      // Success rate insights
      if (analytics.successRate < 50) {
        insights.push({
          type: 'improvement_opportunity',
          title: 'Low Negotiation Success Rate',
          description: `Your success rate of ${analytics.successRate.toFixed(1)}% is below average`,
          impact: 'high',
          actionable: true,
          recommendation: 'Consider being more flexible with pricing or improving product descriptions',
          metrics: { currentRate: analytics.successRate, targetRate: 70 }
        });
      }
      
      // Response time insights
      if (analytics.vendorPerformance.responseTime > 60) {
        insights.push({
          type: 'improvement_opportunity',
          title: 'Slow Response Time',
          description: `Average response time of ${analytics.vendorPerformance.responseTime.toFixed(1)} minutes may be affecting negotiations`,
          impact: 'medium',
          actionable: true,
          recommendation: 'Aim to respond to negotiations within 30 minutes for better success rates',
          metrics: { currentTime: analytics.vendorPerformance.responseTime, targetTime: 30 }
        });
      }
      
      // Discount insights
      if (analytics.averageDiscount > 20) {
        insights.push({
          type: 'market_trend',
          title: 'High Discount Rate',
          description: `Average discount of ${analytics.averageDiscount.toFixed(1)}% suggests pricing may be too high`,
          impact: 'medium',
          actionable: true,
          recommendation: 'Review your initial pricing strategy to reduce negotiation discounts',
          metrics: { currentDiscount: analytics.averageDiscount, recommendedDiscount: 15 }
        });
      }
      
      // Category performance insights
      const topCategory = analytics.topPerformingCategories[0];
      if (topCategory && topCategory.successRate > 80) {
        insights.push({
          type: 'success_factor',
          title: 'Strong Category Performance',
          description: `${topCategory.category} category shows excellent ${topCategory.successRate.toFixed(1)}% success rate`,
          impact: 'high',
          actionable: true,
          recommendation: 'Consider expanding inventory in this high-performing category',
          metrics: { successRate: topCategory.successRate, negotiations: topCategory.totalNegotiations }
        });
      }
      
      // Customer behavior insights
      if (analytics.customerBehavior.negotiationStyle === 'aggressive') {
        insights.push({
          type: 'customer_preference',
          title: 'Aggressive Customer Negotiation Style',
          description: 'Customers typically start with low offers, indicating price sensitivity',
          impact: 'medium',
          actionable: true,
          recommendation: 'Consider starting with competitive pricing to reduce negotiation friction',
          metrics: { initialOfferPercent: analytics.customerBehavior.averageInitialOffer }
        });
      }
      
      return insights.sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      });
    } catch (error) {
      logger.error('Negotiation insights generation failed', { error, vendorId });
      throw new Error('Failed to generate negotiation insights');
    }
  }

  /**
   * Get voice-specific negotiation analytics
   */
  static async getVoiceNegotiationAnalytics(vendorId: string): Promise<VoiceNegotiationAnalytics> {
    const client = await pool.connect();
    
    try {
      // Voice usage rate
      const voiceUsageQuery = `
        SELECT 
          COUNT(CASE WHEN n.is_voice_enabled = true THEN 1 END) * 100.0 / COUNT(*) as voice_usage_rate,
          COUNT(CASE WHEN n.is_voice_enabled = true AND n.status = 'completed' THEN 1 END) * 100.0 / 
            NULLIF(COUNT(CASE WHEN n.is_voice_enabled = true THEN 1 END), 0) as voice_success_rate,
          AVG(CASE 
            WHEN n.is_voice_enabled = true 
            THEN EXTRACT(EPOCH FROM (n.updated_at - n.created_at)) / 60 
            ELSE NULL 
          END) as avg_voice_negotiation_time
        FROM negotiations n
        JOIN products p ON n.product_id = p.id
        WHERE p.vendor_id = $1
        AND n.created_at >= NOW() - INTERVAL '90 days'
      `;
      
      const voiceUsageResult = await client.query(voiceUsageQuery, [vendorId]);
      const voiceUsageRow = voiceUsageResult.rows[0];
      
      // Language preferences
      const languageQuery = `
        SELECT 
          n.language,
          COUNT(*) as usage_count,
          COUNT(CASE WHEN n.status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as success_rate
        FROM negotiations n
        JOIN products p ON n.product_id = p.id
        WHERE p.vendor_id = $1
        AND n.is_voice_enabled = true
        AND n.created_at >= NOW() - INTERVAL '90 days'
        GROUP BY n.language
        ORDER BY usage_count DESC
      `;
      
      const languageResult = await client.query(languageQuery, [vendorId]);
      const languagePreferences = languageResult.rows.map(row => ({
        language: row.language,
        usage: parseInt(row.usage_count),
        successRate: parseFloat(row.success_rate || '0')
      }));
      
      // Mock voice command effectiveness (in production, analyze actual voice commands)
      const voiceCommandEffectiveness = [
        { command: 'accept_bid', frequency: 45, successRate: 95 },
        { command: 'counter_offer', frequency: 30, successRate: 70 },
        { command: 'reject_bid', frequency: 15, successRate: 100 },
        { command: 'request_details', frequency: 25, successRate: 85 }
      ];
      
      // Mock speech pattern analysis
      const speechPatternAnalysis = {
        averageWordsPerMessage: 12,
        sentimentDistribution: {
          positive: 60,
          neutral: 30,
          negative: 10
        },
        urgencyIndicators: [
          { indicator: 'quick_response', frequency: 20, impact: 15 },
          { indicator: 'price_emphasis', frequency: 35, impact: 25 },
          { indicator: 'time_pressure', frequency: 10, impact: 30 }
        ]
      };
      
      return {
        voiceUsageRate: parseFloat(voiceUsageRow.voice_usage_rate || '0'),
        voiceSuccessRate: parseFloat(voiceUsageRow.voice_success_rate || '0'),
        averageVoiceNegotiationTime: parseFloat(voiceUsageRow.avg_voice_negotiation_time || '0'),
        languagePreferences,
        voiceCommandEffectiveness,
        speechPatternAnalysis
      };
    } finally {
      client.release();
    }
  }

  /**
   * Generate negotiation forecast
   */
  static async getNegotiationForecast(
    vendorId: string, 
    timeframe: '7d' | '30d' | '90d' = '30d'
  ): Promise<NegotiationForecast> {
    const client = await pool.connect();
    
    try {
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const historicalPeriod = days * 2; // Look back twice as far for trend analysis
      
      // Get historical data
      const historicalQuery = `
        SELECT 
          DATE(n.created_at) as date,
          COUNT(*) as negotiation_count,
          COUNT(CASE WHEN n.status = 'completed' THEN 1 END) as successful_count,
          SUM(CASE WHEN n.status = 'completed' THEN n.final_price ELSE 0 END) as revenue
        FROM negotiations n
        JOIN products p ON n.product_id = p.id
        WHERE p.vendor_id = $1
        AND n.created_at >= NOW() - INTERVAL '${historicalPeriod} days'
        GROUP BY DATE(n.created_at)
        ORDER BY date ASC
      `;
      
      const historicalResult = await client.query(historicalQuery, [vendorId]);
      const historicalData = historicalResult.rows;
      
      if (historicalData.length < 7) {
        // Not enough data for meaningful forecast
        return {
          timeframe,
          predictedNegotiations: 0,
          expectedSuccessRate: 0,
          projectedRevenue: 0,
          seasonalFactors: [],
          recommendations: ['Insufficient historical data for accurate forecasting']
        };
      }
      
      // Calculate trends
      const recentData = historicalData.slice(-days);
      const avgNegotiations = recentData.reduce((sum, day) => sum + parseInt(day.negotiation_count), 0) / recentData.length;
      const avgSuccessRate = recentData.reduce((sum, day) => {
        const daySuccessRate = parseInt(day.successful_count) / Math.max(parseInt(day.negotiation_count), 1);
        return sum + daySuccessRate;
      }, 0) / recentData.length * 100;
      const avgDailyRevenue = recentData.reduce((sum, day) => sum + parseFloat(day.revenue), 0) / recentData.length;
      
      // Simple forecast (in production, use more sophisticated models)
      const predictedNegotiations = Math.round(avgNegotiations * days);
      const expectedSuccessRate = avgSuccessRate;
      const projectedRevenue = avgDailyRevenue * days;
      
      // Seasonal factors (simplified)
      const seasonalFactors = [
        { factor: 'Weekend Effect', impact: 0.8, description: 'Lower activity on weekends' },
        { factor: 'Month End', impact: 1.2, description: 'Increased activity at month end' },
        { factor: 'Festival Season', impact: 1.5, description: 'Higher demand during festivals' }
      ];
      
      // Generate recommendations
      const recommendations = [];
      if (predictedNegotiations < avgNegotiations * days * 0.8) {
        recommendations.push('Consider promotional activities to boost negotiation volume');
      }
      if (expectedSuccessRate < 60) {
        recommendations.push('Focus on improving negotiation success rate through better pricing');
      }
      if (projectedRevenue < avgDailyRevenue * days * 0.9) {
        recommendations.push('Review pricing strategy to maintain revenue growth');
      }
      
      return {
        timeframe,
        predictedNegotiations,
        expectedSuccessRate: Math.round(expectedSuccessRate * 100) / 100,
        projectedRevenue: Math.round(projectedRevenue * 100) / 100,
        seasonalFactors,
        recommendations
      };
    } finally {
      client.release();
    }
  }

  /**
   * Compare negotiation performance with market benchmarks
   */
  static async getBenchmarkComparison(vendorId: string, category: string): Promise<{
    yourPerformance: {
      successRate: number;
      averageDiscount: number;
      responseTime: number;
    };
    marketBenchmark: {
      successRate: number;
      averageDiscount: number;
      responseTime: number;
    };
    ranking: {
      position: number;
      totalVendors: number;
      percentile: number;
    };
    recommendations: string[];
  }> {
    const client = await pool.connect();
    
    try {
      // Get vendor's performance
      const vendorQuery = `
        SELECT 
          COUNT(CASE WHEN n.status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as success_rate,
          AVG(CASE 
            WHEN n.status = 'completed' AND p.price > 0 
            THEN ((p.price - n.final_price) / p.price) * 100 
            ELSE 0 
          END) as avg_discount,
          AVG(EXTRACT(EPOCH FROM (n.updated_at - n.created_at)) / 60) as avg_response_time
        FROM negotiations n
        JOIN products p ON n.product_id = p.id
        WHERE p.vendor_id = $1
        AND p.category = $2
        AND n.created_at >= NOW() - INTERVAL '90 days'
      `;
      
      const vendorResult = await client.query(vendorQuery, [vendorId, category]);
      const vendorData = vendorResult.rows[0];
      
      // Get market benchmark
      const benchmarkQuery = `
        SELECT 
          AVG(vendor_success_rate) as market_success_rate,
          AVG(vendor_avg_discount) as market_avg_discount,
          AVG(vendor_response_time) as market_response_time,
          COUNT(*) as total_vendors
        FROM (
          SELECT 
            p.vendor_id,
            COUNT(CASE WHEN n.status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as vendor_success_rate,
            AVG(CASE 
              WHEN n.status = 'completed' AND p.price > 0 
              THEN ((p.price - n.final_price) / p.price) * 100 
              ELSE 0 
            END) as vendor_avg_discount,
            AVG(EXTRACT(EPOCH FROM (n.updated_at - n.created_at)) / 60) as vendor_response_time
          FROM negotiations n
          JOIN products p ON n.product_id = p.id
          WHERE p.category = $1
          AND n.created_at >= NOW() - INTERVAL '90 days'
          GROUP BY p.vendor_id
          HAVING COUNT(*) >= 5
        ) vendor_stats
      `;
      
      const benchmarkResult = await client.query(benchmarkQuery, [category]);
      const benchmarkData = benchmarkResult.rows[0];
      
      // Calculate ranking
      const rankingQuery = `
        SELECT 
          vendor_id,
          vendor_success_rate,
          ROW_NUMBER() OVER (ORDER BY vendor_success_rate DESC) as rank
        FROM (
          SELECT 
            p.vendor_id,
            COUNT(CASE WHEN n.status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as vendor_success_rate
          FROM negotiations n
          JOIN products p ON n.product_id = p.id
          WHERE p.category = $1
          AND n.created_at >= NOW() - INTERVAL '90 days'
          GROUP BY p.vendor_id
          HAVING COUNT(*) >= 5
        ) vendor_rankings
      `;
      
      const rankingResult = await client.query(rankingQuery, [category]);
      const vendorRank = rankingResult.rows.find(row => row.vendor_id === vendorId);
      
      const yourPerformance = {
        successRate: parseFloat(vendorData.success_rate || '0'),
        averageDiscount: parseFloat(vendorData.avg_discount || '0'),
        responseTime: parseFloat(vendorData.avg_response_time || '0')
      };
      
      const marketBenchmark = {
        successRate: parseFloat(benchmarkData.market_success_rate || '0'),
        averageDiscount: parseFloat(benchmarkData.market_avg_discount || '0'),
        responseTime: parseFloat(benchmarkData.market_response_time || '0')
      };
      
      const totalVendors = parseInt(benchmarkData.total_vendors || '0');
      const position = vendorRank ? parseInt(vendorRank.rank) : totalVendors;
      const percentile = totalVendors > 0 ? Math.round(((totalVendors - position + 1) / totalVendors) * 100) : 0;
      
      // Generate recommendations
      const recommendations = [];
      if (yourPerformance.successRate < marketBenchmark.successRate) {
        recommendations.push(`Improve success rate - you're ${(marketBenchmark.successRate - yourPerformance.successRate).toFixed(1)}% below market average`);
      }
      if (yourPerformance.responseTime > marketBenchmark.responseTime) {
        recommendations.push(`Reduce response time - market average is ${marketBenchmark.responseTime.toFixed(1)} minutes`);
      }
      if (yourPerformance.averageDiscount > marketBenchmark.averageDiscount + 5) {
        recommendations.push('Consider adjusting initial pricing to reduce negotiation discounts');
      }
      
      return {
        yourPerformance,
        marketBenchmark,
        ranking: {
          position,
          totalVendors,
          percentile
        },
        recommendations
      };
    } finally {
      client.release();
    }
  }
}