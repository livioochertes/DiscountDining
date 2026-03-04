import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  CalendarCheck, Clock, Users, Phone, Mail, MapPin,
  Loader2, X, ChevronRight, Store
} from 'lucide-react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

export default function MobileReservations() {
  const { t } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  if (!authLoading && !user) {
    setLocation('/m/signin');
    return null;
  }

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
    onError: () => {},
  });

  const getResHour = (r: any) => {
    if (r.reservationTime) return parseInt(r.reservationTime.split(':')[0], 10);
    if (r.reservationDate) return new Date(r.reservationDate).getHours();
    return 12;
  };

  const padTime = (t: string) => {
    const p = t.split(':');
    return (p[0] || '0').padStart(2, '0') + ':' + (p[1] || '00').padStart(2, '0');
  };

  const getResTime = (r: any) => {
    if (r.reservationTime) return padTime(r.reservationTime);
    if (r.reservationDate) return new Date(r.reservationDate).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
    return '00:00';
  };

  const getPartySize = (r: any) => r.partySize || r.guestCount || r.numberOfGuests || 0;

  const getLocalDateKey = (r: any) => {
    if (!r.reservationDate) return 'unknown';
    const d = new Date(r.reservationDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const sorted = [...reservations].sort((a, b) => {
    const ka = getLocalDateKey(a);
    const kb = getLocalDateKey(b);
    if (ka !== kb) return ka.localeCompare(kb);
    return getResTime(a).localeCompare(getResTime(b));
  });

  const dayGroups: Record<string, any[]> = {};
  sorted.forEach(r => {
    const key = getLocalDateKey(r);
    if (!dayGroups[key]) dayGroups[key] = [];
    dayGroups[key].push(r);
  });

  const timeIntervals = [
    { key: 'early', label: 'Devreme (0-8)', min: 0, max: 8 },
    { key: 'morning', label: 'Dimineață (8-12)', min: 8, max: 12 },
    { key: 'afternoon', label: 'Prânz (12-18)', min: 12, max: 18 },
    { key: 'evening', label: 'Seară (18-23)', min: 18, max: 23 },
    { key: 'late', label: 'Târziu (23+)', min: 23, max: 24 },
  ];

  return (
    <MobileLayout>
      <div className="px-4 pt-4 pb-6 space-y-4">
        <h1 className="font-bold text-xl text-gray-900">Rezervările mele</h1>

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
              return (
                <div key={dayKey}>
                  <div className="bg-primary/10 rounded-xl p-3 mb-2 border border-primary/20">
                    <p className="font-semibold text-gray-900 capitalize">{dayLabel}</p>
                  </div>

                  {timeIntervals.map(interval => {
                    const intervalRes = dayReservations
                      .filter(r => {
                        const h = getResHour(r);
                        return h >= interval.min && h < interval.max;
                      })
                      .sort((a, b) => getResTime(a).localeCompare(getResTime(b)));

                    if (intervalRes.length === 0) return null;

                    return (
                      <div key={interval.key} className="mb-2">
                        <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-medium text-gray-500">{interval.label}</span>
                        </div>
                        <div className="space-y-2">
                          {intervalRes.map((res: any) => {
                            const status = res.status || 'pending';
                            const statusColor = status === 'confirmed' ? 'bg-green-100 text-green-700' : status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
                            const statusLabel = status === 'confirmed' ? 'Confirmat' : status === 'cancelled' ? 'Anulat' : 'În așteptare';
                            const isCancelling = cancelMutation.isPending && cancelMutation.variables === res.id;

                            return (
                              <div key={res.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <Store className="w-4 h-4 text-gray-400" />
                                      <p className="font-medium text-gray-900 text-sm">{res.restaurantName || `Restaurant #${res.restaurantId}`}</p>
                                    </div>
                                    <p className="text-sm text-gray-500">{getResTime(res)}</p>
                                  </div>
                                  <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColor)}>{statusLabel}</span>
                                </div>

                                <div className="space-y-1 mb-2">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    <span>{getPartySize(res) || '?'} persoane</span>
                                  </div>
                                  {res.specialRequests && (
                                    <div className="bg-amber-50 rounded-lg p-2 mt-1">
                                      <p className="text-xs text-amber-700">{res.specialRequests}</p>
                                    </div>
                                  )}
                                </div>

                                {status === 'pending' && (
                                  <button
                                    onClick={() => cancelMutation.mutate(res.id)}
                                    disabled={isCancelling}
                                    className={cn(
                                      "w-full bg-red-50 text-red-600 px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1 transition-all duration-150 active:scale-95 border border-red-100",
                                      isCancelling && "opacity-70 scale-95"
                                    )}
                                  >
                                    {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                    {isCancelling ? 'Se anulează...' : 'Anulează rezervarea'}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
