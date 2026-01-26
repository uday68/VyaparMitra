import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function VoiceTransactionSuccess() {
  const navigate = useNavigate();
  const { transactionId } = useParams<{ transactionId: string }>();
  const [isAnimating, setIsAnimating] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Animation sequence
    const timer1 = setTimeout(() => setIsAnimating(false), 2000);
    const timer2 = setTimeout(() => setShowDetails(true), 2500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const transactionData = {
    id: transactionId || 'TXN-8821',
    amount: '₹875',
    product: '5kg Fresh Apples',
    vendor: 'Sanjay\'s Fruit Shop',
    finalPrice: '₹175/kg',
    timestamp: new Date().toLocaleString(),
    paymentMethod: 'Voice Negotiated',
    status: 'Completed'
  };

  const handleContinueShopping = () => {
    navigate('/customer/shop');
  };

  const handleViewReceipt = () => {
    navigate(`/customer/receipt/${transactionId}`);
  };

  const handleVoiceCommand = (command: string) => {
    if (command.includes('continue')) {
      handleContinueShopping();
    } else if (command.includes('receipt')) {
      handleViewReceipt();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-8">
        {/* Success Animation */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative mb-8">
            {/* Animated Success Icon */}
            <div className={`relative transition-all duration-1000 ${isAnimating ? 'scale-0 rotate-180' : 'scale-100 rotate-0'}`}>
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                <span className="material-symbols-outlined text-white text-4xl">check</span>
              </div>
            </div>
            
            {/* Ripple Effect */}
            {isAnimating && (
              <>
                <div className="absolute inset-0 w-24 h-24 bg-green-500/30 rounded-full animate-ping"></div>
                <div className="absolute inset-0 w-24 h-24 bg-green-500/20 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
              </>
            )}
          </div>

          {/* Success Message */}
          <div className={`text-center transition-all duration-1000 ${showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Transaction Successful!
            </h1>
            <p className="text-green-600 dark:text-green-400 text-lg font-semibold mb-1">
              {transactionData.amount} Paid
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-base">
              Voice negotiation completed
            </p>
          </div>

          {/* Transaction Details */}
          {showDetails && (
            <div className="w-full mt-8 space-y-4 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Transaction Details</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {transactionData.status}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Product:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{transactionData.product}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Final Price:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{transactionData.finalPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Vendor:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{transactionData.vendor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                    <span className="font-mono text-sm text-gray-900 dark:text-white">{transactionData.id}</span>
                  </div>
                </div>
              </div>

              {/* Voice Confirmation */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-lg">record_voice_over</span>
                  </div>
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-400">Voice Negotiation Complete</p>
                    <p className="text-sm text-green-700 dark:text-green-300">Deal agreed through voice commands</p>
                  </div>
                </div>
                <div className="bg-green-100 dark:bg-green-900/40 rounded-lg p-3">
                  <p className="text-sm text-green-800 dark:text-green-300 italic">
                    "Accept offer at 175 rupees per kg" ✓
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showDetails && (
          <div className="space-y-3 mt-8 animate-fade-in">
            <button
              onClick={handleViewReceipt}
              className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-600/20 hover:bg-green-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">receipt</span>
              View Receipt
            </button>
            <button
              onClick={handleContinueShopping}
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600 font-bold py-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">shopping_cart</span>
              Continue Shopping
            </button>
          </div>
        )}

        {/* Voice Assistant */}
        {showDetails && (
          <div className="mt-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-1 h-4 bg-green-500 rounded-full animate-pulse"></span>
                <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                <span className="w-1 h-3 bg-green-500 rounded-full animate-pulse"></span>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 dark:text-white text-sm font-medium">
                  Say <span className="text-green-600 font-bold">"Continue shopping"</span> or <span className="text-green-600 font-bold">"Show receipt"</span>
                </p>
              </div>
              <button
                onClick={() => handleVoiceCommand('continue')}
                className="p-2 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">mic</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}