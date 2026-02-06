import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Brain, Heart, SlidersHorizontal, ChevronRight, Star, MapPin, LogIn, X, ChefHat, Info, User, Pencil } from 'lucide-react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';

export default function MobileAIMenu() {
  const { t } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const isAuthenticated = !!user;
  const [, setLocation] = useLocation();

  const [manualDietType, setManualDietType] = useState('all');
  const [manualCalories, setManualCalories] = useState('all');
  const [manualCuisine, setManualCuisine] = useState('all');
  const [manualPriceRange, setManualPriceRange] = useState('all');
  const [manualRating, setManualRating] = useState('all');
  const [useDietaryProfile, setUseDietaryProfile] = useState(true);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [editingBadge, setEditingBadge] = useState<string | null>(null);
  const badgesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editingBadge) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (badgesRef.current && !badgesRef.current.contains(e.target as Node)) {
        setEditingBadge(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingBadge]);

  const { data: restaurants = [], isLoading: restaurantsLoading } = useQuery({
    queryKey: ['/api/restaurants', {}],
    queryFn: () => api.getRestaurants({})
  });

  const { data: availableCuisines = [] } = useQuery<string[]>({
    queryKey: ['/api/cuisine-values'],
  });

  const { data: aiRecommendations } = useQuery({
    queryKey: ['/api/dietary/recommendations'],
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 60 * 1000,
  });

  const { data: userDietaryProfile } = useQuery<any>({
    queryKey: ['/api/dietary/profile'],
    enabled: isAuthenticated,
  });

  const authRecommendations = (aiRecommendations as any)?.recommendations || [];

  const guestRecommendations = useMemo(() => {
    if (isAuthenticated || !restaurants || restaurants.length === 0) return [];

    let filtered = [...restaurants];

    if (manualCuisine !== 'all') {
      const cuisineFiltered = filtered.filter((r: any) => r.cuisine === manualCuisine);
      if (cuisineFiltered.length > 0) filtered = cuisineFiltered;
    }

    if (manualDietType !== 'all') {
      const dietFiltered = filtered.filter((r: any) => {
        const tags = r.dietaryTags || [];
        const cuisine = (r.cuisine || '').toLowerCase();
        const name = (r.name || '').toLowerCase();
        const dietLower = manualDietType.toLowerCase();
        return tags.some((tag: string) => tag.toLowerCase().includes(dietLower)) ||
               cuisine.includes(dietLower) || name.includes(dietLower);
      });
      if (dietFiltered.length > 0) filtered = dietFiltered;
    }

    const sorted = filtered
      .sort((a: any, b: any) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
      .slice(0, 8);

    return sorted.map((r: any, idx: number) => ({
      id: r.id || idx,
      type: 'restaurant' as const,
      targetId: r.id,
      restaurantId: r.id,
      title: r.name,
      recommendationScore: (parseFloat(r.rating) || 4) / 5,
      recommendationText: `Popular ${r.cuisine || ''} restaurant with great reviews.`,
      reasoningFactors: [],
      nutritionalMatch: 0,
      preferenceMatch: 0,
      healthGoalAlignment: 0,
      nutritionalHighlights: [],
      cautionaryNotes: [],
      restaurant: {
        id: r.id,
        name: r.name,
        cuisine: r.cuisine || '',
        location: r.location || '',
        priceRange: r.priceRange || '',
        rating: r.rating || 0,
        imageUrl: r.imageUrl || ''
      },
      dietaryTags: r.dietaryTags || []
    }));
  }, [isAuthenticated, restaurants, manualCuisine, manualDietType]);

  const allRecommendations = isAuthenticated ? authRecommendations : guestRecommendations;

  const filteredRecommendations = useMemo(() => {
    return allRecommendations.filter((rec: any) => {
      if (isAuthenticated && !useDietaryProfile) {
        if (manualCuisine !== 'all' && rec.restaurant?.cuisine !== manualCuisine) {
          return false;
        }
        if (manualDietType !== 'all') {
          const dietaryTags = rec.dietaryTags || rec.restaurant?.dietaryTags || [];
          if (!dietaryTags.some((tag: string) => tag.toLowerCase().includes(manualDietType.toLowerCase()))) {
            return false;
          }
        }
        if (manualCalories !== 'all') {
          const cal = rec.calories || rec.estimatedCalories || 0;
          if (cal > 0) {
            if (manualCalories === 'low' && cal >= 1500) return false;
            if (manualCalories === 'medium' && (cal < 1500 || cal > 2000)) return false;
            if (manualCalories === 'high' && (cal < 2000 || cal > 2500)) return false;
            if (manualCalories === 'very-high' && cal < 2500) return false;
          }
        }
      }
      if (manualPriceRange !== 'all') {
        const recPrice = rec.restaurant?.priceRange || '';
        if (recPrice !== manualPriceRange) return false;
      }
      if (manualRating !== 'all') {
        const recRating = parseFloat(rec.restaurant?.rating) || 0;
        const minRating = parseFloat(manualRating);
        if (recRating < minRating) return false;
      }
      return true;
    });
  }, [allRecommendations, isAuthenticated, useDietaryProfile, manualCuisine, manualDietType, manualCalories, manualPriceRange, manualRating]);

  const displayedRecommendations = isAuthenticated 
    ? filteredRecommendations 
    : filteredRecommendations.slice(0, 6);

  const hasActiveFilters = manualDietType !== 'all' || manualCalories !== 'all' || manualCuisine !== 'all' || manualPriceRange !== 'all' || manualRating !== 'all';

  const clearAllFilters = () => {
    setManualDietType('all');
    setManualCalories('all');
    setManualCuisine('all');
    setManualPriceRange('all');
    setManualRating('all');
  };

  if (authLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-2xl">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">AI Menu</h1>
            <p className="text-sm text-gray-500">Personalized recommendations</p>
          </div>
        </div>

        {/* Interactive Preference Badges */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">
              {isAuthenticated && userDietaryProfile ? 'Your Diet Profile' : 'Your Preferences'}
            </h3>
            {isAuthenticated && userDietaryProfile && (
              <button 
                onClick={() => setLocation('/m/profile?section=dietary')}
                className="text-primary text-sm font-medium flex items-center gap-1"
              >
                Edit <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div ref={badgesRef} className="flex flex-wrap gap-2.5">
            {/* Calories Badge */}
            <div className="relative">
              <button
                onClick={() => setEditingBadge(editingBadge === 'calories' ? null : 'calories')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full text-base font-medium transition-all",
                  editingBadge === 'calories'
                    ? "bg-primary text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 shadow-sm"
                )}
              >
                🎯 {isAuthenticated && useDietaryProfile && userDietaryProfile
                  ? `${userDietaryProfile.calorieTarget || 2000} kcal`
                  : manualCalories === 'all' ? 'Calories'
                  : manualCalories === 'low' ? '< 1500 kcal'
                  : manualCalories === 'medium' ? '1500-2000'
                  : manualCalories === 'high' ? '2000-2500'
                  : '> 2500 kcal'}
                <Pencil className="w-3.5 h-3.5 opacity-50" />
              </button>
              {editingBadge === 'calories' && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 min-w-[160px]">
                  {[
                    { value: 'all', label: 'All Calories' },
                    { value: 'low', label: '< 1500 kcal' },
                    { value: 'medium', label: '1500-2000 kcal' },
                    { value: 'high', label: '2000-2500 kcal' },
                    { value: 'very-high', label: '> 2500 kcal' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setManualCalories(opt.value); setEditingBadge(null); if (isAuthenticated) setUseDietaryProfile(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm transition-colors",
                        manualCalories === opt.value ? "bg-primary/10 text-primary font-medium" : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Diet Type Badge */}
            <div className="relative">
              <button
                onClick={() => setEditingBadge(editingBadge === 'diet' ? null : 'diet')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full text-base font-medium transition-all",
                  editingBadge === 'diet'
                    ? "bg-primary text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 shadow-sm"
                )}
              >
                🥗 {isAuthenticated && useDietaryProfile && userDietaryProfile
                  ? (userDietaryProfile.dietType || 'Balanced')
                  : manualDietType === 'all' ? 'Diet Type' : manualDietType.charAt(0).toUpperCase() + manualDietType.slice(1)}
                <Pencil className="w-3.5 h-3.5 opacity-50" />
              </button>
              {editingBadge === 'diet' && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 min-w-[160px]">
                  {[
                    { value: 'all', label: 'All Diets' },
                    { value: 'vegetarian', label: 'Vegetarian' },
                    { value: 'vegan', label: 'Vegan' },
                    { value: 'gluten-free', label: 'Gluten-Free' },
                    { value: 'keto', label: 'Keto' },
                    { value: 'paleo', label: 'Paleo' },
                    { value: 'dash', label: 'DASH' },
                    { value: 'low-carb', label: 'Low-Carb' },
                    { value: 'mediterranean', label: 'Mediterranean' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setManualDietType(opt.value); setEditingBadge(null); if (isAuthenticated) setUseDietaryProfile(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm transition-colors",
                        manualDietType === opt.value ? "bg-primary/10 text-primary font-medium" : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Allergies Badge */}
            <div className="relative">
              <button
                onClick={() => setEditingBadge(editingBadge === 'allergies' ? null : 'allergies')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full text-base font-medium transition-all",
                  editingBadge === 'allergies'
                    ? "bg-primary text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 shadow-sm"
                )}
              >
                ⚠️ {isAuthenticated && useDietaryProfile && userDietaryProfile && userDietaryProfile.allergies?.length > 0
                  ? `${userDietaryProfile.allergies.length} allergies`
                  : 'Allergens'}
                <Pencil className="w-3.5 h-3.5 opacity-50" />
              </button>
              {editingBadge === 'allergies' && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-50 min-w-[200px]">
                  <p className="text-xs text-gray-500 mb-2">
                    {isAuthenticated ? 'Edit in your full dietary profile:' : 'Sign up to manage allergens:'}
                  </p>
                  {isAuthenticated && userDietaryProfile?.allergies?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {userDietaryProfile.allergies.map((a: string) => (
                        <span key={a} className="bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-xs">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setEditingBadge(null);
                      if (isAuthenticated) {
                        setLocation('/m/profile?section=dietary');
                      } else {
                        window.scrollTo(0, 0);
                        setLocation('/login');
                      }
                    }}
                    className="w-full text-center py-2 bg-primary/10 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    {isAuthenticated ? 'Edit Dietary Profile' : 'Sign Up to Set'}
                  </button>
                </div>
              )}
            </div>

            {/* Cuisine Badge */}
            <div className="relative">
              <button
                onClick={() => setEditingBadge(editingBadge === 'cuisine' ? null : 'cuisine')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full text-base font-medium transition-all",
                  editingBadge === 'cuisine'
                    ? "bg-primary text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 shadow-sm"
                )}
              >
                🍽️ {isAuthenticated && useDietaryProfile && userDietaryProfile?.preferredCuisines?.length > 0
                  ? userDietaryProfile.preferredCuisines[0]
                  : manualCuisine === 'all' ? 'Cuisine' : manualCuisine}
                <Pencil className="w-3.5 h-3.5 opacity-50" />
              </button>
              {editingBadge === 'cuisine' && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 min-w-[160px] max-h-[250px] overflow-y-auto">
                  <button
                    onClick={() => { setManualCuisine('all'); setEditingBadge(null); if (isAuthenticated) setUseDietaryProfile(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm transition-colors",
                      manualCuisine === 'all' ? "bg-primary/10 text-primary font-medium" : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    All Cuisines
                  </button>
                  {availableCuisines.map((cuisine) => (
                    <button
                      key={cuisine}
                      onClick={() => { setManualCuisine(cuisine); setEditingBadge(null); if (isAuthenticated) setUseDietaryProfile(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm transition-colors",
                        manualCuisine === cuisine ? "bg-primary/10 text-primary font-medium" : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Use My Profile toggle - only for logged in users with profile */}
          {isAuthenticated && userDietaryProfile && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-purple-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-gray-700">Use My Profile</span>
              </div>
              <button
                onClick={() => setUseDietaryProfile(!useDietaryProfile)}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors",
                  useDietaryProfile ? "bg-primary" : "bg-gray-300"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm",
                  useDietaryProfile && "translate-x-5"
                )} />
              </button>
            </div>
          )}

          {/* Source indicator */}
          <div className="flex items-center justify-center mt-3">
            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border",
              isAuthenticated && useDietaryProfile && userDietaryProfile
                ? "border-primary/30 text-primary bg-primary/5"
                : "border-amber-400/50 text-amber-700 bg-amber-50"
            )}>
              {isAuthenticated && useDietaryProfile && userDietaryProfile ? (
                <><User className="w-3 h-3" /> Based on your Profile</>
              ) : (
                <><SlidersHorizontal className="w-3 h-3" /> Based on selected Preferences</>
              )}
            </span>
          </div>
        </div>

        {/* Filters Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all",
            showFilters 
              ? "bg-primary/5 border-primary/20" 
              : "bg-white border-gray-100"
          )}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {hasActiveFilters ? 'Filters active' : 'Customize filters'}
            </span>
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-primary rounded-full" />
            )}
          </div>
          <ChevronRight className={cn(
            "w-4 h-4 text-gray-400 transition-transform",
            showFilters && "rotate-90"
          )} />
        </button>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
            {/* Filters row - Prices & Rating */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Prices & Rating</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={manualPriceRange}
                  onChange={(e) => setManualPriceRange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white text-gray-700"
                >
                  <option value="all">All Prices</option>
                  <option value="€">€ - Budget</option>
                  <option value="€€">€€ - Moderate</option>
                  <option value="€€€">€€€ - Upscale</option>
                </select>
                <select
                  value={manualRating}
                  onChange={(e) => setManualRating(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white text-gray-700"
                >
                  <option value="all">All Ratings</option>
                  <option value="3">⭐ 3+ Stars</option>
                  <option value="3.5">⭐ 3.5+ Stars</option>
                  <option value="4">⭐ 4+ Stars</option>
                  <option value="4.5">⭐ 4.5+ Stars</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Recommendations List */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">
            {isAuthenticated ? 'Recommended for You' : 'Top Picks'}
          </h2>

          {(restaurantsLoading || (isAuthenticated && !aiRecommendations && !authRecommendations.length)) ? (
            <div className="flex flex-col items-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-3" />
              <p className="text-sm text-gray-500">Loading recommendations...</p>
            </div>
          ) : displayedRecommendations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <Brain className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No recommendations match your current filters.</p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="mt-3 text-primary text-sm font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            displayedRecommendations.map((rec: any) => (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setExpandedItem(expandedItem === rec.id ? null : rec.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ChefHat className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {rec.restaurant?.name || rec.title || 'Restaurant'}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {rec.restaurant?.cuisine}{rec.restaurant?.location ? ` • ${rec.restaurant.location}` : ''}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        {rec.restaurant?.rating > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="text-gray-600">{rec.restaurant.rating}</span>
                          </div>
                        )}
                        {rec.restaurant?.priceRange && (
                          <span className="text-sm text-gray-500">{rec.restaurant.priceRange}</span>
                        )}
                        <span className="text-sm font-medium text-green-600">
                          {Math.round((rec.recommendationScore || 0) * 100)}% match
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      "w-5 h-5 text-gray-400 transition-transform mt-2 flex-shrink-0",
                      expandedItem === rec.id && "rotate-90"
                    )} />
                  </div>
                </button>

                {expandedItem === rec.id && (
                  <div className="px-4 pb-4 border-t border-gray-50">
                    {rec.recommendationText && (
                      <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 rounded-xl">
                        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700">{rec.recommendationText}</p>
                      </div>
                    )}

                    {rec.nutritionalHighlights?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {rec.nutritionalHighlights.map((h: string, i: number) => (
                          <span key={i} className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full">
                            {h}
                          </span>
                        ))}
                      </div>
                    )}

                    {rec.cautionaryNotes?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {rec.cautionaryNotes.map((note: string, i: number) => (
                          <p key={i} className="text-xs text-amber-600 flex items-start gap-1">
                            <span>⚠️</span> {note}
                          </p>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setLocation(`/restaurant/${rec.targetId}/menu?from=ai-recommendations`)}
                      className="w-full mt-3 bg-primary text-white py-3 rounded-xl font-semibold text-sm"
                    >
                      View Restaurant
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </section>

        {/* Guest CTA - single line after recommendations */}
        {!isAuthenticated && filteredRecommendations.length > 0 && (
          <p className="text-center text-sm text-gray-500 mt-2">
            Do you want more recommendations?{' '}
            <button onClick={() => setLocation('/m/signin')} className="text-primary font-semibold">
              Sign-up now!
            </button>
          </p>
        )}

        {/* Empty state for guests with no restaurants */}
        {!isAuthenticated && filteredRecommendations.length === 0 && !hasActiveFilters && (
          <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              AI-Powered Recommendations
            </h2>
            <p className="text-gray-500 mb-6 text-sm">
              Get personalized meal suggestions based on your dietary preferences and taste profile.
            </p>
            <button
              onClick={() => setLocation('/m/signin')}
              className="w-full max-w-xs bg-primary text-white font-semibold py-4 px-6 rounded-2xl hover:bg-primary/90 transition-colors"
            >
              {t.signIn}
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
