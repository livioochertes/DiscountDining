import { Switch, Route } from "wouter";
import { useState, startTransition } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useRestaurantAuth } from "@/hooks/useRestaurantAuth";
import RestaurantLoginModal from "@/components/RestaurantLoginModal";
import LanguageSelector from "@/components/LanguageSelector";
import Marketplace from "@/pages/marketplace";
import MyVouchers from "@/pages/my-vouchers";
import RestaurantAdmin from "@/pages/restaurant-admin";
import RestaurantLogin from "@/pages/restaurant-login";
import RestaurantPortal from "@/pages/restaurant-portal";
// Direct imports for faster loading of legal pages
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import CookiePolicy from "@/pages/cookie-policy";
import RestaurantMenu from "@/pages/restaurant-menu";
import Checkout from "@/pages/checkout";
import MenuCheckout from "@/pages/menu-checkout";
import Profile from "@/pages/profile";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Points from "@/pages/points";
import AdminDashboard from "@/pages/admin-dashboard";
import UserDashboard from "@/pages/user-dashboard";
import MyOrders from "@/pages/my-orders";
import HeatMapPage from "@/pages/heat-map";
import DietaryRecommendationsPage from "@/pages/dietary-recommendations";
import WalletPage from "@/pages/wallet";
import RestaurantScanner from "@/pages/restaurant-scanner";
import CommissionDashboard from "@/pages/commission-dashboard";
import EatOffAdminLogin from "@/pages/eatoff-admin-login";
import EatOffAdminDashboard from "@/pages/eatoff-admin-dashboard";
import HowItWorks from "@/pages/how-it-works";
import Support from "@/pages/support";
import RestaurantSuccessStories from "@/pages/restaurant-success-stories";
import RestaurantHelp from "@/pages/restaurant-help";
import { MenuCart } from "@/components/menu-cart";
import { GlobalRestaurantSwitchDialog } from "@/components/GlobalRestaurantSwitchDialog";
import CookieConsent from "@/components/CookieConsent";


import NotFound from "@/pages/not-found";
import { Header } from "@/components/Header";
import { Star, Wallet, User } from "lucide-react";

// Mobile pages
import MobileHome from "@/pages/mobile/MobileHome";
import MobileExplore from "@/pages/mobile/MobileExplore";
import MobileAIMenu from "@/pages/mobile/MobileAIMenu";
import MobileWallet from "@/pages/mobile/MobileWallet";
import MobileProfile from "@/pages/mobile/MobileProfile";
import { useIsMobileApp } from "@/hooks/useIsMobile";
import { useLocation } from "wouter";
import eatOffLogo from "@assets/EatOff_Logo_1750512988041.png";

// NavigationHeader has been moved to Header.tsx component

