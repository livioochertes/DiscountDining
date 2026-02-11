import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Wallet, CreditCard, Gift, TrendingUp, ArrowUpRight, ArrowDownLeft, ChevronRight, Star, MapPin, Users, AlertCircle, CheckCircle, Clock, BadgePercent, ArrowLeft, X, Plus, Loader2 } from 'lucide-react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { getMobileSessionToken } from '@/lib/queryClient';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from '@/hooks/use-toast';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

interface CreditType {
  id: number;
  name: string;
  amount: string;
  description: string | null;
  interestRate: string;
  paymentTermDays: number;
  isCustomAmount: boolean;
  minCustomAmount: string | null;
  maxCustomAmount: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || (Capacitor.isNativePlatform() ? 'https://eatoff.app' : '');

type WalletTab = 'vouchers' | 'cashback' | 'credit';

interface WalletOverview {
  personalBalance: string;
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
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = (['vouchers', 'cashback', 'credit'].includes(urlParams.get('tab') || '') 
    ? urlParams.get('tab') as WalletTab 
    : 'vouchers');
  const [activeTab, setActiveTab] = useState<WalletTab>(initialTab);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Listen for Stripe return deep link
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleAppUrlOpen = App.addListener('appUrlOpen', async (event) => {
      console.log('[MobileWallet] Deep link received:', event.url);
      
      try {
        const url = new URL(event.url);
        
        // Handle stripe-return deep link
        if (url.protocol === 'eatoff:' && url.host === 'stripe-return') {
          const status = url.searchParams.get('status');
          const amount = url.searchParams.get('amount');
          
          console.log('[MobileWallet] Stripe return status:', status, 'amount:', amount);
          
          if (status === 'success') {
            toast({
              title: 'Plată reușită!',
              description: amount ? `${amount} Lei au fost adăugați în portofel.` : 'Suma a fost adăugată în portofel.',
            });
            // Refresh wallet data
            queryClient.invalidateQueries({ queryKey: ['/api/wallet/overview'] });
            queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
          } else if (status === 'cancelled') {
            toast({
              title: 'Plată anulată',
              description: 'Plata a fost anulată.',
              variant: 'destructive'
            });
          }
        }
      } catch (err) {
        console.error('[MobileWallet] Error parsing deep link:', err);
      }
    });

