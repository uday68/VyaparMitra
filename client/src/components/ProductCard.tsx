import { Product } from "@shared/schema";
import { useTranslation } from "../hooks/useTranslation";

interface ProductCardProps {
  product: Product;
  onBid: (product: Product) => void;
  isPending?: boolean;
}

export function ProductCard({ product, onBid, isPending }: ProductCardProps) {
  const { t, formatCurrency } = useTranslation();
  
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 flex items-stretch justify-between gap-4">
        <div className="flex flex-[2_2_0px] flex-col justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-[#111418] text-lg font-bold leading-tight">
              {product.name}
            </p>
            <p className="text-primary text-base font-semibold leading-normal">
              {formatCurrency(product.price)}/{t(`shop.product.${product.unit}` as any) || product.unit}
            </p>
            <p className="text-[#637388] text-sm font-normal line-clamp-2">
              {product.description}
            </p>
          </div>
          <button 
            onClick={() => onBid(product)}
            disabled={isPending}
            className="flex mt-3 min-w-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-primary text-white text-sm font-bold leading-normal w-fit disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isPending ? t('common.loading') : t('shop.product.negotiate')}</span>
          </button>
        </div>
        <div 
          className="w-28 h-28 bg-center bg-no-repeat bg-cover rounded-lg flex-shrink-0"
          style={{ backgroundImage: `url(${product.imageUrl})` }}
          aria-label={product.name}
        />
      </div>
    </div>
  );
}
