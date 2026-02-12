import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, CheckCircle, Loader2 as Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { queryClient, setMobileSessionToken } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/LanguageContext';
import eatoffLogo from '@assets/EatOff_Logo_1769386471015.png';

const isNativePlatform = Capacitor.isNativePlatform();
const API_BASE_URL = import.meta.env.VITE_API_URL || (isNativePlatform ? 'https://eatoff.app' : '');
const DEFAULT_STATUS_BAR_HEIGHT = 44;

// Use Android Client ID for native Android, web Client ID for web/iOS
const GOOGLE_WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '13625494461-c975ns696j2j9ml2afiv56ddec59t52u.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = import.meta.env.VITE_GOOGLE_ANDROID_CLIENT_ID || '13625494461-1bmnbemselgu58j8d6ff1c2g442hltpv.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID = (isNativePlatform && Capacitor.getPlatform() === 'android') ? GOOGLE_ANDROID_CLIENT_ID : GOOGLE_WEB_CLIENT_ID;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

export default function MobileSignIn() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [statusBarHeight, setStatusBarHeight] = useState(DEFAULT_STATUS_BAR_HEIGHT);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [resetStep, setResetStep] = useState<'none' | 'email' | 'token' | 'success'>('none');
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform();

  const handleGoogleCredentialResponse = useCallback(async (response: any) => {
    setIsGoogleLoading(true);
    try {
      const result = await fetch(`${API_BASE_URL}/api/auth/google/native`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ idToken: response.credential }),
      });

      const data = await result.json();

      if (result.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: t.authSuccess,
          description: "Welcome!",
        });
        setTimeout(() => {
          setLocation('/m');
        }, 100);
      } else {
        toast({
          title: t.authFailed,
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
    setIsGoogleLoading(false);
  }, [t, setLocation, toast]);

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

  // Handle deep link callbacks from OAuth
  useEffect(() => {
    console.log('[MobileSignIn] Setting up deep link handler, isNative:', isNative);
    if (!isNative) return;

    const handleAppUrlOpen = async (event: { url: string }) => {
      console.log('[MobileSignIn] ========================================');
      console.log('[MobileSignIn] Deep link received:', event.url);
      console.log('[MobileSignIn] ========================================');
      
      // Close the browser immediately
      setIsGoogleLoading(false);
      try {
        await Browser.close();
        console.log('[MobileSignIn] Browser closed');
      } catch (e) {
        console.log('[MobileSignIn] Browser already closed or error:', e);
      }
      
      // Safely parse the URL with error handling
      try {
        // Check if URL starts with our scheme
        if (!event.url.startsWith('eatoff://')) {
          console.log('[MobileSignIn] Ignoring non-eatoff deep link:', event.url);
          return;
        }
        
        const url = new URL(event.url);
        const params = new URLSearchParams(url.search);
        
        if (url.host === 'oauth-callback' || url.pathname.includes('oauth-callback')) {
          const token = params.get('token');
          const error = params.get('error');
          const requires2fa = params.get('requires2fa');
          const pending2fa = params.get('pending2fa');
          
          // Handle 2FA required
          if (requires2fa === 'true' && pending2fa) {
            console.log('[MobileSignIn] 2FA required, redirecting to verification...');
            setLocation(`/m/verify-2fa?pending2fa=${encodeURIComponent(pending2fa)}`);
            return;
          }
          
          if (token) {
            console.log('[MobileSignIn] Received auth token, exchanging for session...');
            console.log('[MobileSignIn] Using CapacitorHttp for native request to:', `${API_BASE_URL}/api/auth/mobile-exchange`);
            try {
              // Use CapacitorHttp for native platform to bypass CORS restrictions
              const response = await CapacitorHttp.post({
                url: `${API_BASE_URL}/api/auth/mobile-exchange`,
                headers: { 'Content-Type': 'application/json' },
                data: { token }
              });
              
              console.log('[MobileSignIn] CapacitorHttp response status:', response.status);
              console.log('[MobileSignIn] CapacitorHttp response data:', JSON.stringify(response.data));
              
              if (response.status === 200) {
                const data = response.data;
                console.log('[MobileSignIn] Session created successfully:', data.user?.id);
                
                // Store session token for future requests
                if (data.sessionToken) {
                  setMobileSessionToken(data.sessionToken);
                  console.log('[MobileSignIn] Session token stored');
                }
                
                // Clear cache before redirect to ensure fresh data
                queryClient.clear();
                
                // Small delay to ensure token is persisted
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Navigate to home - keep processing state until navigation completes
                console.log('[MobileSignIn] Navigating to /m');
                setLocation('/m');
              } else {
                const errorData = response.data;
                console.error('[MobileSignIn] Token exchange failed:', errorData);
                toast({
                  title: t.authFailed,
                  description: errorData.error || t.somethingWentWrong,
                  variant: "destructive",
                });
              }
            } catch (fetchError) {
              console.error('[MobileSignIn] Network error during token exchange:', fetchError);
              toast({
                title: t.authFailed,
                description: t.somethingWentWrong,
                variant: "destructive",
              });
            }
          } else if (error) {
            console.error('[MobileSignIn] OAuth error:', error);
            toast({
              title: t.authFailed,
              description: error === 'auth_error' ? 'Authentication failed' : 
                           error === 'no_user' ? 'User not found' : 
                           error === 'login_failed' ? 'Login failed' : 
                           t.somethingWentWrong,
              variant: "destructive",
            });
          }
        }
      } catch (e) {
        console.error('[MobileSignIn] Error parsing deep link URL:', e);
      }
    };

    const listener = App.addListener('appUrlOpen', handleAppUrlOpen);
    
    return () => {
      listener.then(l => l.remove());
    };
  }, [isNative, t, setLocation, toast]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [handleGoogleCredentialResponse]);

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
      console.log('[MobileSignIn] Attempting login with:', formData.email);
      console.log('[MobileSignIn] API_BASE_URL:', API_BASE_URL);
      console.log('[MobileSignIn] isNative:', isNative);
      
      // Always request mobile token for mobile pages (works for both native and web mobile)
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ ...formData, mobile: true }),
      });

      console.log('[MobileSignIn] Login response status:', response.status);
      const data = await response.json();
      console.log('[MobileSignIn] Login response data:', JSON.stringify(data));

      if (response.ok) {
        // Store mobile session token (works for both native and web mobile)
        if (data.sessionToken) {
          setMobileSessionToken(data.sessionToken);
          console.log('[MobileSignIn] Session token stored:', data.sessionToken.substring(0, 10) + '...');
          
          // Verify token was stored
          const storedToken = localStorage.getItem('eatoff_mobile_session_token');
          console.log('[MobileSignIn] Token verification:', storedToken ? 'stored successfully' : 'FAILED TO STORE');
        } else {
          console.warn('[MobileSignIn] No session token in response!');
        }
        
        toast({
          title: t.authSuccess,
          description: "Welcome back!",
        });
        
        // Clear cache and redirect - the new page will fetch with the token
        console.log('[MobileSignIn] Clearing cache and redirecting to /m');
        queryClient.clear();
        
        // Small delay to ensure token is persisted before navigation
        setTimeout(() => {
          console.log('[MobileSignIn] Navigating to /m');
          setLocation('/m');
        }, 100);
      } else {
        console.error('[MobileSignIn] Login failed:', data.message);
        toast({
          title: t.authFailed,
          description: data.message || t.wrongCredentials,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[MobileSignIn] Login error:', error);
      toast({
        title: t.error,
        description: t.somethingWentWrong,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      if (data.token) setGeneratedToken(data.token);
      setResetStep('token');
    } catch (err: any) {
      setResetError(err.message || 'Eroare la procesarea cererii');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);

    if (newPassword !== confirmPassword) {
      setResetError('Parolele nu coincid');
      setResetLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      setResetError('Parola trebuie să aibă minim 8 caractere');
      setResetLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setResetStep('success');
    } catch (err: any) {
      setResetError(err.message || 'Eroare la resetarea parolei');
    } finally {
      setResetLoading(false);
    }
  };

  const backToLogin = () => {
    setResetStep('none');
    setResetError(null);
    setResetEmail('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setGeneratedToken('');
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    console.log('[MobileSignIn] handleGoogleSignIn called, isNative:', isNative);
    
    if (isNative) {
      // Native platform - use browser OAuth flow
      try {
        const oauthUrl = `${API_BASE_URL}/api/auth/google?mobile=true`;
        console.log('[MobileSignIn] Opening browser for Google OAuth:', oauthUrl);
        await Browser.open({ url: oauthUrl });
        console.log('[MobileSignIn] Browser opened successfully, waiting for deep link callback...');
      } catch (error) {
        console.error('[MobileSignIn] Failed to open browser:', error);
        toast({
          title: t.error,
          description: "Failed to open authentication",
          variant: "destructive",
        });
        setIsGoogleLoading(false);
      }
    } else {
      // Web platform - use Google Identity Services
      console.log('[MobileSignIn] Using web Google Sign-In');
      if (window.google) {
        window.google.accounts.id.prompt();
        setIsGoogleLoading(false);
      } else {
        console.error('[MobileSignIn] window.google not available');
        toast({
          title: t.error,
          description: "Google Sign-In not available",
          variant: "destructive",
        });
        setIsGoogleLoading(false);
      }
    }
  };

  const handleAppleSignIn = async () => {
    setIsGoogleLoading(true); // Reuse loading state
    try {
      // Open Apple OAuth in external browser (same pattern as Google)
      // Use API_BASE_URL for native apps (https://eatoff.app), or origin for web
      const baseUrl = isNative ? API_BASE_URL : window.location.origin;
      const appleAuthUrl = `${baseUrl}/api/auth/apple?mobile=true`;
      
      console.log('[Apple Sign-In] Opening external browser:', appleAuthUrl);
      
      if (isNative) {
        // Use Capacitor Browser for native apps (already imported statically)
        await Browser.open({ 
          url: appleAuthUrl,
          presentationStyle: 'popover'
        });
      } else {
        // Fallback for web
        window.location.href = appleAuthUrl;
      }
    } catch (error) {
      console.error('[Apple Sign-In] Error:', error);
      toast({
        title: t.loginFailed || "Autentificare eșuată",
        description: "Apple Sign-In nu a funcționat. Încearcă din nou.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  const topPadding = isNative ? statusBarHeight : 0;

  if (resetStep === 'success') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F7F4' }}>
        <div className="flex items-center px-4 py-3" style={{ paddingTop: topPadding + 12 }}>
          <button onClick={() => setLocation('/m')} className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Parolă resetată!</h2>
          <p className="text-gray-500 mb-8 text-center">Parola a fost schimbată cu succes. Te poți conecta cu noua parolă.</p>
          <Button onClick={backToLogin} className="w-full h-14 text-base font-semibold rounded-xl text-white" style={{ backgroundColor: '#1A1A1A' }}>
            Înapoi la conectare
          </Button>
        </div>
      </div>
    );
  }

  if (resetStep === 'email' || resetStep === 'token') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F7F4' }}>
        <div className="flex items-center px-4 py-3" style={{ paddingTop: topPadding + 12 }}>
          <button onClick={backToLogin} className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <span className="ml-2 text-lg font-semibold text-gray-900">Resetare parolă</span>
        </div>

        <div className="flex-1 flex flex-col px-6">
          <div className="text-center py-8">
            <img src={eatoffLogo} alt="EatOff" className="h-16 mx-auto mb-6" style={{ mixBlendMode: 'multiply' }} />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {resetStep === 'email' ? 'Introdu emailul' : 'Introdu codul de resetare'}
            </h2>
            <p className="text-gray-500 text-sm">
              {resetStep === 'email' ? 'Vei primi un cod de resetare pentru contul tău' : 'Introdu codul primit și noua parolă'}
            </p>
          </div>

          {resetError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
              {resetError}
            </div>
          )}

          {resetStep === 'email' ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="email@exemplu.com"
                    className="pl-12 h-14 text-base rounded-xl bg-white border-gray-200"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={resetLoading}
                className="w-full h-14 text-base font-semibold rounded-xl text-white"
                style={{ backgroundColor: '#1A1A1A' }}
              >
                {resetLoading ? <Loader2Icon className="w-5 h-5 animate-spin" /> : 'Trimite cod de resetare'}
              </Button>
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Cod de resetare</label>
                <Input
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Lipește codul de resetare"
                  className="h-14 text-base rounded-xl bg-white border-gray-200 font-mono text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Parolă nouă</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minim 8 caractere"
                    className="pl-12 pr-12 h-14 text-base rounded-xl bg-white border-gray-200"
                    required
                    minLength={8}
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Confirmă parola</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repetă parola nouă"
                    className="pl-12 h-14 text-base rounded-xl bg-white border-gray-200"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={resetLoading}
                className="w-full h-14 text-base font-semibold rounded-xl text-white"
                style={{ backgroundColor: '#1A1A1A' }}
              >
                {resetLoading ? <Loader2Icon className="w-5 h-5 animate-spin" /> : 'Resetează parola'}
              </Button>
            </form>
          )}

          <button onClick={backToLogin} className="w-full mt-4 text-center text-sm text-gray-500 hover:text-gray-800 transition-colors">
            Înapoi la conectare
          </button>
        </div>
      </div>
    );
  }

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
            style={{ mixBlendMode: 'multiply' }}
          />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.welcomeBack || 'Bine ai revenit!'}</h2>
          <p className="text-gray-500">{t.connectToAccessAccount}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 mt-4">
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

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => { setResetStep('email'); setResetError(null); }}
              className="text-sm font-medium hover:underline"
              style={{ color: '#F5A623' }}
            >
              Am uitat parola
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-base font-semibold rounded-xl text-white shadow-lg"
            style={{ backgroundColor: '#1A1A1A' }}
          >
            {isLoading ? (t.loading || 'Se încarcă...') : (t.signIn || 'Conectare')}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-sm text-gray-400">{t.orContinueWith || 'sau'}</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full h-14 text-base font-semibold rounded-xl bg-white text-gray-900 border border-gray-200 shadow-sm hover:bg-gray-50 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isGoogleLoading ? (t.loading || 'Se încarcă...') : (t.continueWithGoogle || 'Continuă cu Google')}
          </button>

          <button
            type="button"
            onClick={handleAppleSignIn}
            className="w-full h-14 text-base font-semibold rounded-xl bg-black text-white shadow-sm hover:bg-gray-900 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            {t.continueWithApple || 'Continuă cu Apple'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-500">
            {t.noAccount || 'Nu ai cont?'}{' '}
            <button
              onClick={() => setLocation('/m/signup')}
              className="font-semibold hover:underline"
              style={{ color: '#F5A623' }}
            >
              {t.signUp || 'Înregistrează-te'}
            </button>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400 max-w-xs mx-auto">
          {t.termsAgreement || 'Continuând, ești de acord cu Termenii și Condițiile și Politica de Confidențialitate'}
        </p>

        {/* Restaurant Staff Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setLocation('/m/restaurant/signin')}
            className="text-sm text-gray-500 hover:text-primary transition-colors"
          >
            Ești angajat restaurant? <span className="font-semibold text-primary">Portal Restaurant</span>
          </button>
        </div>
      </div>
    </div>
  );
}
