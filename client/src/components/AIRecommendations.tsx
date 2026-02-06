import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Brain, 
  Star, 
  Clock, 
  TrendingUp, 
  Heart, 
  AlertTriangle, 
  RefreshCw, 
  ChefHat,
  MapPin,
  Euro,
  Navigation,
  ExternalLink,
  Menu
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AIRecommendation {
  id: number;
  type: 'restaurant' | 'menu_item';
  targetId: number;
  recommendationScore: number;
  reasoningFactors: string[];
  nutritionalMatch: number;
  preferenceMatch: number;
  healthGoalAlignment: number;
  recommendationText: string;
  nutritionalHighlights: string[];
  cautionaryNotes: string[];
  recommendedFor?: string;
  idealDayTime?: string;
  reasoning?: string;
  restaurant?: {
    id: number;
    name: string;
    cuisine: string;
    location: string;
    priceRange: string;
    rating: number;
    description?: string;
    phone?: string;
    email?: string;
  };
  menuItem?: {
    id: number;
    name: string;
    description: string;
    price: number;
    category: string;
    calories?: number;
    dietaryTags?: string[];
    ingredients?: string;
    allergens?: string[];
  };
}

interface AIRecommendationsProps {
  className?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  showFilters?: boolean;
  recommendations?: AIRecommendation[];
}

