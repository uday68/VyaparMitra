import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { Suspense, useEffect } from "react";
import "./i18n"; // Initialize i18n
import {
  Home,
  Chat,
  Vendor,
  CustomerNegotiation,
  DealConfirmation,
  AddProduct,
  VoiceSettings,
  VoiceCustomization,
  HandsFreeSettings,
  OrderHistory,
  NotFound,
  CustomerShop,
  CustomerVoiceNegotiation,
  VendorQRCode,
  WelcomeLanguageSelection,
  VoiceSettingsPage,
  VoiceCommandsGuide,
  VoiceTransactionSuccess,
  VoiceRecognitionError,
  VoiceTransactionActive,
  OfflineVoiceState
} from "./pages";

// Loading component for Suspense
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  );
}

function Router() {
  return (
    <Routes>
      {/* Main routes */}
      <Route path="/" element={<Home />} />
      <Route path="/welcome" element={<WelcomeLanguageSelection />} />
      
      {/* Chat and negotiation routes */}
      <Route path="/chat/:id" element={<Chat />} />
      <Route path="/customer-chat/:id" element={<CustomerNegotiation />} />
      <Route path="/customer/negotiation/:productId" element={<CustomerVoiceNegotiation />} />
      <Route path="/confirmation/:id" element={<DealConfirmation />} />
      <Route path="/customer/deal-confirmation/:id" element={<DealConfirmation />} />
      
      {/* Customer routes */}
      <Route path="/customer/shop" element={<CustomerShop />} />
      
      {/* Vendor routes */}
      <Route path="/vendor" element={<Vendor />} />
      <Route path="/vendor/qr-code" element={<VendorQRCode />} />
      <Route path="/add-product" element={<AddProduct />} />
      
      {/* Voice and settings routes */}
      <Route path="/voice-settings" element={<VoiceSettings />} />
      <Route path="/voice-settings-page" element={<VoiceSettingsPage />} />
      <Route path="/voice-customization" element={<VoiceCustomization />} />
      <Route path="/voice-commands" element={<VoiceCommandsGuide />} />
      <Route path="/hands-free-settings" element={<HandsFreeSettings />} />
      
      {/* Transaction and success routes */}
      <Route path="/transaction-active/:negotiationId" element={<VoiceTransactionActive />} />
      <Route path="/transaction-success/:transactionId" element={<VoiceTransactionSuccess />} />
      <Route path="/voice-error" element={<VoiceRecognitionError />} />
      <Route path="/offline" element={<OfflineVoiceState />} />
      
      {/* History and other routes */}
      <Route path="/order-history" element={<OrderHistory />} />
      
      {/* 404 fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    // Set document direction based on language
    const updateDirection = () => {
      const language = localStorage.getItem('vyapar-mitra-language') || 'hi';
      // Add RTL languages here if needed (none in current Indian languages)
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = language;
    };

    updateDirection();
    
    // Listen for language changes
    window.addEventListener('storage', updateDirection);
    return () => window.removeEventListener('storage', updateDirection);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <Toaster />
            <Router />
          </Suspense>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
