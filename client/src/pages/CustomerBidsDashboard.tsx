import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function CustomerBidsDashboard() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'active' | 'completed'>('active');

  const mockBids = [
    {
      id: 1,
      shopName: "Sanjay's Fruit Shop",
      product: "Apples (Fresh Himachal)",
      currentBid: "₹180",
      marketAvg: "₹195",
      status: "waiting",
      timeAgo: "2h ago",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCbNfu0qTvjnnsAr_GASt8B9ZniphrEqVdfAijzUu1E8TEELAKU0SSxb7bkLMmV8oOOTIoB_k82Ah3TWHLRbbxChQMS2LOQ58-ibHaCxvDsVssX8YVBtaXOfj9ET2GSmSQuYaraXaS8JOyrYN05zESwfqfjwhjIYrC9pDPV6MCkhLUA62lhk_MZpcuekkjscvk2LU7kW-VbrbRjUXWbFRLtiIknhnqrnVh7Qckl89v1p9FniTwAKVDtJJN53exLwZlkBTgypWla"
    },
    {
      id: 2,
      shopName: "Gopal's Veggies",
      product: "Carrots (Organic Ooty)",
      currentBid: "₹40",
      vendorPrice: "₹45",
      status: "counter-offer",
      timeAgo: "5m ago",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDb77obUcnv5Y50kIFCeZQ1gbJCxg_VVwbmaINlCmD51qE8ua6QmnvKD_zmoutXC74ZVk8wfPk1zqv8JZgHbueLXZq1kCQUugSux7rs_VfGA4VO3CSubgMxNNd22U-29lW4qS0kyhcmnf5mojiG52sIVgpAg4GZJMH5DdRaSvOhA660sNqC461NTXi2IeWnqLfmmaYe2gOeg8LeP2E_nC27j0nXOZwRKpc60JWTPLq2TZ6hKIbxk8C8DZhcEZch8PIcl5_i6oSV"
    }
  ];

  const handleChat = (bidId: number) => {
    navigate(`/chat/${bidId}`);
  };

  const handleUpdateBid = (bidId: number) => {
    // Handle bid update
    console.log('Update bid:', bidId);
  };

  const handleAcceptOffer = (bidId: number) => {
    navigate(`/transaction-active/${bidId}`);
  };

  const handleVoiceCommand = (command: string) => {
    if (command.toLowerCase().includes('status') && command.toLowerCase().includes('apple')) {
      // Show apple bid status
      console.log('Showing apple bid status');
    } else if (command.toLowerCase().includes('increase') && command.toLowerCase().includes('carrot')) {
      // Increase carrot bid
      handleUpdateBid(2);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center p-4 justify-between">
          <div className="flex size-10 items-center justify-center cursor-pointer" onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined text-gray-900 dark:text-white">arrow_back_ios</span>
          </div>
          <h1 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            My Bids
          </h1>
          <div className="size-10"></div>
        </div>

        {/* Segmented Buttons */}
        <div className="px-4 pb-4">
          <div className="flex h-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
            <button
              onClick={() => setActiveFilter('active')}
              className={`flex cursor-pointer h-full grow items-center justify-center rounded-lg px-2 text-sm font-medium transition-all ${
                activeFilter === 'active'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveFilter('completed')}
              className={`flex cursor-pointer h-full grow items-center justify-center rounded-lg px-2 text-sm font-medium transition-all ${
                activeFilter === 'completed'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-40">
        {mockBids.map((bid) => (
          <div key={bid.id} className="p-4">
            <div className={`flex flex-col items-stretch justify-start rounded-xl shadow-sm bg-white dark:bg-gray-900 border ${
              bid.status === 'counter-offer' 
                ? 'border-blue-200 dark:border-blue-800 shadow-blue-100 dark:shadow-blue-900/20' 
                : 'border-gray-100 dark:border-gray-800'
            }`}>
              <div 
                className="w-full bg-center bg-no-repeat aspect-[16/9] bg-cover rounded-t-xl" 
                style={{backgroundImage: `url("${bid.image}")`}}
              />
              <div className="flex w-full flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  {bid.status === 'waiting' ? (
                    <p className="text-blue-600 text-xs font-bold uppercase tracking-wider">Waiting for Vendor</p>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="flex size-2 rounded-full bg-orange-500 animate-pulse"></span>
                      <p className="text-orange-500 text-xs font-bold uppercase tracking-wider">Counter-offer received</p>
                    </div>
                  )}
                  <span className="text-xs text-gray-400">{bid.timeAgo}</span>
                </div>
                
                <div>
                  <p className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                    {bid.shopName}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{bid.product}</p>
                </div>

                {bid.status === 'waiting' ? (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Your Current Bid</p>
                      <p className="text-gray-900 dark:text-white text-xl font-bold">{bid.currentBid}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Market Avg</p>
                      <p className="text-gray-900 dark:text-white text-base">{bid.marketAvg}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 dark:text-orange-400 text-xs font-medium">Vendor's Price</p>
                      <p className="text-orange-700 dark:text-orange-300 text-xl font-bold">{bid.vendorPrice}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Your Bid</p>
                      <p className="text-gray-900 dark:text-white text-base line-through opacity-50">{bid.currentBid}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    onClick={() => handleChat(bid.id)}
                    className="flex-1 h-10 px-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">chat</span>
                    <span>Chat</span>
                  </button>
                  {bid.status === 'waiting' ? (
                    <button 
                      onClick={() => handleUpdateBid(bid.id)}
                      className="flex-[1.5] h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors"
                    >
                      Update Bid
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleAcceptOffer(bid.id)}
                      className="flex-[1.5] h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors"
                    >
                      Accept {bid.vendorPrice}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Fixed Bottom AI Voice Bar */}
      <div className="fixed bottom-[72px] left-0 right-0 px-4 pb-2 z-40">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl rounded-2xl p-3 flex items-center gap-3">
          <div className="size-10 rounded-full bg-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-600/30">
            <span className="material-symbols-outlined">mic</span>
          </div>
          <div className="flex-1">
            <p className="text-gray-600 dark:text-gray-300 text-[13px] leading-tight italic">
              Say "What is the status of my apple bid?" or "Increase my bid for carrots to 45"
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 px-6 pb-6 pt-3 z-50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button 
            onClick={() => navigate('/customer/shop')}
            className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <span className="material-symbols-outlined">storefront</span>
            <span className="text-[10px] font-medium">Shop</span>
          </button>
          <div className="flex flex-col items-center gap-1 text-blue-600">
            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>gavel</span>
            <span className="text-[10px] font-bold">My Bids</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 relative hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <span className="material-symbols-outlined">forum</span>
            <span className="text-[10px] font-medium">Chats</span>
            <span className="absolute top-0 -right-1 size-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-950"></span>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <span className="material-symbols-outlined">person</span>
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}