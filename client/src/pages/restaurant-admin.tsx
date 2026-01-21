import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Camera } from "lucide-react";
import PackageForm from "@/components/package-form";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Mock restaurant ID - in a real app, this would come from authentication
const RESTAURANT_ID = 1;

export default function RestaurantAdmin() {
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const { toast } = useToast();

  const { data: restaurant } = useQuery({
    queryKey: ['/api/restaurants', RESTAURANT_ID],
    queryFn: () => api.getRestaurant(RESTAURANT_ID)
  });

  const { data: packages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ['/api/restaurants', RESTAURANT_ID, 'packages'],
    queryFn: () => api.getRestaurantPackages(RESTAURANT_ID)
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/restaurants', RESTAURANT_ID, 'analytics'],
    queryFn: () => api.getRestaurantAnalytics(RESTAURANT_ID)
  });

  const createPackageMutation = useMutation({
    mutationFn: (packageData: any) => api.createPackage(RESTAURANT_ID, packageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', RESTAURANT_ID, 'packages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', RESTAURANT_ID, 'analytics'] });
      setShowPackageForm(false);
      toast({
        title: "Package created",
        description: "Your voucher package has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create package",
        variant: "destructive",
      });
    }
  });

  const updatePackageMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updatePackage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', RESTAURANT_ID, 'packages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', RESTAURANT_ID, 'analytics'] });
      setEditingPackage(null);
      toast({
        title: "Package updated",
        description: "Your voucher package has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update package",
        variant: "destructive",
      });
    }
  });

  const handleCreatePackage = (packageData: any) => {
    createPackageMutation.mutate(packageData);
  };

  const handleUpdatePackage = (packageData: any) => {
    if (editingPackage) {
      updatePackageMutation.mutate({ id: editingPackage.id, data: packageData });
    }
  };

  const handleEditPackage = (pkg: any) => {
    setEditingPackage(pkg);
    setShowPackageForm(true);
  };

  const handleCancelForm = () => {
    setShowPackageForm(false);
    setEditingPackage(null);
  };

  if (!restaurant) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-secondary mb-2">Restaurant Management</h2>
        <p className="text-gray-600">Create and manage your voucher packages</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Restaurant Profile Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <div className="w-full h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
              
              <h3 className="text-lg font-semibold text-secondary mb-1">{restaurant.name}</h3>
              <p className="text-sm text-gray-600 mb-4">Restaurant ID: #{restaurant.id}</p>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Packages:</span>
                  <span className="font-medium">{packages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Sales:</span>
                  <span className="font-medium text-accent">
                    €{analytics?.totalSales?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vouchers Sold:</span>
                  <span className="font-medium">{analytics?.vouchersSold || 0}</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full mt-4">
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Package Management */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-secondary">Voucher Packages</h3>
                <Button 
                  onClick={() => setShowPackageForm(true)}
                  className="bg-primary hover:bg-red-600"
                  disabled={showPackageForm}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Package
                </Button>
              </div>
              
              {showPackageForm && (
                <div className="mb-8 p-6 border rounded-lg bg-gray-50">
                  <PackageForm
                    onSave={editingPackage ? handleUpdatePackage : handleCreatePackage}
                    onCancel={handleCancelForm}
                    initialData={editingPackage}
                    isLoading={createPackageMutation.isPending || updatePackageMutation.isPending}
                  />
                </div>
              )}
              
              {/* Existing Packages */}
              {packagesLoading ? (
                <div className="text-center py-8">Loading packages...</div>
              ) : packages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No packages created yet. Create your first voucher package to start selling!
                </div>
              ) : (
                <div className="space-y-4">
                  {packages.map((pkg: any) => (
                    <Card key={pkg.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-secondary">{pkg.name}</h4>
                            <p className="text-sm text-gray-600">
                              {pkg.mealCount} meals • €{pkg.pricePerMeal} per meal • {pkg.discountPercentage}% discount
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={pkg.isActive ? "default" : "secondary"} className={pkg.isActive ? "bg-accent/10 text-accent hover:bg-accent/20" : ""}>
                              {pkg.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPackage(pkg)}
                              disabled={showPackageForm}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Sold:</span>
                            <div className="font-medium">0</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Revenue:</span>
                            <div className="font-medium text-accent">€0.00</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Redeemed:</span>
                            <div className="font-medium">0 meals</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <div className="font-medium text-accent">Available</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
