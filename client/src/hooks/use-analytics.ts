import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

// Types for analytics data
interface PricePrediction {
  predictedPrice: number;
  confidence: number;
  priceRange: { min: number; max: number };
  factors: {
    demand: number;
    supply: number;
    seasonality: number;
    location: number;
  };
  recommendations: string[];
}

interface MarketInsight {
  category: string;
  currentTrend: 'rising' | 'falling' | 'stable';
  priceChange: number;
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

interface InventoryAnalytics {
  totalProducts: number;
  totalValue: number;
  lowStockAlerts: number;
  fastMovingItems: Array<{
    productId: string;
    name: string;
    category: string;
    salesVelocity: number;
    stockLevel: number;
    daysUntilStockout: number;
  }>;
  slowMovingItems: Array<{
    productId: string;
    name: string;
    category: string;
    daysSinceLastSale: number;
    stockLevel: number;
    recommendedAction: string;
  }>;
  categoryPerformance: Array<{
    category: string;
    totalSales: number;
    averageMargin: number;
    turnoverRate: number;
  }>;
  reorderRecommendations: Array<{
    productId: string;
    name: string;
    currentStock: number;
    recommendedOrder: number;
    urgency: 'high' | 'medium' | 'low';
  }>;
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

// Price Prediction Hooks
export function usePricePrediction(
  productId: string,
  category: string,
  options?: {
    seasonality?: string;
    location?: string;
    quantity?: number;
  }
) {
  const { tokens } = useAuth();
  
  return useQuery({
    queryKey: ['price-prediction', productId, category, options],
    queryFn: async (): Promise<PricePrediction> => {
      const params = new URLSearchParams({
        category,
        ...(options?.seasonality && { seasonality: options.seasonality }),
        ...(options?.location && { location: options.location }),
        ...(options?.quantity && { quantity: options.quantity.toString() }),
      });

      const res = await fetch(`/api/analytics/price-prediction/${productId}?${params}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch price prediction');
      const data = await res.json();
      return data.data;
    },
    enabled: !!productId && !!category && !!tokens?.accessToken,
  });
}

export function usePriceTrends(category: string, days: number = 30) {
  const { tokens } = useAuth();
  
  return useQuery({
    queryKey: ['price-trends', category, days],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/price-trends/${category}?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch price trends');
      const data = await res.json();
      return data.data;
    },
    enabled: !!category && !!tokens?.accessToken,
  });
}

export function useCompetitivePricing(productId: string, category: string) {
  const { tokens } = useAuth();
  
  return useQuery({
    queryKey: ['competitive-pricing', productId, category],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/competitive-pricing/${productId}/${category}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch competitive pricing');
      const data = await res.json();
      return data.data;
    },
    enabled: !!productId && !!category && !!tokens?.accessToken,
  });
}

// Market Insights Hooks
export function useMarketInsights(category: string) {
  const { tokens } = useAuth();
  
  return useQuery({
    queryKey: ['market-insights', category],
    queryFn: async (): Promise<MarketInsight> => {
      const res = await fetch(`/api/analytics/market-insights/${category}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch market insights');
      const data = await res.json();
      return data.data;
    },
    enabled: !!category && !!tokens?.accessToken,
  });
}

export function useMarketAlerts(vendorId: string, categories?: string[]) {
  const { tokens } = useAuth();
  
  return useQuery({
    queryKey: ['market-alerts', vendorId, categories],
    queryFn: async () => {
      const params = categories ? `?categories=${categories.join(',')}` : '';
      const res = await fetch(`/api/analytics/market-alerts/${vendorId}${params}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch market alerts');
      const data = await res.json();
      return data.data;
    },
    enabled: !!vendorId && !!tokens?.accessToken,
  });
}

export function useCompetitorAnalysis(vendorId: string, category: string) {
  const { tokens } = useAuth();
  
  return useQuery({
    queryKey: ['competitor-analysis', vendorId, category],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/competitor-analysis/${vendorId}/${category}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch competitor analysis');
      const data = await res.json();
      return data.data;
    },
    enabled: !!vendorId && !!category && !!tokens?.accessToken,
  });
}

export function useDemandForecast(category: string, timeframe: '7d' | '30d' | '90d' = '30d') {
  const { tokens } = useAuth();
  
  return useQuery({
    queryKey: ['demand-forecast', category, timeframe],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/demand-forecast/${category}?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch demand forecast');
      const data = await res.json();
      return data.data;
    },
    enabled: !!category && !!tokens?.accessToken,
  });
}

// Inventory Analytics Hooks
export function useInventoryAnalytics(vendorId: string) {
  const { tokens } = useAuth();
  
  return useQuery({
    queryKey: ['inventory-analytics', vendorId],
    queryFn: async (): Promise<InventoryAnalytics> => {
      const res = await fetch(`/api/analytics/inventory/${vendorId}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch inventory analytics');
      const data = await res.json();
      return data.data;
    },
    enabled: !!vendorId && !!tokens?.accessToken,
  });
}

export function useProfitabilityAnalysis(vendorId: string, days: number = 90) {
  const { tokens } = useAuth();
  
  return useQuery({
    queryKey: ['profitability-analysis', vendorId, days],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/profitability/${vendorId}?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch profitability analysis');
      const data = await res.json();
      return data.data;
    },
    enabled: !!vendorId && !!tokens?.accessToken,
  });
}

export function useInventoryAlerts(vendorId: string) {
  const { tokens } = useAuth();
  
  return useQuery({
    queryKey: ['inventory-alerts', vendorId],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/inventory-alerts/${vendorId}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch inventory alerts');
      const data = await res.json();
      return data.data;
    },
    enabled: !!vendorId && !!tokens?.accessToken,
  });
}

// Recommendations Hooks
export function useRecommendations(request: {
  context?: 'browsing' | 'negotiating' | 'purchasing' | 'voice_search';
  currentProductId?: string;
  voiceQuery?: string;
  language?: string;
  location?: string;
  budget?: { min: number; max: number };
}) {
  const { tokens } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (): Promise<ProductRecommendation[]> => {
      const res = await fetch('/api/analytics/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(request),
      });
      
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      const data = await res.json();
      return data.data;
    },
  });
}

