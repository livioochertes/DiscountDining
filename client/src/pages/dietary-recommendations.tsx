import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { DietaryProfileForm } from "@/components/DietaryProfileForm";
import { AIRecommendations } from "@/components/AIRecommendations";
import RestaurantCard from "@/components/restaurant-card";
import RestaurantModal from "@/components/restaurant-modal";
import { api } from "@/lib/api";
import type { Restaurant } from "@shared/schema";
import { 
  Brain, 
  User, 
  Target, 
  TrendingUp, 
  Heart, 
  ChefHat,
  Activity,
  Sparkles,
  Settings,
  Filter,
  Grid,
  List,
  X,
  MapPin,
  Star,
  Euro,
  Phone,
  Mail,
  Navigation,
  ExternalLink,
  RefreshCw
} from "lucide-react";

export default function DietaryRecommendationsPage() {
  const [activeTab, setActiveTab] = useState("recommendations");
  const [hasProfile, setHasProfile] = useState(false);
  const [viewMode, setViewMode] = useState<"recommendations" | "restaurants" | "products">("recommendations");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [recommendationType, setRecommendationType] = useState<"all" | "restaurant" | "menu_item">("all");
  const [sortBy, setSortBy] = useState("score");
  
  // AI Recommendation Modal state - matching main page implementation
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Modal close handler - matching main page implementation
  const handleCloseModal = useCallback(() => {
    console.log('Modal close requested');
    setShowRecommendationModal(false);
    setSelectedRecommendation(null);
  }, []);
  
  const { toast } = useToast();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch restaurants data
  const { data: restaurants = [] } = useQuery({
    queryKey: ['/api/restaurants'],
    queryFn: () => api.getRestaurants()
  });

  // Fetch AI recommendations with unique key to avoid conflicts with main page
  const { data: aiRecommendations, refetch: refetchRecommendations } = useQuery({
    queryKey: ['dietary-recommendations-page', recommendationType, sortBy],
    queryFn: () => api.getDietaryRecommendations(),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 60 * 1000, // 2 hours cache
  });

  // Mutation to generate fresh recommendations
  const generateRecommendationsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/dietary/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          maxRecommendations: 10,
          includeRestaurants: true,
          includeMenuItems: true
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate recommendations');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch recommendations
      queryClient.invalidateQueries({ queryKey: ['dietary-recommendations-page'] });
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
      toast({
        title: "Success",
        description: "Fresh AI recommendations have been generated.",
      });
    },
    onError: (error) => {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to generate fresh recommendations. Please try again.",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    checkDietaryProfile();
    
    // Clear any conflicting caches from main page to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    queryClient.invalidateQueries({ queryKey: ['/api/dietary/recommendations'] });
  }, [queryClient]);

  const checkDietaryProfile = async () => {
    try {
      const response = await fetch("/api/dietary/profile");
      if (response.ok) {
        const profile = await response.json();
        setHasProfile(!!profile);
      }
    } catch (error) {
      console.error("Error checking dietary profile:", error);
    }
  };

  // Filter recommendations based on type
  const allRecommendations = aiRecommendations?.recommendations || [];
  

  
  // Enhance recommendations with restaurant data from the restaurants list - SAME AS MAIN PAGE
  const enhancedRecommendations = allRecommendations.map((rec: any) => {
    let restaurantId: number;
    let restaurantData: any;
    
    if (rec.type === 'restaurant') {
      restaurantId = rec.restaurantId || rec.targetId;
      restaurantData = restaurants.find((r: any) => r.id === restaurantId);
    } else if (rec.type === 'menu_item') {
      // Menu item recommendations should be linked to Wing Stop for now
      restaurantId = 101; // Wing Stop ID
      restaurantData = restaurants.find((r: any) => r.id === 101);
    } else {
      restaurantId = rec.restaurantId || rec.targetId;
      restaurantData = restaurants.find((r: any) => r.id === restaurantId);
    }
    
    // Enhanced menu item information
    let menuItemData = null;
    if (rec.type === 'menu_item') {
      // Create detailed menu item information from recommendation text
      const menuItemName = rec.recommendationText?.split('.')[0] || 'Recommended Menu Item';
      menuItemData = {
        id: rec.targetId,
        name: menuItemName,
        description: rec.recommendationText || 'AI recommended menu item based on your dietary profile',
        price: 12.99, // Default price - would be enhanced with real menu data
        category: 'Main Course',
        ingredients: rec.nutritionalHighlights?.join(', ') || 'Fresh ingredients selected for your dietary needs',
        allergens: rec.cautionaryNotes || [],
        calories: 450, // Estimated based on healthy options
        dietaryTags: rec.nutritionalHighlights || []
      };
    }
    
    return {
      ...rec,
      restaurant: {
        id: restaurantId,
        name: rec.restaurant?.name || rec.restaurantName || restaurantData?.name || `Restaurant #${restaurantId}`,
        cuisine: rec.restaurant?.cuisine || rec.cuisine || restaurantData?.cuisine || '',
        location: rec.restaurant?.location || rec.location || restaurantData?.location || '',
        address: restaurantData?.address || '',
        phone: restaurantData?.phone || '',
        email: restaurantData?.email || '',
        description: restaurantData?.description || '',
        priceRange: rec.restaurant?.priceRange || restaurantData?.priceRange || '',
        rating: rec.restaurant?.rating || restaurantData?.rating || 0
      },
      menuItem: menuItemData,
      reasoning: rec.recommendationText || rec.reasoningFactors?.join('. ') || 'AI recommendation based on your dietary profile'
    };
  });
  
  const filteredRecommendations = enhancedRecommendations.filter((rec: any) => {
    if (recommendationType === 'all') return true;
    return rec.type === recommendationType;
  });
  


  // Get restaurant recommendations for restaurant view
  const restaurantRecommendations = enhancedRecommendations.filter((rec: any) => rec.type === 'restaurant');
  const recommendedRestaurantIds = new Set(restaurantRecommendations.map((rec: any) => rec.targetId));
  
  // Filter restaurants based on AI recommendations
  const recommendedRestaurants = restaurants.filter((restaurant: any) => 
    recommendedRestaurantIds.has(restaurant.id)
  );

  // Get product recommendations
  const productRecommendations = enhancedRecommendations.filter((rec: any) => rec.type === 'menu_item');

  const handleProfileSaved = () => {
    setHasProfile(true);
    setActiveTab("recommendations");
    toast({
      title: "Profile Created",
      description: "Your dietary profile has been saved. AI recommendations are now being generated.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t.aiPoweredRecommendations}</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t.personalizedSuggestions}
          </p>
        </div>

        {/* Feature Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-500" />
                {t.personalizedProfile}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t.personalizedProfileDescription}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-green-500" />
                {t.aiAnalysis}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t.aiAnalysisDescription}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-purple-500" />
                {t.smartMatching}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t.smartMatchingDescription}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t.aiRecommendations}
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t.dietaryProfile}
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t.healthInsights}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="mt-6">
            {hasProfile ? (
              <div className="space-y-6">

                
                {/* View Mode Selection */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-primary" />
                    <Label className="text-base font-semibold">View:</Label>
                    <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recommendations">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            AI Recommendations
                          </div>
                        </SelectItem>
                        <SelectItem value="restaurants">
                          <div className="flex items-center gap-2">
                            <ChefHat className="h-4 w-4" />
                            Recommended Restaurants
                          </div>
                        </SelectItem>
                        <SelectItem value="products">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Recommended Menu Items
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {viewMode === "recommendations" && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Type:</Label>
                      <Select value={recommendationType} onValueChange={(value: any) => setRecommendationType(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All ({allRecommendations.length})</SelectItem>
                          <SelectItem value="restaurant">Restaurants ({restaurantRecommendations.length})</SelectItem>
                          <SelectItem value="menu_item">Products ({productRecommendations.length})</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Generate Fresh Recommendations Button */}
                <div className="flex justify-center">
                  <Button 
                    onClick={() => generateRecommendationsMutation.mutate()}
                    disabled={generateRecommendationsMutation.isPending}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    <RefreshCw className={`h-4 w-4 ${generateRecommendationsMutation.isPending ? 'animate-spin' : ''}`} />
                    {generateRecommendationsMutation.isPending ? 'Generating...' : 'Generate Fresh Recommendations'}
                  </Button>
                </div>

                {/* Content based on view mode */}
                {viewMode === "recommendations" && (
                  <AIRecommendations 
                    showFilters={false}
                    className="border-0 shadow-none p-0"
                    recommendations={filteredRecommendations}
                  />
                )}

                {viewMode === "restaurants" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        Recommended Restaurants ({recommendedRestaurants.length})
                      </h3>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        AI Matched
                      </Badge>
                    </div>
                    
                    {recommendedRestaurants.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recommendedRestaurants.map((restaurant: any) => (
                          <RestaurantCard
                            key={restaurant.id}
                            restaurant={restaurant}
                            onClick={() => {
                              setSelectedRestaurant(restaurant);
                              setIsRestaurantModalOpen(true);
                            }}
                            onMenuClick={() => window.open(`/restaurant/${restaurant.id}/menu`, '_blank')}
                          />
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center space-y-4">
                            <ChefHat className="h-16 w-16 text-muted-foreground mx-auto" />
                            <div>
                              <h3 className="text-lg font-semibold mb-2">No Restaurant Recommendations Yet</h3>
                              <p className="text-muted-foreground">
                                Generate AI recommendations to see restaurants that match your dietary profile.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {viewMode === "products" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        Recommended Menu Items ({productRecommendations.length})
                      </h3>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        AI Selected
                      </Badge>
                    </div>
                    
                    {productRecommendations.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {productRecommendations.map((rec: any) => (
                          <Card key={rec.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-lg">{rec.menuItem?.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      from {rec.restaurant?.name} • {rec.restaurant?.cuisine}
                                    </p>
                                  </div>
                                  <Badge className="bg-green-100 text-green-800">
                                    {Math.round(rec.recommendationScore)}% Match
                                  </Badge>
                                </div>
                                
                                <p className="text-sm">{rec.menuItem?.description}</p>
                                
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-lg">€{rec.menuItem?.price}</span>
                                  {rec.menuItem?.calories && (
                                    <span className="text-sm text-muted-foreground">
                                      {rec.menuItem.calories} cal
                                    </span>
                                  )}
                                </div>

                                {rec.nutritionalHighlights && rec.nutritionalHighlights.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {rec.nutritionalHighlights.slice(0, 3).map((highlight: string, index: number) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {highlight}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                <Button 
                                  className="w-full"
                                  onClick={() => {
                                    // Navigate to restaurant menu page for this item
                                    window.open(`/restaurant/${rec.restaurant?.id}/menu`, '_blank');
                                  }}
                                >
                                  View Restaurant Menu
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center space-y-4">
                            <Target className="h-16 w-16 text-muted-foreground mx-auto" />
                            <div>
                              <h3 className="text-lg font-semibold mb-2">No Menu Item Recommendations Yet</h3>
                              <p className="text-muted-foreground">
                                Generate AI recommendations to see menu items that match your dietary preferences.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <Brain className="h-16 w-16 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{t.createDietaryProfile}</h3>
                      <p className="text-muted-foreground mb-4">
                        {t.createDietaryProfileDescription}
                      </p>
                      <Button onClick={() => setActiveTab("profile")} className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t.createProfile}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <DietaryProfileForm onSave={handleProfileSaved} />
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Health Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Badge variant="secondary" className="mt-1">1</Badge>
                      <div>
                        <h4 className="font-medium">Personalized Nutrition</h4>
                        <p className="text-sm text-muted-foreground">
                          Recommendations align with your specific calorie, protein, carb, and fat targets
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="secondary" className="mt-1">2</Badge>
                      <div>
                        <h4 className="font-medium">Allergy Safety</h4>
                        <p className="text-sm text-muted-foreground">
                          AI automatically excludes restaurants and dishes containing your specified allergens
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="secondary" className="mt-1">3</Badge>
                      <div>
                        <h4 className="font-medium">Health Goal Support</h4>
                        <p className="text-sm text-muted-foreground">
                          Suggestions support your specific goals like weight loss, muscle gain, or maintenance
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    AI Technology
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Badge variant="secondary" className="mt-1">GPT-4o</Badge>
                      <div>
                        <h4 className="font-medium">Advanced Language Model</h4>
                        <p className="text-sm text-muted-foreground">
                          Powered by OpenAI's latest model for sophisticated dietary analysis
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="secondary" className="mt-1">Real-time</Badge>
                      <div>
                        <h4 className="font-medium">Dynamic Recommendations</h4>
                        <p className="text-sm text-muted-foreground">
                          Fresh recommendations generated based on current restaurant availability
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="secondary" className="mt-1">Learning</Badge>
                      <div>
                        <h4 className="font-medium">Continuous Improvement</h4>
                        <p className="text-sm text-muted-foreground">
                          AI learns from your feedback to improve future recommendations
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-orange-500" />
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <h4 className="font-medium mb-2">1. Profile Creation</h4>
                      <p className="text-sm text-muted-foreground">
                        Complete your dietary profile with health goals and preferences
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Brain className="h-6 w-6 text-green-600" />
                      </div>
                      <h4 className="font-medium mb-2">2. AI Analysis</h4>
                      <p className="text-sm text-muted-foreground">
                        Advanced AI analyzes your profile against available options
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Target className="h-6 w-6 text-purple-600" />
                      </div>
                      <h4 className="font-medium mb-2">3. Smart Matching</h4>
                      <p className="text-sm text-muted-foreground">
                        Recommendations scored on nutrition, preference, and health alignment
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="h-6 w-6 text-orange-600" />
                      </div>
                      <h4 className="font-medium mb-2">4. Personalized Results</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive tailored restaurant and menu recommendations
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Restaurant Modal */}
      {selectedRestaurant && isRestaurantModalOpen && (
        <RestaurantModal
          restaurant={selectedRestaurant}
          isOpen={isRestaurantModalOpen}
          onClose={() => {
            setIsRestaurantModalOpen(false);
            setSelectedRestaurant(null);
          }}
        />
      )}
    </div>
  );
}