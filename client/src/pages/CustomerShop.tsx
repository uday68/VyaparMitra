import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useProducts } from '../hooks/use-products';
import { useTranslation } from '../hooks/useTranslation';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';

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

  const mockProducts = [
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
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen flex flex-col">
      {/* Header Section */}
      <Header title={t('vendor.dashboard.title')} />
      
      {/* Search Bar Component */}
      <div className="px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <label className="flex flex-col min-w-40 h-12 w-full">
          <div className="flex w-full flex-1 items-stretch rounded-xl h-full shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-gray-500 flex bg-white dark:bg-slate-800 items-center justify-center pl-4 rounded-l-xl">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input 
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-xl text-gray-900 dark:text-white focus:outline-0 focus:ring-0 border-none bg-white dark:bg-slate-800 h-full placeholder:text-gray-500 px-4 pl-2 text-base font-normal leading-normal" 
              placeholder={t('shop.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </label>
      </div>

      {/* Product List */}
      <main className="flex-1 overflow-y-auto pb-44 px-4 pt-4 space-y-4">
        {displayProducts.map((product) => (
          <div key={product.id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 flex items-stretch justify-between gap-4">
              <div className="flex flex-[2_2_0px] flex-col justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-gray-900 dark:text-white text-lg font-bold leading-tight">{product.name}</p>
                  <p className="text-blue-600 text-base font-semibold leading-normal">{product.price}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-normal line-clamp-2">{product.description}</p>
                </div>
                <button 
                  onClick={() => handlePlaceBid(product.id)}
                  className="flex mt-3 min-w-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-blue-600 text-white text-sm font-bold leading-normal w-fit hover:bg-blue-700 transition-colors"
                >
                  <span>{t('shop.product.negotiate')}</span>
                </button>
              </div>
              <div 
                className="w-28 h-28 bg-center bg-no-repeat bg-cover rounded-lg flex-shrink-0" 
                style={{backgroundImage: `url("${product.image}")`}}
              />
            </div>
          </div>
        ))}
      </main>

      {/* Voice Assistant Banner */}
      {isVoiceActive && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <div className="bg-blue-50 dark:bg-blue-900/20 backdrop-blur-md border border-blue-200 rounded-2xl p-4 flex items-center gap-4 shadow-lg ring-1 ring-blue-100">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-600/30 rounded-full animate-ping opacity-75"></div>
              <div className="bg-blue-600 text-white size-12 rounded-full flex items-center justify-center relative z-10">
                <span className="material-symbols-outlined">mic</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-blue-600 text-sm font-semibold">{t('voice.settings.title')}</p>
              <p className="text-gray-900 dark:text-white text-sm font-medium leading-snug">
                {t('shop.voiceCommands.negotiate')}
              </p>
            </div>
            <button 
              onClick={toggleVoiceAssistant}
              className="text-blue-600/60 hover:text-blue-600"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav currentPage="shop" />
    </div>
  );
}