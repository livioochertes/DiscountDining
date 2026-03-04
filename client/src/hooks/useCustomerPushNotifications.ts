import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { getMobileSessionToken, queryClient } from '@/lib/queryClient';
import { useAuth } from './useAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || (Capacitor.isNativePlatform() ? 'https://eatoff.app' : '');

export function useCustomerPushNotifications(onNotificationReceived?: (title: string, body: string) => void) {
  const { user } = useAuth();

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !user) return;

    let cleanup = false;

    const setupPush = async () => {
      try {
        const pushModule = '@capacitor/push-notifications';
        const { PushNotifications } = await import(/* @vite-ignore */ pushModule);

        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== 'granted') {
          console.log('[CustomerPush] Permission not granted');
          return;
        }

        await PushNotifications.register();

        PushNotifications.addListener('registration', async (token: { value: string }) => {
          if (cleanup) return;
          try {
            const sessionToken = getMobileSessionToken();
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
            };
            if (sessionToken) {
              headers['Authorization'] = `Bearer ${sessionToken}`;
            }
            await fetch(`${API_BASE_URL}/api/customer/push/register`, {
              method: 'POST',
              credentials: 'include',
              headers,
              body: JSON.stringify({ token: token.value, platform: Capacitor.getPlatform() }),
            });
            console.log('[CustomerPush] Token registered');
          } catch (e) {
            console.error('[CustomerPush] Token registration failed:', e);
          }
        });

        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('[CustomerPush] Registration error:', error);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
          if (onNotificationReceived) {
            onNotificationReceived(notification.title || '', notification.body || '');
          }
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
          const data = action.notification.data || {};
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
          if (data.type?.includes('reservation')) {
            window.location.hash = '#/m/reservations';
          } else if (data.restaurantId) {
            window.location.hash = `#/m/restaurant/${data.restaurantId}`;
          }
        });
      } catch (e) {
        console.log('[CustomerPush] Not available:', e);
      }
    };

    setupPush();

    return () => {
      cleanup = true;
      if (Capacitor.isNativePlatform()) {
        const pm = '@capacitor/push-notifications';
        import(/* @vite-ignore */ pm).then(({ PushNotifications }: any) => {
          PushNotifications.removeAllListeners();
        }).catch(() => {});
      }
    };
  }, [user?.id]);
}
