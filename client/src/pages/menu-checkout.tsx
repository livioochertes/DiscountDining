import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState, useCallback } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "wouter";
import DeliveryMap from "@/components/DeliveryMap";
import { SavedAddresses } from "@/components/SavedAddresses";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ShoppingCart, MapPin, X, Heart, Bookmark, Award, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import type { UserAddress } from "@shared/schema";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Mixed Payment Form Component for points + card payments
const MixedPaymentForm = ({ orderDetails, restaurantId, items, customerInfo, pointsToUse, mixedPaymentMutation }: {
  orderDetails: { totalAmount: string; pointsToUse: number; cardAmount: string };
  restaurantId: number;
  items: any[];
  customerInfo: any;
  pointsToUse: number;
  mixedPaymentMutation: any;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm the card payment first
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-success`,
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
        // If card payment succeeds, complete the mixed payment
        mixedPaymentMutation.mutate();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing || mixedPaymentMutation.isPending} 
        className="w-full"
      >
        {(isProcessing || mixedPaymentMutation.isPending) ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            <span>Processing Mixed Payment...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <CreditCard className="h-4 w-4" />
            <span>Pay {pointsToUse.toLocaleString()} Points + €{orderDetails.cardAmount}</span>
          </div>
        )}
      </Button>
    </form>
  );
};

const CheckoutForm = ({ orderDetails, restaurantId, items, customerInfo }: { 
  orderDetails: any;
  restaurantId: number;
  items: any[];
  customerInfo: any;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/`,
        },
        redirect: "if_required"
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Complete the order on the backend
        try {
          await apiRequest("POST", "/api/complete-order", {
            paymentIntentId: paymentIntent.id,
            restaurantId,
            items: items.map(item => ({
              menuItemId: item.menuItem.id,
              quantity: item.quantity,
              specialRequests: item.specialRequests
            })),
            customerInfo
          });
        } catch (error) {
          console.error('Error completing order:', error);
        }
        
        clearCart();
        toast({
          title: "Order Placed Successfully!",
          description: "Your order has been confirmed and the restaurant has been notified.",
        });
        setLocation('/');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong with the payment",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        className="w-full" 
        size="lg" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? t.paymentProcessing : `${t.proceedToPayment} - €${orderDetails.totalAmount}`}
      </Button>
    </form>
  );
};

