import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  User, ChevronRight, ChevronDown, Settings, Bell, CreditCard, Heart, 
  HelpCircle, LogOut, Star, Shield, Globe, QrCode, Check, X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient, clearMobileSessionToken } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface MenuItem {
  id: string;
  icon: any;
  label: string;
  subtitle?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
  expandable?: boolean;
}

export default function MobileProfile() {
  const { t, language, setLanguage } = useLanguage();
  const { user, isLoading, refetch } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [selectedDiet, setSelectedDiet] = useState<string>('');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [notificationSettings, setNotificationSettings] = useState({
    push: true,
    email: true,
    promo: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDietary, setIsSavingDietary] = useState(false);
  const { toast } = useToast();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      clearMobileSessionToken();
      await apiRequest('POST', '/api/auth/logout');
      queryClient.clear();
      setLocation('/m/signin');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
      setEditingField(null);
    } else {
      setExpandedSection(sectionId);
      if (sectionId === 'personal' && user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
        });
      }
      if (sectionId === 'dietary' && user) {
        const prefs = user.dietaryPreferences || [];
        setSelectedDiet(prefs[0] || '');
        setSelectedAllergies(user.allergies || []);
      }
    }
  };

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies(prev => 
      prev.includes(allergy) 
        ? prev.filter(a => a !== allergy)
        : [...prev, allergy]
    );
  };

  const handleSaveDietary = async () => {
    setIsSavingDietary(true);
    try {
      await apiRequest('PATCH', '/api/auth/profile', {
        dietaryPreferences: selectedDiet ? [selectedDiet] : [],
        allergies: selectedAllergies,
      });
      await refetch();
      toast({ title: t.changesSaved || 'Changes saved' });
    } catch (error) {
      toast({ title: t.errorSaving || 'Error saving', variant: 'destructive' });
    } finally {
      setIsSavingDietary(false);
    }
  };

  const handleSavePersonalInfo = async () => {
    setIsSaving(true);
    try {
      await apiRequest('PATCH', '/api/auth/profile', formData);
      await refetch();
      toast({ title: t.changesSaved || 'Changes saved' });
      setEditingField(null);
    } catch (error) {
      toast({ title: t.errorSaving || 'Error saving', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !isLoggingOut) {
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
            onClick={() => setLocation('/m/signin')}
            className="w-full max-w-xs bg-primary text-white font-semibold py-4 px-6 rounded-2xl mb-3 hover:bg-primary/90 transition-colors"
          >
            {t.signIn}
          </button>
          <button
            onClick={() => setLocation('/m/signin')}
            className="w-full max-w-xs bg-gray-100 text-gray-700 font-medium py-4 px-6 rounded-2xl hover:bg-gray-200 transition-colors"
          >
            {t.alreadyHaveAccount}
          </button>
        </div>
      </MobileLayout>
    );
  }

  const renderPersonalInfoContent = () => (
    <div className="p-4 space-y-4 bg-gray-50 border-t border-gray-100">
      <div>
        <label className="text-sm text-gray-500 block mb-1">{t.name || 'Name'}</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>
      <div>
        <label className="text-sm text-gray-500 block mb-1">{t.email || 'Email'}</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
          disabled
        />
        <p className="text-xs text-gray-400 mt-1">{t.emailCannotChange || 'Email cannot be changed'}</p>
      </div>
      <div>
        <label className="text-sm text-gray-500 block mb-1">{t.phone || 'Phone'}</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="+40 xxx xxx xxx"
        />
      </div>
      <button
        onClick={handleSavePersonalInfo}
        disabled={isSaving}
        className="w-full bg-primary text-white font-medium py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isSaving ? (t.saving || 'Saving...') : (t.saveChanges || 'Save Changes')}
      </button>
    </div>
  );

  const renderDietaryContent = () => (
    <div className="p-4 space-y-4 bg-gray-50 border-t border-gray-100">
      <p className="text-sm text-gray-600">{t.selectDietaryPreferences || 'Select your dietary preferences to get personalized recommendations.'}</p>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{t.dietType || 'Diet Type'}</label>
        <div className="grid grid-cols-2 gap-2">
          {['Standard', 'Vegetarian', 'Vegan', 'Pescatarian'].map((diet) => (
            <button
              key={diet}
              type="button"
              onClick={() => setSelectedDiet(diet.toLowerCase())}
              className={cn(
                "p-3 border rounded-xl text-sm transition-colors",
                selectedDiet === diet.toLowerCase()
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-gray-200 hover:border-primary hover:bg-primary/5"
              )}
            >
              {diet}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{t.allergies || 'Allergies'}</label>
        <div className="flex flex-wrap gap-2">
          {['Gluten', 'Dairy', 'Nuts', 'Shellfish', 'Eggs', 'Soy'].map((allergy) => (
            <button
              key={allergy}
              type="button"
              onClick={() => toggleAllergy(allergy.toLowerCase())}
              className={cn(
                "px-4 py-2 border rounded-full text-sm transition-colors",
                selectedAllergies.includes(allergy.toLowerCase())
                  ? "border-red-400 bg-red-50 text-red-600 font-medium"
                  : "border-gray-200 hover:border-red-400 hover:bg-red-50 hover:text-red-600"
              )}
            >
              {allergy}
            </button>
          ))}
        </div>
      </div>

      <button 
        type="button"
        onClick={handleSaveDietary}
        disabled={isSavingDietary}
        className="w-full bg-primary text-white font-medium py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isSavingDietary ? (t.saving || 'Saving...') : (t.savePreferences || 'Save Preferences')}
      </button>
    </div>
  );

  const renderPaymentContent = () => (
    <div className="p-4 space-y-4 bg-gray-50 border-t border-gray-100">
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-blue-400 rounded" />
            <div>
              <p className="font-medium">•••• •••• •••• 4242</p>
              <p className="text-xs text-gray-500">Expires 12/25</p>
            </div>
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{t.default || 'Default'}</span>
        </div>
      </div>

      <button className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary hover:text-primary transition-colors">
        <CreditCard className="w-5 h-5" />
        <span>{t.addNewCard || 'Add New Card'}</span>
      </button>
    </div>
  );

  const renderNotificationsContent = () => (
    <div className="p-4 space-y-4 bg-gray-50 border-t border-gray-100">
      {[
        { id: 'push', label: t.pushNotifications || 'Push Notifications', desc: t.pushDesc || 'Receive alerts on your device' },
        { id: 'email', label: t.emailNotifications || 'Email Notifications', desc: t.emailDesc || 'Get updates via email' },
        { id: 'promo', label: t.promotions || 'Promotions & Offers', desc: t.promoDesc || 'Special deals and discounts' },
      ].map((item) => (
        <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
          <div>
            <p className="font-medium text-gray-900">{item.label}</p>
            <p className="text-sm text-gray-500">{item.desc}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      ))}
    </div>
  );

  const renderLanguageContent = () => (
    <div className="p-4 space-y-2 bg-gray-50 border-t border-gray-100">
      {[
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'ro', name: 'Română', flag: '🇷🇴' },
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
        { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      ].map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code as any)}
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-xl transition-colors",
            language === lang.code 
              ? "bg-primary/10 border-2 border-primary" 
              : "bg-white border border-gray-200 hover:border-primary/50"
          )}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{lang.flag}</span>
            <span className="font-medium">{lang.name}</span>
          </div>
          {language === lang.code && (
            <Check className="w-5 h-5 text-primary" />
          )}
        </button>
      ))}
    </div>
  );

  const renderPrivacyContent = () => (
    <div className="p-4 space-y-4 bg-gray-50 border-t border-gray-100">
      <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
        <h4 className="font-medium text-gray-900">{t.dataPrivacy || 'Data & Privacy'}</h4>
        <button className="w-full text-left text-sm text-primary hover:underline">
          {t.downloadData || 'Download my data'}
        </button>
        <button className="w-full text-left text-sm text-red-500 hover:underline">
          {t.deleteAccount || 'Delete my account'}
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
        <h4 className="font-medium text-gray-900">{t.security || 'Security'}</h4>
        <button className="w-full text-left text-sm text-primary hover:underline">
          {t.changePassword || 'Change password'}
        </button>
        <button className="w-full text-left text-sm text-primary hover:underline">
          {t.twoFactorAuth || 'Enable two-factor authentication'}
        </button>
      </div>
    </div>
  );

  const renderHelpContent = () => (
    <div className="p-4 space-y-3 bg-gray-50 border-t border-gray-100">
      {[
        { label: t.faq || 'FAQ', icon: HelpCircle },
        { label: t.contactSupport || 'Contact Support', icon: User },
        { label: t.termsOfService || 'Terms of Service', icon: Shield },
        { label: t.privacyPolicy || 'Privacy Policy', icon: Shield },
      ].map((item) => (
        <button
          key={item.label}
          className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/50 transition-colors"
        >
          <item.icon className="w-5 h-5 text-gray-400" />
          <span className="font-medium text-gray-900">{item.label}</span>
          <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
        </button>
      ))}
    </div>
  );

  const renderExpandedContent = (id: string) => {
    switch (id) {
      case 'personal': return renderPersonalInfoContent();
      case 'dietary': return renderDietaryContent();
      case 'payment': return renderPaymentContent();
      case 'notifications': return renderNotificationsContent();
      case 'language': return renderLanguageContent();
      case 'privacy': return renderPrivacyContent();
      case 'help': return renderHelpContent();
      default: return null;
    }
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: t.account || 'Account',
      items: [
        { id: 'personal', icon: User, label: t.personalInfo || 'Personal Information', subtitle: t.personalInfoSub || 'Name, email, phone', expandable: true },
        { id: 'dietary', icon: Heart, label: t.dietaryPreferences || 'Dietary Preferences', subtitle: t.dietarySub || 'Allergies, diet type', expandable: true },
        { id: 'payment', icon: CreditCard, label: t.paymentMethods || 'Payment Methods', subtitle: t.paymentSub || 'Cards, wallet', expandable: true },
      ],
    },
    {
      title: t.loyalty || 'Loyalty',
      items: [
        { id: 'tier', icon: Star, label: t.membershipTier || 'Membership Tier', rightElement: (
          <span className="bg-amber-100 text-amber-700 text-sm font-medium px-3 py-1 rounded-full">
            {user?.membershipTier?.toUpperCase() || 'GOLD'}
          </span>
        )},
        { id: 'points', icon: Star, label: t.loyaltyPoints || 'Loyalty Points', subtitle: `${user?.loyaltyPoints || 0} ${t.points || 'points'}` },
      ],
    },
    {
      title: t.settings || 'Settings',
      items: [
        { id: 'notifications', icon: Bell, label: t.notifications || 'Notifications', expandable: true },
        { id: 'language', icon: Globe, label: t.language || 'Language', subtitle: language.toUpperCase(), expandable: true },
        { id: 'privacy', icon: Shield, label: t.privacySecurity || 'Privacy & Security', expandable: true },
      ],
    },
    {
      title: t.support || 'Support',
      items: [
        { id: 'help', icon: HelpCircle, label: t.helpCenter || 'Help Center', expandable: true },
        { id: 'logout', icon: LogOut, label: t.logOut || 'Log Out', danger: true, onClick: handleLogout },
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
                <span className="text-sm text-gray-600">{t.loyaltyCode || 'Loyalty Code'}</span>
              </div>
              <p className="text-2xl font-bold text-primary tracking-wider">
                {user?.customerCode || 'CLI-DEMO01'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t.showCodeAtRestaurants || 'Show this code at restaurants for payments & discounts'}
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
                const isExpanded = expandedSection === item.id;
                const handleClick = item.onClick || (item.expandable ? () => toggleSection(item.id) : undefined);
                
                return (
                  <div key={item.id}>
                    <button
                      onClick={handleClick}
                      className={cn(
                        "w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors",
                        index !== section.items.length - 1 && !isExpanded && "border-b border-gray-100"
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
                        item.expandable ? (
                          isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )
                      )}
                    </button>
                    {isExpanded && item.expandable && renderExpandedContent(item.id)}
                  </div>
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
