import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
} from "@/pages";

function Router() {
  return (
    <Switch>
      {/* Main routes */}
      <Route path="/" component={Home} />
      <Route path="/welcome" component={WelcomeLanguageSelection} />
      
      {/* Chat and negotiation routes */}
      <Route path="/chat/:id" component={Chat} />
      <Route path="/customer-chat/:id" component={CustomerNegotiation} />
      <Route path="/customer/negotiation/:productId" component={CustomerVoiceNegotiation} />
      <Route path="/confirmation/:id" component={DealConfirmation} />
      <Route path="/customer/deal-confirmation/:id" component={DealConfirmation} />
      
      {/* Customer routes */}
      <Route path="/customer/shop" component={CustomerShop} />
      
      {/* Vendor routes */}
      <Route path="/vendor" component={Vendor} />
      <Route path="/vendor/qr-code" component={VendorQRCode} />
      <Route path="/add-product" component={AddProduct} />
      
      {/* Voice and settings routes */}
      <Route path="/voice-settings" component={VoiceSettings} />
      <Route path="/voice-settings-page" component={VoiceSettingsPage} />
      <Route path="/voice-customization" component={VoiceCustomization} />
      <Route path="/voice-commands" component={VoiceCommandsGuide} />
      <Route path="/hands-free-settings" component={HandsFreeSettings} />
      
      {/* Transaction and success routes */}
      <Route path="/transaction-active/:negotiationId" component={VoiceTransactionActive} />
      <Route path="/transaction-success/:transactionId" component={VoiceTransactionSuccess} />
      <Route path="/voice-error" component={VoiceRecognitionError} />
      <Route path="/offline" component={OfflineVoiceState} />
      
      {/* History and other routes */}
      <Route path="/order-history" component={OrderHistory} />
      
      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
