import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { CustomerOrderHistory } from './CustomerOrderHistory';
import { VendorOrderHistory } from './VendorOrderHistory';

export default function OrderHistory() {
  const { user, isLoading } = useAuth();

  // Show loading while checking user type
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Route to appropriate order history based on user type
  if (user.type === 'vendor') {
    return <VendorOrderHistory />;
  } else {
    return <CustomerOrderHistory />;
  }
}