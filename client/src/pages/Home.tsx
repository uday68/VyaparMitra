import { useProducts } from "../hooks/use-products";
import { useCreateNegotiation } from "../hooks/use-negotiations";
import { ProductCard } from "../components/ProductCard";
import { BottomNav } from "../components/BottomNav";
import { Header } from "../components/Header";
import { Product } from "@shared/schema";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const { data: products, isLoading } = useProducts();
  const createNegotiation = useCreateNegotiation();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(true);

  // Redirect users to appropriate dashboards based on their type
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.type === 'vendor') {
        setLocation('/vendor');
      } else {
        setLocation('/customer/dashboard');
      }
    }
  }, [isAuthenticated, user, setLocation]);

  const handleBid = async (product: Product) => {
    try {
      const negotiation = await createNegotiation.mutateAsync({
        productId: product.id,
        initialMessage: t('negotiation.title') + " " + product.name
      });
      setLocation(`/chat/${negotiation.id}`);
    } catch (error) {
      console.error("Failed to start negotiation", error);
    }
  };

  const handleVoiceCommand = (command: string) => {
    // Simple voice command processing
    if (command.toLowerCase().includes('shop') || command.toLowerCase().includes('browse')) {
      setLocation('/customer/shop');
    } else if (command.toLowerCase().includes('settings')) {
      setLocation('/voice-settings-page');
    } else if (command.toLowerCase().includes('help')) {
      setLocation('/voice-commands');
    }
  };

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Show loading while redirecting
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background-light min-h-screen flex flex-col">
      {/* Header Section */}
      <Header title={t('welcome.title')} showLanguageSelector={true} />

      {/* Search Bar */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <label className="flex flex-col min-w-40 h-12 w-full">
          <div className="flex w-full flex-1 items-stretch rounded-xl h-full shadow-sm border border-gray-100">
            <div className="text-[#637388] flex bg-white items-center justify-center pl-4 rounded-l-xl">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input 
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-xl text-[#111418] focus:outline-0 focus:ring-0 border-none bg-white h-full placeholder:text-[#637388] px-4 pl-2 text-base font-normal leading-normal"
              placeholder={t('shop.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </label>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3">
        <div className="flex gap-3 overflow-x-auto pb-2">
          <button
            onClick={() => setLocation('/customer/shop')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full whitespace-nowrap font-medium hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">storefront</span>
            {t('navigation.shop')}
          </button>
          <button
            onClick={() => setLocation('/welcome')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full whitespace-nowrap font-medium hover:bg-gray-200 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">translate</span>
            {t('settings.general.language')}
          </button>
          <button
            onClick={() => setLocation('/vendor/qr-code')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full whitespace-nowrap font-medium hover:bg-gray-200 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">qr_code</span>
            {t('vendor.qrCode.title')}
          </button>
          <button
            onClick={() => setLocation('/offline')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full whitespace-nowrap font-medium hover:bg-gray-200 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">offline_bolt</span>
            {t('offline.title')}
          </button>
        </div>
      </div>

      {/* Product List */}
      <main className="flex-1 overflow-y-auto pb-44 px-4 pt-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl h-32 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onBid={handleBid}
              isPending={createNegotiation.isPending}
            />
          ))
        )}
      </main>

      {/* Voice Assistant Banner */}
      {showVoiceAssistant && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <div className="bg-primary/10 backdrop-blur-md border border-primary/20 rounded-2xl p-4 flex items-center gap-4 shadow-lg ring-1 ring-primary/10">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping opacity-75"></div>
              <div className="bg-primary text-white size-12 rounded-full flex items-center justify-center relative z-10">
                <span className="material-symbols-outlined">mic</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-primary text-sm font-semibold">{t('voice.settings.title')}</p>
              <p className="text-[#111418] text-sm font-medium leading-snug">
                {t('voice.commands.navigation.openShop')} {t('common.or')} {t('voice.commands.navigation.openSettings')}
              </p>
            </div>
            <button 
              className="text-primary/60 hover:text-primary"
              onClick={() => setShowVoiceAssistant(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
