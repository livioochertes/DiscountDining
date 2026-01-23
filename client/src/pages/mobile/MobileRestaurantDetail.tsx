import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { ArrowLeft, Star, MapPin, Clock, Ticket, ShoppingBag, Heart, Share2, ChevronRight } from 'lucide-react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

interface VoucherPackage {
  id: string | number;
  name: string;
  description: string;
  mealCount: number;
  pricePerMeal: string;
  discountPercentage: string;
  totalValue?: string;
  type?: string;
}

function MenuItemCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  return (
    <div className="flex gap-3 p-3 bg-white rounded-2xl border border-gray-100">
      {item.imageUrl && (
        <img 
          src={item.imageUrl} 
          alt={item.name}
          className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.description}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-semibold text-primary">{parseFloat(item.price).toFixed(0)} RON</span>
          <button
            onClick={onAdd}
            className="bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full"
          >
            Adaugă
          </button>
        </div>
      </div>
    </div>
  );
}

function VoucherPackageCard({ pkg, onClick }: { pkg: VoucherPackage; onClick: () => void }) {
  const discount = parseFloat(pkg.discountPercentage) || 0;
  const pricePerMeal = parseFloat(pkg.pricePerMeal) || 0;
  const totalPrice = pricePerMeal * pkg.mealCount;
  const isEatOff = pkg.type === 'eatoff';
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-2xl text-left border transition-colors",
        isEatOff 
          ? "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20" 
          : "bg-white border-gray-100 hover:border-gray-200"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Ticket className={cn("w-5 h-5", isEatOff ? "text-primary" : "text-gray-400")} />
          <span className="font-semibold text-gray-900">{pkg.name}</span>
        </div>
        {discount > 0 && (
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
      </div>
      
      <p className="text-sm text-gray-500 mb-3">{pkg.description || `${pkg.mealCount} mese incluse`}</p>
      
      <div className="flex items-end justify-between">
        <div>
          <span className="text-xs text-gray-400">{pkg.mealCount} mese</span>
          <p className="text-lg font-bold text-primary">{totalPrice.toFixed(0)} RON</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </button>
  );
}

export default function MobileRestaurantDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/m/restaurant/:id');
  const restaurantId = params?.id;
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'menu' | 'vouchers'>('menu');
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: restaurantData, isLoading } = useQuery({
    queryKey: ['/api/restaurants', restaurantId, 'full'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/restaurants/${restaurantId}/full`);
      if (!res.ok) throw new Error('Failed to fetch restaurant');
      return res.json();
    },
    enabled: !!restaurantId
  });

  const { data: packages = [] } = useQuery<VoucherPackage[]>({
    queryKey: ['/api/restaurants', restaurantId, 'packages'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/restaurants/${restaurantId}/packages`);
      if (!res.ok) throw new Error('Failed to fetch packages');
      return res.json();
    },
    enabled: !!restaurantId
  });

  const restaurant = restaurantData?.restaurant;
  const menuItems: MenuItem[] = restaurantData?.menuItems || [];

  const groupedMenu = menuItems.reduce((acc: Record<string, MenuItem[]>, item) => {
    const category = item.category || 'Altele';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const handleAddToCart = (item: MenuItem) => {
    if (!user) {
      setLocation('/m/signin');
      return;
    }
    console.log('Add to cart:', item);
  };

  const handleBuyVoucher = (pkg: VoucherPackage) => {
    if (!user) {
      setLocation('/m/signin');
      return;
    }
    if (pkg.type === 'eatoff') {
      setLocation(`/checkout?eatoffVoucherId=${pkg.id}`);
    } else {
      setLocation(`/checkout?packageId=${pkg.id}&restaurantId=${restaurantId}`);
    }
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="animate-pulse">
          <div className="h-56 bg-gray-200" />
          <div className="px-4 py-4 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (!restaurant) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-full p-8">
          <p className="text-gray-500">Restaurant negăsit</p>
          <button 
            onClick={() => setLocation('/m/explore')}
            className="mt-4 text-primary font-medium"
          >
            Înapoi la explorare
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="pb-20">
        {/* Hero Image */}
        <div className="relative h-56">
          <img
            src={restaurant.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Back button */}
          <button
            onClick={() => setLocation('/m/explore')}
            className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur-sm rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full"
            >
              <Heart className={cn("w-5 h-5", isFavorite && "fill-red-500 text-red-500")} />
            </button>
            <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
          
          {/* Restaurant info overlay */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h1 className="text-2xl font-bold mb-1">{restaurant.name}</h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {restaurant.rating || '4.5'}
              </span>
              <span>{restaurant.cuisine}</span>
            </div>
          </div>
        </div>

        {/* Info Bar */}
        <div className="px-4 py-3 flex items-center gap-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{restaurant.location}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{restaurant.deliveryTime || '20-35 min'}</span>
          </div>
          {restaurant.cashbackPercent && (
            <span className="ml-auto bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
              {restaurant.cashbackPercent}% cashback
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="px-4 py-3 bg-white sticky top-0 z-10">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('menu')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'menu' 
                  ? "bg-white text-primary shadow-sm" 
                  : "text-gray-500"
              )}
            >
              <ShoppingBag className="w-4 h-4" />
              Meniu
            </button>
            <button
              onClick={() => setActiveTab('vouchers')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'vouchers' 
                  ? "bg-white text-primary shadow-sm" 
                  : "text-gray-500"
              )}
            >
              <Ticket className="w-4 h-4" />
              Vouchere ({packages.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4">
          {activeTab === 'menu' ? (
            <div className="space-y-6">
              {Object.entries(groupedMenu).map(([category, items]) => (
                <div key={category}>
                  <h3 className="font-bold text-gray-900 mb-3">{category}</h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <MenuItemCard 
                        key={item.id} 
                        item={item} 
                        onAdd={() => handleAddToCart(item)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              
              {menuItems.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Meniul nu este disponibil momentan</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {packages.map((pkg) => (
                <VoucherPackageCard
                  key={pkg.id}
                  pkg={pkg}
                  onClick={() => handleBuyVoucher(pkg)}
                />
              ))}
              
              {packages.length === 0 && (
                <div className="text-center py-12">
                  <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nu sunt vouchere disponibile</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