export default function MenuCheckout() {
  const { items, getTotalPrice, getRestaurantId, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [clientSecret, setClientSecret] = useState("");
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.name || '',
    phone: '',
    email: user?.email || '',
    orderType: 'pickup' as 'pickup' | 'delivery',
    deliveryAddress: '',
    deliveryLocation: null as {
      latitude: number;
      longitude: number;
      address: string;
    } | null
  });
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'points'>('stripe');
  const [pointsToUse, setPointsToUse] = useState(0);
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  const [isPaymentInProgress, setIsPaymentInProgress] = useState(false);
  const [showDeliveryMap, setShowDeliveryMap] = useState(false);
  const [showSaveAddressPrompt, setShowSaveAddressPrompt] = useState(false);
  const [activeAddressTab, setActiveAddressTab] = useState("manual");
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{
    display_name: string;
    lat: string;
    lon: string;
    place_id: number;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saveAddressData, setSaveAddressData] = useState({
    label: '',
    instructions: ''
  });
  const [restaurant, setRestaurant] = useState<any>(null);
  const queryClient = useQueryClient();

  // Mutation to save address
  const saveAddressMutation = useMutation({
    mutationFn: async (addressData: { label: string; address: string; latitude: string; longitude: string; instructions?: string }) => {
      return apiRequest("POST", "/api/user-addresses", addressData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-addresses"] });
      toast({
        title: "Address Saved",
        description: "Your delivery address has been saved successfully.",
      });
      setShowSaveAddressPrompt(false);
      setSaveAddressData({ label: '', instructions: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save address",
        variant: "destructive",
      });
    },
  });

  // Mutation for points payment
  const pointsPaymentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/complete-order-with-points", {
        restaurantId,
        items: items.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          specialRequests: item.specialRequests
        })),
        customerInfo,
        pointsToUse,
        totalAmount
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${user?.id}/points`] });
      clearCart();
      toast({
        title: "Order Placed Successfully!",
        description: "Your order has been confirmed using EatOff points.",
      });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process points payment",
        variant: "destructive",
      });
    },
  });

  // Mutation for mixed payment (points + card)
  const mixedPaymentMutation = useMutation({
    mutationFn: async () => {
      // First redeem points if any
      if (pointsToUse > 0) {
        await apiRequest("POST", `/api/customers/${user?.id}/points/redeem`, {
          pointsToRedeem: pointsToUse,
          restaurantId: restaurantId,
          orderId: null
        });
      }
      
      // Then create mixed payment order
      return apiRequest("POST", "/api/create-mixed-payment-order", {
        restaurantId,
        items: items.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          specialRequests: item.specialRequests
        })),
        customerInfo,
        pointsUsed: pointsToUse,
        cardAmount: totalAmount - calculatePointsValue(pointsToUse),
        totalAmount
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${user?.id}/points`] });
      clearCart();
      toast({
        title: "Order Placed Successfully!",
        description: `Paid with ${pointsToUse.toLocaleString()} points + €${(totalAmount - calculatePointsValue(pointsToUse)).toFixed(2)} by card`,
      });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process mixed payment",
        variant: "destructive",
      });
    },
  });

  const totalAmount = getTotalPrice();
  const restaurantId = getRestaurantId();

  // Fetch user points data
  const { data: pointsData } = useQuery<{ currentPoints: number }>({
    queryKey: [`/api/customers/${user?.id}/points`],
    enabled: !!user?.id && isAuthenticated,
  });

  // Points calculation functions
  const calculatePointsValue = (points: number) => points / 100; // 100 points = €1
  const totalAmountInPoints = Math.ceil(totalAmount * 100); // Convert euros to points
  const userPoints = pointsData?.currentPoints || user?.loyaltyPoints || 0;
  const maxPointsUsable = Math.min(userPoints, totalAmountInPoints);
  const canPayWithPoints = isAuthenticated && userPoints > 0; // Allow partial payment with points

  // Function to cancel payment and reset state
  const cancelPayment = useCallback(() => {
    console.log('Canceling payment - resetting state');
    setIsPaymentInProgress(false);
    setClientSecret('');
    setIsCreatingPaymentIntent(false);
    setPaymentMethod('stripe');
    setPointsToUse(0);
    // Force re-render of payment section by triggering useEffect
    setCustomerInfo(prev => ({ ...prev }));
  }, []);

  // Move all hooks before any early return to prevent React hooks violation

  useEffect(() => {
    // Fetch restaurant details
    if (restaurantId) {
      fetch(`/api/restaurants/${restaurantId}`)
        .then(res => res.json())
        .then(data => setRestaurant(data))
        .catch(err => console.error('Failed to fetch restaurant:', err));
    }
  }, [restaurantId]);

  useEffect(() => {
    // Reset client secret when cart is empty
    if (items.length === 0) {
      setClientSecret('');
      return;
    }

    // Calculate remaining amount for partial payments
    const remainingAmount = paymentMethod === 'points' 
      ? totalAmount - calculatePointsValue(pointsToUse)
      : totalAmount;
    
    // Only create payment intent when Stripe payment is needed
    const needsStripePayment = paymentMethod === 'stripe' || 
      (paymentMethod === 'points' && remainingAmount > 0);
    
    // Only proceed if we need Stripe payment, have customer info, and aren't already creating a payment intent
    // Don't create payment intent if not needed, missing info, or already creating
    if (!needsStripePayment || !customerInfo.name || !customerInfo.phone || !customerInfo.email || items.length === 0 || isCreatingPaymentIntent) {
      return;
    }
      
    const paymentAmount = paymentMethod === 'points' ? remainingAmount : totalAmount; // Use remaining amount for partial payments
    const actualRestaurantId = restaurantId || (items.length > 0 ? items[0].menuItem.restaurantId : null);
    
    // Create a unique key for this payment intent to prevent duplicates
    const paymentKey = `${actualRestaurantId}-${paymentAmount}-${items.length}-${paymentMethod}-${pointsToUse}`;
    
    // Only create payment intent if we don't have one, or if core parameters changed
    const coreChanged = !clientSecret || paymentMethod !== 'points' || items.length === 0;
    
    if (coreChanged) {
      // Create new payment intent for initial load or major changes
      const timeoutId = setTimeout(() => {
        setIsCreatingPaymentIntent(true);
        console.log('Creating payment intent for order:', {
          restaurantId: actualRestaurantId,
          items: items.length,
          total: totalAmount,
          paymentAmount,
          remainingAmount,
          pointsToUse,
          needsStripePayment,
          customerInfo: { ...customerInfo, email: 'hidden' } // Don't log email
        });

        apiRequest("POST", "/api/create-order-payment", {
          restaurantId: actualRestaurantId,
          items: items.map(item => ({
            menuItemId: item.menuItem.id,
            quantity: item.quantity,
            specialRequests: item.specialRequests
          })),
          customerInfo: {
            name: customerInfo.name,
            phone: customerInfo.phone,
            email: customerInfo.email,
            orderType: customerInfo.orderType,
            deliveryAddress: customerInfo.deliveryAddress
          },
          total: paymentAmount // Use the calculated payment amount for Stripe
        })
          .then((res) => res.json())
          .then((data) => {
            console.log('Payment intent response:', data);
            setClientSecret(data.clientSecret);
            setIsCreatingPaymentIntent(false); // Immediately reset after success
          })
          .catch((error) => {
            console.error('Error creating payment intent:', error);
            toast({
              title: "Error",
              description: "Failed to initialize payment. Please try again.",
              variant: "destructive",
            });
          })
          .finally(() => {
            setIsCreatingPaymentIntent(false);
          });
      }, 300); // Reduced debounce time for initial load
      
      return () => {
        clearTimeout(timeoutId);
        setIsCreatingPaymentIntent(false);
      };
    }

    // No cleanup needed since we're not using timeoutId in this conditional block
  }, [customerInfo.name, customerInfo.phone, customerInfo.email, customerInfo.orderType, items.length, restaurantId, totalAmount, paymentMethod]); // Removed pointsToUse to prevent payment intent recreation on slider changes

  // Don't reset client secret when switching payment methods - we might need it for partial payments
  // useEffect(() => {
  //   if (paymentMethod === 'points') {
  //     setClientSecret('');
  //     setIsCreatingPaymentIntent(false);
  //   }
  // }, [paymentMethod]);

  const canProceedToPayment = customerInfo.name && customerInfo.phone && customerInfo.email && 
    (customerInfo.orderType === 'pickup' || (customerInfo.orderType === 'delivery' && customerInfo.deliveryAddress.trim() !== ''));

  // Set payment in progress when payment UI is shown
  useEffect(() => {
    if (canProceedToPayment && (clientSecret || paymentMethod === 'points')) {
      setIsPaymentInProgress(true);
    }
  }, [canProceedToPayment, clientSecret, paymentMethod]);

  const finalAmount = paymentMethod === 'points' 
    ? Math.max(0, totalAmount - calculatePointsValue(pointsToUse))
    : totalAmount;

  console.log('Payment validation:', {
    name: customerInfo.name,
    phone: customerInfo.phone,
    email: customerInfo.email,
    orderType: customerInfo.orderType,
    deliveryAddress: customerInfo.deliveryAddress,
    canProceedToPayment,
    paymentMethod,
    userPoints,
    totalAmountInPoints,
    canPayWithPoints
  });

  const handleLocationSelect = (location: { latitude: number; longitude: number; address: string }) => {
    console.log('Location selected:', location); // Debug log
    console.log('Setting deliveryAddress to:', location.address); // Debug log
    setCustomerInfo(prevInfo => {
      const newInfo = {
        ...prevInfo,
        deliveryLocation: location,
        deliveryAddress: location.address
      };
      console.log('Updated customerInfo:', newInfo); // Debug log
      return newInfo;
    });
    
    // Switch to manual tab to show the selected address
    setActiveAddressTab("manual");
    setShowDeliveryMap(false);
    setShowSuggestions(false); // Hide suggestions when location is selected
    
    // Show save address prompt if user is authenticated
    if (isAuthenticated) {
      setShowSaveAddressPrompt(true);
    }
  };

  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setAddressSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Address search error:', error);
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Debounced address search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerInfo.deliveryAddress && customerInfo.deliveryAddress.length >= 3 && !customerInfo.deliveryLocation) {
        searchAddresses(customerInfo.deliveryAddress);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerInfo.deliveryAddress]);

  const handleAddressChange = (value: string) => {
    setCustomerInfo({
      ...customerInfo, 
      deliveryAddress: value,
      deliveryLocation: null // Clear location when manually typing
    });
  };

  const selectSuggestion = (suggestion: any) => {
    const location = {
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
      address: suggestion.display_name
    };
    
    handleLocationSelect(location);
  };

  const handleSavedAddressSelect = (address: UserAddress) => {
    setCustomerInfo(prevInfo => ({
      ...prevInfo,
      deliveryAddress: address.address,
      deliveryLocation: address.latitude && address.longitude ? {
        latitude: parseFloat(address.latitude),
        longitude: parseFloat(address.longitude),
        address: address.address
      } : null
    }));
  };

  const handleSaveAddress = () => {
    if (!customerInfo.deliveryLocation || !saveAddressData.label.trim()) {
      toast({
        title: "Error",
        description: "Please provide a label for the address",
        variant: "destructive",
      });
      return;
    }

    saveAddressMutation.mutate({
      label: saveAddressData.label.trim(),
      address: customerInfo.deliveryLocation.address,
      latitude: customerInfo.deliveryLocation.latitude.toString(),
      longitude: customerInfo.deliveryLocation.longitude.toString(),
      instructions: saveAddressData.instructions.trim() || undefined,
    });
  };

  // Early return after all hooks are defined to fix React hooks rule violation
  if (items.length === 0 && !isPaymentInProgress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-4">Add some items to your cart to continue with checkout</p>
          <Button onClick={() => setLocation('/')}>Browse Restaurants</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {isPaymentInProgress ? (
          <Button 
            variant="outline" 
            onClick={cancelPayment}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel Payment & Edit Cart
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => setLocation(`/restaurant/${restaurantId}/menu`)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.backToMenu}
          </Button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <Card className={`relative ${isPaymentInProgress ? 'border-primary' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  {t.orderSummary}
                  {isPaymentInProgress && (
                    <span className="ml-auto px-2 py-1 text-xs bg-primary text-white rounded-full">
                      Payment in Progress
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {restaurant && (
                  <div className="pb-4 border-b">
                    <h3 className="font-semibold">{restaurant.name}</h3>
                    <p className="text-sm text-gray-600">{restaurant.address}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.menuItem.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.menuItem.name}</h4>
                        {item.specialRequests && (
                          <p className="text-xs text-blue-600">{t.note}: {item.specialRequests}</p>
                        )}
                        <p className="text-sm text-gray-600">{t.quantity}: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">€{(parseFloat(item.menuItem.price.toString()) * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-primary">€{totalAmount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{t.customerInformation}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">{t.customerName} *</Label>
                    <Input
                      id="name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">{t.customerPhone} *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">{t.customerEmail} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>{t.orderType}</Label>
                  <Select 
                    value={customerInfo.orderType} 
                    onValueChange={(value: 'pickup' | 'delivery') => setCustomerInfo({...customerInfo, orderType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup">{t.pickup}</SelectItem>
                      <SelectItem value="delivery">{t.delivery}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {customerInfo.orderType === 'delivery' && (
                  <div>
                    <Label>{t.deliveryAddress}</Label>
                    <Tabs value={activeAddressTab} onValueChange={setActiveAddressTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="manual">{t.enterAddress}</TabsTrigger>
                        <TabsTrigger value="map">
                          <MapPin className="w-4 h-4 mr-2" />
                          {t.selectOnMap}
                        </TabsTrigger>
                        <TabsTrigger value="saved">
                          <Heart className="w-4 h-4 mr-2" />
                          {t.savedAddresses}
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="manual" className="space-y-3">
                        <div className="space-y-2 relative">
                          <Input
                            id="address"
                            value={customerInfo.deliveryAddress}
                            onChange={(e) => handleAddressChange(e.target.value)}
                            onFocus={() => {
                              if (addressSuggestions.length > 0) {
                                setShowSuggestions(true);
                              }
                            }}
                            onBlur={() => {
                              // Delay hiding suggestions to allow clicks
                              setTimeout(() => setShowSuggestions(false), 200);
                            }}
                            placeholder={t.enterDeliveryAddress}
                            className="w-full"
                          />
                          
                          {/* Address Suggestions Dropdown */}
                          {showSuggestions && addressSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {addressSuggestions.map((suggestion, index) => (
                                <button
                                  key={suggestion.place_id || index}
                                  type="button"
                                  onClick={() => selectSuggestion(suggestion)}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0 focus:bg-gray-100 focus:outline-none"
                                >
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm text-gray-900 line-clamp-2">
                                      {suggestion.display_name}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {customerInfo.deliveryLocation && (
                            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                              <MapPin className="h-4 w-4" />
                              <span>{t.addressSelectedFromMap}</span>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="map" className="space-y-3">
                        <div className="h-64 w-full border rounded-lg overflow-hidden">
                          <DeliveryMap
                            onLocationSelect={handleLocationSelect}
                            onClose={() => {}} // No close needed since it's inline
                            initialLocation={customerInfo.deliveryLocation ? {
                              latitude: customerInfo.deliveryLocation.latitude,
                              longitude: customerInfo.deliveryLocation.longitude
                            } : undefined}
                            inline={true}
                          />
                        </div>
                        {customerInfo.deliveryAddress && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-700">Selected Address:</p>
                            <p className="font-medium text-green-800">{customerInfo.deliveryAddress}</p>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="saved">
                        {isAuthenticated ? (
                          <SavedAddresses 
                            showSelectButton={true}
                            onSelectAddress={(address) => {
                              setCustomerInfo({
                                ...customerInfo,
                                deliveryAddress: address.address,
                                deliveryLocation: address.latitude && address.longitude ? {
                                  latitude: parseFloat(address.latitude),
                                  longitude: parseFloat(address.longitude),
                                  address: address.address
                                } : null
                              });
                            }}
                          />
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">
                              Sign in to save and use your favorite delivery addresses
                            </p>
                            <Button variant="outline" onClick={() => setLocation('/login')}>
                              Sign In
                            </Button>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                    
                    {customerInfo.deliveryLocation && (
                      <div className="bg-gray-50 p-3 rounded-lg border mt-3">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">Selected Location</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {customerInfo.deliveryLocation.address}
                            </p>
                            <p className="text-xs text-gray-500">
                              {customerInfo.deliveryLocation.latitude.toFixed(6)}, {customerInfo.deliveryLocation.longitude.toFixed(6)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCustomerInfo({...customerInfo, deliveryLocation: null, deliveryAddress: ''})}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t.paymentInformation}</CardTitle>
              </CardHeader>
              <CardContent>
                {!canProceedToPayment ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>{t.fillRequiredInfo}</p>
                  </div>
                ) : !isPaymentInProgress && !clientSecret ? (
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <CreditCard className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready to Process Payment</h3>
                      <p className="text-gray-500 mb-4">Your order information is complete. Choose a payment method to continue.</p>
                    </div>
                    <Button 
                      onClick={() => setIsPaymentInProgress(true)}
                      className="px-6 py-3"
                      size="lg"
                    >
                      Proceed to Payment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Payment Method Selection */}
                    {isAuthenticated && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Select Payment Method</h3>
                        <div className="grid grid-cols-1 gap-4">
                          {/* Stripe Payment Option */}
                          <div
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              paymentMethod === 'stripe'
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setPaymentMethod('stripe')}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 rounded-full border-2 ${
                                paymentMethod === 'stripe' ? 'border-primary bg-primary' : 'border-gray-300'
                              }`}>
                                {paymentMethod === 'stripe' && (
                                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                )}
                              </div>
                              <CreditCard className="h-5 w-5 text-gray-600" />
                              <div className="flex-1">
                                <p className="font-medium">Card Payment</p>
                                <p className="text-sm text-gray-600">Pay with credit/debit card via Stripe</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">€{totalAmount.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Points Payment Option */}
                          <div
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              paymentMethod === 'points'
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-gray-200 hover:border-gray-300'
                            } ${!canPayWithPoints ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => canPayWithPoints && setPaymentMethod('points')}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 rounded-full border-2 ${
                                paymentMethod === 'points' ? 'border-primary bg-primary' : 'border-gray-300'
                              }`}>
                                {paymentMethod === 'points' && (
                                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                )}
                              </div>
                              <Award className="h-5 w-5 text-amber-600" />
                              <div className="flex-1">
                                <p className="font-medium">EatOff Points</p>
                                <p className="text-sm text-gray-600">
                                  Available: {userPoints.toLocaleString()} points 
                                  {!canPayWithPoints && ' (insufficient points)'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">{totalAmountInPoints.toLocaleString()} pts</p>
                                <p className="text-sm text-gray-600">≈ €{totalAmount.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Processing */}
                    {paymentMethod === 'stripe' && (
                      <div>
                        {isCreatingPaymentIntent || !clientSecret ? (
                          <div className="text-center py-8">
                            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                            <p className="text-gray-600">
                              {isCreatingPaymentIntent ? 'Preparing secure payment...' : t.preparingPayment}
                            </p>
                          </div>
                        ) : (
                          <div key={`stripe-${clientSecret.slice(0, 10)}`}>
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
                              <CheckoutForm 
                                orderDetails={{ totalAmount: totalAmount.toFixed(2) }}
                                restaurantId={restaurantId!}
                                items={items}
                                customerInfo={customerInfo}
                              />
                            </Elements>
                          </div>
                        )}
                      </div>
                    )}

                    {paymentMethod === 'points' && (
                      <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <Award className="h-5 w-5 text-amber-600" />
                            <h4 className="font-medium text-amber-800">Choose Points to Use</h4>
                          </div>
                          
                          {/* Points Slider */}
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Points to use: {pointsToUse.toLocaleString()}</Label>
                              <input
                                type="range"
                                min="0"
                                max={maxPointsUsable}
                                value={pointsToUse}
                                onChange={(e) => setPointsToUse(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                style={{
                                  background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(pointsToUse / maxPointsUsable) * 100}%, #e5e7eb ${(pointsToUse / maxPointsUsable) * 100}%, #e5e7eb 100%)`
                                }}
                              />
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>0 points</span>
                                <span>{maxPointsUsable.toLocaleString()} points max</span>
                              </div>
                            </div>
                            
                            {/* Quick Select Buttons */}
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPointsToUse(Math.floor(maxPointsUsable * 0.25))}
                                className="text-xs"
                              >
                                25%
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPointsToUse(Math.floor(maxPointsUsable * 0.5))}
                                className="text-xs"
                              >
                                50%
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPointsToUse(Math.floor(maxPointsUsable * 0.75))}
                                className="text-xs"
                              >
                                75%
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPointsToUse(maxPointsUsable)}
                                className="text-xs"
                              >
                                Max
                              </Button>
                            </div>
                          </div>
                          
                          {/* Payment Breakdown */}
                          <div className="mt-4 pt-3 border-t border-amber-200">
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Total Order:</span>
                                <span className="font-medium">€{totalAmount.toFixed(2)}</span>
                              </div>
                              {pointsToUse > 0 && (
                                <>
                                  <div className="flex justify-between text-amber-700">
                                    <span>Points Payment:</span>
                                    <span>-€{calculatePointsValue(pointsToUse).toFixed(2)} ({pointsToUse.toLocaleString()} pts)</span>
                                  </div>
                                  <div className="flex justify-between text-blue-700">
                                    <span>Card Payment:</span>
                                    <span>€{(totalAmount - calculatePointsValue(pointsToUse)).toFixed(2)}</span>
                                  </div>
                                  <Separator className="bg-amber-200" />
                                  <div className="flex justify-between font-medium text-amber-800">
                                    <span>Points Remaining:</span>
                                    <span>{(userPoints - pointsToUse).toLocaleString()} points</span>
                                  </div>
                                </>
                              )}
                              {pointsToUse === 0 && (
                                <div className="flex justify-between text-blue-700">
                                  <span>Card Payment:</span>
                                  <span>€{totalAmount.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Payment Action */}
                        {pointsToUse >= totalAmountInPoints ? (
                          // Full points payment
                          <Button
                            onClick={() => pointsPaymentMutation.mutate()}
                            disabled={pointsToUse === 0 || pointsPaymentMutation.isPending}
                            className="w-full"
                          >
                            {pointsPaymentMutation.isPending ? (
                              <div className="flex items-center space-x-2">
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                <span>Processing Payment...</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Award className="h-4 w-4" />
                                <span>Pay with {pointsToUse.toLocaleString()} Points</span>
                              </div>
                            )}
                          </Button>
                        ) : (
                          // Partial payment with card
                          <div className="space-y-4">
                            <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-700">
                                <CreditCard className="inline h-4 w-4 mr-1" />
                                Partial payment: {pointsToUse.toLocaleString()} points + €{(totalAmount - calculatePointsValue(pointsToUse)).toFixed(2)} by card
                              </p>
                            </div>
                            {!clientSecret ? (
                              <div className="text-center py-4">
                                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Preparing payment...</p>
                              </div>
                            ) : (
                              <Elements 
                                key={clientSecret} // Force re-mount with new client secret
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
                                <MixedPaymentForm 
                                  orderDetails={{ 
                                    totalAmount: totalAmount.toFixed(2),
                                    pointsToUse,
                                    cardAmount: (totalAmount - calculatePointsValue(pointsToUse)).toFixed(2)
                                  }}
                                  restaurantId={restaurantId!}
                                  items={items}
                                  customerInfo={customerInfo}
                                  pointsToUse={pointsToUse}
                                  mixedPaymentMutation={mixedPaymentMutation}
                                />
                              </Elements>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>



        {/* Save Address Dialog */}
        <Dialog open={showSaveAddressPrompt} onOpenChange={setShowSaveAddressPrompt}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                Save This Address
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Selected Address:</p>
                <p className="font-medium">{customerInfo.deliveryLocation?.address}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address-label">Address Label *</Label>
                <Select 
                  value={saveAddressData.label} 
                  onValueChange={(value) => setSaveAddressData(prev => ({ ...prev, label: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a label for this address" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home">🏠 Home</SelectItem>
                    <SelectItem value="Work">🏢 Work</SelectItem>
                    <SelectItem value="Friend">👥 Friend's Place</SelectItem>
                    <SelectItem value="Family">👨‍👩‍👧‍👦 Family</SelectItem>
                    <SelectItem value="Other">📍 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address-instructions">Delivery Instructions (Optional)</Label>
                <Textarea
                  id="address-instructions"
                  placeholder="e.g., Ring doorbell twice, Leave at door, etc."
                  value={saveAddressData.instructions}
                  onChange={(e) => setSaveAddressData(prev => ({ ...prev, instructions: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSaveAddressPrompt(false);
                    setSaveAddressData({ label: '', instructions: '' });
                  }}
                  className="flex-1"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleSaveAddress}
                  disabled={!saveAddressData.label.trim() || saveAddressMutation.isPending}
                  className="flex-1"
                >
                  {saveAddressMutation.isPending ? "Saving..." : "Save Address"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}