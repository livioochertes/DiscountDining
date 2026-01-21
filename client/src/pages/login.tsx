import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { FaGoogle, FaFacebook, FaApple, FaInstagram } from "react-icons/fa";
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

  const socialProviders = [
    {
      name: "Google",
      icon: FaGoogle,
      url: "/api/auth/google",
      color: "bg-red-500 hover:bg-red-600",
    },
    // Additional providers can be enabled when credentials are configured
  ];

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

            {/* Demo Account Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Demo Account</h4>
              <p className="text-sm text-blue-700 mb-2">
                Use these credentials to test the platform:
              </p>
              <div className="text-sm space-y-1 font-mono">
                <div><strong>Email:</strong> demo@example.com</div>
                <div><strong>Password:</strong> DemoPassword123!</div>
              </div>
              <Button
                onClick={() => {
                  setFormData({
                    email: 'demo@example.com',
                    password: 'DemoPassword123!'
                  });
                }}
                variant="outline"
                size="sm"
                className="mt-2 w-full"
              >
                Fill Demo Credentials
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="space-y-3">
              {socialProviders.map((provider) => {
                const IconComponent = provider.icon;
                return (
                  <Button
                    key={provider.name}
                    onClick={() => window.location.href = provider.url}
                    className={`w-full h-12 text-white font-medium ${provider.color} transition-colors duration-200`}
                    variant="default"
                  >
                    <IconComponent className="h-5 w-5 mr-3" />
                    Continue with {provider.name}
                  </Button>
                );
              })}
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