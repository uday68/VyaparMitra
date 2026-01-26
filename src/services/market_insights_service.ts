import { logger } from '../utils/logger';
import { getPool } from '../db/postgres';
import { getRedisClient, RedisService } from '../db/redis';

interface MarketInsight {
  category: string;
  currentTrend: 'rising' | 'falling' | 'stable';
  priceChange: number; // Percentage change
  demandLevel: 'high' | 'medium' | 'low';
  supplyLevel: 'high' | 'medium' | 'low';
  averagePrice: number;
  totalTransactions: number;
  topVendors: Array<{
    vendorId: string;
    vendorName: string;
    marketShare: number;
    averageRating: number;
  }>;
  seasonalFactor: number;
  recommendations: string[];
}

interface MarketAlert {
  id: string;
  type: 'price_spike' | 'demand_surge' | 'supply_shortage' | 'new_competitor' | 'seasonal_trend';
  category: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  actionRequired: string;
  createdAt: Date;
  expiresAt: Date;
}

interface CompetitorAnalysis {
  category: string;
  yourPosition: {
    rank: number;
    marketShare: number;
    averagePrice: number;
    totalSales: number;
  };
  competitors: Array<{
    vendorId: string;
    vendorName: string;
    rank: number;
    marketShare: number;
    averagePrice: number;
    totalSales: number;
    priceAdvantage: number; // Percentage difference from your price
    strengthAreas: string[];
  }>;
  opportunities: string[];
  threats: string[];
}

interface DemandForecast {
  category: string;
  timeframe: '7d' | '30d' | '90d';
  forecast: Array<{
    date: string;
    predictedDemand: number;
    confidence: number;
    factors: string[];
  }>;
  seasonalPatterns: Array<{
    period: string;
    demandMultiplier: number;
    description: string;
  }>;
  recommendations: string[];
}

export class MarketInsightsService {
  private static readonly CACHE_TTL = 3600; // 1 hour
  private static readonly TREND_ANALYSIS_DAYS = 30;
  private static readonly COMPETITOR_LIMIT = 10;

  /**
   * Get comprehensive market insights for a category
   */
  static async getMarketInsights(category: string, vendorId?: string): Promise<MarketInsight> {
    try {
      const cacheKey = `market_insights:${category}:${vendorId || 'all'}`;
      // Redis handled by RedisService
      
      // Check cache first
      const cached = await RedisService.get(cacheKey);
      if (cached) {
        logger.info('Market insights served from cache', { category });
        return JSON.parse(cached);
      }

      const [
        priceAnalysis,
        demandSupplyAnalysis,
        topVendors,
        seasonalAnalysis
      ] = await Promise.all([
        this.analyzePriceTrends(category),
        this.analyzeDemandSupply(category),
        this.getTopVendors(category),
        this.analyzeSeasonalFactors(category)
      ]);

      const insight: MarketInsight = {
        category,
        currentTrend: priceAnalysis.trend,
        priceChange: priceAnalysis.changePercent,
        demandLevel: demandSupplyAnalysis.demandLevel,
        supplyLevel: demandSupplyAnalysis.supplyLevel,
        averagePrice: priceAnalysis.averagePrice,
        totalTransactions: priceAnalysis.totalTransactions,
        topVendors,
        seasonalFactor: seasonalAnalysis.currentFactor,
        recommendations: await this.generateMarketRecommendations(
          priceAnalysis,
          demandSupplyAnalysis,
          seasonalAnalysis,
          vendorId
        )
      };

      // Cache the result
      await RedisService.setWithTTL(cacheKey, this.CACHE_TTL, JSON.stringify(insight));
      
      logger.info('Market insights generated', {
        category,
        trend: insight.currentTrend,
        priceChange: insight.priceChange
      });

      return insight;
    } catch (error) {
      logger.error('Market insights generation failed', { error, category });
      throw new Error('Failed to generate market insights');
    }
  }

