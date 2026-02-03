import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingUp, ChefHat, Star, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import RestaurantCard from "@/components/restaurant-card";
import RestaurantModal from "@/components/restaurant-modal";
import { AIAssistant } from "@/components/AIAssistant";
import { AIRecommendations } from "@/components/AIRecommendations";

import { api, type RestaurantFilters } from "@/lib/api";
import type { Restaurant } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { imageCache } from "@/lib/imageCache";
import { optimizeImageUrl } from "@/lib/imageOptimizer";
import { instantImageLoader } from "@/lib/instantImageLoader";

function FeaturedChefsSection() {
  const { t } = useLanguage();
  
  const { data: featuredChefs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/chef-profiles/featured"],
  });

  if (isLoading) {
    return (
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            <ChefHat className="h-6 w-6" />
            Featured Chefs
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (featuredChefs.length === 0) {
    return null;
  }

  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          <ChefHat className="h-6 w-6" />
          Featured Chefs
        </h2>
        <Link href="/chefs">
          <Button variant="ghost" className="text-primary hover:text-primary/80">
            View All Chefs <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
      <p className="text-muted-foreground mb-4">Discover talented chefs from our partner restaurants</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {featuredChefs.slice(0, 4).map((item) => {
          const chef = item.profile || item;
          const restaurant = item.restaurant;
          return (
            <Link key={chef.id} href={`/chef/${chef.id}`}>
              <div className="group cursor-pointer transition-transform hover:scale-[1.02]">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 aspect-[4/3] shadow-md hover:shadow-lg transition-shadow">
                  {chef.coverImage && (
                    <img 
                      src={chef.coverImage} 
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-white overflow-hidden flex-shrink-0">
                        {chef.profileImage ? (
                          <img src={chef.profileImage} alt={chef.chefName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <ChefHat className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm truncate">{chef.chefName}</p>
                        {restaurant && (
                          <p className="text-white/80 text-xs truncate">{restaurant.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-yellow-500 text-xs">
                      <Star className="h-3 w-3 mr-1 fill-current" /> Featured
                    </Badge>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Marketplace() {
  const [filters, setFilters] = useState<RestaurantFilters>({});
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState("featured");
  const [displayCount, setDisplayCount] = useState(6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['/api/restaurants', filters],
    queryFn: () => api.getRestaurants(filters)
  });

  // Fetch AI recommendations when user is authenticated
  const { data: aiRecommendations } = useQuery({
    queryKey: ['/api/dietary/recommendations'],
    queryFn: () => api.getDietaryRecommendations(),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 60 * 1000, // 2 hours cache
  });

  // Check if we should expand the filter box for AI recommendations
  const shouldShowAIRecommendations = isAuthenticated && aiRecommendations?.recommendations?.length > 0;
  const allRecommendations = aiRecommendations?.recommendations || [];
  
  // State for recommendation type filter
  const [recommendationType, setRecommendationType] = useState<'all' | 'restaurant' | 'menu_item'>('all');
  
  // State for recommendation modal
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Simple modal close - no scroll manipulation
  const handleCloseModal = useCallback(() => {
    console.log('Modal close requested');
    setShowRecommendationModal(false);
    setSelectedRecommendation(null);
  }, []);

  
  // Filter recommendations based on selected type
  const filteredRecommendations = allRecommendations.filter((rec: any) => {
    if (recommendationType === 'all') return true;
    return rec.type === recommendationType;
  });
  
  const firstThreeRecommendations = filteredRecommendations.slice(0, 3);

  console.log('AI recommendations data:', { 
    allRecommendations: allRecommendations.length, 
    filteredRecommendations: filteredRecommendations.length,
    firstThreeRecommendations: firstThreeRecommendations.length,
    showRecommendationModal 
  });

  // Portal-based modal effect - no page interference
  useEffect(() => {
    if (showRecommendationModal) {
      console.log('Portal modal opened - focus only');
      
      // Focus modal
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);
    }
  }, [showRecommendationModal]);

  // Enhance recommendations with restaurant data from the restaurants list
  const enhancedRecommendations = firstThreeRecommendations.map((rec: any) => {
    let restaurantId: number;
    let restaurantData: Restaurant | undefined;
    
    if (rec.type === 'restaurant') {
      restaurantId = rec.restaurantId || rec.targetId;
      restaurantData = restaurants.find((r: Restaurant) => r.id === restaurantId);
    } else if (rec.type === 'menu_item') {
      // Menu item recommendations should be linked to Wing Stop for now
      restaurantId = 101; // Wing Stop ID
      restaurantData = restaurants.find((r: Restaurant) => r.id === 101);
    } else {
      restaurantId = rec.restaurantId || rec.targetId;
      restaurantData = restaurants.find((r: Restaurant) => r.id === restaurantId);
    }
    
    return {
      ...rec,
      restaurant: {
        ...rec.restaurant,
        name: rec.restaurant?.name || rec.restaurantName || restaurantData?.name || `Restaurant #${restaurantId}`,
        cuisine: rec.restaurant?.cuisine || rec.cuisine || restaurantData?.cuisine || '',
        location: rec.restaurant?.location || rec.location || restaurantData?.location || '',
        priceRange: rec.restaurant?.priceRange || restaurantData?.priceRange || '',
        rating: rec.restaurant?.rating || restaurantData?.rating || 0
      }
    };
  });

  // Ultra-aggressive batch preloading for visible restaurants
  useEffect(() => {
    if (restaurants.length > 0) {
      const visibleRestaurants = restaurants.slice(0, displayCount);
      const imageUrls = visibleRestaurants.map((restaurant: Restaurant) => {
        const defaultImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4";
        return optimizeImageUrl(restaurant.imageUrl || defaultImage, 320, 192);
      });
      
      // Use both systems for maximum preloading speed
      Promise.all([
        imageCache.preloadBatch(imageUrls).catch(() => {}),
        instantImageLoader.batchUltraPreload(imageUrls).catch(() => {})
      ]);
    }
  }, [restaurants, displayCount]);



  const handleFilterChange = useCallback((key: keyof RestaurantFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleCuisineChange = useCallback((cuisine: string, checked: boolean) => {
    // For simplicity, we'll only support one cuisine filter at a time
    if (checked) {
      handleFilterChange('cuisine', cuisine);
    } else {
      handleFilterChange('cuisine', undefined);
    }
  }, [handleFilterChange]);

  // Fetch cuisine values from API (independent of current filters)
  const { data: availableCuisines = [], isLoading: cuisinesLoading } = useQuery<string[]>({
    queryKey: ['/api/cuisine-values'],
  });

  // Fetch location values from API (independent of current filters)
  const { data: availableLocations = [], isLoading: locationsLoading } = useQuery<string[]>({
    queryKey: ['/api/location-values'],
  });

  // Auto-detect location state
  const [autoDetectLocation, setAutoDetectLocation] = useState(true);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [autoDetectAttempt, setAutoDetectAttempt] = useState(0);

  // Auto-detect location using browser geolocation
  useEffect(() => {
    if (!autoDetectLocation || availableLocations.length === 0 || isDetectingLocation) return;
    if (detectedLocation) return; // Already detected
    
    if (!navigator.geolocation) {
      setLocationError("Location not supported by browser");
      setAutoDetectLocation(false);
      return;
    }

    setIsDetectingLocation(true);
    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          
          if (!response.ok) {
            throw new Error("Geocoding service unavailable");
          }
          
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.municipality || data.address?.village;
          
          if (city) {
            const matchedLocation = availableLocations.find(loc => 
              loc.toLowerCase().includes(city.toLowerCase()) || 
              city.toLowerCase().includes(loc.toLowerCase())
            );
            
            if (matchedLocation) {
              setDetectedLocation(matchedLocation);
              handleFilterChange('location', matchedLocation);
            } else {
              setLocationError(`No restaurants in ${city}`);
              handleFilterChange('location', undefined);
            }
          } else {
            setLocationError("Could not determine city");
            handleFilterChange('location', undefined);
          }
        } catch (error) {
          console.error("Error detecting location:", error);
          setLocationError("Location detection failed");
          handleFilterChange('location', undefined);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsDetectingLocation(false);
        handleFilterChange('location', undefined);
        setDetectedLocation(null);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Location access denied");
        } else if (error.code === error.TIMEOUT) {
          setLocationError("Location request timed out");
        } else {
          setLocationError("Could not get location");
        }
        setAutoDetectLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, [autoDetectLocation, availableLocations, autoDetectAttempt, detectedLocation, handleFilterChange, isDetectingLocation]);

  const sortedRestaurants = useMemo(() => {
    return [...restaurants].sort((a, b) => {
      switch (sortBy) {
        case 'highest-discount':
          // For now, sort by restaurant ID as placeholder since packages load individually
          // Real discount sorting would require loading all packages first
          return a.id - b.id;
        case 'lowest-price':
          // Sort by price range as rough approximation until packages load
          const priceOrder = { '€': 1, '€€': 2, '€€€': 3 };
          return (priceOrder[a.priceRange as keyof typeof priceOrder] || 0) - 
                 (priceOrder[b.priceRange as keyof typeof priceOrder] || 0);
        case 'best-rating':
          return parseFloat(b.rating) - parseFloat(a.rating);
        default:
          return 0; // Keep original order for "featured"
      }
    });
  }, [restaurants, sortBy]);

  const openRestaurantModal = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsModalOpen(true);
  }, []);

  const closeRestaurantModal = useCallback(() => {
    setSelectedRestaurant(null);
    setIsModalOpen(false);
  }, []);

  const openRestaurantMenu = useCallback((restaurant: Restaurant) => {
    setLocation(`/restaurant/${restaurant.id}/menu`);
  }, [setLocation]);

  const loadMoreRestaurants = useCallback(async () => {
    setIsLoadingMore(true);
    
    // Progressive loading - add restaurants gradually to prevent overwhelming the server
    const currentCount = displayCount;
    const nextBatch = Math.min(currentCount + 12, restaurants.length); // Smaller batches
    
    // Add restaurants in small groups with delay to stagger API calls
    for (let i = currentCount; i < nextBatch; i += 3) {
      const batchEnd = Math.min(i + 3, nextBatch);
      setDisplayCount(batchEnd);
      
      // Small delay between batches to stagger API calls
      if (batchEnd < nextBatch) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    setIsLoadingMore(false);
  }, [displayCount, restaurants.length]);

  // Reset pagination when filters or sorting change
  useEffect(() => {
    setDisplayCount(6);
  }, [filters, sortBy]);

  // Slice restaurants based on display count - optimized with useMemo
  const displayedRestaurants = useMemo(() => 
    sortedRestaurants.slice(0, displayCount), 
    [sortedRestaurants, displayCount]
  );
  
  const hasMoreRestaurants = useMemo(() => 
    sortedRestaurants.length > displayCount, 
    [sortedRestaurants.length, displayCount]
  );



  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="mb-12">
        <div className="flex flex-col lg:flex-row lg:space-x-8">
          
          {/* Filter Sidebar */}
          <aside className="w-full lg:w-64 mb-6 lg:mb-0" data-tour="filters">
            <Card className={`lg:sticky lg:top-14 border-2 border-primary/20 shadow-lg lg:overflow-visible lg:flex lg:flex-col ${
              shouldShowAIRecommendations 
                ? 'lg:min-h-[calc(100vh-2rem)]' // Expanded height to show first 3 AI recommendations with full details
                : 'lg:min-h-[calc(100vh-6rem)]' // Increased height to fit all filter elements without scrolling
            }`}>
              <CardContent className="p-6 bg-gradient-to-b from-primary/5 to-transparent lg:overflow-visible lg:flex-1 lg:min-h-[calc(100vh-8rem)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-primary flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    {t.filters}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation("/heat-map")}
                    className="flex items-center gap-1 text-xs bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 hover:from-orange-100 hover:to-red-100 transition-all"
                  >
                    <TrendingUp className="h-3 w-3 text-orange-600" />
                    <span className="text-orange-700 font-medium">Heat Map</span>
                  </Button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <Label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{t.location}</Label>
                    <Select 
                      value={filters.location || "all"} 
                      onValueChange={(value) => {
                        handleFilterChange('location', value === 'all' ? undefined : value);
                        if (value !== 'all') {
                          setAutoDetectLocation(false);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isDetectingLocation ? "Detecting..." : t.allLocations} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.allLocations}</SelectItem>
                        {locationsLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : availableLocations.length === 0 ? (
                          <SelectItem value="none" disabled>No locations available</SelectItem>
                        ) : availableLocations.map((loc) => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2 mt-2">
                      <Checkbox 
                        id="auto-detect-location"
                        checked={autoDetectLocation}
                        disabled={availableLocations.length === 0 && !locationsLoading}
                        onCheckedChange={(checked) => {
                          const isChecked = !!checked;
                          setAutoDetectLocation(isChecked);
                          setLocationError(null);
                          if (isChecked) {
                            setDetectedLocation(null);
                            setAutoDetectAttempt(prev => prev + 1); // Trigger new detection
                          } else {
                            handleFilterChange('location', undefined);
                            setDetectedLocation(null);
                          }
                        }}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <Label htmlFor="auto-detect-location" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                        {isDetectingLocation ? "Detecting your location..." : "Auto-detect my location"}
                      </Label>
                    </div>
                    {detectedLocation && autoDetectLocation && (
                      <p className="text-xs text-primary mt-1">📍 Detected: {detectedLocation}</p>
                    )}
                    {locationError && (
                      <p className="text-xs text-orange-500 mt-1">⚠️ {locationError}</p>
                    )}
                  </div>
                  
                  {/* Cuisine Type */}
                  <div>
                    <Label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{t.cuisineType}</Label>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                      {cuisinesLoading ? (
                        <p className="text-sm text-gray-500">Loading cuisines...</p>
                      ) : availableCuisines.length > 0 ? availableCuisines.map((cuisine) => (
                        <div key={cuisine} className="flex items-center space-x-2 p-2 rounded-md hover:bg-primary/10 transition-colors">
                          <Checkbox 
                            id={cuisine}
                            checked={filters.cuisine === cuisine}
                            onCheckedChange={(checked) => handleCuisineChange(cuisine, !!checked)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <Label htmlFor={cuisine} className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer truncate">
                            {t[cuisine.toLowerCase() as keyof typeof t] || cuisine}
                          </Label>
                        </div>
                      )) : (
                        <p className="text-sm text-gray-500">No cuisines available</p>
                      )}
                    </div>
                    {!cuisinesLoading && availableCuisines.length > 4 && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 pl-2">
                        <span>↓</span> Scroll for more
                      </p>
                    )}
                  </div>
                  
                  {/* Price Range */}
                  <div>
                    <Label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{t.priceRange}</Label>
                    <RadioGroup 
                      value={filters.priceRange || ""} 
                      onValueChange={(value) => handleFilterChange('priceRange', value)}
                    >
                      <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-primary/10 transition-colors">
                        <RadioGroupItem value="€" id="budget" className="text-primary" />
                        <Label htmlFor="budget" className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer truncate">€ - {t.budget}</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-primary/10 transition-colors">
                        <RadioGroupItem value="€€" id="mid-range" className="text-primary" />
                        <Label htmlFor="mid-range" className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer truncate">€€ - {t.moderate}</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-primary/10 transition-colors">
                        <RadioGroupItem value="€€€" id="fine-dining" className="text-primary" />
                        <Label htmlFor="fine-dining" className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer truncate">€€€ - {t.upscale}</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{t.minDiscount}</Label>
                    <select
                      value={filters.minDiscount?.toString() || "0"}
                      onChange={(e) => handleFilterChange('minDiscount', e.target.value === '0' ? undefined : parseInt(e.target.value))}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="0">Any Discount</option>
                      <option value="5">5% or more</option>
                      <option value="10">10% or more</option>
                      <option value="15">15% or more</option>
                      <option value="20">20% or more</option>
                    </select>
                  </div>
                </div>
                
                {/* AI Recommendations - Show first 3 directly when logged in */}
                {shouldShowAIRecommendations ? (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-primary mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      {t.aiRecommendations}
                    </h4>
                    
                    {/* Toggle buttons for recommendation types */}
                    <div className="flex gap-1 mb-3">
                      <button
                        onClick={() => setRecommendationType('all')}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          recommendationType === 'all'
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        All ({allRecommendations.length})
                      </button>
                      <button
                        onClick={() => setRecommendationType('restaurant')}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          recommendationType === 'restaurant'
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Restaurant ({allRecommendations.filter((r: any) => r.type === 'restaurant').length})
                      </button>
                      <button
                        onClick={() => setRecommendationType('menu_item')}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          recommendationType === 'menu_item'
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Product ({allRecommendations.filter((r: any) => r.type === 'menu_item').length})
                      </button>
                    </div>
                    <div className="space-y-3">
                      {enhancedRecommendations.map((recommendation: any, index: number) => (
                        <div 
                          key={recommendation.id}
                          className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-primary/20 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                            console.log('Recommendation clicked:', recommendation);
                            
                            // Capture current scroll position immediately
                            const currentScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
                            scrollPositionRef.current = currentScroll;
                            console.log('Opening modal - current scroll position:', currentScroll);
                            
                            // Open modal with recommendation details
                            setSelectedRecommendation(recommendation);
                            setTimeout(() => {
                              setShowRecommendationModal(true);
                              console.log('Modal state set to true');
                            }, 50);
                          }}
                        >
                          {/* Header - Different display for restaurant vs product recommendations */}
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                              {recommendation.type === 'menu_item' ? (
                                // For product recommendations: Product name prominent, restaurant name secondary
                                <>
                                  <h5 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                                    {recommendation.recommendationText?.split('.')[0] || recommendation.menuItem?.name || recommendation.menuItemName || 'Recommended Product'}
                                  </h5>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    from {recommendation.restaurant.name} • {recommendation.restaurant.cuisine}
                                  </p>
                                </>
                              ) : (
                                // For restaurant recommendations: Restaurant name prominent
                                <>
                                  <h5 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                                    {recommendation.restaurant.name}
                                  </h5>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {recommendation.restaurant.cuisine} • {recommendation.restaurant.location}
                                  </p>
                                </>
                              )}
                            </div>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium ml-2">
                              #{index + 1}
                            </span>
                          </div>

                          {/* Additional details - only show for restaurant recommendations */}
                          {recommendation.type !== 'menu_item' && recommendation.menuItem && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                {recommendation.menuItem.name}
                              </p>
                              {recommendation.menuItem.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {recommendation.menuItem.description.slice(0, 60)}...
                                </p>
                              )}
                            </div>
                          )}

                          {/* Nutritional highlights */}
                          {recommendation.nutritionalHighlights?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {recommendation.nutritionalHighlights.slice(0, 3).map((highlight: string, i: number) => (
                                <span key={i} className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                                  {highlight}
                                </span>
                              ))}
                              {recommendation.nutritionalHighlights.length > 3 && (
                                <span className="text-xs text-gray-500">+{recommendation.nutritionalHighlights.length - 3} more</span>
                              )}
                            </div>
                          )}

                          {/* AI reasoning */}
                          {recommendation.reasoning && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                              {recommendation.reasoning.slice(0, 100)}...
                            </p>
                          )}

                          {/* Score indicator */}
                          {recommendation.recommendationScore && (
                            <div className="mt-2 flex items-center">
                              <div className="flex items-center">
                                <span className="text-xs text-gray-500 mr-1">Match:</span>
                                <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(100, (recommendation.recommendationScore || 0) * 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500 ml-1">
                                  {Math.round((recommendation.recommendationScore || 0) * 100)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs w-full"
                        onClick={() => setLocation('/dietary-recommendations')}
                      >
                        View All {aiRecommendations?.recommendations?.length || 0} {t.recommendations}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6">
                    <AIRecommendations />
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
          
          {/* Restaurant Grid */}
          <div className="flex-1">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-primary mb-2">{t.restaurant_vouchers}</h1>
              <p className="text-xl text-muted-foreground">{t.discover_save_dine}</p>
            </div>
            
            {/* Featured Chefs Section */}
            <FeaturedChefsSection />
            
            <div className="restaurant-header flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">{t.availableRestaurants}</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {t.showingRestaurants.replace('{current}', displayedRestaurants.length.toString()).replace('{total}', sortedRestaurants.length.toString())}
                </span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Sort by: Featured</SelectItem>
                    <SelectItem value="highest-discount">Highest Discount</SelectItem>
                    <SelectItem value="lowest-price">Lowest Price</SelectItem>
                    <SelectItem value="best-rating">Best Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            

            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="mt-4 text-gray-500">Loading restaurants...</p>
              </div>
            ) : sortedRestaurants.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No restaurants found matching your criteria.</p>
              </div>
            ) : (
              <>
                <div 
                  className="restaurant-grid grid grid-cols-1 md:grid-cols-2 gap-6" 
                  data-tour="restaurant-grid"
                >
                  {displayedRestaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      onClick={() => openRestaurantModal(restaurant)}
                      onMenuClick={() => openRestaurantMenu(restaurant)}
                    />
                  ))}
                </div>
                
                {hasMoreRestaurants && (
                  <div className="mt-8 flex justify-center">
                    <Button 
                      variant="outline" 
                      onClick={loadMoreRestaurants}
                      disabled={isLoadingMore}
                      className="border-primary text-primary hover:bg-primary hover:text-white px-8 py-3 text-lg font-semibold min-h-[48px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      aria-label={`${t.loadMoreRestaurants} - Currently showing ${displayedRestaurants.length} of ${sortedRestaurants.length} restaurants`}
                    >
                      {isLoadingMore ? 'Loading...' : t.loadMoreRestaurants}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <RestaurantModal
        restaurant={selectedRestaurant}
        isOpen={isModalOpen}
        onClose={closeRestaurantModal}
      />

      {/* AI Recommendation Details Modal - Portal to document.body */}
      {showRecommendationModal && selectedRecommendation && createPortal(
        <div 
          ref={modalRef}
          className="ai-recommendation-modal"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              handleCloseModal();
            }
          }}
          onClick={(e) => {
            // Close modal when clicking on the background overlay
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              handleCloseModal();
            }
          }}
        >
          <div 
            className="modal-content p-6"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="document"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 id="modal-title" className="text-xl font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Recommendation Details
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Complete information about this AI recommendation
                </p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseModal();
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

          {selectedRecommendation && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg">
                {selectedRecommendation.type === 'menu_item' ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {selectedRecommendation.recommendationText?.split('.')[0] || 'Recommended Product'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      from {selectedRecommendation.restaurant.name} • {selectedRecommendation.restaurant.cuisine}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {selectedRecommendation.restaurant.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedRecommendation.restaurant.cuisine} • {selectedRecommendation.restaurant.location}
                    </p>
                  </div>
                )}
              </div>

              {/* Restaurant Information */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Restaurant Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Cuisine:</span>
                    <p className="font-medium">{selectedRecommendation.restaurant.cuisine}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Location:</span>
                    <p className="font-medium">{selectedRecommendation.restaurant.location}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Price Range:</span>
                    <p className="font-medium">{selectedRecommendation.restaurant.priceRange}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Rating:</span>
                    <p className="font-medium">⭐ {selectedRecommendation.restaurant.rating}/5</p>
                  </div>
                </div>
                {selectedRecommendation.restaurant.description && (
                  <div className="mt-3">
                    <span className="text-gray-500 dark:text-gray-400">Description:</span>
                    <p className="text-sm mt-1">{selectedRecommendation.restaurant.description}</p>
                  </div>
                )}
              </div>

              {/* AI Analysis */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">AI Analysis</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Recommendation:</span>
                    <p className="text-sm mt-1">{selectedRecommendation.recommendationText}</p>
                  </div>
                  
                  {selectedRecommendation.reasoningFactors?.length > 0 && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Reasoning:</span>
                      <ul className="text-sm mt-1 space-y-1">
                        {selectedRecommendation.reasoningFactors.map((factor: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Nutritional Highlights */}
              {selectedRecommendation.nutritionalHighlights?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Nutritional Highlights</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecommendation.nutritionalHighlights.map((highlight: string, index: number) => (
                      <span key={index} className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm">
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cautionary Notes */}
              {selectedRecommendation.cautionaryNotes?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Cautionary Notes</h4>
                  <div className="space-y-2">
                    {selectedRecommendation.cautionaryNotes.map((note: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-amber-500">⚠️</span>
                        <span className="text-sm">{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Match Scores */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Compatibility Scores</h4>
                <div className="space-y-3">
                  {selectedRecommendation.recommendationScore && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Overall Match</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (selectedRecommendation.recommendationScore || 0) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round((selectedRecommendation.recommendationScore || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {selectedRecommendation.nutritionalMatch && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Nutritional Match</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (selectedRecommendation.nutritionalMatch || 0) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round((selectedRecommendation.nutritionalMatch || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedRecommendation.preferenceMatch && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Preference Match</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (selectedRecommendation.preferenceMatch || 0) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round((selectedRecommendation.preferenceMatch || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedRecommendation.healthGoalAlignment && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Health Goal Alignment</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (selectedRecommendation.healthGoalAlignment || 0) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round((selectedRecommendation.healthGoalAlignment || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={() => {
                    // Navigate to restaurant based on recommendation type
                    if (selectedRecommendation.type === 'restaurant') {
                      const restaurantId = selectedRecommendation.restaurantId || selectedRecommendation.targetId;
                      if (restaurantId) {
                        setLocation(`/restaurant/${restaurantId}/menu?from=ai-recommendations`);
                      }
                    } else if (selectedRecommendation.type === 'menu_item') {
                      setLocation(`/restaurant/101/menu?from=ai-recommendations`);
                    }
                    setShowRecommendationModal(false);
                  }}
                  className="flex-1"
                >
                  Visit Restaurant
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleCloseModal()}
                  className="flex-1"
                >
                  Back to Main Page
                </Button>
              </div>
            </div>
          )}
          </div>
        </div>,
        document.body
      )}

      <AIAssistant 
        context={{
          restaurants: restaurants,
          customerPreferences: {
            cuisine: filters.cuisine,
            priceRange: filters.priceRange,
            location: filters.location
          }
        }}
      />
    </main>
  );
}
