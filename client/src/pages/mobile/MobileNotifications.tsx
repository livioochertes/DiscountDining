import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ArrowLeft, CheckCircle2, XCircle, ChefHat, Truck, Package, Bell, BellOff, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomerNotification {
  id: number;
  customerId: number;
  type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'reservation_confirmed':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'reservation_rejected':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'order_accepted':
      return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
    case 'order_preparing':
      return <ChefHat className="w-5 h-5 text-orange-500" />;
    case 'order_ready':
      return <Package className="w-5 h-5 text-green-500" />;
    case 'order_delivering':
      return <Truck className="w-5 h-5 text-blue-500" />;
    case 'order_delivered':
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    case 'order_cancelled':
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'acum';
  if (diffMin < 60) return `acum ${diffMin} min`;
  if (diffHours < 24) return `acum ${diffHours} ${diffHours === 1 ? 'oră' : 'ore'}`;
  if (diffDays === 1) return 'ieri';
  if (diffDays < 7) return `acum ${diffDays} zile`;
  if (diffDays < 30) return `acum ${Math.floor(diffDays / 7)} săpt.`;
  return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
}

export default function MobileNotifications() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();

  const { data: notifications = [], isLoading } = useQuery<CustomerNotification[]>({
    queryKey: ['/api/notifications'],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest('PATCH', `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiRequest('PATCH', '/api/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const handleNotificationTap = (notif: CustomerNotification) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
    if (notif.data?.reservationId) {
      setLocation('/m/reservations');
    } else if (notif.data?.restaurantId) {
      setLocation(`/m/restaurant/${notif.data.restaurantId}`);
    }
  };

  if (!authLoading && !user) {
    setLocation('/m/signin');
    return null;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation('/m')} className="p-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">Notificări</h1>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="text-xs text-primary"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Marchează toate ca citite
            </Button>
          )}
        </div>

        <div className="p-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BellOff className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Nicio notificare</p>
              <p className="text-gray-400 text-sm mt-1">Vei primi notificări despre rezervări și comenzi aici</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleNotificationTap(notif)}
                className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-colors ${
                  notif.isRead ? 'bg-white' : 'bg-primary/5 border border-primary/10'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {getNotificationIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${notif.isRead ? 'font-normal text-gray-700' : 'font-semibold text-gray-900'}`}>
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{formatRelativeTime(notif.createdAt)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
