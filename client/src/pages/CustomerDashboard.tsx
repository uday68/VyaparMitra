import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { useCustomerDashboard } from '../hooks/useCustomerDashboard';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import QRScanner from '../components/QRScanner';
import { CrossLanguageQRScanner } from '../components/CrossLanguageQRScanner';
import { NegotiationInterface } from '../components/NegotiationInterface';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { LanguageSelector } from '../components/LanguageSelector';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Search, 
  QrCode, 
  ShoppingBag, 
  History, 
  TrendingUp, 
  MapPin, 
  Mic, 
  Star,
  ChevronRight,
  Gift,
  Users,
  Zap,
  RefreshCw,
  Globe,
  Volume2,
  Settings,
  Bell,
  Wallet
} from 'lucide-react';

interface QuickStat {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.ReactNode;
}

interface FeaturedDeal {
  id: string;
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
}

interface RecentVendor {
  id: string;
  name: string;
  location: string;
  rating: number;
  lastVisit: string;
  speciality: string;
  image: string;
}

export function CustomerDashboard() {
  const [, setLocation] = useLocation();
  const { t, language, changeLanguage } = useTranslation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showCrossLanguageScanner, setShowCrossLanguageScanner] = useState(false);
  const [activeNegotiationSession, setActiveNegotiationSession] = useState<{
    sessionId: string;
    customerLanguage: string;
  } | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Mock data - in real app, this would come from APIs
  const [quickStats] = useState<QuickStat[]>([
    {
      label: t('dashboard.stats.totalSpent'),
      value: '₹12,450',
      change: '+8%',
      trend: 'up',
      icon: <ShoppingBag className="h-4 w-4" />
    },
    {
      label: t('dashboard.stats.totalSaved'),
      value: '₹3,280',
      change: '+15%',
      trend: 'up',
      icon: <TrendingUp className="h-4 w-4" />
    },
    {
      label: t('dashboard.stats.activeDeals'),
      value: '3',
      icon: <Zap className="h-4 w-4" />
    },
    {
      label: t('dashboard.stats.completedOrders'),
      value: '47',
      change: '+2',
      trend: 'up',
      icon: <Gift className="h-4 w-4" />
    }
  ]);

  const [featuredDeals] = useState<FeaturedDeal[]>([
    {
      id: '1',
      vendorName: 'Fresh Fruit Paradise',
      vendorLocation: 'Sector 18, Noida',
      product: 'Premium Shimla Apples',
      originalPrice: 200,
      discountedPrice: 150,
      discount: 25,
      image: '/images/apples.jpg',
      rating: 4.8,
      distance: '0.8 km',
      endsIn: '2h 30m'
    },
    {
      id: '2',
      vendorName: 'Organic Greens',
      vendorLocation: 'Central Market, Delhi',
      product: 'Fresh Organic Tomatoes',
      originalPrice: 80,
      discountedPrice: 60,
      discount: 25,
      image: '/images/tomatoes.jpg',
      rating: 4.6,
      distance: '1.2 km',
      endsIn: '4h 15m'
    },
    {
      id: '3',
      vendorName: 'Mango King',
      vendorLocation: 'Fruit Market, Mumbai',
      product: 'Alphonso Mangoes',
      originalPrice: 800,
      discountedPrice: 650,
      discount: 19,
      image: '/images/mangoes.jpg',
      rating: 4.9,
      distance: '2.1 km',
      endsIn: '1h 45m'
    }
  ]);

  const [recentVendors] = useState<RecentVendor[]>([
    {
      id: '1',
      name: 'Raj Fruit Store',
      location: 'Sector 15, Noida',
      rating: 4.7,
      lastVisit: '2 days ago',
      speciality: 'Fresh Fruits',
      image: '/images/vendor1.jpg'
    },
    {
      id: '2',
      name: 'Green Vegetables Hub',
      location: 'Market Road, Delhi',
      rating: 4.5,
      lastVisit: '1 week ago',
      speciality: 'Organic Vegetables',
      image: '/images/vendor2.jpg'
    }
  ]);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In real app, reverse geocode to get address
          setCurrentLocation('Sector 18, Noida');
        },
        (error) => {
          console.log('Location access denied');
          setCurrentLocation('Location not available');
        }
      );
    }
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLocation(`/customer/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleVoiceSearch = () => {
    setIsVoiceActive(true);
    // Voice search implementation would go here
  };

  const handleQRScan = () => {
    setShowCrossLanguageScanner(true);
  };

  const handleCrossLanguageQRScanSuccess = (sessionData: any, customerLanguage: string) => {
    setShowCrossLanguageScanner(false);
    setActiveNegotiationSession({
      sessionId: sessionData.sessionId,
      customerLanguage
    });
  };

  const handleQRScanSuccess = (vendorData: { vendorId: string; shopName?: string }) => {
    setShowQRScanner(false);
    setLocation(`/shop/${vendorData.vendorId}`);
  };

  const handleDealClick = (deal: FeaturedDeal) => {
    setLocation(`/customer/negotiation/${deal.id}`);
  };

  const handleVendorClick = (vendor: RecentVendor) => {
    setLocation(`/shop/${vendor.id}`);
  };

  if (showQRScanner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <QRScanner
          onScanSuccess={handleQRScanSuccess}
          onClose={() => setShowQRScanner(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Enhanced Header with Floating Controls */}
      <div className="relative">
        <Header 
          title={t('dashboard.welcome', { name: user?.name || 'Customer' })}
          showBack={false}
        />
        
        {/* Floating Action Buttons - Top Right */}
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
          {/* Language Selector Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLanguageSelector(!showLanguageSelector)}
            className="bg-white shadow-lg rounded-full p-3 border border-gray-200 hover:shadow-xl transition-all duration-200"
          >
            <Globe className="h-5 w-5 text-blue-600" />
          </motion.button>
          
          {/* Voice Assistant Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsVoiceActive(!isVoiceActive)}
            className={`shadow-lg rounded-full p-3 border transition-all duration-200 ${
              isVoiceActive 
                ? 'bg-red-500 border-red-600 text-white shadow-red-200' 
                : 'bg-white border-gray-200 text-gray-600'
            }`}
          >
            <Mic className={`h-5 w-5 ${isListening ? 'animate-pulse' : ''}`} />
          </motion.button>
          
          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white shadow-lg rounded-full p-3 border border-gray-200 hover:shadow-xl transition-all duration-200 relative"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </div>
          </motion.button>
        </div>

        {/* Language Selector Panel - Improved Visibility */}
        <AnimatePresence>
          {showLanguageSelector && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="fixed top-20 right-4 z-50 bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-4 w-64 max-h-96 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">Choose Language</h3>
                <button
                  onClick={() => setShowLanguageSelector(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
                >
                  ×
                </button>
              </div>
              <LanguageSelector 
                variant="expanded" 
                onLanguageChange={() => setShowLanguageSelector(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pb-16">
        {/* Enhanced Location Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-4 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm opacity-90">Current Location</p>
              <p className="font-semibold">{currentLocation}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20 border border-white/30"
            >
              Change
            </Button>
          </div>
        </motion.div>

        {/* Enhanced Search Section */}
        <div className="p-4 bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder={t('dashboard.search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-12 h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl shadow-sm"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleVoiceSearch}
              className={`h-12 w-12 rounded-xl flex items-center justify-center border-2 transition-all duration-200 ${
                isVoiceActive 
                  ? 'bg-red-500 border-red-600 text-white shadow-lg shadow-red-200' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 border-blue-500 text-white shadow-lg'
              }`}
            >
              <Mic className={`h-5 w-5 ${isListening ? 'animate-pulse' : ''}`} />
            </motion.button>
          </div>
          
          {/* Voice Status Indicator */}
          <AnimatePresence>
            {isVoiceActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    {isListening ? 'Listening...' : 'Voice Assistant Active'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="p-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Browse Shop Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                className="h-24 w-full flex-col gap-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
                onClick={() => setLocation('/customer/shop')}
              >
                <div className="bg-blue-600 text-white rounded-full p-2">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {t('dashboard.actions.browse')}
                </span>
              </Button>
            </motion.div>

            {/* Cross-Language QR Scanner Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                className="h-24 w-full flex-col gap-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-purple-200 dark:border-purple-700 hover:border-purple-300 hover:shadow-lg transition-all duration-200"
                onClick={handleQRScan}
              >
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full p-2">
                  <QrCode className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  Scan QR & Negotiate
                </span>
              </Button>
            </motion.div>

            {/* Order History Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                className="h-24 w-full flex-col gap-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200 dark:border-green-700 hover:border-green-300 hover:shadow-lg transition-all duration-200"
                onClick={() => setLocation('/order-history')}
              >
                <div className="bg-green-600 text-white rounded-full p-2">
                  <History className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                  {t('dashboard.actions.history')}
                </span>
              </Button>
            </motion.div>

            {/* Voice Commands Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                className="h-24 w-full flex-col gap-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-2 border-orange-200 dark:border-orange-700 hover:border-orange-300 hover:shadow-lg transition-all duration-200"
                onClick={() => setLocation('/voice-commands-reference')}
              >
                <div className="bg-orange-600 text-white rounded-full p-2">
                  <Volume2 className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                  Voice Guide
                </span>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            {t('dashboard.stats.title')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {stat.icon}
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {stat.label}
                        </span>
                      </div>
                      {stat.change && (
                        <Badge variant={stat.trend === 'up' ? 'default' : 'secondary'}>
                          {stat.change}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Enhanced Voice Assistant Banner */}
        <div className="px-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden"
          >
            <Alert className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 border-0 text-white shadow-xl">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: isVoiceActive ? 360 : 0 }}
                  transition={{ duration: 2, repeat: isVoiceActive ? Infinity : 0 }}
                  className="bg-white/20 rounded-full p-2"
                >
                  <Mic className="h-5 w-5" />
                </motion.div>
                <div className="flex-1">
                  <AlertDescription className="text-white font-medium">
                    {isVoiceActive 
                      ? "🎤 Voice Assistant is listening..." 
                      : t('dashboard.voice.banner')
                    }
                  </AlertDescription>
                </div>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/20 border border-white/30 font-semibold"
                  onClick={() => setIsVoiceActive(!isVoiceActive)}
                >
                  {isVoiceActive ? 'Stop' : t('dashboard.voice.tryNow')}
                </Button>
              </div>
              
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>
            </Alert>
          </motion.div>
        </div>

        {/* Centered Voice Settings Button */}
        <div className="px-4 mb-6 flex justify-center">
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <Button
              onClick={() => setLocation('/voice-settings')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-sm flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Voice Settings
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            </Button>
          </motion.div>
        </div>

        {/* Voice Command Example */}
        <div className="px-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border-2 border-orange-200 dark:border-orange-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-orange-500 text-white rounded-full p-2">
                <Volume2 className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-orange-800 dark:text-orange-300">Try Voice Command</h3>
            </div>
            <p className="text-orange-700 dark:text-orange-400 text-sm mb-3">
              Say: <span className="font-mono bg-orange-100 dark:bg-orange-800 px-2 py-1 rounded">"Negotiate price for apples"</span>
            </p>
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsVoiceActive(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Mic className="h-4 w-4" />
                Try Now
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Featured Deals */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('dashboard.deals.title')}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setLocation('/customer/shop?filter=deals')}>
              {t('common.viewAll')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {featuredDeals.map((deal, index) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleDealClick(deal)}
                className="cursor-pointer"
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                        <img
                          src={deal.image}
                          alt={deal.product}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {deal.product}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {deal.vendorName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-gray-600">{deal.rating}</span>
                              </div>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">{deal.distance}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-green-600">
                                ₹{deal.discountedPrice}
                              </span>
                              <Badge variant="destructive" className="text-xs">
                                {deal.discount}% OFF
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-500 line-through">
                              ₹{deal.originalPrice}
                            </span>
                            <p className="text-xs text-orange-600 mt-1">
                              {t('dashboard.deals.endsIn', { time: deal.endsIn })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Vendors */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('dashboard.vendors.recent')}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setLocation('/vendors')}>
              {t('common.viewAll')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {recentVendors.map((vendor, index) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleVendorClick(vendor)}
                className="cursor-pointer"
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
                        <Users className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {vendor.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {vendor.location}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-gray-600">{vendor.rating}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {t('dashboard.vendors.lastVisit', { time: vendor.lastVisit })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {vendor.speciality}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            {t('dashboard.recommendations.title')}
          </h2>
          <Card>
            <CardContent className="p-4">
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('dashboard.recommendations.empty')}
                </p>
                <Button onClick={() => setLocation('/customer/shop')}>
                  {t('dashboard.recommendations.startShopping')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav currentPage="shop" />
      
      {/* Voice Assistant Component */}
      <VoiceAssistant isActive={isVoiceActive} onToggle={setIsVoiceActive} />

      {/* Cross-Language QR Scanner Modal */}
      <AnimatePresence>
        {showCrossLanguageScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
            >
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Scan Vendor QR Code</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCrossLanguageScanner(false)}
                  >
                    ×
                  </Button>
                </div>
              </div>
              
              <div className="p-4">
                <CrossLanguageQRScanner
                  onScanSuccess={handleCrossLanguageQRScanSuccess}
                  onScanError={(error) => {
                    console.error('QR scan error:', error);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Negotiation Interface */}
      <AnimatePresence>
        {activeNegotiationSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setActiveNegotiationSession(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Negotiation in Progress</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveNegotiationSession(null)}
                  >
                    ×
                  </Button>
                </div>
              </div>
              
              <div className="h-[600px]">
                <NegotiationInterface
                  sessionId={activeNegotiationSession.sessionId}
                  userId={user?.id || ''}
                  userType="CUSTOMER"
                  initialLanguage={activeNegotiationSession.customerLanguage as any}
                  graphqlClient={null} // Would need to pass actual GraphQL client
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}