  /**
   * Analyze price trends for a category
   */
  private static async analyzePriceTrends(category: string): Promise<{
    trend: 'rising' | 'falling' | 'stable';
    changePercent: number;
    averagePrice: number;
    totalTransactions: number;
  }> {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // Get price data for the last 30 days
      const query = `
        SELECT 
          DATE(n.created_at) as date,
          AVG(n.final_price) as avg_price,
          COUNT(*) as transaction_count
        FROM negotiations n
        WHERE n.product_category = $1
        AND n.status = 'completed'
        AND n.created_at >= NOW() - INTERVAL '${this.TREND_ANALYSIS_DAYS} days'
        GROUP BY DATE(n.created_at)
        ORDER BY date ASC
      `;
      
      const result = await client.query(query, [category]);
      
      if (result.rows.length < 2) {
        return {
          trend: 'stable',
          changePercent: 0,
          averagePrice: 0,
          totalTransactions: 0
        };
      }
      
      const prices = result.rows.map(row => parseFloat(row.avg_price));
      const totalTransactions = result.rows.reduce((sum, row) => sum + parseInt(row.transaction_count), 0);
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      
      // Calculate trend using linear regression
      const n = prices.length;
      const x = Array.from({ length: n }, (_, i) => i);
      const y = prices;
      
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const changePercent = (slope / averagePrice) * 100 * n; // Extrapolate to full period
      
      let trend: 'rising' | 'falling' | 'stable';
      if (changePercent > 5) trend = 'rising';
      else if (changePercent < -5) trend = 'falling';
      else trend = 'stable';
      
      return {
        trend,
        changePercent: Math.round(changePercent * 100) / 100,
        averagePrice: Math.round(averagePrice * 100) / 100,
        totalTransactions
      };
    } finally {
      client.release();
    }
  }

  /**
   * Analyze demand and supply levels
   */
  private static async analyzeDemandSupply(category: string): Promise<{
    demandLevel: 'high' | 'medium' | 'low';
    supplyLevel: 'high' | 'medium' | 'low';
  }> {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // Analyze demand (negotiations and searches)
      const demandQuery = `
        SELECT COUNT(*) as recent_negotiations
        FROM negotiations
        WHERE product_category = $1
        AND created_at >= NOW() - INTERVAL '7 days'
      `;
      
      const demandResult = await client.query(demandQuery, [category]);
      const recentNegotiations = parseInt(demandResult.rows[0].recent_negotiations);
      
      // Analyze supply (available products)
      const supplyQuery = `
        SELECT 
          COUNT(*) as available_products,
          SUM(stock_quantity) as total_stock
        FROM products
        WHERE category = $1
        AND is_active = true
        AND stock_quantity > 0
      `;
      
      const supplyResult = await client.query(supplyQuery, [category]);
      const availableProducts = parseInt(supplyResult.rows[0].available_products);
      const totalStock = parseInt(supplyResult.rows[0].total_stock || '0');
      
      // Classify demand level
      let demandLevel: 'high' | 'medium' | 'low';
      if (recentNegotiations > 50) demandLevel = 'high';
      else if (recentNegotiations > 20) demandLevel = 'medium';
      else demandLevel = 'low';
      
      // Classify supply level
      let supplyLevel: 'high' | 'medium' | 'low';
      if (availableProducts > 100 && totalStock > 1000) supplyLevel = 'high';
      else if (availableProducts > 50 && totalStock > 500) supplyLevel = 'medium';
      else supplyLevel = 'low';
      
      return { demandLevel, supplyLevel };
    } finally {
      client.release();
    }
  }

  /**
   * Get top vendors in a category
   */
  private static async getTopVendors(category: string): Promise<Array<{
    vendorId: string;
    vendorName: string;
    marketShare: number;
    averageRating: number;
  }>> {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          u.id as vendor_id,
          u.name as vendor_name,
          COUNT(n.id) as total_sales,
          COALESCE(u.rating, 4.0) as average_rating,
          (COUNT(n.id) * 100.0 / (
            SELECT COUNT(*)
            FROM negotiations n2
            WHERE n2.product_category = $1
            AND n2.status = 'completed'
            AND n2.created_at >= NOW() - INTERVAL '90 days'
          )) as market_share
        FROM users u
        JOIN products p ON u.id = p.vendor_id
        JOIN negotiations n ON p.id = n.product_id
        WHERE p.category = $1
        AND n.status = 'completed'
        AND n.created_at >= NOW() - INTERVAL '90 days'
        GROUP BY u.id, u.name, u.rating
        ORDER BY total_sales DESC
        LIMIT $2
      `;
      
      const result = await client.query(query, [category, this.COMPETITOR_LIMIT]);
      
      return result.rows.map(row => ({
        vendorId: row.vendor_id,
        vendorName: row.vendor_name,
        marketShare: parseFloat(row.market_share || '0'),
        averageRating: parseFloat(row.average_rating)
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Analyze seasonal factors
   */
  private static async analyzeSeasonalFactors(category: string): Promise<{
    currentFactor: number;
    seasonalPatterns: Array<{ month: number; factor: number }>;
  }> {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          EXTRACT(MONTH FROM n.created_at) as month,
          COUNT(*) as transaction_count,
          AVG(n.final_price) as avg_price
        FROM negotiations n
        WHERE n.product_category = $1
        AND n.status = 'completed'
        AND n.created_at >= NOW() - INTERVAL '12 months'
        GROUP BY EXTRACT(MONTH FROM n.created_at)
        ORDER BY month
      `;
      
      const result = await client.query(query, [category]);
      
      if (result.rows.length === 0) {
        return { currentFactor: 1.0, seasonalPatterns: [] };
      }
      
      const monthlyData = result.rows.map(row => ({
        month: parseInt(row.month),
        transactionCount: parseInt(row.transaction_count),
        avgPrice: parseFloat(row.avg_price)
      }));
      
      // Calculate seasonal factors based on transaction volume
      const avgTransactions = monthlyData.reduce((sum, data) => sum + data.transactionCount, 0) / monthlyData.length;
      
      const seasonalPatterns = monthlyData.map(data => ({
        month: data.month,
        factor: data.transactionCount / avgTransactions
      }));
      
      // Get current month factor
      const currentMonth = new Date().getMonth() + 1;
      const currentFactor = seasonalPatterns.find(p => p.month === currentMonth)?.factor || 1.0;
      
      return { currentFactor, seasonalPatterns };
    } finally {
      client.release();
    }
  }

  /**
   * Generate market recommendations
   */
  private static async generateMarketRecommendations(
    priceAnalysis: any,
    demandSupplyAnalysis: any,
    seasonalAnalysis: any,
    vendorId?: string
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Price trend recommendations
    if (priceAnalysis.trend === 'rising') {
      recommendations.push('Prices are trending upward - consider increasing your prices gradually');
      recommendations.push('High demand detected - ensure adequate inventory levels');
    } else if (priceAnalysis.trend === 'falling') {
      recommendations.push('Prices are declining - focus on cost optimization and value-added services');
      recommendations.push('Consider promotional strategies to maintain market share');
    }
    
    // Demand-supply recommendations
    if (demandSupplyAnalysis.demandLevel === 'high' && demandSupplyAnalysis.supplyLevel === 'low') {
      recommendations.push('High demand with low supply - premium pricing opportunity');
      recommendations.push('Consider expanding inventory to capture market opportunity');
    } else if (demandSupplyAnalysis.demandLevel === 'low' && demandSupplyAnalysis.supplyLevel === 'high') {
      recommendations.push('Market oversupply detected - competitive pricing strategy recommended');
      recommendations.push('Focus on product differentiation and customer service');
    }
    
    // Seasonal recommendations
    if (seasonalAnalysis.currentFactor > 1.2) {
      recommendations.push('Peak seasonal demand period - optimize inventory and pricing');
    } else if (seasonalAnalysis.currentFactor < 0.8) {
      recommendations.push('Low seasonal demand - consider off-season promotions');
    }
    
    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  /**
   * Get market alerts for vendors
   */
  static async getMarketAlerts(vendorId: string, categories?: string[]): Promise<MarketAlert[]> {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // Get vendor's categories if not specified
      if (!categories) {
        const categoryQuery = `
          SELECT DISTINCT category
          FROM products
          WHERE vendor_id = $1
          AND is_active = true
        `;
        const categoryResult = await client.query(categoryQuery, [vendorId]);
        categories = categoryResult.rows.map(row => row.category);
      }
      
      const alerts: MarketAlert[] = [];
      
      for (const category of categories) {
        // Check for price spikes
        const priceSpike = await this.checkPriceSpike(category);
        if (priceSpike) alerts.push(priceSpike);
        
        // Check for demand surges
        const demandSurge = await this.checkDemandSurge(category);
        if (demandSurge) alerts.push(demandSurge);
        
        // Check for supply shortages
        const supplyShortage = await this.checkSupplyShortage(category);
        if (supplyShortage) alerts.push(supplyShortage);
      }
      
      return alerts.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
    } finally {
      client.release();
    }
  }

  /**
   * Check for price spike alerts
   */
  private static async checkPriceSpike(category: string): Promise<MarketAlert | null> {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          AVG(CASE WHEN n.created_at >= NOW() - INTERVAL '7 days' THEN n.final_price END) as recent_avg,
          AVG(CASE WHEN n.created_at >= NOW() - INTERVAL '30 days' AND n.created_at < NOW() - INTERVAL '7 days' THEN n.final_price END) as previous_avg
        FROM negotiations n
        WHERE n.product_category = $1
        AND n.status = 'completed'
        AND n.created_at >= NOW() - INTERVAL '30 days'
      `;
      
      const result = await client.query(query, [category]);
      const row = result.rows[0];
      
      if (!row.recent_avg || !row.previous_avg) return null;
      
      const recentAvg = parseFloat(row.recent_avg);
      const previousAvg = parseFloat(row.previous_avg);
      const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;
      
      if (changePercent > 20) {
        return {
          id: `price_spike_${category}_${Date.now()}`,
          type: 'price_spike',
          category,
          severity: changePercent > 50 ? 'high' : 'medium',
          title: `Price Spike Alert: ${category}`,
          description: `Prices have increased by ${changePercent.toFixed(1)}% in the last 7 days`,
          impact: 'Potential for increased profit margins but may affect demand',
          actionRequired: 'Review pricing strategy and monitor competitor responses',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        };
      }
      
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Check for demand surge alerts
   */
  private static async checkDemandSurge(category: string): Promise<MarketAlert | null> {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          COUNT(CASE WHEN n.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_count,
          COUNT(CASE WHEN n.created_at >= NOW() - INTERVAL '14 days' AND n.created_at < NOW() - INTERVAL '7 days' THEN 1 END) as previous_count
        FROM negotiations n
        WHERE n.product_category = $1
        AND n.created_at >= NOW() - INTERVAL '14 days'
      `;
      
      const result = await client.query(query, [category]);
      const row = result.rows[0];
      
      const recentCount = parseInt(row.recent_count);
      const previousCount = parseInt(row.previous_count);
      
      if (previousCount === 0) return null;
      
      const changePercent = ((recentCount - previousCount) / previousCount) * 100;
      
      if (changePercent > 50 && recentCount > 10) {
        return {
          id: `demand_surge_${category}_${Date.now()}`,
          type: 'demand_surge',
          category,
          severity: changePercent > 100 ? 'high' : 'medium',
          title: `Demand Surge Alert: ${category}`,
          description: `Demand has increased by ${changePercent.toFixed(1)}% in the last 7 days`,
          impact: 'Opportunity for increased sales and premium pricing',
          actionRequired: 'Ensure adequate inventory and consider price adjustments',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
        };
      }
      
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Check for supply shortage alerts
   */
  private static async checkSupplyShortage(category: string): Promise<MarketAlert | null> {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          COUNT(*) as total_products,
          COUNT(CASE WHEN stock_quantity > 0 THEN 1 END) as in_stock_products,
          SUM(stock_quantity) as total_stock
        FROM products
        WHERE category = $1
        AND is_active = true
      `;
      
      const result = await client.query(query, [category]);
      const row = result.rows[0];
      
      const totalProducts = parseInt(row.total_products);
      const inStockProducts = parseInt(row.in_stock_products);
      const totalStock = parseInt(row.total_stock || '0');
      
      const stockoutRate = totalProducts > 0 ? (totalProducts - inStockProducts) / totalProducts : 0;
      
      if (stockoutRate > 0.3 || totalStock < 100) { // 30% stockout rate or very low total stock
        return {
          id: `supply_shortage_${category}_${Date.now()}`,
          type: 'supply_shortage',
          category,
          severity: stockoutRate > 0.5 ? 'high' : 'medium',
          title: `Supply Shortage Alert: ${category}`,
          description: `${(stockoutRate * 100).toFixed(1)}% of products are out of stock`,
          impact: 'Potential for premium pricing but risk of losing customers',
          actionRequired: 'Restock inventory urgently and consider alternative suppliers',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
        };
      }
      
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Get competitor analysis for a vendor
   */
  static async getCompetitorAnalysis(vendorId: string, category: string): Promise<CompetitorAnalysis> {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // Get vendor's performance
      const vendorQuery = `
        SELECT 
          COUNT(n.id) as total_sales,
          AVG(n.final_price) as average_price,
          (COUNT(n.id) * 100.0 / (
            SELECT COUNT(*)
            FROM negotiations n2
            WHERE n2.product_category = $2
            AND n2.status = 'completed'
            AND n2.created_at >= NOW() - INTERVAL '90 days'
          )) as market_share
        FROM negotiations n
        JOIN products p ON n.product_id = p.id
        WHERE p.vendor_id = $1
        AND p.category = $2
        AND n.status = 'completed'
        AND n.created_at >= NOW() - INTERVAL '90 days'
      `;
      
      const vendorResult = await client.query(vendorQuery, [vendorId, category]);
      const vendorData = vendorResult.rows[0];
      
      // Get competitors
      const competitorQuery = `
        SELECT 
          u.id as vendor_id,
          u.name as vendor_name,
          COUNT(n.id) as total_sales,
          AVG(n.final_price) as average_price,
          COALESCE(u.rating, 4.0) as rating,
          (COUNT(n.id) * 100.0 / (
            SELECT COUNT(*)
            FROM negotiations n2
            WHERE n2.product_category = $2
            AND n2.status = 'completed'
            AND n2.created_at >= NOW() - INTERVAL '90 days'
          )) as market_share
        FROM users u
        JOIN products p ON u.id = p.vendor_id
        JOIN negotiations n ON p.id = n.product_id
        WHERE p.category = $2
        AND n.status = 'completed'
        AND n.created_at >= NOW() - INTERVAL '90 days'
        AND u.id != $1
        GROUP BY u.id, u.name, u.rating
        ORDER BY total_sales DESC
        LIMIT $3
      `;
      
      const competitorResult = await client.query(competitorQuery, [vendorId, category, this.COMPETITOR_LIMIT]);
      
      const yourTotalSales = parseInt(vendorData.total_sales || '0');
      const yourAveragePrice = parseFloat(vendorData.average_price || '0');
      const yourMarketShare = parseFloat(vendorData.market_share || '0');
      
      // Calculate rank
      const allVendors = [
        { sales: yourTotalSales, vendorId },
        ...competitorResult.rows.map(row => ({ sales: parseInt(row.total_sales), vendorId: row.vendor_id }))
      ].sort((a, b) => b.sales - a.sales);
      
      const yourRank = allVendors.findIndex(v => v.vendorId === vendorId) + 1;
      
      const competitors = competitorResult.rows.map((row, index) => {
        const competitorPrice = parseFloat(row.average_price);
        const priceAdvantage = yourAveragePrice > 0 ? ((yourAveragePrice - competitorPrice) / yourAveragePrice) * 100 : 0;
        
        return {
          vendorId: row.vendor_id,
          vendorName: row.vendor_name,
          rank: index + (yourRank > index + 1 ? 1 : 2), // Adjust for your position
          marketShare: parseFloat(row.market_share),
          averagePrice: competitorPrice,
          totalSales: parseInt(row.total_sales),
          priceAdvantage,
          strengthAreas: this.identifyStrengthAreas(row, vendorData)
        };
      });
      
      return {
        category,
        yourPosition: {
          rank: yourRank,
          marketShare: yourMarketShare,
          averagePrice: yourAveragePrice,
          totalSales: yourTotalSales
        },
        competitors,
        opportunities: this.identifyOpportunities(vendorData, competitors),
        threats: this.identifyThreats(vendorData, competitors)
      };
    } finally {
      client.release();
    }
  }

  /**
   * Identify competitor strength areas
   */
  private static identifyStrengthAreas(competitor: any, vendorData: any): string[] {
    const strengths: string[] = [];
    
    const competitorSales = parseInt(competitor.total_sales);
    const competitorPrice = parseFloat(competitor.average_price);
    const competitorRating = parseFloat(competitor.rating);
    
    const vendorSales = parseInt(vendorData.total_sales || '0');
    const vendorPrice = parseFloat(vendorData.average_price || '0');
    
    if (competitorSales > vendorSales * 1.5) {
      strengths.push('Higher sales volume');
    }
    
    if (competitorPrice < vendorPrice * 0.9) {
      strengths.push('Competitive pricing');
    }
    
    if (competitorRating > 4.5) {
      strengths.push('High customer rating');
    }
    
    return strengths;
  }

  /**
   * Identify market opportunities
   */
  private static identifyOpportunities(vendorData: any, competitors: any[]): string[] {
    const opportunities: string[] = [];
    
    const avgCompetitorPrice = competitors.reduce((sum, comp) => sum + comp.averagePrice, 0) / competitors.length;
    const vendorPrice = parseFloat(vendorData.average_price || '0');
    
    if (vendorPrice < avgCompetitorPrice * 0.95) {
      opportunities.push('Price premium opportunity - your prices are below market average');
    }
    
    if (competitors.length < 5) {
      opportunities.push('Low competition - market expansion opportunity');
    }
    
    const topCompetitorShare = Math.max(...competitors.map(c => c.marketShare));
    if (topCompetitorShare < 30) {
      opportunities.push('Fragmented market - opportunity to gain market leadership');
    }
    
    return opportunities;
  }

  /**
   * Identify market threats
   */
  private static identifyThreats(vendorData: any, competitors: any[]): string[] {
    const threats: string[] = [];
    
    const strongCompetitors = competitors.filter(c => c.marketShare > parseFloat(vendorData.market_share || '0') * 2);
    if (strongCompetitors.length > 0) {
      threats.push('Strong competitors with significantly higher market share');
    }
    
    const lowPriceCompetitors = competitors.filter(c => c.priceAdvantage < -20);
    if (lowPriceCompetitors.length > 0) {
      threats.push('Price competition from low-cost competitors');
    }
    
    if (competitors.length > 10) {
      threats.push('High market saturation with many competitors');
    }
    
    return threats;
  }

  /**
   * Get demand forecast for a category
   */
  static async getDemandForecast(category: string, timeframe: '7d' | '30d' | '90d' = '30d'): Promise<DemandForecast> {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      
      // Get historical demand data
      const query = `
        SELECT 
          DATE(n.created_at) as date,
          COUNT(*) as demand_count
        FROM negotiations n
        WHERE n.product_category = $1
        AND n.created_at >= NOW() - INTERVAL '${days * 2} days'
        GROUP BY DATE(n.created_at)
        ORDER BY date ASC
      `;
      
      const result = await client.query(query, [category]);
      
      // Simple moving average forecast (in production, use more sophisticated models)
      const historicalData = result.rows.map(row => ({
        date: row.date,
        demand: parseInt(row.demand_count)
      }));
      
      const forecast = this.generateDemandForecast(historicalData, days);
      const seasonalPatterns = await this.getSeasonalPatterns(category);
      
      return {
        category,
        timeframe,
        forecast,
        seasonalPatterns,
        recommendations: this.generateForecastRecommendations(forecast, seasonalPatterns)
      };
    } finally {
      client.release();
    }
  }

  /**
   * Generate demand forecast using simple moving average
   */
  private static generateDemandForecast(historicalData: any[], days: number): Array<{
    date: string;
    predictedDemand: number;
    confidence: number;
    factors: string[];
  }> {
    if (historicalData.length < 7) {
      return []; // Not enough data for forecast
    }
    
    const forecast = [];
    const windowSize = Math.min(7, historicalData.length);
    
    // Calculate moving average
    const recentData = historicalData.slice(-windowSize);
    const avgDemand = recentData.reduce((sum, data) => sum + data.demand, 0) / windowSize;
    
    // Generate forecast for requested period
    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);
      
      // Simple forecast with some randomness (in production, use ML models)
      const predictedDemand = Math.round(avgDemand * (0.9 + Math.random() * 0.2));
      const confidence = Math.max(0.3, 0.9 - (i / days) * 0.4); // Decreasing confidence over time
      
      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predictedDemand,
        confidence: Math.round(confidence * 100) / 100,
        factors: ['Historical trend', 'Seasonal patterns', 'Market conditions']
      });
    }
    
    return forecast;
  }

  /**
   * Get seasonal patterns for demand forecasting
   */
  private static async getSeasonalPatterns(category: string): Promise<Array<{
    period: string;
    demandMultiplier: number;
    description: string;
  }>> {
    // Simplified seasonal patterns (in production, analyze historical data)
    const patterns = {
      'fruits': [
        { period: 'Summer', demandMultiplier: 1.3, description: 'High demand for fresh fruits' },
        { period: 'Winter', demandMultiplier: 0.8, description: 'Lower demand, focus on stored varieties' }
      ],
      'vegetables': [
        { period: 'Monsoon', demandMultiplier: 1.2, description: 'Increased demand due to limited supply' },
        { period: 'Harvest', demandMultiplier: 0.9, description: 'Abundant supply, competitive pricing' }
      ]
    };
    
    return patterns[category as keyof typeof patterns] || [];
  }

  /**
   * Generate recommendations based on demand forecast
   */
  private static generateForecastRecommendations(forecast: any[], seasonalPatterns: any[]): string[] {
    const recommendations: string[] = [];
    
    const avgDemand = forecast.reduce((sum, f) => sum + f.predictedDemand, 0) / forecast.length;
    const peakDemand = Math.max(...forecast.map(f => f.predictedDemand));
    
    if (peakDemand > avgDemand * 1.5) {
      recommendations.push('Prepare for demand spikes - ensure adequate inventory');
    }
    
    if (seasonalPatterns.some(p => p.demandMultiplier > 1.2)) {
      recommendations.push('Seasonal demand increase expected - adjust pricing and inventory');
    }
    
    const lowConfidenceDays = forecast.filter(f => f.confidence < 0.5).length;
    if (lowConfidenceDays > forecast.length * 0.3) {
      recommendations.push('High forecast uncertainty - maintain flexible inventory strategy');
    }
    
    return recommendations;
  }
}