import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Star, MapPin, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import type { Restaurant } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { optimizeImageUrl, generateFallbackSvg } from "@/lib/imageOptimizer";
import { imageCache } from "@/lib/imageCache";
import { instantImageLoader } from "@/lib/instantImageLoader";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
  onMenuClick: () => void;
  onVouchersClick?: () => void;
  onReservationClick?: () => void;
}

export default function RestaurantCard({ restaurant, onClick, onMenuClick, onVouchersClick, onReservationClick }: RestaurantCardProps) {
  // Only load packages when card is visible
  const { targetRef, hasIntersected } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
    triggerOnce: true
  });

  // Optimized image URL with WebP format and proper sizing
  const defaultImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4";
  const imageUrl = optimizeImageUrl(restaurant.imageUrl || defaultImage, 320, 192);

  // Ultra-aggressive preloading when card becomes visible
  useEffect(() => {
    if (hasIntersected && imageUrl) {
      // Use both caching systems for maximum speed
      Promise.all([
        imageCache.preloadImage(imageUrl).catch(() => {}),
        instantImageLoader.ultraPreload(imageUrl).catch(() => {})
      ]);
    }
  }, [hasIntersected, imageUrl]);

  // Only fetch packages when card has been seen
  const { data: packages = [] } = useQuery({
    queryKey: ['/api/restaurants', restaurant.id, 'packages'],
    queryFn: () => api.getRestaurantPackages(restaurant.id),
    enabled: hasIntersected, // Only fetch when visible
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes cache
  });
  const { t } = useLanguage();
  
  const maxDiscount = packages.length > 0 
    ? Math.max(...packages.map((p: any) => parseFloat(p.discountPercentage)))
    : 0;
  
  const avgPrice = packages.length > 0
    ? packages.reduce((sum: number, p: any) => sum + parseFloat(p.pricePerMeal), 0) / packages.length
    : 0;

  const packageSummary = packages.length > 0
    ? packages.map((p: any) => `${p.mealCount}`).join(', ') + ' meals'
    : 'No packages available';

  // Ultra-aggressive hover preloading for instant modal display
  const handleMouseEnter = () => {
    if (imageUrl) {
      // Immediate ultra-preload on hover
      instantImageLoader.ultraPreload(imageUrl).catch(() => {});
      imageCache.preloadImage(imageUrl).catch(() => {});
    }
  };

  return (
    <Card 
      ref={targetRef}
      className="restaurant-card hover:shadow-md transition-shadow cursor-pointer" 
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
    >
      <div className="relative">
        {hasIntersected ? (
          <img 
            src={imageUrl} 
            alt={`${restaurant.name} interior`}
            className="w-full h-36 object-cover rounded-t-lg"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              // Fallback to optimized placeholder if image fails to load
              e.currentTarget.src = generateFallbackSvg(restaurant.name);
            }}
          />
        ) : (
          <div className="w-full h-36 bg-gray-200 rounded-t-lg animate-pulse flex items-center justify-center">
            <span className="text-gray-400 text-sm">Loading...</span>
          </div>
        )}
      </div>
      
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-0.5">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{restaurant.name}</h3>
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            <span className="text-xs font-medium">{restaurant.rating}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-[10px] mb-1.5">
          <div className="flex items-center text-gray-500">
            <span>{restaurant.cuisine}</span>
            <span className="mx-1">•</span>
            <MapPin className="h-2.5 w-2.5 mr-0.5 flex-shrink-0" />
            <span className="truncate">{restaurant.location}</span>
          </div>
          {maxDiscount > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] px-1 py-0">
              -{maxDiscount}%
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-1" data-tour="voucher-card">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="bg-orange-100 text-orange-700 px-1.5 py-1 rounded font-medium text-[10px] hover:bg-orange-400 hover:text-white transition-colors flex items-center justify-center gap-1 border border-orange-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onVouchersClick) {
                      onVouchersClick();
                    } else {
                      onClick();
                    }
                  }}
                >
                  <span>🎫</span> 
                  <span>{t.vouchers}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t.tooltipVoucherPackages}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="bg-emerald-100 text-emerald-700 px-1.5 py-1 rounded font-medium text-[10px] hover:bg-emerald-500 hover:text-white transition-all duration-200 flex items-center justify-center gap-1 border border-emerald-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMenuClick();
                  }}
                >
                  <span>🍽️</span> 
                  <span>{t.viewMenu}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t.tooltipViewMenu}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="bg-blue-100 text-blue-700 px-1.5 py-1 rounded font-medium text-[10px] hover:bg-blue-500 hover:text-white transition-all duration-200 flex items-center justify-center gap-1 border border-blue-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onReservationClick) {
                      onReservationClick();
                    } else {
                      onClick();
                    }
                  }}
                >
                  <Calendar className="h-3 w-3" />
                  <span>{t.reservations || 'Reserve'}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t.tooltipReservation || 'Make a reservation at this restaurant'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
      </CardContent>
    </Card>
  );
}
