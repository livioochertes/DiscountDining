import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Search, Bell } from 'lucide-react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { WalletCard, ActionRow } from '@/components/mobile/WalletCard';
import { CategoryChips } from '@/components/mobile/CategoryChips';
import { RestaurantCardSmall } from '@/components/mobile/RestaurantCard';
import { DealBanner, SmallDealCard } from '@/components/mobile/DealBanner';
import { useAuth } from '@/hooks/useAuth';

export default function MobileHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: restaurants = [] } = useQuery<any[]>({
    queryKey: ['/api/restaurants'],
    queryFn: async () => {
      const res = await fetch('/api/restaurants');
      if (!res.ok) throw new Error('Failed to fetch restaurants');
      return res.json();
    }
  });

  const { data: userStats } = useQuery<any>({
    queryKey: ['/api/users/stats'],
    enabled: !!user,
  });

  const handleBuyVoucher = () => setLocation('/m/explore');
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

        {/* AI Recommendations */}
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

        {/* Deals */}
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

        {/* Favorites */}
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
              {restaurants.slice(0, 4).map((restaurant: any) => (
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
      </div>
    </MobileLayout>
  );
}