export function useVoiceRecommendations() {
  const { tokens } = useAuth();
  
  return useMutation({
    mutationFn: async (request: {
      voiceQuery: string;
      language?: string;
      location?: string;
      budget?: { min: number; max: number };
    }) => {
      const res = await fetch('/api/analytics/voice-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(request),
      });
      
      if (!res.ok) throw new Error('Failed to fetch voice recommendations');
      const data = await res.json();
      return data.data;
    },
  });
}

export function useTrackRecommendationInteraction() {
  const { tokens } = useAuth();
  
  return useMutation({
    mutationFn: async (interaction: {
      productId: string;
      action: 'viewed' | 'clicked' | 'negotiated' | 'purchased' | 'ignored';
    }) => {
      const res = await fetch('/api/analytics/recommendation-interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(interaction),
      });
      
      if (!res.ok) throw new Error('Failed to track interaction');
      const data = await res.json();
      return data.data;
    },
  });
}

// Negotiation Analytics Hooks
export function useNegotiationAnalytics(category?: string) {
  const { tokens } = useAuth();
  
  return useQuery({
    queryKey: ['negotiation-analytics', category],
    queryFn: async () => {
      const params = category ? `?category=${category}` : '';
      const res = await fetch(`/api/analytics/negotiation-analytics${params}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch negotiation analytics');
      const data = await res.json();
      return data.data;
    },
    enabled: !!tokens?.accessToken,
  });
}

export function useNegotiationInsights(category?: string) {
  const { tokens } = useAuth();
  
  return useQuery({
    queryKey: ['negotiation-insights', category],
    queryFn: async () => {
      const params = category ? `?category=${category}` : '';
      const res = await fetch(`/api/analytics/negotiation-insights${params}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch negotiation insights');
      const data = await res.json();
      return data.data;
    },
    enabled: !!tokens?.accessToken,
  });
}

// Analytics Health Check
export function useAnalyticsHealth() {
  return useQuery({
    queryKey: ['analytics-health'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/health');
      if (!res.ok) throw new Error('Analytics health check failed');
      const data = await res.json();
      return data.data;
    },
    refetchInterval: 30000, // Check every 30 seconds
  });
}

// Social Commerce Hooks
export function useCreateSocialPost() {
  const { tokens } = useAuth();
  
  return useMutation({
    mutationFn: async (postData: {
      type: 'product_showcase' | 'deal_share' | 'review' | 'recommendation' | 'success_story';
      content: string;
      productId?: string;
      negotiationId?: string;
      images?: string[];
      language?: string;
      location?: string;
      tags?: string[];
    }) => {
      const res = await fetch('/api/analytics/social/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(postData),
      });
      
      if (!res.ok) throw new Error('Failed to create social post');
      const data = await res.json();
      return data.data;
    },
  });
}

export function useSocialFeed(options: {
  page?: number;
  limit?: number;
  type?: string;
  language?: string;
} = {}) {
  const { tokens } = useAuth();
  
  return useQuery({
    queryKey: ['social-feed', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.type) params.append('type', options.type);
      if (options.language) params.append('language', options.language);

      const res = await fetch(`/api/analytics/social/feed?${params}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch social feed');
      const data = await res.json();
      return data.data;
    },
    enabled: !!tokens?.accessToken,
  });
}

export function useTogglePostLike() {
  const { tokens } = useAuth();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/analytics/social/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to toggle post like');
      const data = await res.json();
      return data.data;
    },
  });
}

export function useAddComment() {
  const { tokens } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, content, language }: {
      postId: string;
      content: string;
      language?: string;
    }) => {
      const res = await fetch(`/api/analytics/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ content, language }),
      });
      
      if (!res.ok) throw new Error('Failed to add comment');
      const data = await res.json();
      return data.data;
    },
  });
}

export function useInfluencers(limit?: number) {
  const { tokens } = useAuth();
  
  return useQuery({
    queryKey: ['influencers', limit],
    queryFn: async () => {
      const params = limit ? `?limit=${limit}` : '';
      const res = await fetch(`/api/analytics/social/influencers${params}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch influencers');
      const data = await res.json();
      return data.data;
    },
    enabled: !!tokens?.accessToken,
  });
}

export function useCreateChallenge() {
  const { tokens } = useAuth();
  
  return useMutation({
    mutationFn: async (challengeData: {
      title: string;
      description: string;
      type: 'best_deal' | 'product_photo' | 'negotiation_story' | 'vendor_spotlight';
      startDate: Date;
      endDate: Date;
      prizes: Array<{ position: number; reward: string; value: number }>;
      rules: string[];
      hashtags: string[];
    }) => {
      const res = await fetch('/api/analytics/social/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(challengeData),
      });
      
      if (!res.ok) throw new Error('Failed to create challenge');
      const data = await res.json();
      return data.data;
    },
  });
}