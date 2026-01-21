import { useAuth } from "@/hooks/useAuth";
import { useRestaurantAuth } from "@/hooks/useRestaurantAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import { Star, Wallet, User } from "lucide-react";
import { useLocation } from "wouter";
import eatOffLogo from "@assets/EatOff_Logo_1750512988041.png";

export function Header() {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { owner, isLoading: isRestaurantLoading, isRestaurantAuthenticated } = useRestaurantAuth();

  const isActive = (path: string) => location === path;

  // If logged in as restaurant owner, show restaurant-only header
  if (isRestaurantAuthenticated) {
    return (
      <header 
        className="bg-white shadow-sm"
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          zIndex: 2147483647,
          height: '60px',
          overflow: 'visible'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <button 
                  onClick={() => setLocation("/restaurant-portal")}
                  className="hover:opacity-80 transition-opacity"
                >
                  <img 
                    src={eatOffLogo} 
                    alt="EatOff" 
                    className="h-12 w-auto"
                    style={{ height: '52px' }}
                  />
                </button>
              </div>
              <nav className="hidden md:ml-8 md:flex md:space-x-6 lg:space-x-8">
                <button
                  onClick={() => setLocation("/restaurant-portal")}
                  className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive("/restaurant-portal") ? "text-primary" : "text-gray-500 hover:text-primary"
                  }`}
                >
                  Restaurant Portal
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              <LanguageSelector variant="header" />
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button 
                  className="flex items-center space-x-1 sm:space-x-2 bg-primary text-white px-2 sm:px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <div className="h-6 w-6 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <User className="h-3 w-3" />
                  </div>
                  <span className="hidden sm:inline">{owner?.companyName || 'Restaurant'}</span>
                  <span className="sm:hidden">Restaurant</span>
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await fetch('/api/restaurant-portal/logout', { method: 'POST' });
                      window.location.href = '/restaurant-login';
                    } catch (error) {
                      console.error('Logout error:', error);
                      window.location.href = '/restaurant-login';
                    }
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header 
      className="bg-white shadow-sm"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        zIndex: 2147483647,
        height: '60px',
        overflow: 'visible'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <button 
                onClick={() => setLocation("/")}
                className="hover:opacity-80 transition-opacity"
              >
                <img 
                  src={eatOffLogo} 
                  alt="EatOff" 
                  className="h-12 w-auto"
                  style={{ height: '52px' }}
                />
              </button>
            </div>
            <nav className="hidden md:ml-6 lg:ml-8 md:flex md:space-x-4 lg:space-x-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setLocation("/")}
                    className={`px-3 py-2 text-xl font-medium transition-colors whitespace-nowrap ${
                      isActive("/") ? "text-primary" : "text-gray-500 hover:text-primary"
                    }`}
                  >
                    {t.marketplace}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t.tooltipMarketplace}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setLocation("/my-vouchers")}
                    className={`px-3 py-2 text-xl font-medium transition-colors whitespace-nowrap ${
                      isActive("/my-vouchers") ? "text-primary" : "text-gray-500 hover:text-primary"
                    }`}
                  >
                    {t.myVouchers}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t.tooltipMyVouchers}</p>
                </TooltipContent>
              </Tooltip>
            </nav>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            <LanguageSelector variant="header" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setLocation("/wallet")}
                  className="hidden md:flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1 transition-colors"
                >
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium whitespace-nowrap">Wallet</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t.tooltipWallet}</p>
              </TooltipContent>
            </Tooltip>
            {isLoading ? (
              <div className="bg-gray-200 animate-pulse px-4 py-2 rounded-lg text-sm font-medium">
                <User className="h-4 w-4 inline mr-2" />
                Loading...
              </div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => setLocation("/dashboard?tab=profile")}
                      className="flex items-center space-x-1 sm:space-x-2 bg-primary text-white px-2 sm:px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      {user?.profilePicture ? (
                        <img 
                          src={user.profilePicture} 
                          alt={user.name} 
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                          <User className="h-3 w-3" />
                        </div>
                      )}
                      <span className="hidden sm:inline">{user?.name || t.profile}</span>
                      <span className="sm:hidden">{t.profile}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t.tooltipProfile}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={async () => {
                        try {
                          // Set authentication data to null immediately
                          queryClient.setQueryData(["/api/auth/user"], null);
                          
                          // Make logout API call in background
                          fetch("/api/auth/logout", { 
                            method: "POST",
                            credentials: "include"
                          }).catch(console.error);
                          
                          // Navigate immediately
                          setLocation("/");
                        } catch (error) {
                          console.error("Logout error:", error);
                          queryClient.setQueryData(["/api/auth/user"], null);
                          setLocation("/");
                        }
                      }}
                      className="bg-gray-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                    >
                      Logout
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t.tooltipSignOut}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setLocation("/login")}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <User className="h-4 w-4 inline mr-2" />
                    {t.signIn}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t.tooltipSignIn}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}