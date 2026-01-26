import express from 'express';
import { PricePredictionService } from '../services/price_prediction_service';
import { MarketInsightsService } from '../services/market_insights_service';
import { InventoryAnalyticsService } from '../services/inventory_analytics_service';
import { RecommendationService } from '../services/recommendation_service';
import { NegotiationAnalyticsService } from '../services/negotiation_analytics_service';
import { SocialCommerceService } from '../services/social_commerce_service';
import { authenticateToken, requireUserType, AuthenticatedRequest } from '../middleware/auth';
import { rateLimiters } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';

const router = express.Router();

// Price Prediction Endpoints
router.get('/price-prediction/:productId',
  authenticateToken,
  rateLimiters.analytics,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { productId } = req.params;
      const { category, seasonality, location, quantity } = req.query;

      const prediction = await PricePredictionService.predictPrice({
        productId,
        category: category as string,
        seasonality: seasonality as string,
        location: location as string,
        quantity: quantity ? parseInt(quantity as string) : undefined
      });

      res.json({ success: true, data: prediction });
    } catch (error) {
      logger.error('Price prediction failed', { error, productId: req.params.productId });
      res.status(500).json({ success: false, error: 'Failed to generate price prediction' });
    }
  }
);

router.get('/price-trends/:category',
  authenticateToken,
  rateLimiters.analytics,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { category } = req.params;
      const { days } = req.query;

      const trends = await PricePredictionService.getPriceTrends(
        category,
        days ? parseInt(days as string) : 30
      );

      res.json({ success: true, data: trends });
    } catch (error) {
      logger.error('Price trends fetch failed', { error, category: req.params.category });
      res.status(500).json({ success: false, error: 'Failed to fetch price trends' });
    }
  }
);

router.get('/competitive-pricing/:productId/:category',
  authenticateToken,
  requireUserType('vendor'),
  rateLimiters.analytics,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { productId, category } = req.params;

      const analysis = await PricePredictionService.getCompetitivePricing(productId, category);

      res.json({ success: true, data: analysis });
    } catch (error) {
      logger.error('Competitive pricing analysis failed', { error, productId: req.params.productId });
      res.status(500).json({ success: false, error: 'Failed to analyze competitive pricing' });
    }
  }
);

// Market Insights Endpoints
router.get('/market-insights/:category',
  authenticateToken,
  rateLimiters.analytics,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { category } = req.params;
      const vendorId = req.user?.type === 'vendor' ? req.user.id : undefined;

      const insights = await MarketInsightsService.getMarketInsights(category, vendorId);

      res.json({ success: true, data: insights });
    } catch (error) {
      logger.error('Market insights fetch failed', { error, category: req.params.category });
      res.status(500).json({ success: false, error: 'Failed to fetch market insights' });
    }
  }
);

router.get('/market-alerts/:vendorId',
  authenticateToken,
  requireUserType('vendor'),
  rateLimiters.analytics,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { vendorId } = req.params;
      const { categories } = req.query;

      // Ensure vendor can only access their own alerts
      if (req.user!.id !== vendorId) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const categoryList = categories ? (categories as string).split(',') : undefined;
      const alerts = await MarketInsightsService.getMarketAlerts(vendorId, categoryList);

      res.json({ success: true, data: alerts });
    } catch (error) {
      logger.error('Market alerts fetch failed', { error, vendorId: req.params.vendorId });
      res.status(500).json({ success: false, error: 'Failed to fetch market alerts' });
    }
  }
);

router.get('/competitor-analysis/:vendorId/:category',
  authenticateToken,
  requireUserType('vendor'),
  rateLimiters.analytics,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { vendorId, category } = req.params;

      // Ensure vendor can only access their own analysis
      if (req.user!.id !== vendorId) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const analysis = await MarketInsightsService.getCompetitorAnalysis(vendorId, category);

      res.json({ success: true, data: analysis });
    } catch (error) {
      logger.error('Competitor analysis failed', { error, vendorId: req.params.vendorId });
      res.status(500).json({ success: false, error: 'Failed to analyze competitors' });
    }
  }
);

router.get('/demand-forecast/:category',
  authenticateToken,
  rateLimiters.analytics,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { category } = req.params;
      const { timeframe } = req.query;

      const forecast = await MarketInsightsService.getDemandForecast(
        category,
        (timeframe as '7d' | '30d' | '90d') || '30d'
      );

      res.json({ success: true, data: forecast });
    } catch (error) {
      logger.error('Demand forecast failed', { error, category: req.params.category });
      res.status(500).json({ success: false, error: 'Failed to generate demand forecast' });
    }
  }
);

