import { useNegotiations } from "@/hooks/use-negotiations";
import { useProducts } from "@/hooks/use-products";
import { BottomNav } from "@/components/BottomNav";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function Vendor() {
  const { data: negotiations, isLoading: isLoadingNegotiations } = useNegotiations();
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const [, setLocation] = useLocation();

  const activeNegotiations = negotiations?.filter(n => n.status === "active") || [];
  const liveNegotiation = activeNegotiations[0]; // Get the first active negotiation

  return (
    <div className="bg-background-light min-h-screen flex flex-col pb-24">
      {/* Top App Bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="flex items-center p-4 justify-between max-w-md mx-auto">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8" 
              style={{ backgroundImage: 'url("/images/vendor-profile.jpg")' }}
            />
          </div>
          <h2 className="text-[#111418] text-lg font-bold leading-tight tracking-tight flex-1 ml-3">
            Sanjay's Fruit Shop
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-primary text-sm font-bold px-2 py-1 bg-primary/10 rounded-lg">Hindi</span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto w-full px-4">
        {/* Live Negotiation Section */}
        {liveNegotiation && (
          <div className="mt-6">
            <h3 className="text-[#111418] text-lg font-bold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">record_voice_over</span>
              Live Negotiation
            </h3>
            <div className="bg-white border border-primary/30 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Incoming Offer</p>
                  <h4 className="text-base font-bold text-[#111418]">Tourist (English)</h4>
                </div>
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                  LIVE TRANSLATION
                </span>
              </div>
              <p className="text-sm text-[#637388] mb-4">
                "I want <span className="text-[#111418] font-semibold">5kg Apples</span> for{" "}
                <span className="text-[#111418] font-semibold">₹180/kg</span>. Is that possible?"
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setLocation(`/chat/${liveNegotiation.id}`)}
                  className="bg-primary text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1"
                >
                  Accept
                </button>
                <button 
                  onClick={() => setLocation(`/chat/${liveNegotiation.id}`)}
                  className="bg-[#f0f2f4] text-[#111418] text-xs font-bold py-2 rounded-lg"
                >
                  Counter
                </button>
                <button className="border border-[#d1d5db] text-[#637388] text-xs font-bold py-2 rounded-lg">
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Section Header */}
        <div className="flex items-center justify-between mt-8 mb-4">
          <h2 className="text-[#111418] text-[22px] font-bold leading-tight">Products</h2>
          <button 
            onClick={() => setLocation("/add-product")}
            className="flex items-center justify-center rounded-lg h-9 px-3 bg-[#f0f2f4] text-[#111418] gap-1 text-sm font-bold"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Add New</span>
          </button>
        </div>

        {/* Product Cards */}
        <div className="flex flex-col gap-3">
          {isLoadingProducts ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl h-24 animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : (
            products?.map((product) => {
              const activeBids = activeNegotiations.filter(n => n.productId === product.id).length;
              return (
                <div key={product.id} className="bg-white border border-gray-100 p-4 rounded-xl">
                  <div className="flex items-stretch justify-between gap-4">
                    <div className="flex flex-col gap-1 flex-[2_2_0px]">
                      {activeBids > 0 && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded">
                            {activeBids} ACTIVE BIDS
                          </span>
                        </div>
                      )}
                      <p className="text-[#111418] text-base font-bold leading-tight">{product.name}</p>
                      <p className="text-[#637388] text-sm font-normal">
                        Stock: {product.stock}{product.unit} • Price: ₹{product.price}/{product.unit}
                      </p>
                    </div>
                    <div 
                      className="w-24 h-20 bg-center bg-no-repeat bg-cover rounded-lg"
                      style={{ backgroundImage: `url(${product.imageUrl})` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Shop QR Code Area */}
        <div className="mt-8 mb-8 flex flex-col items-center justify-center p-6 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="w-32 h-32 bg-white p-2 rounded-lg shadow-inner mb-3">
            <div className="w-full h-full bg-center bg-no-repeat bg-contain bg-gray-200 rounded flex items-center justify-center">
              <span className="material-symbols-outlined text-gray-400 text-4xl">qr_code</span>
            </div>
          </div>
          <p className="text-sm font-bold text-[#111418]">Shop QR Code</p>
          <p className="text-xs text-[#637388]">Share with customers to start chatting</p>
        </div>

        {/* Settings Quick Access */}
        <div className="mt-4 mb-8 grid grid-cols-2 gap-3">
          <button 
            onClick={() => setLocation("/voice-settings")}
            className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-primary/30 transition-colors"
          >
            <span className="material-symbols-outlined text-primary text-2xl mb-2">settings_voice</span>
            <span className="text-sm font-semibold text-[#111418]">Voice Settings</span>
          </button>
          <button 
            onClick={() => setLocation("/order-history")}
            className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-primary/30 transition-colors"
          >
            <span className="material-symbols-outlined text-primary text-2xl mb-2">history</span>
            <span className="text-sm font-semibold text-[#111418]">Order History</span>
          </button>
        </div>
      </main>

      {/* Floating Action Button (Voice AI) */}
      <div className="fixed bottom-24 right-6 z-50">
        <button className="flex size-16 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-primary/30">
          <span className="material-symbols-outlined text-3xl">mic</span>
        </button>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-t border-gray-100">
        <div className="max-w-md mx-auto flex justify-around py-3 px-6">
          <div className="flex flex-col items-center gap-1 text-primary">
            <span className="material-symbols-outlined text-2xl">inventory_2</span>
            <span className="text-[10px] font-bold">Products</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-[#637388]">
            <div className="relative">
              <span className="material-symbols-outlined text-2xl">chat_bubble</span>
              {activeNegotiations.length > 0 && (
                <div className="absolute -top-1 -right-1 size-2.5 bg-red-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <span className="text-[10px] font-medium">Chats</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-[#637388]">
            <span className="material-symbols-outlined text-2xl">settings</span>
            <span className="text-[10px] font-medium">Settings</span>
          </div>
        </div>
      </div>
    </div>
  );
}