function Footer() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  
  return (
    <footer className="bg-white border-t mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-primary mb-4">{t.restaurantVouchers}</h3>
            <p className="text-gray-600 text-sm mb-4">
              Save money on your favorite restaurants with our flexible voucher system. 
              Buy meal packages in advance and enjoy discounts every time you dine.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setShowRestaurantModal(true)}
                    className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md"
                  >
                    Restaurant Portal
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t.tooltipRestaurantPortal}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-primary mb-4 text-lg">{t.forCustomers}</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><button className="hover:text-primary" onClick={() => setLocation("/how-it-works")}>{t.howItWorks}</button></li>
              <li><button className="hover:text-primary" onClick={() => setLocation("/heat-map")}>{t.heatMap}</button></li>
              <li><button className="hover:text-primary" onClick={() => setLocation("/dietary-recommendations")}>{t.aiDietaryRecommendations}</button></li>
              <li><button className="hover:text-primary" onClick={() => setLocation("/profile")}>{t.myAccount}</button></li>
              <li><button className="hover:text-primary" onClick={() => setLocation("/support")}>{t.support}</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-primary mb-4 text-lg">{t.forRestaurants}</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><button className="hover:text-primary" onClick={() => setLocation("/restaurant-login")}>{t.joinOurPlatform}</button></li>
              <li><button className="hover:text-primary" onClick={() => setLocation("/restaurant-scanner")}>{t.qrPaymentScanner}</button></li>
              <li><button className="hover:text-primary" onClick={() => setLocation("/restaurant-success-stories")}>{t.successStories}</button></li>
              <li><button className="hover:text-primary" onClick={() => setLocation("/restaurant-help")}>{t.helpCenter}</button></li>
              <li><button className="hover:text-primary" onClick={() => setLocation("/support")}>{t.support}</button></li>
            </ul>
          </div>
          

        </div>
        
        <div className="border-t mt-8 pt-8 text-center text-sm text-gray-500">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img 
              src={eatOffLogo} 
              alt="EatOff Logo" 
              className="h-8 w-auto object-contain flex-shrink-0"
            />
            <span className="font-semibold text-primary text-sm leading-none mt-2">{t.restaurantVouchers}</span>
          </div>
          <p className="text-sm">&copy; 2025 EatOff. All rights reserved. | <a 
            href="/privacy-policy" 
            className="text-primary hover:text-primary/80 underline"
            onClick={(e) => {
              e.preventDefault();
              const start = performance.now();
              console.log('🔄 Privacy Policy Click - Navigation Starting');
              // Force immediate top position
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
              window.scrollTo(0, 0);
              startTransition(() => {
                setLocation('/privacy-policy');
                requestAnimationFrame(() => console.log(`📊 Privacy Policy Navigation: ${(performance.now() - start).toFixed(1)}ms`));
              });
            }}
          >Privacy Policy</a> | <a 
            href="/cookie-policy" 
            className="text-primary hover:text-primary/80 underline"
            onClick={(e) => {
              e.preventDefault();
              const start = performance.now();
              console.log('🔄 Cookie Policy Click - Navigation Starting');
              // Force immediate top position
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
              window.scrollTo(0, 0);
              startTransition(() => {
                setLocation('/cookie-policy');
                requestAnimationFrame(() => console.log(`📊 Cookie Policy Navigation: ${(performance.now() - start).toFixed(1)}ms`));
              });
            }}
          >Cookie Policy</a> | <a 
            href="/terms-of-service" 
            className="text-primary hover:text-primary/80 underline"
            onClick={(e) => {
              e.preventDefault();
              const start = performance.now();
              console.log('🔄 Terms of Service Click - Navigation Starting');
              // Force immediate top position
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
              window.scrollTo(0, 0);
              startTransition(() => {
                setLocation('/terms-of-service');
                requestAnimationFrame(() => console.log(`📊 Terms of Service Navigation: ${(performance.now() - start).toFixed(1)}ms`));
              });
            }}
          >Terms of Service</a></p>
        </div>
      </div>

      {/* Restaurant Login Modal */}
      <RestaurantLoginModal 
        isOpen={showRestaurantModal} 
        onClose={() => setShowRestaurantModal(false)} 
      />
    </footer>
  );
}

