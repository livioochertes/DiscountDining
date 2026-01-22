import { Star, Clock, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RestaurantCardProps {
  id: number;
  name: string;
  image?: string;
  rating: number;
  cuisine: string;
  deliveryTime?: string;
  cashbackPercent?: number;
  acceptsVoucher?: boolean;
  isRecommended?: boolean;
  onClick?: () => void;
  className?: string;
}

export function RestaurantCard({
  id,
  name,
  image,
  rating,
  cuisine,
  deliveryTime = '20-30 min',
  cashbackPercent,
  acceptsVoucher,
  isRecommended,
  onClick,
  className
}: RestaurantCardProps) {
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
        
        {isRecommended && (
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
              <span className="text-sm font-medium text-gray-700">{typeof rating === 'number' ? rating.toFixed(1) : '0.0'}</span>
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
