import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface SmallDealCardProps {
  title: string;
  discount: string;
  icon?: string;
  onClick?: () => void;
}

export function SmallDealCard({ title, discount, icon = '🎉', onClick }: SmallDealCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-4 w-40 text-left relative overflow-hidden"
    >
      <div className="relative z-10">
        <span className="text-2xl mb-2 block">{icon}</span>
        <p className="text-white font-bold text-lg">{discount}</p>
        <p className="text-white/80 text-sm">{title}</p>
      </div>
      <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/10 rounded-full" />
      <div className="absolute -right-3 -bottom-8 w-16 h-16 bg-white/5 rounded-full" />
    </button>
  );
}
