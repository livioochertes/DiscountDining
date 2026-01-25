import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Search, Bell, Store, ChevronRight, Star } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { WalletCard, ActionRow } from '@/components/mobile/WalletCard';
import { CategoryChips } from '@/components/mobile/CategoryChips';
import { RestaurantCardSmall } from '@/components/mobile/RestaurantCard';
import { DealBanner, SmallDealCard } from '@/components/mobile/DealBanner';
import { useAuth } from '@/hooks/useAuth';

interface EatoffVoucher {
  id: number;
  restaurantId?: number;
  name: string;
  description: string;
  mealCount: number;
  totalValue: string;
  bonusPercentage: string;
  discountPercentage: string;
  validityDays: number;
  isActive: boolean;
  isCredit?: boolean;
}

interface VoucherPackage {
  id: number;
  restaurantId: number;
  name: string;
  description: string;
  mealCount: number;
  pricePerMeal: string;
  discountPercentage: string;
  validityMonths: number;
  isActive: boolean;
}

interface RestaurantWithVouchers {
  restaurant: any;
  vouchers: EatoffVoucher[];
}

function VoucherChipHome({ voucher, onClick }: { voucher: EatoffVoucher; onClick: () => void }) {
  const discountPercent = parseFloat(voucher.discountPercentage) || 0;
  const bonusPercent = parseFloat(voucher.bonusPercentage) || 0;
  const totalValue = parseFloat(voucher.totalValue) || 0;
  
  const isCredit = bonusPercent > 0;
  const displayPercent = isCredit ? bonusPercent : discountPercent;
  const prefix = isCredit ? '+' : '-';
  const bgColor = isCredit ? 'bg-red-500' : 'bg-green-500';
  
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200 hover:border-primary/50 transition-all"
    >
      <span className={`${bgColor} text-white text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap`}>
        {prefix}{displayPercent.toFixed(0)}%
      </span>
      <span className="text-sm font-bold text-primary whitespace-nowrap">{totalValue.toFixed(0)} RON</span>
    </button>
  );
}

