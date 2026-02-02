import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, Gift, Brain, Store, X, Crown } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import eatoffLogo from '@assets/eatoff_bun_1770069548389.png';

interface WalletCardProps {
  balance: number;
  cashback: number;
  activeVouchers: number;
  creditAvailable?: number;
  onBuyVoucher?: () => void;
  onUseVoucher?: () => void;
  className?: string;
  isGuest?: boolean;
  userName?: string;
  customerCode?: string;
  loyaltyTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Black';
}

const tierColors = {
  Bronze: 'from-amber-600 via-amber-500 to-amber-700',
  Silver: 'from-gray-400 via-gray-300 to-gray-500',
  Gold: 'from-yellow-500 via-yellow-400 to-yellow-600',
  Platinum: 'from-slate-500 via-slate-400 to-slate-600',
  Black: 'from-gray-900 via-gray-800 to-black',
};

const tierTextColors = {
  Bronze: 'text-amber-100',
  Silver: 'text-gray-700',
  Gold: 'text-yellow-900',
  Platinum: 'text-slate-100',
  Black: 'text-gray-100',
};

export function WalletCard({
  balance,
  cashback,
  activeVouchers,
  creditAvailable = 0,
  onBuyVoucher,
  onUseVoucher,
  className,
  isGuest = false,
  userName = '',
  customerCode = '',
  loyaltyTier = 'Bronze'
}: WalletCardProps) {
  const [showLoyaltyCard, setShowLoyaltyCard] = useState(false);
  
  // Generate a display code if none exists
  const displayCode = customerCode || 'CLI-000000';
  const displayName = userName || 'Member';

  return (
    <>
      <div className={cn(
        "bg-gradient-to-br from-primary to-primary/80 rounded-3xl text-white shadow-lg relative",
        isGuest ? "p-4" : "p-6",
        className
      )}>
        {/* Loyalty Card Button - top right */}
        {!isGuest && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowLoyaltyCard(true);
            }}
            className="absolute top-3 right-3 flex flex-col items-center gap-1 bg-white/30 hover:bg-white/40 rounded-2xl px-3 py-2 transition-colors shadow-lg z-20 cursor-pointer"
            title="View Loyalty Card"
            type="button"
          >
            <Crown className="w-6 h-6 text-white drop-shadow-md pointer-events-none" />
            <span className="text-[10px] font-semibold text-white drop-shadow-md pointer-events-none">Member card</span>
          </button>
        )}

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

      {/* Loyalty Card Overlay - using Portal to render at document body level */}
      {showLoyaltyCard && createPortal(
        <div 
          className="fixed inset-0 bg-black/70 z-[99999] flex items-center justify-center p-4"
          onClick={() => setShowLoyaltyCard(false)}
        >
          <div 
            className={cn(
              "relative w-full max-w-md aspect-[1.6/1] rounded-2xl p-6 shadow-2xl bg-gradient-to-br",
              tierColors[loyaltyTier]
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowLoyaltyCard(false)}
              className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors z-10"
            >
              <X className={cn("w-4 h-4", tierTextColors[loyaltyTier])} />
            </button>

            {/* Card chip decoration */}
            <div className="absolute top-6 left-6 w-12 h-9 rounded bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 shadow-inner" />

            {/* EatOff Logo */}
            <div className="absolute top-4 right-12">
              <img 
                src={eatoffLogo} 
                alt="EatOff" 
                className="h-12 w-auto object-contain"
              />
            </div>

            {/* Member tier badge */}
            <div className="absolute top-[70px] left-6 flex items-center gap-2">
              <Crown className={cn("w-5 h-5", tierTextColors[loyaltyTier])} />
              <span className={cn("text-sm font-semibold uppercase tracking-wider", tierTextColors[loyaltyTier])}>
                {loyaltyTier} Member
              </span>
            </div>

            {/* QR Code - larger */}
            <div className="absolute bottom-5 left-5 bg-white p-2.5 rounded-xl shadow-lg">
              <QRCodeSVG 
                value={displayCode} 
                size={80}
                level="M"
              />
            </div>

            {/* Customer Code - positioned further right, larger text */}
            <div className="absolute bottom-5 left-[140px] right-4">
              <p className={cn("text-xs opacity-70 mb-1", tierTextColors[loyaltyTier])}>
                Card Number
              </p>
              <p className={cn("text-lg font-mono font-bold tracking-widest", tierTextColors[loyaltyTier])}>
                {displayCode}
              </p>
              <p className={cn("text-base font-semibold mt-2 truncate", tierTextColors[loyaltyTier])}>
                {displayName}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

interface ActionRowProps {
  onBuyVoucher?: () => void;
  onAIMenu?: () => void;
  onCashback?: () => void;
  onCredit?: () => void;
  onRestaurants?: () => void;
}

export function ActionRow({ onBuyVoucher, onAIMenu, onCashback, onCredit, onRestaurants }: ActionRowProps) {
  const actions = [
    { icon: Gift, label: 'Voucher', onClick: onBuyVoucher, color: 'bg-orange-50 text-orange-600' },
    { icon: Brain, label: 'AI Menu', onClick: onAIMenu, color: 'bg-purple-50 text-purple-600' },
    { icon: Store, label: 'Restaurants', onClick: onRestaurants, color: 'bg-teal-50 text-teal-600' },
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

