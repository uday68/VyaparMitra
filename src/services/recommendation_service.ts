import { logger } from '../utils/logger';
import { getPool } from '../db/postgres';
import { getRedisClient, RedisService } from '../db/redis';
import { TranslationService } from './translation_service';

interface RecommendationRequest {
  userId: string;
  userType: 'customer' | 'vendor';
  context?: 'browsing' | 'negotiating' | 'purchasing' | 'voice_search';
  currentProductId?: string;
  voiceQuery?: string;
  language?: string;
  location?: string;
  budget?: {
    min: number;
    max: number;
  };
}

interface ProductRecommendation {
  productId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  vendorId: string;
  vendorName: string;
  rating: number;
  imageUrl?: string;
  distance?: number;
  reasonForRecommendation: string;
  confidence: number;
  voiceDescription?: string;
}

interface VoiceRecommendationResponse {
  recommendations: ProductRecommendation[];
  spokenResponse: string;
  followUpQuestions: string[];
  searchIntent: string;
  totalResults: number;
}

export class RecommendationService {
  private static readonly CACHE_TTL = 1800; // 30 minutes
  private static readonly MAX_RECOMMENDATIONS = 10;
  private static readonly VOICE_DESCRIPTION_LENGTH = 50; // words

  /**
   * Get personalized product recommendations
   */
  static async getRecommendations(request: RecommendationRequest): Promise<ProductRecommendation[]> {
    try {
      const cacheKey = `recommendations:${request.userId}:${request.context}:${request.currentProductId || 'none'}`;
      // Redis handled by RedisService
      
      // Check cache first
      const cached = await RedisService.get(cacheKey);
      if (cached) {
        logger.info('Recommendations served from cache', { userId: request.userId });
        return JSON.parse(cached);
      }

      let recommendations: ProductRecommendation[] = [];

      // Apply different recommendation strategies based on context
      switch (request.context) {
        case 'browsing':
          recommendations = await this.getBrowsingRecommendations(request);
          break;
        case 'negotiating':
          recommendations = await this.getNegotiationRecommendations(request);
          break;
        case 'purchasing':
          recommendations = await this.getPurchaseRecommendations(request);
          break;
        case 'voice_search':
          recommendations = await this.getVoiceSearchRecommendations(request);
          break;
        default:
          recommendations = await this.getGeneralRecommendations(request);
      }

      // Apply personalization filters
      recommendations = await this.applyPersonalizationFilters(recommendations, request);
      
      // Sort by confidence and relevance
      recommendations = recommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, this.MAX_RECOMMENDATIONS);

      // Cache the result
      await RedisService.setWithTTL(cacheKey, this.CACHE_TTL, JSON.stringify(recommendations));
      
      logger.info('Recommendations generated', {
        userId: request.userId,
        context: request.context,
        count: recommendations.length
      });

      return recommendations;
    } catch (error) {
      logger.error('Recommendation generation failed', { error, request });
      throw new Error('Failed to generate recommendations');
    }
  }

  /**
   * Get voice-enabled recommendations with spoken response
   */
  static async getVoiceRecommendations(request: RecommendationRequest): Promise<VoiceRecommendationResponse> {
    try {
      // Parse voice query to understand intent
      const searchIntent = await this.parseVoiceIntent(request.voiceQuery || '', request.language || 'en');
      
      // Get recommendations based on voice intent
      const voiceRequest = {
        ...request,
        context: 'voice_search' as const
      };
      
      const recommendations = await this.getRecommendations(voiceRequest);
      
      // Generate voice descriptions for each recommendation
      const voiceRecommendations = await Promise.all(
        recommendations.map(async (rec) => ({
          ...rec,
          voiceDescription: await this.generateVoiceDescription(rec, request.language || 'en')
        }))
      );
      
      // Generate spoken response
      const spokenResponse = await this.generateSpokenResponse(
        voiceRecommendations,
        searchIntent,
        request.language || 'en'
      );
      
      // Generate follow-up questions
      const followUpQuestions = await this.generateFollowUpQuestions(
        searchIntent,
        voiceRecommendations.length,
        request.language || 'en'
      );
      
      return {
        recommendations: voiceRecommendations,
        spokenResponse,
        followUpQuestions,
        searchIntent,
        totalResults: voiceRecommendations.length
      };
    } catch (error) {
      logger.error('Voice recommendation generation failed', { error, request });
      throw new Error('Failed to generate voice recommendations');
    }
  }

  /**
   * Get browsing-based recommendations
   */
  private static async getBrowsingRecommendations(request: RecommendationRequest): Promise<ProductRecommendation[]> {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // Get user's browsing history and preferences
      const userPreferencesQuery = `
        SELECT 
          p.category,
          COUNT(*) as view_count,
          AVG(p.price) as avg_price_viewed
        FROM user_product_views upv
        JOIN products p ON upv.product_id = p.id
        WHERE upv.user_id = $1
        AND upv.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY p.category
        ORDER BY view_count DESC
        LIMIT 3
      `;
      
      const preferencesResult = await client.query(userPreferencesQuery, [request.userId]);
      const preferredCategories = preferencesResult.rows.map(row => row.category);
      
      if (preferredCategories.length === 0) {
        // New user - return popular products
        return await this.getPopularProducts(request);
      }
      
      // Get recommendations based on preferred categories
      const recommendationsQuery = `
        SELECT 
          p.id as product_id,
          p.name,
          p.description,
          p.price,
          p.category,
          p.vendor_id,
          u.name as vendor_name,
          COALESCE(u.rating, 4.0) as rating,
          p.image_url,
          'Based on your browsing history in ' || p.category as reason
        FROM products p
        JOIN users u ON p.vendor_id = u.id
        WHERE p.category = ANY($1)
        AND p.is_active = true
        AND p.stock_quantity > 0
        AND p.vendor_id != $2
        ORDER BY 
          CASE WHEN p.category = $3 THEN 1 ELSE 2 END,
          p.rating DESC,
          p.created_at DESC
        LIMIT $4
      `;
      
      const result = await client.query(recommendationsQuery, [
        preferredCategories,
        request.userId,
        preferredCategories[0], // Prioritize most viewed category
        this.MAX_RECOMMENDATIONS
      ]);
      
      return result.rows.map(row => ({
        productId: row.product_id,
        name: row.name,
        description: row.description,
        price: parseFloat(row.price),
        category: row.category,
        vendorId: row.vendor_id,
        vendorName: row.vendor_name,
        rating: parseFloat(row.rating),
        imageUrl: row.image_url,
        reasonForRecommendation: row.reason,
        confidence: 0.8
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get negotiation-based recommendations (similar or complementary products)
   */
  private static async getNegotiationRecommendations(request: RecommendationRequest): Promise<ProductRecommendation[]> {
    if (!request.currentProductId) {
      return await this.getGeneralRecommendations(request);
    }
    
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // Get current product details
      const currentProductQuery = `
        SELECT category, price, name FROM products WHERE id = $1
      `;
      const currentProductResult = await client.query(currentProductQuery, [request.currentProductId]);
      
      if (currentProductResult.rows.length === 0) {
        return await this.getGeneralRecommendations(request);
      }
      
      const currentProduct = currentProductResult.rows[0];
      
      // Get similar products and complementary products
      const recommendationsQuery = `
        SELECT 
          p.id as product_id,
          p.name,
          p.description,
          p.price,
          p.category,
          p.vendor_id,
          u.name as vendor_name,
          COALESCE(u.rating, 4.0) as rating,
          p.image_url,
          CASE 
            WHEN p.category = $2 THEN 'Similar product in same category'
            ELSE 'Frequently bought together'
          END as reason
        FROM products p
        JOIN users u ON p.vendor_id = u.id
        WHERE (
          p.category = $2 -- Same category
          OR p.id IN (
            SELECT DISTINCT p2.id
            FROM negotiations n1
            JOIN negotiations n2 ON n1.user_id = n2.user_id
            JOIN products p2 ON n2.product_id = p2.id
            WHERE n1.product_id = $1
            AND n2.product_id != $1
            AND n1.status = 'completed'
            AND n2.status = 'completed'
          )
        )
        AND p.id != $1
        AND p.is_active = true
        AND p.stock_quantity > 0
        AND p.price BETWEEN $3 AND $4
        ORDER BY 
          CASE WHEN p.category = $2 THEN 1 ELSE 2 END,
          ABS(p.price - $5),
          p.rating DESC
        LIMIT $6
      `;
      
      const result = await client.query(recommendationsQuery, [
        request.currentProductId,
        currentProduct.category,
        currentProduct.price * 0.5, // 50% lower
        currentProduct.price * 1.5, // 50% higher
        currentProduct.price,
        this.MAX_RECOMMENDATIONS
      ]);
      
      return result.rows.map(row => ({
        productId: row.product_id,
        name: row.name,
        description: row.description,
        price: parseFloat(row.price),
        category: row.category,
        vendorId: row.vendor_id,
        vendorName: row.vendor_name,
        rating: parseFloat(row.rating),
        imageUrl: row.image_url,
        reasonForRecommendation: row.reason,
        confidence: 0.85
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get voice search recommendations based on natural language query
   */
  private static async getVoiceSearchRecommendations(request: RecommendationRequest): Promise<ProductRecommendation[]> {
    if (!request.voiceQuery) {
      return await this.getGeneralRecommendations(request);
    }
    
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // Extract keywords from voice query
      const keywords = await this.extractKeywords(request.voiceQuery, request.language || 'en');
      
      // Build search query with keyword matching
      const searchQuery = `
        SELECT 
          p.id as product_id,
          p.name,
          p.description,
          p.price,
          p.category,
          p.vendor_id,
          u.name as vendor_name,
          COALESCE(u.rating, 4.0) as rating,
          p.image_url,
          'Matches your voice search' as reason,
          (
            CASE WHEN LOWER(p.name) LIKE ANY($1) THEN 3 ELSE 0 END +
            CASE WHEN LOWER(p.description) LIKE ANY($1) THEN 2 ELSE 0 END +
            CASE WHEN LOWER(p.category) LIKE ANY($1) THEN 1 ELSE 0 END
          ) as relevance_score
        FROM products p
        JOIN users u ON p.vendor_id = u.id
        WHERE (
          LOWER(p.name) LIKE ANY($1)
          OR LOWER(p.description) LIKE ANY($1)
          OR LOWER(p.category) LIKE ANY($1)
        )
        AND p.is_active = true
        AND p.stock_quantity > 0
        ${request.budget ? 'AND p.price BETWEEN $2 AND $3' : ''}
        ORDER BY relevance_score DESC, p.rating DESC
        LIMIT $${request.budget ? '4' : '2'}
      `;
      
      const searchPatterns = keywords.map(keyword => `%${keyword.toLowerCase()}%`);
      const queryParams = [searchPatterns];
      
      if (request.budget) {
        queryParams.push(request.budget.min, request.budget.max);
      }
      
      const result = await client.query(searchQuery, queryParams);
      
      return result.rows.map(row => ({
        productId: row.product_id,
        name: row.name,
        description: row.description,
        price: parseFloat(row.price),
        category: row.category,
        vendorId: row.vendor_id,
        vendorName: row.vendor_name,
        rating: parseFloat(row.rating),
        imageUrl: row.image_url,
        reasonForRecommendation: row.reason,
        confidence: Math.min(0.9, 0.5 + (row.relevance_score * 0.1))
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get general recommendations for new users
   */
  private static async getGeneralRecommendations(request: RecommendationRequest): Promise<ProductRecommendation[]> {
    return await this.getPopularProducts(request);
  }

  /**
   * Get popular products as fallback recommendations
   */
  private static async getPopularProducts(request: RecommendationRequest): Promise<ProductRecommendation[]> {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          p.id as product_id,
          p.name,
          p.description,
          p.price,
          p.category,
          p.vendor_id,
          u.name as vendor_name,
          COALESCE(u.rating, 4.0) as rating,
          p.image_url,
          'Popular product' as reason,
          COUNT(n.id) as negotiation_count
        FROM products p
        JOIN users u ON p.vendor_id = u.id
        LEFT JOIN negotiations n ON p.id = n.product_id AND n.created_at >= NOW() - INTERVAL '30 days'
        WHERE p.is_active = true
        AND p.stock_quantity > 0
        ${request.budget ? 'AND p.price BETWEEN $1 AND $2' : ''}
        GROUP BY p.id, p.name, p.description, p.price, p.category, p.vendor_id, u.name, u.rating, p.image_url
        ORDER BY negotiation_count DESC, p.rating DESC
        LIMIT $${request.budget ? '3' : '1'}
      `;
      
      const queryParams = [];
      if (request.budget) {
        queryParams.push(request.budget.min, request.budget.max);
      }
      queryParams.push(this.MAX_RECOMMENDATIONS);
      
      const result = await client.query(query, queryParams);
      
      return result.rows.map(row => ({
        productId: row.product_id,
        name: row.name,
        description: row.description,
        price: parseFloat(row.price),
        category: row.category,
        vendorId: row.vendor_id,
        vendorName: row.vendor_name,
        rating: parseFloat(row.rating),
        imageUrl: row.image_url,
        reasonForRecommendation: row.reason,
        confidence: 0.7
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Apply personalization filters based on user preferences
   */
  private static async applyPersonalizationFilters(
    recommendations: ProductRecommendation[],
    request: RecommendationRequest
  ): Promise<ProductRecommendation[]> {
    // Filter by budget if specified
    if (request.budget) {
      recommendations = recommendations.filter(rec => 
        rec.price >= request.budget!.min && rec.price <= request.budget!.max
      );
    }
    
    // Add location-based distance if available
    if (request.location) {
      // This would integrate with a geolocation service
      recommendations = recommendations.map(rec => ({
        ...rec,
        distance: Math.random() * 10 // Mock distance for now
      }));
    }
    
    return recommendations;
  }

  /**
   * Parse voice intent from natural language query
   */
  private static async parseVoiceIntent(voiceQuery: string, language: string): Promise<string> {
    // Translate to English if needed
    let query = voiceQuery;
    if (language !== 'en') {
      try {
        query = await TranslationService.translateText(voiceQuery, language, 'en');
      } catch (error) {
        logger.warn('Translation failed for voice intent parsing', { error, voiceQuery });
      }
    }
    
    // Simple intent classification (in production, use NLP service)
    const intentPatterns = {
      'search_product': ['find', 'search', 'looking for', 'need', 'want'],
      'compare_prices': ['compare', 'cheaper', 'better price', 'cost'],
      'category_browse': ['show me', 'browse', 'what do you have'],
      'specific_item': ['apple', 'rice', 'tomato', 'onion', 'potato']
    };
    
    const lowerQuery = query.toLowerCase();
    
    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some(pattern => lowerQuery.includes(pattern))) {
        return intent;
      }
    }
    
    return 'general_search';
  }

  /**
   * Extract keywords from voice query
   */
  private static async extractKeywords(voiceQuery: string, language: string): Promise<string[]> {
    // Translate to English if needed
    let query = voiceQuery;
    if (language !== 'en') {
      try {
        query = await TranslationService.translateText(voiceQuery, language, 'en');
      } catch (error) {
        logger.warn('Translation failed for keyword extraction', { error, voiceQuery });
        query = voiceQuery; // Use original if translation fails
      }
    }
    
    // Simple keyword extraction (in production, use NLP service)
    const stopWords = ['i', 'want', 'need', 'looking', 'for', 'find', 'show', 'me', 'the', 'a', 'an'];
    const words = query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Generate voice description for a product
   */
  private static async generateVoiceDescription(
    product: ProductRecommendation,
    language: string
  ): Promise<string> {
    const description = `${product.name} in ${product.category} category, priced at ₹${product.price}, rated ${product.rating} stars by ${product.vendorName}`;
    
    if (language !== 'en') {
      try {
        return await TranslationService.translateText(description, 'en', language);
      } catch (error) {
        logger.warn('Translation failed for voice description', { error, productId: product.productId });
      }
    }
    
    return description;
  }

  /**
   * Generate spoken response for voice recommendations
   */
  private static async generateSpokenResponse(
    recommendations: ProductRecommendation[],
    searchIntent: string,
    language: string
  ): Promise<string> {
    let response = '';
    
    if (recommendations.length === 0) {
      response = "I couldn't find any products matching your request. Would you like to try a different search?";
    } else if (recommendations.length === 1) {
      const product = recommendations[0];
      response = `I found ${product.name} for ₹${product.price} from ${product.vendorName}. ${product.reasonForRecommendation}. Would you like to hear more details?`;
    } else {
      response = `I found ${recommendations.length} products for you. The top recommendation is ${recommendations[0].name} for ₹${recommendations[0].price}. Would you like to hear about all options or start negotiating for this one?`;
    }
    
    if (language !== 'en') {
      try {
        return await TranslationService.translateText(response, 'en', language);
      } catch (error) {
        logger.warn('Translation failed for spoken response', { error });
      }
    }
    
    return response;
  }

  /**
   * Generate follow-up questions for voice interaction
   */
  private static async generateFollowUpQuestions(
    searchIntent: string,
    resultCount: number,
    language: string
  ): Promise<string[]> {
    let questions: string[] = [];
    
    if (resultCount === 0) {
      questions = [
        "Would you like to search in a different category?",
        "Should I show you popular products instead?",
        "Would you like to adjust your budget range?"
      ];
    } else if (resultCount === 1) {
      questions = [
        "Would you like to start negotiating the price?",
        "Should I find similar products?",
        "Would you like to hear more details about this product?"
      ];
    } else {
      questions = [
        "Would you like to hear about all the options?",
        "Should I filter by price range?",
        "Would you like to start with the top recommendation?"
      ];
    }
    
    if (language !== 'en') {
      try {
        const translatedQuestions = await Promise.all(
          questions.map(q => TranslationService.translateText(q, 'en', language))
        );
        return translatedQuestions;
      } catch (error) {
        logger.warn('Translation failed for follow-up questions', { error });
      }
    }
    
    return questions;
  }

  /**
   * Track user interaction with recommendations for learning
   */
  static async trackRecommendationInteraction(
    userId: string,
    productId: string,
    action: 'viewed' | 'clicked' | 'negotiated' | 'purchased' | 'ignored'
  ): Promise<void> {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO recommendation_interactions (user_id, product_id, action, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id, product_id, action, DATE(created_at))
        DO UPDATE SET interaction_count = recommendation_interactions.interaction_count + 1
      `;
      
      await client.query(query, [userId, productId, action]);
      
      logger.info('Recommendation interaction tracked', {
        userId,
        productId,
        action
      });
    } catch (error) {
      logger.error('Failed to track recommendation interaction', { error, userId, productId, action });
    } finally {
      client.release();
    }
  }
}