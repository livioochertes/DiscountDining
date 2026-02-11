import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import QrPaymentSection from "@/components/QrPaymentSection";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Wallet, 
  CreditCard, 
  Gift, 
  History, 
  Plus, 
  QrCode, 
  Star,
  Euro,
  Ticket,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";

// Initialize Stripe - gracefully handle missing key for mobile builds
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

// Stripe Checkout Form Component
const WalletStripeCheckout = ({ amount, customerId, onSuccess }: { 
  amount: string; 
  customerId: number; 
  onSuccess: () => void; 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/wallet`,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Payment succeeded, complete the wallet top-up
        onSuccess();
        toast({
          title: "Payment Successful",
          description: "Your wallet has been topped up successfully!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "An error occurred during payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Top-up amount: <span className="font-medium">€{amount}</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Payment will be processed to EatOff's account
        </p>
      </div>
      <PaymentElement 
        options={{
          layout: {
            type: 'tabs',
            defaultCollapsed: false,
            radios: false,
            spacedAccordionItems: false
          },
          paymentMethodOrder: ['card', 'klarna', 'google_pay', 'apple_pay'],
          wallets: {
            applePay: 'auto',
            googlePay: 'auto'
          }
        }}
      />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? "Processing..." : `Pay €${amount}`}
      </Button>
    </form>
  );
};



interface WalletData {
  wallet: {
    id: number;
    customerId: number;
    cashBalance: string;
    loyaltyPoints: number;
    totalPointsEarned: number;
    isActive: boolean;
  };
  vouchers: any[];
  generalVouchers: any[];
  transactions: any[];
  summary: {
    totalCashBalance: string;
    totalLoyaltyPoints: number;
    totalVouchers: number;
    totalGeneralVouchers: number;
    estimatedValue: string;
  };
}

export default function WalletPage() {
  const [, setLocation] = useLocation();
  const [topUpAmount, setTopUpAmount] = useState("");
  const [showQrCode, setShowQrCode] = useState(false);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // All hooks must be called before any conditional returns
  // Fetch wallet data
  const { data: walletData, isLoading, isRefetching, refetch: refetchWallet } = useQuery<WalletData>({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const response = await apiRequest("GET", `/api/customers/${user.id}/wallet`);
      return response.json();
    },
    enabled: !!user?.id && isAuthenticated,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    staleTime: 10000,
  });

  // Fetch available general vouchers
  const { data: availableVouchers = [] } = useQuery({
    queryKey: ["general-vouchers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/general-vouchers");
      return response.json();
    },
    enabled: isAuthenticated
  });

  // Create Stripe payment intent for wallet top-up
  const createPaymentIntentMutation = useMutation({
    mutationFn: async ({ amount }: { amount: string }) => {
      if (!user?.id) throw new Error("User not authenticated");
      const response = await apiRequest("POST", `/api/customers/${user.id}/wallet/create-payment-intent`, {
        amount: parseFloat(amount)
      });
      return response.json();
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Payment",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Complete wallet top-up after successful Stripe payment
  const completeTopUpMutation = useMutation({
    mutationFn: async ({ paymentIntentId }: { paymentIntentId: string }) => {
      if (!user?.id) throw new Error("User not authenticated");
      const response = await apiRequest("POST", `/api/customers/${user.id}/wallet/complete-topup`, {
        paymentIntentId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] });
      toast({
        title: "Payment Successful",
        description: "Your wallet has been topped up successfully!"
      });
      setTopUpAmount("");
      setShowStripeCheckout(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error Completing Top-up",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Purchase general voucher mutation
  const purchaseVoucherMutation = useMutation({
    mutationFn: async ({ voucherId, paymentMethod }: { voucherId: number, paymentMethod: string }) => {
      if (!user?.id) throw new Error("User not authenticated");
      const response = await apiRequest("POST", `/api/customers/${user.id}/purchase-general-voucher`, {
        generalVoucherId: voucherId,
        paymentMethod
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["general-vouchers"] });
      toast({
        title: "Voucher Purchased Successfully",
        description: "Your new voucher is ready to use!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Purchasing Voucher",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const pullRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

  const handleTouchStart = useCallback((e: { touches: { clientY: number }[] }) => {
    const el = pullRef.current;
    if (el && el.scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: { touches: { clientY: number }[] }) => {
    if (!isPullingRef.current) return;
    const currentY = e.touches[0].clientY;
    const diff = Math.max(0, currentY - startYRef.current);
    const dampened = Math.min(diff * 0.4, 80);
    setPullDistance(dampened);
    setIsPulling(dampened > 0);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 50) {
      refetchWallet();
      toast({ title: "Wallet actualizat!" });
    }
    setPullDistance(0);
    setIsPulling(false);
    isPullingRef.current = false;
  }, [pullDistance, refetchWallet, toast]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">{t.accessRequired}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">Please sign in to access your wallet.</p>
            <Button 
              onClick={() => setLocation('/login')} 
              className="w-full"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount.",
        variant: "destructive"
      });
      return;
    }

    try {
      const paymentData = await createPaymentIntentMutation.mutateAsync({ amount: topUpAmount });
      setClientSecret(paymentData.clientSecret);
      setShowStripeCheckout(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment",
        variant: "destructive"
      });
    }
  };

  const handleStripeSuccess = () => {
    setShowStripeCheckout(false);
    setTopUpAmount("");
    queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] });
  };

  const handlePurchaseVoucher = (voucherId: number) => {
    purchaseVoucherMutation.mutate({ voucherId, paymentMethod: "wallet" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Unable to load wallet data</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={pullRef}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {(isPulling || isRefetching) && (
        <div
          className="flex items-center justify-center transition-all duration-200 overflow-hidden"
          style={{ height: isPulling ? `${pullDistance}px` : isRefetching ? '48px' : '0px' }}
        >
          <div className={`flex items-center gap-2 text-sm text-gray-500 ${pullDistance > 50 ? 'text-primary font-medium' : ''}`}>
            <div className={`w-5 h-5 border-2 border-current border-t-transparent rounded-full ${(pullDistance > 50 || isRefetching) ? 'animate-spin' : ''}`}
              style={{ transform: isPulling ? `rotate(${pullDistance * 4}deg)` : undefined }}
            />
            {isRefetching ? 'Se actualizează...' : pullDistance > 50 ? 'Eliberați pentru refresh' : 'Trageți în jos...'}
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Wallet className="h-8 w-8 mr-3 text-primary" />
            My Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your balance, vouchers, and points
          </p>
        </div>

        {/* Wallet Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
              <Euro className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{walletData.wallet.cashBalance}</div>
              <p className="text-xs text-muted-foreground">Available to spend</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{walletData.wallet.loyaltyPoints}</div>
              <p className="text-xs text-muted-foreground">
                Worth €{(walletData.wallet.loyaltyPoints / 100).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vouchers</CardTitle>
              <Ticket className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{walletData.summary.totalVouchers}</div>
              <p className="text-xs text-muted-foreground">Restaurant vouchers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{walletData.summary.estimatedValue}</div>
              <p className="text-xs text-muted-foreground">Everything combined</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vouchers">My Vouchers</TabsTrigger>
            <TabsTrigger value="store">Voucher Store</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Up Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Cash to Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="topup-amount">Amount (€)</Label>
                      <Input
                        id="topup-amount"
                        type="number"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                        placeholder="0.00"
                        min="1"
                        step="0.01"
                      />
                    </div>
                    <Button 
                      onClick={handleTopUp}
                      disabled={createPaymentIntentMutation.isPending}
                      className="w-full"
                    >
                      {createPaymentIntentMutation.isPending ? "Processing..." : "Add Cash"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* QR Payment Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <QrCode className="h-5 w-5 mr-2" />
                    QR Code Payment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Generate a QR code to pay at restaurants using your wallet balance or vouchers.
                    </p>
                    {!showQrCode && (
                      <Button 
                        onClick={() => setShowQrCode(true)}
                        variant="outline"
                        className="w-full"
                      >
                        Generate Payment QR
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Inline QR Payment Section */}
            <QrPaymentSection 
              isOpen={showQrCode} 
              onClose={() => setShowQrCode(false)}
              customerId={user?.id || 0}
            />

            {/* Recent Activity */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {walletData.transactions.slice(0, 5).map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {transaction.transactionType === "deposit" ? (
                          <ArrowDownLeft className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          transaction.transactionType === "deposit" 
                            ? "text-green-600" 
                            : "text-red-600"
                        }`}>
                          {transaction.transactionType === "deposit" ? "+" : ""}€{transaction.amount}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Vouchers Tab */}
          <TabsContent value="vouchers">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Restaurant Vouchers */}
              {walletData.vouchers.map((voucher: any) => (
                <Card key={voucher.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{voucher.restaurant?.name}</CardTitle>
                    <Badge variant="secondary">{voucher.package?.name}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Meals Left:</span>
                        <span className="font-medium">
                          {voucher.totalMeals - voucher.usedMeals} / {voucher.totalMeals}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Expires:</span>
                        <span className="text-sm">
                          {new Date(voucher.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                      <Button size="sm" className="w-full mt-4">
                        Use Voucher
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* General Vouchers */}
              {walletData.generalVouchers.map((voucher: any) => (
                <Card key={voucher.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">General Voucher</CardTitle>
                    <Badge variant="outline">Universal</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Value:</span>
                        <span className="font-medium">€{voucher.purchasePrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge variant={voucher.status === "active" ? "default" : "secondary"}>
                          {voucher.status}
                        </Badge>
                      </div>
                      <Button size="sm" className="w-full mt-4">
                        Use at Restaurant
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {walletData.vouchers.length === 0 && walletData.generalVouchers.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No vouchers yet</p>
                  <p className="text-sm text-gray-400 mb-4">Purchase vouchers to start saving</p>
                  <Button onClick={() => {/* Switch to store tab */}}>
                    Browse Voucher Store
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Voucher Store Tab */}
          <TabsContent value="store">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableVouchers.map((voucher: any) => (
                <Card key={voucher.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{voucher.name}</CardTitle>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{voucher.voucherType}</Badge>
                      <Badge variant="outline" className="text-green-600">
                        {voucher.savingsPercentage}% OFF
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{voucher.description}</p>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Price:</span>
                        <div className="text-right">
                          <span className="font-bold">€{voucher.price}</span>
                          <span className="text-sm text-muted-foreground line-through ml-2">
                            €{voucher.originalValue}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Discount:</span>
                        <span className="font-medium">€{voucher.discountValue}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Valid for:</span>
                        <span className="text-sm">{voucher.validityDays} days</span>
                      </div>

                      <Button 
                        onClick={() => handlePurchaseVoucher(voucher.id)}
                        disabled={
                          purchaseVoucherMutation.isPending ||
                          parseFloat(walletData.wallet.cashBalance) < parseFloat(voucher.price)
                        }
                        className="w-full"
                      >
                        {parseFloat(walletData.wallet.cashBalance) < parseFloat(voucher.price)
                          ? "Insufficient Balance"
                          : purchaseVoucherMutation.isPending
                          ? "Purchasing..."
                          : "Purchase Voucher"
                        }
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {availableVouchers.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No vouchers available</p>
                  <p className="text-sm text-gray-400">Check back later for new offers</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {walletData.transactions.map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {transaction.transactionType === "deposit" ? (
                          <ArrowDownLeft className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString()} at{" "}
                            {new Date(transaction.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          transaction.transactionType === "deposit" 
                            ? "text-green-600" 
                            : "text-red-600"
                        }`}>
                          {transaction.transactionType === "deposit" ? "+" : ""}€{transaction.amount}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Balance: €{transaction.balanceAfter}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>


        {/* Stripe Checkout Modal */}
        {showStripeCheckout && clientSecret && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add Cash to Wallet</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowStripeCheckout(false)}
                >
                  ×
                </Button>
              </div>
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#ea580c'
                    }
                  }
                }}
              >
                <WalletStripeCheckout 
                  amount={topUpAmount}
                  customerId={user?.id || 0}
                  onSuccess={handleStripeSuccess}
                />
              </Elements>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}