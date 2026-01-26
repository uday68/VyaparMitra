import { logger } from '../utils/logger';
import { pool } from '../db/postgres';
import { getRedisClient } from '../db/redis';

interface PricePredictionRequest {
  productId: string;
  category: string;
  seasonality?: string;
  location?: string;
  quantity?: number;
}

interface PricePredictionResponse {
  predictedPrice: number;
  confidence: number;
  priceRange: {
    min: number;
    max: number;
  };
  factors: {
    demand: number;
    supply: number;
    seasonality: number;
    location: number;
  };
  recommendations: string[];
}

interface MarketData {
  avgPrice: number;
  totalTransactions: number;
  demandScore: number;
  supplyScore: number;
}

export class PricePredictionService {
  private static readonly CACHE_TTL = 1800; // 30 minutes
  private static readonly PREDICTION_MODELS = {
    SEASONAL: 'seasonal_model',
    DEMAND_SUPPLY: 'demand_supply_model',
    LOCATION_BASED: 'location_model',
    HYBRID: 'hybrid_model'
  };

  /**
   * Predict optimal price for a product based on market data and AI models
   */
  static async predictPrice(request: PricePredictionRequest): Promise<PricePredictionResponse> {
    try {
      const cacheKey = `price_prediction:${request.productId}:${request.category}:${request.location}`;
      const redis = getRedisClient();
      
      // Check cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info('Price prediction served from cache', { productId: request.productId });
        return JSON.parse(cached);
      }

      // Gather market data
      const marketData = await this.gatherMarketData(request);
      
      // Apply AI prediction models
      const prediction = await this.applyPredictionModels(request, marketData);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(prediction, marketData);
      
      const response: PricePredictionResponse = {
        predictedPrice: prediction.price,
        confidence: prediction.confidence,
        priceRange: {
          min: prediction.price * 0.85,
          max: prediction.price * 1.15
        },
        factors: prediction.factors,
        recommendations
      };

      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(response));
      
      logger.info('Price prediction generated', {
        productId: request.productId,
        predictedPrice: response.predictedPrice,
        confidence: response.confidence
      });

