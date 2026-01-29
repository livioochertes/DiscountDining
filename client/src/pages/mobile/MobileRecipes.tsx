import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Search, Plus, Heart, Bookmark, Clock, Users, ChefHat, Filter, X, Loader2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const isNativePlatform = Capacitor.isNativePlatform();
const API_BASE_URL = import.meta.env.VITE_API_URL || (isNativePlatform ? 'https://eatoff.app' : '');

interface Recipe {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  cuisine: string;
  category: string;
  difficulty: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  dietaryTags: string[];
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  author: {
    id: number;
    name: string;
    profilePicture: string | null;
  } | null;
  restaurant: {
    id: number;
    name: string;
  } | null;
  isLiked?: boolean;
  isSaved?: boolean;
}

const CUISINES = ['All', 'Italian', 'Chinese', 'Mexican', 'Japanese', 'Indian', 'Thai', 'Mediterranean', 'American', 'French'];
const CATEGORIES = ['All', 'Appetizer', 'Main Course', 'Dessert', 'Snack', 'Beverage', 'Soup', 'Salad', 'Breakfast'];
const DIFFICULTIES = ['All', 'easy', 'medium', 'hard'];

function RecipeCard({ recipe, onClick }: { recipe: Recipe; onClick: () => void }) {
  const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
  
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 text-left"
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {recipe.imageUrl ? (
          <img 
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-12 h-12 text-gray-300" />
          </div>
        )}
        
        {recipe.difficulty && (
          <span className={cn(
            "absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium text-white",
            recipe.difficulty === 'easy' && "bg-green-500",
            recipe.difficulty === 'medium' && "bg-yellow-500",
            recipe.difficulty === 'hard' && "bg-red-500"
          )}>
            {recipe.difficulty}
          </span>
        )}
        
        {recipe.restaurant && (
          <span className="absolute top-2 right-2 bg-primary text-white px-2 py-0.5 rounded-full text-xs font-medium">
            Restaurant
          </span>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{recipe.title}</h3>
        
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
          {totalTime > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {totalTime} min
            </span>
          )}
          {recipe.servings > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {recipe.servings}
            </span>
          )}
          {recipe.cuisine && (
            <span className="text-primary font-medium">{recipe.cuisine}</span>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {recipe.author?.profilePicture ? (
              <img 
                src={recipe.author.profilePicture}
                alt={recipe.author.name}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-[10px] text-gray-500">
                  {recipe.author?.name?.charAt(0) || '?'}
                </span>
              </div>
            )}
            <span className="text-xs text-gray-600 truncate max-w-[80px]">
              {recipe.author?.name || 'Anonymous'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <span className="flex items-center gap-0.5">
              <Heart className={cn("w-3 h-3", recipe.isLiked && "fill-red-500 text-red-500")} />
              {recipe.likesCount}
            </span>
            <span className="flex items-center gap-0.5">
              <Bookmark className={cn("w-3 h-3", recipe.isSaved && "fill-primary text-primary")} />
              {recipe.savesCount}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function MobileRecipes() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ['/api/recipes', selectedCuisine, selectedCategory, selectedDifficulty],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCuisine !== 'All') params.append('cuisine', selectedCuisine);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedDifficulty !== 'All') params.append('difficulty', selectedDifficulty);
      const url = `${API_BASE_URL}/api/recipes${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch recipes');
      return res.json();
    }
  });
  
  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];
    if (!searchQuery.trim()) return recipes;
    const query = searchQuery.toLowerCase();
    return recipes.filter(r => 
      r.title.toLowerCase().includes(query) ||
      r.description?.toLowerCase().includes(query) ||
      r.cuisine?.toLowerCase().includes(query)
    );
  }, [recipes, searchQuery]);
  
  const hasActiveFilters = selectedCuisine !== 'All' || selectedCategory !== 'All' || selectedDifficulty !== 'All';
  
  return (
    <MobileLayout>
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="sticky top-0 z-10 bg-white px-4 pt-4 pb-3 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">{t.recipes || 'Recipes'}</h1>
            <button
              onClick={() => setLocation('/m/recipes/create')}
              className="flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-full text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              {t.share || 'Share'}
            </button>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t.searchRecipes || 'Search recipes...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-2 rounded-xl border",
                hasActiveFilters ? "bg-primary text-white border-primary" : "bg-white border-gray-200"
              )}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t.cuisine || 'Cuisine'}</label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {CUISINES.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedCuisine(c)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                        selectedCuisine === c ? "bg-primary text-white" : "bg-white text-gray-700 border border-gray-200"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t.category || 'Category'}</label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedCategory(c)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                        selectedCategory === c ? "bg-primary text-white" : "bg-white text-gray-700 border border-gray-200"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t.difficulty || 'Difficulty'}</label>
                <div className="flex gap-2">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d}
                      onClick={() => setSelectedDifficulty(d)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium capitalize",
                        selectedDifficulty === d ? "bg-primary text-white" : "bg-white text-gray-700 border border-gray-200"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSelectedCuisine('All');
                    setSelectedCategory('All');
                    setSelectedDifficulty('All');
                  }}
                  className="flex items-center gap-1 text-xs text-red-500"
                >
                  <X className="w-3 h-3" />
                  {t.clearFilters || 'Clear filters'}
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="px-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="w-16 h-16 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">{t.noRecipesFound || 'No recipes found'}</p>
              <button
                onClick={() => setLocation('/m/recipes/create')}
                className="mt-4 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium"
              >
                {t.beFirstToShare || 'Be the first to share a recipe!'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredRecipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => setLocation(`/m/recipes/${recipe.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
