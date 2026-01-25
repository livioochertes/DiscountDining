import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Wallet, CreditCard, Gift, TrendingUp, ArrowUpRight, ArrowDownLeft, ChevronRight, Star, MapPin } from 'lucide-react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';

type WalletTab = 'vouchers' | 'cashback' | 'credit';

interface Transaction {
  id: number;
  type: 'voucher_purchase' | 'voucher_use' | 'cashback' | 'credit_payment';
  merchant: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending';
}

export default function MobileWallet() {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<WalletTab>('vouchers');

  const { data: userStats } = useQuery<any>({
    queryKey: ['/api/users/stats'],
    enabled: !!user,
  });

  const { data: vouchers = [] } = useQuery<any[]>({
    queryKey: ['/api/user-vouchers'],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );
  }

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center min-h-[60vh]">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <Wallet className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Your Digital Wallet
          </h2>
          <p className="text-gray-500 mb-8 max-w-sm">
            Create an account to manage your vouchers, earn cashback, and access exclusive deals from partner restaurants.
          </p>
          <button
            onClick={() => setLocation('/m/signin')}
            className="w-full max-w-xs bg-primary text-white font-semibold py-4 px-6 rounded-2xl mb-3 hover:bg-primary/90 transition-colors"
          >
            {t.signIn}
          </button>
          <button
            onClick={() => setLocation('/m/signin')}
            className="w-full max-w-xs bg-gray-100 text-gray-700 font-medium py-4 px-6 rounded-2xl hover:bg-gray-200 transition-colors"
          >
            {t.alreadyHaveAccount}
          </button>
        </div>
      </MobileLayout>
    );
  }

  const mockTransactions: Transaction[] = [
    { id: 1, type: 'voucher_purchase', merchant: 'Bella Vista', amount: -50, date: '2025-01-22', status: 'completed' },
    { id: 2, type: 'cashback', merchant: 'Trattoria Roma', amount: 5.50, date: '2025-01-21', status: 'completed' },
    { id: 3, type: 'voucher_use', merchant: 'Pizza Napoli', amount: -25, date: '2025-01-20', status: 'completed' },
    { id: 4, type: 'cashback', merchant: 'Sushi Master', amount: 3.20, date: '2025-01-19', status: 'pending' },
  ];

  const tabs = [
    { id: 'vouchers' as const, label: 'Vouchers', icon: Gift, count: vouchers.length },
    { id: 'cashback' as const, label: 'Cashback', icon: TrendingUp },
    { id: 'credit' as const, label: 'Credit', icon: CreditCard },
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'voucher_purchase':
      case 'voucher_use':
        return Gift;
      case 'cashback':
        return TrendingUp;
      case 'credit_payment':
        return CreditCard;
      default:
        return Wallet;
    }
  };

  return (
    <MobileLayout>
      <div className="px-4 pt-4 pb-6 space-y-6">
        {/* Header Balance */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white">
          <p className="text-white/60 text-sm mb-1">Total Balance</p>
          <p className="text-4xl font-bold tracking-tight mb-4">
            €{(userStats?.walletBalance || 0).toFixed(2)}
          </p>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-white/50 text-xs">Vouchers</p>
              <p className="text-lg font-semibold">€{(userStats?.voucherValue || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Cashback</p>
              <p className="text-lg font-semibold text-green-400">€{(userStats?.totalCashback || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Credit</p>
              <p className="text-lg font-semibold">€{(userStats?.creditLimit || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-2xl font-semibold">
            <ArrowDownLeft className="w-5 h-5" />
            Buy Voucher
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-900 py-3.5 rounded-2xl font-semibold">
            <ArrowUpRight className="w-5 h-5" />
            Use Voucher
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-2xl p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'vouchers' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Active Vouchers</h3>
            {vouchers.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-2xl">
                <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No active vouchers</p>
                <button className="text-primary font-medium">Buy your first voucher</button>
              </div>
            ) : (
              vouchers.map((voucher: any) => {
                const restaurant = voucher.restaurant || {};
                const googleRating = parseFloat(restaurant.googleRating) || 0;
                const eatoffRating = parseFloat(restaurant.rating) || 0;
                const googleCount = restaurant.googleReviewCount || 0;
                const eatoffCount = restaurant.reviewCount || 0;
                const totalReviews = googleCount + eatoffCount;
                const combinedRating = totalReviews > 0 
                  ? (googleRating * googleCount + eatoffRating * eatoffCount) / totalReviews
                  : 0;
                const remainingMeals = voucher.totalMeals - (voucher.usedMeals || 0);
                const mealValue = parseFloat(voucher.purchasePrice) / voucher.totalMeals;
                const remainingValue = (remainingMeals * mealValue).toFixed(2);
                
                return (
                  <div
                    key={voucher.id}
                    className="bg-white border border-gray-100 rounded-2xl p-3 flex gap-3"
                  >
                    <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                      {restaurant.imageUrl ? (
                        <img 
                          src={restaurant.imageUrl} 
                          alt={restaurant.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <span className="text-xl">🍽️</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {restaurant.name || 'EatOff Network'}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-0.5">
                        {combinedRating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium text-gray-700">
                              {combinedRating.toFixed(1)}
                            </span>
                            {totalReviews > 0 && (
                              <span className="text-xs text-gray-400">({totalReviews})</span>
                            )}
                          </div>
                        )}
                        {restaurant.cuisine && (
                          <span className="text-xs text-gray-500">• {restaurant.cuisine}</span>
                        )}
                      </div>
                      
                      {restaurant.address && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500 truncate">{restaurant.address}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                          {remainingMeals} {t.mealsRemaining}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900">€{remainingValue}</p>
                      <p className="text-[10px] text-gray-400">{t.value}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'cashback' && (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-green-700 font-medium">Available Cashback</p>
                <p className="text-2xl font-bold text-green-700">€{(userStats?.totalCashback || 0).toFixed(2)}</p>
              </div>
              <p className="text-sm text-green-600/70">Cashback is applied automatically at checkout</p>
            </div>
            
            <h3 className="font-semibold text-gray-900">Cashback Progress</h3>
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Next reward at €100</span>
                <span className="text-sm font-medium text-primary">€67/€100</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '67%' }} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'credit' && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-blue-700 font-medium">Credit Line</p>
                  <p className="text-sm text-blue-600/70">Buy now, pay later</p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-blue-700">€{(userStats?.creditLimit || 200).toFixed(0)}</p>
                <p className="text-sm text-blue-600/70">available</p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <p className="text-sm text-gray-600 mb-2">Cost: <span className="font-medium">+5% fee</span></p>
              <p className="text-sm text-gray-500">Pay in restaurants with your credit line. Fee is applied at checkout.</p>
            </div>

            <button className="w-full bg-primary text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2">
              Request Credit Increase
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Recent Transactions */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
            <button className="text-primary text-sm font-medium">See all</button>
          </div>

          {mockTransactions.map((tx) => {
            const Icon = getTransactionIcon(tx.type);
            const isPositive = tx.amount > 0;
            
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    isPositive ? "bg-green-50" : "bg-gray-100"
                  )}>
                    <Icon className={cn("w-5 h-5", isPositive ? "text-green-600" : "text-gray-600")} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tx.merchant}</p>
                    <p className="text-xs text-gray-500">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-semibold",
                    isPositive ? "text-green-600" : "text-gray-900"
                  )}>
                    {isPositive ? '+' : ''}€{Math.abs(tx.amount).toFixed(2)}
                  </p>
                  {tx.status === 'pending' && (
                    <p className="text-xs text-amber-500">Pending</p>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </MobileLayout>
  );
}
