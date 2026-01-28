import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { ArrowLeft, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { queryClient, setMobileSessionToken } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/LanguageContext';
import eatoffLogo from '@assets/EatOff_Logo_1769386471015.png';

const isNativePlatform = Capacitor.isNativePlatform();
const API_BASE_URL = import.meta.env.VITE_API_URL || (isNativePlatform ? 'https://eatoff.app' : '');
const DEFAULT_STATUS_BAR_HEIGHT = 44;

export default function MobileVerify2FA() {
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [statusBarHeight, setStatusBarHeight] = useState(DEFAULT_STATUS_BAR_HEIGHT);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  const isNative = Capacitor.isNativePlatform();
  
  // Get pending2fa token from URL
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const pending2fa = urlParams.get('pending2fa');

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

  const handleVerify = async () => {
    if (!pending2fa) {
      toast({
        title: t.error || 'Error',
        description: t.invalidSession || 'Invalid session. Please login again.',
        variant: 'destructive',
      });
      setLocation('/m/signin');
      return;
    }

    if (code.length !== 6) {
      toast({
        title: t.error || 'Error',
        description: t.enterSixDigitCode || 'Please enter a 6-digit code',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);
    try {
      let response;
      if (isNative) {
        response = await CapacitorHttp.post({
          url: `${API_BASE_URL}/api/auth/2fa/login-verify`,
          headers: { 'Content-Type': 'application/json' },
          data: { pending2fa, code }
        });
        
        if (response.status === 200 && response.data.success) {
          if (response.data.token) {
            setMobileSessionToken(response.data.token);
          }
          queryClient.clear();
          toast({
            title: t.success || 'Success',
            description: t.twoFaVerified || '2FA verification successful',
          });
          setLocation('/m');
        } else {
          toast({
            title: t.error || 'Error',
            description: response.data.message || t.invalidCode || 'Invalid code',
            variant: 'destructive',
          });
        }
      } else {
        const res = await fetch('/api/auth/2fa/login-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ pending2fa, code }),
        });
        
        const data = await res.json();
        
        if (res.ok && data.success) {
          queryClient.clear();
          toast({
            title: t.success || 'Success',
            description: t.twoFaVerified || '2FA verification successful',
          });
          setLocation(data.redirect || '/m');
        } else {
          toast({
            title: t.error || 'Error',
            description: data.message || t.invalidCode || 'Invalid code',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('2FA verify error:', error);
      toast({
        title: t.error || 'Error',
        description: t.somethingWentWrong || 'Something went wrong',
        variant: 'destructive',
      });
    }
    setIsVerifying(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div style={{ height: isNative ? statusBarHeight : 0 }} className="bg-white" />
      
      <header className="flex items-center p-4 border-b border-gray-100">
        <button 
          onClick={() => setLocation('/m/signin')}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="ml-2 text-lg font-semibold">{t.twoFactorVerification || '2FA Verification'}</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <img 
          src={eatoffLogo} 
          alt="EatOff" 
          className="w-24 h-24 object-contain mb-6"
        />
        
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">{t.enterAuthCode || 'Enter Authentication Code'}</h2>
            <p className="text-gray-500 text-sm">
              {t.enterCodeFromApp || 'Enter the 6-digit code from your authenticator app'}
            </p>
          </div>
          
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full p-4 border border-gray-200 rounded-xl text-center text-3xl tracking-[0.5em] font-mono"
            placeholder="000000"
            maxLength={6}
            autoFocus
          />
          
          <Button
            onClick={handleVerify}
            disabled={isVerifying || code.length !== 6}
            className="w-full py-6 text-lg rounded-xl"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t.verifying || 'Verifying...'}
              </>
            ) : (
              t.verify || 'Verify'
            )}
          </Button>
          
          <p className="text-center text-sm text-gray-500">
            {t.tokenExpires || 'This verification expires in 5 minutes'}
          </p>
        </div>
      </div>
    </div>
  );
}
