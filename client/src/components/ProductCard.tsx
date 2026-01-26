import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Product;
  onBid: (product: Product) => void;
  isPending?: boolean;
}

export function ProductCard({ product, onBid, isPending }: ProductCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
      <div className="p-4 flex items-stretch justify-between gap-4">
        <div className="flex flex-[2] flex-col justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-slate-900 text-lg font-bold leading-tight">
              {product.name}
            </h3>
            <p className="text-primary text-base font-semibold">
              ₹{product.price}/{product.unit}
            </p>
            <p className="text-slate-500 text-sm font-normal line-clamp-2 mt-1">
              {product.description}
            </p>
          </div>
          <Button
            onClick={() => onBid(product)}
            disabled={isPending}
            className="mt-4 w-fit bg-primary hover:bg-blue-600 text-white font-bold rounded-xl h-10 px-6 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            {isPending ? "Starting..." : "Place Bid"}
          </Button>
        </div>
        <div 
          className="w-28 h-28 bg-center bg-no-repeat bg-cover rounded-xl flex-shrink-0 shadow-inner bg-slate-100"
          style={{ backgroundImage: `url(${product.imageUrl})` }}
          aria-label={product.name}
        />
      </div>
    </div>
  );
}
