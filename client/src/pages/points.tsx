import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Award, CreditCard, ArrowRight, History, Gift, Star } from "lucide-react";
import { SectionNavigation } from "@/components/SectionNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { queryClient } from "@/lib/queryClient";

interface PointsData {
  customerId: number;
  currentPoints: number;
  totalEarned: number;
  membershipTier: string;
  transactions: PointsTransaction[];
}

interface PointsTransaction {
  id: number;
  transactionType: string;
  pointsAmount: number;
  description: string;
  createdAt: string;
  restaurantId?: number;
}

interface PointsRedemption {
  id: number;
  pointsUsed: number;
  cashValue: number;
  redemptionDate: string;
  restaurantId: number;
}

export default function PointsPage() {
  const { t } = useLanguage();
  const [pointsToRedeem, setPointsToRedeem] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState("");

  // Mock customer ID - in real app, get from authentication
  const customerId = 1;

  const { data: pointsData, isLoading } = useQuery<PointsData>({
    queryKey: [`/api/customers/${customerId}/points`],
    enabled: !!customerId,
  });

  const { data: redemptions } = useQuery<PointsRedemption[]>({
    queryKey: [`/api/customers/${customerId}/points/redemptions`],
    enabled: !!customerId,
  });

  const { data: restaurants } = useQuery({
    queryKey: ['/api/restaurants'],
  });

  const redeemPointsMutation = useMutation({
    mutationFn: async (data: { pointsToRedeem: number; restaurantId: number }) => {
      const response = await fetch(`/api/customers/${customerId}/points/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to redeem points');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}/points`] });
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}/points/redemptions`] });
      setPointsToRedeem("");
      setSelectedRestaurant("");
    },
  });

  const handleRedeemPoints = () => {
    const points = parseInt(pointsToRedeem);
    const restaurantId = parseInt(selectedRestaurant);
    
    if (points > 0 && restaurantId) {
      redeemPointsMutation.mutate({ pointsToRedeem: points, restaurantId });
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'bronze': return 'bg-orange-100 text-orange-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'platinum': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned': return <Gift className="h-4 w-4 text-green-600" />;
      case 'redeemed': return <CreditCard className="h-4 w-4 text-red-600" />;
      case 'bonus': return <Star className="h-4 w-4 text-yellow-600" />;
      default: return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const calculateCashValue = (points: number) => {
    // Standard conversion: 100 points = €1.00
    return (points / 100).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SectionNavigation currentSection="users" />
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-300 rounded-lg"></div>
            <div className="h-64 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SectionNavigation currentSection="users" />
      
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Points Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Points</CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pointsData?.currentPoints || 0}</div>
              <p className="text-xs text-muted-foreground">
                Worth €{calculateCashValue(pointsData?.currentPoints || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pointsData?.totalEarned || 0}</div>
              <p className="text-xs text-muted-foreground">
                Lifetime points earned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membership Tier</CardTitle>
              <Badge className={getTierColor(pointsData?.membershipTier || 'bronze')}>
                {pointsData?.membershipTier?.toUpperCase() || 'BRONZE'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Enjoy exclusive benefits and higher earning rates
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Redeem Points */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Redeem Points</span>
            </CardTitle>
            <CardDescription>
              Convert your points to cash for payment at restaurants (100 points = €1.00)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Points to Redeem</label>
                <Input
                  type="number"
                  placeholder="Enter points amount"
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(e.target.value)}
                />
                {pointsToRedeem && (
                  <p className="text-xs text-muted-foreground mt-1">
                    = €{calculateCashValue(parseInt(pointsToRedeem) || 0)}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Select Restaurant</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={selectedRestaurant}
                  onChange={(e) => setSelectedRestaurant(e.target.value)}
                >
                  <option value="">Choose restaurant</option>
                  {restaurants?.slice(0, 10).map((restaurant: any) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleRedeemPoints}
                  disabled={!pointsToRedeem || !selectedRestaurant || redeemPointsMutation.isPending}
                  className="w-full"
                >
                  {redeemPointsMutation.isPending ? "Processing..." : "Redeem Points"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>Recent Transactions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pointsData?.transactions?.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.transactionType)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      transaction.transactionType === 'earned' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.transactionType === 'earned' ? '+' : '-'}{transaction.pointsAmount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      €{calculateCashValue(transaction.pointsAmount)}
                    </p>
                  </div>
                </div>
              )) || (
                <p className="text-center text-muted-foreground py-8">
                  No transactions yet. Start ordering to earn points!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Redemption History */}
        {redemptions && redemptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Redemption History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {redemptions.slice(0, 5).map((redemption) => (
                  <div key={redemption.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">Points Redeemed</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(redemption.redemptionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">-{redemption.pointsUsed} points</p>
                      <p className="text-xs text-muted-foreground">€{redemption.cashValue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}