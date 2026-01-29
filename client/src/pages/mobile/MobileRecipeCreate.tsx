import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { ArrowLeft, Plus, Trash2, Camera, Loader2, ChefHat, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const isNativePlatform = Capacitor.isNativePlatform();
const API_BASE_URL = import.meta.env.VITE_API_URL || (isNativePlatform ? 'https://eatoff.app' : '');

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface Instruction {
  step: number;
  description: string;
}

const CUISINES = ['Italian', 'Chinese', 'Mexican', 'Japanese', 'Indian', 'Thai', 'Mediterranean', 'American', 'French', 'Other'];
const CATEGORIES = ['Appetizer', 'Main Course', 'Dessert', 'Snack', 'Beverage', 'Soup', 'Salad', 'Breakfast'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const DIETARY_TAGS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Low-Carb', 'High-Protein', 'Nut-Free'];

export default function MobileRecipeCreate() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tips, setTips] = useState('');
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', amount: '', unit: '' }
  ]);
  const [instructions, setInstructions] = useState<Instruction[]>([
    { step: 1, description: '' }
  ]);
  
  const { data: restaurants } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['/api/restaurants'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/restaurants`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    }
  });
  
  const createMutation = useMutation({
    mutationFn: async () => {
      const filteredIngredients = ingredients.filter(i => i.name.trim());
      const filteredInstructions = instructions.filter(i => i.description.trim()).map((inst, idx) => ({
        step: idx + 1,
        description: inst.description
      }));
      
      return apiRequest('POST', '/api/recipes', {
        title,
        description,
        imageUrl: imageUrl || null,
        cuisine,
        category,
        difficulty,
        prepTimeMinutes: parseInt(prepTime) || 0,
        cookTimeMinutes: parseInt(cookTime) || 0,
        servings: parseInt(servings) || 0,
        ingredients: filteredIngredients,
        instructions: filteredInstructions,
        dietaryTags: selectedTags,
        tips: tips || null,
        restaurantId: restaurantId
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
      toast({ title: 'Recipe created successfully!' });
      setLocation(`/m/recipes/${data.id}`);
    },
    onError: (error: any) => {
      toast({ 
        title: error?.message === 'Unauthorized' ? 'Please sign in to create recipes' : 'Failed to create recipe', 
        variant: 'destructive' 
      });
    }
  });
  
  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
  };
  
  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };
  
  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };
  
  const addInstruction = () => {
    setInstructions([...instructions, { step: instructions.length + 1, description: '' }]);
  };
  
  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index).map((inst, i) => ({
        ...inst,
        step: i + 1
      })));
    }
  };
  
  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index].description = value;
    setInstructions(updated);
  };
  
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  const isValid = title.trim() && cuisine && category && ingredients.some(i => i.name.trim()) && instructions.some(i => i.description.trim());
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-10 bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => setLocation('/m/recipes')} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold flex-1">{t('shareRecipe') || 'Share Recipe'}</h1>
        <button
          onClick={() => createMutation.mutate()}
          disabled={!isValid || createMutation.isPending}
          className="bg-primary text-white px-4 py-1.5 rounded-full text-sm font-medium disabled:opacity-50"
        >
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (t('publish') || 'Publish')}
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <h2 className="font-semibold text-gray-900">{t('basicInfo') || 'Basic Info'}</h2>
          
          <div>
            <label className="text-sm text-gray-500 mb-1 block">{t('recipeTitle') || 'Recipe Title'} *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Grandma's Pasta"
              className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-500 mb-1 block">{t('description') || 'Description'}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about this recipe..."
              rows={3}
              className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-500 mb-1 block">{t('imageUrl') || 'Image URL'}</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">{t('cuisine') || 'Cuisine'} *</label>
              <select
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select...</option>
                {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-sm text-gray-500 mb-1 block">{t('category') || 'Category'} *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-sm text-gray-500 mb-1 block">{t('difficulty') || 'Difficulty'}</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-medium capitalize",
                    difficulty === d ? "bg-primary text-white" : "bg-gray-100 text-gray-700"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">{t('prepTime') || 'Prep (min)'}</label>
              <input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="15"
                className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">{t('cookTime') || 'Cook (min)'}</label>
              <input
                type="number"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                placeholder="30"
                className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">{t('servings') || 'Servings'}</label>
              <input
                type="number"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                placeholder="4"
                className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          
          {restaurants && restaurants.length > 0 && (
            <div>
              <label className="text-sm text-gray-500 mb-1 block">{t('fromRestaurant') || 'From Restaurant (optional)'}</label>
              <select
                value={restaurantId || ''}
                onChange={(e) => setRestaurantId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">None</option>
                {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <h2 className="font-semibold text-gray-900">{t('dietaryTags') || 'Dietary Tags'}</h2>
          <div className="flex flex-wrap gap-2">
            {DIETARY_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm",
                  selectedTags.includes(tag) ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{t('ingredients') || 'Ingredients'} *</h2>
            <button onClick={addIngredient} className="text-primary text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          
          <div className="space-y-3">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={ing.amount}
                    onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
                    placeholder="1"
                    className="px-3 py-2 bg-gray-50 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                    placeholder="cup"
                    className="px-3 py-2 bg-gray-50 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                    placeholder="flour"
                    className="px-3 py-2 bg-gray-50 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                {ingredients.length > 1 && (
                  <button onClick={() => removeIngredient(idx)} className="p-2 text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{t('instructions') || 'Instructions'} *</h2>
            <button onClick={addInstruction} className="text-primary text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          
          <div className="space-y-3">
            {instructions.map((inst, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-2">
                  {inst.step}
                </span>
                <textarea
                  value={inst.description}
                  onChange={(e) => updateInstruction(idx, e.target.value)}
                  placeholder="Describe this step..."
                  rows={2}
                  className="flex-1 px-3 py-2 bg-gray-50 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
                {instructions.length > 1 && (
                  <button onClick={() => removeInstruction(idx)} className="p-2 text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <h2 className="font-semibold text-gray-900">{t('tips') || 'Tips & Notes'}</h2>
          <textarea
            value={tips}
            onChange={(e) => setTips(e.target.value)}
            placeholder="Any cooking tips or notes..."
            rows={3}
            className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
