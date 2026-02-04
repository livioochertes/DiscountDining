import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, ArrowLeft, Ticket } from "lucide-react";
import type { Restaurant, VoucherPackage } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

export default function RestaurantVouchersPage() {
  const params = useParams();
  const restaurantId = params.restaurantId ? parseInt(params.restaurantId) : null;
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: restaurantData, isLoading } = useQuery({
    queryKey: ['/api/restaurants', restaurantId, 'full'],
    queryFn: async () => {
      if (!restaurantId) return null;
      const response = await fetch(`/api/restaurants/${restaurantId}/full`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch restaurant data');
      return response.json();
    },
    enabled: !!restaurantId,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const { data: packages = [] } = useQuery<VoucherPackage[]>({
    queryKey: ['/api/restaurants', restaurantId, 'packages'],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/packages`);
      if (!res.ok) throw new Error('Failed to fetch packages');
      return res.json();
    },
    enabled: !!restaurantId
  });

  const restaurant = restaurantData?.restaurant;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded w-32"></div>
              <div className="h-8 bg-gray-300 rounded w-64"></div>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Restaurant not found</h1>
          <Button onClick={() => setLocation('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/')}
            className="mb-4 bg-white hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.backToRestaurants}
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Ticket className="w-8 h-8 text-orange-500" />
                <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
              </div>
              <p className="text-lg text-gray-600 mb-2">{t.voucherPackages || 'Voucher Packages'}</p>
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span className="font-medium">{restaurant.rating}</span>
                  <span className="text-sm ml-1">({restaurant.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{restaurant.location}</span>
                </div>
                <span>{restaurant.cuisine} cuisine</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {packages.length === 0 ? (
          <div className="text-center py-16">
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">{t.noVouchersAvailable}</h2>
            <p className="text-gray-500">This restaurant doesn't have any voucher packages available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {pkg.imageUrl && (
                  <div className="h-40 overflow-hidden">
                    <img 
                      src={pkg.imageUrl} 
                      alt={pkg.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  {pkg.description && (
                    <p className="text-sm text-gray-600">{pkg.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{pkg.mealCount} mese</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        {pkg.discountPercentage}% reducere
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        €{pkg.pricePerMeal ? parseFloat(pkg.pricePerMeal).toFixed(2) : '0.00'}/masă
                      </span>
                    </div>
                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      onClick={() => {
                        if (!user) {
                          setLocation('/auth');
                          return;
                        }
                        setLocation(`/checkout?voucherId=${pkg.id}`);
                      }}
                    >
                      <Ticket className="w-4 h-4 mr-2" />
                      Cumpără voucher
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
