import React from 'react';
import { motion } from 'framer-motion';
import { Product } from "@shared/schema";
import { useTranslation } from "../hooks/useTranslation";
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { 
  Star, 
  MapPin, 
  Clock, 
  Heart, 
  Share2, 
  ShoppingCart,
  Zap,
  Mic
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onBid: (product: Product) => void;
  onVoiceNegotiate?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
  onShare?: (product: Product) => void;
  isPending?: boolean;
  showVoiceOption?: boolean;
  showDistance?: boolean;
  showRating?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export function ProductCard({ 
  product, 
  onBid, 
  onVoiceNegotiate,
  onAddToWishlist,
  onShare,
  isPending = false,
  showVoiceOption = true,
  showDistance = true,
  showRating = true,
  variant = 'default',
  className = ''
}: ProductCardProps) {
  const { t, formatCurrency } = useTranslation();
  
  // Mock data - in real app, this would come from product data
  const mockData = {
    rating: 4.5,
    reviewCount: 23,
    distance: '0.8 km',
    vendorName: 'Fresh Mart',
    originalPrice: product.price * 1.2, // 20% higher original price
    discount: 17,
    isOnSale: Math.random() > 0.7,
    isFavorite: false,
    estimatedTime: '15-20 min',
    inStock: true,
    stockCount: Math.floor(Math.random() * 50) + 10
  };

  const handleVoiceNegotiate = () => {
    if (onVoiceNegotiate) {
      onVoiceNegotiate(product);
    }
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToWishlist) {
      onAddToWishlist(product);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(product);
    }
  };

  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm ${className}`}
      >
        <div className="p-3 flex items-center gap-3">
          <div 
            className="w-16 h-16 bg-center bg-no-repeat bg-cover rounded-lg flex-shrink-0"
            style={{ backgroundImage: `url(${product.imageUrl})` }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
            <p className="text-sm text-gray-600 truncate">{mockData.vendorName}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-semibold text-green-600">
                {formatCurrency(product.price)}
              </span>
              {showRating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-gray-600">{mockData.rating}</span>
                </div>
              )}
            </div>
          </div>
          <Button
            onClick={() => onBid(product)}
            disabled={isPending}
            size="sm"
            className="flex-shrink-0"
          >
            {t('shop.product.negotiate')}
          </Button>
        </div>
      </motion.div>
    );
  }

  if (variant === 'featured') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`relative ${className}`}
      >
        <Card className="overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-0">
            {/* Image Section */}
            <div className="relative">
              <div 
                className="w-full h-48 bg-center bg-no-repeat bg-cover"
                style={{ backgroundImage: `url(${product.imageUrl})` }}
              />
              {mockData.isOnSale && (
                <Badge className="absolute top-2 left-2 bg-red-500">
                  {mockData.discount}% OFF
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddToWishlist}
                className="absolute top-2 right-2 bg-white/80 hover:bg-white"
              >
                <Heart className={`h-4 w-4 ${mockData.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>

            {/* Content Section */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600">{mockData.vendorName}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Rating and Distance */}
              <div className="flex items-center gap-4 mb-3">
                {showRating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{mockData.rating}</span>
                    <span className="text-xs text-gray-500">({mockData.reviewCount})</span>
                  </div>
                )}
                {showDistance && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{mockData.distance}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{mockData.estimatedTime}</span>
                </div>
              </div>

              {/* Price Section */}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(product.price)}
                  </span>
                  {mockData.isOnSale && (
                    <span className="text-lg text-gray-500 line-through">
                      {formatCurrency(mockData.originalPrice)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{product.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => onBid(product)}
                  disabled={isPending || !mockData.inStock}
                  className="flex-1"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {isPending ? t('common.loading') : t('shop.product.negotiate')}
                </Button>
                {showVoiceOption && (
                  <Button
                    variant="outline"
                    onClick={handleVoiceNegotiate}
                    disabled={isPending || !mockData.inStock}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Stock Info */}
              {mockData.stockCount < 20 && (
                <p className="text-xs text-orange-600 mt-2">
                  {t('shop.product.lowStock', { count: mockData.stockCount })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="p-4 flex items-stretch justify-between gap-4">
        <div className="flex flex-[2_2_0px] flex-col justify-between">
          <div className="flex flex-col gap-2">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[#111418] text-lg font-bold leading-tight">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600">{mockData.vendorName}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddToWishlist}
                  className="p-1"
                >
                  <Heart className={`h-4 w-4 ${mockData.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="p-1"
                >
                  <Share2 className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2">
              <span className="text-primary text-xl font-bold">
                {formatCurrency(product.price)}
              </span>
              <span className="text-sm text-gray-600">
                /{t(`shop.product.${product.unit}` as any) || product.unit}
              </span>
              {mockData.isOnSale && (
                <>
                  <span className="text-sm text-gray-500 line-through">
                    {formatCurrency(mockData.originalPrice)}
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    {mockData.discount}% OFF
                  </Badge>
                </>
              )}
            </div>

            {/* Rating and Distance */}
            <div className="flex items-center gap-4">
              {showRating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{mockData.rating}</span>
                  <span className="text-xs text-gray-500">({mockData.reviewCount})</span>
                </div>
              )}
              {showDistance && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{mockData.distance}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-[#637388] text-sm font-normal line-clamp-2">
              {product.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <Button 
              onClick={() => onBid(product)}
              disabled={isPending || !mockData.inStock}
              className="flex-1"
            >
              <span>{isPending ? t('common.loading') : t('shop.product.negotiate')}</span>
            </Button>
            {showVoiceOption && (
              <Button
                variant="outline"
                onClick={handleVoiceNegotiate}
                disabled={isPending || !mockData.inStock}
                className="px-3"
              >
                <Mic className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Stock Warning */}
          {mockData.stockCount < 20 && (
            <p className="text-xs text-orange-600 mt-1">
              {t('shop.product.lowStock', { count: mockData.stockCount })}
            </p>
          )}
        </div>

        {/* Product Image */}
        <div className="relative">
          <div 
            className="w-28 h-28 bg-center bg-no-repeat bg-cover rounded-lg flex-shrink-0"
            style={{ backgroundImage: `url(${product.imageUrl})` }}
            aria-label={product.name}
          />
          {mockData.isOnSale && (
            <div className="absolute -top-1 -right-1">
              <Zap className="h-5 w-5 text-orange-500 fill-orange-500" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
