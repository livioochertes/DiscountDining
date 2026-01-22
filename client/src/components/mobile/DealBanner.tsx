import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface DealBannerProps {
  title: string;
  subtitle: string;
  discount?: string;
  backgroundColor?: string;
  onClick?: () => void;
  className?: string;
}

export function DealBanner({
  title,
  subtitle,
  discount,
  backgroundColor = 'bg-gradient-to-r from-orange-400 to-orange-500',
  onClick,
  className
}: DealBannerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl p-5 text-left text-white relative overflow-hidden",
        backgroundColor,
        className
      )}
    >
      <div className="relative z-10">
        {discount && (
          <span className="inline-block bg-white/20 rounded-full px-3 py-1 text-sm font-bold mb-2">
            {discount}
          </span>
        )}
        <h3 className="text-lg font-bold mb-1">{title}</h3>
        <p className="text-white/80 text-sm">{subtitle}</p>
      </div>
      
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <div className="bg-white/20 rounded-full p-2">
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>

      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
      <div className="absolute -right-4 -bottom-12 w-24 h-24 bg-white/5 rounded-full" />
    </button>
  );
}

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
      className="flex-shrink-0 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-4 w-40 text-left border border-primary/10"
    >
      <span className="text-2xl mb-2 block">{icon}</span>
      <p className="text-primary font-bold text-lg">{discount}</p>
      <p className="text-gray-600 text-sm">{title}</p>
    </button>
  );
}
