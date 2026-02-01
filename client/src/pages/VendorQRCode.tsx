import React, { useState } from 'react';
import { useLocation } from 'wouter';

export function VendorQRCode() {
  const [, setLocation] = useLocation();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    // Simulate download
    setTimeout(() => {
      setIsDownloading(false);
      // In a real app, this would trigger a download
      console.log('QR Code downloaded');
    }, 1000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sanjay\'s Fruit Shop - QR Code',
          text: 'Scan this QR code to start voice negotiation with our shop!',
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const shopData = {
    name: 'Sanjay\'s Fruit Shop',
    id: 'SANJAY88219',
    qrCodeUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgmhSkUvfO1GxWPpVrBYnHgrBTyv5ak-2FpXN3U0_-gwrQSylgI8eJ3SzuNGVakT8JPkX42MtVZ1nIL8x7wzgvM37n1Ye4s9-em-yKdPkXPIR7_G9VCHIMrRzhal5rCx7Drl9W3QH5vQ-M1-IQPmP2ntmngpcCTkOYlPypnr1u9AnmLtz_MtIbgCZe-AFMD85NfJpgW9kOsR3-gBJ8J-jmmQQnQmO7YzeGpEuln7c7z0byb43a4yjZyZNP2tXnm3bmkPBe5cEw'
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 h-16 max-w-md mx-auto">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center justify-center p-2 -ml-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1 className="text-gray-900 dark:text-white font-bold text-lg">Shop QR Code</h1>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1 text-blue-600 font-bold text-sm hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-lg">print</span>
            Print
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-8">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-lg flex flex-col items-center">
            <div className="relative w-full aspect-square max-w-[280px] bg-white p-4 rounded-xl shadow-inner border border-gray-50 mb-8">
              <div 
                className="w-full h-full bg-center bg-no-repeat bg-contain" 
                style={{backgroundImage: `url("${shopData.qrCodeUrl}")`}}
                aria-label="Shop payment and identity QR code"
              />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {shopData.name}
              </h2>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 font-mono tracking-wider">
                ID: {shopData.id}
              </p>
            </div>
          </div>

          <div className="w-full mt-10 space-y-4">
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-transform hover:bg-blue-700 disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">download</span>
                  Download Image
                </>
              )}
            </button>
            <button 
              onClick={handleShare}
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <span className="material-symbols-outlined">share</span>
              Share QR Code
            </button>
          </div>
        </div>
      </main>

      <div className="max-w-md mx-auto w-full px-6 pb-10">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-start gap-4">
          <div className="bg-blue-600 rounded-full p-2 text-white shrink-0">
            <span className="material-symbols-outlined text-lg">record_voice_over</span>
          </div>
          <div>
            <p className="text-blue-600 font-bold text-sm mb-0.5">Voice Negotiation Enabled</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
              Customers scan this to start chatting with you in their language. Negotiation happens automatically!
            </p>
          </div>
        </div>
      </div>

      <div className="h-8 w-full bg-transparent"></div>
    </div>
  );
}