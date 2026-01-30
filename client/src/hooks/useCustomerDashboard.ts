import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useTranslation } from './useTranslation';

export interface CustomerStats {
  totalSpent: number;
  totalSaved: number;
  activeDeals: number;
  completedOrders: number;
  savingsPercentage: number;
  averageOrderValue: number;
}

export interface FeaturedDeal {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorLocation: string;
  product: string;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  image: string;
  rating: number;
  distance: string;
  endsIn: string;
  category: string;
}

export interface RecentVendor {
  id: string;
  name: string;
  location: string;
  rating: number;
  lastVisit: string;
  speciality: string;
  image: string;
  totalOrders: number;
  averageDiscount: number;
}

export interface PersonalizedRecommendation {
  id: string;
  type: 'product' | 'vendor' | 'category';
  title: string;
  description: string;
  image: string;
  action: string;
  priority: number;
}

export function useCustomerDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [stats, setStats] = useState<CustomerStats>({
    totalSpent: 0,
    totalSaved: 0,
    activeDeals: 0,
    completedOrders: 0,
    savingsPercentage: 0,
    averageOrderValue: 0
  });
  
  const [featuredDeals, setFeaturedDeals] = useState<FeaturedDeal[]>([]);
  const [recentVendors, setRecentVendors] = useState<RecentVendor[]>([]);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch customer dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real app, these would be API calls
        // For now, using mock data with realistic patterns
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock customer stats based on user history
        const mockStats: CustomerStats = {
          totalSpent: 12450,
          totalSaved: 3280,
          activeDeals: 3,
          completedOrders: 47,
          savingsPercentage: 21,
          averageOrderValue: 265
        };
        
        // Mock featured deals with location-based filtering
        const mockDeals: FeaturedDeal[] = [
          {
            id: '1',
            vendorId: 'vendor_1',
            vendorName: 'Fresh Fruit Paradise',
            vendorLocation: 'Sector 18, Noida',
            product: 'Premium Shimla Apples',
            originalPrice: 200,
            discountedPrice: 150,
            discount: 25,
            image: '/images/apples.jpg',
            rating: 4.8,
            distance: '0.8 km',
            endsIn: '2h 30m',
            category: 'fruits'
          },
          {
            id: '2',
            vendorId: 'vendor_2',
            vendorName: 'Organic Greens',
            vendorLocation: 'Central Market, Delhi',
            product: 'Fresh Organic Tomatoes',
            originalPrice: 80,
            discountedPrice: 60,
            discount: 25,
            image: '/images/tomatoes.jpg',
            rating: 4.6,
            distance: '1.2 km',
            endsIn: '4h 15m',
            category: 'vegetables'
          },
          {
            id: '3',
            vendorId: 'vendor_3',
            vendorName: 'Mango King',
            vendorLocation: 'Fruit Market, Mumbai',
            product: 'Alphonso Mangoes',
            originalPrice: 800,
            discountedPrice: 650,
            discount: 19,
            image: '/images/mangoes.jpg',
            rating: 4.9,
            distance: '2.1 km',
            endsIn: '1h 45m',
            category: 'fruits'
          }
        ];
        
        // Mock recent vendors based on user history
        const mockVendors: RecentVendor[] = [
          {
            id: 'vendor_1',
            name: 'Raj Fruit Store',
            location: 'Sector 15, Noida',
            rating: 4.7,
            lastVisit: '2 days ago',
            speciality: 'Fresh Fruits',
            image: '/images/vendor1.jpg',
            totalOrders: 12,
            averageDiscount: 18
          },
          {
            id: 'vendor_2',
            name: 'Green Vegetables Hub',
            location: 'Market Road, Delhi',
            rating: 4.5,
            lastVisit: '1 week ago',
            speciality: 'Organic Vegetables',
            image: '/images/vendor2.jpg',
            totalOrders: 8,
            averageDiscount: 15
          },
          {
            id: 'vendor_4',
            name: 'Spice Garden',
            location: 'Old Delhi Market',
            rating: 4.6,
            lastVisit: '2 weeks ago',
            speciality: 'Spices & Herbs',
            image: '/images/vendor4.jpg',
            totalOrders: 5,
            averageDiscount: 22
          }
        ];
        
        // Mock personalized recommendations
        const mockRecommendations: PersonalizedRecommendation[] = [
          {
            id: 'rec_1',
            type: 'product',
            title: 'Try Organic Bananas',
            description: 'Based on your apple purchases, you might like organic bananas from nearby vendors',
            image: '/images/bananas.jpg',
            action: 'Browse Bananas',
            priority: 1
          },
          {
            id: 'rec_2',
            type: 'vendor',
            title: 'New Vendor: Farm Fresh',
            description: 'A new organic vendor opened 0.5km from you with great reviews',
            image: '/images/vendor_new.jpg',
            action: 'Visit Store',
            priority: 2
          },
          {
            id: 'rec_3',
            type: 'category',
            title: 'Seasonal Vegetables',
            description: 'Winter vegetables are now available at discounted prices',
            image: '/images/winter_veg.jpg',
            action: 'Explore Category',
            priority: 3
          }
        ];
        
        setStats(mockStats);
        setFeaturedDeals(mockDeals);
        setRecentVendors(mockVendors);
        setRecommendations(mockRecommendations);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  // Refresh dashboard data
  const refreshData = async () => {
    setIsLoading(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
  };

  // Get deals by category
  const getDealsByCategory = (category: string) => {
    return featuredDeals.filter(deal => deal.category === category);
  };

  // Get vendor by ID
  const getVendorById = (vendorId: string) => {
    return recentVendors.find(vendor => vendor.id === vendorId);
  };

  // Calculate savings percentage
  const calculateSavingsPercentage = () => {
    if (stats.totalSpent === 0) return 0;
    return Math.round((stats.totalSaved / (stats.totalSpent + stats.totalSaved)) * 100);
  };

  // Get personalized greeting
  const getPersonalizedGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = '';
    
    if (hour < 12) {
      timeGreeting = t('dashboard.greeting.morning');
    } else if (hour < 17) {
      timeGreeting = t('dashboard.greeting.afternoon');
    } else {
      timeGreeting = t('dashboard.greeting.evening');
    }
    
    return `${timeGreeting}, ${user?.name || 'Customer'}!`;
  };

  // Get quick actions based on user behavior
  const getQuickActions = () => {
    const actions = [
      {
        id: 'browse',
        title: t('dashboard.actions.browse'),
        icon: 'storefront',
        action: '/customer/shop',
        priority: 1
      },
      {
        id: 'scan',
        title: t('dashboard.actions.scanQR'),
        icon: 'qr_code',
        action: '/customer/shop?action=scan',
        priority: 2
      },
      {
        id: 'history',
        title: t('dashboard.actions.history'),
        icon: 'history',
        action: '/order-history',
        priority: 3
      }
    ];
    
    // Add voice action if user has used voice before
    if (localStorage.getItem('voiceEnabled') === 'true') {
      actions.push({
        id: 'voice',
        title: t('dashboard.actions.voice'),
        icon: 'mic',
        action: '/voice-settings',
        priority: 4
      });
    }
    
    return actions.sort((a, b) => a.priority - b.priority);
  };

  return {
    // Data
    stats,
    featuredDeals,
    recentVendors,
    recommendations,
    
    // State
    isLoading,
    error,
    
    // Actions
    refreshData,
    getDealsByCategory,
    getVendorById,
    
    // Computed values
    savingsPercentage: calculateSavingsPercentage(),
    personalizedGreeting: getPersonalizedGreeting(),
    quickActions: getQuickActions(),
    
    // Helpers
    hasActiveDeals: stats.activeDeals > 0,
    hasRecentVendors: recentVendors.length > 0,
    hasRecommendations: recommendations.length > 0,
    isNewUser: stats.completedOrders === 0
  };
}