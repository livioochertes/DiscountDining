import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, ShoppingBag, Calendar, X, Eye } from "lucide-react";
import { useMarketplace } from "@/contexts/MarketplaceContext";

interface Notification {
  id: string;
  type: 'order' | 'reservation';
  title: string;
  message: string;
  timestamp: Date;
  data: any;
  isRead: boolean;
}

interface RestaurantNotificationSystemProps {
  restaurantId?: number;
  onNavigateToReservation?: (reservationId: number) => void;
  onNavigateToOrder?: (orderId: number) => void;
}

export default function RestaurantNotificationSystem({ 
  restaurantId,
  onNavigateToReservation, 
  onNavigateToOrder 
}: RestaurantNotificationSystemProps) {
  const queryClient = useQueryClient();
  const { marketplace } = useMarketplace();
  const cs = marketplace?.currencySymbol || '€';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  const playSound = useCallback(() => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }, []);

  const showNotificationPopup = useCallback((notification: Notification) => {
    setCurrentNotification(notification);
    setShowPopup(true);
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    popupTimerRef.current = setTimeout(() => setShowPopup(false), 10000);
  }, []);

  useEffect(() => {
    if (!restaurantId) return;

    const es = new EventSource(`/api/restaurant/${restaurantId}/notifications/stream`, { withCredentials: true });

    es.addEventListener('new_reservation', (e) => {
      try {
        const data = JSON.parse(e.data);
        const notif: Notification = {
          id: `reservation-${data.id}`,
          type: 'reservation',
          title: 'New Reservation',
          message: `${data.customerName || 'Customer'} — ${data.partySize || '?'} guests${data.restaurantName ? ` at ${data.restaurantName}` : ''}`,
          timestamp: new Date(),
          data,
          isRead: false
        };
        setNotifications(prev => {
          if (prev.some(n => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });
        showNotificationPopup(notif);
        playSound();
        queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/reservations"] });
      } catch {}
    });

    es.addEventListener('new_order', (e) => {
      try {
        const data = JSON.parse(e.data);
        const notif: Notification = {
          id: `order-${data.id}`,
          type: 'order',
          title: 'New Order',
          message: `#${data.orderNumber || data.id} — ${cs} ${data.totalAmount || '?'}${data.restaurantName ? ` at ${data.restaurantName}` : ''}`,
          timestamp: new Date(),
          data,
          isRead: false
        };
        setNotifications(prev => {
          if (prev.some(n => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });
        showNotificationPopup(notif);
        playSound();
        queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/orders"] });
      } catch {}
    });

    es.addEventListener('reservation_updated', () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/reservations"] });
    });

    es.addEventListener('order_updated', () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant-portal/orders"] });
    });

    es.onerror = () => {};

    return () => {
      es.close();
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, [restaurantId, playSound, showNotificationPopup, queryClient]);

  const handleViewNotification = (notification: Notification) => {
    setShowPopup(false);
    
    if (notification.type === 'reservation' && onNavigateToReservation) {
      onNavigateToReservation(notification.data.id);
    } else if (notification.type === 'order' && onNavigateToOrder) {
      onNavigateToOrder(notification.data.id);
    }

    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );
  };

  const handleDismissPopup = () => {
    setShowPopup(false);
    if (currentNotification) {
      setNotifications(prev => 
        prev.map(n => n.id === currentNotification.id ? { ...n, isRead: true } : n)
      );
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      {showPopup && currentNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-2">
          <Card className="w-80 border-2 border-orange-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-orange-100">
                    {currentNotification.type === 'reservation' ? (
                      <Calendar className="w-5 h-5 text-orange-600" />
                    ) : (
                      <ShoppingBag className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {currentNotification.title}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {currentNotification.message}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleViewNotification(currentNotification)}
                        className="text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDismissPopup}
                        className="text-xs"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismissPopup}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="relative">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    </>
  );
}
