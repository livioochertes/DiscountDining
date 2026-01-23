import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const DEFAULT_STATUS_BAR_HEIGHT = 40;

export default function MobileSignIn() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [statusBarHeight, setStatusBarHeight] = useState(DEFAULT_STATUS_BAR_HEIGHT);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const isNative = Capacitor.isNativePlatform();
  const isAndroid = Capacitor.getPlatform() === 'android';

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
  }, [isAndroid, isNative]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        toast({
          title: "Autentificare reușită",
          description: "Bine ai revenit!",
        });
        
        setTimeout(() => {
          setLocation('/m');
        }, 100);
      } else {
        toast({
          title: "Autentificare eșuată",
          description: data.message || "Email sau parolă incorectă",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Eroare",
        description: "Ceva nu a mers. Încearcă din nou.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const fillDemoCredentials = () => {
    setFormData({
      email: 'demo@example.com',
      password: 'DemoPassword123!'
    });
  };

  const topPadding = isAndroid && isNative ? statusBarHeight : 0;

  return (
    <div 
      className="min-h-screen bg-white flex flex-col"
      style={{ paddingTop: topPadding }}
    >
      <div className="flex items-center px-4 py-3 border-b border-gray-100">
        <button 
          onClick={() => setLocation('/m')}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900 pr-8">
          Autentificare
        </h1>
      </div>

      <div className="flex-1 px-6 py-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-3xl font-bold">E</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bine ai venit!</h2>
          <p className="text-gray-500">Conectează-te pentru a accesa contul tău</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
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
                className="pl-12 h-14 text-base rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Parolă</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Introdu parola"
                value={formData.password}
                onChange={handleInputChange}
                className="pl-12 pr-12 h-14 text-base rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 text-base font-semibold rounded-xl bg-teal-500 hover:bg-teal-600"
            disabled={isLoading}
          >
            {isLoading ? "Se conectează..." : "Conectare"}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm font-medium text-blue-900 mb-2">Cont Demo</p>
          <p className="text-xs text-blue-700 mb-3">
            Folosește aceste credențiale pentru a testa aplicația:
          </p>
          <div className="text-xs space-y-1 font-mono text-blue-800 mb-3">
            <div><strong>Email:</strong> demo@example.com</div>
            <div><strong>Parolă:</strong> DemoPassword123!</div>
          </div>
          <Button
            type="button"
            onClick={fillDemoCredentials}
            variant="outline"
            size="sm"
            className="w-full border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            Completează automat
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Nu ai cont?{" "}
            <button 
              onClick={() => setLocation('/m/register')}
              className="text-teal-600 font-medium"
            >
              Înregistrează-te
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
