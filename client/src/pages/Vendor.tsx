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
import { QRCodeGenerator } from '../components/QRCodeGenerator';
import { NegotiationInterface } from '../components/NegotiationInterface';
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
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [selectedProductForQR, setSelectedProductForQR] = useState<any>(null);
  const [activeNegotiationSession, setActiveNegotiationSession] = useState<string | null>(null);

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
      .filter((item: any) => item.salesCount > 0)
      .reduce((sum: number, item: any) => sum + item.totalRevenue, 0);

    return [
      {
        label: t('vendor.stats.totalRevenue', { defaultValue: 'Today\'s Revenue' }),
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
        originalPrice: neg.product?.base_price ? parseFloat(neg.product.base_price) : 0,
        timeAgo: new Date(neg.created_at || Date.now()).toLocaleString(),
        status: 'pending' as const
      }));
  }, [negotiations]);

  // Process real products data
  const productsList = React.useMemo(() => {
    if (!products) return [];
    
    return products.slice(0, 6).map(product => ({
      id: product.id.toString(),
      name: product.name,
      price: parseFloat(product.base_price || '0'),
      stock: product.stock_quantity || 0,
      unit: product.unit || 'kg',
      activeBids: 0, // Would come from negotiations count
      image: product.images || '/images/placeholder.jpg',
      category: product.category
    }));
  }, [products]);

  // Mock recent orders data - in real app, this would come from API
  const recentOrders = React.useMemo(() => [
    {
      id: '1',
      customerName: 'Rajesh Kumar',
      product: 'Fresh Tomatoes',
      amount: 150,
      status: 'confirmed' as const,
      timeAgo: '2 hours ago'
    },
    {
      id: '2',
      customerName: 'Priya Sharma',
      product: 'Organic Apples',
      amount: 280,
      status: 'pending' as const,
      timeAgo: '4 hours ago'
    },
    {
      id: '3',
      customerName: 'Amit Singh',
      product: 'Fresh Mangoes',
      amount: 450,
      status: 'delivered' as const,
      timeAgo: '1 day ago'
    }
  ], []);

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
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'counter': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'accepted': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'delivered': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Professional Header */}
      <div className="relative">
        <Header 
          title={t('vendor.dashboard.welcome', { name: user?.name || 'Vendor', defaultValue: `Welcome, ${user?.name || 'Vendor'}` })}
          showBack={false}
        />
        
        {/* Floating Action Buttons - Professional Design */}
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
          {/* Language Selector Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLanguageSelector(!showLanguageSelector)}
            className="bg-white shadow-lg rounded-xl p-3 border border-slate-200 hover:shadow-xl transition-all duration-200 hover:border-slate-300"
          >
            <Globe className="h-5 w-5 text-slate-700" />
          </motion.button>
          
          {/* Voice Assistant Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsVoiceActive(!isVoiceActive)}
            className={`shadow-lg rounded-xl p-3 border transition-all duration-200 ${
              isVoiceActive 
                ? 'bg-emerald-600 border-emerald-700 text-white shadow-emerald-200' 
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <Mic className={`h-5 w-5 ${isListening ? 'animate-pulse' : ''}`} />
          </motion.button>
          
          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white shadow-lg rounded-xl p-3 border border-slate-200 hover:shadow-xl transition-all duration-200 hover:border-slate-300 relative"
          >
            <Bell className="h-5 w-5 text-slate-700" />
            {activeNegotiations.length > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {activeNegotiations.length}
              </div>
            )}
          </motion.button>
        </div>

        {/* Language Selector Panel */}
        <AnimatePresence>
          {showLanguageSelector && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="fixed top-20 right-4 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-64 max-h-96 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-lg">{t('vendor.language.chooseLanguage')}</h3>
                <button
                  onClick={() => setShowLanguageSelector(false)}
                  className="text-slate-500 hover:text-slate-700 text-2xl font-bold leading-none"
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
        {/* Professional Location Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 text-white px-4 py-4 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/10 rounded-xl p-2">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm opacity-90">{t('vendor.sections.shopLocation')}</p>
              <p className="font-semibold">{currentLocation}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/10 border border-white/20 rounded-lg"
              onClick={() => setLocation('/vendor/qr-code')}
            >
              {t('vendor.sections.qrCode')}
            </Button>
          </div>
        </motion.div>

        {/* Professional Business Stats */}
        <div className="px-4 py-6">
          <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-700" />
            {t('vendor.sections.businessOverview')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {vendorStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white border-slate-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          {stat.icon}
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {stat.label}
                        </span>
                      </div>
                      {stat.change && (
                        <Badge 
                          variant={stat.trend === 'up' ? 'default' : 'secondary'}
                          className={stat.trend === 'up' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}
                        >
                          {stat.change}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="text-xl font-bold text-slate-900 dark:text-white">
                        {stat.value}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Professional Quick Actions */}
        <div className="px-4 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-slate-700" />
            {t('vendor.sections.quickActions')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Add Product Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="secondary"
                className="h-24 w-full flex-col gap-3 bg-white border-2 border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-200"
                onClick={() => setLocation('/add-product')}
              >
                <div className="bg-emerald-600 text-white rounded-xl p-2">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {t('vendor.quickActions.addProduct')}
                </span>
              </Button>
            </motion.div>

            {/* View Orders Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="secondary"
                className="h-24 w-full flex-col gap-3 bg-white border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200"
                onClick={() => setLocation('/order-history')}
              >
                <div className="bg-slate-700 text-white rounded-xl p-2">
                  <History className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {t('vendor.quickActions.viewOrders')}
                </span>
              </Button>
            </motion.div>

            {/* QR Code Generator Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="secondary"
                className="h-24 w-full flex-col gap-3 bg-white border-2 border-slate-200 hover:border-violet-300 hover:shadow-lg transition-all duration-200"
                onClick={() => setShowQRGenerator(true)}
              >
                <div className="bg-violet-600 text-white rounded-xl p-2">
                  <QrCode className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  Generate QR Code
                </span>
              </Button>
            </motion.div>

            {/* Voice Settings Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="secondary"
                className="h-24 w-full flex-col gap-3 bg-white border-2 border-slate-200 hover:border-amber-300 hover:shadow-lg transition-all duration-200"
                onClick={() => setLocation('/voice-settings')}
              >
                <div className="bg-amber-600 text-white rounded-xl p-2">
                  <Volume2 className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {t('vendor.quickActions.voiceSettings')}
                </span>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Professional Voice Assistant Banner */}
        <div className="px-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden"
          >
            <Alert className="bg-slate-900 border-slate-800 text-white shadow-xl">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: isVoiceActive ? 360 : 0 }}
                  transition={{ duration: 2, repeat: isVoiceActive ? Infinity : 0 }}
                  className="bg-white/10 rounded-xl p-2"
                >
                  <Mic className="h-5 w-5" />
                </motion.div>
                <div className="flex-1">
                  <AlertDescription className="text-white font-medium">
                    {isVoiceActive 
                      ? t('vendor.voice.listening')
                      : t('vendor.voice.ready')
                    }
                  </AlertDescription>
                </div>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/10 border border-white/20 font-semibold rounded-lg"
                  onClick={() => setIsVoiceActive(!isVoiceActive)}
                >
                  {isVoiceActive ? t('vendor.voice.stop') : t('vendor.voice.tryVoice')}
                </Button>
              </div>
            </Alert>
          </motion.div>
        </div>

        {/* Active Negotiations - Professional Design */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-slate-700" />
              {t('vendor.sections.activeNegotiations')}
              {activeNegotiations.length > 0 && (
                <Badge variant="destructive" className="ml-2 bg-red-100 text-red-800 border-red-200">
                  {activeNegotiations.length}
                </Badge>
              )}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setLocation('/vendor/negotiations')} className="text-slate-600 hover:text-slate-900">
              {t('vendor.negotiations.viewAll')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {activeNegotiations.length === 0 ? (
              <Card className="bg-white border-slate-200">
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">{t('vendor.negotiations.noActive')}</p>
                  <p className="text-sm text-slate-500 mt-1">{t('vendor.negotiations.newWillAppear')}</p>
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
                  <Card className="hover:shadow-md transition-shadow border-l-4 border-l-amber-500 bg-white border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-slate-900 dark:text-white">
                              {negotiation.customerName}
                            </h3>
                            <Badge variant="outline" className="text-xs border-slate-200 text-slate-600">
                              {negotiation.customerLanguage}
                            </Badge>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(negotiation.status)}`}>
                              {negotiation.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {negotiation.product}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">{negotiation.timeAgo}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-slate-600">Customer Offer:</p>
                          <p className="text-lg font-bold text-emerald-600">₹{negotiation.customerOffer}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-600">Your Price:</p>
                          <p className="text-lg font-bold text-slate-900">₹{negotiation.originalPrice}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleNegotiationAction(negotiation.id, 'accept')}
                        >
                          {t('vendor.negotiations.accept')}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50"
                          onClick={() => handleNegotiationAction(negotiation.id, 'counter')}
                        >
                          {t('vendor.negotiations.counter')}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleNegotiationAction(negotiation.id, 'reject')}
                        >
                          {t('vendor.negotiations.reject')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Products Overview - Professional Design */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-slate-700" />
              {t('vendor.sections.yourProducts')}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setLocation('/add-product')} className="text-slate-600 hover:text-slate-900">
              {t('vendor.negotiations.addNew')}
              <Plus className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {productsList.slice(0, 3).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow bg-white border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-xl flex-shrink-0">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-xl"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-slate-900 dark:text-white truncate">
                              {product.name}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {t('vendor.products.stock')}: {product.stock} {product.unit}
                            </p>
                            {product.activeBids > 0 && (
                              <Badge variant="destructive" className="text-xs mt-1 bg-red-100 text-red-800 border-red-200">
                                {product.activeBids} Active Bids
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-emerald-600">
                              ₹{product.price}/{product.unit}
                            </p>
                            <Button variant="ghost" size="sm" className="text-xs p-1 h-auto text-slate-600 hover:text-slate-900">
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

        {/* Inventory Analytics Section - Professional Design */}
        {inventoryAnalytics && (
          <div className="px-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-700" />
              {t('vendor.sections.inventoryAnalytics')}
            </h2>
            
            {/* Inventory Alerts */}
            {inventoryAlerts && inventoryAlerts.length > 0 && (
              <div className="mb-4">
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    {inventoryAlerts.length} inventory alerts require attention
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {/* Fast Moving Items */}
              {inventoryAnalytics.fastMovingItems.length > 0 && (
                <Card className="bg-white border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      {t('vendor.sections.fastMovingItems')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {inventoryAnalytics.fastMovingItems.slice(0, 3).map((item) => (
                        <div key={item.productId} className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                          <div>
                            <p className="font-medium text-sm text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-600">
                              {item.salesVelocity.toFixed(1)} {t('vendor.analytics.salesPerDay')} • {item.daysUntilStockout} {t('vendor.analytics.daysLeft')}
                            </p>
                          </div>
                          <Badge variant="default" className="bg-emerald-600 text-white">
                            {item.stockLevel} {t('vendor.products.left')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reorder Recommendations */}
              {inventoryAnalytics.reorderRecommendations.length > 0 && (
                <Card className="bg-white border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-slate-700" />
                      {t('vendor.sections.reorderRecommendations')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {inventoryAnalytics.reorderRecommendations.slice(0, 3).map((item) => (
                        <div key={item.productId} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/20 rounded-lg">
                          <div>
                            <p className="font-medium text-sm text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-600">
                              {t('vendor.analytics.current')}: {item.currentStock} • {t('vendor.analytics.recommended')}: {item.recommendedOrder}
                            </p>
                          </div>
                          <Badge 
                            variant={item.urgency === 'high' ? 'destructive' : item.urgency === 'medium' ? 'default' : 'secondary'}
                            className={
                              item.urgency === 'high' 
                                ? 'bg-red-100 text-red-800 border-red-200' 
                                : item.urgency === 'medium' 
                                ? 'bg-amber-100 text-amber-800 border-amber-200' 
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }
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

        {/* Profitability Analysis - Professional Design */}
        {profitabilityData && profitabilityData.length > 0 && (
          <div className="px-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              {t('vendor.sections.profitabilityAnalysis')}
            </h2>
            
            <div className="grid grid-cols-1 gap-3">
              {profitabilityData.slice(0, 3).map((item: any) => (
                <Card key={item.productId} className="bg-white border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-sm text-slate-900">{item.name}</h3>
                        <p className="text-xs text-slate-600">{item.category}</p>
                      </div>
                      <Badge 
                        variant={item.profitMargin > 20 ? 'default' : item.profitMargin > 10 ? 'secondary' : 'destructive'}
                        className={
                          item.profitMargin > 20 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                            : item.profitMargin > 10 
                            ? 'bg-slate-100 text-slate-700 border-slate-200' 
                            : 'bg-red-100 text-red-800 border-red-200'
                        }
                      >
                        {item.profitMargin.toFixed(1)}% {t('vendor.analytics.margin')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-slate-600">{t('vendor.analytics.revenue')}</p>
                        <p className="font-bold text-emerald-600">₹{item.totalRevenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">{t('vendor.analytics.profit')}</p>
                        <p className="font-bold text-slate-700">₹{item.grossProfit.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">{t('vendor.analytics.roi')}</p>
                        <p className="font-bold text-violet-600">{item.roi.toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Negotiation Performance - Professional Design */}
        {negotiationAnalytics && (
          <div className="px-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-slate-700" />
              {t('vendor.sections.negotiationPerformance')}
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white border-slate-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-600 mb-1">
                    {negotiationAnalytics.successRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-slate-600">{t('vendor.analytics.successRate')}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-slate-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-slate-700 mb-1">
                    {negotiationAnalytics.averageNegotiationTime.toFixed(0)}m
                  </div>
                  <p className="text-xs text-slate-600">{t('vendor.analytics.avgTime')}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-slate-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-violet-600 mb-1">
                    {negotiationAnalytics.averageDiscount.toFixed(1)}%
                  </div>
                  <p className="text-xs text-slate-600">{t('vendor.analytics.avgDiscount')}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-slate-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-amber-600 mb-1">
                    {negotiationAnalytics.totalNegotiations}
                  </div>
                  <p className="text-xs text-slate-600">{t('vendor.analytics.totalNegotiations')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Voice vs Text Performance */}
            {negotiationAnalytics.negotiationPatterns?.voiceVsText && (
              <Card className="mt-4 bg-white border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-900">{t('vendor.sections.voiceVsTextPerformance')}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <Volume2 className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-900">{t('vendor.analytics.voice')}</p>
                      <p className="text-lg font-bold text-emerald-600">
                        {negotiationAnalytics.negotiationPatterns.voiceVsText.voice.successRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-600">
                        {negotiationAnalytics.negotiationPatterns.voiceVsText.voice.count} {t('vendor.analytics.negotiations')}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-900/20 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-slate-700 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-900">{t('vendor.analytics.text')}</p>
                      <p className="text-lg font-bold text-slate-700">
                        {negotiationAnalytics.negotiationPatterns.voiceVsText.text.successRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-600">
                        {negotiationAnalytics.negotiationPatterns.voiceVsText.text.count} {t('vendor.analytics.negotiations')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Loading States - Professional Design */}
        {(inventoryLoading || profitabilityLoading || negotiationLoading) && (
          <div className="px-4 mb-6">
            <Card className="bg-white border-slate-200">
              <CardContent className="p-6 text-center">
                <RefreshCw className="h-8 w-8 text-slate-400 mx-auto mb-3 animate-spin" />
                <p className="text-slate-600 dark:text-slate-400">{t('vendor.analytics.loadingAnalytics')}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Orders - Professional Design */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-700" />
              {t('vendor.sections.recentOrders')}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setLocation('/order-history')} className="text-slate-600 hover:text-slate-900">
              {t('vendor.negotiations.viewAll')}
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
                <Card className="hover:shadow-md transition-shadow bg-white border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-slate-700" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-white">
                            {order.customerName}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {order.product}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">₹{order.amount}</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <span className="text-xs text-slate-500">{order.timeAgo}</span>
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

      {/* QR Code Generator Modal */}
      <AnimatePresence>
        {showQRGenerator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowQRGenerator(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Choose QR Code Type</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQRGenerator(false)}
                  >
                    ×
                  </Button>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {/* General Conversation QR */}
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-emerald-300"
                  onClick={() => {
                    setSelectedProductForQR({ type: 'general' });
                    setShowQRGenerator(false);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-600 text-white rounded-xl p-3">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900">General Conversation</h3>
                        <p className="text-sm text-slate-600">
                          Let customers start a conversation with you in their language
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">Voice Translation</Badge>
                          <Badge variant="outline" className="text-xs">Real-time Chat</Badge>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>

                {/* Product-specific QR */}
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-violet-300"
                  onClick={() => {
                    if (productsList.length === 0) {
                      setLocation('/add-product');
                      setShowQRGenerator(false);
                    } else {
                      // Show product selection
                      setSelectedProductForQR({ type: 'product-selection' });
                      setShowQRGenerator(false);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-violet-600 text-white rounded-xl p-3">
                        <Package className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900">Product Negotiation</h3>
                        <p className="text-sm text-slate-600">
                          Generate QR code for specific product negotiations
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">Price Negotiation</Badge>
                          <Badge variant="outline" className="text-xs">Voice Translation</Badge>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>

                {productsList.length === 0 && (
                  <div className="text-center py-4">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm">No products available for product-specific QR codes</p>
                    <Button
                      className="mt-3"
                      onClick={() => {
                        setShowQRGenerator(false);
                        setLocation('/add-product');
                      }}
                    >
                      Add Product First
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Selection Modal */}
      <AnimatePresence>
        {selectedProductForQR?.type === 'product-selection' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedProductForQR(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Select Product for QR Code</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProductForQR(null)}
                  >
                    ×
                  </Button>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {productsList.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedProductForQR({
                        type: 'product',
                        ...product
                      });
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{product.name}</h3>
                          <p className="text-xs text-gray-600">
                            ₹{product.price}/{product.unit} • Stock: {product.stock}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Generator Component */}
      <AnimatePresence>
        {selectedProductForQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedProductForQR(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Generate QR Code</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProductForQR(null)}
                  >
                    ×
                  </Button>
                </div>
              </div>
              
              <div className="p-4">
                <QRCodeGenerator
                  productId={selectedProductForQR.type === 'product' ? selectedProductForQR.id : undefined}
                  productName={selectedProductForQR.type === 'product' ? selectedProductForQR.name : undefined}
                  productPrice={selectedProductForQR.type === 'product' ? selectedProductForQR.price : undefined}
                  qrType={selectedProductForQR.type === 'general' ? 'general' : 'product'}
                  vendorId={user?.id || ''}
                  vendorName={user?.name || 'Vendor'}
                  onSessionCreated={(sessionId) => {
                    setActiveNegotiationSession(sessionId);
                    setSelectedProductForQR(null);
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
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Active Negotiation</h2>
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
                  sessionId={activeNegotiationSession}
                  userId={user?.id || ''}
                  userType="VENDOR"
                  initialLanguage="hi"
                  token="vendor-token"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