function RestaurantVoucherRowHome({ data, onVoucherClick }: { 
  data: RestaurantWithVouchers; 
  onVoucherClick: (restaurantId: number, voucherId: number, isCredit: boolean) => void;
}) {
  const { restaurant, vouchers } = data;
  const sortedVouchers = [...vouchers]
    .sort((a, b) => {
      const aDiscount = parseFloat(a.discountPercentage) || 0;
      const bDiscount = parseFloat(b.discountPercentage) || 0;
      const aBonus = parseFloat(a.bonusPercentage) || 0;
      const bBonus = parseFloat(b.bonusPercentage) || 0;
      if (aBonus === 0 && bBonus > 0) return -1;
      if (aBonus > 0 && bBonus === 0) return 1;
      if (aBonus === 0 && bBonus === 0) return bDiscount - aDiscount;
      return aBonus - bBonus;
    });
  
  const googleRating = parseFloat(restaurant.googleRating) || 0;
  const eatoffRating = parseFloat(restaurant.rating) || 0;
  const googleCount = restaurant.googleReviewCount || 0;
  const eatoffCount = restaurant.reviewCount || 0;
  const totalReviews = googleCount + eatoffCount;
  const combinedRating = totalReviews > 0 
    ? (googleRating * googleCount + eatoffRating * eatoffCount) / totalReviews
    : (googleRating || eatoffRating);
  
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
      <div className="flex gap-3">
        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
          {restaurant.imageUrl ? (
            <img 
              src={restaurant.imageUrl} 
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
              <Store className="w-7 h-7 text-primary" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 truncate text-[15px]">{restaurant.name}</h3>
            {combinedRating > 0 && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-gray-700">{combinedRating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
            {restaurant.cuisine && <span>{restaurant.cuisine}</span>}
            {restaurant.address && (
              <>
                <span>•</span>
                <span className="truncate">{restaurant.address}</span>
              </>
            )}
          </div>
          <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-hide">
            {sortedVouchers.map((voucher) => (
              <VoucherChipHome 
                key={voucher.isCredit ? `credit-${voucher.id}` : `discount-${voucher.id}`} 
                voucher={voucher}
                onClick={() => onVoucherClick(restaurant.id, voucher.id, voucher.isCredit || false)}
              />
            ))}
            {vouchers.length > 3 && (
              <span className="flex-shrink-0 flex items-center text-xs text-gray-400 pl-1">
                •••
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const isNativePlatform = Capacitor.isNativePlatform();
const API_BASE_URL = import.meta.env.VITE_API_URL || (isNativePlatform ? 'https://eatoff.app' : '');

export default function MobileHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: restaurants = [], isLoading: restaurantsLoading, error: restaurantsError } = useQuery<any[]>({
    queryKey: ['/api/restaurants'],
    queryFn: async () => {
      const url = `${API_BASE_URL}/api/restaurants`;
      console.log('[MobileHome] Fetching restaurants from:', url);
      console.log('[MobileHome] API_BASE_URL value:', API_BASE_URL);
      try {
        const res = await fetch(url);
        console.log('[MobileHome] Response status:', res.status);
        if (!res.ok) {
          const text = await res.text();
          console.error('[MobileHome] Error response:', text);
          throw new Error('Failed to fetch restaurants');
        }
        const data = await res.json();
        console.log('[MobileHome] Restaurants loaded:', data.length);
        return data;
      } catch (err) {
        console.error('[MobileHome] Fetch error:', err);
        throw err;
      }
    }
  });

  console.log('[MobileHome] State:', {
    API_BASE_URL,
    restaurantsLoading,
    restaurantsCount: restaurants.length,
    error: restaurantsError?.message
  });

  const { data: creditVouchers = [] } = useQuery<EatoffVoucher[]>({
    queryKey: ['/api/eatoff-vouchers'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/eatoff-vouchers`);
      if (!res.ok) throw new Error('Failed to fetch credit vouchers');
      return res.json();
    }
  });

  const { data: discountPackages = [] } = useQuery<VoucherPackage[]>({
    queryKey: ['/api/voucher-packages'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/voucher-packages`);
      if (!res.ok) throw new Error('Failed to fetch discount packages');
      return res.json();
    }
  });

  const vouchers: EatoffVoucher[] = [
    ...discountPackages.filter(p => p.isActive).map(p => ({
      id: p.id,
      restaurantId: p.restaurantId,
      name: p.name,
      description: p.description || '',
      mealCount: p.mealCount,
      totalValue: String(parseFloat(p.pricePerMeal) * p.mealCount),
      bonusPercentage: '0',
      discountPercentage: p.discountPercentage,
      validityDays: (p.validityMonths || 1) * 30,
      isActive: p.isActive,
      isCredit: false
    })),
    ...creditVouchers.filter(v => v.isActive).map(v => ({
      id: v.id,
      restaurantId: 0,
      name: v.name,
      description: v.description || '',
      mealCount: 0,
      totalValue: String(v.totalValue),
      bonusPercentage: String(v.bonusPercentage || '0'),
      discountPercentage: '0',
      validityDays: v.validityDays || 30,
      isActive: v.isActive,
      isCredit: true
    }))
  ];

  const { data: favoriteRestaurants = [] } = useQuery<any[]>({
    queryKey: ['/api/customers', user?.id, 'favorite-restaurants'],
    queryFn: async () => {
      const url = `${API_BASE_URL}/api/customers/${user?.id}/favorite-restaurants`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch favorites');
      return res.json();
    },
    enabled: !!user?.id
  });

  const { data: userStats } = useQuery<any>({
    queryKey: ['/api/users/stats'],
    enabled: !!user,
  });

  const activeVouchers = vouchers
    .filter(v => v.isActive)
    .sort((a, b) => {
      const aDiscount = parseFloat(a.discountPercentage) || 0;
      const bDiscount = parseFloat(b.discountPercentage) || 0;
      const aBonus = parseFloat(a.bonusPercentage) || 0;
      const bBonus = parseFloat(b.bonusPercentage) || 0;
      if (aBonus === 0 && bBonus > 0) return -1;
      if (aBonus > 0 && bBonus === 0) return 1;
      if (aBonus === 0 && bBonus === 0) return bDiscount - aDiscount;
      return aBonus - bBonus;
    });

  const restaurantsWithVouchers: RestaurantWithVouchers[] = restaurants
    .slice(0, 4)
    .map((restaurant: any) => ({
      restaurant,
      vouchers: activeVouchers.filter(v => 
        v.isCredit || v.restaurantId === restaurant.id
      )
    }))
    .filter(item => item.vouchers.length > 0);

  const handleVoucherClick = (restaurantId: number, voucherId: number, isCredit: boolean) => {
    if (isCredit) {
      setLocation(`/m/wallet?voucherId=${voucherId}&type=credit`);
    } else {
      setLocation(`/m/restaurant/${restaurantId}?tab=vouchers&voucherId=${voucherId}&from=vouchers`);
    }
  };

  const handleBuyVoucher = () => setLocation('/m/explore?tab=vouchers');
  const handleUseVoucher = () => setLocation('/m/wallet');
  const handleAIMenu = () => setLocation('/m/ai-menu');
  const handleCashback = () => setLocation('/m/wallet');
  const handleCredit = () => setLocation('/m/wallet');

  return (
    <MobileLayout>
      <div className="px-4 pt-4 pb-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Good morning 👋</p>
            <h1 className="text-xl font-bold text-gray-900">
              {user?.name || 'Guest'}
            </h1>
          </div>
          <button className="relative p-2 bg-gray-100 rounded-full">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>

        {/* Wallet Card Hero */}
        <WalletCard
          balance={userStats?.walletBalance || 0}
          cashback={userStats?.totalCashback || 0}
          activeVouchers={userStats?.activeVouchers || 0}
          creditAvailable={userStats?.creditLimit || 0}
          onBuyVoucher={handleBuyVoucher}
          onUseVoucher={handleUseVoucher}
        />

        {/* Action Row */}
        <ActionRow
          onBuyVoucher={handleBuyVoucher}
          onAIMenu={handleAIMenu}
          onCashback={handleCashback}
          onCredit={handleCredit}
        />

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search restaurants or dishes..."
            className="w-full pl-12 pr-4 py-3.5 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            onFocus={() => setLocation('/m/explore')}
          />
        </div>

        {/* Categories */}
        <CategoryChips
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Your Favorites - only shown when logged in and has favorites from purchases */}
        {user && favoriteRestaurants.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">Your favorites</h2>
              <button 
                onClick={() => setLocation('/m/explore')}
                className="text-primary text-sm font-medium"
              >
                See all
              </button>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3">
                {favoriteRestaurants.slice(0, 4).map((restaurant: any) => (
                  <RestaurantCardSmall
                    key={restaurant.id}
                    name={restaurant.name}
                    image={restaurant.imageUrl}
                    rating={Number(restaurant.rating) || 4.5}
                    cashbackPercent={restaurant.cashbackPercent || 3}
                    onClick={() => setLocation(`/m/restaurant/${restaurant.id}`)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recommended for you */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Recommended for you</h2>
            <button 
              onClick={() => setLocation('/m/ai-menu')}
              className="text-primary text-sm font-medium"
            >
              See all
            </button>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3">
              {restaurants.slice(0, 5).map((restaurant: any) => (
                <RestaurantCardSmall
                  key={restaurant.id}
                  name={restaurant.name}
                  image={restaurant.imageUrl}
                  rating={restaurant.rating || 4.5}
                  cashbackPercent={restaurant.cashbackPercent || 5}
                  onClick={() => setLocation(`/m/restaurant/${restaurant.id}`)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Today's Deals */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Today's Deals</h2>
          
          <DealBanner
            title="Get 20% off your first voucher"
            subtitle="Use code WELCOME20"
            discount="-20%"
            backgroundColor="bg-gradient-to-r from-primary to-primary/80"
          />

          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3">
              <SmallDealCard
                title="Double cashback"
                discount="2x"
                icon="💰"
              />
              <SmallDealCard
                title="Network vouchers"
                discount="-15%"
                icon="🏪"
              />
              <SmallDealCard
                title="Weekend special"
                discount="-10%"
                icon="🎉"
              />
            </div>
          </div>
        </section>

        {/* Vouchers Section */}
        {restaurantsWithVouchers.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Vouchere disponibile</h2>
              <button 
                onClick={() => setLocation('/m/explore?tab=vouchers')}
                className="text-primary text-sm font-medium flex items-center gap-1"
              >
                Vezi toate
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              {restaurantsWithVouchers.map((item) => (
                <RestaurantVoucherRowHome
                  key={item.restaurant.id}
                  data={item}
                  onVoucherClick={handleVoucherClick}
                />
              ))}
            </div>
            
            <button
              onClick={() => setLocation('/m/explore?tab=vouchers')}
              className="w-full py-3 bg-primary/10 text-primary font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors"
            >
              Vezi toate voucherele
              <ChevronRight className="w-5 h-5" />
            </button>
          </section>
        )}
      </div>
    </MobileLayout>
  );
}
