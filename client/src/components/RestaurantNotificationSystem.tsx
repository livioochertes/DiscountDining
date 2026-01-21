import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, ShoppingBag, Calendar, X, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
  onNavigateToReservation?: (reservationId: number) => void;
  onNavigateToOrder?: (orderId: number) => void;
}

export default function RestaurantNotificationSystem({ 
  onNavigateToReservation, 
  onNavigateToOrder 
}: RestaurantNotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastCheckRef = useRef(new Date());

  // Create notification sound
  useEffect(() => {
    // Create a simple notification beep using Web Audio API
    const createNotificationSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    };

    audioRef.current = { play: createNotificationSound } as any;
  }, []);

  // Fetch new reservations
  const { data: reservations = [] } = useQuery<any[]>({
    queryKey: ["/api/restaurant-portal/reservations"],
    refetchInterval: 10000, // Check every 10 seconds
  });

  // Fetch new orders
  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/restaurant-portal/orders"],
    refetchInterval: 10000, // Check every 10 seconds
    enabled: true // Now enabled with backend API
  });

  // Check for new notifications
  useEffect(() => {
    const checkForNewItems = () => {
      const currentTime = new Date();
      const newNotifications: Notification[] = [];

      // Check for new reservations
      reservations.forEach((reservation: any) => {
        const reservationDate = new Date(reservation.createdAt || reservation.reservationDate);
        const existingNotification = notifications.find(n => n.id === `reservation-${reservation.id}`);
        
        // Show notification if it's new (within last 2 minutes) or if it's the first time we're seeing it
        const twoMinutesAgo = new Date(currentTime.getTime() - 2 * 60 * 1000);
        if (!existingNotification && (reservationDate > lastCheckRef.current || reservationDate > twoMinutesAgo)) {
          console.log('New reservation notification:', reservation.id, reservationDate);
          newNotifications.push({
            id: `reservation-${reservation.id}`,
            type: 'reservation',
            title: 'New Reservation',
            message: `${reservation.customerName} made a reservation for ${reservation.partySize} people on ${new Date(reservation.reservationDate).toLocaleDateString()}`,
            timestamp: reservationDate,
            data: reservation,
            isRead: false
          });
        }
      });

      // Check for new orders
      orders.forEach((order: any) => {
        const orderDate = new Date(order.orderDate || order.createdAt);
        const existingNotification = notifications.find(n => n.id === `order-${order.id}`);
        
        // Show notification if it's new (within last 2 minutes) or if it's the first time we're seeing it
        const twoMinutesAgo = new Date(currentTime.getTime() - 2 * 60 * 1000);
        if (!existingNotification && (orderDate > lastCheckRef.current || orderDate > twoMinutesAgo)) {
          console.log('New order notification:', order.id, orderDate);
          newNotifications.push({
            id: `order-${order.id}`,
            type: 'order',
            title: 'New Order',
            message: `New order #${order.orderNumber} for €${order.totalAmount}`,
            timestamp: orderDate,
            data: order,
            isRead: false
          });
        }
      });

      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev]);
        
        // Show popup for the most recent notification
        const latestNotification = newNotifications[0];
        setCurrentNotification(latestNotification);
        setShowPopup(true);
        
        // Play notification sound
        if (audioRef.current) {
          try {
            audioRef.current.play();
          } catch (error) {
            console.log('Could not play notification sound:', error);
          }
        }

        // Auto-hide popup after 10 seconds
        setTimeout(() => {
          setShowPopup(false);
        }, 10000);
      }

      lastCheckRef.current = currentTime;
    };

    // Only check if we have data
    if (reservations.length > 0 || orders.length > 0) {
      checkForNewItems();
    }
  }, [reservations, orders, notifications]);

  const handleViewNotification = (notification: Notification) => {
    setShowPopup(false);
    
    if (notification.type === 'reservation' && onNavigateToReservation) {
      onNavigateToReservation(notification.data.id);
    } else if (notification.type === 'order' && onNavigateToOrder) {
      onNavigateToOrder(notification.data.id);
    }

    // Mark as read
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

  // Notification popup
  if (showPopup && currentNotification) {
    return (
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
    );
  }

  // Notification bell indicator (for header)
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  return (
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
  );
}