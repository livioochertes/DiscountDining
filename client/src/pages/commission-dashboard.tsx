import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, Building2, Users, CreditCard, BarChart3, Calendar, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

interface CommissionMetrics {
  totalEarnings: number;
  monthlyEarnings: number;
  transactionCount: number;
  activeRestaurants: number;
  averageCommissionRate: number;
  topPaymentMethod: string;
}

interface TransactionData {
  id: string;
  restaurantName: string;
  customerName: string;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  paymentMethod: string;
  status: string;
  processedAt: string;
}

interface ChartData {
  date: string;
  earnings: number;
  transactions: number;
}

export default function CommissionDashboard() {
  const [metrics, setMetrics] = useState<CommissionMetrics>({
    totalEarnings: 125634.89,
    monthlyEarnings: 23456.78,
    transactionCount: 8742,
    activeRestaurants: 156,
    averageCommissionRate: 5.5,
    topPaymentMethod: "Wallet"
  });

  const [transactions] = useState<TransactionData[]>([
    {
      id: "TX-001",
      restaurantName: "Bella Vista",
      customerName: "John Smith",
      amount: 45.50,
      commissionRate: 5.5,
      commissionAmount: 2.50,
      paymentMethod: "wallet",
      status: "settled",
      processedAt: "2025-01-02T10:30:00Z"
    },
    {
      id: "TX-002", 
      restaurantName: "Sakura Sushi",
      customerName: "Maria Garcia",
      amount: 78.20,
      commissionRate: 5.5,
      commissionAmount: 4.30,
      paymentMethod: "voucher",
      status: "pending",
      processedAt: "2025-01-02T09:15:00Z"
    },
    {
      id: "TX-003",
      restaurantName: "The Golden Fork",
      customerName: "David Chen",
      amount: 32.75,
      commissionRate: 6.0,
      commissionAmount: 1.97,
      paymentMethod: "points",
      status: "settled",
      processedAt: "2025-01-02T08:45:00Z"
    }
  ]);

  const chartData: ChartData[] = [
    { date: "Jan 1", earnings: 1250, transactions: 45 },
    { date: "Jan 2", earnings: 1890, transactions: 67 },
    { date: "Jan 3", earnings: 2340, transactions: 89 },
    { date: "Jan 4", earnings: 1670, transactions: 52 },
    { date: "Jan 5", earnings: 2890, transactions: 98 },
    { date: "Jan 6", earnings: 3450, transactions: 124 },
    { date: "Jan 7", earnings: 2980, transactions: 87 }
  ];

  const paymentMethodData = [
    { name: "Wallet", value: 45, color: "#8B5CF6" },
    { name: "Voucher", value: 30, color: "#06B6D4" },
    { name: "Points", value: 25, color: "#F59E0B" }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      settled: "default",
      pending: "secondary",
      disputed: "destructive"
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Commission Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Track platform earnings and restaurant commissions
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Set Commission Rate
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">
                +12.5% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyEarnings)}</div>
              <p className="text-xs text-muted-foreground">
                +8.2% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.transactionCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +15.3% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Restaurants</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeRestaurants}</div>
              <p className="text-xs text-muted-foreground">
                +6 new this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <Tabs defaultValue="earnings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="earnings">Earnings Trend</TabsTrigger>
            <TabsTrigger value="payments">Payment Methods</TabsTrigger>
            <TabsTrigger value="restaurants">Restaurant Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="earnings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Earnings & Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="earnings" orientation="left" />
                    <YAxis yAxisId="transactions" orientation="right" />
                    <Tooltip formatter={(value, name) => 
                      name === 'earnings' ? [formatCurrency(value as number), 'Earnings'] : [value, 'Transactions']
                    } />
                    <Line 
                      yAxisId="earnings" 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="#8B5CF6" 
                      strokeWidth={3}
                      name="earnings"
                    />
                    <Line 
                      yAxisId="transactions" 
                      type="monotone" 
                      dataKey="transactions" 
                      stroke="#06B6D4" 
                      strokeWidth={2}
                      name="transactions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center space-x-6 mt-4">
                  {paymentMethodData.map((item) => (
                    <div key={item.name} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="restaurants" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Restaurants</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Bella Vista', earnings: 2450 },
                    { name: 'Sakura Sushi', earnings: 1890 },
                    { name: 'Golden Fork', earnings: 1650 },
                    { name: 'Pizza Palace', earnings: 1420 },
                    { name: 'Burger Barn', earnings: 1280 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), 'Commission Earned']} />
                    <Bar dataKey="earnings" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Commission Transactions</CardTitle>
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="settled">Settled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono">{transaction.id}</TableCell>
                    <TableCell>{transaction.restaurantName}</TableCell>
                    <TableCell>{transaction.customerName}</TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{formatCurrency(transaction.commissionAmount)}</div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.commissionRate}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{transaction.paymentMethod}</TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>{formatDate(transaction.processedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}