import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Brain, Filter, Flame, Leaf, AlertTriangle, Info, ChevronRight } from 'lucide-react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface DietFilter {
  id: string;
  name: string;
  icon: any;
  color: string;
}

const dietFilters: DietFilter[] = [
  { id: 'low-cal', name: 'Low Calorie', icon: Flame, color: 'text-orange-500 bg-orange-50' },
  { id: 'vegetarian', name: 'Vegetarian', icon: Leaf, color: 'text-green-500 bg-green-50' },
  { id: 'gluten-free', name: 'Gluten Free', icon: AlertTriangle, color: 'text-amber-500 bg-amber-50' },
];

interface RecommendedItem {
  id: number;
  name: string;
  restaurant: string;
  calories: number;
  price: number;
  matchScore: number;
  reason: string;
  image?: string;
  tags: string[];
}

export default function MobileAIMenu() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const { data: dietaryProfile } = useQuery<any>({
    queryKey: ['/api/dietary-profile'],
    enabled: !!user,
  });

  const { data: recommendations = [] } = useQuery<any[]>({
    queryKey: ['/api/ai-recommendations'],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );
  }

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center min-h-[60vh]">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-6">
            <Brain className="w-10 h-10 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            AI-Powered Recommendations
          </h2>
          <p className="text-gray-500 mb-4 max-w-sm">
            Get personalized meal suggestions based on your dietary preferences, health goals, and taste profile.
          </p>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-8 max-w-sm">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-purple-700 text-left">
                Create an account to unlock personalized AI recommendations tailored just for you!
              </p>
            </div>
          </div>
          <button
            onClick={() => setLocation('/register')}
            className="w-full max-w-xs bg-primary text-white font-semibold py-4 px-6 rounded-2xl mb-3 hover:bg-primary/90 transition-colors"
          >
            Create Account
          </button>
          <button
            onClick={() => setLocation('/login')}
            className="w-full max-w-xs bg-gray-100 text-gray-700 font-medium py-4 px-6 rounded-2xl hover:bg-gray-200 transition-colors"
          >
            Already have an account? Sign In
          </button>
        </div>
      </MobileLayout>
    );
  }

  const mockRecommendations: RecommendedItem[] = [
    {
      id: 1,
      name: 'Grilled Salmon Bowl',
      restaurant: 'Healthy Bites',
      calories: 450,
      price: 12.99,
      matchScore: 95,
      reason: 'High protein, low carb - matches your fitness goals',
      tags: ['High Protein', 'Omega-3', 'Low Carb'],
    },
    {
      id: 2,
      name: 'Mediterranean Salad',
      restaurant: 'Fresh Garden',
      calories: 320,
      price: 9.99,
      matchScore: 92,
      reason: 'Rich in vegetables, low sugar - fits your dietary preferences',
      tags: ['Vegetarian', 'Low Sugar', 'Fiber Rich'],
    },
    {
      id: 3,
      name: 'Chicken Quinoa Power Bowl',
      restaurant: 'Fit Kitchen',
      calories: 520,
      price: 14.50,
      matchScore: 88,
      reason: 'Balanced macros, gluten-free option available',
      tags: ['Gluten Free', 'High Protein', 'Complex Carbs'],
    },
    {
      id: 4,
      name: 'Veggie Buddha Bowl',
      restaurant: 'Green Leaf',
      calories: 380,
      price: 11.00,
      matchScore: 85,
      reason: 'Plant-based protein, vitamin-rich ingredients',
      tags: ['Vegan', 'Antioxidants', 'Fiber Rich'],
    },
  ];

  const toggleFilter = (id: string) => {
    setSelectedFilters(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const items = recommendations.length > 0 ? recommendations : mockRecommendations;

  return (
    <MobileLayout>
      <div className="px-4 pt-4 pb-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-2xl">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Menu</h1>
            <p className="text-sm text-gray-500">Personalized recommendations</p>
          </div>
        </div>

        {/* Profile Summary */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Your Diet Profile</h3>
            <button className="text-primary text-sm font-medium flex items-center gap-1">
              Edit <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">
              🎯 {dietaryProfile?.calorieTarget || 2000} kcal/day
            </span>
            <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">
              🥗 {dietaryProfile?.dietType || 'Balanced'}
            </span>
            {dietaryProfile?.allergies?.length > 0 && (
              <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">
                ⚠️ {dietaryProfile.allergies.length} allergies
              </span>
            )}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {dietFilters.map((filter) => {
            const Icon = filter.icon;
            const isSelected = selectedFilters.includes(filter.id);
            return (
              <button
                key={filter.id}
                onClick={() => toggleFilter(filter.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all border",
                  isSelected
                    ? "bg-primary text-white border-primary"
                    : `${filter.color} border-transparent`
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{filter.name}</span>
              </button>
            );
          })}
        </div>

        {/* Recommendations */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Recommended for You</h2>

          {items.map((item: RecommendedItem) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.restaurant}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600">
                      <span className="text-lg font-bold">{item.matchScore}%</span>
                      <span className="text-xs">match</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{item.calories} kcal</span>
                    <span>€{item.price.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-1">
                    {item.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>

              {expandedItem === item.id && (
                <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                  <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 rounded-xl">
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700">{item.reason}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button className="w-full mt-4 bg-primary text-white py-3 rounded-xl font-semibold">
                    Order Now
                  </button>
                </div>
              )}
            </div>
          ))}
        </section>
      </div>
    </MobileLayout>
  );
}