      return response;
    } catch (error) {
      logger.error('Price prediction failed', { error, request });
      throw new Error('Failed to predict price');
    }
  }

  /**
   * Gather historical market data for prediction
   */
  private static async gatherMarketData(request: PricePredictionRequest): Promise<MarketData> {
    const client = await pool.connect();
    
    try {
      // Get historical pricing data
      const priceQuery = `
        SELECT 
          AVG(final_price) as avg_price,
          COUNT(*) as total_transactions,
          STDDEV(final_price) as price_volatility
        FROM negotiations n
        JOIN orders o ON n.id = o.negotiation_id
        WHERE n.product_category = $1
        AND n.created_at >= NOW() - INTERVAL '30 days'
        AND n.status = 'completed'
      `;
      
      const priceResult = await client.query(priceQuery, [request.category]);
      
      // Calculate demand score based on recent activity
      const demandQuery = `
        SELECT COUNT(*) as recent_negotiations
        FROM negotiations
        WHERE product_category = $1
        AND created_at >= NOW() - INTERVAL '7 days'
      `;
      
      const demandResult = await client.query(demandQuery, [request.category]);
      
      // Calculate supply score based on available inventory
      const supplyQuery = `
        SELECT COUNT(*) as available_products
        FROM products
        WHERE category = $1
        AND stock_quantity > 0
        AND is_active = true
      `;
      
      const supplyResult = await client.query(supplyQuery, [request.category]);
      
      const avgPrice = parseFloat(priceResult.rows[0]?.avg_price || '0');
      const totalTransactions = parseInt(priceResult.rows[0]?.total_transactions || '0');
      const recentNegotiations = parseInt(demandResult.rows[0]?.recent_negotiations || '0');
      const availableProducts = parseInt(supplyResult.rows[0]?.available_products || '1');
      
      return {
        avgPrice,
        totalTransactions,
        demandScore: Math.min(recentNegotiations / 10, 1), // Normalize to 0-1
        supplyScore: Math.min(availableProducts / 100, 1) // Normalize to 0-1
      };
    } finally {
      client.release();
    }
  }

  /**
   * Apply AI prediction models to generate price prediction
   */
  private static async applyPredictionModels(
    request: PricePredictionRequest,
    marketData: MarketData
  ): Promise<{
    price: number;
    confidence: number;
    factors: { demand: number; supply: number; seasonality: number; location: number };
  }> {
    // Seasonal factor calculation
    const seasonalityFactor = this.calculateSeasonalityFactor(request.category, request.seasonality);
    
    // Location factor calculation
    const locationFactor = this.calculateLocationFactor(request.location);
    
    // Demand-supply balance
    const demandSupplyRatio = marketData.demandScore / Math.max(marketData.supplyScore, 0.1);
    
    // Base price from market data
    let basePrice = marketData.avgPrice || 100; // Default fallback
    
    // Apply factors to base price
    const seasonalAdjustment = basePrice * seasonalityFactor;
    const locationAdjustment = basePrice * locationFactor;
    const demandAdjustment = basePrice * (demandSupplyRatio * 0.2); // 20% max adjustment
    
    const predictedPrice = Math.round(
      basePrice + seasonalAdjustment + locationAdjustment + demandAdjustment
    );
    
    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(marketData, request);
    
    return {
      price: Math.max(predictedPrice, 1), // Ensure positive price
      confidence,
      factors: {
        demand: marketData.demandScore,
        supply: marketData.supplyScore,
        seasonality: seasonalityFactor,
        location: locationFactor
      }
    };
  }

  /**
   * Calculate seasonality factor for price adjustment
   */
  private static calculateSeasonalityFactor(category: string, seasonality?: string): number {
    const seasonalityMap: Record<string, Record<string, number>> = {
      'fruits': {
        'summer': 0.1,   // 10% increase in summer
        'winter': -0.05, // 5% decrease in winter
        'monsoon': 0.15  // 15% increase in monsoon
      },
      'vegetables': {
        'summer': 0.05,
        'winter': -0.1,
        'monsoon': 0.2
      },
      'grains': {
        'harvest': -0.15, // 15% decrease during harvest
        'pre_harvest': 0.1
      }
    };
    
    if (!seasonality || !seasonalityMap[category]) {
      return 0;
    }
    
    return seasonalityMap[category][seasonality] || 0;
  }

  /**
   * Calculate location factor for price adjustment
   */
  private static calculateLocationFactor(location?: string): number {
    // Location-based price adjustments (simplified)
    const locationFactors: Record<string, number> = {
      'metro': 0.15,     // 15% higher in metro cities
      'urban': 0.05,     // 5% higher in urban areas
      'rural': -0.1,     // 10% lower in rural areas
      'remote': -0.15    // 15% lower in remote areas
    };
    
    return locationFactors[location || 'urban'] || 0;
  }

  /**
   * Calculate prediction confidence score
   */
  private static calculateConfidence(marketData: MarketData, request: PricePredictionRequest): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on transaction volume
    if (marketData.totalTransactions > 50) confidence += 0.2;
    else if (marketData.totalTransactions > 20) confidence += 0.1;
    
    // Increase confidence if we have recent demand data
    if (marketData.demandScore > 0.3) confidence += 0.15;
    
    // Increase confidence if supply data is available
    if (marketData.supplyScore > 0.2) confidence += 0.15;
    
    // Decrease confidence for new categories
    if (marketData.totalTransactions < 5) confidence -= 0.2;
    
    return Math.min(Math.max(confidence, 0.1), 0.95); // Clamp between 0.1 and 0.95
  }

  /**
   * Generate pricing recommendations based on prediction
   */
  private static async generateRecommendations(
    prediction: { price: number; confidence: number; factors: any },
    marketData: MarketData
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // High demand recommendations
    if (prediction.factors.demand > 0.7) {
      recommendations.push('High demand detected - consider pricing at upper range');
      recommendations.push('Stock up inventory to meet increased demand');
    }
    
    // Low supply recommendations
    if (prediction.factors.supply < 0.3) {
      recommendations.push('Limited supply - premium pricing opportunity');
      recommendations.push('Consider sourcing additional inventory');
    }
    
    // Seasonal recommendations
    if (prediction.factors.seasonality > 0.1) {
      recommendations.push('Seasonal price increase expected - adjust pricing strategy');
    } else if (prediction.factors.seasonality < -0.1) {
      recommendations.push('Seasonal price decrease expected - consider volume sales');
    }
    
    // Confidence-based recommendations
    if (prediction.confidence < 0.5) {
      recommendations.push('Low prediction confidence - monitor market closely');
      recommendations.push('Consider A/B testing different price points');
    }
    
    // Market volatility recommendations
    if (marketData.totalTransactions < 10) {
      recommendations.push('Limited market data - start with competitive pricing');
    }
    
    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  /**
   * Get price trends for a category
   */
  static async getPriceTrends(category: string, days: number = 30): Promise<{
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
    dataPoints: Array<{ date: string; avgPrice: number; volume: number }>;
  }> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          DATE(n.created_at) as date,
          AVG(n.final_price) as avg_price,
          COUNT(*) as volume
        FROM negotiations n
        WHERE n.product_category = $1
        AND n.created_at >= NOW() - INTERVAL '${days} days'
        AND n.status = 'completed'
        GROUP BY DATE(n.created_at)
        ORDER BY date ASC
      `;
      
      const result = await client.query(query, [category]);
      const dataPoints = result.rows.map(row => ({
        date: row.date,
        avgPrice: parseFloat(row.avg_price),
        volume: parseInt(row.volume)
      }));
      
      // Calculate trend
      if (dataPoints.length < 2) {
        return {
          trend: 'stable',
          changePercent: 0,
          dataPoints
        };
      }
      
      const firstPrice = dataPoints[0].avgPrice;
      const lastPrice = dataPoints[dataPoints.length - 1].avgPrice;
      const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;
      
      let trend: 'increasing' | 'decreasing' | 'stable';
      if (changePercent > 5) trend = 'increasing';
      else if (changePercent < -5) trend = 'decreasing';
      else trend = 'stable';
      
      return {
        trend,
        changePercent: Math.round(changePercent * 100) / 100,
        dataPoints
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get competitive pricing analysis
   */
  static async getCompetitivePricing(productId: string, category: string): Promise<{
    averageMarketPrice: number;
    competitorPrices: Array<{ vendorId: string; price: number; rating: number }>;
    pricePosition: 'below' | 'at' | 'above';
    recommendation: string;
  }> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          p.vendor_id,
          p.price,
          COALESCE(v.rating, 4.0) as rating
        FROM products p
        LEFT JOIN users v ON p.vendor_id = v.id
        WHERE p.category = $1
        AND p.is_active = true
        AND p.stock_quantity > 0
        AND p.id != $2
        ORDER BY p.price ASC
        LIMIT 10
      `;
      
      const result = await client.query(query, [category, productId]);
      
      const competitorPrices = result.rows.map(row => ({
        vendorId: row.vendor_id,
        price: parseFloat(row.price),
        rating: parseFloat(row.rating)
      }));
      
      const averageMarketPrice = competitorPrices.length > 0
        ? competitorPrices.reduce((sum, item) => sum + item.price, 0) / competitorPrices.length
        : 0;
      
      // Get current product price
      const currentPriceQuery = `SELECT price FROM products WHERE id = $1`;
      const currentPriceResult = await client.query(currentPriceQuery, [productId]);
      const currentPrice = parseFloat(currentPriceResult.rows[0]?.price || '0');
      
      let pricePosition: 'below' | 'at' | 'above';
      let recommendation: string;
      
      if (currentPrice < averageMarketPrice * 0.95) {
        pricePosition = 'below';
        recommendation = 'Your price is below market average - consider increasing for better margins';
      } else if (currentPrice > averageMarketPrice * 1.05) {
        pricePosition = 'above';
        recommendation = 'Your price is above market average - ensure value justification';
      } else {
        pricePosition = 'at';
        recommendation = 'Your price is competitive with market average';
      }
      
      return {
        averageMarketPrice: Math.round(averageMarketPrice * 100) / 100,
        competitorPrices,
        pricePosition,
        recommendation
      };
    } finally {
      client.release();
    }
  }
}