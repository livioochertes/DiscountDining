import { useEffect, useState } from "react";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Check } from "lucide-react";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

function CheckoutForm({ packageData, restaurant, onSuccess, user, isPayLater, payLaterDetails }: {
  packageData: any;
  restaurant: any;
  onSuccess: () => void;
  user: any;
  isPayLater?: boolean;
  payLaterDetails?: {
    bonusPercentage: number;
    paymentTermDays: number;
    originalAmount: number;
  };
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !packageData) {
      return;
    }

    setIsProcessing(true);

    try {
      if (isPayLater) {
        // Handle Pay Later vouchers with setup intent
        const { error, setupIntent } = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: window.location.origin + "/my-vouchers",
          },
          redirect: "if_required"
        });

        if (error) {
          toast({
            title: "Authorization Failed",
            description: error.message,
            variant: "destructive",
          });
        } else if (setupIntent && setupIntent.status === 'succeeded') {
          // Complete the Pay Later purchase
          const response = await fetch('/api/complete-pay-later-purchase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              setupIntentId: setupIntent.id,
              customerId: user.id,
              eatoffVoucherId: packageData.id
            }),
          });

          const result = await response.json();

          if (result.success) {
            toast({
              title: "Authorization Successful",
              description: `Your Pay Later voucher is activated! Payment of €${payLaterDetails?.originalAmount} will be charged in ${payLaterDetails?.paymentTermDays} days.`,
            });
            onSuccess();
          } else {
            toast({
              title: "Error",
              description: result.message || "Failed to complete purchase",
              variant: "destructive",
            });
          }
        }
      } else {
        // Handle regular payments
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.origin + "/my-vouchers",
          },
          redirect: "if_required"
        });

        if (error) {
          toast({
            title: "Payment Failed",
            description: error.message,
            variant: "destructive",
          });
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
          // Complete the purchase on the backend
          await api.completePurchase(paymentIntent.id, packageData.id, user.id);
          
          toast({
            title: "Payment Successful",
            description: "Your voucher package has been purchased!",
          });
          onSuccess();
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isPayLater && payLaterDetails && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-900 mb-2">Pay Later Details</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• You'll receive {payLaterDetails.bonusPercentage}% bonus value immediately</li>
            <li>• Payment of €{payLaterDetails.originalAmount} will be charged in {payLaterDetails.paymentTermDays} days</li>
            <li>• Your payment method will be securely saved for the future charge</li>
          </ul>
        </div>
      )}
      
      <PaymentElement 
        options={{
          layout: {
            type: 'tabs',
            defaultCollapsed: false,
            radios: false,
            spacedAccordionItems: false
          },
          paymentMethodOrder: isPayLater ? ['card'] : ['card', 'klarna', 'google_pay', 'apple_pay'],
          wallets: isPayLater ? {} : {
            applePay: 'auto',
            googlePay: 'auto'
          }
        }}
      />
      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing 
          ? 'Processing...' 
          : isPayLater 
            ? 'Authorize Payment Method' 
            : 'Complete Purchase'
        }
      </Button>
    </form>
  );
}

