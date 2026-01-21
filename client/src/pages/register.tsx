import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Mail, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Shield,
  CheckCircle,
  Clock
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface VerificationData {
  email: string;
  phone: string;
  emailCode: string;
  smsCode: string;
}

export default function Register() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegisterData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [verificationData, setVerificationData] = useState<VerificationData>({
    email: "",
    phone: "",
    emailCode: "",
    smsCode: ""
  });
  const [errors, setErrors] = useState<string[]>([]);

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setVerificationData({
        email: registrationData.email,
        phone: registrationData.phone,
        emailCode: "",
        smsCode: ""
      });
      setCurrentStep(2);
      setErrors([]);
    },
    onError: (error: Error) => {
      setErrors([error.message]);
    },
  });

  const resendCodeMutation = useMutation({
    mutationFn: async (type: 'email' | 'sms') => {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: verificationData.email,
          phone: verificationData.phone,
          type
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resend code');
      }
      return response.json();
    },
    onError: (error: Error) => {
      setErrors([error.message]);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: VerificationData) => {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Verification failed');
      }
      return response.json();
    },
    onSuccess: () => {
      setCurrentStep(3);
      setTimeout(() => {
        setLocation('/dashboard');
      }, 2000);
    },
    onError: (error: Error) => {
      setErrors([error.message]);
    },
  });

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!registrationData.firstName.trim()) {
      newErrors.push("First name is required");
    }
    if (!registrationData.lastName.trim()) {
      newErrors.push("Last name is required");
    }
    if (!registrationData.email.trim()) {
      newErrors.push("Email is required");
    } else if (!/\S+@\S+\.\S+/.test(registrationData.email)) {
      newErrors.push("Please enter a valid email address");
    }
    if (!registrationData.phone.trim()) {
      newErrors.push("Phone number is required");
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(registrationData.phone)) {
      newErrors.push("Please enter a valid phone number");
    }
    if (!registrationData.password) {
      newErrors.push("Password is required");
    } else if (registrationData.password.length < 8) {
      newErrors.push("Password must be at least 8 characters long");
    }
    if (registrationData.password !== registrationData.confirmPassword) {
      newErrors.push("Passwords do not match");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      registerMutation.mutate(registrationData);
    }
  };

  const handleVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationData.emailCode.trim() || !verificationData.smsCode.trim()) {
      setErrors(["Please enter both verification codes"]);
      return;
    }
    verifyMutation.mutate(verificationData);
  };

  const handleInputChange = (field: keyof RegisterData, value: string) => {
    setRegistrationData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleVerificationChange = (field: keyof VerificationData, value: string) => {
    setVerificationData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            <User className="h-4 w-4" />
          </div>
          <div className={`h-1 w-12 ${currentStep >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            <Shield className="h-4 w-4" />
          </div>
          <div className={`h-1 w-12 ${currentStep >= 3 ? 'bg-primary' : 'bg-gray-200'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            <CheckCircle className="h-4 w-4" />
          </div>
        </div>

        {/* Step 1: Registration Form */}
        {currentStep === 1 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create Your Account</CardTitle>
              <CardDescription>
                Join EatOff and start saving on your favorite restaurants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={registrationData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={registerMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={registrationData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={registerMutation.isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      className="pl-10"
                      value={registrationData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={registerMutation.isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      className="pl-10"
                      value={registrationData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={registerMutation.isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter a strong password"
                      value={registrationData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      disabled={registerMutation.isPending}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={registrationData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      disabled={registerMutation.isPending}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                <div className="text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    Sign in here
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Verification */}
        {currentStep === 2 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Verify Your Account</CardTitle>
              <CardDescription>
                We've sent verification codes to your email and phone number.<br/>
                <strong className="text-primary">Check the browser console for the email verification code (look for 📧)</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="border-primary bg-primary/10 mb-4">
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> The email verification code is displayed in your browser's console. 
                  Press F12 (or right-click → Inspect → Console) and look for the message starting with 📧.
                  The SMS code may not work with test numbers.
                </AlertDescription>
              </Alert>
              
              <form onSubmit={handleVerification} className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900 dark:text-blue-100">Email Verification</span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      Check your email at {verificationData.email}
                    </p>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Enter 6-digit code"
                        value={verificationData.emailCode}
                        onChange={(e) => handleVerificationChange('emailCode', e.target.value)}
                        maxLength={6}
                        disabled={verifyMutation.isPending}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => resendCodeMutation.mutate('email')}
                        disabled={resendCodeMutation.isPending}
                      >
                        Resend
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-900 dark:text-green-100">SMS Verification</span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                      Check your phone at {verificationData.phone}
                    </p>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Enter 6-digit code"
                        value={verificationData.smsCode}
                        onChange={(e) => handleVerificationChange('smsCode', e.target.value)}
                        maxLength={6}
                        disabled={verifyMutation.isPending}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => resendCodeMutation.mutate('sms')}
                        disabled={resendCodeMutation.isPending}
                      >
                        Resend
                      </Button>
                    </div>
                  </div>
                </div>

                {errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={verifyMutation.isPending}
                >
                  {verifyMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Account
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {currentStep === 3 && (
          <Card>
            <CardContent className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Account Created Successfully!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Welcome to EatOff! Your account has been verified and is ready to use.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting you to your dashboard...
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}