import { useState } from 'react';
import { useLocation } from 'wouter';
import { Store, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';

const API_BASE_URL = Capacitor.isNativePlatform() 
  ? 'https://eatoff.app'
  : '';

type ResetStep = 'login' | 'forgot-email' | 'forgot-token' | 'forgot-newpass' | 'forgot-success';

export default function MobileRestaurantSignIn() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<ResetStep>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/restaurant-portal/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('restaurantSession', JSON.stringify({
        token: data.token,
        owner: data.owner,
        restaurant: data.restaurant,
      }));

      setLocation('/m/restaurant/dashboard');
    } catch (err: any) {
      setError(err.message || 'Autentificare eșuată');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/restaurant-portal/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Eroare la trimiterea cererii');
      }

      if (data.token) {
        setGeneratedToken(data.token);
      }
      setStep('forgot-token');
    } catch (err: any) {
      setError(err.message || 'Eroare la procesarea cererii');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Parolele nu coincid');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Parola trebuie să aibă minim 8 caractere');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/restaurant-portal/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Eroare la resetarea parolei');
      }

      setStep('forgot-success');
    } catch (err: any) {
      setError(err.message || 'Eroare la resetarea parolei');
    } finally {
      setIsLoading(false);
    }
  };

  const backToLogin = () => {
    setStep('login');
    setError(null);
    setResetEmail('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setGeneratedToken('');
  };

  if (step === 'forgot-success') {
    return (
      <MobileLayout hideNavigation>
        <div className="min-h-screen bg-white">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
            <h1 className="text-lg font-semibold">EatOff Restaurant</h1>
          </div>
          <div className="px-6 py-16 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Parolă resetată!</h2>
            <p className="text-gray-500 mb-8">Parola a fost schimbată cu succes. Te poți conecta cu noua parolă.</p>
            <button
              onClick={backToLogin}
              className="w-full bg-primary text-white py-4 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Înapoi la conectare
            </button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (step === 'forgot-email' || step === 'forgot-token') {
    return (
      <MobileLayout hideNavigation>
        <div className="min-h-screen bg-white">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
            <button onClick={backToLogin} className="p-1 rounded-lg hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold">Resetare parolă</h1>
          </div>

          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Store className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {step === 'forgot-email' ? 'Introdu emailul' : 'Introdu codul de resetare'}
              </h2>
              <p className="text-gray-500 text-sm">
                {step === 'forgot-email' 
                  ? 'Vei primi un cod de resetare pentru contul tău'
                  : 'Introdu codul primit și noua parolă'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                {error}
              </div>
            )}

            {step === 'forgot-email' ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="email@restaurant.ro"
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Trimite cod de resetare'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {generatedToken && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl text-sm">
                    <p className="font-semibold mb-1">Codul tău de resetare:</p>
                    <p className="font-mono text-xs break-all select-all">{generatedToken}</p>
                    <p className="text-xs text-blue-600 mt-1">Copiază și lipește codul mai jos</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cod de resetare</label>
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Lipește codul de resetare"
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Parolă nouă</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minim 8 caractere"
                      className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-12"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmă parola</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repetă parola nouă"
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    minLength={8}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Resetează parola'}
                </button>
              </form>
            )}

            <button
              onClick={backToLogin}
              className="w-full mt-4 text-center text-sm text-gray-500 hover:text-primary transition-colors"
            >
              Înapoi la conectare
            </button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout hideNavigation>
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <h1 className="text-lg font-semibold">EatOff Restaurant</h1>
        </div>

        <div className="px-6 py-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acces Restaurant</h2>
            <p className="text-gray-500">Conectează-te pentru a gestiona clienți și grupuri</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@restaurant.ro"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parolă</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setStep('forgot-email'); setError(null); }}
              className="text-sm text-primary hover:underline"
            >
              Am uitat parola
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Conectare'}
            </button>
          </form>
        </div>
      </div>
    </MobileLayout>
  );
}
