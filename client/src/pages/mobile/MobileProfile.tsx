import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  User, ChevronRight, ChevronDown, Settings, Bell, CreditCard, Heart, 
  HelpCircle, LogOut, Star, Shield, Globe, QrCode, Check, X, Trash2, Loader2,
  Eye, EyeOff
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient, clearMobileSessionToken } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

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
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [swipedCardId, setSwipedCardId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Privacy & Security states
  const [privacyView, setPrivacyView] = useState<'main' | 'changePassword' | 'setup2fa' | 'deleteAccount'>('main');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [twoFaCode, setTwoFaCode] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSettingUp2fa, setIsSettingUp2fa] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [twoFaSecret, setTwoFaSecret] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  // Fetch payment methods from Stripe - user.id is the customer's numeric ID
  const { data: paymentMethodsData, isLoading: isLoadingPaymentMethods, refetch: refetchPaymentMethods } = useQuery<{ paymentMethods: PaymentMethod[] }>({
    queryKey: ['/api/customers', user?.id, 'payment-methods'],
    enabled: !!user?.id && expandedSection === 'payment',
  });

  const paymentMethods = paymentMethodsData?.paymentMethods || [];

  // Delete payment method mutation
  const deletePaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      return await apiRequest('DELETE', `/api/payment-methods/${paymentMethodId}`);
    },
    onSuccess: () => {
      toast({ title: t.cardDeleted || 'Card deleted successfully' });
      refetchPaymentMethods();
      setDeleteConfirmId(null);
      setSwipedCardId(null);
    },
    onError: () => {
      toast({ title: t.errorDeletingCard || 'Error deleting card', variant: 'destructive' });
    },
  });

  const handleDeleteCard = (paymentMethodId: string) => {
    setDeleteConfirmId(paymentMethodId);
  };

  const confirmDeleteCard = () => {
    if (deleteConfirmId) {
      deletePaymentMethodMutation.mutate(deleteConfirmId);
    }
  };

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
      if (sectionId === 'notifications' && user) {
        setNotificationSettings({
          push: user.notifyPush !== false,
          email: user.notifyEmail !== false,
          promo: user.notifyPromo !== false,
        });
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

  const handleDownloadData = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/auth/download-data', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('mobileSessionToken') || ''}`,
        },
      });
      if (!response.ok) throw new Error('Failed to download');
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eatoff-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: t.dataDownloaded || 'Data downloaded successfully' });
    } catch (error) {
      toast({ title: t.errorDownloading || 'Error downloading data', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: t.passwordMismatch || 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast({ title: t.passwordTooShort || 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }
    setIsChangingPassword(true);
    try {
      await apiRequest('POST', '/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast({ title: t.passwordChanged || 'Password changed successfully' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPrivacyView('main');
    } catch (error: any) {
      toast({ title: error.message || t.errorChangingPassword || 'Error changing password', variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSetup2fa = async () => {
    setIsSettingUp2fa(true);
    try {
      const response = await apiRequest('POST', '/api/auth/2fa/setup');
      const data = await response.json();
      setTwoFaSecret(data.secret);
      toast({ title: t.twoFaSetupStarted || '2FA setup started. Enter a 6-digit code to verify.' });
    } catch (error: any) {
      toast({ title: error.message || t.errorSettingUp2fa || 'Error setting up 2FA', variant: 'destructive' });
    } finally {
      setIsSettingUp2fa(false);
    }
  };

  const handleVerify2fa = async () => {
    if (twoFaCode.length !== 6) {
      toast({ title: t.enterValidCode || 'Please enter a 6-digit code', variant: 'destructive' });
      return;
    }
    setIsSettingUp2fa(true);
    try {
      await apiRequest('POST', '/api/auth/2fa/verify', { code: twoFaCode });
      toast({ title: t.twoFaEnabled || '2FA enabled successfully' });
      setTwoFaCode('');
      setTwoFaSecret(null);
      setPrivacyView('main');
      refetch();
    } catch (error: any) {
      toast({ title: error.message || t.errorVerifying2fa || 'Error verifying 2FA', variant: 'destructive' });
    } finally {
      setIsSettingUp2fa(false);
    }
  };

  const handleDisable2fa = async () => {
    // For users with password, require password; for OAuth users, require 2FA code
    const hasPassword = user?.passwordHash;
    if (hasPassword && !passwordForm.currentPassword) {
      toast({ title: t.passwordRequired || 'Password is required', variant: 'destructive' });
      return;
    }
    if (!hasPassword && twoFaCode.length !== 6) {
      toast({ title: t.enterValidCode || 'Please enter a 6-digit code', variant: 'destructive' });
      return;
    }
    
    setIsSettingUp2fa(true);
    try {
      const payload = hasPassword 
        ? { password: passwordForm.currentPassword }
        : { code: twoFaCode };
      await apiRequest('POST', '/api/auth/2fa/disable', payload);
      toast({ title: t.twoFaDisabled || '2FA disabled successfully' });
      setPrivacyView('main');
      setTwoFaCode('');
      setPasswordForm({ ...passwordForm, currentPassword: '' });
      refetch();
    } catch (error: any) {
      toast({ title: error.message || t.errorDisabling2fa || 'Error disabling 2FA', variant: 'destructive' });
    } finally {
      setIsSettingUp2fa(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast({ title: t.typeDeleteToConfirm || 'Type DELETE to confirm', variant: 'destructive' });
      return;
    }
    setIsDeletingAccount(true);
    try {
      await apiRequest('DELETE', '/api/auth/account', {
        password: passwordForm.currentPassword,
        confirmDelete: 'DELETE',
      });
      toast({ title: t.accountDeleted || 'Account deleted successfully' });
      clearMobileSessionToken();
      queryClient.clear();
      setLocation('/m/signin');
    } catch (error: any) {
      toast({ title: error.message || t.errorDeletingAccount || 'Error deleting account', variant: 'destructive' });
    } finally {
      setIsDeletingAccount(false);
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

  const getCardBrandColor = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa': return 'from-blue-600 to-blue-400';
      case 'mastercard': return 'from-red-500 to-orange-400';
      case 'amex': return 'from-blue-800 to-blue-600';
      default: return 'from-gray-600 to-gray-400';
    }
  };

  const renderPaymentContent = () => (
    <div className="p-4 space-y-4 bg-gray-50 border-t border-gray-100">
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{t.deleteCard || 'Delete Card?'}</h3>
              <p className="text-sm text-gray-500 mt-1">{t.deleteCardConfirm || 'Are you sure you want to delete this payment method?'}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t.cancel || 'Cancel'}
              </button>
              <button
                onClick={confirmDeleteCard}
                disabled={deletePaymentMethodMutation.isPending}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {deletePaymentMethodMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {t.delete || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoadingPaymentMethods ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : paymentMethods.length === 0 ? (
        <div className="text-center py-6">
          <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">{t.noPaymentMethods || 'No payment methods saved'}</p>
          <p className="text-sm text-gray-400 mt-1">{t.addCardHint || 'Add a card to make payments easier'}</p>
        </div>
      ) : (
        paymentMethods.map((card) => (
          <div
            key={card.id}
            className="relative overflow-hidden rounded-xl"
          >
            {/* Swipe delete background */}
            <div 
              className={cn(
                "absolute inset-y-0 right-0 bg-red-500 flex items-center justify-end pr-4 transition-all duration-200",
                swipedCardId === card.id ? "w-20" : "w-0"
              )}
            >
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            
            {/* Card content */}
            <div
              className={cn(
                "bg-white p-4 border border-gray-200 flex items-center justify-between transition-transform duration-200 cursor-pointer",
                swipedCardId === card.id ? "-translate-x-20" : "translate-x-0"
              )}
              onClick={() => {
                if (swipedCardId === card.id) {
                  handleDeleteCard(card.id);
                }
              }}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                (e.currentTarget as any).startX = touch.clientX;
              }}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                const startX = (e.currentTarget as any).startX;
                const diff = startX - touch.clientX;
                if (diff > 50) {
                  setSwipedCardId(card.id);
                } else if (diff < -30) {
                  setSwipedCardId(null);
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-6 bg-gradient-to-r rounded", getCardBrandColor(card.brand))} />
                <div>
                  <p className="font-medium">•••• •••• •••• {card.last4}</p>
                  <p className="text-xs text-gray-500">{t.expires || 'Expires'} {card.expMonth}/{card.expYear}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {card.isDefault && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{t.default || 'Default'}</span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCard(card.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      <button className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary hover:text-primary transition-colors">
        <CreditCard className="w-5 h-5" />
        <span>{t.addNewCard || 'Add New Card'}</span>
      </button>
    </div>
  );

  const toggleNotification = (key: 'push' | 'email' | 'promo') => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      await apiRequest('PATCH', '/api/auth/profile', {
        notifyPush: notificationSettings.push,
        notifyEmail: notificationSettings.email,
        notifyPromo: notificationSettings.promo,
      });
      await refetch();
      toast({ title: t.changesSaved || 'Changes saved' });
    } catch (error) {
      toast({ title: t.errorSaving || 'Error saving', variant: 'destructive' });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const renderNotificationsContent = () => (
    <div className="p-4 space-y-4 bg-gray-50 border-t border-gray-100">
      {[
        { id: 'push' as const, label: t.pushNotifications || 'Push Notifications', desc: t.pushDesc || 'Receive alerts on your device' },
        { id: 'email' as const, label: t.emailNotifications || 'Email Notifications', desc: t.emailDesc || 'Get updates via email' },
        { id: 'promo' as const, label: t.promotions || 'Promotions & Offers', desc: t.promoDesc || 'Special deals and discounts' },
      ].map((item) => (
        <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
          <div>
            <p className="font-medium text-gray-900">{item.label}</p>
            <p className="text-sm text-gray-500">{item.desc}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={notificationSettings[item.id]}
              onChange={() => toggleNotification(item.id)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      ))}
      <button
        type="button"
        onClick={handleSaveNotifications}
        disabled={isSavingNotifications}
        className="w-full bg-primary text-white font-medium py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isSavingNotifications ? (t.saving || 'Saving...') : (t.saveChanges || 'Save Changes')}
      </button>
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

  const renderPrivacyContent = () => {
    if (privacyView === 'changePassword') {
      return (
        <div className="p-4 space-y-4 bg-gray-50 border-t border-gray-100">
          <button onClick={() => setPrivacyView('main')} className="flex items-center gap-2 text-primary text-sm mb-2">
            <ChevronRight className="w-4 h-4 rotate-180" />
            {t.back || 'Back'}
          </button>
          <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
            <h4 className="font-medium text-gray-900">{t.changePassword || 'Change Password'}</h4>
            {user?.passwordHash && (
              <div>
                <label className="text-sm text-gray-500 block mb-1">{t.currentPassword || 'Current Password'}</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full p-3 pr-12 border border-gray-200 rounded-xl bg-white"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-500 block mb-1">{t.newPassword || 'New Password'}</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full p-3 pr-12 border border-gray-200 rounded-xl bg-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-1">{t.confirmPassword || 'Confirm Password'}</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full p-3 pr-12 border border-gray-200 rounded-xl bg-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="w-full bg-primary text-white font-medium py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isChangingPassword ? (t.saving || 'Saving...') : (t.changePassword || 'Change Password')}
            </button>
          </div>
        </div>
      );
    }

    if (privacyView === 'setup2fa') {
      return (
        <div className="p-4 space-y-4 bg-gray-50 border-t border-gray-100">
          <button onClick={() => { setPrivacyView('main'); setTwoFaSecret(null); setTwoFaCode(''); }} className="flex items-center gap-2 text-primary text-sm mb-2">
            <ChevronRight className="w-4 h-4 rotate-180" />
            {t.back || 'Back'}
          </button>
          <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
            <h4 className="font-medium text-gray-900">{t.twoFactorAuth || 'Two-Factor Authentication'}</h4>
            
            {user?.twoFactorEnabled ? (
              <>
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">{t.twoFaEnabled || '2FA is enabled'}</span>
                </div>
                {user?.passwordHash ? (
                  <>
                    <p className="text-sm text-gray-500">{t.twoFaDisableInfo || 'Enter your password to disable 2FA.'}</p>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full p-3 pr-12 border border-gray-200 rounded-xl bg-white"
                        placeholder={t.password || 'Password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-500">{t.twoFaDisableCodeInfo || 'Enter your authenticator code to disable 2FA.'}</p>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={twoFaCode}
                      onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full p-3 border border-gray-200 rounded-xl bg-white text-center text-2xl tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </>
                )}
                <button
                  onClick={handleDisable2fa}
                  disabled={isSettingUp2fa || (user?.passwordHash ? !passwordForm.currentPassword : twoFaCode.length !== 6)}
                  className="w-full bg-red-500 text-white font-medium py-3 rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {isSettingUp2fa ? (t.saving || 'Saving...') : (t.disable2fa || 'Disable 2FA')}
                </button>
              </>
            ) : twoFaSecret ? (
              <>
                <p className="text-sm text-gray-600">{t.twoFaVerifyInfo || 'Scan the QR code with Google Authenticator or copy the secret key manually.'}</p>
                <div className="flex flex-col items-center bg-white p-4 rounded-xl border border-gray-200">
                  <QRCodeSVG 
                    value={`otpauth://totp/EatOff:${encodeURIComponent(user?.email || 'user')}?secret=${twoFaSecret}&issuer=EatOff`}
                    size={180}
                    level="M"
                    includeMargin={true}
                  />
                  <p className="text-xs text-gray-500 mt-2">{t.scanWithAuthenticator || 'Scan with Google Authenticator'}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">{t.orCopySecretKey || 'Or copy secret key manually'}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono break-all text-gray-800">{twoFaSecret}</code>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(twoFaSecret);
                          toast({ 
                            title: '✓ ' + (t.copied || 'Copied!'),
                            description: t.secretKeyCopied || 'Secret key copied to clipboard'
                          });
                        } catch (err) {
                          toast({ title: t.copyFailed || 'Failed to copy', variant: 'destructive' });
                        }
                      }}
                      className="px-3 py-1 text-xs bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                      {t.copy || 'Copy'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">{t.verificationCode || 'Verification Code'}</label>
                  <input
                    type="text"
                    value={twoFaCode}
                    onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full p-3 border border-gray-200 rounded-xl bg-white text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
                <button
                  onClick={handleVerify2fa}
                  disabled={isSettingUp2fa || twoFaCode.length !== 6}
                  className="w-full bg-primary text-white font-medium py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isSettingUp2fa ? (t.verifying || 'Verifying...') : (t.verify || 'Verify & Enable')}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">{t.twoFaInfo || 'Add an extra layer of security to your account.'}</p>
                <button
                  onClick={handleSetup2fa}
                  disabled={isSettingUp2fa}
                  className="w-full bg-primary text-white font-medium py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isSettingUp2fa ? (t.settingUp || 'Setting up...') : (t.setup2fa || 'Setup 2FA')}
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    if (privacyView === 'deleteAccount') {
      return (
        <div className="p-4 space-y-4 bg-gray-50 border-t border-gray-100">
          <button onClick={() => setPrivacyView('main')} className="flex items-center gap-2 text-primary text-sm mb-2">
            <ChevronRight className="w-4 h-4 rotate-180" />
            {t.back || 'Back'}
          </button>
          <div className="bg-white rounded-xl p-4 border border-red-200 space-y-4">
            <h4 className="font-medium text-red-600">{t.deleteAccount || 'Delete Account'}</h4>
            <div className="bg-red-50 p-3 rounded-xl">
              <p className="text-sm text-red-700">{t.deleteAccountWarning || 'This action is permanent and cannot be undone. All your data will be deleted.'}</p>
            </div>
            {user?.passwordHash && (
              <div>
                <label className="text-sm text-gray-500 block mb-1">{t.password || 'Password'}</label>
                <div className="relative">
                  <input
                    type={showDeletePassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full p-3 pr-12 border border-gray-200 rounded-xl bg-white"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showDeletePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-500 block mb-1">{t.typeDeleteToConfirm || 'Type DELETE to confirm'}</label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                className="w-full p-3 border border-gray-200 rounded-xl bg-white"
                placeholder="DELETE"
              />
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
              className="w-full bg-red-600 text-white font-medium py-3 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isDeletingAccount ? (t.deleting || 'Deleting...') : (t.permanentlyDelete || 'Permanently Delete Account')}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4 bg-gray-50 border-t border-gray-100">
        <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
          <h4 className="font-medium text-gray-900">{t.dataPrivacy || 'Data & Privacy'}</h4>
          <button 
            onClick={handleDownloadData}
            disabled={isDownloading}
            className="w-full text-left text-sm text-primary hover:underline flex items-center gap-2"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isDownloading ? (t.downloading || 'Downloading...') : (t.downloadData || 'Download my data')}
          </button>
          <button 
            onClick={() => setPrivacyView('deleteAccount')}
            className="w-full text-left text-sm text-red-500 hover:underline"
          >
            {t.deleteAccount || 'Delete my account'}
          </button>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
          <h4 className="font-medium text-gray-900">{t.security || 'Security'}</h4>
          <button 
            onClick={() => setPrivacyView('changePassword')}
            className="w-full text-left text-sm text-primary hover:underline"
          >
            {t.changePassword || 'Change password'}
          </button>
          <button 
            onClick={() => setPrivacyView('setup2fa')}
            className="w-full text-left text-sm text-primary hover:underline flex items-center gap-2"
          >
            {t.twoFactorAuth || 'Two-factor authentication'}
            {user?.twoFactorEnabled && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t.enabled || 'Enabled'}</span>
            )}
          </button>
        </div>
      </div>
    );
  };

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

  const renderLoyaltyPointsContent = () => (
    <div className="p-4 space-y-4 bg-gray-50 border-t border-gray-100">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">{t.currentPoints || 'Current Points'}</span>
          <span className="text-2xl font-bold text-amber-600">{user?.loyaltyPoints || 0}</span>
        </div>
        <div className="w-full bg-amber-200 rounded-full h-2">
          <div 
            className="bg-amber-500 h-2 rounded-full transition-all" 
            style={{ width: `${Math.min((user?.loyaltyPoints || 0) / 1000 * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">{1000 - (user?.loyaltyPoints || 0)} {t.pointsToNextReward || 'points to next reward'}</p>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">{t.howToEarn || 'How to earn points'}</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full" />
            {t.earnPerOrder || '1 point for every 1 RON spent'}
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full" />
            {t.earnBonus || 'Bonus points on special promotions'}
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full" />
            {t.earnReferral || '100 points for each friend referred'}
          </li>
        </ul>
      </div>

      <button
        onClick={() => setLocation('/m/wallet')}
        className="w-full bg-primary text-white font-medium py-3 rounded-xl hover:bg-primary/90 transition-colors"
      >
        {t.viewWallet || 'View Wallet'}
      </button>
    </div>
  );

  const renderTierContent = () => (
    <div className="p-4 space-y-4 bg-gray-50 border-t border-gray-100">
      <div className="grid grid-cols-3 gap-2">
        {['bronze', 'silver', 'gold'].map((tier) => (
          <div 
            key={tier}
            className={cn(
              "p-3 rounded-xl text-center border-2 transition-colors",
              user?.membershipTier === tier 
                ? "border-amber-400 bg-amber-50" 
                : "border-gray-200 bg-white opacity-60"
            )}
          >
            <div className={cn(
              "text-2xl mb-1",
              tier === 'bronze' && "text-amber-700",
              tier === 'silver' && "text-gray-400",
              tier === 'gold' && "text-amber-500"
            )}>
              {tier === 'bronze' && '🥉'}
              {tier === 'silver' && '🥈'}
              {tier === 'gold' && '🥇'}
            </div>
            <p className="text-xs font-medium capitalize">{tier}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">{t.tierBenefits || 'Your Benefits'}</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            {t.benefitDiscount || '5% cashback on all orders'}
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            {t.benefitPriority || 'Priority support'}
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            {t.benefitExclusive || 'Exclusive offers'}
          </li>
        </ul>
      </div>
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
      case 'points': return renderLoyaltyPointsContent();
      case 'tier': return renderTierContent();
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
        { id: 'tier', icon: Star, label: t.membershipTier || 'Membership Tier', subtitle: user?.membershipTier?.toUpperCase() || 'GOLD', expandable: true },
        { id: 'points', icon: Star, label: t.loyaltyPoints || 'Loyalty Points', subtitle: `${user?.loyaltyPoints || 0} ${t.points || 'points'}`, expandable: true },
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
