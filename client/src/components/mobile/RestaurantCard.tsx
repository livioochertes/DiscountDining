import { Star, Clock, Percent, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

const isNativePlatform = Capacitor.isNativePlatform();
const API_BASE_URL = import.meta.env.VITE_API_URL || (isNativePlatform ? 'https://eatoff.app' : '');

interface RestaurantCardProps {
  id: number;
  name: string;
  image?: string;
  rating: number;
  googleRating?: number;
  googleReviewCount?: number;
  reviewCount?: number;
  cuisine: string;
  deliveryTime?: string;
  cashbackPercent?: number;
  acceptsVoucher?: boolean;
  isRecommended?: boolean;
  isFavorite?: boolean;
  customerId?: number;
  onClick?: () => void;
  className?: string;
}

export function RestaurantCard({
  id,
  name,
  image,
  rating,
  googleRating,
  googleReviewCount,
  reviewCount,
  cuisine,
  deliveryTime = '20-30 min',
  cashbackPercent,
  acceptsVoucher,
  isRecommended,
  isFavorite: initialFavorite,
  customerId,
  onClick,
  className
}: RestaurantCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const effectiveCustomerId = customerId || user?.id;
  
  const { data: favoriteStatus } = useQuery({
    queryKey: ['/api/customers', effectiveCustomerId, 'favorites', id],
    queryFn: async () => {
      if (!effectiveCustomerId) return { isFavorite: false };
      const url = `${API_BASE_URL}/api/customers/${effectiveCustomerId}/favorites/${id}`;
      const res = await fetch(url, isNativePlatform ? {} : { credentials: 'include' });
      return res.json();
    },
    enabled: !!effectiveCustomerId && initialFavorite === undefined
  });
  
  const isFavorite = initialFavorite !== undefined ? initialFavorite : favoriteStatus?.isFavorite || false;

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!effectiveCustomerId) return;
      const url = `${API_BASE_URL}/api/customers/${effectiveCustomerId}/favorites/${id}`;
      const method = isFavorite ? 'DELETE' : 'POST';
      const res = await fetch(url, { 
        method,
        ...(isNativePlatform ? {} : { credentials: 'include' })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers', effectiveCustomerId, 'favorites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers', effectiveCustomerId, 'favorite-restaurants'] });
    }
  });

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (effectiveCustomerId) {
      toggleFavorite.mutate();
    }
  };

  const combinedRating = (() => {
    const gRating = googleRating ? parseFloat(String(googleRating)) : 0;
    const gCount = googleReviewCount || 0;
    const eRating = typeof rating === 'number' ? rating : 0;
    const eCount = reviewCount || 0;
    
    if (gCount > 0 && eCount > 0) {
      return ((gRating * gCount) + (eRating * eCount)) / (gCount + eCount);
    } else if (gCount > 0) {
      return gRating;
    } else if (eCount > 0) {
      return eRating;
    } else if (gRating > 0) {
      return gRating;
    }
    return eRating;
  })();

  const totalReviews = (googleReviewCount || 0) + (reviewCount || 0);

  return (
    <button
      onClick={onClick}
      className={cn(
        "bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100",
        "hover:shadow-md transition-all duration-200 text-left w-full",
        className
      )}
    >
      {/* Image */}
      <div className="relative h-36 bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {acceptsVoucher && (
            <span className="bg-primary text-white text-xs font-medium px-2 py-1 rounded-full">
              Voucher ✓
            </span>
          )}
          {cashbackPercent && cashbackPercent > 0 && (
            <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
              <Percent className="w-3 h-3" />
              {cashbackPercent}% cashback
            </span>
          )}
        </div>
        
        {/* Heart Icon */}
        {effectiveCustomerId && (
          <div
            onClick={handleFavoriteClick}
            role="button"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform cursor-pointer"
          >
            <Heart 
              className={cn(
                "w-5 h-5 transition-colors",
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
              )} 
            />
          </div>
        )}
        
        {isRecommended && !effectiveCustomerId && (
          <span className="absolute top-3 right-3 bg-purple-500 text-white text-xs font-medium px-2 py-1 rounded-full">
            ⭐ For You
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-base mb-1">{name}</h3>
        <p className="text-sm text-gray-500 mb-3">{cuisine}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-gray-700">
                {combinedRating > 0 ? combinedRating.toFixed(1) : '0.0'}
              </span>
              {totalReviews > 0 && (
                <span className="text-xs text-gray-400">({totalReviews})</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{deliveryTime}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

interface RestaurantCardSmallProps {
  name: string;
  image?: string;
  rating: number;
  cashbackPercent?: number;
  onClick?: () => void;
}

export function RestaurantCardSmall({
  name,
  image,
  rating,
  cashbackPercent,
  onClick
}: RestaurantCardSmallProps) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-32 text-left"
    >
      <div className="relative h-24 bg-gray-100 rounded-2xl overflow-hidden mb-2">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-2xl">🍽️</span>
          </div>
        )}
        {cashbackPercent && (
          <span className="absolute bottom-1 right-1 bg-green-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
            {cashbackPercent}%
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
      <div className="flex items-center gap-1 mt-0.5">
        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        <span className="text-xs text-gray-600">{typeof rating === 'number' ? rating.toFixed(1) : '0.0'}</span>
      </div>
    </button>
  );
}
