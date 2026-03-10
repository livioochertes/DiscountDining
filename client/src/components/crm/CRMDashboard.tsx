import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, Activity, TrendingUp, Clock, CalendarDays, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CRMDashboardProps {
  restaurantId: number;
  subscription: any;
}

export default function CRMDashboard({ restaurantId, subscription }: CRMDashboardProps) {
  const plan = subscription?.plan || "free";
  const limits = subscription?.limits || { maxCustomers: 50, maxCampaigns: 0, maxSegments: 0 };

  const { data: customers, isLoading: loadingCustomers } = useQuery({
    queryKey: ["/api/crm/customers", restaurantId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/crm/customers/${restaurantId}?limit=5&sort=totalSpent&order=desc`);
      return response.json();
    },
  });

  const { data: segments = [], isLoading: loadingSegments } = useQuery({
    queryKey: ["/api/crm/segments", restaurantId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/crm/segments/${restaurantId}`);
      return response.json();
    },
  });

  const totalCustomers = customers?.total || 0;
  const topCustomers = customers?.customers || [];

  const now = new Date();
  const renewalDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : "N/A";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CRM Dashboard</h2>
          <p className="text-gray-600">Customer relationship management overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
            <Crown className="w-3 h-3 mr-1" />
            {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Customers"
          value={loadingCustomers ? null : totalCustomers}
          icon={Users}
          subtitle={`Limit: ${limits.maxCustomers === 999999 ? "Unlimited" : limits.maxCustomers}`}
          loading={loadingCustomers}
        />
        <KPICard
          title="Segments"
          value={loadingSegments ? null : segments.length}
          icon={Activity}
          subtitle={`Max: ${limits.maxSegments === 999999 ? "Unlimited" : limits.maxSegments}`}
          loading={loadingSegments}
        />
        <KPICard
          title="Plan"
          value={plan.charAt(0).toUpperCase() + plan.slice(1)}
          icon={Crown}
          subtitle={subscription?.cancelAtPeriodEnd ? "Cancels at period end" : "Active"}
          loading={false}
        />
        <KPICard
          title="Renewal"
          value={renewalDate}
          icon={CalendarDays}
          subtitle={subscription?.status === "active" ? "Auto-renews" : ""}
          loading={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              Top Customers by Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCustomers ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : topCustomers.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                No customer data yet. Customers will appear here after enrolling.
              </p>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((c: any, index: number) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">
                          {c.name || c.email || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">{c.orderCount || 0} orders</p>
                      </div>
                    </div>
                    <span className="font-semibold text-sm">
                      €{(c.totalSpent || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Customer Segments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSegments ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : segments.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                No segments yet. Go to the Segments tab to auto-generate or create custom segments.
              </p>
            ) : (
              <div className="space-y-2">
                {segments.map((seg: any) => {
                  const colorMap: Record<string, string> = {
                    new: "bg-green-100 text-green-700",
                    loyal: "bg-blue-100 text-blue-700",
                    inactive: "bg-red-100 text-red-700",
                    vip: "bg-purple-100 text-purple-700",
                    corporate: "bg-indigo-100 text-indigo-700",
                    custom: "bg-gray-100 text-gray-700",
                  };
                  const badgeClass = colorMap[seg.segmentType] || colorMap.custom;

                  return (
                    <div
                      key={seg.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <Badge className={badgeClass}>{seg.segmentType}</Badge>
                        <span className="text-sm font-medium">{seg.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {seg.memberCount || 0} members
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-medium text-sm">
                  Usage: {totalCustomers} / {limits.maxCustomers === 999999 ? "∞" : limits.maxCustomers} customers
                </p>
                <p className="text-xs text-gray-600">
                  {plan !== "enterprise" && totalCustomers >= limits.maxCustomers * 0.8
                    ? "Approaching limit — consider upgrading"
                    : "Within plan limits"}
                </p>
              </div>
            </div>
            {plan !== "enterprise" && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Upgrade for more
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({
  title,
  value,
  icon: Icon,
  subtitle,
  loading,
}: {
  title: string;
  value: string | number | null;
  icon: any;
  subtitle?: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value ?? 0}</div>
        )}
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
