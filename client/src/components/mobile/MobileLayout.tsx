import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { Home, Search, Brain, Wallet, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
}

const tabs = [
  { id: 'home', path: '/m', icon: Home, label: 'Home' },
  { id: 'explore', path: '/m/explore', icon: Search, label: 'Explore' },
  { id: 'ai-menu', path: '/m/ai-menu', icon: Brain, label: 'AI Menu' },
  { id: 'wallet', path: '/m/wallet', icon: Wallet, label: 'Wallet' },
  { id: 'profile', path: '/m/profile', icon: User, label: 'Profile' },
];

export function MobileLayout({ children }: MobileLayoutProps) {
  const [location, setLocation] = useLocation();

  const isActive = (path: string) => {
    if (path === '/m') return location === '/m' || location === '/m/';
    return location.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 safe-area-bottom z-50">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            
            return (
              <button
                key={tab.id}
                onClick={() => setLocation(tab.path)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 min-w-[64px]",
                  active 
                    ? "text-primary" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <div className={cn(
                  "p-2 rounded-full transition-all duration-200",
                  active && "bg-primary/10"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-all",
                    active && "stroke-[2.5px]"
                  )} />
                </div>
                <span className={cn(
                  "text-[11px] mt-0.5 font-medium",
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
