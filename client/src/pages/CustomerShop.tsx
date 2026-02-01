import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useProducts } from '../hooks/use-products';
import { useTranslation } from '../hooks/useTranslation';
import { 
  Container, 
  Section, 
  Stack,
  TouchTargetButton,
  VoiceAssistantBanner 
} from '../design-system/components';
import { Input } from '../design-system/components/Input';
import { cn } from '../design-system/utils/cn';

interface Product {
  id: number;
  name: string;
  price: string;
  description: string;
  image: string;
}

interface ProductCardProps {
  product: Product;
  onPlaceBid: (productId: number) => void;
}

function ProductCard({ product, onPlaceBid }: ProductCardProps) {
  const { t } = useTranslation();
  
  return (
    <div className="bg-card dark:bg-slate-900 border border-border dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 flex items-stretch justify-between gap-4">
        <div className="flex flex-[2_2_0px] flex-col justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-foreground dark:text-white text-lg font-bold leading-tight">
              {product.name}
            </p>
            <p className="text-primary-blue text-base font-semibold leading-normal">
              {product.price}
            </p>
            <p className="text-foreground-muted dark:text-gray-400 text-sm font-normal line-clamp-2">
              {product.description}
            </p>
          </div>
          <TouchTargetButton
            onClick={() => onPlaceBid(product.id)}
            size="comfortable"
            className={cn(
              "mt-3 w-fit rounded-lg h-9 px-4",
              "bg-primary-blue text-white text-sm font-bold leading-normal",
              "hover:bg-primary-blue/90 transition-colors"
            )}
            aria-label={`${t('shop.product.negotiate')} ${product.name}`}
          >
            {t('shop.product.negotiate')}
          </TouchTargetButton>
        </div>
        <div 
          className="w-28 h-28 bg-center bg-no-repeat bg-cover rounded-lg flex-shrink-0" 
          style={{backgroundImage: `url("${product.image}")`}}
          role="img"
          aria-label={product.name}
        />
      </div>
    </div>
  );
}

export function CustomerShop() {
  const [, setLocation] = useLocation();
  const { data: products, isLoading } = useProducts();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(true);

  const handlePlaceBid = (productId: number) => {
    setLocation(`/customer/negotiation/${productId}`);
  };

  const toggleVoiceAssistant = () => {
    setIsVoiceActive(!isVoiceActive);
  };

  const mockProducts: Product[] = [
    {
      id: 1,
      name: 'Fresh Shimla Apples',
      price: '₹180/kg',
      description: 'Crisp, sweet and directly sourced from Shimla orchards.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyHZvzLRpjfWHlF0c-8fq41z6CBNTTqriEDEx0GSB3yaIeeQ9TTbFNSY3TF1UdLcDSgefPTxLRQZvR0dzxpXrABHXUhhbHQTdGoeNwxgRniDV5T50qwwAhjmVPNLw9xBuPBdQdgikbjPcou_F76dF0nmHuJlzgZDmf9Vz99L0VqgzH4AJsNKUKJTK4urFFwFmY5Ex2ovyMQQJNjqXix8VvV2fcxwjx-P6kaaiUpcyGN0BgGfQCPvAxKUsRvasfadBuMHj6OOuk'
    },
    {
      id: 2,
      name: 'Robusta Bananas',
      price: '₹60/dozen',
      description: 'Naturally ripened, rich in potassium and energy.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdk80wcbIO7OSie5Mc-WQOv2AIYXuoC1lXnOYtlfjxnO2cIfS9mbwtcuvIFqET06UcQw1v8YTsWuc5r3SO2K0mgbco_JZae91U2Q8iyLufjuz4UgamRv_d_Pdxc6yLzkWUTwqvJgwXKodeyT6J3sDr_OFEBO1X4IfkcRivtkIyXD1p9HWecRJ71YVcdnrUhLg8hZCKCVyAt3dNzC80TfbRy4mzDX_YRisuW2QP0n9UmwV8ZFuT_u653VKUu93oqdbuzYNEkIB1'
    },
    {
      id: 3,
      name: 'Ratnagiri Alphonso',
      price: '₹800/dozen',
      description: 'The King of Mangoes, premium quality from Ratnagiri.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMi3RZJtKti_wXF3cUwDCqNLS-PtsyMr2V_U8J8QzMNuA0Ki14aQ4Et0ULJ8CLHRTZZJ_76T5yDTX_NNcDFLczcHJvvoglR73bGrMLHztzDmsi-pPvtl-w2pCdR31GKuNPzjIO9jza7Wh2yuAIxh7P6Wh98E6BIJBPLETRhJMXBDBpHybsRO07HDb_DvccqkixBBYsT1HwFcfim-VZpAk-11s81pqBOJn4Eb4G-D21zaAtPwLZszKDw-zjXK_9k_q-rz7hoUXs'
    }
  ];

  const displayProducts = products || mockProducts;

  return (
    <div className="bg-background-light dark:bg-background-dark text-foreground dark:text-white min-h-screen flex flex-col">
      
      {/* Header Section */}
      <header className="sticky top-0 z-50 bg-card dark:bg-background-dark border-b border-border dark:border-gray-800">
        <Container maxWidth="mobile">
          <div className="flex items-center p-4 pb-2 justify-between">
            <div className="text-primary-blue flex size-10 shrink-0 items-center justify-center">
              <span className="material-symbols-outlined text-3xl">translate</span>
            </div>
            <h1 className="text-foreground dark:text-white text-xl font-bold leading-tight tracking-tight flex-1 text-center pr-10">
              {t('shop.title')}
            </h1>
          </div>
          
          {/* Search Bar */}
          <div className="px-4 py-3">
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-foreground-muted">
                <span className="material-symbols-outlined">search</span>
              </div>
              <Input
                type="text"
                placeholder={t('shop.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-12 h-12 rounded-xl shadow-sm",
                  "bg-card dark:bg-slate-800 border-border dark:border-gray-700",
                  "focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                )}
              />
            </div>
          </div>
        </Container>
      </header>

      {/* Product List */}
      <main className="flex-1 overflow-y-auto pb-44">
        <Container maxWidth="mobile">
          <Section spacing="component">
            <Stack spacing="component">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-foreground-muted">{t('common.loading')}</div>
                </div>
              ) : (
                displayProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onPlaceBid={handlePlaceBid}
                  />
                ))
              )}
            </Stack>
          </Section>
        </Container>
      </main>

      {/* Voice Assistant Banner */}
      {isVoiceActive && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <VoiceAssistantBanner
            status="idle"
            message={t('shop.voiceCommands.negotiate')}
            onToggle={toggleVoiceAssistant}
            colorScheme="blue"
            className={cn(
              "bg-primary-blue/10 dark:bg-primary-blue/20 backdrop-blur-md",
              "border border-primary-blue/20 rounded-2xl shadow-lg ring-1 ring-primary-blue/10"
            )}
          />
        </div>
      )}

      {/* Bottom Navigation Placeholder */}
      <div className="h-20 bg-card dark:bg-background-dark border-t border-border dark:border-gray-800">
        {/* BottomNav component would go here */}
      </div>
    </div>
  );
}