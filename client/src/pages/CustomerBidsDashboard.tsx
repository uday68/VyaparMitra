import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign,
  MessageCircle,
  Mic,
  Eye
} from 'lucide-react';

interface CustomerBid {
  id: string;
  productName: string;
  vendorName: string;
  vendorLocation: string;
  originalPrice: number;
  bidAmount: number;
  currentPrice: number;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';
  createdAt: string;
  expiresAt: string;
  lastActivity: string;
  negotiationCount: number;
  savingsAmount: number;
  savingsPercentage: number;
  isVoiceBid: boolean;
  productImage: string;
}

export function CustomerBidsDashboard() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active');

  // Mock data - in real app, this would come from API
  const [bids] = useState<CustomerBid[]>([
    {
      id: 'bid_001',
      productName: 'Premium Shimla Apples',
      vendorName: 'Fresh Fruit Paradise',
      vendorLocation: 'Sector 18, Noida',
      originalPrice: 200,
      bidAmount: 150,
      currentPrice: 175,
      status: 'countered',
      createdAt: '2024-01-26T10:30:00Z',
      expiresAt: '2024-01-26T18:30:00Z',
      lastActivity: '2024-01-26T14:15:00Z',
      negotiationCount: 3,
      savingsAmount: 25,
      savingsPercentage: 12.5,
      isVoiceBid: true,
      productImage: '/images/apples.jpg'
    },
    {
      id: 'bid_002',
      productName: 'Organic Tomatoes',
      vendorName: 'Green Vegetables Hub',
      vendorLocation: 'Central Market, Delhi',
      originalPrice: 80,
      bidAmount: 60,
      currentPrice: 70,
      status: 'pending',
      createdAt: '2024-01-26T09:15:00Z',
      expiresAt: '2024-01-26T17:15:00Z',
      lastActivity: '2024-01-26T09:15:00Z',
      negotiationCount: 1,
      savingsAmount: 10,
      savingsPercentage: 12.5,
      isVoiceBid: false,
      productImage: '/images/tomatoes.jpg'
    },
    {
      id: 'bid_003',
      productName: 'Alphonso Mangoes',
      vendorName: 'Mango King',
      vendorLocation: 'Fruit Market, Mumbai',
      originalPrice: 800,
      bidAmount: 650,
      currentPrice: 650,
      status: 'accepted',
      createdAt: '2024-01-25T16:20:00Z',
      expiresAt: '2024-01-25T20:20:00Z',
      lastActivity: '2024-01-25T18:45:00Z',
      negotiationCount: 2,
      savingsAmount: 150,
      savingsPercentage: 18.75,
      isVoiceBid: true,
      productImage: '/images/mangoes.jpg'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'countered': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'countered': return <MessageCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'expired': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filterBids = (status: string) => {
    switch (status) {
      case 'active':
        return bids.filter(bid => ['pending', 'countered'].includes(bid.status));
      case 'completed':
        return bids.filter(bid => ['accepted', 'rejected'].includes(bid.status));
      case 'expired':
        return bids.filter(bid => bid.status === 'expired');
      default:
        return bids;
    }
  };

  const handleBidAction = (bidId: string, action: 'accept' | 'counter' | 'view') => {
    const bid = bids.find(b => b.id === bidId);
    if (!bid) return;

    switch (action) {
      case 'accept':
        // Navigate to deal confirmation
        setLocation(`/customer/deal-confirmation/${bidId}`);
        break;
      case 'counter':
        // Navigate to negotiation
        setLocation(`/customer/negotiation/${bid.id}`);
        break;
      case 'view':
        // Navigate to bid details
        setLocation(`/customer/bid/${bidId}`);
        break;
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  const activeBids = filterBids('active');
  const completedBids = filterBids('completed');
  const expiredBids = filterBids('expired');

  const totalSavings = bids
    .filter(bid => bid.status === 'accepted')
    .reduce((sum, bid) => sum + bid.savingsAmount, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        title={t('bids.dashboard.title')}
        showBack={true}
      />

      <div className="pb-20">
        {/* Summary Cards */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">{t('bids.dashboard.activeBids')}</p>
                    <p className="text-2xl font-bold text-gray-900">{activeBids.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">{t('bids.dashboard.totalSavings')}</p>
                    <p className="text-2xl font-bold text-green-600">₹{totalSavings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">
                {t('bids.dashboard.tabs.active')} ({activeBids.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                {t('bids.dashboard.tabs.completed')} ({completedBids.length})
              </TabsTrigger>
              <TabsTrigger value="expired">
                {t('bids.dashboard.tabs.expired')} ({expiredBids.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4">
              <div className="space-y-3">
                {activeBids.map((bid, index) => (
                  <motion.div
                    key={bid.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                            <img
                              src={bid.productImage}
                              alt={bid.productName}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                              }}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-medium text-gray-900 truncate">
                                  {bid.productName}
                                </h3>
                                <p className="text-sm text-gray-600">{bid.vendorName}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {bid.isVoiceBid && (
                                  <Mic className="h-4 w-4 text-blue-600" />
                                )}
                                <Badge className={getStatusColor(bid.status)}>
                                  {getStatusIcon(bid.status)}
                                  <span className="ml-1">{t(`bids.status.${bid.status}`)}</span>
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-gray-500">{t('bids.originalPrice')}</p>
                                <p className="text-sm font-medium line-through text-gray-500">
                                  ₹{bid.originalPrice}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">{t('bids.currentOffer')}</p>
                                <p className="text-sm font-bold text-green-600">
                                  ₹{bid.currentPrice}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <span className="text-xs text-gray-500">
                                  {formatTimeRemaining(bid.expiresAt)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {bid.negotiationCount} {t('bids.rounds')}
                                </span>
                              </div>
                              
                              <div className="flex gap-2">
                                {bid.status === 'countered' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleBidAction(bid.id, 'accept')}
                                    className="text-xs"
                                  >
                                    {t('bids.actions.accept')}
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleBidAction(bid.id, 'counter')}
                                  className="text-xs"
                                >
                                  {bid.status === 'pending' ? t('bids.actions.negotiate') : t('bids.actions.counter')}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                
                {activeBids.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-4">{t('bids.dashboard.noActiveBids')}</p>
                      <Button onClick={() => setLocation('/customer/shop')}>
                        {t('bids.dashboard.startShopping')}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              <div className="space-y-3">
                {completedBids.map((bid, index) => (
                  <motion.div
                    key={bid.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                            <img
                              src={bid.productImage}
                              alt={bid.productName}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                              }}
                            />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-medium text-gray-900">{bid.productName}</h3>
                                <p className="text-sm text-gray-600">{bid.vendorName}</p>
                              </div>
                              <Badge className={getStatusColor(bid.status)}>
                                {getStatusIcon(bid.status)}
                                <span className="ml-1">{t(`bids.status.${bid.status}`)}</span>
                              </Badge>
                            </div>

                            {bid.status === 'accepted' && (
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingDown className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600 font-medium">
                                  {t('bids.saved')} ₹{bid.savingsAmount} ({bid.savingsPercentage}%)
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">
                                {new Date(bid.lastActivity).toLocaleDateString()}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBidAction(bid.id, 'view')}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                {t('bids.actions.viewDetails')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="expired" className="mt-4">
              <div className="space-y-3">
                {expiredBids.map((bid, index) => (
                  <motion.div
                    key={bid.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="opacity-75">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                            <img
                              src={bid.productImage}
                              alt={bid.productName}
                              className="w-full h-full object-cover rounded-lg grayscale"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                              }}
                            />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-medium text-gray-700">{bid.productName}</h3>
                                <p className="text-sm text-gray-500">{bid.vendorName}</p>
                              </div>
                              <Badge className={getStatusColor(bid.status)}>
                                {getStatusIcon(bid.status)}
                                <span className="ml-1">{t(`bids.status.${bid.status}`)}</span>
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">
                                {t('bids.expiredOn')} {new Date(bid.expiresAt).toLocaleDateString()}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setLocation(`/customer/shop?product=${bid.productName}`)}
                              >
                                {t('bids.actions.bidAgain')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                
                {expiredBids.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">{t('bids.dashboard.noExpiredBids')}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BottomNav currentPage="bids" />
    </div>
  );
}