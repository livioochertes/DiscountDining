import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { 
  DollarSign, TrendingUp, Building2, Users, CreditCard, BarChart3, 
  Search, Filter, Mail, MessageCircle, Star, MapPin, Clock,
  CheckCircle, XCircle, AlertTriangle, Download, Plus, Edit, Ban, Loader2
} from "lucide-react";
import eatOffLogo from "@assets/EatOff_Logo_1750512988041.png";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface RestaurantData {
  id: number;
  name: string;
  owner: string;
  cuisine: string;
  location: string;
  rating: number;
  totalEarnings: number;
  monthlyTransactions: number;
  commissionRate: number;
  status: 'active' | 'suspended' | 'pending';
  joinedDate: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  ordersCount: number;
  loyaltyPoints: number;
  membershipTier: string;
  lastActive: string;
  preferredCuisines: string[];
  marketingConsent: boolean;
}

interface CommissionMetrics {
  totalEarnings: number;
  monthlyEarnings: number;
  totalTransactions: number;
  activeRestaurants: number;
  averageCommissionRate: number;
  topPerformingRestaurant: string;
}

export default function EatOffAdminDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [metrics] = useState<CommissionMetrics>({
    totalEarnings: 485679.23,
    monthlyEarnings: 67894.56,
    totalTransactions: 12847,
    activeRestaurants: 234,
    averageCommissionRate: 5.5,
    topPerformingRestaurant: "Bella Vista"
  });

  const [restaurants] = useState<RestaurantData[]>([
    {
      id: 1,
      name: "Bella Vista",
      owner: "Marco Rossi",
      cuisine: "Italian",
      location: "Downtown",
      rating: 4.8,
      totalEarnings: 45678.90,
      monthlyTransactions: 234,
      commissionRate: 5.5,
      status: 'active',
      joinedDate: "2024-03-15"
    },
    {
      id: 2,
      name: "Sakura Sushi",
      owner: "Takeshi Yamamoto",
      cuisine: "Japanese",
      location: "City Center",
      rating: 4.9,
      totalEarnings: 38429.67,
      monthlyTransactions: 189,
      commissionRate: 5.5,
      status: 'active',
      joinedDate: "2024-02-08"
    },
    {
      id: 3,
      name: "Burger Palace",
      owner: "John Smith",
      cuisine: "American",
      location: "Mall District",
      rating: 4.2,
      totalEarnings: 12567.43,
      monthlyTransactions: 67,
      commissionRate: 6.0,
      status: 'suspended',
      joinedDate: "2024-01-20"
    }
  ]);

  const [users] = useState<UserData[]>([
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+1234567890",
      totalSpent: 1234.56,
      ordersCount: 45,
      loyaltyPoints: 2890,
      membershipTier: "Gold",
      lastActive: "2025-01-01",
      preferredCuisines: ["Italian", "Asian"],
      marketingConsent: true
    },
    {
      id: 2,
      name: "Michael Chen",
      email: "m.chen@email.com",
      phone: "+1234567891",
      totalSpent: 987.34,
      ordersCount: 32,
      loyaltyPoints: 1456,
      membershipTier: "Silver",
      lastActive: "2024-12-30",
      preferredCuisines: ["Japanese", "Thai"],
      marketingConsent: false
    },
    {
      id: 3,
      name: "Emma Rodriguez",
      email: "emma.r@email.com",
      phone: "+1234567892",
      totalSpent: 2156.78,
      ordersCount: 67,
      loyaltyPoints: 4523,
      membershipTier: "Platinum",
      lastActive: "2025-01-02",
      preferredCuisines: ["Mediterranean", "Mexican"],
      marketingConsent: true
    }
  ]);

  const earningsData = [
    { month: "Jul", earnings: 45000, transactions: 1200 },
    { month: "Aug", earnings: 52000, transactions: 1350 },
    { month: "Sep", earnings: 48000, transactions: 1180 },
    { month: "Oct", earnings: 61000, transactions: 1520 },
    { month: "Nov", earnings: 58000, transactions: 1450 },
    { month: "Dec", earnings: 67000, transactions: 1680 }
  ];

  const cuisineData = [
    { name: "Italian", value: 28, color: "#8B5CF6" },
    { name: "Asian", value: 22, color: "#06B6D4" },
    { name: "American", value: 18, color: "#F59E0B" },
    { name: "Mediterranean", value: 16, color: "#10B981" },
    { name: "Mexican", value: 16, color: "#EF4444" }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: "default", icon: CheckCircle, text: "Active" },
      suspended: { variant: "destructive", icon: Ban, text: "Suspended" },
      pending: { variant: "secondary", icon: Clock, text: "Pending" }
    };
    const config = variants[status as keyof typeof variants];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant as any} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.text}</span>
      </Badge>
    );
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      Bronze: "bg-amber-100 text-amber-800",
      Silver: "bg-gray-100 text-gray-800", 
      Gold: "bg-yellow-100 text-yellow-800",
      Platinum: "bg-purple-100 text-purple-800"
    };
    return (
      <Badge className={colors[tier as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {tier}
      </Badge>
    );
  };

  const handleLogout = () => {
    setLocation('/eatoff-admin-login');
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('all');

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('eatoff_admin_token') : null;

  const { data: supportStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-support-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/support/stats', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: activeTab === 'helpdesk' && !!adminToken
  });

  const { data: supportTickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['admin-support-tickets', ticketStatusFilter, ticketPriorityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (ticketStatusFilter !== 'all') params.append('status', ticketStatusFilter);
      if (ticketPriorityFilter !== 'all') params.append('priority', ticketPriorityFilter);
      const response = await fetch(`/api/admin/support/tickets?${params}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (!response.ok) throw new Error('Failed to fetch tickets');
      return response.json();
    },
    enabled: activeTab === 'helpdesk' && !!adminToken
  });

  const { data: knowledgeArticles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['admin-knowledge-base'],
    queryFn: async () => {
      const response = await fetch('/api/admin/knowledge-base', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (!response.ok) throw new Error('Failed to fetch articles');
      return response.json();
    },
    enabled: activeTab === 'helpdesk' && !!adminToken
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src={eatOffLogo} 
              alt="EatOff Logo" 
              className="h-8 w-auto object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">EatOff Admin Portal</h1>
              <p className="text-sm text-gray-500">Platform Management & Analytics</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              System Healthy
            </Badge>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="helpdesk">Helpdesk</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Platform Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€{metrics.totalEarnings.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+14.8% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€{metrics.monthlyEarnings.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+12.3% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Restaurants</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.activeRestaurants}</div>
                  <p className="text-xs text-muted-foreground">+8 new this month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalTransactions.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+18.4% from last month</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={earningsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`€${value}`, 'Revenue']} />
                      <Line type="monotone" dataKey="earnings" stroke="#F97316" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Restaurant Distribution by Cuisine</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={cuisineData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {cuisineData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Restaurants']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Commission Tab */}
          <TabsContent value="commissions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Commission Management</h2>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>

            {/* Commission moved from separate dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Commission Rate Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Default Rate:</span>
                    <Badge>5.5%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Premium Partners:</span>
                    <Badge variant="secondary">4.5%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>New Restaurants:</span>
                    <Badge variant="outline">6.0%</Badge>
                  </div>
                  <Button size="sm" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Modify Rates
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Commission Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">QR Payments:</span>
                      <span className="font-medium">€34,567</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Voucher Sales:</span>
                      <span className="font-medium">€21,890</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Menu Orders:</span>
                      <span className="font-medium">€11,437</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>€67,894</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payout Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending Payouts:</span>
                    <Badge variant="secondary">€156,789</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Next Payout Date:</span>
                    <span className="text-sm font-medium">Jan 15, 2025</span>
                  </div>
                  <Button size="sm" className="w-full">
                    Process Payouts
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Restaurant Management</h2>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search restaurants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Restaurant
                </Button>
              </div>
            </div>

            {/* Enrollment Applications Card */}
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-orange-600" />
                    Pending Restaurant Applications
                  </span>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    3 New
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 bg-white rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">Test Restaurant</h4>
                        <Badge variant="outline" className="text-xs">Italian</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">John Doe • New York</p>
                      <p className="text-xs text-gray-500 mb-3">Submitted 2 hours ago</p>
                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">Bella Vista Pizzeria</h4>
                        <Badge variant="outline" className="text-xs">Italian</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Maria Rossi • Brooklyn</p>
                      <p className="text-xs text-gray-500 mb-3">Submitted 1 day ago</p>
                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">Tokyo Sushi Bar</h4>
                        <Badge variant="outline" className="text-xs">Japanese</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Kenji Tanaka • Manhattan</p>
                      <p className="text-xs text-gray-500 mb-3">Submitted 3 days ago</p>
                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full">
                      View All Applications (12 Total)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Restaurant</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Cuisine</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Monthly Revenue</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRestaurants.map((restaurant) => (
                      <TableRow key={restaurant.id}>
                        <TableCell>
                          <div className="font-medium">{restaurant.name}</div>
                          <div className="text-sm text-gray-500">Since {restaurant.joinedDate}</div>
                        </TableCell>
                        <TableCell>{restaurant.owner}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{restaurant.cuisine}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                            {restaurant.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                            {restaurant.rating}
                          </div>
                        </TableCell>
                        <TableCell>€{restaurant.totalEarnings.toLocaleString()}</TableCell>
                        <TableCell>{restaurant.commissionRate}%</TableCell>
                        <TableCell>{getStatusBadge(restaurant.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Management</h2>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="bronze">Bronze</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export Users
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Spending</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Loyalty Points</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Preferences</TableHead>
                      <TableHead>Marketing</TableHead>
                      <TableHead>Last Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-500">ID: {user.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{user.email}</div>
                            <div className="text-sm text-gray-500">{user.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>€{user.totalSpent.toLocaleString()}</TableCell>
                        <TableCell>{user.ordersCount}</TableCell>
                        <TableCell>{user.loyaltyPoints.toLocaleString()}</TableCell>
                        <TableCell>{getTierBadge(user.membershipTier)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.preferredCuisines.map((cuisine, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {cuisine}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.marketingConsent ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Opted In
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Opted Out
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{user.lastActive}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketing Tab */}
          <TabsContent value="marketing" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Marketing Campaigns</h2>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Target Audience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">User Segments</Label>
                    <Select defaultValue="high-spenders">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high-spenders">High Spenders (€500+)</SelectItem>
                        <SelectItem value="frequent-users">Frequent Users (20+ orders)</SelectItem>
                        <SelectItem value="platinum-tier">Platinum Members</SelectItem>
                        <SelectItem value="inactive-users">Inactive Users (30+ days)</SelectItem>
                        <SelectItem value="new-users">New Users (30 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Cuisine Preferences</Label>
                    <Select defaultValue="italian">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cuisines</SelectItem>
                        <SelectItem value="italian">Italian Food Lovers</SelectItem>
                        <SelectItem value="asian">Asian Cuisine Fans</SelectItem>
                        <SelectItem value="american">American Food</SelectItem>
                        <SelectItem value="mediterranean">Mediterranean</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pt-2">
                    <div className="text-sm text-gray-600">
                      Estimated reach: <span className="font-semibold">1,247 users</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campaign Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Campaign
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    SMS Campaign
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Voucher Promotion
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Star className="h-4 w-4 mr-2" />
                    Loyalty Bonus
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Open Rate:</span>
                      <span className="font-medium">24.3%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Click Rate:</span>
                      <span className="font-medium">8.7%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Conversion Rate:</span>
                      <span className="font-medium">3.2%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Revenue Generated:</span>
                      <span className="font-medium">€12,456</span>
                    </div>
                  </div>
                  <Button size="sm" className="w-full">
                    View Detailed Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Campaign Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Campaign Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold">Weekend Special</h4>
                    <p className="text-sm text-gray-600">20% off for Platinum members this weekend</p>
                    <Button size="sm" className="w-full">Launch Campaign</Button>
                  </div>
                  <div className="border rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold">Re-engagement</h4>
                    <p className="text-sm text-gray-600">Win back users inactive for 30+ days</p>
                    <Button size="sm" className="w-full">Launch Campaign</Button>
                  </div>
                  <div className="border rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold">New Restaurant</h4>
                    <p className="text-sm text-gray-600">Promote newly joined restaurant</p>
                    <Button size="sm" className="w-full">Launch Campaign</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Helpdesk Tab */}
          <TabsContent value="helpdesk" className="space-y-6">
            {/* Support Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{supportStats?.openTickets || 0}</div>
                      <p className="text-xs text-muted-foreground">Awaiting response</p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <Clock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{supportStats?.inProgressTickets || 0}</div>
                      <p className="text-xs text-muted-foreground">Being handled</p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{supportStats?.resolvedToday || 0}</div>
                      <p className="text-xs text-muted-foreground">Completed issues</p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Deflection Rate</CardTitle>
                  <MessageCircle className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{supportStats?.deflectionRate || 0}%</div>
                      <p className="text-xs text-muted-foreground">Resolved by AI assistant</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tickets Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Support Tickets</CardTitle>
                  <div className="flex gap-2">
                    <Select value={ticketStatusFilter} onValueChange={setTicketStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={ticketPriorityFilter} onValueChange={setTicketPriorityFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {ticketsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : supportTickets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No tickets found</p>
                    <p className="text-sm">Customer tickets will appear here when created</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket #</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supportTickets.map((ticket: any) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-mono text-sm">TKT-{ticket.id.toString().padStart(4, '0')}</TableCell>
                          <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                          <TableCell>{ticket.customer?.name || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{ticket.category || 'general'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={ticket.priority === 'urgent' ? 'destructive' : ticket.priority === 'high' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {ticket.priority || 'medium'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={ticket.status === 'resolved' ? 'default' : 'outline'}
                              className={
                                ticket.status === 'open' ? 'border-orange-500 text-orange-500' :
                                ticket.status === 'in_progress' ? 'border-blue-500 text-blue-500' :
                                'bg-green-100 text-green-700'
                              }
                            >
                              {(ticket.status || 'open').replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-500">{formatTimeAgo(ticket.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Knowledge Base Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Knowledge Base</CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Article
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {articlesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : knowledgeArticles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No articles in knowledge base</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {knowledgeArticles.map((article: any) => {
                      const helpfulRate = article.viewCount > 0 
                        ? Math.round((article.helpfulCount || 0) / article.viewCount * 100) 
                        : 0;
                      return (
                        <div key={article.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div>
                            <h4 className="font-medium">{article.title}</h4>
                            <p className="text-sm text-gray-500">
                              {article.category} • {article.viewCount || 0} views • {helpfulRate}% helpful
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}