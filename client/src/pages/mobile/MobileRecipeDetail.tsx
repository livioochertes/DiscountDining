import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, Heart, Bookmark, Share2, Clock, Users, ChefHat, Send, Loader2, MessageCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const isNativePlatform = Capacitor.isNativePlatform();
const API_BASE_URL = import.meta.env.VITE_API_URL || (isNativePlatform ? 'https://eatoff.app' : '');

interface RecipeDetail {
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
  ingredients: { name: string; amount: string; unit: string }[];
  instructions: { step: number; description: string }[];
  dietaryTags: string[];
  tips: string | null;
  sourceUrl: string | null;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  viewsCount: number;
  author: {
    id: number;
    name: string;
    profilePicture: string | null;
  } | null;
  restaurant: {
    id: number;
    name: string;
    cuisine: string;
  } | null;
  isLiked: boolean;
  isSaved: boolean;
  comments: {
    comment: {
      id: number;
      content: string;
      createdAt: string;
    };
    user: {
      id: number;
      name: string;
      profilePicture: string | null;
    } | null;
  }[];
}

export default function MobileRecipeDetail() {
  const [, params] = useRoute('/m/recipes/:id');
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  
  const recipeId = params?.id;
  
  const { data: recipe, isLoading } = useQuery<RecipeDetail>({
    queryKey: ['/api/recipes', recipeId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch recipe');
      return res.json();
    },
    enabled: !!recipeId
  });
  
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (recipe?.isLiked) {
        await apiRequest('DELETE', `/api/recipes/${recipeId}/like`);
      } else {
        await apiRequest('POST', `/api/recipes/${recipeId}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recipes', recipeId] });
    },
    onError: () => {
      toast({ title: 'Please sign in to like recipes', variant: 'destructive' });
    }
  });
  
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (recipe?.isSaved) {
        await apiRequest('DELETE', `/api/recipes/${recipeId}/save`);
      } else {
        await apiRequest('POST', `/api/recipes/${recipeId}/save`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recipes', recipeId] });
      toast({ title: recipe?.isSaved ? 'Removed from saved' : 'Recipe saved!' });
    },
    onError: () => {
      toast({ title: 'Please sign in to save recipes', variant: 'destructive' });
    }
  });
  
  const commentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/recipes/${recipeId}/comments`, { content: comment });
    },
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['/api/recipes', recipeId] });
      toast({ title: 'Comment added!' });
    },
    onError: () => {
      toast({ title: 'Please sign in to comment', variant: 'destructive' });
    }
  });
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe?.title,
          text: recipe?.description,
          url: window.location.href
        });
      } catch (e) {}
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!recipe) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-16 h-16 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Recipe not found</p>
          <button
            onClick={() => setLocation('/m/recipes')}
            className="mt-4 text-primary text-sm"
          >
            Go back to recipes
          </button>
        </div>
      </div>
    );
  }
  
  const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
  
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="relative">
        <div className="aspect-[4/3] bg-gray-100">
          {recipe.imageUrl ? (
            <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="w-16 h-16 text-gray-300" />
            </div>
          )}
        </div>
        
        <button
          onClick={() => setLocation('/m/recipes')}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
          >
            <Bookmark className={cn("w-5 h-5", recipe.isSaved && "fill-primary text-primary")} />
          </button>
          <button
            onClick={handleShare}
            className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        
        {recipe.difficulty && (
          <span className={cn(
            "absolute bottom-4 left-4 px-3 py-1 rounded-full text-sm font-medium text-white",
            recipe.difficulty === 'easy' && "bg-green-500",
            recipe.difficulty === 'medium' && "bg-yellow-500",
            recipe.difficulty === 'hard' && "bg-red-500"
          )}>
            {recipe.difficulty}
          </span>
        )}
      </div>
      
      <div className="px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900">{recipe.title}</h1>
        
        {recipe.restaurant && (
          <button
            onClick={() => setLocation(`/m/restaurant/${recipe.restaurant!.id}`)}
            className="mt-2 text-sm text-primary font-medium"
          >
            From {recipe.restaurant.name}
          </button>
        )}
        
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            {recipe.author?.profilePicture ? (
              <img src={recipe.author.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm text-gray-500">{recipe.author?.name?.charAt(0) || '?'}</span>
              </div>
            )}
            <span className="text-sm text-gray-600">{recipe.author?.name || 'Anonymous'}</span>
          </div>
          
          <button
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className="flex items-center gap-1 text-sm"
          >
            <Heart className={cn("w-5 h-5", recipe.isLiked ? "fill-red-500 text-red-500" : "text-gray-400")} />
            <span className={recipe.isLiked ? "text-red-500" : "text-gray-500"}>{recipe.likesCount}</span>
          </button>
        </div>
        
        <div className="flex gap-4 mt-4 py-3 border-y border-gray-100">
          {totalTime > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{totalTime} min</span>
            </div>
          )}
          {recipe.servings > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Users className="w-4 h-4 text-gray-400" />
              <span>{recipe.servings} servings</span>
            </div>
          )}
          {recipe.cuisine && (
            <span className="text-sm text-primary font-medium">{recipe.cuisine}</span>
          )}
        </div>
        
        {recipe.description && (
          <p className="mt-4 text-gray-600 text-sm leading-relaxed">{recipe.description}</p>
        )}
        
        {recipe.dietaryTags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {recipe.dietaryTags.map((tag, i) => (
              <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">{tag}</span>
            ))}
          </div>
        )}
        
        {recipe.ingredients?.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('ingredients') || 'Ingredients'}</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                  <span className="text-gray-600">
                    <span className="font-medium">{ing.amount} {ing.unit}</span> {ing.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {recipe.instructions?.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('instructions') || 'Instructions'}</h2>
            <ol className="space-y-4">
              {recipe.instructions.map((inst, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">
                    {inst.step}
                  </span>
                  <p className="text-sm text-gray-600 pt-0.5">{inst.description}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
        
        {recipe.tips && (
          <div className="mt-6 p-4 bg-amber-50 rounded-xl">
            <h3 className="font-medium text-amber-800 mb-2">{t('tips') || 'Tips'}</h3>
            <p className="text-sm text-amber-700">{recipe.tips}</p>
          </div>
        )}
        
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {t('comments') || 'Comments'} ({recipe.commentsCount})
          </h2>
          
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('addComment') || 'Add a comment...'}
              className="flex-1 px-4 py-2 bg-gray-100 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={() => commentMutation.mutate()}
              disabled={!comment.trim() || commentMutation.isPending}
              className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center disabled:opacity-50"
            >
              {commentMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          
          <div className="mt-4 space-y-4">
            {recipe.comments?.map((c) => (
              <div key={c.comment.id} className="flex gap-3">
                {c.user?.profilePicture ? (
                  <img src={c.user.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-gray-500">{c.user?.name?.charAt(0) || '?'}</span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.user?.name || 'Anonymous'}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(c.comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{c.comment.content}</p>
                </div>
              </div>
            ))}
            
            {(!recipe.comments || recipe.comments.length === 0) && (
              <p className="text-center text-gray-400 text-sm py-4">
                {t('noComments') || 'No comments yet. Be the first!'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
