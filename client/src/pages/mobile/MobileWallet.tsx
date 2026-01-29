import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Wallet, CreditCard, Gift, TrendingUp, ArrowUpRight, ArrowDownLeft, ChevronRight, Star, MapPin, Users, AlertCircle, CheckCircle, Clock, BadgePercent } from 'lucide-react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';
import { getMobileSessionToken } from '@/lib/queryClient';

const API_BASE_URL = Capacitor.isNativePlatform() 
  ? 'https://0c90c681-c530-48b5-a772-aad7086fccf3-00-225nal1mjdpuu.kirk.replit.dev'
  : '';

type WalletTab = 'vouchers' | 'cashback' | 'credit';

interface WalletOverview {
  cashback: {
    eatoffCashbackBalance: string;
    totalCashbackBalance: string;
    totalCashbackEarned: string;
    totalCashbackUsed: string;
  };
  credit: {
    status: string;
    creditLimit: string;
    availableCredit: string;
    usedCredit: string;
    defaultDisplayLimit: string;
    requestedAmount?: string;
    interestRate?: string;
    paymentTermDays?: number;
  };
  cashbackEnrollments: Array<{
    enrollment: any;
    group: any;
  }>;
  loyaltyEnrollments: Array<{
    enrollment: any;
    group: any;
  }>;
  restaurantCashbacks: Array<any>;
}

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
  const queryClient = useQueryClient();

  const { data: userStats } = useQuery<any>({
    queryKey: ['/api/users/stats'],
    enabled: !!user,
  });

  const { data: vouchers = [] } = useQuery<any[]>({
    queryKey: ['/api/user-vouchers'],
    enabled: !!user,
  });

  // Fetch wallet overview with cashback and credit info
  const { data: walletOverview } = useQuery<WalletOverview>({
    queryKey: ['/api/wallet/overview'],
    queryFn: async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (Capacitor.isNativePlatform()) {
        const token = await getMobileSessionToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      const response = await fetch(`${API_BASE_URL}/api/wallet/overview`, {
        credentials: 'include',
        headers,
      });
      if (!response.ok) throw new Error('Failed to fetch wallet overview');
      return response.json();
    },
    enabled: !!user,
  });

  // Request credit mutation
  const requestCreditMutation = useMutation({
    mutationFn: async (amount: string) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (Capacitor.isNativePlatform()) {
        const token = await getMobileSessionToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      const response = await fetch(`${API_BASE_URL}/api/wallet/credit/request`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ requestedAmount: amount }),
      });
      if (!response.ok) throw new Error('Failed to request credit');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/overview'] });
    },
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

  const transactions: Transaction[] = [];

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
          <p className="text-white/60 text-sm mb-1">Sold Total</p>
          <p className="text-4xl font-bold tracking-tight mb-4">
            {(
              parseFloat(walletOverview?.cashback?.totalCashbackBalance || '0') +
              (walletOverview?.credit?.status === 'approved' ? parseFloat(walletOverview?.credit?.availableCredit || '0') : 0)
            ).toFixed(2)} RON
          </p>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-white/50 text-xs">Vouchere</p>
              <p className="text-lg font-semibold">{vouchers.length}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Cashback</p>
              <p className="text-lg font-semibold text-green-400">
                {parseFloat(walletOverview?.cashback?.totalCashbackBalance || '0').toFixed(2)} RON
              </p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Credit</p>
              <p className={cn(
                "text-lg font-semibold",
                walletOverview?.credit?.status === 'approved' ? "text-white" : "text-red-400"
              )}>
                {walletOverview?.credit?.status === 'approved' 
                  ? `${parseFloat(walletOverview?.credit?.availableCredit || '0').toFixed(0)} RON`
                  : walletOverview?.credit?.status === 'pending'
                    ? 'În așteptare'
                    : 'Nesolicitat'
                }
              </p>
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
            {/* EatOff Cashback Balance */}
            <div className="bg-green-50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-green-700 font-medium">EatOff Cashback</p>
                <p className="text-2xl font-bold text-green-700">
                  {parseFloat(walletOverview?.cashback?.eatoffCashbackBalance || '0').toFixed(2)} RON
                </p>
              </div>
              <p className="text-sm text-green-600/70">Se aplică automat la plată</p>
            </div>

            {/* Total Cashback Stats */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Total câștigat</p>
                  <p className="text-lg font-bold text-gray-900">
                    {parseFloat(walletOverview?.cashback?.totalCashbackEarned || '0').toFixed(2)} RON
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total folosit</p>
                  <p className="text-lg font-bold text-gray-900">
                    {parseFloat(walletOverview?.cashback?.totalCashbackUsed || '0').toFixed(2)} RON
                  </p>
                </div>
              </div>
            </div>

            {/* Cashback Groups */}
            {walletOverview?.cashbackEnrollments && walletOverview.cashbackEnrollments.length > 0 && (
              <>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Grupuri Cashback
                </h3>
                {walletOverview.cashbackEnrollments.map((item, index) => (
                  <div key={index} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.group?.name || 'Grup Cashback'}</p>
                      <p className="text-sm text-gray-500">{item.group?.description || ''}</p>
                    </div>
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                      {parseFloat(item.group?.cashbackPercentage || '0')}%
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Loyalty Groups (Discount) */}
            {walletOverview?.loyaltyEnrollments && walletOverview.loyaltyEnrollments.length > 0 && (
              <>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BadgePercent className="w-4 h-4" />
                  Grupuri Fidelizare
                </h3>
                {walletOverview.loyaltyEnrollments.map((item, index) => (
                  <div key={index} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.group?.name || 'Grup Fidelizare'}</p>
                      <p className="text-sm text-gray-500">Tier {item.group?.tierLevel || 1}</p>
                    </div>
                    <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                      {parseFloat(item.group?.discountPercentage || '0')}% discount
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Restaurant Cashbacks */}
            {walletOverview?.restaurantCashbacks && walletOverview.restaurantCashbacks.length > 0 && (
              <>
                <h3 className="font-semibold text-gray-900">Cashback per Restaurant</h3>
                {walletOverview.restaurantCashbacks.map((rc, index) => (
                  <div key={index} className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Restaurant #{rc.restaurantId}</p>
                      <p className="text-xs text-gray-400">Cheltuit: {parseFloat(rc.totalSpent || '0').toFixed(2)} RON</p>
                    </div>
                    <p className="font-bold text-green-600">{parseFloat(rc.cashbackBalance || '0').toFixed(2)} RON</p>
                  </div>
                ))}
              </>
            )}

            {/* Empty state */}
            {(!walletOverview?.cashbackEnrollments || walletOverview.cashbackEnrollments.length === 0) && 
             (!walletOverview?.loyaltyEnrollments || walletOverview.loyaltyEnrollments.length === 0) && (
              <div className="text-center py-8 bg-gray-50 rounded-2xl">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">Nu ești înrolat în niciun grup de cashback</p>
                <p className="text-sm text-gray-400">Vizitează restaurantele partenere pentru a te înscrie</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'credit' && (
          <div className="space-y-4">
            {/* Credit Status Display */}
            {walletOverview?.credit?.status === 'not_requested' && (
              <>
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-red-700 font-medium flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Credit pe Cont
                      </p>
                      <p className="text-sm text-red-600/70">Necesită solicitare și aprobare</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-red-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-red-600">
                      {parseFloat(walletOverview.credit.defaultDisplayLimit || '1000').toFixed(0)} RON
                    </p>
                    <p className="text-sm text-red-500">disponibil după aprobare</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Cumpără acum, plătește mai târziu!</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Solicită credit pe cont pentru a plăti la restaurante fără numerar. 
                    Creditul trebuie aprobat de EatOff.
                  </p>
                </div>

                <button 
                  onClick={() => requestCreditMutation.mutate('1000.00')}
                  disabled={requestCreditMutation.isPending}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {requestCreditMutation.isPending ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      Solicită Credit
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </>
            )}

            {walletOverview?.credit?.status === 'pending' && (
              <>
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-amber-700 font-medium flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Solicitare în așteptare
                      </p>
                      <p className="text-sm text-amber-600/70">Se așteaptă aprobarea EatOff</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-amber-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-amber-600">
                      {parseFloat(walletOverview.credit.requestedAmount || walletOverview.credit.defaultDisplayLimit || '1000').toFixed(0)} RON
                    </p>
                    <p className="text-sm text-amber-500">solicitat</p>
                  </div>
                </div>

                <div className="bg-white border border-amber-100 rounded-2xl p-4">
                  <p className="text-sm text-gray-600">
                    Solicitarea ta este în curs de procesare. Vei primi o notificare când creditul va fi aprobat.
                  </p>
                </div>
              </>
            )}

            {walletOverview?.credit?.status === 'approved' && (
              <>
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-green-700 font-medium flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Credit Aprobat
                      </p>
                      <p className="text-sm text-green-600/70">Plătește la orice restaurant partener</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-green-700">
                      {parseFloat(walletOverview.credit.availableCredit || '0').toFixed(0)} RON
                    </p>
                    <p className="text-sm text-green-600">disponibil</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Limită totală</p>
                      <p className="text-lg font-bold text-gray-900">
                        {parseFloat(walletOverview.credit.creditLimit || '0').toFixed(0)} RON
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Utilizat</p>
                      <p className="text-lg font-bold text-gray-900">
                        {parseFloat(walletOverview.credit.usedCredit || '0').toFixed(0)} RON
                      </p>
                    </div>
                  </div>
                </div>

                {parseFloat(walletOverview.credit.interestRate || '0') > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Dobândă: {walletOverview.credit.interestRate}%</span>
                      {' '}• Termen de plată: {walletOverview.credit.paymentTermDays || 30} zile
                    </p>
                  </div>
                )}
              </>
            )}

            {walletOverview?.credit?.status === 'rejected' && (
              <>
                <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-gray-700 font-medium flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Solicitare respinsă
                      </p>
                      <p className="text-sm text-gray-500">Poți încerca din nou mai târziu</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-gray-400" />
                  </div>
                </div>

                <button 
                  onClick={() => requestCreditMutation.mutate('1000.00')}
                  disabled={requestCreditMutation.isPending}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2"
                >
                  Solicită din nou
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Recent Transactions */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
            {transactions.length > 0 && (
              <button className="text-primary text-sm font-medium">See all</button>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No transactions yet</p>
            </div>
          ) : (
            transactions.map((tx) => {
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
            })
          )}
        </section>
      </div>
    </MobileLayout>
  );
}
