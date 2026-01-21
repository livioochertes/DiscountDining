import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Store, AlertCircle, XCircle, Info } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  companyName: z.string().min(1, "Company name is required"),
  businessRegistrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  companyAddress: z.string().min(1, "Company address is required"),
  companyPhone: z.string().min(1, "Company phone is required"),
  companyWebsite: z.string().optional(),
  contactPersonName: z.string().min(1, "Contact person name is required"),
  contactPersonTitle: z.string().min(1, "Contact person title is required"),
  contactPersonPhone: z.string().min(1, "Contact person phone is required"),
  contactPersonEmail: z.string().email("Invalid email address"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function RestaurantLogin() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  const [error, setError] = useState<string | null>(null);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      companyName: "",
      businessRegistrationNumber: "",
      taxId: "",
      companyAddress: "",
      companyPhone: "",
      companyWebsite: "",
      contactPersonName: "",
      contactPersonTitle: "",
      contactPersonPhone: "",
      contactPersonEmail: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest('POST', '/api/restaurant-portal/login', data);
      return response.json();
    },
    onSuccess: async () => {
      // Invalidate authentication queries to force re-fetch
      await queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/auth/user"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Small delay to ensure queries are refetched
      setTimeout(() => {
        setLocation('/restaurant-portal');
      }, 100);
    },
    onError: (error: any) => {
      setError(error.message || "Login failed");
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const { confirmPassword, ...registerData } = data;
      const response = await apiRequest('POST', '/api/restaurant-portal/register', registerData);
      return response.json();
    },
    onSuccess: async () => {
      // Invalidate authentication queries to force re-fetch
      await queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/auth/user"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Small delay to ensure queries are refetched
      setTimeout(() => {
        setLocation('/restaurant-portal');
      }, 100);
    },
    onError: (error: any) => {
      setError(error.message || "Registration failed");
    },
  });

  const onLogin = (data: LoginFormData) => {
    setError(null);
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterFormData) => {
    setError(null);
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Portal</h1>
          <p className="text-gray-600">Manage your restaurants and voucher packages</p>
        </div>

        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-6">
                {error.includes("Email already") ? (
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <Info className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-amber-800">Account Already Exists</h3>
                        <div className="mt-2 text-sm text-amber-700">
                          <p>This email address is already registered with EatOff Restaurant Portal.</p>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setActiveTab("login");
                              setError(null);
                            }}
                            className="text-amber-800 border-amber-300 hover:bg-amber-100"
                          >
                            Sign In Instead
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-amber-600 hover:text-amber-800"
                            onClick={() => setError(null)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 font-medium">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Account Information</h3>
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Confirm password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Company Information</h3>
                      
                      <FormField
                        control={registerForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter company name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-4">
                        <div className="flex-1">
                          <FormField
                            control={registerForm.control}
                            name="businessRegistrationNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Business Registration</FormLabel>
                                <FormControl>
                                  <Input placeholder="Registration number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex-1">
                          <FormField
                            control={registerForm.control}
                            name="taxId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tax ID</FormLabel>
                                <FormControl>
                                  <Input placeholder="Tax ID" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <FormField
                        control={registerForm.control}
                        name="companyAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter company address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="companyPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="Phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="companyWebsite"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="www.company.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Contact Person</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="contactPersonName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Contact person name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="contactPersonTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Job title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="contactPersonPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="Contact phone" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="contactPersonEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="Contact email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => setLocation('/')}
                className="w-full"
              >
                Back to Main Site
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}