    return () => {
      handleAppUrlOpen.remove();
    };
  }, [queryClient, toast]);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Top-up modal state (for Add Money button)
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  
  // Credit request form state
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [selectedCreditType, setSelectedCreditType] = useState<CreditType | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [creditForm, setCreditForm] = useState({
    fullName: '',
    cnp: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    county: '',
    postalCode: '',
    employmentStatus: '',
    monthlyIncome: '',
    employer: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    staleTime: 10000,
  });

  // Fetch credit types for the request form (always fetch fresh to show max available)
  const { data: creditTypes = [] } = useQuery<CreditType[]>({
    queryKey: ['/api/credit-types'],
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  
  // Calculate max credit from available credit types
  const maxCreditAmount = creditTypes.length > 0 
    ? Math.max(...creditTypes.filter(ct => !ct.isCustomAmount).map(ct => parseFloat(ct.amount) || 0))
    : 0;

  // Validate CNP (Romanian personal ID - 13 digits)
  const validateCNP = (cnp: string): boolean => {
    if (!/^\d{13}$/.test(cnp)) return false;
    // Basic CNP validation
    const controlWeights = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnp[i]) * controlWeights[i];
    }
    let control = sum % 11;
    if (control === 10) control = 1;
    return control === parseInt(cnp[12]);
  };

  // Validate form before submission
  const validateCreditForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!creditForm.fullName.trim()) errors.fullName = 'Numele complet este obligatoriu';
    if (!creditForm.cnp.trim()) {
      errors.cnp = 'CNP-ul este obligatoriu';
    } else if (!validateCNP(creditForm.cnp)) {
      errors.cnp = 'CNP invalid (trebuie să conțină 13 cifre valide)';
    }
    if (!creditForm.phone.trim()) errors.phone = 'Telefonul este obligatoriu';
    if (!creditForm.address.trim()) errors.address = 'Adresa este obligatorie';
    if (!creditForm.city.trim()) errors.city = 'Orașul este obligatoriu';
    if (!creditForm.county.trim()) errors.county = 'Județul este obligatoriu';
    
    if (!selectedCreditType) {
      errors.creditType = 'Selectați tipul de credit';
    } else if (selectedCreditType.isCustomAmount) {
      const amount = parseFloat(customAmount);
      const min = parseFloat(selectedCreditType.minCustomAmount || '100');
      const max = parseFloat(selectedCreditType.maxCustomAmount || '10000');
      if (!customAmount || isNaN(amount) || amount < min || amount > max) {
        errors.customAmount = `Suma trebuie să fie între ${min} și ${max} RON`;
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Request credit mutation with personal data
  interface CreditRequestData {
    creditTypeId: number;
    requestedAmount: number;
    fullName: string;
    cnp: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    county: string;
    postalCode: string;
    employmentStatus: string;
    monthlyIncome: string;
    employer: string;
  }

  const requestCreditMutation = useMutation({
    mutationFn: async (data: CreditRequestData) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (Capacitor.isNativePlatform()) {
        const token = await getMobileSessionToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      const response = await fetch(`${API_BASE_URL}/api/credit-request`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to request credit');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/overview'] });
      setShowCreditForm(false);
      setSelectedCreditType(null);
      setCustomAmount('');
      setCreditForm({
        fullName: '',
        cnp: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        county: '',
        postalCode: '',
        employmentStatus: '',
        monthlyIncome: '',
        employer: ''
      });
      setFormErrors({});
    },
    onError: (error: Error) => {
      setFormErrors({ submit: error.message });
    },
  });

  const handleSubmitCreditRequest = () => {
    if (!validateCreditForm() || !selectedCreditType) return;
    
    const amount = selectedCreditType.isCustomAmount 
      ? parseFloat(customAmount)
      : parseFloat(selectedCreditType.amount);
    
    requestCreditMutation.mutate({
      creditTypeId: selectedCreditType.id,
      requestedAmount: amount,
      ...creditForm,
    });
  };

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
          <div className="flex justify-between items-start mb-1">
            <p className="text-white/60 text-sm">{t.walletTotalBalance || 'Sold Total'}</p>
            <button 
              onClick={() => setShowTopUpModal(true)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.walletAddMoney || 'Adaugă bani'}
            </button>
          </div>
          <p className="text-4xl font-bold tracking-tight mb-4">
            {(
              parseFloat(walletOverview?.personalBalance || '0') +
              parseFloat(walletOverview?.cashback?.totalCashbackBalance || '0') +
              (walletOverview?.credit?.status === 'approved' ? parseFloat(walletOverview?.credit?.availableCredit || '0') : 0)
            ).toFixed(2)} RON
          </p>
          
          <div className="grid grid-cols-4 gap-3">
            <div>
              <p className="text-white/50 text-xs">{t.walletPersonal || 'Personal'}</p>
              <p className="text-lg font-semibold text-blue-400">
                {parseFloat(walletOverview?.personalBalance || '0').toFixed(0)} RON
              </p>
            </div>
            <div>
              <p className="text-white/50 text-xs">{t.vouchers || 'Vouchere'}</p>
              <p className="text-lg font-semibold">{vouchers.length}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">{t.walletCashback || 'Cashback'}</p>
              <p className="text-lg font-semibold text-green-400">
                {parseFloat(walletOverview?.cashback?.totalCashbackBalance || '0').toFixed(0)} RON
              </p>
            </div>
            <div>
              <p className="text-white/50 text-xs">{t.walletCredit || 'Credit'}</p>
              <p className={cn(
                "text-lg font-semibold",
                walletOverview?.credit?.status === 'approved' ? "text-white" : "text-red-400"
              )}>
                {walletOverview?.credit?.status === 'approved' 
                  ? `${parseFloat(walletOverview?.credit?.availableCredit || '0').toFixed(0)} RON`
                  : walletOverview?.credit?.status === 'pending'
                    ? (t.walletPending || 'Așteptare')
                    : (t.walletNotRequested || 'N/A')
                }
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <button 
            onClick={() => setLocation('/m/explore')}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-2xl font-semibold"
          >
            <ArrowDownLeft className="w-5 h-5" />
            {t.walletBuyVoucher || 'Cumpără Voucher'}
          </button>
          <button 
            onClick={() => setShowPaymentModal(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-900 py-3.5 rounded-2xl font-semibold"
          >
            <CreditCard className="w-5 h-5" />
            {t.walletPay || 'Plătește'}
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
            <h3 className="font-semibold text-gray-900">{t.walletActiveVouchers || 'Vouchere Active'}</h3>
            {vouchers.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-2xl">
                <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">{t.walletNoActiveVouchers || 'Nu ai vouchere active'}</p>
                <button className="text-primary font-medium">{t.walletBuyFirstVoucher || 'Cumpără primul tău voucher'}</button>
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
                <p className="text-green-700 font-medium">{t.walletEatoffCashback || 'Cashback EatOff'}</p>
                <p className="text-2xl font-bold text-green-700">
                  {parseFloat(walletOverview?.cashback?.eatoffCashbackBalance || '0').toFixed(2)} RON
                </p>
              </div>
              <p className="text-sm text-green-600/70">{t.walletAppliedAutomatically || 'Se aplică automat la plată'}</p>
            </div>

            {/* Total Cashback Stats */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">{t.walletTotalEarned || 'Total câștigat'}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {parseFloat(walletOverview?.cashback?.totalCashbackEarned || '0').toFixed(2)} RON
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t.walletTotalUsed || 'Total folosit'}</p>
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
                  {t.walletCashbackGroups || 'Grupuri Cashback'}
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
                  {t.walletLoyaltyGroups || 'Grupuri Fidelizare'}
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
                <h3 className="font-semibold text-gray-900">{t.walletCashbackPerRestaurant || 'Cashback per Restaurant'}</h3>
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
                <p className="text-gray-500 mb-2">{t.walletNoCashbackEnrolled || 'Nu ești înrolat în niciun grup de cashback'}</p>
                <p className="text-sm text-gray-400">{t.walletVisitPartnerRestaurants || 'Vizitează restaurantele partenere pentru a te înscrie'}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'credit' && (
          <div className="space-y-4">
            {/* Fallback when no wallet data */}
            {!walletOverview?.credit && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">{t.walletLoadingData || 'Se încarcă datele...'}</p>
                <p className="text-sm text-gray-400 mt-1">{t.walletReloadPage || 'Dacă problema persistă, reîncărcați pagina'}</p>
              </div>
            )}
            
            {/* Credit Request Form */}
            {showCreditForm && (walletOverview?.credit?.status === 'not_requested' || walletOverview?.credit?.status === 'rejected') && (
              <div className="bg-white rounded-2xl overflow-hidden">
                {/* Form Header */}
                <div className="bg-gradient-to-r from-primary to-green-600 p-4 flex items-center gap-3">
                  <button 
                    onClick={() => setShowCreditForm(false)}
                    className="text-white p-1"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h2 className="text-white font-semibold text-lg">{t.walletRequestCredit}</h2>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Credit Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.walletSelectCreditAmount} *</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {creditTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => {
                            setSelectedCreditType(type);
                            if (!type.isCustomAmount) setCustomAmount('');
                          }}
                          className={cn(
                            "p-2 rounded-lg border-2 text-left transition-all",
                            selectedCreditType?.id === type.id
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <p className="font-bold text-sm">
                            {type.isCustomAmount ? t.walletCustomAmount : `${parseFloat(type.amount).toFixed(0)}`}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">{type.name}</p>
                          {type.interestRate && parseFloat(type.interestRate) > 0 && (
                            <p className="text-[10px] text-amber-600">{parseFloat(type.interestRate).toFixed(1)}%</p>
                          )}
                        </button>
                      ))}
                    </div>
                    {formErrors.creditType && <p className="text-red-500 text-xs mt-1">{formErrors.creditType}</p>}
                  </div>
                  
                  {/* Custom Amount Input */}
                  {selectedCreditType?.isCustomAmount && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Suma dorită ({parseFloat(selectedCreditType.minCustomAmount || '100').toFixed(0)} - {parseFloat(selectedCreditType.maxCustomAmount || '10000').toFixed(0)} RON) *
                      </label>
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Introduceți suma"
                        className="w-full p-3 border border-gray-200 rounded-xl text-[16px]"
                      />
                      {formErrors.customAmount && <p className="text-red-500 text-xs mt-1">{formErrors.customAmount}</p>}
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Date personale</h3>
                    
                    {/* Full Name */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nume complet *</label>
                      <input
                        type="text"
                        value={creditForm.fullName}
                        onChange={(e) => setCreditForm({...creditForm, fullName: e.target.value})}
                        placeholder="Ion Popescu"
                        className="w-full p-3 border border-gray-200 rounded-xl text-[16px]"
                      />
                      {formErrors.fullName && <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>}
                    </div>
                    
                    {/* CNP */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">CNP (Cod Numeric Personal) *</label>
                      <input
                        type="text"
                        maxLength={13}
                        value={creditForm.cnp}
                        onChange={(e) => setCreditForm({...creditForm, cnp: e.target.value.replace(/\D/g, '')})}
                        placeholder="1234567890123"
                        className="w-full p-3 border border-gray-200 rounded-xl text-[16px]"
                      />
                      {formErrors.cnp && <p className="text-red-500 text-xs mt-1">{formErrors.cnp}</p>}
                    </div>
                    
                    {/* Phone & Email */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                        <input
                          type="tel"
                          value={creditForm.phone}
                          onChange={(e) => setCreditForm({...creditForm, phone: e.target.value})}
                          placeholder="0722123456"
                          className="w-full p-3 border border-gray-200 rounded-xl text-[16px]"
                        />
                        {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={creditForm.email}
                          onChange={(e) => setCreditForm({...creditForm, email: e.target.value})}
                          placeholder="email@exemplu.ro"
                          className="w-full p-3 border border-gray-200 rounded-xl text-[16px]"
                        />
                      </div>
                    </div>
                    
                    {/* Address */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adresă completă *</label>
                      <input
                        type="text"
                        value={creditForm.address}
                        onChange={(e) => setCreditForm({...creditForm, address: e.target.value})}
                        placeholder="Str. Exemplu, Nr. 1, Bl. A1, Sc. 2, Ap. 10"
                        className="w-full p-3 border border-gray-200 rounded-xl text-[16px]"
                      />
                      {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
                    </div>
                    
                    {/* City, County, Postal Code */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Oraș *</label>
                        <input
                          type="text"
                          value={creditForm.city}
                          onChange={(e) => setCreditForm({...creditForm, city: e.target.value})}
                          placeholder="București"
                          className="w-full p-3 border border-gray-200 rounded-xl text-[16px]"
                        />
                        {formErrors.city && <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Județ *</label>
                        <input
                          type="text"
                          value={creditForm.county}
                          onChange={(e) => setCreditForm({...creditForm, county: e.target.value})}
                          placeholder="Sector 1"
                          className="w-full p-3 border border-gray-200 rounded-xl text-[16px]"
                        />
                        {formErrors.county && <p className="text-red-500 text-xs mt-1">{formErrors.county}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cod poștal</label>
                        <input
                          type="text"
                          value={creditForm.postalCode}
                          onChange={(e) => setCreditForm({...creditForm, postalCode: e.target.value})}
                          placeholder="010101"
                          className="w-full p-3 border border-gray-200 rounded-xl text-[16px]"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Employment Info (Optional) */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Informații angajare (opțional)</h3>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status angajare</label>
                      <select
                        value={creditForm.employmentStatus}
                        onChange={(e) => setCreditForm({...creditForm, employmentStatus: e.target.value})}
                        className="w-full p-3 border border-gray-200 rounded-xl text-[16px] bg-white"
                      >
                        <option value="">Selectează...</option>
                        <option value="employed">Angajat</option>
                        <option value="self-employed">Liber profesionist</option>
                        <option value="student">Student</option>
                        <option value="retired">Pensionar</option>
                        <option value="other">Altele</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Venit lunar (RON)</label>
                        <input
                          type="number"
                          value={creditForm.monthlyIncome}
                          onChange={(e) => setCreditForm({...creditForm, monthlyIncome: e.target.value})}
                          placeholder="3000"
                          className="w-full p-3 border border-gray-200 rounded-xl text-[16px]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Angajator</label>
                        <input
                          type="text"
                          value={creditForm.employer}
                          onChange={(e) => setCreditForm({...creditForm, employer: e.target.value})}
                          placeholder="Nume companie"
                          className="w-full p-3 border border-gray-200 rounded-xl text-[16px]"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Error Message */}
                  {formErrors.submit && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-red-600 text-sm">{formErrors.submit}</p>
                    </div>
                  )}
                  
                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitCreditRequest}
                    disabled={requestCreditMutation.isPending}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {requestCreditMutation.isPending ? (
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        Trimite Solicitarea
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {/* Credit Status Display (when not showing form) */}
            {!showCreditForm && walletOverview?.credit?.status === 'not_requested' && (
              <>
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-red-700 font-medium text-sm flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {t.walletCreditOnAccount}
                    </p>
                    <CreditCard className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-2xl font-bold text-red-600">
                      {t.walletMaxAvailable} {maxCreditAmount > 0 ? maxCreditAmount : parseFloat(walletOverview.credit.defaultDisplayLimit || '1000').toFixed(0)} RON
                    </p>
                    <p className="text-xs text-red-500">{t.walletAvailableAfterApproval}</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">{t.walletBuyNowPayLater}</span>
                    {' '}{t.walletCreditNeedsApproval}
                  </p>
                </div>

                <button 
                  onClick={() => setShowCreditForm(true)}
                  className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                >
                  {t.walletRequestNewCredit}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {walletOverview?.credit?.status === 'pending' && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-amber-700 font-medium text-sm flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {t.walletPendingApproval}
                    </p>
                    <CreditCard className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-2xl font-bold text-amber-600">
                      {parseFloat(walletOverview.credit.requestedAmount || walletOverview.credit.defaultDisplayLimit || '1000').toFixed(0)} RON
                    </p>
                    <p className="text-xs text-amber-500">{t.walletRequested}</p>
                  </div>
                </div>

                <div className="bg-white border border-amber-100 rounded-xl p-3">
                  <p className="text-xs text-gray-600">
                    {t.walletRequestBeingProcessed}
                  </p>
                </div>
              </>
            )}

            {walletOverview?.credit?.status === 'approved' && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-green-700 font-medium text-sm flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      {t.walletCreditApproved}
                    </p>
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-2xl font-bold text-green-700">
                      {parseFloat(walletOverview.credit.availableCredit || '0').toFixed(0)} RON
                    </p>
                    <p className="text-xs text-green-600">{t.walletAvailable}</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-gray-500">{t.walletTotalLimit}</p>
                      <p className="text-base font-bold text-gray-900">
                        {parseFloat(walletOverview.credit.creditLimit || '0').toFixed(0)} RON
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">{t.walletUsed}</p>
                      <p className="text-base font-bold text-gray-900">
                        {parseFloat(walletOverview.credit.usedCredit || '0').toFixed(0)} RON
                      </p>
                    </div>
                  </div>
                </div>

                {parseFloat(walletOverview.credit.interestRate || '0') > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5">
                    <p className="text-xs text-blue-700">
                      <span className="font-medium">{t.walletInterest}: {walletOverview.credit.interestRate}%</span>
                      {' '}• {t.walletTerm}: {walletOverview.credit.paymentTermDays || 30} {t.walletDays}
                    </p>
                  </div>
                )}
              </>
            )}

            {!showCreditForm && walletOverview?.credit?.status === 'rejected' && (
              <>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-700 font-medium text-sm flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {t.walletRejectedStatus}
                    </p>
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">{t.walletTryAgainLater}</p>
                </div>

                <button 
                  onClick={() => setShowCreditForm(true)}
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                >
                  {t.walletRequestAgain}
                  <ChevronRight className="w-4 h-4" />
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
      
      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal 
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          personalBalance={parseFloat(walletOverview?.personalBalance || '0')}
          cashbackBalance={parseFloat(walletOverview?.cashback?.totalCashbackBalance || '0')}
          creditBalance={walletOverview?.credit?.status === 'approved' ? parseFloat(walletOverview?.credit?.availableCredit || '0') : 0}
          vouchers={vouchers}
        />
      )}
      
      {/* Top-up Modal (Add Money) */}
      {showTopUpModal && (
        <TopUpModal 
          isOpen={showTopUpModal}
          onClose={() => setShowTopUpModal(false)}
          translations={t}
        />
      )}
    </MobileLayout>
  );
}

// Stripe Top-up Form Component
function TopUpStripeForm({ amount, onSuccess, onCancel }: { 
  amount: string; 
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    
    setIsProcessing(true);
    setStripeError(null);
    
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/m/wallet`,
        },
        redirect: 'if_required'
      });
      
      if (error) {
        setStripeError(error.message || 'Plata a eșuat');
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setStripeError(err.message || 'Eroare la procesarea plății');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-lg p-3">
        <p className="text-sm text-gray-600 mb-1">
          Suma: <span className="font-semibold">{amount} EUR</span>
        </p>
      </div>
      <div className="bg-white rounded-lg p-3">
        <PaymentElement 
          options={{
            layout: { type: 'tabs', defaultCollapsed: false }
          }}
        />
      </div>
      {stripeError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {stripeError}
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl font-semibold bg-gray-200 text-gray-700"
        >
          Anulează
        </button>
        <button 
          type="submit"
          disabled={!stripe || isProcessing}
          className={cn(
            "flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2",
            !stripe || isProcessing ? "bg-gray-300 text-gray-500" : "bg-blue-600 text-white"
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Se procesează...
            </>
          ) : (
            `Plătește ${amount} EUR`
          )}
        </button>
      </div>
    </form>
  );
}

// Payment Modal Component
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalBalance: number;
  cashbackBalance: number;
  creditBalance: number;
  vouchers: any[];
}

function PaymentModal({ isOpen, onClose, personalBalance, cashbackBalance, creditBalance, vouchers }: PaymentModalProps) {
  const queryClient = useQueryClient();
  const [totalAmount, setTotalAmount] = useState('');
  const [allocations, setAllocations] = useState<Record<string, number>>({
    personal: 0,
    cashback: 0,
    credit: 0
  });
  const [voucherAllocations, setVoucherAllocations] = useState<Record<number, number>>({});
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [paymentCode, setPaymentCode] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);
  
  const totalAllocated = allocations.personal + allocations.cashback + allocations.credit + 
    Object.values(voucherAllocations).reduce((sum, val) => sum + val, 0);
  const remaining = parseFloat(totalAmount || '0') - totalAllocated;
  
  const handleAllocationChange = (source: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setAllocations(prev => ({ ...prev, [source]: numValue }));
  };
  
  const handleVoucherAllocationChange = (voucherId: number, value: string, maxValue: number) => {
    const numValue = Math.min(parseFloat(value) || 0, maxValue);
    setVoucherAllocations(prev => ({ ...prev, [voucherId]: numValue }));
  };
  
  const handleTopUpWithCard = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) return;
    
    setIsLoadingStripe(true);
    setError(null);
    
    try {
      const token = await getMobileSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      // For native mobile, use Stripe Checkout Session with redirect
      if (Capacitor.isNativePlatform()) {
        console.log('[TopUp] Creating checkout session for mobile...');
        const response = await fetch(`${API_BASE_URL}/api/wallet/topup/create-checkout-session`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ amount: topUpAmount })
        });
        
        const data = await response.json();
        console.log('[TopUp] Response:', response.status, data);
        
        if (!response.ok) {
          throw new Error(data.message || 'Eroare la crearea plății');
        }
        
        // Open Stripe checkout in external browser
        if (data.url) {
          console.log('[TopUp] Opening URL:', data.url);
          // Use window.open for maximum compatibility
          window.open(data.url, '_blank');
          setShowTopUp(false);
          setTopUpAmount('');
        } else {
          throw new Error('Nu s-a putut crea sesiunea de plată');
        }
      } else {
        // For web, use Payment Intent with embedded Elements
        const response = await fetch(`${API_BASE_URL}/api/wallet/topup/create-intent`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ amount: topUpAmount })
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Eroare la crearea plății');
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingStripe(false);
    }
  };
  
  const handleTopUpSuccess = () => {
    setClientSecret(null);
    setShowTopUp(false);
    setTopUpAmount('');
    queryClient.invalidateQueries({ queryKey: ['/api/wallet/overview'] });
  };
  
  const handleGenerateQR = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const token = await getMobileSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/api/wallet/split-payment`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          totalAmount,
          allocations,
          voucherAllocations
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Eroare la procesarea plății');
      }
      
      const data = await response.json();
      setPaymentCode(data.paymentCode);
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/overview'] });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const activeVouchers = vouchers.filter(v => v.status === 'active');
  
  if (!isOpen) return null;
  
  // Show payment code QR
  if (paymentCode) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-3xl p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Plată procesată!</h2>
          <p className="text-gray-600 mb-4">Arată acest cod la restaurant:</p>
          <div className="bg-gray-100 rounded-xl p-4 mb-4">
            <p className="text-2xl font-mono font-bold tracking-wider">{paymentCode}</p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Total: {parseFloat(totalAmount).toFixed(2)} RON
          </p>
          <button
            onClick={() => { setPaymentCode(null); onClose(); }}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold"
          >
            Închide
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Plătește</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Total Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suma de plată (RON)
            </label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 text-2xl font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          
          {/* Payment Sources */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Selectează sursa de plată</h3>
            
            {/* Personal Balance */}
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-medium text-blue-900">Sold Personal</p>
                  <p className="text-sm text-blue-700">Disponibil: {personalBalance.toFixed(2)} RON</p>
                </div>
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <input
                type="number"
                value={allocations.personal || ''}
                onChange={(e) => handleAllocationChange('personal', e.target.value)}
                max={personalBalance}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white"
              />
              <button 
                onClick={() => setShowTopUp(true)}
                className="mt-2 text-sm text-blue-600 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Adaugă fonduri
              </button>
            </div>
            
            {/* Top-up Card Section */}
            {showTopUp && (
              <div className="bg-blue-100 rounded-xl p-4 border-2 border-blue-300">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-medium text-blue-900">Alimentează soldul</p>
                  <button onClick={() => { setShowTopUp(false); setClientSecret(null); }}>
                    <X className="w-5 h-5 text-blue-700" />
                  </button>
                </div>
                
                {clientSecret && stripePromise ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <TopUpStripeForm 
                      amount={topUpAmount} 
                      onSuccess={handleTopUpSuccess}
                      onCancel={() => setClientSecret(null)}
                    />
                  </Elements>
                ) : (
                  <>
                    <div className="flex gap-2 mb-3">
                      {[200, 300, 500, 1000].map((val) => (
                        <button
                          key={val}
                          onClick={() => setTopUpAmount(val.toString())}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-sm font-medium",
                            topUpAmount === val.toString() 
                              ? "bg-blue-600 text-white" 
                              : "bg-white text-blue-700 border border-blue-300"
                          )}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      placeholder="Altă sumă..."
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white mb-3"
                    />
                    <button 
                      onClick={handleTopUpWithCard}
                      disabled={!topUpAmount || parseFloat(topUpAmount) <= 0 || isLoadingStripe}
                      className={cn(
                        "w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2",
                        topUpAmount && parseFloat(topUpAmount) > 0 && !isLoadingStripe
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-400"
                      )}
                    >
                      {isLoadingStripe ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Se încarcă...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          Plătește cu cardul
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
            
            {/* Cashback */}
            {cashbackBalance > 0 && (
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-medium text-green-900">Cashback</p>
                    <p className="text-sm text-green-700">Disponibil: {cashbackBalance.toFixed(2)} RON</p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <input
                  type="number"
                  value={allocations.cashback || ''}
                  onChange={(e) => handleAllocationChange('cashback', e.target.value)}
                  max={cashbackBalance}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-green-200 rounded-lg bg-white"
                />
              </div>
            )}
            
            {/* Credit */}
            {creditBalance > 0 && (
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-medium text-purple-900">Credit</p>
                    <p className="text-sm text-purple-700">Disponibil: {creditBalance.toFixed(2)} RON</p>
                  </div>
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <input
                  type="number"
                  value={allocations.credit || ''}
                  onChange={(e) => handleAllocationChange('credit', e.target.value)}
                  max={creditBalance}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg bg-white"
                />
              </div>
            )}
            
            {/* Vouchers */}
            {activeVouchers.length > 0 && (
              <div className="space-y-3">
                <p className="font-medium text-gray-700">Vouchere</p>
                {activeVouchers.map((voucher: any) => {
                  const voucherValue = parseFloat(voucher.remainingValue || voucher.value || '0');
                  return (
                    <div key={voucher.id} className="bg-orange-50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-medium text-orange-900">{voucher.restaurantName || 'Voucher'}</p>
                          <p className="text-sm text-orange-700">Disponibil: {voucherValue.toFixed(2)} RON</p>
                        </div>
                        <Gift className="w-6 h-6 text-orange-600" />
                      </div>
                      <input
                        type="number"
                        value={voucherAllocations[voucher.id] || ''}
                        onChange={(e) => handleVoucherAllocationChange(voucher.id, e.target.value, voucherValue)}
                        max={voucherValue}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-orange-200 rounded-lg bg-white"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {/* Summary */}
          <div className="bg-gray-100 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Total alocat:</span>
              <span className="font-semibold">{totalAllocated.toFixed(2)} RON</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rămâne de plătit:</span>
              <span className={cn(
                "font-bold text-lg",
                remaining > 0 ? "text-red-600" : remaining < 0 ? "text-amber-600" : "text-green-600"
              )}>
                {remaining.toFixed(2)} RON
              </span>
            </div>
          </div>
          
          {/* Generate QR Button */}
          <button
            onClick={handleGenerateQR}
            disabled={remaining !== 0 || parseFloat(totalAmount || '0') <= 0 || isProcessing}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2",
              remaining === 0 && parseFloat(totalAmount || '0') > 0 && !isProcessing
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Se procesează...
              </>
            ) : (
              'Generează Cod QR'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Top-up Modal Component (Add Money)
interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  translations: any;
}

function TopUpModal({ isOpen, onClose, translations: t }: TopUpModalProps) {
  const queryClient = useQueryClient();
  const { marketplace } = useMarketplace();
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const currencyCode = marketplace?.currencyCode || 'RON';
  const currencySymbol = marketplace?.currencySymbol || 'Lei';
  const predefinedAmounts = [200, 300, 500, 1000];
  
  const handleTopUpWithCard = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) return;
    
    setIsLoadingStripe(true);
    setError(null);
    
    try {
      const token = await getMobileSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      // For native mobile, use Stripe Checkout Session with redirect
      if (Capacitor.isNativePlatform()) {
        const response = await fetch(`${API_BASE_URL}/api/wallet/topup/create-checkout-session`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ amount: topUpAmount, currency: currencyCode.toLowerCase(), marketplaceId: marketplace?.id })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || (t.topUpPaymentError || 'Error creating payment'));
        }
        
        if (data.url) {
          window.open(data.url, '_blank');
          onClose();
        } else {
          throw new Error(t.topUpSessionError || 'Could not create payment session');
        }
      } else {
        // For web, use Payment Intent with embedded Elements
        const response = await fetch(`${API_BASE_URL}/api/wallet/topup/create-intent`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ amount: topUpAmount, currency: currencyCode.toLowerCase(), marketplaceId: marketplace?.id })
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || (t.topUpPaymentError || 'Error creating payment'));
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingStripe(false);
    }
  };
  
  const handleTopUpSuccess = () => {
    setClientSecret(null);
    setTopUpAmount('');
    queryClient.invalidateQueries({ queryKey: ['/api/wallet/overview'] });
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 max-h-[70vh] overflow-y-auto pointer-events-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl">
          <h2 className="text-xl font-bold text-gray-900">{t.topUpTitle || 'Add Money'}</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="p-4 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {clientSecret && stripePromise ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <TopUpStripeForm 
                amount={topUpAmount} 
                onSuccess={handleTopUpSuccess}
                onCancel={() => setClientSecret(null)}
              />
            </Elements>
          ) : (
            <>
              {/* Predefined Amounts */}
              <div>
                <p className="text-sm text-gray-600 mb-3">{t.topUpSelectAmount || 'Select amount'}</p>
                <div className="grid grid-cols-4 gap-2">
                  {predefinedAmounts.map((val) => (
                    <button
                      key={val}
                      onClick={() => setTopUpAmount(val.toString())}
                      className={cn(
                        "py-3 rounded-xl text-lg font-semibold transition-colors",
                        topUpAmount === val.toString() 
                          ? "bg-primary text-white" 
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Custom Amount Input */}
              <div>
                <p className="text-sm text-gray-600 mb-2">{t.topUpCustomAmount || 'Or enter custom amount'}</p>
                <div className="relative">
                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-4 text-2xl font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-center"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{currencyCode}</span>
                </div>
              </div>
              
              {/* Pay Button */}
              <button 
                onClick={handleTopUpWithCard}
                disabled={!topUpAmount || parseFloat(topUpAmount) <= 0 || isLoadingStripe}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-lg flex flex-col items-center justify-center",
                  topUpAmount && parseFloat(topUpAmount) > 0 && !isLoadingStripe
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-400"
                )}
              >
                {isLoadingStripe ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.topUpLoading || 'Loading...'}
                  </div>
                ) : (
                  <>
                    <span>{t.topUpAddCredit || 'Add Credit'}</span>
                    <span className="text-xs font-normal opacity-80">{t.topUpFundsAdded || 'Funds will be added to your EatOff wallet'}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
