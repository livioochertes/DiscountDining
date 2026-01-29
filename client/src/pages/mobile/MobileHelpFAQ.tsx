import { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, ChevronDown, Search, ThumbsUp, ThumbsDown } from 'lucide-react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface FAQItem {
  id: number;
  title: string;
  content: string;
  category: string;
  subcategory?: string;
}

const FAQ_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'faq', label: 'General' },
  { id: 'policy', label: 'Policies' },
  { id: 'feature', label: 'Features' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
];

export default function MobileHelpFAQ() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: articles = [] } = useQuery<FAQItem[]>({
    queryKey: ['/api/help/articles'],
  });

  const feedbackMutation = useMutation({
    mutationFn: async ({ articleId, helpful }: { articleId: number; helpful: boolean }) => {
      return apiRequest('POST', `/api/help/articles/${articleId}/feedback`, { helpful });
    },
  });

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center gap-3 p-4">
            <button onClick={() => setLocation('/m/profile')} className="p-2 -ml-2">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold">{t.faq || 'FAQ'}</h1>
          </div>

          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchFaq || 'Search questions...'}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
            {FAQ_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  selectedCategory === cat.id
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-3">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {t.noFaqFound || 'No questions found'}
            </div>
          ) : (
            filteredArticles.map(article => (
              <div key={article.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-gray-900 pr-4">{article.title}</span>
                  <ChevronDown 
                    className={cn(
                      "w-5 h-5 text-gray-400 flex-shrink-0 transition-transform",
                      expandedId === article.id && "rotate-180"
                    )} 
                  />
                </button>
                
                {expandedId === article.id && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 py-4 whitespace-pre-wrap">{article.content}</p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-sm text-gray-500">{t.wasHelpful || 'Was this helpful?'}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => feedbackMutation.mutate({ articleId: article.id, helpful: true })}
                          className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                        >
                          <ThumbsUp className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => feedbackMutation.mutate({ articleId: article.id, helpful: false })}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <ThumbsDown className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
