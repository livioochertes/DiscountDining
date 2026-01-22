import { useLocation } from 'wouter';
import { 
  User, ChevronRight, Settings, Bell, CreditCard, Heart, 
  HelpCircle, LogOut, Star, Shield, Globe, QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface MenuItem {
  id: string;
  icon: any;
  label: string;
  subtitle?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

export default function MobileProfile() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setLocation('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );
  }

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center min-h-[60vh]">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Create Your Account
          </h2>
          <p className="text-gray-500 mb-8 max-w-sm">
            Sign up to access your profile, manage your preferences, and track your loyalty rewards.
          </p>
          <button
            onClick={() => setLocation('/register')}
            className="w-full max-w-xs bg-primary text-white font-semibold py-4 px-6 rounded-2xl mb-3 hover:bg-primary/90 transition-colors"
          >
            Create Account
          </button>
          <button
            onClick={() => setLocation('/login')}
            className="w-full max-w-xs bg-gray-100 text-gray-700 font-medium py-4 px-6 rounded-2xl hover:bg-gray-200 transition-colors"
          >
            Already have an account? Sign In
          </button>
        </div>
      </MobileLayout>
    );
  }

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Account',
      items: [
        { id: 'personal', icon: User, label: 'Personal Information', subtitle: 'Name, email, phone' },
        { id: 'dietary', icon: Heart, label: 'Dietary Preferences', subtitle: 'Allergies, diet type' },
        { id: 'payment', icon: CreditCard, label: 'Payment Methods', subtitle: 'Cards, wallet' },
      ],
    },
    {
      title: 'Loyalty',
      items: [
        { id: 'tier', icon: Star, label: 'Membership Tier', rightElement: (
          <span className="bg-amber-100 text-amber-700 text-sm font-medium px-3 py-1 rounded-full">
            {user?.membershipTier?.toUpperCase() || 'GOLD'}
          </span>
        )},
        { id: 'points', icon: Star, label: 'Loyalty Points', subtitle: `${user?.loyaltyPoints || 500} points` },
      ],
    },
    {
      title: 'Settings',
      items: [
        { id: 'notifications', icon: Bell, label: 'Notifications' },
        { id: 'language', icon: Globe, label: 'Language', subtitle: 'English' },
        { id: 'privacy', icon: Shield, label: 'Privacy & Security' },
      ],
    },
    {
      title: 'Support',
      items: [
        { id: 'help', icon: HelpCircle, label: 'Help Center' },
        { id: 'logout', icon: LogOut, label: 'Log Out', danger: true, onClick: handleLogout },
      ],
    },
  ];

  return (
    <MobileLayout>
      <div className="px-4 pt-4 pb-6 space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{user?.name || 'Guest User'}</h1>
            <p className="text-gray-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {user?.membershipTier?.toUpperCase() || 'GOLD'} Member
              </span>
            </div>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-100">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <QRCodeSVG 
                value={user?.customerCode || 'CLI-DEMO01'} 
                size={72}
                level="M"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <QrCode className="w-4 h-4 text-primary" />
                <span className="text-sm text-gray-600">Loyalty Code</span>
              </div>
              <p className="text-2xl font-bold text-primary tracking-wider">
                {user?.customerCode || 'CLI-DEMO01'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Show this code at restaurants for payments & discounts
              </p>
            </div>
          </div>
        </div>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <section key={section.title} className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide px-1">
              {section.title}
            </h3>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {section.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className={cn(
                      "w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors",
                      index !== section.items.length - 1 && "border-b border-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        item.danger ? "bg-red-50" : "bg-gray-100"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          item.danger ? "text-red-500" : "text-gray-600"
                        )} />
                      </div>
                      <div className="text-left">
                        <p className={cn(
                          "font-medium",
                          item.danger ? "text-red-500" : "text-gray-900"
                        )}>
                          {item.label}
                        </p>
                        {item.subtitle && (
                          <p className="text-sm text-gray-500">{item.subtitle}</p>
                        )}
                      </div>
                    </div>
                    {item.rightElement || (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        {/* App Version */}
        <p className="text-center text-sm text-gray-400 pt-4">
          EatOff v1.0.0
        </p>
      </div>
    </MobileLayout>
  );
}
