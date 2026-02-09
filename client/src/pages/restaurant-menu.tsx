import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, Clock, MapPin, ArrowLeft, Flame, Leaf, Plus, Minus, ShoppingCart, ChefHat } from "lucide-react";
import { useLocation } from "wouter";
import type { Restaurant, MenuItem } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { MenuCart } from "@/components/menu-cart";
import { useToast } from "@/hooks/use-toast";

export default function RestaurantMenuPage() {
  const params = useParams();
  const restaurantId = params.restaurantId ? parseInt(params.restaurantId) : null;
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");

  // Check if user came from AI recommendations
  const searchParams = new URLSearchParams(window.location.search);
  const fromAIRecommendations = searchParams.get('from') === 'ai-recommendations';

  // Use combined endpoint for faster loading with aggressive optimization
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
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes - aggressive caching
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    refetchOnWindowFocus: false, // Don't refetch on window focus for speed
    refetchOnMount: false, // Don't refetch on mount if data exists
    retry: 1, // Reduce retries for faster failure handling
  });

  const restaurant = restaurantData?.restaurant;
  const menuItems = restaurantData?.menuItems || [];
  const isLoadingRestaurant = isLoading;
  const isLoadingMenu = isLoading;

  // Scroll to specific menu item if hash is present, otherwise scroll to top
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && menuItems.length > 0) {
      // Reduced delay for faster user experience
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add prominent highlight with animation
          element.classList.add('ring-4', 'ring-primary', 'ring-opacity-75', 'bg-primary/10', 'transition-all', 'duration-300');
          // Remove highlight after 4 seconds
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-primary', 'ring-opacity-75', 'bg-primary/10', 'transition-all', 'duration-300');
          }, 4000);
        }
      }, 300); // Reduced delay from 800ms to 300ms for faster response
    } else if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, [menuItems]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Optimized loading skeleton */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded w-32"></div>
              <div className="h-8 bg-gray-300 rounded w-64"></div>
              <div className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-28"></div>
              </div>
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
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
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

  const categories = menuItems.length > 0 
    ? ["all", ...Array.from(new Set((menuItems as MenuItem[]).map((item: MenuItem) => item.category)))]
    : ["all"];

  const filteredItems = selectedCategory === "all" 
    ? (menuItems as MenuItem[])
    : (menuItems as MenuItem[]).filter((item: MenuItem) => item.category === selectedCategory);

  const getSpiceIcon = (level: number) => {
    if (level === 0) return null;
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(level, 5) }, (_, i) => (
          <Flame key={i} className="w-3 h-3 text-orange-500" />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Button 
            variant="outline" 
            onClick={() => fromAIRecommendations ? setLocation('/dietary-recommendations') : setLocation('/')}
            className="mb-4 bg-white hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {fromAIRecommendations ? 'Back to AI Recommendations' : t.backToRestaurants}
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
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

      {/* Menu Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category: string) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category === "all" ? "All Items" : category.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No menu items available</h3>
            <p className="text-gray-500">This restaurant hasn't added their menu yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item: MenuItem) => (
              <Card key={item.id} id={`item-${item.id}`} className="overflow-hidden hover:shadow-lg transition-shadow scroll-mt-4 flex flex-col">
                <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`${item.imageUrl ? 'hidden' : ''} w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800`}>
                    <div className="text-center">
                      <ChefHat className="h-12 w-12 text-orange-400 mx-auto mb-2" />
                      <p className="text-sm text-orange-600 dark:text-orange-300 font-medium">{item.name}</p>
                    </div>
                  </div>
                  {item.isPopular && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-yellow-500 text-white">
                        Popular
                      </Badge>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg">{item.name}</h4>
                    <span className="text-primary font-bold text-lg">€{item.price}</span>
                  </div>
                  
                  {item.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-2">
                      {item.preparationTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{item.preparationTime}min</span>
                        </div>
                      )}
                      {getSpiceIcon(item.spiceLevel ?? 0)}
                    </div>
                    
                    {item.dietaryTags && item.dietaryTags.length > 0 && (
                      <div className="flex gap-1">
                        {item.dietaryTags.includes('vegan') && (
                          <div className="relative group">
                            <Leaf className="w-4 h-4 text-green-600" />
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              Vegan
                            </span>
                          </div>
                        )}
                        {item.dietaryTags.includes('vegetarian') && (
                          <div className="relative group">
                            <Leaf className="w-4 h-4 text-green-500" />
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              Vegetarian
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {item.calories && (
                    <div className="text-xs text-gray-500 mb-2">
                      {item.calories} calories
                    </div>
                  )}

                  {item.allergens && item.allergens.length > 0 && (
                    <div className="text-xs text-orange-600 mb-3">
                      Contains: {item.allergens.join(', ')}
                    </div>
                  )}

                  {item.ingredients && item.ingredients.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Ingredients: {item.ingredients.slice(0, 3).join(', ')}
                      {item.ingredients.length > 3 && '...'}
                    </div>
                  )}

                  <div className="mt-auto pt-3 border-t">
                    <Button 
                      onClick={() => setSelectedMenuItem(item)}
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Bottom Back Button */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/')}
            className="mb-4 bg-white hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.backToRestaurants}
          </Button>
        </div>
      </div>

      {/* Add to Cart Modal */}
      <Dialog open={!!selectedMenuItem} onOpenChange={(open) => !open && setSelectedMenuItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Cart</DialogTitle>
          </DialogHeader>
          
          {selectedMenuItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedMenuItem.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop"}
                  alt={selectedMenuItem.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedMenuItem.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{selectedMenuItem.description}</p>
                  <p className="text-lg font-bold text-primary">€{selectedMenuItem.price}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Quantity</label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-10 w-10 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-10 w-10 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Special Requests (Optional)</label>
                  <Textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Any special instructions for this item..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-lg font-semibold">
                    Total: €{(parseFloat(selectedMenuItem.price.toString()) * quantity).toFixed(2)}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSelectedMenuItem(null)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      addToCart(selectedMenuItem, quantity, specialRequests, restaurant?.name);
                      setSelectedMenuItem(null);
                      setQuantity(1);
                      setSpecialRequests("");
                    }}>
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
}