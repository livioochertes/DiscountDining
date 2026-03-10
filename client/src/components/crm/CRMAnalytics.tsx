import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, TrendingUp, BarChart3, Activity, Trophy, Send,
  ArrowUpRight, ArrowDownRight, Percent, DollarSign
} from "lucide-react";

interface CRMAnalyticsProps {
  restaurantId: number;
}

export default function CRMAnalytics({ restaurantId }: CRMAnalyticsProps) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/crm/analytics", restaurantId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/crm/analytics/${restaurantId}`);
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const {
    totalCustomers = 0,
    newThisMonth = 0,
    activeCustomers = 0,
    inactiveCustomers = 0,
    avgClv = 0,
    retentionRate = 0,
    retentionRates = { days30: 0, days60: 0, days90: 0 },
    clvDistribution = [],
    segmentDistribution = [],
    revenueBySegment = [],
    visitFrequency = [],
    topCustomers = [],
    revenueByMonth = [],
    campaignPerformance = [],
  } = analytics;

  const maxClvCount = Math.max(1, ...clvDistribution.map((d: any) => d.count));
  const maxRevenue = Math.max(1, ...revenueByMonth.map((d: any) => d.revenue));
  const maxSegRevenue = Math.max(1, ...revenueBySegment.map((d: any) => d.revenue));
  const maxVisitFreq = Math.max(1, ...visitFrequency.map((d: any) => d.avgVisits));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reporting</h2>
          <p className="text-gray-600">Insights into customer behavior, retention, and revenue</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={totalCustomers}
          subtitle={`${newThisMonth} new this month`}
          icon={Users}
          trend={newThisMonth > 0 ? "up" : "neutral"}
        />
        <StatCard
          title="Avg. CLV"
          value={`€${avgClv.toFixed(2)}`}
          subtitle="Customer lifetime value"
          icon={DollarSign}
          trend="neutral"
        />
        <StatCard
          title="Retention Rate"
          value={`${retentionRate}%`}
          subtitle={`${activeCustomers} active / ${inactiveCustomers} inactive`}
          icon={Percent}
          trend={retentionRate >= 50 ? "up" : "down"}
        />
        <StatCard
          title="Active Customers"
          value={activeCustomers}
          subtitle="Ordered in last 30 days"
          icon={Activity}
          trend={activeCustomers > inactiveCustomers ? "up" : "down"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">30-Day Retention</span>
            </div>
            <p className="text-3xl font-bold text-green-800">{retentionRates.days30}%</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">60-Day Retention</span>
            </div>
            <p className="text-3xl font-bold text-blue-800">{retentionRates.days60}%</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">90-Day Retention</span>
            </div>
            <p className="text-3xl font-bold text-purple-800">{retentionRates.days90}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-500" />
              CLV Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clvDistribution.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No data available</p>
            ) : (
              <div className="space-y-2">
                {clvDistribution.map((bucket: any) => (
                  <div key={bucket.range} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-16 text-right shrink-0">{bucket.range}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-400 to-orange-600 h-full rounded-full flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${Math.max(bucket.count > 0 ? 8 : 0, (bucket.count / maxClvCount) * 100)}%` }}
                      >
                        {bucket.count > 0 && (
                          <span className="text-[10px] font-bold text-white">{bucket.count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Revenue Trend (6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByMonth.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No data available</p>
            ) : (
              <div className="space-y-3">
                {revenueByMonth.map((m: any) => (
                  <div key={m.month} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-20 shrink-0">{m.month}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${Math.max(m.revenue > 0 ? 8 : 0, (m.revenue / maxRevenue) * 100)}%` }}
                      >
                        {m.revenue > 0 && (
                          <span className="text-[10px] font-bold text-white">€{m.revenue.toFixed(0)}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 w-14 shrink-0 text-right">{m.orders} orders</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" />
              Revenue by Segment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueBySegment.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No segments created yet</p>
            ) : (
              <div className="space-y-3">
                {revenueBySegment.map((seg: any) => {
                  const colorMap: Record<string, string> = {
                    new: "from-green-400 to-green-600",
                    loyal: "from-blue-400 to-blue-600",
                    inactive: "from-red-400 to-red-600",
                    vip: "from-purple-400 to-purple-600",
                    corporate: "from-indigo-400 to-indigo-600",
                    custom: "from-gray-400 to-gray-600",
                  };
                  const badgeColorMap: Record<string, string> = {
                    new: "bg-green-100 text-green-700",
                    loyal: "bg-blue-100 text-blue-700",
                    inactive: "bg-red-100 text-red-700",
                    vip: "bg-purple-100 text-purple-700",
                    corporate: "bg-indigo-100 text-indigo-700",
                    custom: "bg-gray-100 text-gray-700",
                  };
                  const gradient = colorMap[seg.segmentType] || colorMap.custom;
                  const badgeClass = badgeColorMap[seg.segmentType] || badgeColorMap.custom;

                  return (
                    <div key={seg.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={badgeClass}>{seg.segmentType}</Badge>
                          <span className="text-sm font-medium">{seg.name}</span>
                        </div>
                        <span className="text-sm font-semibold">€{seg.revenue.toFixed(2)}</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`bg-gradient-to-r ${gradient} h-full rounded-full transition-all`}
                          style={{ width: `${Math.max(seg.revenue > 0 ? 5 : 0, (seg.revenue / maxSegRevenue) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              Avg. Visit Frequency (per customer/month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visitFrequency.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No data available</p>
            ) : (
              <div className="space-y-3">
                {visitFrequency.map((v: any) => (
                  <div key={v.month} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-20 shrink-0">{v.month}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-amber-600 h-full rounded-full flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${Math.max(v.avgVisits > 0 ? 8 : 0, (v.avgVisits / maxVisitFreq) * 100)}%` }}
                      >
                        {v.avgVisits > 0 && (
                          <span className="text-[10px] font-bold text-white">{v.avgVisits}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Top 10 Customers by Spending
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topCustomers.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No customer data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4 w-8">#</th>
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4 text-right">Orders</th>
                    <th className="py-2 text-right">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((c: any, index: number) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                          index === 0 ? "bg-yellow-100 text-yellow-700" :
                          index === 1 ? "bg-gray-200 text-gray-700" :
                          index === 2 ? "bg-amber-100 text-amber-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium">
                          {c.name || c.email || "Unknown"}
                        </p>
                        {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                      </td>
                      <td className="py-3 pr-4 text-right text-gray-600">{c.orderCount}</td>
                      <td className="py-3 text-right font-semibold">€{c.totalSpent.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {campaignPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-500" />
              Campaign Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4">Campaign</th>
                    <th className="py-2 pr-4">Channel</th>
                    <th className="py-2 pr-4 text-right">Sent</th>
                    <th className="py-2 pr-4 text-right">Opened</th>
                    <th className="py-2 text-right">Open Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignPerformance.map((c: any) => (
                    <tr key={c.name} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium">{c.name}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className="text-xs">
                          {c.channel}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-right">{c.sent}</td>
                      <td className="py-3 pr-4 text-right">{c.opened}</td>
                      <td className="py-3 text-right">
                        <span className={`font-semibold ${c.openRate >= 30 ? "text-green-600" : c.openRate >= 15 ? "text-amber-600" : "text-red-600"}`}>
                          {c.openRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  trend: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend === "up" && <ArrowUpRight className="w-4 h-4 text-green-500" />}
          {trend === "down" && <ArrowDownRight className="w-4 h-4 text-red-500" />}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
