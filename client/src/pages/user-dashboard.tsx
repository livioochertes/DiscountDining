import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingBag, 
  Award, 
  Clock, 
  TrendingUp, 
  Star,
  MapPin,
  CreditCard,
  Calendar,
  User,
  Mail,
  Heart,
  AlertTriangle,
  Target,
  ChefHat,
  Home,
  Ticket,
  Brain
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import ReservationModal from "@/components/ReservationModal";

// Import the VoucherDetailModal component from my-vouchers page
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  pointsEarned: number;
  vouchersOwned: number;
  favoriteRestaurants: number;
  membershipTier: string;
  voucherValue: number;
  orderValue: number;
  remainingValue: number;
}

interface RecentOrder {
  id: number;
  restaurantName: string;
  orderNumber: string;
  totalAmount: string;
  status: string;
  orderDate: string;
  items: number;
}

interface RecentVoucher {
  id: number;
  restaurantName: string;
  packageName: string;
  mealsRemaining: number;
  totalMeals: number;
  expiryDate: string;
  value: string;
}

export default function UserDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [, setLocation] = useLocation();

  // Check URL parameters to auto-select tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['overview', 'orders', 'vouchers', 'points', 'profile'].includes(tabParam)) {
      setSelectedTab(tabParam);
    }
  }, []);

  // Use authenticated user's ID
  const customerId = user?.id;

  const { data: userStats } = useQuery<UserStats>({
    queryKey: [`/api/customers/${customerId}/stats`],
    enabled: !!customerId,
  });

  const { data: recentOrders } = useQuery<RecentOrder[]>({
    queryKey: [`/api/customers/${customerId}/orders/recent`],
    enabled: !!customerId,
  });

  const { data: allVouchers } = useQuery<any[]>({
    queryKey: [`/api/customers/${customerId}/vouchers`],
    enabled: !!customerId,
  });

  // Filter active vouchers from all vouchers
  const activeVouchers = allVouchers?.filter(v => v.status === 'active') || [];

  // QR Code functionality
  const handleViewQrCode = (voucher: any) => {
    setSelectedVoucher(voucher);
    setIsQrModalOpen(true);
    setIsLoadingQr(true);
    setQrCodeImage('');
    
    fetch(`/api/vouchers/${voucher.id}/qr-code`)
      .then(res => res.json())
      .then(data => {
        if (data.qrCodeImage) {
          setQrCodeImage(data.qrCodeImage);
        }
      })
      .catch(error => {
        console.error('Error fetching QR code:', error);
      })
      .finally(() => {
        setIsLoadingQr(false);
      });
  };

  const { data: pointsData } = useQuery({
    queryKey: [`/api/customers/${customerId}/points`],
    enabled: !!customerId,
  });

  // Add dietary profile query
  const { data: dietaryProfile } = useQuery<any>({
    queryKey: ["/api/dietary/profile"],
    enabled: !!user?.id,
  });

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'bronze': return 'bg-orange-100 text-orange-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'platinum': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'delivering': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Welcome Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t.welcomeBack}, {user?.name || 'Valued Customer'}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Manage your orders, vouchers, and loyalty points in one place
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={getTierColor(userStats?.membershipTier || 'bronze')}>
{(userStats?.membershipTier?.toUpperCase() || 'BRONZE')} {t.member || 'MEMBER'}
              </Badge>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-300">{t.points}</p>
                <p className="text-2xl font-bold text-primary">{user?.loyaltyPoints || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.totalOrders}</CardTitle>
              <ShoppingBag className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground">{t.totalOrders}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.totalSpent}</CardTitle>
              <CreditCard className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{userStats?.totalSpent?.toFixed(2) || '0.00'}</div>
              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                <div className="flex justify-between">
                  <span>{t.vouchers}:</span>
                  <span>€{userStats?.voucherValue?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.orders}:</span>
                  <span>€{userStats?.orderValue?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between font-medium text-green-600">
                  <span>{t.remainingValue || 'Remaining'}:</span>
                  <span>€{userStats?.remainingValue?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.activeVouchers}</CardTitle>
              <Award className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeVouchers?.length || 0}</div>
              <p className="text-xs text-muted-foreground">{t.activeVouchers}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.pointsBalance}</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user?.loyaltyPoints || 0}</div>
              <p className="text-xs text-muted-foreground">
                {t.worth || 'Worth'} €{((user?.loyaltyPoints || 0) / 100).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-5 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg h-14">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-200 font-medium text-sm h-12 rounded-md flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Home className="h-4 w-4" />
              {t.overview}
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-200 font-medium text-sm h-12 rounded-md flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <ShoppingBag className="h-4 w-4" />
              {t.orders}
            </TabsTrigger>
            <TabsTrigger 
              value="vouchers" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-200 font-medium text-sm h-12 rounded-md flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Ticket className="h-4 w-4" />
              {t.vouchers}
            </TabsTrigger>
            <TabsTrigger 
              value="points" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-200 font-medium text-sm h-12 rounded-md flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Star className="h-4 w-4" />
              {t.points}
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-200 font-medium text-sm h-12 rounded-md flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <User className="h-4 w-4" />
              {t.profile}
            </TabsTrigger>
          </TabsList>


          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{t.quickActions}</CardTitle>
                <CardDescription>{t.fastAccessFeatures}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="w-full h-16 flex flex-col space-y-2"
                    onClick={() => setSelectedTab('vouchers')}
                  >
                    <Award className="h-5 w-5" />
                    <span className="text-sm">{t.myVouchers}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-16 flex flex-col space-y-2"
                    onClick={() => setSelectedTab('points')}
                  >
                    <Star className="h-5 w-5" />
                    <span className="text-sm">{t.pointsRewards}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-16 flex flex-col space-y-2"
                    onClick={() => setLocation('/dietary-recommendations')}
                  >
                    <Brain className="h-5 w-5 text-primary" />
                    <span className="text-sm">{t.aiRecommendations}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-16 flex flex-col space-y-2"
                    onClick={() => setSelectedTab('profile')}
                  >
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-sm">{t.accountSettings}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>{t.recentOrders}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentOrders?.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">{order.restaurantName}</p>
                          <p className="text-sm text-muted-foreground">#{order.orderNumber}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <p className="text-sm font-medium mt-1">€{order.totalAmount}</p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-center text-muted-foreground py-4">
                        {t.noRecentOrdersMessage}
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4"
                    onClick={() => setSelectedTab('orders')}
                  >
                    {t.viewAllOrders}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5" />
                    <span>{t.activeVouchers}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeVouchers?.slice(0, 3).map((voucher) => (
                      <div key={voucher.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">{voucher.restaurantName}</p>
                          <p className="text-sm text-muted-foreground">{voucher.packageName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{voucher.mealsRemaining}/{voucher.totalMeals} {t.meals || 'meals'}</p>
                          <p className="text-xs text-muted-foreground">€{voucher.value}</p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-center text-muted-foreground py-4">
                        {t.noActiveVouchersMessage}
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4"
                    onClick={() => setSelectedTab('vouchers')}
                  >
                    {t.viewAllVouchers}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.orderHistory || 'Order History'}</CardTitle>
                <CardDescription>{t.trackOrdersDescription || 'Track your recent and past orders'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders?.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <ShoppingBag className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{order.restaurantName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {t.orderNumber || 'Order'} #{order.orderNumber} • {order.items} {t.items || 'items'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <p className="font-medium">€{order.totalAmount}</p>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">{t.noOrdersYet || 'No orders yet'}</p>
                      <Link href="/">
                        <Button className="mt-4">{t.startOrdering || 'Start Ordering'}</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vouchers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.voucherPortfolio || 'Voucher Portfolio'}</CardTitle>
                <CardDescription>{t.manageUseVouchers || 'Manage and use your restaurant vouchers'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeVouchers?.map((voucher) => {
                    const mealsRemaining = voucher.totalMeals - voucher.usedMeals;
                    return (
                      <div key={voucher.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{voucher.restaurant?.name}</h4>
                            <p className="text-sm text-muted-foreground">{voucher.package?.name}</p>
                          </div>
                          <Badge variant="secondary">€{voucher.purchasePrice}</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{t.mealsRemaining || 'Meals Remaining'}:</span>
                            <span className="font-medium">{mealsRemaining}/{voucher.totalMeals}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary rounded-full h-2"
                              style={{ 
                                width: `${(mealsRemaining / voucher.totalMeals) * 100}%` 
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{t.expires || 'Expires'}: {new Date(voucher.expiryDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleViewQrCode(voucher)}
                          >
{t.viewQrCode || 'View QR Code'}
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedVoucher(voucher);
                              setIsReservationModalOpen(true);
                            }}
                          >
{t.makeReservation || 'Make Reservation'}
                          </Button>
                        </div>
                      </div>
                    );
                  }) || (
                    <div className="col-span-2 text-center py-8">
                      <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">{t.noVouchersYet || 'No vouchers yet'}</p>
                      <Link href="/">
                        <Button className="mt-4">{t.browseVoucherPackages || 'Browse Voucher Packages'}</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="points" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.pointsRewardsSummary || 'Points & Rewards Summary'}</CardTitle>
                <CardDescription>{t.trackLoyaltyPoints || 'Track your loyalty points and membership benefits'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                    <Star className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {user?.loyaltyPoints || 0}
                    </p>
                    <p className="text-sm text-blue-600">{t.availablePoints || 'Available Points'}</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {user?.totalPointsEarned || 0}
                    </p>
                    <p className="text-sm text-green-600">{t.totalEarned || 'Total Earned'}</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                    <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {user?.membershipTier?.toUpperCase() || 'BRONZE'}
                    </p>
                    <p className="text-sm text-purple-600">{t.membershipTier || 'Membership Tier'}</p>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <Button onClick={() => setSelectedTab('points')}>
                    {t.managePointsRewards || 'Manage Points & Rewards'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            {/* Basic Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t.profileInformation || 'Profile Information'}</CardTitle>
                <CardDescription>{t.accountDetailsStatus || 'Your account details and membership status'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                    <User className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                      {user?.name || t.notSet || 'Not set'}
                    </p>
                    <p className="text-sm text-blue-600">{t.fullName || 'Full Name'}</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                    <Mail className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-lg font-bold text-green-900 dark:text-green-100">
                      {user?.email || t.notSet || 'Not set'}
                    </p>
                    <p className="text-sm text-green-600">{t.emailAddress || 'Email Address'}</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                    <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                      {user?.membershipTier?.toUpperCase() || 'BRONZE'}
                    </p>
                    <p className="text-sm text-purple-600">{t.membershipTier || 'Membership Tier'}</p>
                  </div>
                </div>
                
                {/* QR Code for Loyalty */}
                <div className="mt-6 pt-6 border-t">
                  <div className="flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-6 rounded-lg">
                    <div className="flex-shrink-0">
                      <div 
                        className="bg-white p-3 rounded-lg shadow-md"
                        dangerouslySetInnerHTML={{
                          __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
                            <rect width="100" height="100" fill="white"/>
                            <rect x="10" y="10" width="25" height="25" fill="black"/>
                            <rect x="65" y="10" width="25" height="25" fill="black"/>
                            <rect x="10" y="65" width="25" height="25" fill="black"/>
                            <rect x="15" y="15" width="15" height="15" fill="white"/>
                            <rect x="70" y="15" width="15" height="15" fill="white"/>
                            <rect x="15" y="70" width="15" height="15" fill="white"/>
                            <rect x="18" y="18" width="9" height="9" fill="black"/>
                            <rect x="73" y="18" width="9" height="9" fill="black"/>
                            <rect x="18" y="73" width="9" height="9" fill="black"/>
                            <rect x="40" y="10" width="5" height="5" fill="black"/>
                            <rect x="50" y="10" width="5" height="5" fill="black"/>
                            <rect x="40" y="20" width="5" height="5" fill="black"/>
                            <rect x="45" y="25" width="5" height="5" fill="black"/>
                            <rect x="40" y="40" width="20" height="20" fill="black"/>
                            <rect x="45" y="45" width="10" height="10" fill="white"/>
                            <rect x="48" y="48" width="4" height="4" fill="black"/>
                          </svg>`
                        }}
                      />
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2">Codul tău de fidelitate</h4>
                      <p className="text-3xl font-bold text-primary tracking-widest mb-2">{user?.customerCode || 'CLI-DEMO01'}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Arată acest cod la restaurant pentru plăți și reduceri de fidelitate
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dietary Profile & AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-primary" />
{t.dietaryProfileAI || 'Dietary Profile & AI Recommendations'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <User className="h-4 w-4 mr-2" />
{t.basicInformation || 'Basic Information'}
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">{t.age || 'Age'}:</span>
                        <p className="font-medium">
                          {dietaryProfile?.age ? `${dietaryProfile.age} ${t.years || 'years'}` : t.notSet || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">{t.gender || 'Gender'}:</span>
                        <p className="font-medium capitalize">
                          {dietaryProfile?.gender || t.notSet || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">{t.height || 'Height'}:</span>
                        <p className="font-medium">
                          {dietaryProfile?.height ? `${dietaryProfile.height} cm` : t.notSet || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">{t.weight || 'Weight'}:</span>
                        <p className="font-medium">
                          {dietaryProfile?.weight ? `${dietaryProfile.weight} kg` : t.notSet || 'Not set'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Health Information */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Target className="h-4 w-4 mr-2" />
{t.healthInformation || 'Health Information'}
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">{t.healthGoal || 'Health Goal'}:</span>
                        <p className="font-medium">{dietaryProfile?.healthGoal || t.notSet || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">{t.activityLevel || 'Activity Level'}:</span>
                        <p className="font-medium">{dietaryProfile?.activityLevel || t.notSet || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">{t.calorieTarget || 'Calorie Target'}:</span>
                        <p className="font-medium">{dietaryProfile?.calorieTarget || t.notSet || 'Not set'} kcal/day</p>
                      </div>
                    </div>
                  </div>

                  {/* Dietary Restrictions */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
{t.dietaryRestrictions || 'Dietary Restrictions'}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600 block mb-2">{t.allergies || 'Allergies'}:</span>
                        <div className="flex flex-wrap gap-2">
                          {dietaryProfile?.allergies?.length > 0 ? (
                            dietaryProfile.allergies.map((allergy: string, index: number) => (
                              <Badge key={index} variant="destructive" className="text-xs">
                                {allergy}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">{t.noneSpecified || 'None specified'}</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-600 block mb-2">{t.foodIntolerances || 'Food Intolerances'}:</span>
                        <div className="flex flex-wrap gap-2">
                          {dietaryProfile?.foodIntolerances?.length > 0 ? (
                            dietaryProfile.foodIntolerances.map((intolerance: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {intolerance}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">{t.noneSpecified || 'None specified'}</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-sm text-gray-600 block mb-2">{t.dietaryPreferences || 'Dietary Preferences'}:</span>
                        <div className="flex flex-wrap gap-2">
                          {dietaryProfile?.dietaryPreferences?.length > 0 ? (
                            dietaryProfile.dietaryPreferences.map((preference: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {preference}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">{t.noneSpecified || 'None specified'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-6 border-t flex gap-4">
                  <Button 
                    onClick={() => setLocation("/dietary-recommendations")}
                    className="flex items-center"
                  >
                    <ChefHat className="h-4 w-4 mr-2" />
                    {t.manageDietaryProfile || 'Manage Dietary Profile'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setLocation("/dietary-recommendations")}
                  >
                    View AI Recommendations
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reservation Modal */}
      {selectedVoucher && (
        <ReservationModal
          open={isReservationModalOpen}
          onOpenChange={(open) => {
            setIsReservationModalOpen(open);
            if (!open) {
              setSelectedVoucher(null);
            }
          }}
          restaurant={selectedVoucher.restaurant}
          voucherPackage={selectedVoucher.package}
        />
      )}

      {/* QR Code Modal */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          style={{ 
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10000,
            maxWidth: '32rem',
            width: 'calc(100% - 2rem)',
            maxHeight: '90vh',
            overflow: 'auto'
          }}
        >
          <DialogHeader>
            <DialogTitle>Voucher QR Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* QR Code Section */}
            <div className="text-center">
              <div className="w-48 h-48 bg-gray-100 mx-auto rounded-lg flex items-center justify-center mb-4">
                {isLoadingQr ? (
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Loading QR Code...</p>
                  </div>
                ) : qrCodeImage ? (
                  <div className="text-center">
                    <img 
                      src={qrCodeImage} 
                      alt="Voucher QR Code" 
                      className="w-40 h-40 object-contain"
                    />
                    <p className="text-xs text-green-600 mt-2">QR Code Ready</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gray-300 mx-auto mb-2 rounded"></div>
                    <p className="text-xs text-gray-500">QR Code Unavailable</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Show this QR code to the restaurant staff when dining
              </p>
            </div>

            {/* Voucher Info */}
            {selectedVoucher && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Restaurant:</span>
                  <div className="font-medium">{selectedVoucher.restaurant?.name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Package:</span>
                  <div className="font-medium">{selectedVoucher.package?.name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Meals Remaining:</span>
                  <div className="font-medium">{selectedVoucher.totalMeals - selectedVoucher.usedMeals}</div>
                </div>
                <div>
                  <span className="text-gray-600">Expires:</span>
                  <div className="font-medium">{new Date(selectedVoucher.expiryDate).toLocaleDateString()}</div>
                </div>
              </div>
            )}

            {/* Terms */}
            <div className="text-xs text-gray-500 border-t pt-4">
              <p>• Present this QR code before ordering</p>
              <p>• One meal per visit</p>
              <p>• Cannot be combined with other offers</p>
              <p>• Valid for dine-in only</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}