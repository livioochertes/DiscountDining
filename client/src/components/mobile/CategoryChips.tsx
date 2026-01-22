import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface CategoryChipsProps {
  categories?: Category[];
  selected?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

const defaultCategories: Category[] = [
  { id: 'all', name: 'All', icon: '🍽️' },
  { id: 'pizza', name: 'Pizza', icon: '🍕' },
  { id: 'burger', name: 'Burger', icon: '🍔' },
  { id: 'healthy', name: 'Healthy', icon: '🥗' },
  { id: 'coffee', name: 'Coffee', icon: '☕' },
  { id: 'asian', name: 'Asian', icon: '🍜' },
  { id: 'deals', name: 'Deals', icon: '🏷️' },
];

export function CategoryChips({
  categories = defaultCategories,
  selected = 'all',
  onSelect,
  className
}: CategoryChipsProps) {
  return (
    <div className={cn("overflow-x-auto scrollbar-hide", className)}>
      <div className="flex gap-2 pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect?.(category.id)}
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
