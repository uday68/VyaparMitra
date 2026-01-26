import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';

interface CustomerOrder {
  id: string;
  vendorName: string;
  vendorLocation: string;
  product: string;
  quantity: string;
  originalPrice: number;
  negotiatedPrice: number;
  finalAmount: number;
  orderDate: string;
  deliveryDate?: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  imageUrl: string;
  paymentMethod: string;
  trackingId?: string;
}

export function CustomerOrderHistory() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'delivered' | 'cancelled'>('all');

  // Mock data - in real app, this would come from API
  const [orders] = useState<CustomerOrder[]>([
    {
      id: 'ORD-001',
      vendorName: 'Raj Fruit Store',
      vendorLocation: 'Sector 15, Noida',
      product: '5kg Premium Apples',
      quantity: '5kg',
      originalPrice: 1200,
      negotiatedPrice: 900,
      finalAmount: 900,
      orderDate: '2024-01-25',
      deliveryDate: '2024-01-26',
      status: 'delivered',
      imageUrl: '/images/apples.jpg',
      paymentMethod: 'UPI',
      trackingId: 'TRK123456'
    },
    {
      id: 'ORD-002',
      vendorName: 'Fresh Vegetables Hub',
      vendorLocation: 'Market Road, Delhi',
      product: '3kg Organic Tomatoes',
      quantity: '3kg',
      originalPrice: 180,
      negotiatedPrice: 150,
      finalAmount: 150,
      orderDate: '2024-01-24',
      status: 'shipped',
      imageUrl: '/images/tomatoes.jpg',
      paymentMethod: 'Cash on Delivery',
      trackingId: 'TRK123457'
    },
    {
      id: 'ORD-003',
      vendorName: 'Mango Paradise',
      vendorLocation: 'Fruit Market, Mumbai',
      product: '2kg Alphonso Mangoes',
      quantity: '2kg',
      originalPrice: 800,
      negotiatedPrice: 650,
      finalAmount: 650,
      orderDate: '2024-01-23',
      status: 'confirmed',
      imageUrl: '/images/mangoes.jpg',
      paymentMethod: 'UPI'
    },
    {
      id: 'ORD-004',
      vendorName: 'Green Grocers',
      vendorLocation: 'Central Market, Pune',
      product: '4kg Mixed Vegetables',
      quantity: '4kg',
      originalPrice: 320,
      negotiatedPrice: 280,
      finalAmount: 280,
      orderDate: '2024-01-22',
      status: 'pending',
      imageUrl: '/images/vegetables.jpg',
      paymentMethod: 'UPI'
    }
  ]);

  const filteredOrders = orders.filter(order => 
    selectedFilter === 'all' || order.status === selectedFilter
  );

  const totalSpent = orders
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + order.finalAmount, 0);

  const totalSavings = orders
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + (order.originalPrice - order.negotiatedPrice), 0);

  const getStatusColor = (status: CustomerOrder['status']) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: CustomerOrder['status']) => {
    switch (status) {
      case 'delivered': return 'check_circle';
      case 'shipped': return 'local_shipping';
      case 'confirmed': return 'schedule';
      case 'pending': return 'hourglass_empty';
      case 'cancelled': return 'cancel';
      default: return 'help';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={t('orders.title')} showBack />
      
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Summary Cards */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined">shopping_bag</span>
                <span className="text-xs opacity-80">{t('orders.totalSpent')}</span>
              </div>
              <p className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</p>
              <p className="text-xs opacity-80">{orders.filter(o => o.status === 'delivered').length} {t('orders.completedOrders')}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined">savings</span>
                <span className="text-xs opacity-80">{t('orders.totalSavings')}</span>
              </div>
              <p className="text-2xl font-bold">₹{totalSavings.toLocaleString()}</p>
              <p className="text-xs opacity-80">{t('orders.throughNegotiation')}</p>
            </motion.div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pb-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['all', 'pending', 'delivered', 'cancelled'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  selectedFilter === filter
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t(`orders.filter.${filter}`, { defaultValue: filter.charAt(0).toUpperCase() + filter.slice(1) })}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="px-4 pb-20 space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">receipt_long</span>
              <p className="text-gray-500 text-lg font-medium">{t('orders.noOrders')}</p>
              <p className="text-gray-400 text-sm mt-2">{t('orders.startShopping')}</p>
              <button
                onClick={() => setLocation('/customer/shop')}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {t('navigation.shop')}
              </button>
            </div>
          ) : (
            filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
              >
                <div className="p-4">
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        <span className="material-symbols-outlined text-xs mr-1">{getStatusIcon(order.status)}</span>
                        {t(`orders.status.${order.status}`)}
                      </span>
                      <span className="text-xs text-gray-500">#{order.id}</span>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</span>
                  </div>

                  {/* Product Info */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="w-16 h-16 bg-gray-200 rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${order.imageUrl})` }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{order.product}</h3>
                      <p className="text-sm text-gray-600">{order.vendorName}</p>
                      <p className="text-xs text-gray-500">{order.vendorLocation}</p>
                    </div>
                  </div>

                  {/* Price Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {order.originalPrice > order.negotiatedPrice && (
                        <span className="text-sm text-gray-500 line-through">₹{order.originalPrice}</span>
                      )}
                      <span className="text-lg font-bold text-gray-900">₹{order.finalAmount}</span>
                      {order.originalPrice > order.negotiatedPrice && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {t('orders.saved')} ₹{order.originalPrice - order.negotiatedPrice}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">{order.paymentMethod}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {order.trackingId && (
                      <button className="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                        <span className="material-symbols-outlined text-sm mr-1">local_shipping</span>
                        {t('orders.trackOrder')}
                      </button>
                    )}
                    <button className="flex-1 bg-gray-50 text-gray-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                      <span className="material-symbols-outlined text-sm mr-1">receipt</span>
                      {t('orders.viewDetails')}
                    </button>
                    {order.status === 'delivered' && (
                      <button className="bg-green-50 text-green-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
                        <span className="material-symbols-outlined text-sm">refresh</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <BottomNav currentPage="bids" />
    </div>
  );
}