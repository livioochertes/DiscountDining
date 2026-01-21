import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowRight, ArrowLeft, Sparkles, MapPin, CreditCard, Gift, Star, ChefHat, Globe, User, Filter } from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon: React.ReactNode;
  navigationUrl?: string;
  demoLogin?: boolean;
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  tourType?: 'user' | 'restaurant';
}

export default function OnboardingTour({ isOpen, onClose, onComplete, tourType = 'user' }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [, setLocation] = useLocation();

  // Reset step when tour opens or tour type changes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen, tourType]);

  // Debug logging
  useEffect(() => {
    console.log("OnboardingTour props changed:", { isOpen, currentStep });
  }, [isOpen, currentStep]);

  // Define different tour flows based on user type
  const getUserTourSteps = (): TourStep[] => [
    {
      id: 'registry',
      title: 'Step 1: User Registration',
      description: 'This is the registration page where you can create your customer account. You can see the "Create Your Account" form with all the required fields.',
      position: 'center',
      icon: <User className="h-6 w-6 text-primary" />,
      navigationUrl: '/register'
    },
    {
      id: 'login-demo',
      title: 'Step 2: Demo Login',
      description: 'To show you the voucher buying process, we\'ll use a demo account. This gives you access to the marketplace as a logged-in user.',
      position: 'center',
      icon: <User className="h-6 w-6 text-primary" />,
      navigationUrl: '/login',
      demoLogin: true
    },
    {
      id: 'buy-vouchers',
      title: 'Step 3: Buy Vouchers',
      description: 'Now you can see the marketplace with voucher packages available for purchase. Each restaurant offers different discount deals you can buy.',
      position: 'center',
      icon: <Gift className="h-6 w-6 text-primary" />,
      navigationUrl: '/marketplace'
    },
    {
      id: 'make-reservation',
      title: 'Step 4: Make a Reservation',
      description: 'This page shows your purchased vouchers. You can use them to make restaurant reservations for your dining experience.',
      position: 'center',
      icon: <MapPin className="h-6 w-6 text-primary" />,
      navigationUrl: '/my-vouchers'
    },
    {
      id: 'order-meal',
      title: 'Step 5: Order a Meal',
      description: 'You can also order meals directly from restaurant menus. Browse the marketplace and click "View Menu" on any restaurant card.',
      position: 'center',
      icon: <ChefHat className="h-6 w-6 text-primary" />,
      navigationUrl: '/marketplace'
    }
  ];

  const getRestaurantTourSteps = (): TourStep[] => [
    {
      id: 'registry',
      title: 'Step 1: Restaurant Registration',
      description: 'This is the restaurant enrollment page where you can register your restaurant and create your business account. Fill out all the required business details.',
      position: 'center',
      icon: <ChefHat className="h-6 w-6 text-primary" />,
      navigationUrl: '/restaurant-enrollment'
    },
    {
      id: 'setting-menu',
      title: 'Step 2: Setting the Menu',
      description: 'This is your restaurant portal where you can add menu items, organize your offerings, and manage your restaurant details. Use the "Menu" tab to add your dishes.',
      position: 'center',
      icon: <MapPin className="h-6 w-6 text-primary" />,
      navigationUrl: '/restaurant-portal'
    },
    {
      id: 'setting-vouchers',
      title: 'Step 3: Setting the Vouchers',
      description: 'Here you can create voucher packages with custom discounts and meal counts. Use the "Packages" tab to set up different deal tiers for customers.',
      position: 'center',
      icon: <Gift className="h-6 w-6 text-primary" />,
      navigationUrl: '/restaurant-portal'
    },
    {
      id: 'start-sales',
      title: 'Step 4: Start to Sales',
      description: 'Your restaurant portal is ready! You can now start receiving orders and reservations. Monitor your business from the dashboard tab.',
      position: 'center',
      icon: <CreditCard className="h-6 w-6 text-primary" />,
      navigationUrl: '/restaurant-portal'
    }
  ];

  // Determine which tour to show based on tour type
  const tourSteps = tourType === 'restaurant' ? getRestaurantTourSteps() : getUserTourSteps();

  const currentTourStep = tourSteps[currentStep];

  useEffect(() => {
    if (isOpen) {
      // Add tour data attributes to elements when tour starts
      addTourDataAttributes();
      // Disable body scroll during tour
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable body scroll when tour ends
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const addTourDataAttributes = () => {
    // Add data-tour attributes to key elements
    const restaurantGrid = document.querySelector('.grid');
    if (restaurantGrid) restaurantGrid.setAttribute('data-tour', 'restaurant-grid');
    
    const filters = document.querySelector('div[class*="filter"]') || document.querySelector('select');
    if (filters) filters.setAttribute('data-tour', 'filters');
    
    const voucherCard = document.querySelector('[class*="card"]:not([data-tour])');
    if (voucherCard) voucherCard.setAttribute('data-tour', 'voucher-card');
  };

  const handleNext = async () => {
    const currentTourStep = tourSteps[currentStep];
    
    // Handle demo login step
    if (currentTourStep.demoLogin) {
      try {
        // Attempt demo login
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'demo@example.com',
            password: 'DemoPassword123!'
          }),
        });

        if (response.ok) {
          // Login successful, wait a moment then advance to next step
          setTimeout(() => {
            if (currentStep < tourSteps.length - 1) {
              setCurrentStep(currentStep + 1);
            } else {
              handleComplete();
            }
          }, 1000);
          return;
        }
      } catch (error) {
        console.log('Demo login failed, continuing tour anyway');
      }
    }
    
    // Navigate to the specified page first, then advance the step
    if (currentTourStep.navigationUrl) {
      setLocation(currentTourStep.navigationUrl);
      // Scroll to top immediately after navigation
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Small delay to let the page load, then advance to next step
      setTimeout(() => {
        // Ensure we're at the top after page loads
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (currentStep < tourSteps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          handleComplete();
        }
      }, 500);
    } else {
      if (currentStep < tourSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };



  const getPositionStyles = (step: TourStep) => {
    const target = step.targetSelector ? document.querySelector(step.targetSelector) : null;
    
    if (!target || step.position === 'center') {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10000
      };
    }

    const rect = target.getBoundingClientRect();
    const cardWidth = 320;
    const cardHeight = 200;
    
    switch (step.position) {
      case 'top':
        return {
          position: 'fixed' as const,
          top: rect.top - cardHeight - 20,
          left: rect.left + (rect.width / 2) - (cardWidth / 2),
          zIndex: 10000
        };
      case 'bottom':
        return {
          position: 'fixed' as const,
          top: rect.bottom + 20,
          left: rect.left + (rect.width / 2) - (cardWidth / 2),
          zIndex: 10000
        };
      case 'left':
        return {
          position: 'fixed' as const,
          top: rect.top + (rect.height / 2) - (cardHeight / 2),
          left: rect.left - cardWidth - 20,
          zIndex: 1000
        };
      case 'right':
        return {
          position: 'fixed' as const,
          top: rect.top + (rect.height / 2) - (cardHeight / 2),
          left: rect.right + 20,
          zIndex: 1000
        };
      default:
        return {
          position: 'fixed' as const,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000
        };
    }
  };

  if (!isOpen) {
    console.log("OnboardingTour not showing because isOpen is false");
    return null;
  }

  console.log("OnboardingTour rendering with isOpen:", isOpen);

  return (
    <>
      {/* Light Overlay - less intrusive */}
      <div className="fixed inset-0 bg-black/20 z-[9999]" onClick={handleSkip} />

      {/* Tour Card - positioned in top-right corner */}
      <Card 
        className="w-72 shadow-2xl border-2 border-primary/20 z-[10000] fixed top-4 right-4"
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-primary/10 rounded-full">
                {currentTourStep.icon}
              </div>
              <Badge variant="secondary" className="text-xs">
                {currentStep + 1} / {tourSteps.length}
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSkip}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Content */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 text-gray-900">
              {currentTourStep.title}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {currentTourStep.description}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex gap-1">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full flex-1 transition-colors duration-300 ${
                    index <= currentStep ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-1 text-xs px-2 py-1 h-7"
            >
              <ArrowLeft className="h-3 w-3" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              size="sm"
              className="flex items-center gap-1 bg-primary hover:bg-primary/90 text-xs px-2 py-1 h-7"
            >
              {currentStep === tourSteps.length - 1 
                ? 'Complete'
                : 'Next'
              }
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}