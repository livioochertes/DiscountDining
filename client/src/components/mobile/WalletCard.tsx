import { Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, Gift, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalletCardProps {
  balance: number;
  cashback: number;
  activeVouchers: number;
  creditAvailable?: number;
  onBuyVoucher?: () => void;
  onUseVoucher?: () => void;
  className?: string;
  isGuest?: boolean;
}

export function WalletCard({
  balance,
  cashback,
  activeVouchers,
  creditAvailable = 0,
  onBuyVoucher,
  onUseVoucher,
  className,
  isGuest = false
}: WalletCardProps) {
  return (
    <div className={cn(
      "bg-gradient-to-br from-primary to-primary/80 rounded-3xl text-white shadow-lg",
      isGuest ? "p-4" : "p-6",
      className
    )}>
      {/* Balance Section - only show for logged in users */}
      {!isGuest && (
        <div className="mb-6">
          <p className="text-white/70 text-sm font-medium mb-1">Available Balance</p>
          <p className="text-4xl font-bold tracking-tight">€{balance.toFixed(2)}</p>
        </div>
      )}

      {/* Stats Row - only show for logged in users */}
      {!isGuest && (
        <div className="flex items-center gap-6 mb-6">
          <div>
            <p className="text-white/60 text-xs">Cashback</p>
            <p className="text-lg font-semibold">€{cashback.toFixed(2)}</p>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div>
            <p className="text-white/60 text-xs">Active Vouchers</p>
            <p className="text-lg font-semibold">{activeVouchers}</p>
          </div>
          {creditAvailable > 0 && (
            <>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <p className="text-white/60 text-xs">Credit</p>
                <p className="text-lg font-semibold">€{creditAvailable.toFixed(2)}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBuyVoucher}
          className="flex-1 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 rounded-2xl py-3 px-4 font-medium transition-colors"
        >
          <ArrowDownLeft className="w-4 h-4" />
          Buy Voucher
        </button>
        <button
          onClick={onUseVoucher}
          className="flex-1 flex items-center justify-center gap-2 bg-white text-primary rounded-2xl py-3 px-4 font-semibold transition-colors hover:bg-white/90"
        >
          <ArrowUpRight className="w-4 h-4" />
          Use Voucher
        </button>
      </div>
    </div>
  );
}

interface ActionRowProps {
  onBuyVoucher?: () => void;
  onAIMenu?: () => void;
  onCashback?: () => void;
  onCredit?: () => void;
}

export function ActionRow({ onBuyVoucher, onAIMenu, onCashback, onCredit }: ActionRowProps) {
  const actions = [
    { icon: Gift, label: 'Buy Voucher', onClick: onBuyVoucher, color: 'bg-orange-50 text-orange-600' },
    { icon: Brain, label: 'AI Menu', onClick: onAIMenu, color: 'bg-purple-50 text-purple-600' },
    { icon: Wallet, label: 'Cashback', onClick: onCashback, color: 'bg-green-50 text-green-600' },
    { icon: CreditCard, label: 'Credit', onClick: onCredit, color: 'bg-blue-50 text-blue-600' },
  ];

  return (
    <div className="flex items-center justify-between gap-2 py-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={action.onClick}
            className="flex flex-col items-center gap-2 flex-1"
          >
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center",
              action.color
            )}>
              <Icon className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-600">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}

