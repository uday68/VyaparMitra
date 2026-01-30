import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';
import { UnauthorizedAccess } from './UnauthorizedAccess';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredUserType?: 'vendor' | 'customer';
  redirectTo?: string;
  showUnauthorized?: boolean; // Whether to show unauthorized page or redirect
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  requiredUserType,
  redirectTo = '/login',
  showUnauthorized = false
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [shouldShowUnauthorized, setShouldShowUnauthorized] = useState(false);

  useEffect(() => {
    // Don't do anything while loading
    if (isLoading) return;

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      setLocation(redirectTo);
      return;
    }

    // If specific user type is required but user doesn't match
    if (requiredUserType && user && user.type !== requiredUserType) {
      if (showUnauthorized) {
        setShouldShowUnauthorized(true);
      } else {
        // Redirect based on user type
        const defaultRoute = user.type === 'vendor' ? '/vendor' : '/customer/shop';
        setLocation(defaultRoute);
      }
      return;
    }

    // If user is authenticated but trying to access auth pages, redirect to appropriate dashboard
    if (!requireAuth && isAuthenticated && user) {
      const currentPath = window.location.pathname;
      if (currentPath === '/login' || currentPath === '/signup') {
        const defaultRoute = user.type === 'vendor' ? '/vendor' : '/customer/shop';
        setLocation(defaultRoute);
        return;
      }
    }

    // Reset unauthorized state if access is now allowed
    setShouldShowUnauthorized(false);
  }, [isLoading, isAuthenticated, user, requireAuth, requiredUserType, redirectTo, showUnauthorized, setLocation]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show unauthorized access page
  if (shouldShowUnauthorized) {
    return <UnauthorizedAccess />;
  }

  // If we're still here and authentication checks haven't redirected, show the content
  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  if (requiredUserType && user && user.type !== requiredUserType) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}