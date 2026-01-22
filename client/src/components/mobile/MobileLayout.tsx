import { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Home, Search, Brain, Wallet, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
}

const tabs = [
  { id: 'home', path: '/m', icon: Home, label: 'Home' },
  { id: 'explore', path: '/m/explore', icon: Search, label: 'Explore' },
  { id: 'ai-menu', path: '/m/ai-menu', icon: Brain, label: 'AI' },
  { id: 'wallet', path: '/m/wallet', icon: Wallet, label: 'Wallet' },
  { id: 'profile', path: '/m/profile', icon: User, label: 'Profile' },
];

export function MobileLayout({ children }: MobileLayoutProps) {
  const [location, setLocation] = useLocation();
  const [isCompact, setIsCompact] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden pt-[env(safe-area-inset-top)]">
      {/* Main Content - Scrollable */}
      <main 
        ref={mainRef}
        className={cn(
          "flex-1 overflow-y-auto overscroll-contain",
          isCompact ? "pb-16" : "pb-20"
        )}
      >
        {children}
      </main>

      {/* Bottom Navigation - Fixed, Dynamic height */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 safe-area-bottom z-50 transition-all duration-300 ease-out",
        isCompact ? "px-6 py-1" : "px-4 py-2"
      )}>
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            
            return (
              <button
                key={tab.id}
                onClick={() => setLocation(tab.path)}
                className={cn(
                  "flex flex-col items-center justify-center transition-all duration-300",
                  isCompact ? "p-2" : "py-1 px-3 min-w-[56px]",
                  active 
                    ? "text-primary" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <div className={cn(
                  "rounded-full transition-all duration-300",
                  isCompact ? "p-1.5" : "p-2",
                  active && "bg-primary/10"
                )}>
                  <Icon className={cn(
                    "transition-all duration-300",
                    isCompact ? "w-5 h-5" : "w-6 h-6",
                    active && "stroke-[2.5px]"
                  )} />
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
      </nav>
    </div>
  );
}
