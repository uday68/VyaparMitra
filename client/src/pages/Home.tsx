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
import { 
  Button, 
  Card, 
  CardContent,
  Input,
  VoiceAssistantBanner,
  PageLayout,
  Container,
  Section
} from "../design-system/components";
import { useTheme } from "../design-system/themes/ThemeProvider";

export default function Home() {
  const { data: products, isLoading } = useProducts();
  const createNegotiation = useCreateNegotiation();
  const [, setLocation] = useLocation();
  const { colorScheme } = useTheme();
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
      <PageLayout>
        <Container className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Header Section */}
      <Header title={t('welcome.title')} showLanguageSelector={true} />

      <Container>
        {/* Search Bar */}
        <Section>
          <Input
            placeholder={t('shop.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<span className="material-symbols-outlined">search</span>}
          />
        </Section>

        {/* Quick Actions */}
        <Section>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <Button
              onClick={() => setLocation('/customer/shop')}
              leftIcon={<span className="material-symbols-outlined text-sm">storefront</span>}
              className="whitespace-nowrap"
            >
              {t('navigation.shop')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setLocation('/welcome')}
              leftIcon={<span className="material-symbols-outlined text-sm">translate</span>}
              className="whitespace-nowrap"
            >
              {t('settings.general.language')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setLocation('/vendor/qr-code')}
              leftIcon={<span className="material-symbols-outlined text-sm">qr_code</span>}
              className="whitespace-nowrap"
            >
              {t('vendor.qrCode.title')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setLocation('/offline')}
              leftIcon={<span className="material-symbols-outlined text-sm">offline_bolt</span>}
              className="whitespace-nowrap"
            >
              {t('offline.title')}
            </Button>
          </div>
        </Section>

        {/* Product List */}
        <Section className="flex-1 pb-44 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-32 animate-pulse" />
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
        </Section>
      </Container>

      {/* Voice Assistant Banner */}
      {showVoiceAssistant && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <VoiceAssistantBanner
            status="idle"
            message={`${t('voice.commands.navigation.openShop')} ${t('common.or')} ${t('voice.commands.navigation.openSettings')}`}
            onToggle={() => setShowVoiceAssistant(false)}
            colorScheme={colorScheme}
          />
        </div>
      )}

      <BottomNav />
    </PageLayout>
  );
}
