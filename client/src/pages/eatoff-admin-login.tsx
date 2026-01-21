import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Mail, Key, Smartphone, Lock, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";
import eatOffLogo from "@assets/EatOff_Logo_1750512988041.png";

interface LoginStep {
  step: 'credentials' | '2fa' | 'authenticated';
  email: string;
  tempToken?: string;
}

export default function EatOffAdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [loginState, setLoginState] = useState<LoginStep>({
    step: 'credentials',
    email: ''
  });
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    twoFactorCode: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call for credential verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, accept admin@eatoff.app with any password
      if (formData.email === 'admin@eatoff.app') {
        setLoginState({
          step: '2fa',
          email: formData.email,
          tempToken: 'temp_token_12345'
        });
        
        toast({
          title: "Credentials Verified",
          description: "Please enter your 2FA code to complete login.",
        });
      } else {
        setError('Invalid email or password');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate 2FA verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, accept any 6-digit code
      if (formData.twoFactorCode.length === 6) {
        setLoginState(prev => ({ ...prev, step: 'authenticated' }));
        
        toast({
          title: "Login Successful",
          description: "Welcome to EatOff Admin Dashboard",
        });
        
        // Redirect to admin dashboard after brief delay
        setTimeout(() => {
          setLocation('/eatoff-admin-dashboard');
        }, 1500);
      } else {
        setError('Invalid 2FA code');
      }
    } catch (error) {
      setError('2FA verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resend2FA = async () => {
    toast({
      title: "2FA Code Sent",
      description: "A new verification code has been sent to your device.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={eatOffLogo} 
              alt="EatOff Logo" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">EatOff Admin Portal</h1>
            <p className="text-gray-600">Secure administrative access</p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            <Shield className="h-3 w-3 mr-1" />
            2FA Protected
          </Badge>
        </div>

        {/* Login Form */}
        <Card className="border-orange-200 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">
              {loginState.step === 'credentials' && 'Administrator Login'}
              {loginState.step === '2fa' && 'Two-Factor Authentication'}
              {loginState.step === 'authenticated' && 'Access Granted'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Credentials */}
            {loginState.step === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Administrator Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@eatoff.app"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Continue to 2FA"}
                </Button>
              </form>
            )}

            {/* Step 2: 2FA */}
            {loginState.step === '2fa' && (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <Smartphone className="h-8 w-8 text-orange-600 mx-auto" />
                  <p className="text-sm text-gray-600">
                    Enter the 6-digit code from your authenticator app
                  </p>
                  <p className="text-xs text-gray-500">
                    Sent to: {loginState.email}
                  </p>
                </div>

                <form onSubmit={handle2FASubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="twoFactorCode">Authentication Code</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="twoFactorCode"
                        type="text"
                        placeholder="000000"
                        value={formData.twoFactorCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, twoFactorCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                        className="pl-10 text-center text-lg font-mono tracking-widest"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    disabled={isLoading || formData.twoFactorCode.length !== 6}
                  >
                    {isLoading ? "Verifying..." : "Access Admin Dashboard"}
                  </Button>
                </form>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={resend2FA}
                    className="text-sm text-orange-600 hover:text-orange-700 underline"
                  >
                    Resend code
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Success */}
            {loginState.step === 'authenticated' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Access Granted</h3>
                  <p className="text-sm text-gray-600">Redirecting to admin dashboard...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demo Information */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="text-center text-sm text-blue-800">
              <p className="font-semibold">Demo Credentials</p>
              <p>Email: admin@eatoff.app</p>
              <p>Password: Any password</p>
              <p>2FA Code: Any 6 digits</p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="text-center text-xs text-gray-500">
          <p>This is a secure administrative portal. All access is logged and monitored.</p>
        </div>
      </div>
    </div>
  );
}