import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { 
  useInventoryAnalytics, 
  useProfitabilityAnalysis, 
  useInventoryAlerts,
  useMarketInsights,
  usePricePrediction,
  useNegotiationAnalytics 
} from '../hooks/use-analytics';
import { useProducts } from '../hooks/use-products';
import { useNegotiations } from '../hooks/use-negotiations';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { LanguageSelector } from '../components/LanguageSelector';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
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
  Wallet,
  Package,
  MessageSquare,
  BarChart3,
  Plus,
  Eye,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingDown,
  Activity
} from 'lucide-react';

interface VendorStat {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.ReactNode;
}

interface ActiveNegotiation {
  id: string;
  customerName: string;
  customerLanguage: string;
  product: string;
  customerOffer: number;
  originalPrice: number;
  timeAgo: string;
  status: 'pending' | 'counter' | 'accepted';
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  activeBids: number;
  image: string;
  category: string;
}

interface RecentOrder {
  id: string;
  customerName: string;
  product: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'delivered';
  timeAgo: string;
}

export default function Vendor() {
  const [, setLocation] = useLocation();
  const { t, language, changeLanguage } = useTranslation();
  const { user } = useAuth();
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('');

  // Real analytics data
  const { data: inventoryAnalytics, isLoading: inventoryLoading } = useInventoryAnalytics(user?.id || '');
  const { data: profitabilityData, isLoading: profitabilityLoading } = useProfitabilityAnalysis(user?.id || '');
  const { data: inventoryAlerts, isLoading: alertsLoading } = useInventoryAlerts(user?.id || '');
  const { data: negotiationAnalytics, isLoading: negotiationLoading } = useNegotiationAnalytics();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: negotiations, isLoading: negotiationsLoading } = useNegotiations();

  // Calculate real vendor stats from analytics data
  const vendorStats = React.useMemo(() => {
    if (!inventoryAnalytics || !profitabilityData || !negotiationAnalytics) {
      return [];
    }

    const todayRevenue = profitabilityData
      .filter(item => item.salesCount > 0)
      .reduce((sum, item) => sum + item.totalRevenue, 0);

    return [
      {
        label: t('vendor.stats.todayRevenue', { defaultValue: 'Today\'s Revenue' }),
        value: `₹${todayRevenue.toLocaleString()}`,
        change: '+12%', // This would come from comparing with yesterday
        trend: 'up' as const,
        icon: <DollarSign className="h-4 w-4" />
      },
      {
        label: t('vendor.stats.activeNegotiations', { defaultValue: 'Active Negotiations' }),
        value: negotiationAnalytics.totalNegotiations.toString(),
        change: `${negotiationAnalytics.successRate.toFixed(1)}% success`,
        trend: negotiationAnalytics.successRate > 60 ? 'up' as const : 'down' as const,
        icon: <MessageSquare className="h-4 w-4" />
      },
      {
        label: t('vendor.stats.totalProducts', { defaultValue: 'Total Products' }),
        value: inventoryAnalytics.totalProducts.toString(),
        change: inventoryAnalytics.lowStockAlerts > 0 ? `${inventoryAnalytics.lowStockAlerts} low stock` : undefined,
        trend: inventoryAnalytics.lowStockAlerts > 0 ? 'down' as const : undefined,
        icon: <Package className="h-4 w-4" />
      },
      {
        label: t('vendor.stats.inventoryValue', { defaultValue: 'Inventory Value' }),
        value: `₹${inventoryAnalytics.totalValue.toLocaleString()}`,
        icon: <Wallet className="h-4 w-4" />
      }
    ];
  }, [inventoryAnalytics, profitabilityData, negotiationAnalytics, t]);

  // Process real negotiations data
  const activeNegotiations = React.useMemo(() => {
    if (!negotiations) return [];
    
    return negotiations
      .filter(neg => neg.status === 'active')
      .slice(0, 5)
      .map(neg => ({
        id: neg.id.toString(),
        customerName: 'Customer', // Would come from user data
        customerLanguage: 'English',
        product: neg.product?.name || 'Product',
        customerOffer: 0, // Would come from latest bid
        originalPrice: neg.product?.price || 0,
        timeAgo: new Date(neg.createdAt).toLocaleString(),
        status: 'pending' as const
      }));
  }, [negotiations]);

  // Process real products data
  const productsList = React.useMemo(() => {
    if (!products) return [];
    
    return products.slice(0, 6).map(product => ({
      id: product.id.toString(),
      name: product.name,
      price: product.price,
      stock: product.stockQuantity || 0,
      unit: product.unit || 'kg',
      activeBids: 0, // Would come from negotiations count
      image: product.imageUrl || '/images/placeholder.jpg',
      category: product.category
    }));
  }, [products]);

  // Get vendor's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation('Sector 18, Noida');
        },
        (error) => {
          console.log('Location access denied');
          setCurrentLocation('Location not available');
        }
      );
    }
  }, []);

  const handleVoiceCommand = () => {
    setIsVoiceActive(true);
    setIsListening(true);
    // Voice command implementation would go here
  };

  const handleNegotiationAction = (negotiationId: string, action: 'accept' | 'counter' | 'reject') => {
    // Handle negotiation actions
    console.log(`${action} negotiation ${negotiationId}`);
    if (action === 'accept' || action === 'counter') {
      setLocation(`/chat/${negotiationId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'counter': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Enhanced Header with Floating Controls */}
      <div className="relative">
        <Header 
          title={t('vendor.welcome', { name: user?.name || 'Vendor', defaultValue: `Welcome, ${user?.name || 'Vendor'}` })}
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
              {activeNegotiations.length}
            </div>
          </motion.button>
        </div>

        {/* Language Selector Panel */}
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
          className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-4 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm opacity-90">Shop Location</p>
              <p className="font-semibold">{currentLocation}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20 border border-white/30"
              onClick={() => setLocation('/vendor/qr-code')}
            >
              QR Code
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="px-4 py-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Business Overview
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {vendorStats.map((stat, index) => (
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

        {/* Enhanced Quick Actions */}
        <div className="px-4 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Add Product Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                className="h-24 w-full flex-col gap-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200 dark:border-green-700 hover:border-green-300 hover:shadow-lg transition-all duration-200"
                onClick={() => setLocation('/add-product')}
              >
                <div className="bg-green-600 text-white rounded-full p-2">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                  Add Product
                </span>
              </Button>
            </motion.div>

            {/* View Orders Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                className="h-24 w-full flex-col gap-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
                onClick={() => setLocation('/order-history')}
              >
                <div className="bg-blue-600 text-white rounded-full p-2">
                  <History className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  View Orders
                </span>
              </Button>
            </motion.div>

            {/* Analytics Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                className="h-24 w-full flex-col gap-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-purple-200 dark:border-purple-700 hover:border-purple-300 hover:shadow-lg transition-all duration-200"
                onClick={() => setLocation('/vendor/analytics')}
              >
                <div className="bg-purple-600 text-white rounded-full p-2">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  Analytics
                </span>
              </Button>
            </motion.div>

            {/* Voice Settings Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                className="h-24 w-full flex-col gap-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-2 border-orange-200 dark:border-orange-700 hover:border-orange-300 hover:shadow-lg transition-all duration-200"
                onClick={() => setLocation('/voice-settings')}
              >
                <div className="bg-orange-600 text-white rounded-full p-2">
                  <Volume2 className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                  Voice Settings
                </span>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Voice Assistant Banner */}
        <div className="px-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden"
          >
            <Alert className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 border-0 text-white shadow-xl">
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
                      : "Voice AI ready to help with your business"
                    }
                  </AlertDescription>
                </div>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/20 border border-white/30 font-semibold"
                  onClick={() => setIsVoiceActive(!isVoiceActive)}
                >
                  {isVoiceActive ? 'Stop' : 'Try Voice'}
                </Button>
              </div>
            </Alert>
          </motion.div>
        </div>

        {/* Active Negotiations */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-red-600" />
              Active Negotiations
              {activeNegotiations.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {activeNegotiations.length}
                </Badge>
              )}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setLocation('/vendor/negotiations')}>
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {activeNegotiations.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No active negotiations</p>
                  <p className="text-sm text-gray-500 mt-1">New negotiations will appear here</p>
                </CardContent>
              </Card>
            ) : (
              activeNegotiations.map((negotiation, index) => (
                <motion.div
                  key={negotiation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {negotiation.customerName}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {negotiation.customerLanguage}
                            </Badge>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(negotiation.status)}`}>
                              {negotiation.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {negotiation.product}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{negotiation.timeAgo}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Customer Offer:</p>
                          <p className="text-lg font-bold text-green-600">₹{negotiation.customerOffer}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Your Price:</p>
                          <p className="text-lg font-bold text-gray-900">₹{negotiation.originalPrice}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleNegotiationAction(negotiation.id, 'accept')}
                        >
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleNegotiationAction(negotiation.id, 'counter')}
                        >
                          Counter
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleNegotiationAction(negotiation.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Products Overview */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Your Products
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setLocation('/add-product')}>
              Add New
              <Plus className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {products.slice(0, 3).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                        <img
                          src={product.image}
                          alt={product.name}
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
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Stock: {product.stock} {product.unit}
                            </p>
                            {product.activeBids > 0 && (
                              <Badge variant="destructive" className="text-xs mt-1">
                                {product.activeBids} Active Bids
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              ₹{product.price}/{product.unit}
                            </p>
                            <Button variant="ghost" size="sm" className="text-xs p-1 h-auto">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
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

        {/* Inventory Analytics Section */}
        {inventoryAnalytics && (
          <div className="px-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Inventory Analytics
            </h2>
            
            {/* Inventory Alerts */}
            {inventoryAlerts && inventoryAlerts.length > 0 && (
              <div className="mb-4">
                <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800 dark:text-orange-200">
                    {inventoryAlerts.length} inventory alerts require attention
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {/* Fast Moving Items */}
              {inventoryAnalytics.fastMovingItems.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Fast Moving Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {inventoryAnalytics.fastMovingItems.slice(0, 3).map((item) => (
                        <div key={item.productId} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-gray-600">
                              {item.salesVelocity.toFixed(1)} sales/day • {item.daysUntilStockout} days left
                            </p>
                          </div>
                          <Badge variant="default" className="bg-green-600">
                            {item.stockLevel} left
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reorder Recommendations */}
              {inventoryAnalytics.reorderRecommendations.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-blue-600" />
                      Reorder Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {inventoryAnalytics.reorderRecommendations.slice(0, 3).map((item) => (
                        <div key={item.productId} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-gray-600">
                              Current: {item.currentStock} • Recommended: {item.recommendedOrder}
                            </p>
                          </div>
                          <Badge 
                            variant={item.urgency === 'high' ? 'destructive' : item.urgency === 'medium' ? 'default' : 'secondary'}
                          >
                            {item.urgency}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Profitability Analysis */}
        {profitabilityData && profitabilityData.length > 0 && (
          <div className="px-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Profitability Analysis
            </h2>
            
            <div className="grid grid-cols-1 gap-3">
              {profitabilityData.slice(0, 3).map((item) => (
                <Card key={item.productId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-sm">{item.name}</h3>
                        <p className="text-xs text-gray-600">{item.category}</p>
                      </div>
                      <Badge 
                        variant={item.profitMargin > 20 ? 'default' : item.profitMargin > 10 ? 'secondary' : 'destructive'}
                      >
                        {item.profitMargin.toFixed(1)}% margin
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-600">Revenue</p>
                        <p className="font-bold text-green-600">₹{item.totalRevenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Profit</p>
                        <p className="font-bold text-blue-600">₹{item.grossProfit.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">ROI</p>
                        <p className="font-bold text-purple-600">{item.roi.toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Negotiation Performance */}
        {negotiationAnalytics && (
          <div className="px-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-orange-600" />
              Negotiation Performance
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {negotiationAnalytics.successRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-600">Success Rate</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {negotiationAnalytics.averageNegotiationTime.toFixed(0)}m
                  </div>
                  <p className="text-xs text-gray-600">Avg Time</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {negotiationAnalytics.averageDiscount.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-600">Avg Discount</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {negotiationAnalytics.totalNegotiations}
                  </div>
                  <p className="text-xs text-gray-600">Total Negotiations</p>
                </CardContent>
              </Card>
            </div>

            {/* Voice vs Text Performance */}
            {negotiationAnalytics.negotiationPatterns?.voiceVsText && (
              <Card className="mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Voice vs Text Performance</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                      <Volume2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Voice</p>
                      <p className="text-lg font-bold text-green-600">
                        {negotiationAnalytics.negotiationPatterns.voiceVsText.voice.successRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-600">
                        {negotiationAnalytics.negotiationPatterns.voiceVsText.voice.count} negotiations
                      </p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <MessageSquare className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Text</p>
                      <p className="text-lg font-bold text-blue-600">
                        {negotiationAnalytics.negotiationPatterns.voiceVsText.text.successRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-600">
                        {negotiationAnalytics.negotiationPatterns.voiceVsText.text.count} negotiations
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Loading States */}
        {(inventoryLoading || profitabilityLoading || negotiationLoading) && (
          <div className="px-4 mb-6">
            <Card>
              <CardContent className="p-6 text-center">
                <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-3 animate-spin" />
                <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Orders */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Recent Orders
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setLocation('/order-history')}>
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {recentOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {order.customerName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {order.product}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">₹{order.amount}</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <span className="text-xs text-gray-500">{order.timeAgo}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav currentPage="bids" />
      
      {/* Voice Assistant Component */}
      <VoiceAssistant isActive={isVoiceActive} onToggle={setIsVoiceActive} />
    </div>
  );
}
