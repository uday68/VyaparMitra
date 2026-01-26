import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Chat from "@/pages/Chat";
import Vendor from "@/pages/Vendor";
import CustomerNegotiation from "@/pages/CustomerNegotiation";
import DealConfirmation from "@/pages/DealConfirmation";
import AddProduct from "@/pages/AddProduct";
import VoiceSettings from "@/pages/VoiceSettings";
import VoiceCustomization from "@/pages/VoiceCustomization";
import HandsFreeSettings from "@/pages/HandsFreeSettings";
import OrderHistory from "@/pages/OrderHistory";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat/:id" component={Chat} />
      <Route path="/customer-chat/:id" component={CustomerNegotiation} />
      <Route path="/confirmation/:id" component={DealConfirmation} />
      <Route path="/vendor" component={Vendor} />
      <Route path="/add-product" component={AddProduct} />
      <Route path="/voice-settings" component={VoiceSettings} />
      <Route path="/voice-customization" component={VoiceCustomization} />
      <Route path="/hands-free-settings" component={HandsFreeSettings} />
      <Route path="/order-history" component={OrderHistory} />
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
