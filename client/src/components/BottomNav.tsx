import { Link, useLocation } from "wouter";
import { cn } from "../lib/utils";
import { useTranslation } from "../hooks/useTranslation";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRScanner from "./QRScanner";

interface BottomNavProps {
  currentPage?: "shop" | "bids" | "account" | "qr";
}

export function BottomNav({ currentPage }: BottomNavProps = {}) {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showSignOutMenu, setShowSignOutMenu] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-hide on desktop after inactivity
  useEffect(() => {
    if (isMobile) return;

    let timeout: NodeJS.Timeout;
    
    const resetTimer = () => {
      setIsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsVisible(false);
      }, 3000); // Hide after 3 seconds of inactivity
    };

    const handleMouseMove = () => resetTimer();
    const handleMouseEnter = () => {
      setIsVisible(true);
      clearTimeout(timeout);
    };

    // Initial timer
    resetTimer();

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isMobile]);

  // Don't show bottom nav if user is not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await logout();
      setShowSignOutMenu(false);
      setLocation('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Handle QR Scanner
  const handleQRScan = () => {
    setShowQRScanner(true);
  };

  const handleQRScanSuccess = (vendorData: { vendorId: string; shopName?: string }) => {
    setShowQRScanner(false);
    setLocation(`/shop/${vendorData.vendorId}`);
  };

  const handleQRClose = () => {
    setShowQRScanner(false);
  };

  // Show QR Scanner overlay
  if (showQRScanner) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <QRScanner
          onScanSuccess={handleQRScanSuccess}
          onClose={handleQRClose}
        />
      </div>
    );
  }

  // Different navigation items based on user type
  const getNavItems = () => {
    if (user.type === 'vendor') {
      return [
        { href: "/vendor", key: "bids", label: t('navigation.negotiations'), icon: "dashboard" },
        { href: "/add-product", key: "shop", label: "Add Product", icon: "add_box" },
        { href: "/profile", key: "account", label: t('navigation.profile'), icon: "account_circle", isProfile: true },
      ];
    } else {
      return [
        { href: "/customer/shop", key: "shop", label: t('navigation.shop'), icon: "storefront" },
        { href: "/order-history", key: "bids", label: t('navigation.orders'), icon: "receipt_long" },
        { href: "/profile", key: "account", label: t('navigation.profile'), icon: "account_circle", isProfile: true },
      ];
    }
  };

  const navItems = getNavItems();

  const handleProfileClick = (item: any) => {
    if (isMobile && item.isProfile) {
      setShowSignOutMenu(!showSignOutMenu);
    } else {
      setLocation(item.href);
    }
  };

  return (
    <>
      {/* Sign Out Menu Overlay for Mobile */}
      <AnimatePresence>
        {showSignOutMenu && isMobile && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-50"
              onClick={() => setShowSignOutMenu(false)}
            />
            
            {/* Sign Out Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-20 right-4 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden min-w-[200px]"
            >
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-lg">
                      {user.type === 'vendor' ? 'storefront' : 'person'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.type}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-2">
                <button
                  onClick={() => {
                    setShowSignOutMenu(false);
                    setLocation('/profile');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-gray-600 text-lg">settings</span>
                  <span className="text-sm font-medium text-gray-900">{t('navigation.settings')}</span>
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  <span className="text-sm font-medium">{t('common.logout')}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <motion.nav 
        initial={{ y: 0 }}
        animate={{ 
          y: !isMobile && !isVisible ? 100 : 0,
          opacity: !isMobile && !isVisible ? 0 : 1
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40",
          !isMobile && "hover:opacity-100 hover:translate-y-0"
        )}
        onMouseEnter={() => !isMobile && setIsVisible(true)}
        onMouseLeave={() => !isMobile && setTimeout(() => setIsVisible(false), 1000)}
      >
        <div className="flex items-center justify-around px-1 py-1">
          {/* Left Navigation Items */}
          <div className="flex flex-1 justify-around">
            {navItems.slice(0, Math.ceil(navItems.length / 2)).map((item) => {
              const isActive = currentPage === item.key || location === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => handleProfileClick(item)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors relative",
                    isActive ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-blue-600"
                  )}
                >
                  <span className={cn(
                    "material-symbols-outlined text-lg",
                    isActive ? "font-bold" : ""
                  )}>
                    {item.icon}
                  </span>
                  <span className={cn(
                    "text-xs",
                    isActive ? "font-bold" : "font-medium"
                  )}>
                    {item.label}
                  </span>
                  {/* Sign out indicator for mobile profile */}
                  {isMobile && item.isProfile && showSignOutMenu && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Center QR Scanner Button - PhonePe Style */}
          <div className="mx-2">
            <button
              onClick={handleQRScan}
              className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-3 shadow-lg transform hover:scale-105 transition-all duration-200 active:scale-95"
            >
              <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-xs">add</span>
              </div>
            </button>
            <div className="text-center mt-0.5">
              <span className="text-xs font-medium text-gray-700">Scan QR</span>
            </div>
          </div>

          {/* Right Navigation Items */}
          <div className="flex flex-1 justify-around">
            {navItems.slice(Math.ceil(navItems.length / 2)).map((item) => {
              const isActive = currentPage === item.key || location === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => handleProfileClick(item)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors relative",
                    isActive ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-blue-600"
                  )}
                >
                  <span className={cn(
                    "material-symbols-outlined text-lg",
                    isActive ? "font-bold" : ""
                  )}>
                    {item.icon}
                  </span>
                  <span className={cn(
                    "text-xs",
                    isActive ? "font-bold" : "font-medium"
                  )}>
                    {item.label}
                  </span>
                  {/* Sign out indicator for mobile profile */}
                  {isMobile && item.isProfile && showSignOutMenu && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.nav>
    </>
  );
}