export function AIRecommendations({ className, mealType, showFilters = true, recommendations: propRecommendations }: AIRecommendationsProps) {
  const [selectedMealType, setSelectedMealType] = useState<string>(mealType || 'any');
  const [recommendationType, setRecommendationType] = useState<string>('both');
  const [selectedRecommendation, setSelectedRecommendation] = useState<AIRecommendation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  // Navigation helper functions
  const openGoogleMaps = (location: string, restaurantName: string) => {
    const query = encodeURIComponent(`${restaurantName} ${location}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const openWaze = (location: string, restaurantName: string) => {
    const query = encodeURIComponent(`${restaurantName} ${location}`);
    window.open(`https://waze.com/ul?q=${query}&navigate=yes`, '_blank');
  };

  const openRestaurantMenu = (restaurantId: number, menuItemId?: number) => {
    // Prefetch restaurant data before navigation for instant loading
    queryClient.prefetchQuery({
      queryKey: ['/api/restaurants', restaurantId, 'full'],
      queryFn: async () => {
        const response = await fetch(`/api/restaurants/${restaurantId}/full`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch restaurant data');
        return response.json();
      },
      staleTime: 30 * 60 * 1000,
    });

    if (menuItemId) {
      // For menu item recommendations, navigate directly to the specific item
      const url = `/restaurant/${restaurantId}/menu?from=ai-recommendations#item-${menuItemId}`;
      setLocation(url);
    } else {
      // For restaurant recommendations, just open the menu
      const url = `/restaurant/${restaurantId}/menu?from=ai-recommendations`;
      setLocation(url);
    }
  };

  // Use prop recommendations if provided, otherwise fetch from API
  const { data: fetchedRecommendations, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-recommendations', selectedMealType, recommendationType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedMealType !== 'any') params.append('mealType', selectedMealType);
      
      const response = await fetch(`/api/dietary/recommendations?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      const data = await response.json();
      return data.recommendations || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !propRecommendations, // Only fetch if no prop recommendations provided
  });

  // Use prop recommendations if provided, otherwise use fetched recommendations
  const recommendations = propRecommendations || fetchedRecommendations || [];

  const generateRecommendationsMutation = useMutation({
    mutationFn: async () => {
      const body: any = {
        maxRecommendations: 10,
        includeRestaurants: recommendationType === 'restaurants' || recommendationType === 'both',
        includeMenuItems: recommendationType === 'menu_items' || recommendationType === 'both'
      };
      
      if (selectedMealType !== 'any') {
        body.mealType = selectedMealType;
      }

      const response = await fetch('/api/dietary/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
      toast({
        title: t.recommendationsUpdated,
        description: t.freshRecommendations,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || t.failedToGenerate,
        variant: "destructive",
      });
    }
  });



  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 dark:text-green-400";
    if (score >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 0.8) return "default";
    if (score >= 0.6) return "secondary";
    return "outline";
  };

  // Handle recommendation card click
  const handleRecommendationClick = (recommendation: AIRecommendation) => {
    setSelectedRecommendation(recommendation);
    setIsModalOpen(true);
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
            <div>
              <h3 className="font-semibold">{t.noDietaryProfileFound}</h3>
              <p className="text-sm text-muted-foreground">
                {t.createDietaryProfileFirst}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card className="lg:max-h-[calc(100vh-20rem)] lg:flex lg:flex-col">
        <CardHeader className="pb-3 lg:flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="truncate">{t.aiPoweredRecommendations}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {t.personalizedSuggestions}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 lg:overflow-y-auto lg:flex-1">
          {showFilters && (
            <div className="space-y-3 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-medium block truncate">{t.mealType}:</label>
                <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">{t.any}</SelectItem>
                    <SelectItem value="breakfast">{t.breakfast}</SelectItem>
                    <SelectItem value="lunch">{t.lunch}</SelectItem>
                    <SelectItem value="dinner">{t.dinner}</SelectItem>
                    <SelectItem value="snack">{t.snack}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium block truncate">{t.type}:</label>
                <Select value={recommendationType} onValueChange={setRecommendationType}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">{t.both}</SelectItem>
                    <SelectItem value="restaurants">{t.restaurants}</SelectItem>
                    <SelectItem value="menu_items">{t.menuItems}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => generateRecommendationsMutation.mutate()}
                disabled={generateRecommendationsMutation.isPending}
                className="flex items-center gap-2 w-full"
              >
                <RefreshCw className={`h-4 w-4 ${generateRecommendationsMutation.isPending ? 'animate-spin' : ''}`} />
                <span className="truncate">
                  {generateRecommendationsMutation.isPending ? t.generating : t.generateFresh}
                </span>
              </Button>
            </div>
          )}

          {isLoading || generateRecommendationsMutation.isPending ? (
            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Brain className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <h3 className="font-semibold mb-2">
                  {generateRecommendationsMutation.isPending ? t.generatingRecommendations : t.loadingRecommendations}
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground max-w-md mx-auto">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <span>{t.analyzingProfile}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <span>{t.matchingRestaurants}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <span>{t.calculatingScores}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  {t.typicallyTakes}
                </p>
              </div>
            </div>
          ) : recommendations && recommendations.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendations.map((rec: any) => (
                  <Card 
                    key={rec.id} 
                    className="border-l-4 border-l-primary cursor-pointer hover:shadow-md transition-shadow flex flex-col"
                    onClick={() => handleRecommendationClick(rec)}
                  >
                  <CardContent className="p-3 flex-1 flex flex-col">
                    <div className="space-y-2 mb-3 flex-1">
                      {/* Header with title and match score */}
                      <div className="flex items-start gap-2">
                        {rec.type === 'restaurant' ? (
                          <ChefHat className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <MapPin className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          {rec.type === 'menu_item' ? (
                            // For product recommendations: Product name prominent, restaurant name secondary
                            <>
                              <h4 className="font-semibold text-sm leading-tight truncate text-gray-900 dark:text-gray-100">
                                {rec.recommendationText?.split('.')[0] || rec.menuItem?.name || 'Menu Item'}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                {rec.restaurant?.name ? `from ${rec.restaurant.name} • ${rec.restaurant.cuisine}` : 'Menu Item Recommendation'}
                              </p>
                            </>
                          ) : (
                            // For restaurant recommendations: Restaurant name prominent
                            <>
                              <h4 className="font-semibold text-sm leading-tight truncate text-gray-900 dark:text-gray-100">
                                {rec.restaurant?.name || rec.recommendationText?.split('.')[0] || 'Restaurant'}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                {rec.restaurant?.name ? `from ${rec.restaurant.name} • ${rec.restaurant.cuisine}` : `${rec.restaurant?.cuisine || 'Restaurant'} • ${rec.restaurant?.location || 'Location'}`}
                              </p>
                            </>
                          )}
                          <div className="mt-1">
                            <Badge variant={getScoreBadgeVariant(rec.recommendationScore)} className="text-xs">
                              {Math.round(rec.recommendationScore * 100)}%
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Additional details */}
                      {rec.type === 'restaurant' && rec.restaurant && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 fill-current" />
                          <span>{rec.restaurant.rating}</span>
                          <span>•</span>
                          <span>{rec.restaurant.priceRange}</span>
                        </div>
                      )}

                      {rec.type === 'menu_item' && rec.menuItem && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="truncate">{rec.menuItem.category}</span>
                          <span>•</span>
                          <Euro className="h-3 w-3" />
                          <span>{rec.menuItem.price}</span>
                          {rec.menuItem.calories && (
                            <>
                              <span>•</span>
                              <span>{rec.menuItem.calories} cal</span>
                            </>
                          )}
                        </div>
                      )}

                    </div>

                    <p className="text-xs mb-3 leading-relaxed text-muted-foreground">{rec.recommendationText}</p>

                    {rec.nutritionalHighlights?.length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1 mb-1">
                          <Heart className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span className="text-xs font-medium truncate">{t.nutritionalHighlights}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {rec.nutritionalHighlights.slice(0, 2).map((highlight: any, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs max-w-full">
                              <span className="truncate max-w-20">{highlight}</span>
                            </Badge>
                          ))}
                          {rec.nutritionalHighlights.length > 2 && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              +{rec.nutritionalHighlights.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {rec.cautionaryNotes?.length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1 mb-1">
                          <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                          <span className="text-xs font-medium truncate">Notes</span>
                        </div>
                        <div className="space-y-1 max-h-16 overflow-y-auto">
                          {rec.cautionaryNotes.slice(0, 2).map((note: any, index: number) => (
                            <p key={index} className="text-xs text-amber-700 dark:text-amber-300 leading-tight truncate">
                              • {note}
                            </p>
                          ))}
                          {rec.cautionaryNotes.length > 2 && (
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                              • +{rec.cautionaryNotes.length - 2} more notes
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {/* Time/context badges */}
                      {(rec.recommendedFor || rec.idealDayTime) && (
                        <div className="flex flex-wrap gap-1">
                          {rec.recommendedFor && (
                            <Badge variant="outline" className="text-xs max-w-full">
                              <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{rec.recommendedFor}</span>
                            </Badge>
                          )}
                          {rec.idealDayTime && (
                            <Badge variant="outline" className="text-xs max-w-full">
                              <span className="truncate">{rec.idealDayTime}</span>
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-1 mt-auto pt-2">
                        {/* Always show View button for both types */}
                        {rec.type === 'restaurant' && (
                          <Button 
                            size="sm" 
                            variant="default"
                            onMouseEnter={() => {
                              // Prefetch data on hover for instant loading
                              queryClient.prefetchQuery({
                                queryKey: ['/api/restaurants', rec.targetId, 'full'],
                                queryFn: async () => {
                                  const response = await fetch(`/api/restaurants/${rec.targetId}/full`, {
                                    credentials: 'include'
                                  });
                                  if (!response.ok) throw new Error('Failed to fetch restaurant data');
                                  return response.json();
                                },
                                staleTime: 30 * 60 * 1000,
                              });
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navigate immediately - data already prefetched on hover
                              setLocation(`/restaurant/${rec.targetId}/menu?from=ai-recommendations`);
                            }}
                            className="flex items-center gap-1 flex-1 text-xs"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span className="truncate">View</span>
                          </Button>
                        )}
                        
                        {rec.type === 'menu_item' && (
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={(e) => {
                              e.stopPropagation();
                              const restaurantId = rec.restaurant?.id;
                              const menuItemId = rec.targetId; // For menu items, targetId is the menu item ID
                              if (restaurantId && menuItemId) {
                                openRestaurantMenu(restaurantId, menuItemId);
                              } else {
                                console.warn('Missing restaurant or menu item ID:', { restaurantId, menuItemId, rec });
                                // Fallback: just open the restaurant menu
                                openRestaurantMenu(restaurantId || rec.targetId);
                              }
                            }}
                            className="flex items-center gap-1 flex-1 text-xs"
                          >
                            <Menu className="h-3 w-3" />
                            <span className="truncate">Menu</span>
                          </Button>
                        )}

                        {/* Direction dropdown button */}
                        {(rec.restaurant?.location || rec.type === 'restaurant') && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex items-center gap-1 flex-1 text-xs"
                              >
                                <Navigation className="h-3 w-3" />
                                <span className="truncate">Nav</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => openGoogleMaps(
                                  rec.restaurant?.location || 'Restaurant location', 
                                  rec.restaurant?.name || (rec.type === 'restaurant' ? 'Restaurant' : 'Menu Item Restaurant')
                                )}
                                className="flex items-center gap-2"
                              >
                                <Navigation className="h-4 w-4" />
                                Google Maps
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openWaze(
                                  rec.restaurant?.location || 'Restaurant location', 
                                  rec.restaurant?.name || (rec.type === 'restaurant' ? 'Restaurant' : 'Menu Item Restaurant')
                                )}
                                className="flex items-center gap-2"
                              >
                                <Navigation className="h-4 w-4 text-blue-600" />
                                Waze
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            </>
          ) : (
            <div className="text-center space-y-3 py-6">
              <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto" />
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">No Recommendations Yet</h3>
                <p className="text-xs text-muted-foreground leading-relaxed px-2">
                  Generate personalized suggestions based on your dietary profile.
                </p>
                <Button
                  onClick={() => generateRecommendationsMutation.mutate()}
                  disabled={generateRecommendationsMutation.isPending}
                  size="sm"
                  className="flex items-center gap-2 w-full text-xs"
                >
                  <Brain className="h-3 w-3" />
                  <span className="truncate">Generate</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portal-based Recommendation Details Modal - Complete Separation from Main Page */}
      {isModalOpen && selectedRecommendation && createPortal(
        <div 
          className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-lg shadow-2xl p-6 w-full transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {selectedRecommendation?.type === 'restaurant' ? (
                    <ChefHat className="h-5 w-5 text-orange-500" />
                  ) : (
                    <MapPin className="h-5 w-5 text-green-500" />
                  )}
                  {selectedRecommendation?.type === 'restaurant' 
                    ? selectedRecommendation?.restaurant?.name 
                    : selectedRecommendation?.menuItem?.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  AI Recommendation Details
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

          {selectedRecommendation && (
            <div className="space-y-4">
              {/* Match Score */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Match Score:</span>
                <Badge variant={getScoreBadgeVariant(selectedRecommendation.recommendationScore)}>
                  {Math.round(selectedRecommendation.recommendationScore * 100)}%
                </Badge>
              </div>

              {/* Restaurant Information - Always show for both types */}
              {selectedRecommendation.restaurant && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <ChefHat className="h-4 w-4 text-orange-500" />
                    Restaurant Information
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="text-lg font-semibold">{selectedRecommendation.restaurant.name}</div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium">{selectedRecommendation.restaurant.cuisine}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-current text-yellow-500" />
                        <span>{selectedRecommendation.restaurant.rating}</span>
                      </div>
                      <span>{selectedRecommendation.restaurant.priceRange}</span>
                    </div>
                    
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{selectedRecommendation.restaurant.location}</span>
                    </div>

                    {selectedRecommendation.restaurant.description && (
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {selectedRecommendation.restaurant.description}
                      </div>
                    )}

                    {selectedRecommendation.restaurant.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Phone:</span>
                        <span>{selectedRecommendation.restaurant.phone}</span>
                      </div>
                    )}

                    {selectedRecommendation.restaurant.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Email:</span>
                        <span>{selectedRecommendation.restaurant.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Menu Item Details - Only for menu item recommendations */}
              {selectedRecommendation.type === 'menu_item' && selectedRecommendation.menuItem && (
                <div className="border rounded-lg p-4 space-y-3 bg-primary/5">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Menu className="h-4 w-4 text-green-500" />
                    Menu Item Details
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="text-lg font-semibold">{selectedRecommendation.menuItem.name}</div>
                    
                    {selectedRecommendation.menuItem.description && (
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {selectedRecommendation.menuItem.description}
                      </div>
                    )}
                    
                    <div className="text-xl font-bold text-primary">
                      €{selectedRecommendation.menuItem.price}
                    </div>

                    {selectedRecommendation.menuItem.category && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Category:</span>
                        <Badge variant="outline" className="text-xs">
                          {selectedRecommendation.menuItem.category}
                        </Badge>
                      </div>
                    )}

                    {selectedRecommendation.menuItem.ingredients && (
                      <div className="space-y-1">
                        <span className="font-medium text-sm">Ingredients:</span>
                        <div className="text-sm text-muted-foreground">
                          {selectedRecommendation.menuItem.ingredients}
                        </div>
                      </div>
                    )}

                    {selectedRecommendation.menuItem.allergens && selectedRecommendation.menuItem.allergens.length > 0 && (
                      <div className="space-y-1">
                        <span className="font-medium text-sm">Allergens:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedRecommendation.menuItem.allergens.map((allergen, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {allergen}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Reasoning */}
              {selectedRecommendation.reasoning && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Why This Recommendation:</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedRecommendation.reasoning}
                  </p>
                </div>
              )}

              {/* Nutritional Highlights */}
              {selectedRecommendation.nutritionalHighlights && selectedRecommendation.nutritionalHighlights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Nutritional Highlights:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecommendation.nutritionalHighlights.map((highlight, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Cautionary Notes */}
              {selectedRecommendation.cautionaryNotes && selectedRecommendation.cautionaryNotes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Important Notes:</h4>
                  <div className="space-y-1">
                    {selectedRecommendation.cautionaryNotes.map((note, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Time/Context Information */}
              {(selectedRecommendation.recommendedFor || selectedRecommendation.idealDayTime) && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Best For:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecommendation.recommendedFor && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {selectedRecommendation.recommendedFor}
                      </Badge>
                    )}
                    {selectedRecommendation.idealDayTime && (
                      <Badge variant="outline" className="text-xs">
                        {selectedRecommendation.idealDayTime}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                {selectedRecommendation.type === 'restaurant' && (
                  <Button 
                    onClick={() => {
                      setLocation(`/restaurant/${selectedRecommendation.targetId}/menu?from=ai-recommendations`);
                      setIsModalOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Restaurant
                  </Button>
                )}
                
                {selectedRecommendation.type === 'menu_item' && (
                  <Button 
                    onClick={() => {
                      const restaurantId = selectedRecommendation.restaurant?.id;
                      const menuItemId = selectedRecommendation.targetId;
                      if (restaurantId && menuItemId) {
                        setLocation(`/restaurant/${restaurantId}/menu?from=ai-recommendations&highlight=${menuItemId}`);
                      }
                      setIsModalOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Menu className="h-4 w-4" />
                    View Menu Item
                  </Button>
                )}

                {(selectedRecommendation.restaurant?.location || selectedRecommendation.type === 'restaurant') && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Navigation className="h-4 w-4" />
                        Get Directions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => {
                          const location = selectedRecommendation.restaurant?.location || 'Restaurant location';
                          const name = selectedRecommendation.restaurant?.name || 'Restaurant';
                          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${location}`)}`, '_blank');
                        }}
                        className="flex items-center gap-2"
                      >
                        <Navigation className="h-4 w-4" />
                        Google Maps
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const location = selectedRecommendation.restaurant?.location || 'Restaurant location';
                          const name = selectedRecommendation.restaurant?.name || 'Restaurant';
                          window.open(`https://waze.com/ul?q=${encodeURIComponent(`${name}, ${location}`)}`, '_blank');
                        }}
                        className="flex items-center gap-2"
                      >
                        <Navigation className="h-4 w-4 text-blue-600" />
                        Waze
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default AIRecommendations;