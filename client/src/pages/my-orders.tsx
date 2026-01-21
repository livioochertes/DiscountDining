import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ShoppingBag, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  MapPin,
  Phone,
  Calendar,
  Star,
  RotateCcw
} from "lucide-react";
import { SectionNavigation } from "@/components/SectionNavigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface Order {
  id: number;
  orderNumber: string;
  restaurantId: number;
  restaurantName: string;
  restaurantPhone: string;
  status: string;
  orderType: string;
  totalAmount: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress?: string;
  orderDate: string;
  estimatedDeliveryTime?: string;
  completedAt?: string;
  paymentMethod: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  specialRequests?: string;
}

export default function MyOrders() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Mock customer ID - would come from authentication
  const customerId = 1;

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: [`/api/customers/${customerId}/orders`],
    enabled: !!customerId,
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'delivering': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'preparing': return <Clock className="h-4 w-4" />;
      case 'delivering': return <Package className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = order.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter;
    const matchesType = orderTypeFilter === "all" || order.orderType.toLowerCase() === orderTypeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const reorderItems = async (orderId: number) => {
    // Implementation for reordering
    console.log("Reordering items from order:", orderId);
  };

  const trackOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SectionNavigation currentSection="users" />
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-64 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SectionNavigation currentSection="users" />
      
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.myOrders || 'My Orders'}</h1>
            <p className="text-gray-600 dark:text-gray-300">{t.trackOrderHistoryDescription || 'Track and manage your order history'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-300">{t.totalOrders}</p>
            <p className="text-2xl font-bold text-primary">{orders?.length || 0}</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>{t.filterOrders || 'Filter Orders'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t.searchByRestaurantOrder || "Search by restaurant or order number"}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t.orderStatus || "Order Status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allStatuses || 'All Statuses'}</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="delivering">Delivering</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t.orderType || "Order Type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allTypes || 'All Types'}</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="dine-in">Dine In</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setOrderTypeFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{order.restaurantName}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Order #{order.orderNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">€{order.totalAmount}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span className="capitalize">{order.orderType}</span>
                          </div>
                          {order.deliveryAddress && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate max-w-xs">{order.deliveryAddress}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge className={getStatusColor(order.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(order.status)}
                                <span className="capitalize">{order.status}</span>
                              </div>
                            </Badge>
                            {order.estimatedDeliveryTime && order.status !== 'completed' && (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Est. delivery: {new Date(order.estimatedDeliveryTime).toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => trackOrder(order)}
                            >
                              View Details
                            </Button>
                            {order.status === 'completed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => reorderItems(order.id)}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Reorder
                              </Button>
                            )}
                            {order.status === 'completed' && (
                              <Button
                                variant="outline"
                                size="sm"
                              >
                                <Star className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <div className="pt-3 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {order.items.slice(0, 4).map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                  {item.quantity}x {item.menuItemName}
                                </span>
                                <span className="font-medium">€{item.totalPrice}</span>
                              </div>
                            ))}
                            {order.items.length > 4 && (
                              <div className="text-sm text-gray-500 italic">
                                +{order.items.length - 4} more items
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No orders found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchTerm || statusFilter !== "all" || orderTypeFilter !== "all" 
                    ? "Try adjusting your filters to see more results."
                    : "You haven't placed any orders yet. Start exploring restaurants!"
                  }
                </p>
                <Button onClick={() => window.location.href = "/"}>
                  Browse Restaurants
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Details Modal/Panel would go here */}
        {selectedOrder && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Order Details - #{selectedOrder.orderNumber}</CardTitle>
              <CardDescription>{selectedOrder.restaurantName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Order Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {selectedOrder.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Order Type:</span>
                      <span className="capitalize">{selectedOrder.orderType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Order Date:</span>
                      <span>{new Date(selectedOrder.orderDate).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                      <span className="font-medium">€{selectedOrder.totalAmount}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Restaurant Contact</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedOrder.restaurantPhone}</span>
                    </div>
                    {selectedOrder.deliveryAddress && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span>{selectedOrder.deliveryAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-3">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">{item.menuItemName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Quantity: {item.quantity}</p>
                        {item.specialRequests && (
                          <p className="text-sm text-gray-500 italic">Note: {item.specialRequests}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">€{item.totalPrice}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">€{item.unitPrice} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Close Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}