function Router() {
  const { isRestaurantAuthenticated, isLoading } = useRestaurantAuth();
  const [location, setLocation] = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // If logged in as restaurant owner, restrict to restaurant-only routes
  if (isRestaurantAuthenticated) {
    // Redirect to restaurant portal if accessing non-restaurant routes
    if (!location.startsWith('/restaurant-portal') && 
        !location.startsWith('/privacy-policy') && 
        !location.startsWith('/terms-of-service') &&
        location !== '/restaurant-login') {
      setLocation('/restaurant-portal');
      return null;
    }

    return (
      <>
        <Switch>
          <Route path="/restaurant-portal" component={RestaurantPortal} />
          <Route path="/restaurant-login" component={RestaurantLogin} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/cookie-policy" component={CookiePolicy} />
          {/* Default redirect for any unmatched restaurant routes */}
          <Route>
            {() => {
              setLocation('/restaurant-portal');
              return null;
            }}
          </Route>
        </Switch>
        <CookieConsent />
      </>
    );
  }

  // Standard routes for non-restaurant users
  return (
    <Switch>
      {/* Mobile App Routes */}
      <Route path="/m" component={MobileHome} />
      <Route path="/m/explore" component={MobileExplore} />
      <Route path="/m/ai-menu" component={MobileAIMenu} />
      <Route path="/m/wallet" component={MobileWallet} />
      <Route path="/m/profile" component={MobileProfile} />
      
      {/* User Section */}
      <Route path="/" component={Marketplace} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={UserDashboard} />
      <Route path="/my-vouchers" component={MyVouchers} />
      <Route path="/my-orders" component={MyOrders} />
      <Route path="/points" component={Points} />
      <Route path="/wallet" component={WalletPage} />
      <Route path="/profile" component={Profile} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/menu-checkout" component={MenuCheckout} />
      
      {/* Restaurant Section */}
      <Route path="/restaurant-admin" component={RestaurantAdmin} />
      <Route path="/restaurant-login" component={RestaurantLogin} />
      <Route path="/restaurant-portal" component={RestaurantPortal} />
      <Route path="/restaurant-scanner" component={RestaurantScanner} />
      <Route path="/restaurant/:restaurantId/menu" component={RestaurantMenu} />
      
      {/* Admin routes handled separately in App component */}
      <Route path="/commission-dashboard" component={CommissionDashboard} />
      
      {/* EatOff Admin Portal */}
      <Route path="/eatoff-admin-login" component={EatOffAdminLogin} />
      <Route path="/eatoff-admin-dashboard" component={EatOffAdminDashboard} />
      
      {/* Heat Map */}
      <Route path="/heat-map" component={HeatMapPage} />
      
      {/* AI Dietary Recommendations */}
      <Route path="/dietary-recommendations" component={DietaryRecommendationsPage} />
      
      {/* How It Works */}
      <Route path="/how-it-works" component={HowItWorks} />
      
      {/* Support */}
      <Route path="/support" component={Support} />
      
      {/* Restaurant Success Stories */}
      <Route path="/restaurant-success-stories" component={RestaurantSuccessStories} />
      
      {/* Restaurant Help */}
      <Route path="/restaurant-help" component={RestaurantHelp} />
      
      {/* Legal Pages - Direct Loading */}
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location, setLocation] = useLocation();
  const isMobileApp = useIsMobileApp();
  
  // Auto-redirect to mobile layout for Capacitor apps
  const [hasRedirected, setHasRedirected] = useState(false);
  
  if (isMobileApp && location === '/' && !hasRedirected) {
    setHasRedirected(true);
    setTimeout(() => setLocation('/m'), 0);
    return null;
  }
  
  // Mobile routes - render without Header/Footer
  const isMobileRoute = location.startsWith('/m');
  
  // Check if we're on admin routes - if so, render admin pages without main header/footer
  if (location.startsWith('/admin')) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LanguageProvider>
            <CartProvider>
              <Switch>
                <Route path="/admin" component={AdminDashboard} />
                <Route path="/admin/restaurants" component={AdminDashboard} />
                <Route path="/admin/users" component={AdminDashboard} />
                <Route path="/admin/finances" component={AdminDashboard} />
                <Route path="/admin/settings" component={AdminDashboard} />
                <Route component={AdminDashboard} />
              </Switch>
              <Toaster />
            </CartProvider>
          </LanguageProvider>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Mobile layout - clean, no header/footer
  if (isMobileRoute) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LanguageProvider>
            <CartProvider>
              <Router />
              <Toaster />
            </CartProvider>
          </LanguageProvider>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <CartProvider>
            <div className="min-h-screen bg-gray-50">
              <Header />
              <div 
                className="bg-gray-50" 
                style={{ 
                  paddingTop: '60px',
                  minHeight: 'calc(100vh - 60px)'
                }}
              >
                <Router />
                <Footer />
                <MenuCart />
                <GlobalRestaurantSwitchDialog />
                <CookieConsent />
              </div>
            </div>
            <Toaster />
          </CartProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
