import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export function CustomerVoiceNegotiation() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(true);
  const [currentOffer, setCurrentOffer] = useState('₹170');
  const [vendorCounter, setVendorCounter] = useState('₹180');

  // Mock negotiation data
  const negotiation = {
    product: 'Apples',
    quantity: '5 kg',
    customerOffer: currentOffer,
    vendorCounter: vendorCounter,
    vendorName: 'Sanjay',
    vendorImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCehz--AwtYe-LzIXqpopU_OW-PGLIf8hM5Nf1GolSLdqtAHC8iL2Lr2nGyWag8sTInOQa4J08qzRvU5E3Y_ZcUqyjA2mP71-yDOrqpD3YzsbbuIOCyKFHeCMnYid9Ffytt8eBHADdP8z0T3DOPC0TIRl5HwKwZFAQ_6TueSDWysP3DM1lfRNyd1t_cagXWen8qEJleCrBudba05UW_kE1AynmzrprRURlx0hAlEc4mjLGF7m8LIS4m5aegAtPYnNfJDUxKo2GQ',
    productImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxVvxDzjVnsxvKagb9ftaTI0p0ngPOuUtwTjEVoMLU83RRfNR5UgVLxXp9CABTefPPXle7ynxi5310Jf6SKpcQCme6N10OZzdi_uUP9PkWRkXrzrKjN5yznF7kKDJGHGtnGAY095SDHIX1f2DIKqdiXvs7vJx6tX5tIBvBzHuWcGVPS49vLSCL-3jhhQ6GqNFyaWqeND-Y6n6fahMc1DZgm2BB5mZjoO2r_IkbhV41pXwFOZC06OT2b8-Png6KOk3GYVSDo0H8'
  };

  const handleAccept = () => {
    navigate(`/customer/deal-confirmation/${productId}`);
  };

  const handleCounterOffer = () => {
    setCurrentOffer('₹175');
    // Simulate voice command
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  // Waveform animation bars
  const WaveformBar = ({ delay = 0 }: { delay?: number }) => (
    <div 
      className="waveform-bar bg-blue-600 rounded-sm mx-0.5"
      style={{ 
        width: '3px',
        animationDelay: `${delay}s`,
        animation: 'pulse 1.5s ease-in-out infinite'
      }}
    />
  );

  return (
    <div className="relative flex h-screen w-full flex-col max-w-[430px] mx-auto bg-white dark:bg-gray-900 overflow-hidden shadow-2xl">
      {/* TopAppBar */}
      <div className="flex items-center bg-white dark:bg-gray-900 p-4 pb-2 justify-between border-b dark:border-gray-800 sticky top-0 z-10">
        <div className="text-gray-900 dark:text-white flex size-12 shrink-0 items-center justify-start cursor-pointer" onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </div>
        <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          {negotiation.vendorName} (Vendor)
        </h2>
        <div className="flex w-12 items-center justify-end">
          <p className="text-blue-600 text-sm font-bold leading-normal tracking-[0.015em] shrink-0 cursor-pointer">English</p>
        </div>
      </div>

      {/* Negotiation Summary Card */}
      <div className="p-4 bg-white dark:bg-gray-900">
        <div className="flex items-stretch justify-between gap-4 rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm bg-gray-50 dark:bg-gray-900/50">
          <div className="flex flex-col gap-1 flex-[2_2_0px]">
            <div className="inline-flex px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-wider w-fit mb-1">
              Live Offer
            </div>
            <p className="text-gray-900 dark:text-white text-lg font-bold leading-tight">
              {negotiation.product} • {negotiation.quantity}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-normal">
              Your offer: <span className="font-semibold text-gray-900 dark:text-white">{negotiation.customerOffer}/kg</span>
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse"></span>
              <p className="text-amber-600 dark:text-amber-500 text-sm font-bold leading-normal">
                Vendor countered {negotiation.vendorCounter}
              </p>
            </div>
          </div>
          <div 
            className="w-24 h-24 bg-center bg-no-repeat bg-cover rounded-lg shrink-0" 
            style={{backgroundImage: `url("${negotiation.productImage}")`}}
          />
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {/* Vendor Message */}
        <div className="flex items-end gap-3 max-w-[85%]">
          <div 
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 shrink-0" 
            style={{backgroundImage: `url("${negotiation.vendorImage}")`}}
          />
          <div className="flex flex-1 flex-col gap-1 items-start">
            <p className="text-gray-500 dark:text-gray-500 text-[11px] font-medium ml-1">Sanjay</p>
            <div className="text-sm font-normal leading-relaxed rounded-2xl rounded-bl-none px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 shadow-sm">
              The apples are fresh from the orchard today. I can't go below ₹180 for this quality. They are premium Shimla apples.
            </div>
          </div>
        </div>

        {/* User Message */}
        <div className="flex items-end gap-3 justify-end max-w-[85%] ml-auto">
          <div className="flex flex-1 flex-col gap-1 items-end">
            <p className="text-gray-500 dark:text-gray-500 text-[11px] font-medium mr-1">You</p>
            <div className="text-sm font-normal leading-relaxed rounded-2xl rounded-br-none px-4 py-3 bg-blue-600 text-white shadow-sm">
              Can we do ₹170? I'm buying 5 kg for the whole week.
            </div>
          </div>
          <div className="bg-blue-100 flex items-center justify-center rounded-full w-8 h-8 shrink-0">
            <span className="material-symbols-outlined text-blue-600 text-sm">person</span>
          </div>
        </div>

        {/* Vendor Counter */}
        <div className="flex items-end gap-3 max-w-[85%]">
          <div 
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 shrink-0" 
            style={{backgroundImage: `url("${negotiation.vendorImage}")`}}
          />
          <div className="flex flex-1 flex-col gap-1 items-start">
            <p className="text-gray-500 dark:text-gray-500 text-[11px] font-medium ml-1">Sanjay</p>
            <div className="text-sm font-normal leading-relaxed rounded-2xl rounded-bl-none px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 shadow-sm">
              Sir, ₹180 is the best I can do. These are the finest in the market right now.
            </div>
          </div>
        </div>
      </div>

      {/* Footer Negotiation Controls */}
      <div className="bg-white dark:bg-gray-900 border-t dark:border-gray-800 p-4 pb-8 space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {/* Quick Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={handleAccept}
            className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 hover:bg-blue-700"
          >
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            Accept ₹180
          </button>
          <button 
            onClick={handleCounterOffer}
            className="flex-1 bg-white dark:bg-gray-800 border-2 border-blue-600 text-blue-600 font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
            Offer ₹175
          </button>
        </div>

        {/* Voice Command Footer */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="text-center">
            <h3 className="text-gray-900 dark:text-white tracking-tight text-lg font-bold leading-tight px-4">
              Say "Accept ₹180" or "Offer ₹175"
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              {isListening ? 'Listening for voice command...' : 'Tap mic to speak'}
            </p>
          </div>

          {/* Waveform Graphic */}
          {isListening && (
            <div className="flex items-center justify-center h-12 w-full">
              <WaveformBar delay={0.1} />
              <WaveformBar delay={0.2} />
              <WaveformBar delay={0.3} />
              <WaveformBar delay={0.4} />
              <WaveformBar delay={0.5} />
              <WaveformBar delay={0.6} />
              <WaveformBar delay={0.7} />
              <WaveformBar delay={0.8} />
              <WaveformBar delay={0.9} />
              <WaveformBar delay={1.0} />
            </div>
          )}

          {/* Mic Button */}
          <div className="relative">
            {isListening && <div className="absolute inset-0 bg-blue-600/20 rounded-full scale-150 animate-pulse"></div>}
            <button 
              onClick={toggleListening}
              className={`relative text-white size-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
                isListening ? 'bg-blue-600 shadow-blue-600/40' : 'bg-gray-400'
              }`}
            >
              <span className="material-symbols-outlined text-3xl">mic</span>
            </button>
          </div>
        </div>
      </div>

      {/* iOS Home Indicator */}
      <div className="h-1.5 w-32 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-2 shrink-0"></div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { height: 8px; }
          50% { height: 24px; }
        }
        .waveform-bar {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}