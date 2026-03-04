import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  CalendarCheck, Clock, Users, MapPin, Navigation,
  Loader2, X, Store, ChefHat, Trash2, ArrowLeft, UtensilsCrossed
} from 'lucide-react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, getImageUrl } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

function NavigationPicker({ address, onClose }: { address: string; onClose: () => void }) {
  const encoded = encodeURIComponent(address);

  const options = [
    {
      name: 'Google Maps',
      icon: '🗺️',
      url: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    },
    {
      name: 'Apple Maps',
      icon: '🍎',
      url: `https://maps.apple.com/?q=${encoded}`,
    },
    {
      name: 'Waze',
      icon: '🚗',
      url: `https://waze.com/ul?q=${encoded}&navigate=yes`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-t-2xl p-4 pb-8 animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <p className="text-sm font-semibold text-gray-900 mb-1">Navighează la restaurant</p>
        <p className="text-xs text-gray-500 mb-4 line-clamp-2">{address}</p>
        <div className="space-y-2">
          {options.map(opt => (
            <a
              key={opt.name}
              href={opt.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-[0.98] transition-all"
              onClick={onClose}
            >
              <span className="text-2xl">{opt.icon}</span>
              <span className="font-medium text-gray-800">{opt.name}</span>
            </a>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-3 py-2.5 text-sm text-gray-500 font-medium">
          Anulează
        </button>
      </div>
    </div>
  );
}

function SwipeableCard({
  children,
  canDelete,
  onDelete,
  isDeleting,
}: {
  children: React.ReactNode;
  canDelete: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [showDelete, setShowDelete] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!canDelete) return;
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = 0;
  }, [canDelete]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!canDelete) return;
    const diff = e.touches[0].clientX - startXRef.current;
    if (diff < 0) {
      const clamped = Math.max(diff, -100);
      currentXRef.current = clamped;
      setOffset(clamped);
    }
  }, [canDelete]);

  const handleTouchEnd = useCallback(() => {
    if (!canDelete) return;
    if (currentXRef.current < -60) {
      setOffset(-80);
      setShowDelete(true);
    } else {
      setOffset(0);
      setShowDelete(false);
    }
  }, [canDelete]);

  const handleReset = useCallback(() => {
    setOffset(0);
    setShowDelete(false);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {showDelete && (
        <div className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center bg-red-500 rounded-r-2xl z-0">
          <button
            onClick={() => { onDelete(); handleReset(); }}
            disabled={isDeleting}
            className="flex flex-col items-center gap-1 text-white"
          >
            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            <span className="text-[10px]">Șterge</span>
          </button>
        </div>
      )}
      <div
        ref={cardRef}
        className="relative z-10 transition-transform"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => { if (showDelete) handleReset(); }}
      >
        {children}
      </div>
    </div>
  );
}

export default function MobileReservations() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [navAddress, setNavAddress] = useState<string | null>(null);

  const { data: reservations = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/my-reservations'],
    enabled: !!user?.id,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('PATCH', `/api/reservations/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/my-reservations'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/reservations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/my-reservations'] });
    },
  });

  if (!authLoading && !user) {
    setLocation('/m/signin');
    return null;
  }

  const getResTime = (r: any) => {
    if (r.reservationTime) {
      const p = r.reservationTime.split(':');
      return (p[0] || '0').padStart(2, '0') + ':' + (p[1] || '00').padStart(2, '0');
    }
    if (r.reservationDate) return new Date(r.reservationDate).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
    return '00:00';
  };

  const getPartySize = (r: any) => r.partySize || r.guestCount || r.numberOfGuests || 0;

  const getLocalDateKey = (r: any) => {
    if (!r.reservationDate) return 'unknown';
    const d = new Date(r.reservationDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const isPast = (r: any) => {
    if (!r.reservationDate) return false;
    return new Date(r.reservationDate) < new Date();
  };

  const canDelete = (r: any) => isPast(r) || r.status === 'cancelled';

  const sorted = [...reservations].sort((a, b) => {
    const da = new Date(a.reservationDate || 0).getTime();
    const db2 = new Date(b.reservationDate || 0).getTime();
    return db2 - da;
  });

  const dayGroups: Record<string, any[]> = {};
  sorted.forEach(r => {
    const key = getLocalDateKey(r);
    if (!dayGroups[key]) dayGroups[key] = [];
    dayGroups[key].push(r);
  });

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => setLocation('/m')} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg text-gray-900">Rezervările mele</h1>
        </div>

        <div className="px-4 pt-4 pb-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : reservations.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-1">Nicio rezervare</p>
              <p className="text-sm text-gray-400">Rezervările tale vor apărea aici</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(dayGroups).map(([dayKey, dayReservations]) => {
                const dayDate = dayKey !== 'unknown' ? new Date(dayKey + 'T12:00:00') : null;
                const dayLabel = dayDate
                  ? dayDate.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Dată necunoscută';
                const dayIsPast = dayDate ? dayDate < new Date(new Date().toDateString()) : false;

                return (
                  <div key={dayKey}>
                    <div className={cn(
                      "rounded-xl p-3 mb-2 border",
                      dayIsPast ? "bg-gray-100 border-gray-200" : "bg-primary/10 border-primary/20"
                    )}>
                      <p className={cn("font-semibold capitalize", dayIsPast ? "text-gray-500" : "text-gray-900")}>{dayLabel}</p>
                    </div>

                    <div className="space-y-2">
                      {dayReservations.map((res: any) => {
                        const status = res.status || 'pending';
                        const statusColor = status === 'confirmed' ? 'bg-green-100 text-green-700'
                          : status === 'cancelled' ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700';
                        const statusLabel = status === 'confirmed' ? 'Confirmat'
                          : status === 'cancelled' ? 'Anulat'
                          : 'În așteptare';
                        const isCancelling = cancelMutation.isPending && cancelMutation.variables === res.id;
                        const isDeleting = deleteMutation.isPending && deleteMutation.variables === res.id;
                        const past = isPast(res);
                        const fullAddress = [res.restaurantAddress, res.restaurantLocation].filter(Boolean).join(', ');

                        return (
                          <SwipeableCard
                            key={res.id}
                            canDelete={canDelete(res)}
                            onDelete={() => deleteMutation.mutate(res.id)}
                            isDeleting={isDeleting}
                          >
                            <div className={cn(
                              "bg-white rounded-2xl p-4 border border-gray-100",
                              past && status !== 'cancelled' && "opacity-70"
                            )}>
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  {res.restaurantImage && (
                                    <img
                                      src={getImageUrl(res.restaurantImage)}
                                      alt=""
                                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                                    />
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate">
                                      {res.restaurantName || `Restaurant #${res.restaurantId}`}
                                    </p>
                                    {res.restaurantCuisine && (
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <UtensilsCrossed className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-500">{res.restaurantCuisine}</span>
                                      </div>
                                    )}
                                    {res.chefName && (
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <ChefHat className="w-3 h-3 text-orange-400" />
                                        <span className="text-xs text-orange-600">
                                          Chef {res.chefName}{res.chefTitle ? ` · ${res.chefTitle}` : ''}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <span className={cn("px-2 py-1 rounded-full text-xs font-medium flex-shrink-0", statusColor)}>
                                  {statusLabel}
                                </span>
                              </div>

                              <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                                  <span>{getResTime(res)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-gray-400" />
                                  <span>{getPartySize(res) || '?'} persoane</span>
                                </div>
                              </div>

                              {res.specialRequests && (
                                <div className="bg-amber-50 rounded-lg p-2 mb-3">
                                  <p className="text-xs text-amber-700">{res.specialRequests}</p>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                {fullAddress && (
                                  <button
                                    onClick={() => setNavAddress(fullAddress)}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-2 rounded-xl text-sm font-medium border border-blue-100 active:scale-[0.97] transition-transform"
                                  >
                                    <Navigation className="w-4 h-4" />
                                    Navighează
                                  </button>
                                )}

                                {status === 'pending' && !past && (
                                  <button
                                    onClick={() => cancelMutation.mutate(res.id)}
                                    disabled={isCancelling}
                                    className={cn(
                                      "flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-600 px-3 py-2 rounded-xl text-sm font-medium border border-red-100 active:scale-[0.97] transition-all",
                                      isCancelling && "opacity-70"
                                    )}
                                  >
                                    {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                    {isCancelling ? 'Se anulează...' : 'Anulează'}
                                  </button>
                                )}
                              </div>

                              {canDelete(res) && (
                                <p className="text-[10px] text-gray-400 text-center mt-2">← Glisează pentru a șterge</p>
                              )}
                            </div>
                          </SwipeableCard>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {navAddress && (
        <NavigationPicker address={navAddress} onClose={() => setNavAddress(null)} />
      )}
    </MobileLayout>
  );
}
