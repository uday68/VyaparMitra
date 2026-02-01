import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { Suspense, useEffect } from "react";
import "./i18n"; // Initialize i18n
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import {
  Home,
  Chat,
  Vendor,
  VendorInventory,
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
  OfflineVoiceState,
  Login,
  SignUp,
  Profile,
  CustomerDashboard,
  PermissionsReadyToShop
} from "./pages";
import { CustomerBidsDashboard } from "./pages/CustomerBidsDashboard";
import { VoiceCommandsReference } from "./pages/VoiceCommandsReference";
import { InteractiveVoiceGuide } from "./pages/InteractiveVoiceGuide";
import { CrossLanguageNegotiation } from "./pages/CrossLanguageNegotiation";

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
    <Switch>
      {/* Public routes */}
      <Route path="/login">
        <ProtectedRoute requireAuth={false}>
          <Login />
        </ProtectedRoute>
      </Route>
      <Route path="/signup">
        <ProtectedRoute requireAuth={false}>
          <SignUp />
        </ProtectedRoute>
      </Route>
      <Route path="/welcome">
        <ProtectedRoute requireAuth={false}>
          <WelcomeLanguageSelection />
        </ProtectedRoute>
      </Route>
      <Route path="/permissions-ready-to-shop">
        <ProtectedRoute>
          <PermissionsReadyToShop />
        </ProtectedRoute>
      </Route>
      
      {/* Protected routes - require authentication */}
      <Route path="/">
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>
      
      {/* Profile route */}
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      
      {/* Chat and negotiation routes */}
      <Route path="/chat/:id">
        <ProtectedRoute>
          <Chat />
        </ProtectedRoute>
      </Route>
      <Route path="/customer-chat/:id">
        <ProtectedRoute requiredUserType="customer" showUnauthorized={true}>
          <CustomerNegotiation />
        </ProtectedRoute>
      </Route>
      <Route path="/customer/negotiation/:productId">
        <ProtectedRoute requiredUserType="customer" showUnauthorized={true}>
          <CustomerVoiceNegotiation />
        </ProtectedRoute>
      </Route>
      <Route path="/confirmation/:id">
        <ProtectedRoute>
          <DealConfirmation />
        </ProtectedRoute>
      </Route>
      <Route path="/customer/deal-confirmation/:id">
        <ProtectedRoute requiredUserType="customer" showUnauthorized={true}>
          <DealConfirmation />
        </ProtectedRoute>
      </Route>
      
      {/* Vendor routes - strict RBAC */}
      <Route path="/vendor">
        <ProtectedRoute requiredUserType="vendor" showUnauthorized={true}>
          <Vendor />
        </ProtectedRoute>
      </Route>
      <Route path="/vendor/inventory">
        <ProtectedRoute requiredUserType="vendor" showUnauthorized={true}>
          <VendorInventory />
        </ProtectedRoute>
      </Route>
      <Route path="/vendor/qr-code">
        <ProtectedRoute requiredUserType="vendor" showUnauthorized={true}>
          <VendorQRCode />
        </ProtectedRoute>
      </Route>
      <Route path="/add-product">
        <ProtectedRoute requiredUserType="vendor" showUnauthorized={true}>
          <AddProduct />
        </ProtectedRoute>
      </Route>
      
      {/* Customer routes - strict RBAC */}
      <Route path="/customer/dashboard">
        <ProtectedRoute requiredUserType="customer" showUnauthorized={true}>
          <CustomerDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/customer/bids">
        <ProtectedRoute requiredUserType="customer" showUnauthorized={true}>
          <CustomerBidsDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/customer/shop">
        <ProtectedRoute requiredUserType="customer" showUnauthorized={true}>
          <CustomerShop />
        </ProtectedRoute>
      </Route>
      <Route path="/customer-chat/:id">
        <ProtectedRoute requiredUserType="customer" showUnauthorized={true}>
          <CustomerNegotiation />
        </ProtectedRoute>
      </Route>
      <Route path="/customer/negotiation/:productId">
        <ProtectedRoute requiredUserType="customer" showUnauthorized={true}>
          <CustomerVoiceNegotiation />
        </ProtectedRoute>
      </Route>
      <Route path="/customer/deal-confirmation/:id">
        <ProtectedRoute requiredUserType="customer" showUnauthorized={true}>
          <DealConfirmation />
        </ProtectedRoute>
      </Route>
      
      {/* Voice and settings routes */}
      <Route path="/voice-settings">
        <ProtectedRoute>
          <VoiceSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/voice-settings-page">
        <ProtectedRoute>
          <VoiceSettingsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/voice-customization">
        <ProtectedRoute>
          <VoiceCustomization />
        </ProtectedRoute>
      </Route>
      <Route path="/voice-commands">
        <ProtectedRoute>
          <VoiceCommandsGuide />
        </ProtectedRoute>
      </Route>
      <Route path="/hands-free-settings">
        <ProtectedRoute>
          <HandsFreeSettings />
        </ProtectedRoute>
      </Route>
      
      {/* Transaction and success routes */}
      <Route path="/transaction-active/:negotiationId">
        <ProtectedRoute>
          <VoiceTransactionActive />
        </ProtectedRoute>
      </Route>
      <Route path="/transaction-success/:transactionId">
        <ProtectedRoute>
          <VoiceTransactionSuccess />
        </ProtectedRoute>
      </Route>
      <Route path="/voice-error">
        <ProtectedRoute>
          <VoiceRecognitionError />
        </ProtectedRoute>
      </Route>
      <Route path="/offline">
        <ProtectedRoute>
          <OfflineVoiceState />
        </ProtectedRoute>
      </Route>
      
      {/* History and other routes */}
      <Route path="/order-history">
        <ProtectedRoute>
          <OrderHistory />
        </ProtectedRoute>
      </Route>
      
      {/* Voice Commands Reference route */}
      <Route path="/voice-commands-reference">
        <ProtectedRoute>
          <VoiceCommandsReference />
        </ProtectedRoute>
      </Route>
      
      {/* Interactive Voice Guide route */}
      <Route path="/interactive-voice-guide">
        <ProtectedRoute>
          <InteractiveVoiceGuide />
        </ProtectedRoute>
      </Route>
      
      {/* Cross-Language QR Commerce routes */}
      <Route path="/negotiate/:mode/:sessionId?">
        <ProtectedRoute>
          <CrossLanguageNegotiation />
        </ProtectedRoute>
      </Route>
      <Route path="/cross-language-negotiation">
        <ProtectedRoute>
          <CrossLanguageNegotiation />
        </ProtectedRoute>
      </Route>
      
      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
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
      <TooltipProvider>
        <AuthProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <Toaster />
            <Router />
          </Suspense>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