// Inventory Analytics Endpoints
router.get('/inventory/:vendorId',
  authenticateToken,
  requireUserType('vendor'),
  rateLimiters.analytics,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { vendorId } = req.params;

      // Ensure vendor can only access their own analytics
      if (req.user!.id !== vendorId) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const analytics = await InventoryAnalyticsService.getInventoryAnalytics(vendorId);

      res.json({ success: true, data: analytics });
    } catch (error) {
      logger.error('Inventory analytics failed', { error, vendorId: req.params.vendorId });
      res.status(500).json({ success: false, error: 'Failed to fetch inventory analytics' });
    }
  }
);

router.get('/profitability/:vendorId',
  authenticateToken,
  requireUserType('vendor'),
  rateLimiters.analytics,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { vendorId } = req.params;
      const { days } = req.query;

      // Ensure vendor can only access their own data
      if (req.user!.id !== vendorId) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const analysis = await InventoryAnalyticsService.getProfitabilityAnalysis(
        vendorId,
        days ? parseInt(days as string) : 90
      );

      res.json({ success: true, data: analysis });
    } catch (error) {
      logger.error('Profitability analysis failed', { error, vendorId: req.params.vendorId });
      res.status(500).json({ success: false, error: 'Failed to analyze profitability' });
    }
  }
);

router.get('/inventory-alerts/:vendorId',
  authenticateToken,
  requireUserType('vendor'),
  rateLimiters.analytics,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { vendorId } = req.params;

      // Ensure vendor can only access their own alerts
      if (req.user!.id !== vendorId) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const alerts = await InventoryAnalyticsService.generateInventoryAlerts(vendorId);

      res.json({ success: true, data: alerts });
    } catch (error) {
      logger.error('Inventory alerts failed', { error, vendorId: req.params.vendorId });
      res.status(500).json({ success: false, error: 'Failed to generate inventory alerts' });
    }
  }
);

// Recommendation Endpoints
router.post('/recommendations',
  authenticateToken,
  rateLimiters.recommendations,
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        context,
        currentProductId,
        voiceQuery,
        language,
        location,
        budget
      } = req.body;

      const request = {
        userId: req.user!.id,
        userType: req.user!.type as 'customer' | 'vendor',
        context,
        currentProductId,
        voiceQuery,
        language,
        location,
        budget
      };

      const recommendations = await RecommendationService.getRecommendations(request);

      res.json({ success: true, data: recommendations });
    } catch (error) {
      logger.error('Recommendations failed', { error, userId: req.user?.id });
      res.status(500).json({ success: false, error: 'Failed to generate recommendations' });
    }
  }
);

router.post('/voice-recommendations',
  authenticateToken,
  rateLimiters.recommendations,
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        voiceQuery,
        language,
        location,
        budget
      } = req.body;

      const request = {
        userId: req.user!.id,
        userType: req.user!.type as 'customer' | 'vendor',
        context: 'voice_search' as const,
        voiceQuery,
        language,
        location,
        budget
      };

      const recommendations = await RecommendationService.getVoiceRecommendations(request);

      res.json({ success: true, data: recommendations });
    } catch (error) {
      logger.error('Voice recommendations failed', { error, userId: req.user?.id });
      res.status(500).json({ success: false, error: 'Failed to generate voice recommendations' });
    }
  }
);

router.post('/recommendation-interaction',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { productId, action } = req.body;

      await RecommendationService.trackRecommendationInteraction(
        req.user!.id,
        productId,
        action
      );

      res.json({ success: true, message: 'Interaction tracked' });
    } catch (error) {
      logger.error('Recommendation interaction tracking failed', { error, userId: req.user?.id });
      res.status(500).json({ success: false, error: 'Failed to track interaction' });
    }
  }
);

// Negotiation Analytics Endpoints
router.get('/negotiation-analytics',
  authenticateToken,
  rateLimiters.analytics,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { category } = req.query;
      const vendorId = req.user?.type === 'vendor' ? req.user.id : undefined;
      const customerId = req.user?.type === 'customer' ? req.user.id : undefined;

      const analytics = await NegotiationAnalyticsService.getNegotiationAnalytics(
        vendorId,
        customerId,
        category as string
      );

      res.json({ success: true, data: analytics });
    } catch (error) {
      logger.error('Negotiation analytics failed', { error, userId: req.user?.id });
      res.status(500).json({ success: false, error: 'Failed to fetch negotiation analytics' });
    }
  }
);