function CheckoutSuccess({ onContinue }: { onContinue: () => void }) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-accent" />
        </div>
        <h2 className="text-2xl font-bold text-secondary mb-2">Purchase Successful!</h2>
        <p className="text-gray-600 mb-6">
          Your voucher package has been added to your account. You can start using it right away!
        </p>
        <Button onClick={onContinue} className="bg-primary hover:bg-red-600">
          View My Vouchers
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentData, setPaymentIntentData] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  // Show access required message if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h2>
            <p className="text-gray-600 mb-6">
              Please sign in to access checkout and complete your purchase.
            </p>
            <Button 
              onClick={() => setLocation('/login')}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const packageId = urlParams.get('packageId');
  const restaurantId = urlParams.get('restaurantId');

  const { data: packageData } = useQuery({
    queryKey: ['/api/packages', packageId],
    queryFn: () => api.getRestaurantPackages(parseInt(restaurantId!)).then(packages => 
      packages.find((p: any) => p.id === parseInt(packageId!))
    ),
    enabled: !!packageId && !!restaurantId
  });

  const { data: restaurant } = useQuery({
    queryKey: ['/api/restaurants', restaurantId],
    queryFn: () => api.getRestaurant(parseInt(restaurantId!)),
    enabled: !!restaurantId
  });

  useEffect(() => {
    if (!packageId || !restaurantId) {
      setLocation('/');
      return;
    }

    if (!stripePromise) {
      toast({
        title: "Payment Unavailable",
        description: "Payment processing is currently unavailable. Please contact support.",
        variant: "destructive",
      });
      setLocation('/');
      return;
    }

    if (packageData) {
      // Calculate customer price - handle both meal-based and EatOff vouchers
      let regularPrice, customerPrice;
      const discount = parseFloat(packageData.discountPercentage);
      
      if (packageData.type === 'eatoff' && packageData.totalValue) {
        // EatOff voucher: use totalValue as the regular price
        regularPrice = parseFloat(packageData.totalValue);
        customerPrice = regularPrice * (1 - discount / 100);
      } else {
        // Regular restaurant package: use mealCount * pricePerMeal
        regularPrice = parseFloat(packageData.pricePerMeal || "0") * (packageData.mealCount || 0);
        customerPrice = regularPrice * (1 - discount / 100);
      }

      // Create PaymentIntent or SetupIntent for Pay Later
      const isPayLater = packageData.voucherType === 'pay_later';
      
      fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: isPayLater ? customerPrice : customerPrice,
          packageId: packageData.type === 'eatoff' ? undefined : parseInt(packageId),
          eatoffVoucherId: packageData.type === 'eatoff' ? packageData.id : undefined,
          voucherType: packageData.voucherType || 'immediate',
          customerId: user.id,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
          setPaymentIntentData(data);
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to initialize payment",
            variant: "destructive",
          });
          setLocation('/');
        });
    }
  }, [packageData, packageId, restaurantId, setLocation, toast]);

  if (!packageId || !restaurantId) {
    return null;
  }

  if (!packageData || !restaurant) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <CheckoutSuccess onContinue={() => setLocation('/my-vouchers')} />
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500">Initializing payment...</p>
        </div>
      </div>
    );
  }

  // Handle both meal-based packages and EatOff vouchers with totalValue
  let regularPrice, customerPrice, savings, isPayLater, bonusAmount;
  const discount = parseFloat(packageData.discountPercentage);
  
  if (packageData.type === 'eatoff' && packageData.totalValue) {
    // EatOff voucher: use totalValue as the regular price
    regularPrice = parseFloat(packageData.totalValue);
    isPayLater = (packageData as any).voucherType === 'pay_later';
    const bonusPercentage = parseFloat((packageData as any).bonusPercentage || "0");
    
    if (isPayLater) {
      // Pay Later: customer pays more later (regular price + bonus)
      customerPrice = regularPrice * (1 + bonusPercentage / 100);
      bonusAmount = customerPrice - regularPrice;
      savings = 0; // No immediate savings, customer pays more
    } else {
      // Regular discount voucher
      customerPrice = regularPrice * (1 - discount / 100);
      savings = regularPrice - customerPrice;
      bonusAmount = 0;
    }
  } else {
    // Regular restaurant package: use mealCount * pricePerMeal
    regularPrice = parseFloat(packageData.pricePerMeal || "0") * (packageData.mealCount || 0);
    customerPrice = regularPrice * (1 - discount / 100);
    savings = regularPrice - customerPrice;
    isPayLater = false;
    bonusAmount = 0;
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Button>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Your Purchase</h1>
        <p className="text-gray-600">Secure checkout powered by Stripe</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{restaurant.name}</h3>
              <p className="text-sm text-gray-600">{restaurant.location}</p>
            </div>
            
            <Separator />
            
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{packageData.name}</h4>
                  <p className="text-sm text-gray-600">{packageData.mealCount} meals</p>
                </div>
                <Badge className="bg-accent/10 text-accent">
                  {packageData.discountPercentage}% OFF
                </Badge>
              </div>
              
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Voucher Value:</span>
                  <span className="font-medium">€{regularPrice.toFixed(2)}</span>
                </div>
                
                {isPayLater ? (
                  <>
                    <div className="flex justify-between text-accent font-medium">
                      <span>You pay later:</span>
                      <span>€{customerPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Price increase:</span>
                      <span className="text-red-600">+{bonusAmount.toFixed(2)} RON</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Payment due in {(packageData as any).paymentTermDays || 30} days
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-accent font-medium">
                      <span>Your price:</span>
                      <span>€{customerPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>You save:</span>
                      <span className="text-green-600">-{savings.toFixed(2)} RON</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>€{customerPrice.toFixed(2)}</span>
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Valid for {packageData.validityMonths} months from purchase</p>
              <p>• Can be used for dine-in only</p>
              <p>• One meal per visit</p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
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
                packageData={packageData}
                restaurant={restaurant}
                onSuccess={() => setIsSuccess(true)}
                user={user}
                isPayLater={paymentIntentData?.isPayLater || false}
                payLaterDetails={paymentIntentData?.payLaterDetails}
              />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
