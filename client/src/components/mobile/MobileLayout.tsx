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

      {/* Bottom Navigation - Compact with icons only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-1.5 safe-area-bottom z-50">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            
            return (
              <button
                key={tab.id}
                onClick={() => setLocation(tab.path)}
                className={cn(
                  "flex items-center justify-center p-3 rounded-full transition-all duration-200",
                  active 
                    ? "text-primary bg-primary/10" 
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                )}
              >
                <Icon className={cn(
                  "w-6 h-6 transition-all",
                  active && "stroke-[2.5px]"
                )} />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
