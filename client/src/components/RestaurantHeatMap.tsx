import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MapPin, Star, Users, TrendingUp, Filter, Zap, Navigation, Menu, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Restaurant {
  id: number;
  name: string;
  latitude?: number;
  longitude?: number;
  rating: string | number;
  reviewCount: number;
  cuisine: string;
  priceRange: string;
  isPopular?: boolean;
  orderCount?: number;
  distance?: number;
}

interface MenuItem {
  id: number;
  restaurantId: number;
  name: string;
  description?: string;
  category: string;
  price: string;
  imageUrl?: string;
  ingredients: string[];
  dietaryOptions: string[];
  allergenInfo: string[];
  isAvailable: boolean;
}

interface HeatMapPoint {
  id: number;
  name: string;
  lat: number;
  lng: number;
  intensity: number;
  color: string;
  restaurant: Restaurant;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

const HEAT_COLORS = {
  high: '#ff4444',    // Red - highest recommendation
  medium: '#ff8800',  // Orange - medium recommendation  
  low: '#ffcc00',     // Yellow - lower recommendation
  minimal: '#88cc88'  // Green - basic recommendation
};

export default function RestaurantHeatMap() {
  const { t } = useLanguage();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedRadius, setSelectedRadius] = useState([5]); // km
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [heatIntensity, setHeatIntensity] = useState([70]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied, using default location');
          // Default to Bucharest coordinates
          setUserLocation({
            latitude: 44.4268,
            longitude: 26.1025
          });
        }
      );
    }
  }, []);

  // Fetch restaurants data
  const { data: restaurants = [], isLoading } = useQuery<Restaurant[]>({
    queryKey: ['/api/restaurants'],
    enabled: !!userLocation
  });

  // Fetch menu data for selected restaurant
  const { data: menuItems = [], isLoading: menuLoading } = useQuery<MenuItem[]>({
    queryKey: [`/api/restaurants/${selectedRestaurantId}/menu`],
    enabled: !!selectedRestaurantId
  });

  // Navigation functions
  const openGoogleMaps = (restaurant: Restaurant) => {
    const lat = restaurant.latitude || 0;
    const lng = restaurant.longitude || 0;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const openWaze = (restaurant: Restaurant) => {
    const lat = restaurant.latitude || 0;
    const lng = restaurant.longitude || 0;
    const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    window.open(url, '_blank');
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Generate heat map points with recommendation intensity
  const heatMapPoints: HeatMapPoint[] = useMemo(() => {
    if (!restaurants.length || !userLocation) return [];

    return restaurants
      .map((restaurant: Restaurant) => {
        // Use actual coordinates if available, otherwise generate nearby coordinates
        const lat = restaurant.latitude || (userLocation.latitude + (Math.random() - 0.5) * 0.1);
        const lng = restaurant.longitude || (userLocation.longitude + (Math.random() - 0.5) * 0.1);
        const distance = calculateDistance(userLocation.latitude, userLocation.longitude, lat, lng);

        // Calculate recommendation intensity based on multiple factors
        const ratingValue = typeof restaurant.rating === 'number' ? restaurant.rating : parseFloat(restaurant.rating) || 3.5;
        const ratingScore = ratingValue / 5; // 0-1
        const popularityScore = restaurant.isPopular ? 1 : 0.5;
        const proximityScore = Math.max(0, 1 - (distance / selectedRadius[0])); // Closer = higher score
        const reviewScore = Math.min(1, (restaurant.reviewCount || 10) / 100); // More reviews = higher score

        // Weighted combination of factors
        const intensity = (
          ratingScore * 0.3 +
          popularityScore * 0.25 +
          proximityScore * 0.25 +
          reviewScore * 0.2
        ) * 100;

        // Determine color based on intensity
        let color = HEAT_COLORS.minimal;
        if (intensity >= 80) color = HEAT_COLORS.high;
        else if (intensity >= 60) color = HEAT_COLORS.medium;
        else if (intensity >= 40) color = HEAT_COLORS.low;

        return {
          id: restaurant.id,
          name: restaurant.name,
          lat,
          lng,
          intensity: Math.round(intensity),
          color,
          restaurant: {
            ...restaurant,
            latitude: lat,
            longitude: lng,
            distance: Math.round(distance * 10) / 10
          }
        };
      })
      .filter(point => {
        // Filter by radius
        if (point.restaurant.distance! > selectedRadius[0]) return false;
        
        // Filter by cuisine
        if (selectedCuisine !== 'all' && point.restaurant.cuisine !== selectedCuisine) return false;
        
        // Filter by price range
        if (selectedPriceRange !== 'all' && point.restaurant.priceRange !== selectedPriceRange) return false;
        
        // Filter by heat intensity threshold
        if (point.intensity < heatIntensity[0]) return false;
        
        return true;
      })
      .sort((a, b) => b.intensity - a.intensity); // Sort by intensity descending
  }, [restaurants, userLocation, selectedRadius, selectedCuisine, selectedPriceRange, heatIntensity]);

  // Get unique cuisines and price ranges for filters
  const cuisines = useMemo(() => {
    const unique = Array.from(new Set(restaurants.map((r: Restaurant) => r.cuisine)));
    return unique.sort();
  }, [restaurants]);

  const priceRanges = useMemo(() => {
    const unique = Array.from(new Set(restaurants.map((r: Restaurant) => r.priceRange)));
    return unique.sort();
  }, [restaurants]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading restaurant heat map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Restaurant Heat Map
          </h2>
          <p className="text-muted-foreground">
            Discover restaurants with AI-powered recommendations based on location, rating, and popularity
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Heat Map Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Radius */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Radius: {selectedRadius[0]}km</label>
                <Slider
                  value={selectedRadius}
                  onValueChange={setSelectedRadius}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Heat Intensity Threshold */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Intensity: {heatIntensity[0]}%</label>
                <Slider
                  value={heatIntensity}
                  onValueChange={setHeatIntensity}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Cuisine Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Cuisine Type</label>
                <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cuisines</SelectItem>
                    {cuisines.map(cuisine => (
                      <SelectItem key={cuisine} value={cuisine}>{cuisine}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Price Range</label>
                <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    {priceRanges.map(range => (
                      <SelectItem key={range} value={range}>{range}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Heat Map Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Recommendation Intensity:</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: HEAT_COLORS.high }}></div>
                  <span className="text-xs">Hot (80-100%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: HEAT_COLORS.medium }}></div>
                  <span className="text-xs">Warm (60-79%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: HEAT_COLORS.low }}></div>
                  <span className="text-xs">Cool (40-59%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: HEAT_COLORS.minimal }}></div>
                  <span className="text-xs">Mild (&lt;40%)</span>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {heatMapPoints.length} restaurants found
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Restaurant Heat Map Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {heatMapPoints.map((point) => (
          <Card 
            key={point.id} 
            className="relative overflow-hidden border-2 hover:shadow-lg transition-all cursor-pointer"
            style={{ borderColor: point.color }}
          >
            {/* Heat Intensity Badge */}
            <div 
              className="absolute top-2 right-2 px-2 py-1 rounded-full text-white text-xs font-bold z-10"
              style={{ backgroundColor: point.color }}
            >
              {point.intensity}%
            </div>

            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Restaurant Name */}
                <h3 className="font-semibold text-lg leading-tight">{point.name}</h3>

                {/* Location & Distance */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{point.restaurant.distance}km away</span>
                </div>

                {/* Rating & Reviews */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{typeof point.restaurant.rating === 'number' ? point.restaurant.rating.toFixed(1) : (point.restaurant.rating || '3.5')}</span>
                    <span className="text-sm text-muted-foreground">({point.restaurant.reviewCount || 0})</span>
                  </div>
                  {point.restaurant.isPopular && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Popular
                    </Badge>
                  )}
                </div>

                {/* Cuisine & Price */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{point.restaurant.cuisine}</span>
                  <span className="font-medium">{point.restaurant.priceRange}</span>
                </div>

                {/* Heat Factors */}
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-3">
                    Recommended for: Rating, Location, Popularity
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {/* Direction Dropdown Button */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 text-xs"
                        >
                          <Navigation className="h-3 w-3" />
                          {t.getDirections}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => openGoogleMaps(point.restaurant)}
                          className="flex items-center gap-2"
                        >
                          <Navigation className="h-4 w-4" />
                          Google Maps
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openWaze(point.restaurant)}
                          className="flex items-center gap-2"
                        >
                          <Navigation className="h-4 w-4 text-blue-600" />
                          Waze
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Menu Modal */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => setSelectedRestaurantId(point.restaurant.id)}
                          className="flex items-center gap-1 text-xs"
                        >
                          <Menu className="h-3 w-3" />
                          Menu
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Menu className="h-5 w-5" />
                            {point.restaurant.name} - Menu
                          </DialogTitle>
                          <DialogDescription>
                            Browse the menu items and categories available at this restaurant.
                          </DialogDescription>
                        </DialogHeader>
                        
                        {menuLoading ? (
                          <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        ) : menuItems.length > 0 ? (
                          <div className="space-y-6">
                            {/* Group menu items by category */}
                            {Array.from(new Set(menuItems.map(item => item.category))).map((category, index) => (
                              <div key={category} className="space-y-3">
                                <h3 className="text-lg font-semibold capitalize border-b pb-2">
                                  {category}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {menuItems
                                    .filter(item => item.category === category)
                                    .map(item => (
                                      <Card key={item.id} className="overflow-hidden">
                                        <CardContent className="p-4">
                                          <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-medium text-sm">{item.name}</h4>
                                            <span className="font-bold text-primary">€{item.price}</span>
                                          </div>
                                          {item.description && (
                                            <p className="text-xs text-muted-foreground mb-2">
                                              {item.description}
                                            </p>
                                          )}
                                          {item.ingredients && item.ingredients.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-2">
                                              {item.ingredients.slice(0, 3).map((ingredient, idx) => (
                                                <Badge key={idx} variant="secondary" className="text-xs">
                                                  {ingredient}
                                                </Badge>
                                              ))}
                                              {item.ingredients.length > 3 && (
                                                <Badge variant="secondary" className="text-xs">
                                                  +{item.ingredients.length - 3} more
                                                </Badge>
                                              )}
                                            </div>
                                          )}
                                          {item.dietaryOptions && item.dietaryOptions.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {item.dietaryOptions.map((option, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                  {option}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}
                                        </CardContent>
                                      </Card>
                                    ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Menu className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Menu Available</h3>
                            <p className="text-muted-foreground">
                              This restaurant hasn't uploaded their menu yet.
                            </p>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {heatMapPoints.length === 0 && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">No restaurants found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or increasing the search radius to discover more restaurants.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedRadius([10]);
                  setHeatIntensity([0]);
                  setSelectedCuisine('all');
                  setSelectedPriceRange('all');
                }}
              >
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}