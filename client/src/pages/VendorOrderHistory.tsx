import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';

interface VendorOrder {
  id: string;
  customerName: string;
  customerPhone?: string;
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
  paymentStatus: 'pending' | 'paid' | 'failed';
  commission?: number;
}

export function VendorOrderHistory() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'delivered' | 'cancelled'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Mock data - in real app, this would come from API
  const [orders] = useState<VendorOrder[]>([
    {
      id: 'ORD-001',
      customerName: 'Sarah Kumar',
      customerPhone: '+91 98765 43210',
      product: '5kg Premium Apples',
      quantity: '5kg',
      originalPrice: 1200,
      negotiatedPrice: 900,
      finalAmount: 900,
      orderDate: '2024-01-26T10:30:00',
      deliveryDate: '2024-01-26T14:00:00',
      status: 'delivered',
      imageUrl: '/images/apples.jpg',
      paymentMethod: 'UPI',
      paymentStatus: 'paid',
      commission: 45
    },
    {
      id: 'ORD-002',
      customerName: 'Rajesh Sharma',
      customerPhone: '+91 87654 32109',
      product: '2kg Alphonso Mangoes',
      quantity: '2kg',
      originalPrice: 800,
      negotiatedPrice: 650,
      finalAmount: 650,
      orderDate: '2024-01-26T09:15:00',
      status: 'shipped',
      imageUrl: '/images/mangoes.jpg',
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'pending',
      commission: 32.5
    },
    {
      id: 'ORD-003',
      customerName: 'Anjali Patel',
      customerPhone: '+91 76543 21098',
      product: '3kg Fresh Bananas',
      quantity: '3kg',
      originalPrice: 180,
      negotiatedPrice: 150,
      finalAmount: 150,
      orderDate: '2024-01-25T16:45:00',
      deliveryDate: '2024-01-25T18:30:00',
      status: 'delivered',
      imageUrl: '/images/bananas.jpg',
      paymentMethod: 'UPI',
      paymentStatus: 'paid',
      commission: 7.5
    },
    {
      id: 'ORD-004',
      customerName: 'Vikram Singh',
      product: '4kg Mixed Vegetables',
      quantity: '4kg',
      originalPrice: 320,
      negotiatedPrice: 280,
      finalAmount: 280,
      orderDate: '2024-01-26T11:20:00',
      status: 'confirmed',
      imageUrl: '/images/vegetables.jpg',
      paymentMethod: 'UPI',
      paymentStatus: 'pending',
      commission: 14
    }
  ]);

  const filteredOrders = orders.filter(order => {
    const matchesFilter = selectedFilter === 'all' || order.status === selectedFilter;
    const orderDate = new Date(order.orderDate);
    const now = new Date();
    
    let matchesPeriod = true;
    if (selectedPeriod === 'today') {
      matchesPeriod = orderDate.toDateString() === now.toDateString();
    } else if (selectedPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesPeriod = orderDate >= weekAgo;
    } else if (selectedPeriod === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesPeriod = orderDate >= monthAgo;
    }
    
    return matchesFilter && matchesPeriod;
  });

  const totalRevenue = filteredOrders
    .filter(order => order.paymentStatus === 'paid')
    .reduce((sum, order) => sum + order.finalAmount, 0);

  const totalCommission = filteredOrders
    .filter(order => order.paymentStatus === 'paid')
    .reduce((sum, order) => sum + (order.commission || 0), 0);

  const completedOrders = filteredOrders.filter(order => order.status === 'delivered').length;
  const pendingPayments = filteredOrders.filter(order => order.paymentStatus === 'pending').length;

  const getStatusColor = (status: VendorOrder['status']) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: VendorOrder['paymentStatus']) => {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'pending': return 'text-orange-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={t('vendor.orderHistory', { defaultValue: 'Order History' })} showBack />
      
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Period Selector */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['today', 'week', 'month'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t(`orders.period.${period}`, { defaultValue: period.charAt(0).toUpperCase() + period.slice(1) })}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined">payments</span>
                <span className="text-xs opacity-80">{t('vendor.totalRevenue')}</span>
              </div>
              <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-xs opacity-80">{completedOrders} {t('orders.completedOrders')}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined">account_balance_wallet</span>
                <span className="text-xs opacity-80">{t('vendor.commission')}</span>
              </div>
              <p className="text-2xl font-bold">₹{totalCommission.toLocaleString()}</p>
              <p className="text-xs opacity-80">{pendingPayments} {t('vendor.pendingPayments')}</p>
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
              <p className="text-gray-500 text-lg font-medium">{t('vendor.noOrders')}</p>
              <p className="text-gray-400 text-sm mt-2">{t('vendor.waitingForOrders')}</p>
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
                        {t(`orders.status.${order.status}`)}
                      </span>
                      <span className="text-xs text-gray-500">#{order.id}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">{new Date(order.orderDate).toLocaleTimeString()}</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-600">person</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{order.customerName}</h3>
                      {order.customerPhone && (
                        <p className="text-sm text-gray-600">{order.customerPhone}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {t(`orders.payment.${order.paymentStatus}`)}
                      </p>
                      <p className="text-xs text-gray-500">{order.paymentMethod}</p>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="w-16 h-16 bg-gray-200 rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${order.imageUrl})` }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{order.product}</h4>
                      <p className="text-sm text-gray-600">{order.quantity}</p>
                      {order.originalPrice > order.negotiatedPrice && (
                        <p className="text-xs text-green-600">
                          {t('vendor.negotiatedDown')} ₹{order.originalPrice - order.negotiatedPrice}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">₹{order.finalAmount}</p>
                      {order.commission && (
                        <p className="text-xs text-green-600">+₹{order.commission} {t('vendor.commission')}</p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {order.status === 'pending' && (
                      <>
                        <button className="flex-1 bg-green-50 text-green-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
                          <span className="material-symbols-outlined text-sm mr-1">check</span>
                          {t('vendor.confirm')}
                        </button>
                        <button className="flex-1 bg-red-50 text-red-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                          <span className="material-symbols-outlined text-sm mr-1">close</span>
                          {t('vendor.cancel')}
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <button className="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                        <span className="material-symbols-outlined text-sm mr-1">local_shipping</span>
                        {t('vendor.markShipped')}
                      </button>
                    )}
                    {order.customerPhone && (
                      <button className="bg-gray-50 text-gray-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                        <span className="material-symbols-outlined text-sm">call</span>
                      </button>
                    )}
                    <button className="bg-gray-50 text-gray-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                      <span className="material-symbols-outlined text-sm">more_vert</span>
                    </button>
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