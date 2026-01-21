import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusCircle, Store, Package, Menu, BarChart3, Settings, LogOut, Building2, Calendar, CheckCircle, XCircle, Clock, Eye, Phone, Mail, MessageSquare, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import RestaurantEnrollmentForm from "@/components/RestaurantEnrollmentForm";
import BankingInformationForm from "@/components/BankingInformationForm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function RestaurantPortal() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [reservationView, setReservationView] = useState<'list' | 'calendar'>('list');
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for demonstration - in production this would come from authenticated API
  const owner = {
    companyName: "Demo Restaurant Group",
    email: "demo@restaurant.com",
    contactPersonName: "John Doe",
    companyPhone: "+1-555-0123",
    companyAddress: "123 Restaurant Street, City, State",
    isVerified: true
  };

  const restaurants = [
    {
      id: 9,
      name: "Bella Vista",
      cuisine: "Italian",
      location: "Downtown",
      description: "Authentic Italian cuisine with a modern twist",
      address: "456 Main St",
      isApproved: true,
      isActive: true
    }
  ];

  // Fetch reservations for the restaurant
  const { data: reservations = [], isLoading: isLoadingReservations } = useQuery<any[]>({
    queryKey: ["/api/restaurant-portal/reservations"],
    enabled: activeTab === "reservations"
  });

  // Mutations for reservation management
  const confirmReservationMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      return await apiRequest("PATCH", `/api/restaurant-portal/reservations/${id}/confirm`, { restaurantNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/reservations"] });
      toast({
        title: "Reservation Confirmed",
        description: "Customer has been notified of the confirmation.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm reservation",
        variant: "destructive",
      });
    },
  });

  const rejectReservationMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      return await apiRequest("PATCH", `/api/restaurant-portal/reservations/${id}/reject`, { restaurantNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/reservations"] });
      toast({
        title: "Reservation Declined",
        description: "Customer has been notified of the cancellation.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to decline reservation",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    setLocation('/restaurant-login');
  };

  const handleViewDetails = (reservation: any) => {
    setSelectedReservation(reservation);
    setIsDetailsModalOpen(true);
  };

  const handleContactCustomer = (reservation: any) => {
    setSelectedReservation(reservation);
    setContactMessage("");
    setIsContactModalOpen(true);
  };

  const sendMessageToCustomer = () => {
    if (!contactMessage.trim() || !selectedReservation) return;
    
    // For now, just show success message - in production this would send email/SMS
    toast({
      title: "Message Sent",
      description: `Your message has been sent to ${selectedReservation.customerName}`,
    });
    
    setIsContactModalOpen(false);
    setContactMessage("");
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getReservationsForDate = (date: Date) => {
    return reservations.filter((reservation: any) => {
      const reservationDate = new Date(reservation.reservationDate);
      return reservationDate.toDateString() === date.toDateString();
    });
  };

  const formatCalendarDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleDayClick = (date: Date) => {
    console.log('Day clicked:', date.toDateString());
    console.log('Current selectedDay:', selectedDay?.toDateString());
    setSelectedDay(selectedDay?.toDateString() === date.toDateString() ? null : date);
  };

  const formatDayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const handleConfirmReservation = (reservationId: number) => {
    confirmReservationMutation.mutate({ id: reservationId, notes: "Confirmed from calendar view" });
  };

  const handleRejectReservation = (reservationId: number) => {
    rejectReservationMutation.mutate({ id: reservationId, notes: "Declined from calendar view" });
  };

  // Week view helper functions
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getWeekDays = (date: Date) => {
    const start = getWeekStart(date);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatWeekRange = (date: Date) => {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    const sameMonth = start.getMonth() === end.getMonth();
    const sameYear = start.getFullYear() === end.getFullYear();
    
    if (sameMonth && sameYear) {
      return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`;
    } else if (sameYear) {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      const days = direction === 'prev' ? -7 : 7;
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Restaurant Portal</h1>
              <p className="text-sm text-gray-600">Welcome back, {owner.companyName}</p>
            </div>
            <div className="flex items-center space-x-4">
              {!owner.isVerified && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  Pending Verification
                </Badge>
              )}
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Restaurants
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Reservations
            </TabsTrigger>
            <TabsTrigger value="enrollment" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Register New
            </TabsTrigger>
            <TabsTrigger value="packages" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Packages
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <Menu className="w-4 h-4" />
              Menu Management
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{restaurants.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {restaurants.filter(r => r.isApproved).length} approved
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Packages</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">Across all restaurants</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Account Status</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {owner.isVerified ? "Verified" : "Pending"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {owner.isVerified ? "All features available" : "Verification required"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => setActiveTab("restaurants")}>
                    <Store className="w-4 h-4 mr-2" />
                    Manage Restaurants
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("packages")}>
                    <Package className="w-4 h-4 mr-2" />
                    Create Package
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Restaurants</h2>
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Restaurant
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <Card key={restaurant.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                        <p className="text-sm text-gray-600">{restaurant.cuisine} • {restaurant.location}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge variant={restaurant.isApproved ? "default" : "secondary"}>
                          {restaurant.isApproved ? "Approved" : "Pending"}
                        </Badge>
                        <Badge variant={restaurant.isActive ? "default" : "destructive"}>
                          {restaurant.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{restaurant.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{restaurant.address}</span>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Reservation Management</h2>
              <div className="flex gap-4 items-center">
                <div className="flex gap-2">
                  <Badge variant="outline">
                    <Clock className="w-4 h-4 mr-1" />
                    {reservations.filter((r: any) => r.status === 'pending').length || 0} Pending
                  </Badge>
                  <Badge variant="default">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {reservations.filter((r: any) => r.status === 'confirmed').length || 0} Confirmed
                  </Badge>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={reservationView === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setReservationView('list')}
                    className="text-xs"
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    List View
                  </Button>
                  <Button
                    variant={reservationView === 'calendar' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setReservationView('calendar')}
                    className="text-xs"
                  >
                    <CalendarDays className="w-4 h-4 mr-1" />
                    Calendar
                  </Button>
                </div>
              </div>
            </div>

            {reservationView === 'list' && (
              <>
                {/* Pending Reservations */}
                <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Pending Reservations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingReservations ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                      <p className="text-muted-foreground">Loading reservations...</p>
                    </div>
                  ) : reservations.filter((r: any) => r.status === 'pending').length > 0 ? (
                    reservations.filter((r: any) => r.status === 'pending').map((reservation: any) => (
                      <div key={reservation.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{reservation.customerName}</h4>
                            <p className="text-sm text-muted-foreground">{reservation.customerEmail}</p>
                          </div>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <span className="font-medium">Date:</span> {new Date(reservation.reservationDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Time:</span> {new Date(reservation.reservationDate).toLocaleTimeString()}
                          </div>
                          <div>
                            <span className="font-medium">Party Size:</span> {reservation.partySize} people
                          </div>
                          <div>
                            <span className="font-medium">Phone:</span> {reservation.customerPhone || 'Not provided'}
                          </div>
                        </div>
                        {reservation.specialRequests && (
                          <div className="mb-4">
                            <p className="text-sm"><span className="font-medium">Special Requests:</span> {reservation.specialRequests}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => confirmReservationMutation.mutate({ id: reservation.id })}
                            disabled={confirmReservationMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {confirmReservationMutation.isPending ? 'Confirming...' : 'Confirm'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => rejectReservationMutation.mutate({ id: reservation.id })}
                            disabled={rejectReservationMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            {rejectReservationMutation.isPending ? 'Declining...' : 'Decline'}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">No pending reservations</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Confirmed Reservations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Confirmed Reservations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reservations.filter((r: any) => r.status === 'confirmed').length > 0 ? (
                    reservations.filter((r: any) => r.status === 'confirmed').map((reservation: any) => (
                      <div key={reservation.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{reservation.customerName}</h4>
                            <p className="text-sm text-muted-foreground">{reservation.customerEmail}</p>
                          </div>
                          <Badge variant="default">Confirmed</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <span className="font-medium">Date:</span> {new Date(reservation.reservationDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Time:</span> {new Date(reservation.reservationDate).toLocaleTimeString()}
                          </div>
                          <div>
                            <span className="font-medium">Party Size:</span> {reservation.partySize} people
                          </div>
                          <div>
                            <span className="font-medium">Phone:</span> {reservation.customerPhone || 'Not provided'}
                          </div>
                        </div>
                        {reservation.specialRequests && (
                          <div className="mb-4">
                            <p className="text-sm"><span className="font-medium">Special Requests:</span> {reservation.specialRequests}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleViewDetails(reservation)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleContactCustomer(reservation)}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Contact Customer
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">No confirmed reservations</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
              </>
            )}

            {reservationView === 'calendar' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5" />
                      Reservation Calendar
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <Button
                          variant={calendarView === 'month' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setCalendarView('month')}
                          className="text-xs"
                        >
                          Month
                        </Button>
                        <Button
                          variant={calendarView === 'week' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setCalendarView('week')}
                          className="text-xs"
                        >
                          Week
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => calendarView === 'month' ? navigateMonth('prev') : navigateWeek('prev')}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium min-w-[150px] text-center">
                          {calendarView === 'month' ? formatCalendarDate(currentDate) : formatWeekRange(currentDate)}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => calendarView === 'month' ? navigateMonth('next') : navigateWeek('next')}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="p-2 text-xs font-medium text-gray-500 text-center">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {calendarView === 'month' && (
                      <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: getFirstDayOfMonth(currentDate) }, (_, i) => (
                      <div key={`empty-${i}`} className="h-20"></div>
                    ))}
                    {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => {
                      const day = i + 1;
                      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                      const dayReservations = getReservationsForDate(date);
                      const isToday = date.toDateString() === new Date().toDateString();
                      const isPast = date < new Date() && !isToday;
                      
                      return (
                        <div
                          key={day}
                          className={`h-20 border rounded-lg p-1 relative cursor-pointer transition-colors ${
                            isToday ? 'bg-blue-50 border-blue-200' : 
                            isPast ? 'bg-gray-50' : 'bg-white'
                          } ${
                            selectedDay?.toDateString() === date.toDateString() 
                              ? 'ring-2 ring-blue-500 bg-blue-100' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleDayClick(date)}
                        >
                          <div className={`text-xs font-medium ${
                            isToday ? 'text-blue-600' : 
                            isPast ? 'text-gray-400' : 'text-gray-900'
                          }`}>
                            {day}
                          </div>
                          {dayReservations.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {dayReservations.slice(0, 2).map((reservation: any, idx: number) => (
                                <div
                                  key={reservation.id}
                                  className={`text-xs p-1 rounded cursor-pointer truncate ${
                                    reservation.status === 'confirmed' 
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(reservation);
                                  }}
                                  title={`${reservation.customerName} - ${new Date(reservation.reservationDate).toLocaleTimeString()}`}
                                >
                                  {reservation.customerName.split(' ')[0]}
                                </div>
                              ))}
                              {dayReservations.length > 2 && (
                                <div className="text-xs text-gray-500 text-center">
                                  +{dayReservations.length - 2} more
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  )}
                  
                  {calendarView === 'week' && (
                    <div className="grid grid-cols-7 gap-1">
                      {getWeekDays(currentDate).map((day) => {
                        const dayReservations = getReservationsForDate(day);
                        const isToday = day.toDateString() === new Date().toDateString();
                        const isSelected = selectedDay?.toDateString() === day.toDateString();
                        
                        return (
                          <div
                            key={day.toISOString()}
                            className={`
                              h-32 border rounded-lg cursor-pointer transition-all hover:shadow-md
                              ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}
                              ${isSelected ? 'ring-2 ring-blue-500' : ''}
                              hover:bg-gray-50
                            `}
                            onClick={() => handleDayClick(day)}
                          >
                            <div className="p-2 h-full flex flex-col">
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                {day.getDate()}
                              </div>
                              {dayReservations.length > 0 && (
                                <div className="flex-1 space-y-1 overflow-hidden">
                                  {dayReservations.slice(0, 3).map((reservation: any) => (
                                    <div
                                      key={reservation.id}
                                      className={`
                                        text-xs px-2 py-1 rounded text-white truncate
                                        ${reservation.status === 'confirmed'
                                          ? 'bg-green-500'
                                          : reservation.status === 'pending'
                                          ? 'bg-amber-500'
                                          : 'bg-gray-500'
                                        }
                                      `}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {reservation.customerName}
                                    </div>
                                  ))}
                                  {dayReservations.length > 3 && (
                                    <div className="text-xs text-gray-500 text-center">
                                      +{dayReservations.length - 3} more
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="mt-4 flex gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                      <span>Confirmed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded"></div>
                      <span>Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                      <span>Today</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-100 border-2 border-blue-500 rounded"></div>
                      <span>Selected Day</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Expanded Day View for Calendar */}
          {selectedDay && reservationView === 'calendar' && (
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {formatDayDate(selectedDay)}
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedDay(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const dayReservations = getReservationsForDate(selectedDay);
                  
                  if (dayReservations.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-muted-foreground">No reservations for this day</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {dayReservations.map((reservation: any) => (
                        <div
                          key={reservation.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-4">
                            <Badge
                              variant={reservation.status === 'confirmed' ? 'default' : 'secondary'}
                              className={
                                reservation.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-amber-100 text-amber-800'
                              }
                            >
                              {reservation.status}
                            </Badge>
                            <div>
                              <p className="font-medium">{reservation.customerName}</p>
                              <p className="text-sm text-gray-600">{reservation.customerEmail}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {new Date(reservation.reservationDate).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className="text-sm text-gray-600">
                              {reservation.partySize} {reservation.partySize === 1 ? 'person' : 'people'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(reservation)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                            {reservation.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleConfirmReservation(reservation.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectReservation(reservation.id)}
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleContactCustomer(reservation)}
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Contact
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Packages Tab */}
          <TabsContent value="packages" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Voucher Packages</h2>
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Package
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Available Templates</CardTitle>
                <p className="text-sm text-gray-600">Choose from our pre-designed voucher package templates</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Starter Package</h4>
                      <p className="text-sm text-gray-600 mb-3">Perfect for new restaurants</p>
                      <div className="space-y-2 text-xs">
                        <div>Meals: 5, 10, 15</div>
                        <div>Discounts: 10%, 15%, 20%</div>
                        <div>Validity: 6, 12 months</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Packages</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">No packages created yet. Start by creating your first voucher package.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Company Name</label>
                    <p className="text-sm text-gray-600">{owner.companyName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-gray-600">{owner.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Contact Person</label>
                    <p className="text-sm text-gray-600">{owner.contactPersonName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <p className="text-sm text-gray-600">{owner.companyPhone}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <p className="text-sm text-gray-600">{owner.companyAddress}</p>
                </div>
                <Button variant="outline">Edit Information</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Banking Information</CardTitle>
                <p className="text-sm text-gray-600">Setup your banking details for payment transfers</p>
              </CardHeader>
              <CardContent>
                <BankingInformationForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Portal Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive updates about your restaurants and packages</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">API Access</h4>
                    <p className="text-sm text-gray-600">Manage API keys for integration</p>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menu Management Tab */}
          <TabsContent value="menu" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
                <p className="text-gray-600">Manage your restaurant menus and menu items</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Menu Item
              </Button>
            </div>

            {/* Restaurant Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Restaurant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {restaurants.map((restaurant) => (
                    <Card key={restaurant.id} className="cursor-pointer hover:shadow-md transition-shadow border-2 border-primary">
                      <CardContent className="p-4">
                        <h3 className="font-semibold">{restaurant.name}</h3>
                        <p className="text-sm text-gray-600">{restaurant.cuisine} • {restaurant.location}</p>
                        <div className="mt-3 flex justify-between items-center">
                          <Badge variant={restaurant.isActive ? "default" : "secondary"}>
                            {restaurant.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button size="sm" variant="outline">
                            Manage Menu
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Menu Items Management */}
            <Card>
              <CardHeader>
                <CardTitle>Menu Items for Bella Vista</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">All Categories</Button>
                  <Button variant="outline" size="sm">Appetizers</Button>
                  <Button variant="outline" size="sm">Mains</Button>
                  <Button variant="outline" size="sm">Desserts</Button>
                  <Button variant="outline" size="sm">Beverages</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Sample Menu Items */}
                  <div className="border rounded-lg p-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <img 
                        src="https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=80&h=80&fit=crop" 
                        alt="Menu item" 
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-semibold">Margherita Pizza</h4>
                        <p className="text-sm text-gray-600">Fresh tomato sauce, mozzarella, basil</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">Mains</Badge>
                          <Badge variant="outline">Vegetarian</Badge>
                          <span className="text-sm text-gray-500">€14.50</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">Delete</Button>
                      <Badge variant={true ? "default" : "secondary"}>
                        {true ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <img 
                        src="https://images.unsplash.com/photo-1546793665-c74683f339c1?w=80&h=80&fit=crop" 
                        alt="Menu item" 
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-semibold">Caesar Salad</h4>
                        <p className="text-sm text-gray-600">Romaine lettuce, parmesan, croutons, caesar dressing</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">Appetizers</Badge>
                          <Badge variant="outline">Vegetarian</Badge>
                          <span className="text-sm text-gray-500">€9.75</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">Delete</Button>
                      <Badge variant={true ? "default" : "secondary"}>
                        {true ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <img 
                        src="https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=80&h=80&fit=crop" 
                        alt="Menu item" 
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-semibold">Tiramisu</h4>
                        <p className="text-sm text-gray-600">Classic Italian dessert with mascarpone and coffee</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">Desserts</Badge>
                          <span className="text-sm text-gray-500">€7.25</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">Delete</Button>
                      <Badge variant={true ? "default" : "secondary"}>
                        {true ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <Button variant="outline">Load More Items</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Restaurant Enrollment Tab */}
          <TabsContent value="enrollment" className="space-y-6">
            <RestaurantEnrollmentForm />
          </TabsContent>
        </Tabs>
      </div>

      {/* View Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Reservation Details
            </DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer Name</Label>
                  <p className="text-sm">{selectedReservation.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedReservation.customerEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm">{selectedReservation.customerPhone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Party Size</Label>
                  <p className="text-sm">{selectedReservation.partySize} people</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm">{new Date(selectedReservation.reservationDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Time</Label>
                  <p className="text-sm">{new Date(selectedReservation.reservationDate).toLocaleTimeString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={selectedReservation.status === 'confirmed' ? 'default' : 'outline'}>
                    {selectedReservation.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Voucher Reservation</Label>
                  <p className="text-sm">{selectedReservation.isVoucherReservation ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              {selectedReservation.specialRequests && (
                <div>
                  <Label className="text-sm font-medium">Special Requests</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{selectedReservation.specialRequests}</p>
                </div>
              )}
              
              {selectedReservation.restaurantNotes && (
                <div>
                  <Label className="text-sm font-medium">Restaurant Notes</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{selectedReservation.restaurantNotes}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <Label className="text-xs font-medium">Created</Label>
                  <p>{new Date(selectedReservation.createdAt).toLocaleString()}</p>
                </div>
                {selectedReservation.confirmedAt && (
                  <div>
                    <Label className="text-xs font-medium">Confirmed</Label>
                    <p>{new Date(selectedReservation.confirmedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Customer Modal */}
      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Contact Customer
            </DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{selectedReservation.customerName}</h4>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {selectedReservation.customerEmail}
                  </div>
                  {selectedReservation.customerPhone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {selectedReservation.customerPhone}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Reservation: {new Date(selectedReservation.reservationDate).toLocaleDateString()} at {new Date(selectedReservation.reservationDate).toLocaleTimeString()}
                </p>
              </div>
              
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message to the customer..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setIsContactModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={sendMessageToCustomer}
                  disabled={!contactMessage.trim()}
                >
                  Send Message
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}