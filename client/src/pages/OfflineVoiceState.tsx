import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function OfflineVoiceState() {
  const navigate = useNavigate();
  const [isRetrying, setIsRetrying] = useState(false);
  const [offlineFeatures, setOfflineFeatures] = useState({
    voiceCommands: true,
    productBrowsing: true,
    priceCalculation: true,
    orderHistory: false,
    realTimeNegotiation: false
  });

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    
    // Simulate connection attempt
    setTimeout(() => {
      setIsRetrying(false);
      // Check if online
      if (navigator.onLine) {
        navigate(-1);
      }
    }, 2000);
  };

  const handleContinueOffline = () => {
    // Enable offline mode and continue
    localStorage.setItem('offlineMode', 'true');
    navigate('/customer/shop');
  };

  const handleGoOnline = () => {
    // Try to go online
    window.location.reload();
  };

  useEffect(() => {
    const handleOnline = () => {
      navigate(-1);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [navigate]);

  const FeatureStatus = ({ feature, available, description }: { 
    feature: string; 
    available: boolean; 
    description: string; 
  }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${available ? 'bg-green-500' : 'bg-red-500'}`} />
        <div>
          <p className="font-medium text-gray-900 dark:text-white text-sm">{feature}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
        available 
          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
          : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
      }`}>
        {available ? 'Available' : 'Offline'}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="max-w-md mx-auto w-full bg-white dark:bg-gray-800 min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-gray-900 dark:text-white">arrow_back</span>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Offline Mode</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Limited connectivity</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Offline Status */}
          <div className="text-center">
            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-orange-600 text-3xl">wifi_off</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              You're Offline
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              No internet connection detected. Some features are still available in offline mode.
            </p>
          </div>

          {/* Connection Status */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="font-semibold text-orange-800 dark:text-orange-400">Connection Status</span>
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Trying to reconnect automatically. You can continue using available offline features.
            </p>
          </div>

          {/* Available Features */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">offline_bolt</span>
              Offline Features
            </h3>
            <div className="space-y-3">
              <FeatureStatus
                feature="Voice Commands"
                available={offlineFeatures.voiceCommands}
                description="Basic voice recognition works offline"
              />
              <FeatureStatus
                feature="Product Browsing"
                available={offlineFeatures.productBrowsing}
                description="View cached product information"
              />
              <FeatureStatus
                feature="Price Calculator"
                available={offlineFeatures.priceCalculation}
                description="Calculate totals and estimates"
              />
              <FeatureStatus
                feature="Order History"
                available={offlineFeatures.orderHistory}
                description="View recent orders (requires sync)"
              />
              <FeatureStatus
                feature="Live Negotiation"
                available={offlineFeatures.realTimeNegotiation}
                description="Real-time chat with vendors"
              />
            </div>
          </div>

          {/* Offline Voice Assistant */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white text-lg">mic</span>
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-1">
                  Voice Assistant (Offline Mode)
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Limited voice commands available without internet connection.
                </p>
                <div className="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-3">
                  <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-1">
                    Available Commands:
                  </p>
                  <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• "Show products" - Browse cached items</li>
                    <li>• "Calculate total" - Price calculations</li>
                    <li>• "Go back" - Navigation</li>
                    <li>• "Settings" - App preferences</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRetryConnection}
              disabled={isRetrying}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isRetrying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Reconnecting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">refresh</span>
                  Try to Reconnect
                </>
              )}
            </button>

            <button
              onClick={handleContinueOffline}
              className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">offline_bolt</span>
              Continue Offline
            </button>

            <button
              onClick={handleGoOnline}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">wifi</span>
              Check Connection
            </button>
          </div>

          {/* Tips for Offline Usage */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">tips_and_updates</span>
              Offline Tips
            </h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-xs mt-0.5 text-gray-500">circle</span>
                Your data will sync automatically when connection is restored
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-xs mt-0.5 text-gray-500">circle</span>
                Voice commands work with basic offline recognition
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-xs mt-0.5 text-gray-500">circle</span>
                Saved negotiations will be sent when you're back online
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-xs mt-0.5 text-gray-500">circle</span>
                Move to an area with better signal for full features
              </li>
            </ul>
          </div>

          {/* Data Usage Info */}
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Offline mode uses minimal battery and no data.
              <br />
              Last synced: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}