import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

export interface MobileFilter {
  id: number;
  name: string;
  icon: string;
  filterType: string;
  filterValues: string[];
  isActive: boolean;
  sortOrder: number;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  filterType?: string;
  filterValues?: string[];
}

interface CategoryChipsProps {
  categories?: Category[];
  selected?: string;
  onSelect?: (id: string, filter?: Category) => void;
  className?: string;
  useDynamicFilters?: boolean;
}

const defaultCategories: Category[] = [
  { id: 'all', name: 'All', icon: '🍽️' },
];

export function CategoryChips({
  categories,
  selected = 'all',
  onSelect,
  className,
  useDynamicFilters = false
}: CategoryChipsProps) {
  const { data: dynamicFilters = [] } = useQuery<MobileFilter[]>({
    queryKey: ['/api/mobile-filters'],
    enabled: useDynamicFilters,
  });

  const displayCategories: Category[] = useDynamicFilters
    ? [
        { id: 'all', name: 'All', icon: '🍽️' },
        ...dynamicFilters.map(f => ({
          id: String(f.id),
          name: f.name,
          icon: f.icon,
          filterType: f.filterType,
          filterValues: f.filterValues,
        }))
      ]
    : (categories || defaultCategories);
  return (
    <div className={cn("overflow-x-auto scrollbar-hide", className)}>
      <div className="flex gap-2 pb-2">
        {displayCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect?.(category.id, category)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all",
              "text-sm font-medium border",
              selected === category.id
                ? "bg-primary text-white border-primary shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            {category.icon && <span>{category.icon}</span>}
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