router.get('/negotiation-insights',
  authenticateToken,
  rateLimiters.analytics,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { category } = req.query;
      const vendorId = req.user?.type === 'vendor' ? req.user.id : undefined;
      const customerId = req.user?.type === 'customer' ? req.user.id : undefined;

      const insights = await NegotiationAnalyticsService.generateNegotiationInsights(
        vendorId,
        customerId,
        category as string
      );

      res.json({ success: true, data: insights });
    } catch (error) {
      logger.error('Negotiation insights failed', { error, userId: req.user?.id });
      res.status(500).json({ success: false, error: 'Failed to generate negotiation insights' });
    }
  }
);

// Analytics Health Check
router.get('/health',
  async (req, res) => {
    try {
      const health = {
        pricePrediction: 'healthy',
        marketInsights: 'healthy',
        inventoryAnalytics: 'healthy',
        recommendations: 'healthy',
        negotiationAnalytics: 'healthy',
        socialCommerce: 'healthy',
        timestamp: new Date().toISOString()
      };

      res.json({ success: true, status: 'healthy', data: health });
    } catch (error) {
      res.status(503).json({ success: false, status: 'unhealthy', error: 'Analytics health check failed' });
    }
  }
);

// Social Commerce Endpoints
router.post('/social/posts',
  authenticateToken,
  rateLimiters.general,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { type, content, productId, negotiationId, images, language, location, tags } = req.body;

      const post = await SocialCommerceService.createPost(req.user!.id, {
        type,
        content,
        productId,
        negotiationId,
        images,
        language,
        location,
        tags
      });

      res.status(201).json({ success: true, data: post });
    } catch (error) {
      logger.error('Social post creation failed', { error, userId: req.user?.id });
      res.status(500).json({ success: false, error: 'Failed to create social post' });
    }
  }
);

router.get('/social/feed',
  authenticateToken,
  rateLimiters.general,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { page, limit, type, language } = req.query;

      const feed = await SocialCommerceService.getSocialFeed(req.user!.id, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        type: type as any,
        language: language as string
      });

      res.json({ success: true, data: feed });
    } catch (error) {
      logger.error('Social feed fetch failed', { error, userId: req.user?.id });
      res.status(500).json({ success: false, error: 'Failed to fetch social feed' });
    }
  }
);

router.post('/social/posts/:postId/like',
  authenticateToken,
  rateLimiters.general,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { postId } = req.params;

      const result = await SocialCommerceService.togglePostLike(req.user!.id, postId);

      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Post like toggle failed', { error, userId: req.user?.id, postId: req.params.postId });
      res.status(500).json({ success: false, error: 'Failed to toggle post like' });
    }
  }
);

router.post('/social/posts/:postId/comments',
  authenticateToken,
  rateLimiters.general,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { postId } = req.params;
      const { content, language } = req.body;

      const result = await SocialCommerceService.addComment(req.user!.id, postId, content, language);

      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Comment addition failed', { error, userId: req.user?.id, postId: req.params.postId });
      res.status(500).json({ success: false, error: 'Failed to add comment' });
    }
  }
);

router.get('/social/influencers',
  authenticateToken,
  rateLimiters.general,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { limit } = req.query;

      const influencers = await SocialCommerceService.getInfluencerProfiles(
        limit ? parseInt(limit as string) : undefined
      );

      res.json({ success: true, data: influencers });
    } catch (error) {
      logger.error('Influencers fetch failed', { error });
      res.status(500).json({ success: false, error: 'Failed to fetch influencers' });
    }
  }
);

router.post('/social/challenges',
  authenticateToken,
  requireUserType('vendor'),
  rateLimiters.general,
  async (req: AuthenticatedRequest, res) => {
    try {
      const challengeData = req.body;

      const challenge = await SocialCommerceService.createChallenge(challengeData);

      res.status(201).json({ success: true, data: challenge });
    } catch (error) {
      logger.error('Challenge creation failed', { error, userId: req.user?.id });
      res.status(500).json({ success: false, error: 'Failed to create challenge' });
    }
  }
);

export default router;