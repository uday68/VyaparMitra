import { logger } from '../utils/logger';
import { pool } from '../db/postgres';
import { getRedisClient } from '../db/redis';

interface SocialProfile {
  userId: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  joinedDate: Date;
  stats: {
    totalPurchases: number;
    totalSales: number;
    averageRating: number;
    reviewCount: number;
    followersCount: number;
    followingCount: number;
  };
  badges: Array<{
    type: 'verified_buyer' | 'top_seller' | 'community_helper' | 'early_adopter' | 'voice_champion';
    name: string;
    description: string;
    earnedDate: Date;
  }>;
  preferences: {
    publicProfile: boolean;
    showPurchaseHistory: boolean;
    allowRecommendations: boolean;
    voiceInteractionPublic: boolean;
  };
}

interface SocialFeed {
  posts: Array<{
    id: string;
    userId: string;
    userDisplayName: string;
    userAvatar?: string;
    type: 'product_review' | 'negotiation_success' | 'recommendation' | 'achievement' | 'community_tip';
    content: string;
    metadata: {
      productId?: string;
      productName?: string;
      negotiationId?: string;
      rating?: number;
      price?: number;
      category?: string;
    };
    engagement: {
      likes: number;
      comments: number;
      shares: number;
      userHasLiked: boolean;
    };
    createdAt: Date;
    language: string;
  }>;
  hasMore: boolean;
  nextCursor?: string;
}

interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;