import { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { Home, Search, Brain, Wallet, User, CreditCard, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePendingPayments } from '@/hooks/usePendingPayments';

interface MobileLayoutProps {
  children: ReactNode;
  hideNavigation?: boolean;
}

const tabs = [
  { id: 'home', path: '/m', icon: Home, label: 'Home' },
  { id: 'explore', path: '/m/explore', icon: Search, label: 'Explore' },
  { id: 'ai-menu', path: '/m/ai-menu', icon: Brain, label: 'AI' },
  { id: 'wallet', path: '/m/wallet', icon: Wallet, label: 'Wallet' },
  { id: 'profile', path: '/m/profile', icon: User, label: 'Profile' },
];

const DEFAULT_STATUS_BAR_HEIGHT = 40;

export function MobileLayout({ children, hideNavigation }: MobileLayoutProps) {
  const [location, setLocation] = useLocation();
  const [isCompact, setIsCompact] = useState(false);
  const [statusBarHeight, setStatusBarHeight] = useState(DEFAULT_STATUS_BAR_HEIGHT);
  const mainRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { pendingCount, newRequestAlert, dismissAlert } = usePendingPayments();

  const isNative = Capacitor.isNativePlatform();
  const isAndroid = Capacitor.getPlatform() === 'android';
  const isOnWalletPage = location.startsWith('/m/wallet');

  useEffect(() => {
    async function getStatusBarHeight() {
      if (isAndroid && isNative) {
        try {
          const info = await StatusBar.getInfo() as any;
          const height = info?.height ?? DEFAULT_STATUS_BAR_HEIGHT;
          setStatusBarHeight(height > 0 ? height : DEFAULT_STATUS_BAR_HEIGHT);
        } catch (e) {
          setStatusBarHeight(DEFAULT_STATUS_BAR_HEIGHT);
        }
      }
    }
    getStatusBarHeight();

    const handleResize = () => {
      if (isAndroid && isNative) {
        getStatusBarHeight();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isAndroid, isNative]);


  const isActive = (path: string) => {
    if (path === '/m') return location === '/m' || location === '/m/';
    return location.startsWith(path);
  };

  const handleScroll = useCallback(() => {
    const main = mainRef.current;
    if (!main) return;

    const currentScrollY = main.scrollTop;
    const maxScroll = main.scrollHeight - main.clientHeight;
    
    const isAtTop = currentScrollY <= 10;
    const isAtBottom = currentScrollY >= maxScroll - 10;
    const isScrolling = Math.abs(currentScrollY - lastScrollY.current) > 2;
    
    if (isAtTop || isAtBottom) {
      setIsCompact(false);
    } else if (isScrolling) {
      setIsCompact(true);
    }
    
    lastScrollY.current = currentScrollY;

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    scrollTimeout.current = setTimeout(() => {
      const m = mainRef.current;
      if (m) {
        const scrollY = m.scrollTop;
        const max = m.scrollHeight - m.clientHeight;
        if (scrollY <= 10 || scrollY >= max - 10) {
          setIsCompact(false);
        }
      }
    }, 150);
  }, []);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    main.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      main.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [handleScroll]);

  const handleAlertTap = () => {
    dismissAlert();
    setLocation('/m/wallet');
  };

  return (
    <div 
      className={cn(
        "h-screen bg-white flex flex-col overflow-hidden",
        !isAndroid && "safe-area-top"
      )}
      style={isAndroid ? { paddingTop: statusBarHeight } : undefined}
    >
      {newRequestAlert && !isOnWalletPage && (
        <div 
          className="fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top duration-300"
          style={isAndroid ? { paddingTop: statusBarHeight } : undefined}
        >
          <div className={cn(!isAndroid && "pt-[env(safe-area-inset-top,40px)]")}>
            <div className="mx-3 mt-2 rounded-2xl shadow-lg shadow-orange-600/40 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #FF8C00 50%, #FF5500 100%)' }}>
              <div
                onClick={handleAlertTap}
                role="button"
                tabIndex={0}
                className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
              >
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0 pr-10">
                  <p className="text-white font-bold text-sm">Solicitare de plată</p>
                  <p className="text-white/90 text-xs truncate">
                    {newRequestAlert.restaurantName || 'Restaurant'} — {parseFloat(newRequestAlert.amount || 0).toFixed(2)} {newRequestAlert.currency || '€'}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); dismissAlert(); }}
                className="absolute top-1/2 right-3 -translate-y-1/2 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      <main 
        ref={mainRef}
        className={cn(
          "flex-1 overflow-y-auto overscroll-contain",
          isCompact ? "pb-16" : "pb-20"
        )}
      >
        {children}
      </main>

      {!hideNavigation && <nav className={cn(
        "fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 safe-area-bottom z-50 transition-all duration-300 ease-out",
        isCompact ? "px-6 py-1" : "px-4 py-2"
      )}>
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            const showBadge = tab.id === 'wallet' && pendingCount > 0;
            
            return (
              <button
                key={tab.id}
                onClick={() => setLocation(tab.path)}
                className={cn(
                  "flex flex-col items-center justify-center transition-all duration-300 relative",
                  isCompact ? "p-2" : "py-1 px-3 min-w-[56px]",
                  active 
                    ? "text-primary" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <div className={cn(
                  "rounded-full transition-all duration-300 relative",
                  isCompact ? "p-1.5" : "p-2",
                  active && "bg-primary/10"
                )}>
                  <Icon className={cn(
                    "transition-all duration-300",
                    isCompact ? "w-5 h-5" : "w-6 h-6",
                    active && "stroke-[2.5px]"
                  )} />
                  {showBadge && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[11px] font-medium transition-all duration-300 overflow-hidden",
                  isCompact ? "h-0 opacity-0 mt-0" : "h-4 opacity-100 mt-0.5",
                  active && "font-semibold"
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>}
    </div>
  );
}
