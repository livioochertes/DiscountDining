import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import eatoffLogo from '@assets/EatOff_Logo_1769386471015.png';

const isNativePlatform = Capacitor.isNativePlatform();
const API_BASE_URL = import.meta.env.VITE_API_URL || (isNativePlatform ? 'https://eatoff.app' : '');
const DEFAULT_STATUS_BAR_HEIGHT = 44;

export default function MobileSignUp() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [statusBarHeight, setStatusBarHeight] = useState(DEFAULT_STATUS_BAR_HEIGHT);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    async function getStatusBarHeight() {
      if (isNative) {
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
  }, [isNative]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: t.registrationSuccess || 'Înregistrare reușită!',
          description: t.verifyEmailSent || 'Verifică-ți emailul pentru a confirma contul.',
        });
        
        setLocation('/m/signin');
      } else {
        toast({
          title: t.registrationFailed || 'Înregistrare eșuată',
          description: data.message || t.somethingWentWrong,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t.error,
        description: t.somethingWentWrong,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const topPadding = isNative ? statusBarHeight : 0;

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#F8F7F4' }}
    >
      <div 
        className="flex items-center px-4 py-3"
        style={{ paddingTop: topPadding + 12 }}
      >
        <button 
          onClick={() => setLocation('/m')}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
      </div>

      <div className="flex-1 flex flex-col px-6">
        <div className="text-center py-8">
          <img 
            src={eatoffLogo} 
            alt="EatOff" 
            className="h-16 mx-auto mb-6"
          />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.createAccount || 'Creează cont'}</h2>
          <p className="text-gray-500">{t.joinEatOff || 'Alătură-te EatOff pentru oferte exclusive'}</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-5 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t.name || 'Nume'}</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                name="name"
                type="text"
                placeholder={t.yourName || 'Numele tău'}
                value={formData.name}
                onChange={handleInputChange}
                className="pl-12 h-14 text-base rounded-xl bg-white border-gray-200 focus:border-amber-500 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                name="email"
                type="email"
                placeholder="email@exemplu.com"
                value={formData.email}
                onChange={handleInputChange}
                className="pl-12 h-14 text-base rounded-xl bg-white border-gray-200 focus:border-amber-500 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t.password}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                className="pl-12 pr-12 h-14 text-base rounded-xl bg-white border-gray-200 focus:border-amber-500 focus:ring-amber-500"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-base font-semibold rounded-xl text-white shadow-lg"
            style={{ backgroundColor: '#1A1A1A' }}
          >
            {isLoading ? (t.loading || 'Se încarcă...') : (t.signUp || 'Înregistrează-te')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500">
            {t.alreadyHaveAccount || 'Ai deja cont?'}{' '}
            <button
              onClick={() => setLocation('/m/signin')}
              className="font-semibold hover:underline"
              style={{ color: '#F5A623' }}
            >
              {t.signIn || 'Conectare'}
            </button>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400 max-w-xs mx-auto">
          {t.termsAgreement || 'Continuând, ești de acord cu Termenii și Condițiile și Politica de Confidențialitate'}
        </p>
      </div>
    </div>
  );
}
