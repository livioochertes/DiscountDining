import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Login() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Invalidate auth cache to immediately update authentication state
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        toast({
          title: "Login Successful",
          description: "Welcome back to EatOff!",
        });
        
        // Small delay to ensure auth state is updated
        setTimeout(() => {
          setLocation('/dashboard');
        }, 100);
      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to EatOff</h1>
          <p className="text-gray-600">Sign in to access your account and discover amazing restaurant vouchers</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl">Sign in to your account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email/Password Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social Login - Official Google and Apple Buttons */}
            <div className="space-y-3">
              {/* Google Sign In - Following Google Branding Guidelines */}
              <button
                onClick={() => window.location.href = '/api/auth/google'}
                className="w-full h-11 flex items-center justify-center gap-3 bg-white border border-[#dadce0] rounded hover:bg-[#f8f9fa] transition-colors duration-200"
                style={{ fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-[#3c4043] text-sm font-medium">Sign in with Google</span>
              </button>

              {/* Apple Sign In - Following Apple Human Interface Guidelines (min 44px height) */}
              <button
                onClick={() => window.location.href = '/api/auth/apple'}
                className="w-full h-11 min-h-[44px] flex items-center justify-center gap-2 bg-black rounded-lg hover:bg-[#1a1a1a] transition-colors duration-200"
                style={{ fontFamily: "-apple-system, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-1.55 4.43-3.74 4.25z"/>
                </svg>
                <span className="text-white text-sm font-medium">Sign in with Apple</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            By signing in, you agree to our{" "}
            <a href="/terms-of-service" className="text-primary hover:text-primary/80 underline">
              Terms of Service
            </a>{" "}and{" "}
            <a href="/privacy-policy" className="text-primary hover:text-primary/80 underline">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Sign up link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Sign up here
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <div className="text-center mt-4">
          <Button
            variant="ghost"
            onClick={() => window.location.href = "/"}
            className="text-primary hover:text-primary/80"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}