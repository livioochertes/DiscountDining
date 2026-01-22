import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Wallet, Activity, Heart, AlertTriangle, Target, ChefHat } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import CustomerQRCodeCard from "@/components/CustomerQRCodeCard";
import PaymentRequestsCard from "@/components/PaymentRequestsCard";

// Dietary Profile Component
function DietaryProfileCard({ userId }: { userId?: string }) {
  const { t } = useLanguage();
  const { data: dietaryProfile, isLoading, error } = useQuery<any>({
    queryKey: ["/api/dietary/profile"],
    enabled: !!userId,
  });



  if (!userId) return null;

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="h-5 w-5 mr-2 text-primary" />
            Dietary Profile & AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">{t.loading}</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="h-5 w-5 mr-2 text-primary" />
            Dietary Profile & AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">Error loading dietary profile</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Heart className="h-5 w-5 mr-2 text-primary" />
          Dietary Profile & AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              {t.basicInformation}
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Age:</span>
                <p className="font-medium">
                  {dietaryProfile?.age ? `${dietaryProfile.age} years` : 'Not set'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Gender:</span>
                <p className="font-medium capitalize">
                  {dietaryProfile?.gender || 'Not set'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Height:</span>
                <p className="font-medium">
                  {dietaryProfile?.height ? `${dietaryProfile.height} cm` : 'Not set'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Weight:</span>
                <p className="font-medium">
                  {dietaryProfile?.weight ? `${dietaryProfile.weight} kg` : 'Not set'}
                </p>
              </div>
            </div>
          </div>

          {/* Health Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Health Information
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Health Goal:</span>
                <p className="font-medium">{(dietaryProfile as any)?.healthGoal || 'Not set'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Activity Level:</span>
                <p className="font-medium">{(dietaryProfile as any)?.activityLevel || 'Not set'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Calorie Target:</span>
                <p className="font-medium">{(dietaryProfile as any)?.calorieTarget || 'Not set'} kcal/day</p>
              </div>
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Dietary Restrictions
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 block mb-2">Allergies:</span>
                <div className="flex flex-wrap gap-2">
                  {(dietaryProfile as any)?.allergies?.length > 0 ? (
                    (dietaryProfile as any).allergies.map((allergy: string, index: number) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {allergy}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">None specified</span>
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-600 block mb-2">Food Intolerances:</span>
                <div className="flex flex-wrap gap-2">
                  {(dietaryProfile as any)?.foodIntolerances?.length > 0 ? (
                    (dietaryProfile as any).foodIntolerances.map((intolerance: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {intolerance}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">None specified</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-sm text-gray-600 block mb-2">Dietary Preferences:</span>
                <div className="flex flex-wrap gap-2">
                  {(dietaryProfile as any)?.dietaryPreferences?.length > 0 ? (
                    (dietaryProfile as any).dietaryPreferences.map((preference: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {preference}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">None specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-6 border-t flex gap-4">
          <Button 
            onClick={() => window.location.href = "/dietary-recommendations"}
            className="flex items-center"
          >
            <ChefHat className="h-4 w-4 mr-2" />
            Manage Dietary Profile
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = "/dietary-recommendations"}
          >
            View AI Recommendations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Profile() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Handle unauthorized access with better timing
  useEffect(() => {
    // Give more time for authentication state to settle after login
    const checkAuth = setTimeout(() => {
      if (!isAuthLoading && !isAuthenticated) {
        toast({
          title: "Unauthorized",
          description: "You need to sign in to access your profile.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      }
    }, 200); // Wait 200ms before checking auth state

    return () => clearTimeout(checkAuth);
  }, [isAuthenticated, isAuthLoading, toast]);

  // Show authenticated user info instead of customer data
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  // Display authenticated user information
  const displayName = user?.name || user?.email || 'User';
  
  // Debug: Log user object to check customerCode
  console.log("Profile user data:", { 
    id: user?.id, 
    customerCode: user?.customerCode,
    hasCustomerCode: !!user?.customerCode,
    fullUser: user 
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.profile}</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        {/* User Profile Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">{displayName}</CardTitle>
                <p className="text-gray-600">{user?.email}</p>
                <Badge variant="outline" className="mt-1">
                  {user?.membershipTier || 'Bronze'} Member
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Account Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">User ID:</span>
                    <p className="font-medium">{user?.id}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Name:</span>
                    <p className="font-medium">{user?.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Email:</span>
                    <p className="font-medium">{user?.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Phone:</span>
                    <p className="font-medium">{user?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Account Created:</span>
                    <p className="font-medium">{formatDate(user?.createdAt?.toString() || null)}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">Language Preference</label>
                    <LanguageSelector variant="profile" />
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Account Balance:</span>
                    <p className="font-medium text-lg text-primary">€{user?.balance || '0.00'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Loyalty Points:</span>
                    <p className="font-medium text-lg">{user?.loyaltyPoints || 0} points</p>
                  </div>
                </div>
              </div>
              
              {/* QR Code for Restaurant Scanning - Always show */}
              <div className="md:col-span-2 mt-4 pt-4 border-t">
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg">
                  <div className="flex-shrink-0">
                    <div 
                      className="bg-white p-2 rounded-lg shadow-sm"
                      dangerouslySetInnerHTML={{
                        __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="80" height="80">
                          <rect width="100" height="100" fill="white"/>
                          <rect x="10" y="10" width="25" height="25" fill="black"/>
                          <rect x="65" y="10" width="25" height="25" fill="black"/>
                          <rect x="10" y="65" width="25" height="25" fill="black"/>
                          <rect x="15" y="15" width="15" height="15" fill="white"/>
                          <rect x="70" y="15" width="15" height="15" fill="white"/>
                          <rect x="15" y="70" width="15" height="15" fill="white"/>
                          <rect x="18" y="18" width="9" height="9" fill="black"/>
                          <rect x="73" y="18" width="9" height="9" fill="black"/>
                          <rect x="18" y="73" width="9" height="9" fill="black"/>
                          <rect x="40" y="10" width="5" height="5" fill="black"/>
                          <rect x="50" y="10" width="5" height="5" fill="black"/>
                          <rect x="40" y="20" width="5" height="5" fill="black"/>
                          <rect x="45" y="25" width="5" height="5" fill="black"/>
                          <rect x="40" y="40" width="20" height="20" fill="black"/>
                          <rect x="45" y="45" width="10" height="10" fill="white"/>
                          <rect x="48" y="48" width="4" height="4" fill="black"/>
                        </svg>`
                      }}
                    />
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Codul tău de fidelitate</h4>
                    <p className="text-2xl font-bold text-primary tracking-wider">{user?.customerCode || 'CLI-DEMO01'}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Arată acest cod la restaurant pentru plăți și reduceri de fidelitate
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <Button 
                onClick={async () => {
                  try {
                    queryClient.setQueryData(["/api/auth/user"], null);
                    fetch("/api/auth/logout", { 
                      method: "POST",
                      credentials: "include"
                    }).catch(console.error);
                    setLocation("/");
                  } catch (error) {
                    console.error("Logout error:", error);
                    queryClient.setQueryData(["/api/auth/user"], null);
                    setLocation("/");
                  }
                }}
                variant="outline"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Requests Section */}
        {user?.id && <PaymentRequestsCard customerId={user.id} />}

        {/* Dietary Profile & AI Recommendations Section */}
        {user?.id && <DietaryProfileCard userId={user.id.toString()} />}

        {/* Account Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wallet className="h-5 w-5 mr-2 text-primary" />
                My Vouchers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">View and manage your purchased vouchers</p>
              <Button 
                onClick={() => window.location.href = "/my-vouchers"}
                className="w-full"
              >
                View Vouchers
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Your account is secured with Replit authentication</p>
              <Badge variant="secondary" className="w-full justify-center">
                Verified Account
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">View your recent activity and purchases</p>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}